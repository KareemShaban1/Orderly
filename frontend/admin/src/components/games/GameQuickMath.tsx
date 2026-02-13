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

function genProblem(): { q: string; answer: number } {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 15) + 1;
  const op = Math.random() < 0.5 ? '+' : '-';
  const answer = op === '+' ? a + b : a - b;
  const q = `${a} ${op} ${b}`;
  return { q, answer };
}

export default function GameQuickMath({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState(genProblem);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(5);
  const [ended, setEnded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const effective = getConfig(config, level);
  const rounds = (effective.rounds as number) || 15;
  const timePerRound = (effective.time_per_round_seconds as number) || 5;
  const levels = config.levels as Record<number, unknown> | undefined;

  useEffect(() => {
    inputRef.current?.focus();
  }, [round]);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) {
          if (round + 1 >= rounds) {
            setEnded(true);
            onComplete(score);
          } else {
            setRound((r) => r + 1);
            setProblem(genProblem());
            setInput('');
            setTimeLeft(timePerRound);
            setStreak(0);
          }
          return timePerRound;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ended, round, rounds, score, onComplete, timePerRound]);

  useEffect(() => {
    if (level !== null) setTimeLeft(timePerRound);
  }, [level, timePerRound]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} />;
  }

  const submit = () => {
    const num = parseInt(input, 10);
    const correct = num === problem.answer;
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 10 + Math.min(20, newStreak * 5);
      setScore((s) => s + points);
    } else {
      setStreak(0);
    }
    if (round + 1 >= rounds) {
      setEnded(true);
      onComplete(score + (correct ? 10 + Math.min(20, (streak + 1) * 5) : 0));
    } else {
      setRound((r) => r + 1);
      setProblem(genProblem());
      setInput('');
      setTimeLeft(timePerRound);
      if (!correct) setStreak(0);
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
        <p className="text-slate-400 text-sm mt-1">Streak bonus applied</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <span className="text-white">{timeLeft}s</span>
      </div>
      <div className="flex justify-between text-white mb-4">
        <span>Round {round + 1} / {rounds}</span>
        <span>Score: {score} (streak: {streak})</span>
      </div>
      <p className="text-4xl font-bold text-center text-white mb-6">{problem.q} = ?</p>
      <input
        ref={inputRef}
        type="number"
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-full px-4 py-4 rounded-lg bg-slate-700 text-white text-2xl text-center"
        placeholder="Answer"
      />
      <button
        type="button"
        onClick={submit}
        className="w-full mt-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
      >
        Submit
      </button>
    </div>
  );
}
