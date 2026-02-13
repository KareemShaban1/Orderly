import { useState } from 'react';

const INGREDIENTS = ['🍗', '🥬', '🍅', '🧅', '🥕', '🍝', '🧀', '🍋'];
const ROUNDS = 2;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameRecipeRoulette({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || ROUNDS;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [drawn] = useState(() => Array(4).fill(0).map(() => INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)]));
  const [name, setName] = useState('');

  const submit = () => {
    const points = name.trim().length > 2 ? 50 : 0;
    setScore((s) => s + points);
    setName('');
    if (index + 1 >= rounds) setTimeout(() => onComplete(score + points), 500);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-white mb-2">Round {index + 1}/{rounds}. Name a recipe using these ingredients:</p>
      <div className="flex gap-2 justify-center my-4 text-4xl">
        {drawn.map((e, i) => <span key={i}>{e}</span>)}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Your recipe name"
        className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white mb-4"
      />
      <button type="button" onClick={submit} className="btn btn-primary">Submit</button>
    </div>
  );
}
