import { useState } from 'react';

const INGREDIENTS = ['🍬', '🌶️', '🍋', '🧂', '🍯'];
const TARGETS = [
  [0, 1, 2],
  [1, 2, 3],
  [0, 2, 4],
  [1, 3, 4],
];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameFlavorMix({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 3;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const target = TARGETS[index % TARGETS.length].slice().sort((a, b) => a - b);

  const toggle = (i: number) => {
    setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b));
  };

  const submit = () => {
    const correct = selected.length === target.length && selected.every((s, i) => s === target[i]);
    setScore((s) => s + (correct ? 50 : 0));
    setSelected([]);
    if (index + 1 >= rounds) setTimeout(() => onComplete(score + (correct ? 50 : 0)), 500);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-white mb-2">Round {index + 1}/{rounds}. Match the target flavor combo (3 ingredients)</p>
      <p className="text-slate-400 text-sm mb-4">Target: {target.map((i) => INGREDIENTS[i]).join(' + ')}</p>
      <div className="flex gap-2 justify-center mb-4">
        {INGREDIENTS.map((e, i) => (
          <button key={i} type="button" onClick={() => toggle(i)} className={`text-4xl p-2 rounded-lg ${selected.includes(i) ? 'ring-2 ring-white bg-slate-500' : 'bg-slate-600'}`}>{e}</button>
        ))}
      </div>
      <button type="button" onClick={submit} className="btn btn-primary">Check</button>
    </div>
  );
}
