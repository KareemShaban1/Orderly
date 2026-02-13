import { useState, useEffect } from 'react';

const ITEMS = ['🍔', '🍟', '🥤', '🍕', '🥗', '🍰', '☕', '🌮'];
const ORDERS_COUNT = 10;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameOrderMaster({ config, onComplete }: Props) {
  const duration = (config.duration_seconds as number) || 45;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [order] = useState(() => Array(3).fill(0).map(() => ITEMS[Math.floor(Math.random() * ITEMS.length)]));
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) { setDone(true); onComplete(score); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [score, onComplete]);

  const tap = (emoji: string) => {
    if (order[0] === emoji) {
      setScore((s) => s + 15);
      order.shift();
      if (order.length === 0) {
        setScore((s) => s + 25);
        order.push(...Array(3).fill(0).map(() => ITEMS[Math.floor(Math.random() * ITEMS.length)]));
      }
    } else {
      setScore((s) => Math.max(0, s - 5));
    }
  };

  if (done) return <div className="text-white text-center">Score: {score}</div>;

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <div className="flex justify-between text-white mb-4">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <p className="text-slate-400 text-sm mb-2">Tap items in order (left to right):</p>
      <div className="flex justify-center gap-4 mb-6 text-4xl">
        {order.map((e, i) => <span key={i}>{e}</span>)}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ITEMS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => tap(e)}
            className="text-4xl p-4 rounded-xl bg-slate-600 hover:bg-slate-500"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
