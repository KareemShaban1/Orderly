import { useState, useEffect } from 'react';

const DURATION = 45;
const ITEMS = ['🍔', '🍟', '🥤', '🍕'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameTableVsTable({ config, onComplete }: Props) {
  const duration = (config.duration_seconds as number) || DURATION;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [rivalScore] = useState(() => 80 + Math.floor(Math.random() * 120));

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((l) => (l <= 0 ? (onComplete(score), 0) : l - 1)), 1000);
    return () => clearInterval(t);
  }, [score, onComplete]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <div className="flex justify-between text-white mb-4">
        <span>You: {score}</span>
        <span>Rival: {rivalScore}</span>
      </div>
      <p className="text-slate-400 text-sm mb-2">Time: {timeLeft}s — Tap fast to beat the rival table!</p>
      <div className="grid grid-cols-2 gap-4">
        {ITEMS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setScore((s) => s + 5)}
            className="text-5xl p-6 rounded-xl bg-slate-600 hover:bg-slate-500"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
