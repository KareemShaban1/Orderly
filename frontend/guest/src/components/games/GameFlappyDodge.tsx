import { useState, useEffect, useRef, useCallback } from 'react';
import LevelSelect from './LevelSelect';

const W = 320;
const H = 400;
const BIRD_SIZE = 28;
const PIPE_W = 50;
const GAP = 120;
const GRAVITY = 0.4;
const JUMP = -9;

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

export default function GameFlappyDodge({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [birdY, setBirdY] = useState(H / 2 - BIRD_SIZE / 2);
  const [pipes, setPipes] = useState<{ x: number; gapY: number }[]>([]);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const vyRef = useRef(0);
  const scoreRef = useRef(0);
  const scoredPipeRef = useRef<Set<number>>(new Set());
  const birdYRef = useRef(H / 2 - BIRD_SIZE / 2);
  const pipesRef = useRef<{ x: number; gapY: number }[]>([]);

  const effective = getConfig(config, level);
  const speed = (effective.speed as number) ?? 3;
  const levels = config.levels as Record<number, unknown> | undefined;

  scoreRef.current = score;
  birdYRef.current = birdY;
  pipesRef.current = pipes;

  const jump = useCallback(() => {
    if (!started) setStarted(true);
    if (gameOver) return;
    vyRef.current = JUMP;
  }, [started, gameOver]);

  useEffect(() => {
    if (!started || gameOver) return;
    let last = performance.now();
    let pipeTimer = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      vyRef.current += GRAVITY * 60 * dt;
      let newY = birdYRef.current + vyRef.current * dt * 60;
      newY = Math.max(0, Math.min(H - BIRD_SIZE, newY));
      birdYRef.current = newY;
      if (newY <= 0 || newY >= H - BIRD_SIZE) {
        setGameOver(true);
        setTimeout(() => onComplete(scoreRef.current), 400);
        return;
      }
      setBirdY(newY);
      setPipes((ps) => {
        const next = ps.map((p) => ({ ...p, x: p.x - speed * 60 * dt }));
        next.forEach((p) => {
          if (p.x + PIPE_W < 50 && !scoredPipeRef.current.has(p.x)) {
            scoredPipeRef.current.add(p.x);
            setScore((s) => s + 10);
          }
        });
        let out = next.filter((p) => p.x > -PIPE_W);
        pipeTimer += dt;
        if (pipeTimer > 1.8) {
          pipeTimer = 0;
          out = [...out, { x: W, gapY: 80 + Math.random() * (H - GAP - 160) }];
        }
        pipesRef.current = out;
        const bx = 60;
        for (const p of out) {
          if (p.x + PIPE_W < bx || p.x > bx + BIRD_SIZE) continue;
          if (newY < p.gapY - GAP / 2 || newY + BIRD_SIZE > p.gapY + GAP / 2) {
            setGameOver(true);
            setTimeout(() => onComplete(scoreRef.current), 400);
            break;
          }
        }
        return out;
      });
      if (!gameOver) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver, speed, onComplete]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} levelLabels={{ 1: 'Slow', 2: 'Medium', 3: 'Fast' }} />;
  }

  if (gameOver) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="flex justify-start mb-4">
          <button type="button" onClick={() => setLevel(null)} className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-sm">
            ← Back to levels
          </button>
        </div>
        <p className="text-red-400 text-xl font-bold">Crashed!</p>
        <p className="text-white mt-2">Score: {score}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="flex justify-start p-2">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
      </div>
      <div
        className="cursor-pointer select-none"
        style={{ width: W, height: H }}
        onClick={jump}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === ' ' && jump()}
      >
      <div className="relative w-full h-full bg-gradient-to-b from-sky-600 to-sky-800">
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white font-bold text-lg">Tap to fly</p>
          </div>
        )}
        <div
          className="absolute bg-yellow-400 rounded-full border-2 border-slate-800"
          style={{ left: 60, top: birdY, width: BIRD_SIZE, height: BIRD_SIZE }}
        />
        {pipes.map((p, i) => (
          <div key={i} className="absolute flex flex-col h-full" style={{ left: p.x, width: PIPE_W }}>
            <div className="bg-emerald-700 border-2 border-emerald-900 flex-shrink-0" style={{ height: p.gapY - GAP / 2 }} />
            <div className="flex-shrink-0" style={{ height: GAP }} />
            <div className="bg-emerald-700 border-2 border-emerald-900 flex-1 min-h-[80px]" />
          </div>
        ))}
        <div className="absolute top-2 left-2 text-white font-bold">Score: {score}</div>
      </div>
      </div>
    </div>
  );
}
