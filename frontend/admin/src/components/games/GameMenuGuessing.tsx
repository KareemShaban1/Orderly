import { useState } from 'react';

const DISHES = ['Pizza', 'Burger', 'Sushi', 'Taco', 'Pasta', 'Salad', 'Soup', 'Steak', 'Curry', 'Ramen'];
const EMOJIS: Record<string, string> = { Pizza: '🍕', Burger: '🍔', Sushi: '🍣', Taco: '🌮', Pasta: '🍝', Salad: '🥗', Soup: '🍲', Steak: '🥩', Curry: '🍛', Ramen: '🍜' };

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameMenuGuessing({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(() => DISHES[Math.floor(Math.random() * DISHES.length)]);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const submit = () => {
    const correct = guess.trim().toLowerCase() === answer.toLowerCase();
    if (correct) setScore((s) => s + 20);
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      if (index + 1 >= rounds) onComplete(score + (correct ? 20 : 0));
      else { setIndex((i) => i + 1); setAnswer(DISHES[Math.floor(Math.random() * DISHES.length)]); setGuess(''); setFeedback(null); }
    }, 1500);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-slate-400 text-sm mb-2">Round {index + 1}/{rounds}. What dish is this?</p>
      <p className="text-7xl my-6 blur-sm select-none">{EMOJIS[answer]}</p>
      <input
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Guess the dish"
        className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white mb-2"
      />
      <button type="button" onClick={submit} className="btn btn-primary">Submit</button>
      {feedback && <p className={`mt-4 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback === 'correct' ? 'Correct!' : `It was ${answer}`}</p>}
    </div>
  );
}
