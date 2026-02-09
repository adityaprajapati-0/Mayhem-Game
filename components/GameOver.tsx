
import React from 'react';
import { PlayerRole } from '../types';

interface GameOverProps {
  winner: PlayerRole | null;
  onRestart: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ winner, onRestart, onMenu }) => {
  const isHumanWinner = winner === PlayerRole.HUMAN;

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 text-center p-6 backdrop-blur-3xl">
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.1)_0%,transparent_70%)] animate-pulse"></div>
      </div>

      <div className={`text-xl font-bold uppercase tracking-[0.5em] mb-6 ${isHumanWinner ? 'text-blue-500' : 'text-red-500'}`}>
        Simulation Concluded
      </div>
      
      <h1 className={`text-7xl md:text-[10rem] font-marker mb-10 leading-none drop-shadow-2xl ${isHumanWinner ? 'text-zinc-100' : 'text-red-700'}`}>
        {isHumanWinner ? 'HUMAN\nSUPREMACY' : 'SWARM\nASCENDANT'}
      </h1>

      <p className="text-zinc-500 text-lg max-w-xl mb-16 leading-relaxed font-medium uppercase tracking-widest whitespace-pre-line">
        {isHumanWinner 
          ? 'The domestic biome has been purged. Biological irritants successfully neutralized.' 
          : 'Host exhaustion reached threshold. The swarm has secured necessary nourishment for the colony.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        <button 
          onClick={onRestart}
          className={`px-16 py-6 rounded-2xl font-black text-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${
            isHumanWinner ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-700 hover:bg-red-600'
          }`}
        >
          RE-INITIATE
        </button>
        <button 
          onClick={onMenu}
          className="px-16 py-6 rounded-2xl font-black text-2xl bg-zinc-800 hover:bg-zinc-700 transition-all border border-white/10"
        >
          MENU
        </button>
      </div>

      <div className="mt-20 text-zinc-700 text-[10px] uppercase tracking-[0.4em] font-black italic">
        The cycle of the predator and the pest continues in the shadows.
      </div>
    </div>
  );
};

export default GameOver;
