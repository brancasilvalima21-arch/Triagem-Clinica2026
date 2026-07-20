import React from 'react';
import { TRIAGE_LEVELS } from '../mock/algorithms';

const tones = {
  red: 'bg-red-100 text-red-800 border-red-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function LevelBadge({ levelKey, size = 'md' }) {
  const lv = TRIAGE_LEVELS[levelKey];
  if (!lv) return null;
  const cls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${tones[lv.tone]} ${cls}`}>
      <span className={`inline-block h-2 w-2 rounded-full bg-${lv.tone}-500`} style={{ background: `var(--tw-${lv.tone})` }} />
      {lv.label} · {lv.time}
    </span>
  );
}
