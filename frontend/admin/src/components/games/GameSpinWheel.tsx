import { useState, useRef } from 'react';

const SEGMENTS = ['5% off', '10% off', 'Free drink', '15% off', 'Try again', '20% off', 'Free dessert', '25% off'];

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameSpinWheel({ config, onComplete }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const spinRef = useRef(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const extra = 360 * (4 + Math.random() * 3);
    const segmentAngle = 360 / SEGMENTS.length;
    const randomSegment = Math.floor(Math.random() * SEGMENTS.length);
    const target = 360 - randomSegment * segmentAngle - segmentAngle / 2 + (Math.random() * segmentAngle * 0.6);
    spinRef.current = rotation + extra + target;
    setRotation(spinRef.current);
    const t = setTimeout(() => {
      setSpinning(false);
      setResult(SEGMENTS[randomSegment]);
      const score = result === 'Try again' ? 0 : 50 + Math.floor(Math.random() * 50);
      setTimeout(() => onComplete(score), 1500);
    }, 4500);
    return () => clearTimeout(t);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center">
      <div
        className="relative w-64 h-64 mx-auto rounded-full border-8 border-slate-600 overflow-hidden"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      >
        {SEGMENTS.map((label, i) => (
          <div
            key={i}
            className="absolute w-full h-full"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((i * 360 / SEGMENTS.length * Math.PI) / 180)}% ${50 - 50 * Math.sin((i * 360 / SEGMENTS.length * Math.PI) / 180)}%)`,
              background: `hsl(${i * 45}, 60%, 45%)`,
            }}
          />
        ))}
        {SEGMENTS.map((label, i) => (
          <div
            key={i}
            className="absolute text-white text-xs font-bold"
            style={{
              left: `${50 + 35 * Math.cos((i * 360 / SEGMENTS.length - 90) * Math.PI / 180)}%`,
              top: `${50 + 35 * Math.sin((i * 360 / SEGMENTS.length - 90) * Math.PI / 180)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="relative mt-4">
        <div className="w-0 h-0 mx-auto border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-500 -mt-2" />
      </div>
      {!result && (
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="mt-6 px-6 py-3 bg-emerald-500 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {spinning ? 'Spinning...' : 'Spin!'}
        </button>
      )}
      {result && <p className="mt-4 text-xl text-white">You got: <strong>{result}</strong></p>}
    </div>
  );
}
