import { useState, useRef, useEffect } from 'react';

const PRIZES = ['10% off', 'Free drink', '5% off', 'Try again', '15% off', 'Free side'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameScratchCard({ config, onComplete }: Props) {
  const [scratching, setScratching] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [pattern, setPattern] = useState<number[]>([]);
  const [showPattern, setShowPattern] = useState(true);
  const [phase, setPhase] = useState<'memorize' | 'tap' | 'done'>('memorize');
  const [tapIndex, setTapIndex] = useState(0);
  const [prize] = useState(() => PRIZES[Math.floor(Math.random() * PRIZES.length)]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase === 'memorize') {
      const p = Array(9).fill(0).map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 4);
      setPattern(p);
      const t = setTimeout(() => { setShowPattern(false); setPhase('tap'); }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleTap = (index: number) => {
    if (phase !== 'tap') return;
    if (pattern[tapIndex] === index) {
      setTapIndex((i) => i + 1);
      setRevealed((r) => r + 25);
      if (tapIndex + 1 >= pattern.length) {
        setPhase('done');
        const score = prize === 'Try again' ? 10 : 80;
        setTimeout(() => onComplete(score), 800);
      }
    } else {
      setPhase('done');
      setTimeout(() => onComplete(0), 500);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-white mb-4">
        {phase === 'memorize' && 'Memorize the 4 flashing cells...'}
        {phase === 'tap' && 'Tap them in order!'}
        {phase === 'done' && `Prize: ${prize}`}
      </p>
      {phase === 'memorize' && showPattern && (
        <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto mb-4">
          {Array(9).fill(0).map((_, i) => (
            <div
              key={i}
              className={`h-12 rounded ${pattern.includes(i) ? 'bg-amber-400' : 'bg-slate-600'}`}
            />
          ))}
        </div>
      )}
      {(phase === 'tap' || phase === 'done') && (
        <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto mb-4">
          {Array(9).fill(0).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleTap(i)}
              disabled={phase === 'done'}
              className="h-12 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-70 text-white"
            >
              {phase === 'done' && pattern.includes(i) ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
