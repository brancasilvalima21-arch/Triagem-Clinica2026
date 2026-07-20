import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '../components/ui/button';
import { ALGORITHMS, TRIAGE_LEVELS } from '../mock/algorithms';
import ExportButton from '../components/ExportButton';
import { exportOneJSON, exportOnePDF } from '../utils/exportAlgorithms';

const toneStyles = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
};

export default function AlgoritmoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const algo = useMemo(() => ALGORITHMS.find((a) => a.id === id), [id]);
  const [path, setPath] = useState([]);
  const [currentId, setCurrentId] = useState('start');

  if (!algo) {
    return (
      <div className="p-8">
        <p>Algoritmo não encontrado.</p>
        <Link to="/algoritmos" className="text-blue-600">Voltar</Link>
      </div>
    );
  }

  const currentNode = algo.flow[currentId];
  const isOutcome = currentNode && currentNode.outcome;
  const Icon = Icons[algo.icon] || Icons.Stethoscope;

  const choose = (option) => {
    setPath((p) => [...p, { question: currentNode.question, answer: option.label }]);
    setCurrentId(option.next);
  };

  const restart = () => { setPath([]); setCurrentId('start'); };

  const outcomeTone = isOutcome ? toneStyles[currentNode.outcome.tone] : null;

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <button onClick={() => navigate('/algoritmos')} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ChevronLeft className="h-4 w-4" /> Voltar aos algoritmos
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-blue-600 text-white grid place-items-center shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{algo.category}</div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">{algo.name}</h1>
        </div>
        <Button variant="outline" onClick={restart}><RotateCcw className="h-4 w-4 mr-2" /> Reiniciar</Button>
        <ExportButton onJSON={() => exportOneJSON(algo)} onPDF={() => exportOnePDF(algo)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          {/* Racional */}
          <details className="bg-white border border-slate-200 rounded-xl group" open>
            <summary className="cursor-pointer p-5 font-medium text-slate-900 list-none flex items-center justify-between">
              <span>Racional clínico</span>
              <span className="text-xs text-slate-400 group-open:hidden">Expandir</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
              {algo.rationale}
            </div>
          </details>

          {/* Palavras-chave */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Palavras-chave</div>
            <div className="flex flex-wrap gap-1.5">
              {algo.keywords.map((k) => (
                <span key={k} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">{k}</span>
              ))}
            </div>
          </div>

          {/* Interativo */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Fluxo de triagem</div>

            {!isOutcome && currentNode && (
              <div>
                <div className="flex items-start gap-3 mb-5">
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-sm font-semibold">?</div>
                  <p className="text-base text-slate-900 leading-relaxed">{currentNode.question}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentNode.options.map((o) => (
                    <button key={o.label} onClick={() => choose(o)}
                      className="border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-lg p-4 text-left transition-colors">
                      <div className="font-medium text-slate-900">{o.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isOutcome && (
              <div className={`rounded-xl border p-5 ${outcomeTone.bg} ${outcomeTone.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${outcomeTone.dot}`} />
                  <div className={`text-sm font-semibold ${outcomeTone.text}`}>
                    {currentNode.outcome.label} · {currentNode.outcome.time}
                  </div>
                </div>
                <div className={`mt-2 text-sm ${outcomeTone.text}`}>{currentNode.outcome.desc}</div>
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Recomendação</div>
                  <p className="text-sm text-slate-800">{currentNode.outcome.recommendation}</p>
                </div>
                <Button variant="outline" onClick={restart} className="mt-4"><RotateCcw className="h-4 w-4 mr-2" /> Nova avaliação</Button>
              </div>
            )}
          </div>
        </div>

        {/* Trilho */}
        <aside className="bg-white border border-slate-200 rounded-xl p-5 h-fit">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Percurso</div>
          {path.length === 0 && <p className="text-sm text-slate-500">Ainda não respondeu.</p>}
          <ol className="space-y-3">
            {path.map((step, i) => (
              <li key={`${i}-${step.question}`} className="text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-700 leading-snug">{step.question}</div>
                    <div className="text-slate-900 font-medium mt-0.5">{step.answer}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Níveis de prioridade</div>
            <div className="space-y-1.5">
              {Object.values(TRIAGE_LEVELS).map((l) => (
                <div key={l.key} className="flex items-center gap-2 text-xs">
                  <span className={`inline-block h-2 w-2 rounded-full ${toneStyles[l.tone].dot}`} />
                  <span className="text-slate-700">{l.label}</span>
                  <span className="text-slate-400 ml-auto">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs text-slate-500 bg-slate-100 rounded-lg p-3">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Este algoritmo constitui apoio à decisão clínica. Não substitui a avaliação médica presencial. Em caso de dúvida, priorizar a maior urgência.</span>
      </div>
    </div>
  );
}
