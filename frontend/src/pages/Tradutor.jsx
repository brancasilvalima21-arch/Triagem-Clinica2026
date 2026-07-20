import React, { useState } from 'react';
import { Languages, Sparkles, Loader2, Copy, Check, RotateCcw, BookOpen, Lightbulb } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { translateQuestion } from '../mock/api';
import { useToast } from '../hooks/use-toast';

const TONES = [
  { key: 'leigo', label: 'Adulto (leigo)', desc: 'Pessoa sem formação médica' },
  { key: 'crianca', label: 'Criança / Adolescente', desc: 'Frases muito simples' },
  { key: 'idoso', label: 'Pessoa Idosa', desc: 'Curto, claro, pausado' },
];

// UI constants
const COPY_FEEDBACK_MS = 1500;

const EXAMPLES = [
  'Nas últimas 72h ingeriu ou esteve exposto a alguma substância tóxica como pesticidas, raticidas, lixívia, soda cáustica OU cogumelos selvagens?',
  'Apresenta letargia, sinais meníngeos ou alteração do estado de consciência?',
  'Verifica-se hematémese, melenas ou hematoquézia?',
  'Tem antecedentes de dispneia paroxística noturna, ortopneia ou edemas dos membros inferiores?',
  'Refere fotofobia, fonofobia e escotomas cintilantes?',
];

export default function Tradutor() {
  const [question, setQuestion] = useState('');
  const [tone, setTone] = useState('leigo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const translate = async () => {
    if (!question.trim()) {
      toast({ title: 'Pergunta obrigatória', description: 'Introduza a pergunta clínica.' });
      return;
    }
    setLoading(true);
    try {
      const r = await translateQuestion({ clinical_question: question, tone });
      setResult(r);
    } catch (e) {
      toast({ title: 'Erro ao traduzir', description: e?.response?.data?.detail || 'Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setQuestion(''); setResult(null); };
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch (err) {
      // Clipboard API não disponível (ex.: browser antigo ou contexto não seguro) — falhar silenciosamente
      toast({ title: 'Não foi possível copiar', description: 'Copie manualmente o texto.' });
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ferramenta</div>
        <h1 className="text-3xl font-semibold text-slate-900 mt-1 flex items-center gap-2">
          <Languages className="h-7 w-7 text-blue-600" /> Tradutor Clínico
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Reformula perguntas em terminologia clínica para linguagem corrente e acessível — útil quando fala com o utente ao telefone ou presencialmente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Pergunta em termos clínicos</h2>
          </div>

          <div className="mt-5">
            <Label className="text-sm text-slate-700">Introduza a pergunta clínica</Label>
            <Textarea
              value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="ex.: Nas últimas 72h ingeriu ou esteve exposto a alguma substância tóxica como pesticidas, raticidas, lixívia, soda cáustica ou cogumelos selvagens?"
              className="mt-1.5 min-h-[130px] resize-y"
            />
          </div>

          <div className="mt-4">
            <Label className="text-sm text-slate-700 mb-2 block">Adaptar para</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button key={t.key} onClick={() => setTone(t.key)}
                  className={`text-left border rounded-lg p-3 transition-colors ${
                    tone === t.key ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-blue-300'
                  }`}>
                  <div className="text-sm font-medium text-slate-900">{t.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <Button onClick={translate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Traduzir
            </Button>
            <Button variant="outline" onClick={clear} className="text-slate-700">
              <RotateCcw className="h-4 w-4 mr-2" /> Limpar
            </Button>
          </div>

          <div className="mt-8">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" /> Exemplos
            </div>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setQuestion(ex)}
                  className="text-left text-sm text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-md px-3 py-2 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 h-fit">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Languages className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Em linguagem corrente</h2>
          </div>

          {!result && (
            <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
              <div className="h-14 w-14 rounded-full bg-slate-100 grid place-items-center mb-4">
                <Languages className="h-6 w-6 text-slate-400" />
              </div>
              <p className="max-w-[260px]">A pergunta reformulada aparece aqui.</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pergunta reformulada</div>
                  <button onClick={() => copyText(result.plain)}
                    className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1">
                    {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                  </button>
                </div>
                <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4 text-slate-900 leading-relaxed">
                  {result.plain}
                </div>
              </div>

              {result.alternatives?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Formulações alternativas</div>
                  <div className="space-y-2">
                    {result.alternatives.map((a, i) => (
                      <div key={`alt-${i}-${a.slice(0, 20)}`} className="text-sm text-slate-700 border border-slate-200 rounded-md p-3 flex items-start gap-2">
                        <span className="text-slate-400 shrink-0">{i + 1}.</span>
                        <span className="flex-1">{a}</span>
                        <button onClick={() => copyText(a)} className="text-slate-400 hover:text-blue-600"><Copy className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.explained_terms?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Termos explicados</div>
                  <div className="space-y-1.5">
                    {result.explained_terms.map((t) => (
                      <div key={t.term} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                        <span className="font-medium text-slate-900">{t.term}</span>
                        <span className="text-slate-600"> — {t.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
