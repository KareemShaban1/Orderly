import { useState, useEffect } from 'react';

const ITEMS = ['🍎', '🍊', '🥕', '🍞'];
const TARGET = 8;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameIngredientStacker({ config, onComplete }: Props) {
  const target = (config.target_height as number) || TARGET;
  const [stack, setStack] = useState<string[]>([]);
  const [current] = useState(() => ITEMS[Math.floor(Math.random() * ITEMS.length)]);
  const [score, setScore] = useState(0);
  const [crashed, setCrashed] = useState(false);

  const drop = () => {
    if (crashed) return;
    setStack((s) => [...s, current]);
    setScore((sc) => sc + 10);
  };

  useEffect(() => {
    if (stack.length >= target) {
      setCrashed(true);
      setTimeout(() => onComplete(score + 10), 600);
    }
  }, [stack.length, target, score, onComplete]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-white mb-2">Stack to {target}! Score: {score}</p>
      <button
        type="button"
        onClick={drop}
        disabled={crashed}
        className="text-5xl p-4 rounded-xl bg-slate-600 hover:bg-slate-500 disabled:opacity-50 mb-4"
      >
        {current}
      </button>
      <div className="min-h-[120px] flex flex-col-reverse gap-1">
        {stack.map((e, i) => (
          <div key={i} className="text-3xl">{e}</div>
        ))}
      </div>
    </div>
  );
}
