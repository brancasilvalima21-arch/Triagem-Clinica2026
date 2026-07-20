// Utilitários de exportação — JSON e PDF
import jsPDF from 'jspdf';
import { ALGORITHMS, TRIAGE_LEVELS } from '../mock/algorithms';

// ------- JSON -------
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAllJSON() {
  const payload = {
    exportedAt: new Date().toISOString(),
    triageLevels: TRIAGE_LEVELS,
    algorithms: ALGORITHMS,
  };
  download('triagem-algoritmos.json', JSON.stringify(payload, null, 2), 'application/json');
}

export function exportOneJSON(algo) {
  const payload = { exportedAt: new Date().toISOString(), triageLevels: TRIAGE_LEVELS, algorithm: algo };
  download(`triagem-${algo.id}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

// ------- PDF helpers -------
const PAGE = { w: 210, h: 297, margin: 15 };
const COLORS = {
  primary: [37, 99, 235],
  text: [15, 23, 42],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  emergente: [220, 38, 38],
  muito_urgente: [234, 88, 12],
  urgente: [202, 138, 4],
  pouco_urgente: [5, 150, 105],
  nao_urgente: [37, 99, 235],
};

function ensureSpace(doc, cursor, needed = 20) {
  if (cursor + needed > PAGE.h - PAGE.margin) {
    doc.addPage();
    return PAGE.margin;
  }
  return cursor;
}

function drawHeader(doc, title, subtitle) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE.w, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TriagemAssist', PAGE.margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, PAGE.w - PAGE.margin, 14, { align: 'right' });
  doc.setTextColor(...COLORS.text);
}

function drawFooter(doc, pageNum, totalPages) {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `Documento gerado por TriagemAssist — Apoio à decisão clínica. Não substitui avaliação médica. Página ${pageNum} de ${totalPages}`,
    PAGE.w / 2, PAGE.h - 8, { align: 'center' }
  );
  doc.setTextColor(...COLORS.text);
}

function drawSectionTitle(doc, text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(text.toUpperCase(), PAGE.margin, y);
  doc.setTextColor(...COLORS.text);
  return y + 4;
}

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text || '', maxWidth);
}

function renderAlgorithm(doc, algo, startY) {
  let y = startY;
  const contentW = PAGE.w - PAGE.margin * 2;

  // Nome + categoria
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  const nameLines = wrapText(doc, algo.name, contentW);
  doc.text(nameLines, PAGE.margin, y);
  y += nameLines.length * 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(algo.category, PAGE.margin, y);
  y += 8;

  // Racional
  y = drawSectionTitle(doc, 'Racional clínico', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  const ratLines = wrapText(doc, algo.rationale, contentW);
  y = ensureSpace(doc, y, ratLines.length * 5 + 6);
  doc.text(ratLines, PAGE.margin, y);
  y += ratLines.length * 5 + 6;

  // Palavras-chave
  y = ensureSpace(doc, y, 18);
  y = drawSectionTitle(doc, 'Palavras-chave', y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const kwLines = wrapText(doc, algo.keywords.join(' · '), contentW);
  doc.text(kwLines, PAGE.margin, y);
  y += kwLines.length * 4.5 + 6;

  // Fluxo
  y = ensureSpace(doc, y, 20);
  y = drawSectionTitle(doc, 'Fluxo de triagem', y);
  y = renderFlow(doc, algo.flow, y, contentW);

  return y;
}

function renderFlow(doc, flow, startY, contentW) {
  let y = startY;
  const nodes = Object.entries(flow);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const [nodeId, node] of nodes) {
    y = ensureSpace(doc, y, 22);
    if (node.question) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(`[${nodeId}]`, PAGE.margin, y);
      doc.setTextColor(...COLORS.text);
      const qLines = wrapText(doc, node.question, contentW - 18);
      doc.text(qLines, PAGE.margin + 18, y);
      y += Math.max(qLines.length * 4.5, 4.5) + 1;
      doc.setFont('helvetica', 'normal');
      node.options.forEach((opt) => {
        y = ensureSpace(doc, y, 6);
        doc.setTextColor(...COLORS.muted);
        doc.text(`→ ${opt.label}: `, PAGE.margin + 22, y);
        doc.setTextColor(...COLORS.text);
        doc.text(opt.next, PAGE.margin + 45, y);
        y += 5;
      });
      y += 2;
    } else if (node.outcome) {
      const tone = COLORS[node.outcome.tone === 'red' ? 'emergente'
        : node.outcome.tone === 'orange' ? 'muito_urgente'
        : node.outcome.tone === 'yellow' ? 'urgente'
        : node.outcome.tone === 'green' ? 'pouco_urgente' : 'nao_urgente'];
      doc.setFillColor(...tone);
      doc.rect(PAGE.margin, y - 3.5, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...tone);
      doc.text(`[${nodeId}] ${node.outcome.label} · ${node.outcome.time}`, PAGE.margin + 5, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      const recLines = wrapText(doc, node.outcome.recommendation, contentW - 5);
      y = ensureSpace(doc, y, recLines.length * 4.5 + 2);
      doc.text(recLines, PAGE.margin + 5, y);
      y += recLines.length * 4.5 + 4;
    }
  }
  return y;
}

function drawLevelsLegend(doc, y) {
  y = drawSectionTitle(doc, 'Níveis de prioridade', y);
  const items = Object.values(TRIAGE_LEVELS);
  items.forEach((l) => {
    const tone = COLORS[l.key] || COLORS.nao_urgente;
    y = ensureSpace(doc, y, 6);
    doc.setFillColor(...tone);
    doc.circle(PAGE.margin + 2, y - 1, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(`${l.label} · ${l.time}`, PAGE.margin + 6, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    const descLines = wrapText(doc, l.desc, PAGE.w - PAGE.margin * 2 - 8);
    doc.text(descLines, PAGE.margin + 6, y + 4);
    y += 4 + descLines.length * 4 + 3;
  });
  return y;
}

function finalizePages(doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }
}

// ------- PDF exports -------
export function exportAllPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'TriagemAssist', `${ALGORITHMS.length} algoritmos`);
  let y = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Manual de Algoritmos de Triagem', PAGE.margin, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-PT')}`, PAGE.margin, y);
  doc.setTextColor(...COLORS.text);
  y += 10;

  y = drawLevelsLegend(doc, y);

  ALGORITHMS.forEach((algo) => {
    doc.addPage();
    drawHeader(doc, 'TriagemAssist', algo.category);
    renderAlgorithm(doc, algo, 32);
  });

  finalizePages(doc);
  doc.save('triagem-algoritmos.pdf');
}

export function exportOnePDF(algo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'TriagemAssist', algo.category);
  renderAlgorithm(doc, algo, 32);
  finalizePages(doc);
  doc.save(`triagem-${algo.id}.pdf`);
}
