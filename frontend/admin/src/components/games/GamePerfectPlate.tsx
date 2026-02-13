import { useState, useEffect, useRef } from 'react';

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GamePerfectPlate({ config, onComplete }: Props) {
  const count = (config.items_count as number) || 5;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [zone, setZone] = useState(false);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(0);

  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => {
      setShow(true);
      setZone(true);
      const good = 400 + Math.random() * 400;
      timerRef.current = setTimeout(() => setZone(false), good);
    }, 800 + Math.random() * 500);
    return () => clearTimeout(t);
  }, [index]);

  const tap = () => {
    if (!show) return;
    const add = zone ? 25 : 0;
    setScore((s) => s + add);
    if (index + 1 >= count) setTimeout(() => onComplete(score + add), 400);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center">
      <p className="text-white mb-2">Round {index + 1}/{count}. Tap when the bar is in the green zone!</p>
      <div className="h-4 bg-slate-600 rounded-full overflow-hidden mb-4 relative">
        <div className="absolute left-1/3 w-1/3 h-full bg-emerald-500 rounded" />
        {show && <div className="absolute inset-0 bg-amber-400 animate-pulse rounded" style={{ width: '20%', left: `${30 + Math.random() * 50}%` }} />}
      </div>
      <button type="button" onClick={tap} className="px-8 py-4 bg-slate-600 text-white rounded-xl text-xl">TAP</button>
      <p className="text-slate-400 text-sm mt-4">Score: {score}</p>
    </div>
  );
}
