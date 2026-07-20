import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, ClipboardList, BarChart3, History } from 'lucide-react';

const items = [
  { to: '/nova-triagem', label: 'Nova Triagem', icon: ClipboardList },
  { to: '/algoritmos', label: 'Algoritmos', icon: BarChart3 },
  { to: '/historico', label: 'Histórico', icon: History },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white grid place-items-center">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold text-slate-900 leading-tight">TriagemAssist</div>
            <div className="text-xs text-slate-500">Apoio clínico à triagem</div>
          </div>
        </div>
      </div>
      <nav className="p-3 flex-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-3 text-[11px] text-slate-400 border-t border-slate-100">
        Ferramenta de apoio — não substitui avaliação clínica.
      </div>
    </aside>
  );
}
