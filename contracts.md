# Contratos API — TriagemAssist

## Objetivo
Migrar frontend mock → backend real com:
1. Análise de sintomas via LLM (Emergent Key, gpt-4.1-mini)
2. Persistência de histórico em MongoDB

## Endpoints Backend

### POST /api/analyze
Analisa sintomas via LLM e sugere algoritmo.
- **Request:** `{ description: string, age?: string, sex?: string }`
- **Response:** `{ clinicalTerms: string[], summary: string, suggested: [{id, name, category}], primary: {id, name, category}, urgencyHint?: string }`
- **LLM prompt:** system message em PT-PT com lista dos 50 algoritmos disponíveis (id + nome + palavras-chave). Modelo retorna JSON estrito.

### POST /api/history
Guarda uma triagem.
- **Request:** `{ input: {age, sex, description}, result: {...} }`
- **Response:** `{ id, createdAt, ... }`

### GET /api/history
Lista triagens (mais recentes primeiro, limite 100).

### DELETE /api/history/{id}
Remove uma triagem.

## Modelos MongoDB
Coleção `triagens`:
```
{ _id (uuid), input: {age, sex, description}, result: {...}, createdAt: iso }
```

## Frontend → Backend
- `mock/mock.js` → substitui `analyzeSymptomsMock` por chamada axios ao `/api/analyze`
- `saveTriagemMock/getHistoricoMock/deleteTriagemMock` → chamadas axios ao `/api/history`
- Todos os 50 algoritmos permanecem no frontend (`mock/algorithms.js` mantém-se como fonte de verdade dos fluxos interativos). O backend só precisa da lista simplificada (id, name, keywords) para o prompt LLM.

## LLM
- Modelo: `openai / gpt-4.1-mini`
- Uso: `send_message` (não streaming, precisamos JSON completo)
- System prompt: instruções em PT, retorna JSON com `clinical_terms`, `algorithm_id`, `alternatives`, `summary`.
- Fallback: se LLM falhar, usar matching por keywords (equivalente ao mock).
