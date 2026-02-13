import { useState, useEffect, useRef } from 'react';
import LevelSelect from './LevelSelect';

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

export default function GameReactionTime({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const effective = getConfig(config, level);
  const rounds = (effective.rounds as number) || 5;
  const [phase, setPhase] = useState<'idle' | 'wait' | 'go' | 'result'>('idle');
  const [round, setRound] = useState(0);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [totalMs, setTotalMs] = useState(0);
  const goTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(0);

  const startRound = () => {
    setPhase('wait');
    setReactionMs(null);
    const delay = 1500 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      goTimeRef.current = Date.now();
      setPhase('go');
    }, delay);
  };

  useEffect(() => {
    if (phase === 'idle') return;
    if (phase === 'wait' || phase === 'go') return;
    return () => clearTimeout(timeoutRef.current);
  }, [phase]);

  const handleTap = () => {
    if (phase === 'wait') {
      clearTimeout(timeoutRef.current);
      setPhase('result');
      setReactionMs(-1);
      setTotalMs((t) => t + 500);
      setTimeout(() => next(), 1200);
      return;
    }
    if (phase === 'go') {
      const ms = Date.now() - goTimeRef.current;
      setReactionMs(ms);
      setTotalMs((t) => t + ms);
      setPhase('result');
      setTimeout(() => next(), 1200);
    }
  };

  const next = () => {
    if (round + 1 >= rounds) {
      const avg = rounds > 0 ? Math.round(totalMs / rounds) : 0;
      onComplete(Math.max(0, 1000 - avg));
      return;
    }
    setRound((r) => r + 1);
    setPhase('idle');
    setTimeout(startRound, 600);
  };

  const begin = () => {
    setRound(0);
    setTotalMs(0);
    setPhase('wait');
    setReactionMs(null);
    const delay = 1500 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      goTimeRef.current = Date.now();
      setPhase('go');
    }, delay);
  };

  const levels = config.levels as Record<number, unknown> | undefined;
  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} />;
  }

  if (phase === 'idle' && round === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center">
        <div className="flex justify-start mb-4">
          <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
            ← Back to levels
          </button>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Reaction Time {level ? `— Level ${level}` : ''}</h3>
        <p className="text-slate-400 text-sm mb-4">Tap when the screen turns green. Do not tap too early.</p>
        <p className="text-slate-500 text-xs mb-6">{rounds} rounds</p>
        <button type="button" onClick={begin} className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500">
          Start
        </button>
      </div>
    );
  }

  const bg = phase === 'go' ? 'bg-emerald-600' : phase === 'result' ? 'bg-slate-700' : 'bg-slate-800';
  return (
    <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full">
      <div className="flex justify-start mb-2">
        <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
          ← Back to levels
        </button>
      </div>
      <div
        className={`${bg} rounded-xl p-6 min-h-[240px] flex flex-col items-center justify-center transition-colors cursor-pointer`}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === ' ' && handleTap()}
      >
        {phase === 'wait' && <p className="text-slate-400 text-lg">Wait for green...</p>}
        {phase === 'go' && <p className="text-white text-2xl font-bold">TAP NOW!</p>}
        {phase === 'result' && (
          <div className="text-center">
            {reactionMs === -1 ? (
              <p className="text-red-400 font-semibold">Too early!</p>
            ) : (
              <p className="text-emerald-400 text-3xl font-bold">{reactionMs} ms</p>
            )}
            <p className="text-slate-400 text-sm mt-2">Round {round + 1} / {rounds}</p>
          </div>
        )}
      </div>
    </div>
  );
}
