import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Input } from '../components/ui/input';
import { ALGORITHMS, ALGORITHM_CATEGORIES } from '../mock/algorithms';
import ExportButton from '../components/ExportButton';
import { exportAllJSON, exportAllPDF } from '../utils/exportAlgorithms';

export default function Algoritmos() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return ALGORITHMS.filter((a) => {
      if (cat !== 'all' && a.category !== cat) return false;
      if (!s) return true;
      return a.name.toLowerCase().includes(s) || a.keywords.some((k) => k.toLowerCase().includes(s));
    });
  }, [q, cat]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Biblioteca</div>
          <h1 className="text-3xl font-semibold text-slate-900 mt-1">Algoritmos de Triagem</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">{ALGORITHMS.length} algoritmos disponíveis. Selecione para percorrer o fluxo estruturado.</p>
        </div>
        <ExportButton onJSON={exportAllJSON} onPDF={exportAllPDF} label="Exportar todos" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por nome ou palavra-chave..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {ALGORITHM_CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                cat === c.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((a) => {
          const Icon = Icons[a.icon] || Icons.Stethoscope;
          return (
            <Link key={a.id} to={`/algoritmos/${a.id}`}
              className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-xl p-4 transition-all group">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 text-sm truncate">{a.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.category}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 mt-1" />
              </div>
            </Link>
          );
        })}
        {list.length === 0 && <div className="col-span-full text-center text-slate-500 py-8">Sem resultados.</div>}
      </div>
    </div>
  );
}
