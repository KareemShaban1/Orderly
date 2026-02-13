import { useState, useEffect } from 'react';

const FLAVORS = ['🍬 Sweet', '🌶️ Spicy', '🍋 Sour', '🧂 Salty', '😋 Umami'];
const LENGTH = 4;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameFlavorMatch({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [pattern] = useState(() => Array(LENGTH).fill(0).map(() => Math.floor(Math.random() * FLAVORS.length)));
  const [selected, setSelected] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [phase, setPhase] = useState<'show' | 'tap'>('show');

  useEffect(() => {
    const t = setTimeout(() => setPhase('tap'), 2000);
    return () => clearTimeout(t);
  }, [index]);

  const toggle = (i: number) => {
    if (phase !== 'tap') return;
    if (selected.length >= LENGTH) return;
    setSelected((prev) => [...prev, i]);
  };

  useEffect(() => {
    if (selected.length !== LENGTH) return;
    const correct = selected.every((s, i) => s === pattern[i]);
    if (correct) setScore((s) => s + 20);
    else setWrong(true);
    const t = setTimeout(() => {
      if (index + 1 >= rounds) onComplete(score + (correct ? 20 : 0));
      else { setIndex((idx) => idx + 1); setSelected([]); setWrong(false); }
    }, 1200);
    return () => clearTimeout(t);
  }, [selected, pattern, index, rounds, score, onComplete]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <p className="text-white mb-2">Round {index + 1}/{rounds}. {phase === 'show' ? 'Memorize the pattern:' : 'Repeat the pattern (tap in order):'}</p>
      {phase === 'show' && <div className="flex gap-2 mb-4 flex-wrap">{pattern.map((p, i) => <span key={i} className="px-3 py-2 rounded-lg bg-slate-600 text-white">{FLAVORS[p]}</span>)}</div>}
      {phase === 'tap' && <div className="flex gap-2 mb-4 flex-wrap">
        {FLAVORS.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            disabled={selected.length >= LENGTH}
            className={`px-3 py-2 rounded-lg text-sm ${selected.includes(i) ? 'ring-2 ring-white bg-slate-500' : 'bg-slate-600'} text-white`}
          >
            {f}
          </button>
        ))}
      </div>}
      <p className="text-slate-400 text-sm">Your sequence: {selected.map((i) => FLAVORS[i].split(' ')[0]).join(' → ')}</p>
      {wrong && <p className="text-red-400 text-sm mt-2">Wrong! Correct was: {pattern.map((i) => FLAVORS[i].split(' ')[0]).join(' → ')}</p>}
    </div>
  );
}
