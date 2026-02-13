import { useState } from 'react';

const DISHES = [
  { name: 'Soup', type: 'appetizer', emoji: '🍲' },
  { name: 'Salad', type: 'appetizer', emoji: '🥗' },
  { name: 'Steak', type: 'main', emoji: '🥩' },
  { name: 'Pasta', type: 'main', emoji: '🍝' },
  { name: 'Cake', type: 'dessert', emoji: '🍰' },
  { name: 'Ice cream', type: 'dessert', emoji: '🍨' },
  { name: 'Bread', type: 'appetizer', emoji: '🍞' },
  { name: 'Fish', type: 'main', emoji: '🐟' },
  { name: 'Fruit', type: 'dessert', emoji: '🍇' },
];
const ORDER = ['appetizer', 'main', 'dessert'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameFoodChain({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 3;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const pool = [...DISHES].sort(() => Math.random() - 0.5).slice(0, 6);
  const correctOrder = [...pool].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));

  const toggle = (name: string) => {
    if (submitted) return;
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const submit = () => {
    setSubmitted(true);
    const selectedDishes = selected.map((n) => DISHES.find((d) => d.name === n)!);
    const ordered = [...selectedDishes].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
    let correct = selected.length === correctOrder.length;
    if (correct) ordered.forEach((d, i) => { if (d.type !== correctOrder[i].type) correct = false; });
    const add = correct ? 100 : 0;
    setScore((s) => s + add);
    setTimeout(() => {
      if (index + 1 >= rounds) onComplete(score + add);
      else { setIndex((i) => i + 1); setSelected([]); setSubmitted(false); }
    }, 1500);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
      <p className="text-white mb-2">Round {index + 1}/{rounds}. Order: Appetizer → Main → Dessert</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {pool.map((d) => (
          <button
            key={d.name}
            type="button"
            onClick={() => toggle(d.name)}
            className={`px-4 py-2 rounded-lg ${selected.includes(d.name) ? 'bg-amber-500' : 'bg-slate-600'} text-white`}
          >
            {d.emoji} {d.name}
          </button>
        ))}
      </div>
      <p className="text-slate-400 text-sm mb-2">Your order: {selected.join(', ') || '(tap to add)'}</p>
      <button type="button" onClick={submit} disabled={submitted || selected.length === 0} className="btn btn-primary">
        Submit order
      </button>
    </div>
  );
}
