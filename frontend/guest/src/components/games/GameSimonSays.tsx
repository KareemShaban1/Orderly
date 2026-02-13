import { useState, useEffect, useRef } from 'react';
import LevelSelect from './LevelSelect';

const COLS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308'];

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

export default function GameSimonSays({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<'play' | 'repeat' | 'wrong'>('play');
  const [score, setScore] = useState(0);
  const [highlight, setHighlight] = useState<number | null>(null);
  const startedRef = useRef(false);

  const effective = getConfig(config, level);
  const maxRounds = (effective.max_rounds as number) || 10;
  const levels = config.levels as Record<number, unknown> | undefined;

  const addToSequence = () => {
    setSequence((seq) => {
      const next = [...seq, Math.floor(Math.random() * 4)];
      setPhase('play');
      setPlayerInput([]);
      let i = 0;
      const show = () => {
        if (i >= next.length) {
          setPhase('repeat');
          return;
        }
        setHighlight(next[i]);
        const t = setTimeout(() => {
          setHighlight(null);
          i += 1;
          setTimeout(show, 220);
        }, 450);
      };
      setTimeout(show, 400);
      return next;
    });
  };

  useEffect(() => {
    if (level === null) return;
    if (!startedRef.current) {
      startedRef.current = true;
      addToSequence();
    }
  }, [level]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} />;
  }

  const push = (idx: number) => {
    if (phase !== 'repeat') return;
    const next = [...playerInput, idx];
    setPlayerInput(next);
    if (next[next.length - 1] !== sequence[next.length - 1]) {
      setPhase('wrong');
      setTimeout(() => onComplete(score), 1200);
      return;
    }
    if (next.length === sequence.length) {
      const newScore = score + sequence.length * 10;
      setScore(newScore);
      if (sequence.length >= maxRounds) {
        setTimeout(() => onComplete(newScore), 500);
        return;
      }
      addToSequence();
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <div className="flex gap-4 text-white">
          <span>Round {sequence.length}</span>
          <span>Score: {score}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3" style={{ width: 200, margin: '0 auto' }}>
        {COLS.map((col, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Color ${i + 1}`}
            className="w-24 h-24 rounded-xl border-4 border-white/30 transition-all active:scale-95"
            style={{
              backgroundColor: col,
              opacity: highlight === i || (phase === 'repeat' && playerInput[playerInput.length - 1] === i) ? 1 : 0.5,
              transform: highlight === i ? 'scale(1.05)' : undefined,
            }}
            onClick={() => push(i)}
          />
        ))}
      </div>
      <p className="text-slate-400 text-sm mt-4 text-center">
        {phase === 'play' && 'Watch the sequence...'}
        {phase === 'repeat' && 'Repeat the pattern'}
        {phase === 'wrong' && 'Wrong! Game over.'}
      </p>
    </div>
  );
}
