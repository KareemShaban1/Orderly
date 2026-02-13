import { useState, useEffect, useRef } from 'react';
import LevelSelect from './LevelSelect';

const W = 320;
const H = 360;

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
  onBack?: () => void;
}

function getConfig(config: Record<string, unknown>, level: number | null): Record<string, unknown> {
  const levels = config.levels as Record<number, Record<string, unknown>> | undefined;
  if (level && levels?.[level]) return { ...config, ...levels[level] };
  return config;
}

export default function GameAimTrainer({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [ended, setEnded] = useState(false);
  const spawnTimeRef = useRef(0);

  const effective = getConfig(config, level);
  const rounds = (effective.rounds as number) || 10;
  const timeLimit = (effective.time_limit_seconds as number) || 30;
  const levels = config.levels as Record<number, unknown> | undefined;

  const spawn = () => {
    const padding = 40;
    setTarget({
      x: padding + Math.random() * (W - padding * 2),
      y: padding + Math.random() * (H - padding * 2),
    });
    spawnTimeRef.current = Date.now();
  };

  useEffect(() => {
    if (ended) return;
    spawn();
  }, [round, ended]);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) {
          setEnded(true);
          onComplete(score);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ended, score, onComplete]);

  useEffect(() => {
    if (level !== null) setTimeLeft(timeLimit);
  }, [level, timeLimit]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} />;
  }

  const hit = () => {
    if (!target) return;
    const reaction = Date.now() - spawnTimeRef.current;
    const points = Math.max(10, 50 - Math.floor(reaction / 50));
    setScore((s) => s + points);
    setTarget(null);
    if (round + 1 >= rounds) {
      setEnded(true);
      setTimeout(() => onComplete(score + points), 300);
    } else {
      setRound((r) => r + 1);
    }
  };

  if (ended) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="flex justify-start mb-4">
          <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
            ← Back to levels
          </button>
        </div>
        <p className="text-white text-xl font-bold">Score: {score}</p>
        <p className="text-slate-400 text-sm mt-1">Time&apos;s up!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 max-w-sm w-full">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <span className="text-white">{timeLeft}s</span>
      </div>
      <div className="flex justify-between text-white mb-2">
        <span>Round {round + 1} / {rounds}</span>
        <span>Score: {score}</span>
      </div>
      <div
        className="relative rounded-lg bg-slate-900 cursor-crosshair overflow-hidden"
        style={{ width: W, height: H }}
      >
        {target && (
          <button
            type="button"
            className="absolute w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 border-4 border-white shadow-lg transition-transform active:scale-95"
            style={{ left: target.x - 24, top: target.y - 24 }}
            onClick={hit}
          />
        )}
      </div>
      <p className="text-slate-500 text-xs mt-2 text-center">Click the red targets as fast as you can</p>
    </div>
  );
}
