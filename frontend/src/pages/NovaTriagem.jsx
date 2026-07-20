import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RotateCcw, Stethoscope, FileText, ClipboardCheck, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { analyzeSymptomsMock, saveTriagemMock } from '../mock/mock';
import { QUICK_EXAMPLES } from '../mock/algorithms';
import { useToast } from '../hooks/use-toast';

export default function NovaTriagem() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const analyze = async () => {
    if (!desc.trim()) {
      toast({ title: 'Descrição obrigatória', description: 'Introduza a descrição dos sintomas.' });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const r = analyzeSymptomsMock({ description: desc, age, sex });
    setResult(r);
    if (r) saveTriagemMock({ input: { age, sex, description: desc }, result: r });
    setLoading(false);
  };

  const clear = () => { setAge(''); setSex(''); setDesc(''); setResult(null); };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assistente de Triagem</div>
        <h1 className="text-3xl font-semibold text-slate-900 mt-1">Nova Triagem</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Escreva os sintomas descritos pelo utente em linguagem corrente. A IA traduz para termos clínicos e sugere o algoritmo de triagem mais adequado a percorrer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Sintomas do utente</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <Label className="text-sm text-slate-700">Idade (opcional)</Label>
              <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex.: 54 anos" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm text-slate-700">Sexo (opcional)</Label>
              <Input value={sex} onChange={(e) => setSex(e.target.value)} placeholder="ex.: Masculino" className="mt-1.5" />
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-sm text-slate-700">Descrição em linguagem corrente</Label>
            <Textarea
              value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="ex.: Doente queixa-se de dor muito forte na barriga do lado direito em baixo, com vómitos e febre..."
              className="mt-1.5 min-h-[140px] resize-y"
            />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <Button onClick={analyze} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analisar e sugerir algoritmo
            </Button>
            <Button variant="outline" onClick={clear} className="text-slate-700">
              <RotateCcw className="h-4 w-4 mr-2" /> Limpar
            </Button>
          </div>

          <div className="mt-8">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Exemplos rápidos</div>
            <div className="flex flex-col gap-2">
              {QUICK_EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => setDesc(ex)}
                  className="text-left text-sm text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-md px-3 py-2 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 h-fit">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Resultado da análise</h2>
          </div>

          {!result && (
            <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
              <div className="h-14 w-14 rounded-full bg-slate-100 grid place-items-center mb-4">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="max-w-[260px]">Os termos clínicos e o algoritmo sugerido aparecem aqui.</p>
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumo</div>
                <p className="text-sm text-slate-800 leading-relaxed">{result.summary}</p>
              </div>

              {result.clinicalTerms.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Termos clínicos identificados</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.clinicalTerms.map((t, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Algoritmos sugeridos</div>
                <div className="space-y-2">
                  {result.suggested.map((s, i) => (
                    <button key={s.id} onClick={() => navigate(`/algoritmos/${s.id}`)}
                      className="w-full text-left border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-lg p-3 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{s.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{s.category}</div>
                        </div>
                        {i === 0 && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Primário</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => navigate(`/algoritmos/${result.primary.id}`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <ClipboardCheck className="h-4 w-4 mr-2" /> Percorrer algoritmo
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
