import { useState, useEffect, useRef } from 'react';
import LevelSelect from './LevelSelect';

const WORDS = ['PIZZA', 'BREAD', 'APPLE', 'GRAPE', 'LEMON', 'MANGO', 'PEACH', 'SALAD', 'TOMATO', 'COFFEE', 'HONEY', 'WATER', 'SNAKE', 'MUSIC', 'PHONE', 'PLANE', 'TIGER', 'OCEAN', 'STORM', 'CLOUD'];

function shuffle(s: string): string {
  const a = s.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('');
}

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

export default function GameWordScramble({ config, onComplete, onBack }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [word, setWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const scoreRef = useRef(0);

  const effective = getConfig(config, level);
  const rounds = (effective.rounds as number) || 5;
  const timePerWord = (effective.time_per_word_seconds as number) || 15;
  const levels = config.levels as Record<number, unknown> | undefined;
  scoreRef.current = score;

  useEffect(() => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(w);
    setScrambled(shuffle(w));
  }, [round]);

  useEffect(() => {
    if (levels && level === null) return;
    const t = setInterval(() => {
      setTimeLeft((l) => {
        if (l <= 0) {
          if (round + 1 >= rounds) onComplete(scoreRef.current);
          else setRound((r) => r + 1);
          return timePerWord;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [round, rounds, onComplete, timePerWord, levels, level]);

  useEffect(() => {
    if (level !== null) setTimeLeft(timePerWord);
  }, [level, timePerWord]);

  if (levels && level === null) {
    return <LevelSelect onSelect={setLevel} onBack={onBack} />;
  }

  const submit = () => {
    const correct = input.trim().toUpperCase() === word;
    const add = correct ? 20 + timeLeft * 2 : 0;
    setScore((s) => s + add);
    if (round + 1 >= rounds) {
      onComplete(score + add);
    } else {
      setRound((r) => r + 1);
      setInput('');
      setTimeLeft(timePerWord);
    }
  };

  const currentScrambled = scrambled || shuffle(word);

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setLevel(null)} className="px-3 py-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-xs">
          ← Back to levels
        </button>
        <span className="text-white">{timeLeft}s</span>
      </div>
      <div className="flex justify-between text-white mb-2">
        <span>Round {round + 1} / {rounds}</span>
      </div>
      <p className="text-slate-400 text-sm mb-2">Unscramble the word:</p>
      <p className="text-3xl font-mono font-bold text-amber-400 mb-4 tracking-widest">{currentScrambled}</p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white text-center text-xl font-mono uppercase"
        placeholder="Type your answer"
        maxLength={12}
      />
      <button
        type="button"
        onClick={submit}
        className="w-full mt-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
      >
        Submit
      </button>
      <p className="text-slate-500 text-xs mt-2 text-center">Score: {score}</p>
    </div>
  );
}
