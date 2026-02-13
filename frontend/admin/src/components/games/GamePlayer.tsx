interface Game {
  id: number;
  name: string;
  type: string;
  config: Record<string, unknown> | null;
}

import GameReactionTime from './GameReactionTime';
import GameMerge2048 from './GameMerge2048';
import GameSnake from './GameSnake';
import GameFlappyDodge from './GameFlappyDodge';
import GameAimTrainer from './GameAimTrainer';
import GameSimonSays from './GameSimonSays';
import GameWordScramble from './GameWordScramble';
import GameQuickMath from './GameQuickMath';
import GameWhackMole from './GameWhackMole';

interface GamePlayerProps {
  game: Game;
  onClose: () => void;
}

export default function GamePlayer({ game, onClose }: GamePlayerProps) {
  const config = game.config || {};

  const renderGame = () => {
    const complete = (score: number) => {
      alert(`Game over! Score: ${score}`);
      onClose();
    };
    switch (game.type) {
      case 'reaction_time':
        return <GameReactionTime config={config} onComplete={complete} onBack={onClose} />;
      case 'merge_2048':
        return <GameMerge2048 config={config} onComplete={complete} onBack={onClose} />;
      case 'snake':
        return <GameSnake config={config} onComplete={complete} onBack={onClose} />;
      case 'flappy_dodge':
        return <GameFlappyDodge config={config} onComplete={complete} onBack={onClose} />;
      case 'aim_trainer':
        return <GameAimTrainer config={config} onComplete={complete} onBack={onClose} />;
      case 'simon_says':
        return <GameSimonSays config={config} onComplete={complete} onBack={onClose} />;
      case 'word_scramble':
        return <GameWordScramble config={config} onComplete={complete} onBack={onClose} />;
      case 'quick_math':
        return <GameQuickMath config={config} onComplete={complete} onBack={onClose} />;
      case 'whack_mole':
        return <GameWhackMole config={config} onComplete={complete} onBack={onClose} />;
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            <p>Game type &quot;{game.type}&quot; is not implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-slate-800">
        <h2 className="text-lg font-semibold text-white">{game.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {renderGame()}
      </div>
    </div>
  );
}
