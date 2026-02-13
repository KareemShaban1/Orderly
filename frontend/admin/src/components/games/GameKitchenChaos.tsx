import { useState, useEffect } from 'react';

const ORDERS = ['🍔', '🍕', '🥗'];
const TABLES = 3;
const DURATION = 40;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameKitchenChaos({ config, onComplete }: Props) {
  const duration = (config.duration_seconds as number) || DURATION;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [pending] = useState(() => ({ table: Math.floor(Math.random() * TABLES), item: ORDERS[Math.floor(Math.random() * ORDERS.length)] }));

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((l) => (l <= 0 ? (onComplete(score), 0) : l - 1)), 1000);
    return () => clearInterval(t);
  }, [score, onComplete]);

  const deliver = (table: number, item: string) => {
    if (table === pending.table && item === pending.item) setScore((s) => s + 20);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <div className="flex justify-between text-white mb-4">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <p className="text-slate-400 text-sm mb-2">Send order to correct table: Table {pending.table + 1} wants {pending.item}</p>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((t) =>
          ORDERS.map((item) => (
            <button key={`${t}-${item}`} type="button" onClick={() => deliver(t, item)} className="py-3 rounded-lg bg-slate-600 text-2xl hover:bg-slate-500">
              T{t + 1} {item}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
