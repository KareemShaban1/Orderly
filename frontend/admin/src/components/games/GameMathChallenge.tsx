import { useState, useEffect } from 'react';

function randomOp(): { a: number; b: number; op: string; result: number } {
  const op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 15) + 1;
  if (op === '-') { if (a < b) [a, b] = [b, a]; }
  if (op === '*') { a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * 9) + 1; }
  const result = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return { a, b, op, result };
}

interface Props {
  config: Record<string, unknown>;
  onComplete: (score: number) => void;
}

export default function GameMathChallenge({ config, onComplete }: Props) {
  const rounds = (config.rounds as number) || 5;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState(() => randomOp());
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const submit = () => {
    const num = parseInt(answer, 10);
    const correct = num === problem.result;
    if (correct) setScore((s) => s + 20);
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      if (index + 1 >= rounds) {
        onComplete(score + (correct ? 20 : 0));
      } else {
        setIndex((i) => i + 1);
        setProblem(randomOp());
        setAnswer('');
        setFeedback(null);
      }
    }, 1000);
  };

  const current = problem;

  return (
    <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
      <p className="text-slate-400 text-sm mb-2">Question {index + 1}/{rounds} | Score: {score}</p>
      <p className="text-white text-2xl my-6">{current.a} {current.op} {current.b} = ?</p>
      <input
        type="number"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white text-xl border border-slate-600 mb-4"
      />
      <button type="button" onClick={submit} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500">
        Submit
      </button>
      {feedback && <p className={`mt-4 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback === 'correct' ? 'Correct!' : 'Wrong'}</p>}
    </div>
  );
}
