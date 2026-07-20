from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone

from algorithms_index import ALGORITHM_INDEX, BY_ID

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')


# ---------- Models ----------
class AnalyzeRequest(BaseModel):
    description: str
    age: Optional[str] = ""
    sex: Optional[str] = ""


class TranslateRequest(BaseModel):
    clinical_question: str
    tone: Optional[str] = "leigo"  # "leigo" | "crianca" | "idoso"


class TranslateResponse(BaseModel):
    plain: str
    alternatives: List[str] = []
    explained_terms: List[Dict[str, str]] = []


class AlgorithmSuggestion(BaseModel):
    id: str
    name: str
    category: str
    matched: List[str] = []


class AnalyzeResponse(BaseModel):
    clinicalTerms: List[str]
    summary: str
    suggested: List[AlgorithmSuggestion]
    primary: AlgorithmSuggestion
    urgencyHint: Optional[str] = None
    source: str = "llm"


class TriagemInput(BaseModel):
    age: Optional[str] = ""
    sex: Optional[str] = ""
    description: str


class TriagemCreate(BaseModel):
    input: TriagemInput
    result: Dict[str, Any]


class Triagem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input: TriagemInput
    result: Dict[str, Any]
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------- Helpers ----------
def keyword_fallback(description: str) -> Dict[str, Any]:
    text = description.lower()
    scored = []
    for a in ALGORITHM_INDEX:
        score = 0
        matched = []
        for kw in a["kw"].split(","):
            kw = kw.strip().lower()
            if kw and kw in text:
                score += 2
                matched.append(kw)
        for w in a["name"].lower().split():
            if len(w) > 3 and w in text:
                score += 1
        if score > 0:
            scored.append({"algo": a, "score": score, "matched": matched})
    scored.sort(key=lambda s: s["score"], reverse=True)
    if not scored:
        insp = BY_ID["inespecifico"]
        return {
            "clinicalTerms": [],
            "summary": "Não foi possível identificar sintomas específicos. Sugere-se o algoritmo de Problemas Inespecíficos.",
            "suggested": [{"id": insp["id"], "name": insp["name"], "category": insp["category"], "matched": []}],
            "primary": {"id": insp["id"], "name": insp["name"], "category": insp["category"], "matched": []},
            "source": "fallback",
        }
    top = scored[:3]
    suggested = [{"id": s["algo"]["id"], "name": s["algo"]["name"], "category": s["algo"]["category"], "matched": s["matched"]} for s in top]
    return {
        "clinicalTerms": list({m for s in top for m in s["matched"]})[:8],
        "summary": f"Sintomas compatíveis com {top[0]['algo']['name']}. Sugere-se percorrer o algoritmo correspondente.",
        "suggested": suggested,
        "primary": suggested[0],
        "source": "fallback",
    }


async def llm_analyze(description: str, age: str, sex: str) -> Dict[str, Any]:
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    algos_list = "\n".join([f"- {a['id']} | {a['name']} ({a['category']}) — palavras-chave: {a['kw']}" for a in ALGORITHM_INDEX])

    system = f"""És um assistente clínico de triagem em português europeu (PT-PT). Recebes a descrição de sintomas de um utente em linguagem corrente e deves:
1) Extrair até 8 termos clínicos técnicos correspondentes (ex.: "dor de cabeça"->"cefaleia", "aperto no peito"->"precordialgia").
2) Escolher o algoritmo de triagem MAIS ADEQUADO da lista abaixo (obrigatório escolher UM da lista).
3) Sugerir até 2 alternativas relevantes da mesma lista.
4) Redigir um resumo clínico curto (1-2 frases) em PT-PT.
5) Indicar uma pista de urgência qualitativa: "emergente" | "muito_urgente" | "urgente" | "pouco_urgente" | "nao_urgente".

Lista de algoritmos disponíveis (usa APENAS estes ids):
{algos_list}

Responde ESTRITAMENTE em JSON válido no formato:
{{
  "clinical_terms": ["..."],
  "algorithm_id": "id-do-algoritmo",
  "alternatives": ["id1", "id2"],
  "summary": "Resumo clínico em PT-PT.",
  "urgency_hint": "urgente"
}}
Não inclues texto fora do JSON."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"triagem-{uuid.uuid4()}",
        system_message=system,
    ).with_model("openai", "gpt-4.1-mini")

    user_text = f"Idade: {age or 'não informada'}\nSexo: {sex or 'não informado'}\nDescrição: {description}"
    msg = UserMessage(text=user_text)
    resp_text = await chat.send_message(msg)

    # Parse JSON (LLM may wrap in markdown)
    raw = resp_text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    data = json.loads(raw)

    algo_id = data.get("algorithm_id")
    if algo_id not in BY_ID:
        raise ValueError(f"LLM returned invalid algorithm_id: {algo_id}")

    primary = BY_ID[algo_id]
    suggested = [{"id": primary["id"], "name": primary["name"], "category": primary["category"], "matched": []}]
    for alt in data.get("alternatives", [])[:2]:
        if alt in BY_ID and alt != algo_id:
            a = BY_ID[alt]
            suggested.append({"id": a["id"], "name": a["name"], "category": a["category"], "matched": []})

    return {
        "clinicalTerms": data.get("clinical_terms", [])[:8],
        "summary": data.get("summary", ""),
        "suggested": suggested,
        "primary": suggested[0],
        "urgencyHint": data.get("urgency_hint"),
        "source": "llm",
    }


async def llm_translate(clinical_question: str, tone: str = "leigo") -> Dict[str, Any]:
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    tone_desc = {
        "leigo": "para uma pessoa adulta sem formação médica",
        "crianca": "para uma criança ou adolescente (10-15 anos), com frases muito simples",
        "idoso": "para uma pessoa idosa, com frases curtas, claras e pausadas",
    }.get(tone, "para uma pessoa adulta sem formação médica")

    system = f"""És um assistente que traduz perguntas clínicas técnicas em português europeu (PT-PT) para linguagem corrente e acessível, {tone_desc}.

Regras:
1) Preserva TODO o significado clínico da pergunta original — não simplifiques ao ponto de perder informação (ex.: se pergunta por sintomas específicos, deves manter todos).
2) Substitui termos técnicos por descrições que qualquer pessoa entenda (ex.: "letargia" → "muito sonolento, sem energia e difícil de acordar"; "dispneia" → "falta de ar"; "hematémese" → "vomitou sangue").
3) Se a pergunta lista várias substâncias/sintomas com "OU", mantém todos os exemplos.
4) Podes dividir uma pergunta longa em 2 frases curtas se ficar mais claro.
5) Devolve também os termos técnicos que traduziste, com a sua explicação simples.
6) Oferece 1-2 formulações alternativas equivalentes.

Responde ESTRITAMENTE em JSON válido:
{{
  "plain": "pergunta reformulada em linguagem corrente",
  "alternatives": ["outra forma de perguntar 1", "outra forma de perguntar 2"],
  "explained_terms": [
    {{"term": "letargia", "explanation": "estado de muita sonolência e falta de reação"}}
  ]
}}
Não inclues texto fora do JSON."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"translate-{uuid.uuid4()}",
        system_message=system,
    ).with_model("openai", "gpt-4.1-mini")

    resp_text = await chat.send_message(UserMessage(text=clinical_question))
    raw = resp_text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    data = json.loads(raw)
    return {
        "plain": data.get("plain", ""),
        "alternatives": data.get("alternatives", [])[:3],
        "explained_terms": data.get("explained_terms", [])[:8],
    }


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "TriagemAssist API", "algorithms": len(ALGORITHM_INDEX)}


@api_router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if not req.description or not req.description.strip():
        raise HTTPException(status_code=400, detail="Descrição obrigatória.")
    try:
        result = await llm_analyze(req.description, req.age or "", req.sex or "")
        return AnalyzeResponse(**result)
    except Exception as e:
        logger.exception("LLM analyze failed, falling back to keyword matching: %s", e)
        result = keyword_fallback(req.description)
        return AnalyzeResponse(**result)


@api_router.post("/translate", response_model=TranslateResponse)
async def translate_question(req: TranslateRequest):
    if not req.clinical_question or not req.clinical_question.strip():
        raise HTTPException(status_code=400, detail="Pergunta obrigatória.")
    try:
        result = await llm_translate(req.clinical_question, req.tone or "leigo")
        return TranslateResponse(**result)
    except Exception as e:
        logger.exception("Translate failed: %s", e)
        raise HTTPException(status_code=502, detail="Não foi possível traduzir. Tente novamente.")


@api_router.post("/history", response_model=Triagem)
async def create_history(payload: TriagemCreate):
    entry = Triagem(input=payload.input, result=payload.result)
    doc = entry.model_dump()
    await db.triagens.insert_one(doc)
    return entry


@api_router.get("/history", response_model=List[Triagem])
async def list_history():
    docs = await db.triagens.find({}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    return [Triagem(**d) for d in docs]


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    res = await db.triagens.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Não encontrado.")
    return {"deleted": True}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
