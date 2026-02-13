import { useState, useEffect, useRef } from 'react';

const ORDERS = ['🍔', '🍕', '🥗', '☕'];
const TABLES = 3;
const DURATION = 60;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameTableService({ config, onComplete }: Props) {
  const duration = (config.duration_seconds as number) || DURATION;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [score, setScore] = useState(0);
  const [orders, setOrders] = useState<{ table: number; item: string; id: number }[]>([]);
  const idRef = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      idRef.current += 1;
      setOrders((o) => [...o.slice(-8), { table: Math.floor(Math.random() * TABLES), item: ORDERS[Math.floor(Math.random() * ORDERS.length)], id: idRef.current }]);
    }, 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) { onComplete(score); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [score, onComplete]);

  const serve = (id: number) => {
    setOrders((o) => o.filter((x) => x.id !== id));
    setScore((s) => s + 15);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <div className="flex justify-between text-white mb-4">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <p className="text-slate-400 text-sm mb-2">Tap an order to serve it to the table</p>
      <div className="space-y-2">
        {orders.slice(0, 6).map((o) => (
          <button key={o.id} type="button" onClick={() => serve(o.id)} className="w-full py-2 px-4 rounded-lg bg-slate-600 text-white text-left flex justify-between">
            <span>Table {o.table + 1}</span>
            <span className="text-2xl">{o.item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
