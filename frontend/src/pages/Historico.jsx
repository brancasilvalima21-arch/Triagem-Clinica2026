import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Trash2, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import { getHistorico, deleteTriagem } from '../mock/api';
import { Button } from '../components/ui/button';

export default function Historico() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await getHistorico()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => { await deleteTriagem(id); load(); };
  const fmt = (d) => new Date(d).toLocaleString('pt-PT');

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registo</div>
        <h1 className="text-3xl font-semibold text-slate-900 mt-1 flex items-center gap-2"><History className="h-7 w-7 text-blue-600" /> Histórico de Triagens</h1>
        <p className="text-slate-600 mt-2">{loading ? 'A carregar...' : `${items.length} triagem(ns) registada(s).`}</p>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">A carregar histórico...</p>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Ainda não realizou nenhuma triagem.</p>
          <Link to="/nova-triagem"><Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Criar nova triagem</Button></Link>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{fmt(it.createdAt)}</span>
                {it.input.age && <span>· {it.input.age}</span>}
                {it.input.sex && <span>· {it.input.sex}</span>}
              </div>
              <div className="text-sm text-slate-800 line-clamp-2">{it.input.description}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {it.result?.suggested?.slice(0, 3).map((s) => (
                  <Link key={s.id} to={`/algoritmos/${s.id}`}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded-full">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {it.result?.primary && (
                <Link to={`/algoritmos/${it.result.primary.id}`}>
                  <Button variant="outline" size="sm">Abrir <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => del(it.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
