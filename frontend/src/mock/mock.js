// Utilidades mock — análise de sintomas e histórico
import { ALGORITHMS, TRIAGE_LEVELS } from './algorithms';

const STORAGE_KEY = 'triagem_historico_mock';

// Análise mock — pontua algoritmos por presença de palavras-chave
export function analyzeSymptomsMock({ description = '', age = '', sex = '' }) {
  const text = description.toLowerCase();
  if (!text.trim()) return null;

  const scored = ALGORITHMS.map((a) => {
    let score = 0;
    const found = [];
    a.keywords.forEach((kw) => {
      if (text.includes(kw.toLowerCase())) { score += 2; found.push(kw); }
    });
    const nameWords = a.name.toLowerCase().split(/[\s,/-]+/).filter((w) => w.length > 3);
    nameWords.forEach((w) => { if (text.includes(w)) score += 1; });
    return { algo: a, score, matchedKeywords: found };
  }).filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Termos clínicos: extrair keywords + heurística
  const clinicalTerms = [];
  const clinicalMap = {
    'dor de cabeça': 'cefaleia', 'aperto no peito': 'precordialgia', 'falta de ar': 'dispneia',
    'barriga': 'abdómen', 'vómito': 'êmese', 'febre': 'hipertermia', 'tontura': 'vertigem',
    'suor': 'sudorese', 'pescoço tenso': 'rigidez da nuca', 'desmaio': 'síncope',
    'sangue nas fezes': 'hematoquézia', 'urinar': 'micção', 'ardor': 'disúria',
  };
  Object.entries(clinicalMap).forEach(([k, v]) => { if (text.includes(k)) clinicalTerms.push(v); });
  if (scored[0]) scored[0].matchedKeywords.forEach((k) => { if (!clinicalTerms.includes(k)) clinicalTerms.push(k); });

  const top = scored.slice(0, 3).map((s) => ({ id: s.algo.id, name: s.algo.name, category: s.algo.category, score: s.score, matched: s.matchedKeywords }));

  if (top.length === 0) {
    return {
      clinicalTerms: [],
      summary: 'Não foi possível identificar sintomas específicos. Considere o algoritmo de Problemas Inespecíficos.',
      suggested: [{ id: 'inespecifico', name: 'Problemas Inespecíficos', category: 'Outros', score: 0, matched: [] }],
      primary: ALGORITHMS.find((a) => a.id === 'inespecifico'),
      age, sex, description,
    };
  }

  return {
    clinicalTerms,
    summary: `Foram identificados sintomas compatíveis com ${top[0].name}. Sugere-se percorrer o algoritmo correspondente para triagem estruturada.`,
    suggested: top,
    primary: ALGORITHMS.find((a) => a.id === top[0].id),
    age, sex, description,
  };
}

// Histórico mock em localStorage
export function saveTriagemMock(entry) {
  const list = getHistoricoMock();
  const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry };
  list.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return item;
}

export function getHistoricoMock() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function deleteTriagemMock(id) {
  const list = getHistoricoMock().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export { TRIAGE_LEVELS };
