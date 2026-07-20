import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Botão de export com dropdown JSON/PDF.
 * Props: onJSON, onPDF, label
 */
export default function ExportButton({ onJSON, onPDF, label = 'Exportar', variant = 'outline' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handle = (fn) => { setOpen(false); try { fn(); } catch (e) { /* já tratado a montante */ } };

  return (
    <div ref={ref} className="relative inline-block">
      <Button variant={variant} onClick={() => setOpen((v) => !v)}>
        <Download className="h-4 w-4 mr-2" /> {label}
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => handle(onJSON)}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
          >
            <FileJson className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-900">JSON</div>
              <div className="text-xs text-slate-500">Dados estruturados</div>
            </div>
          </button>
          <div className="h-px bg-slate-100" />
          <button
            onClick={() => handle(onPDF)}
            className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
          >
            <FileText className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-900">PDF</div>
              <div className="text-xs text-slate-500">Documento formatado</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
