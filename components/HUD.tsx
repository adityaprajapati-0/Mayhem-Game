
import React from 'react';
import { GameState, PlayerRole } from '../types';

interface HUDProps {
  gameState: GameState;
  narratorText: string;
  onLeave: () => void;
  isBitten: boolean;
}

const HUD: React.FC<HUDProps> = ({ gameState, narratorText, onLeave, isBitten }) => {
  const bitePercentage = (gameState.bites / 20) * 100;
  const aliveMosquitoes = gameState.players.filter(p => p.role === PlayerRole.MOSQUITO && p.isAlive);
  const localPlayer = gameState.players.find(p => p.id === gameState.localPlayerId);
  const localRole = localPlayer?.role;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-10 text-slate-900 select-none z-[200]">
      {/* Damage Flash */}
      <div className={`absolute inset-0 transition-opacity duration-200 pointer-events-none bg-red-600/10 ${isBitten ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-xl">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">Active Profile</div>
          <div className={`text-3xl font-black italic tracking-tighter ${localRole === PlayerRole.HUMAN ? 'text-blue-600' : 'text-red-600'}`}>
            {localRole === PlayerRole.HUMAN ? 'HOUSE GUARDIAN' : 'BLOOD PARASITE'}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 text-right shadow-xl">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">Parasite Count</div>
          <div className="text-5xl font-black text-red-600 tabular-nums">
            {aliveMosquitoes.length}
          </div>
        </div>
      </div>

      {/* Narrative text removed per user request */}
      <div className="flex flex-col items-center mb-8 relative z-10">
      </div>

      <div className="w-full max-w-3xl mx-auto mb-12 relative z-10">
        <div className="flex justify-between items-end mb-3 px-2">
          <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">Biological Integrity</span>
          <span className="text-5xl font-black tabular-nums text-slate-900">{Math.floor(gameState.bites)}<span className="text-xl text-slate-400 ml-1">/20</span></span>
        </div>
        <div className="h-5 w-full bg-slate-200 rounded-full overflow-hidden border border-white/50 p-1 shadow-inner">
          <div 
            className="h-full bg-red-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(220,38,38,0.4)] rounded-full"
            style={{ width: `${bitePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default HUD;
