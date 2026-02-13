import { useState } from 'react';

const DISHES = [
  { name: 'Honey Cake', flavor: 'Sweet', emoji: '🍰' },
  { name: 'Curry', flavor: 'Spicy', emoji: '🍛' },
  { name: 'Lemonade', flavor: 'Sour', emoji: '🍋' },
  { name: 'Chips', flavor: 'Salty', emoji: '🍟' },
];
const FLAVORS = ['Sweet', 'Spicy', 'Sour', 'Salty'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameFlavorProfile({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [dish] = useState(() => DISHES[Math.floor(Math.random() * DISHES.length)]);
  const [choice, setChoice] = useState<string | null>(null);

  const submit = (flavor: string) => {
    setChoice(flavor);
    const correct = flavor === dish.flavor;
    if (correct) setScore((s) => s + 20);
    setTimeout(() => {
      if (index + 1 >= rounds) onComplete(score + (correct ? 20 : 0));
      else setIndex((i) => i + 1);
    }, 1200);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-slate-400 text-sm mb-2">Round {index + 1}/{rounds}. What flavor is this dish?</p>
      <p className="text-5xl my-4">{dish.emoji} {dish.name}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {FLAVORS.map((f) => (
          <button key={f} type="button" onClick={() => submit(f)} disabled={choice !== null} className="px-4 py-2 rounded-lg bg-slate-600 text-white disabled:opacity-70">
            {f}
          </button>
        ))}
      </div>
      {choice && <p className={`mt-4 ${choice === dish.flavor ? 'text-emerald-400' : 'text-red-400'}`}>{choice === dish.flavor ? 'Correct!' : `It was ${dish.flavor}`}</p>}
    </div>
  );
}
