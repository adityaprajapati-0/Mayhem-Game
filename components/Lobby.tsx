
import React, { useState } from 'react';
import { PlayerRole } from '../types';

interface LobbyProps {
  onStart: () => void;
  onJoin: (code: string) => void;
  onSinglePlayer: (role: PlayerRole | 'RANDOM') => void;
  roomCode: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ onStart, onJoin, onSinglePlayer, roomCode }) => {
  const [inputCode, setInputCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [showSinglePlayerRole, setShowSinglePlayerRole] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508] z-50 p-6 text-white text-center overflow-auto">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="max-w-5xl w-full z-10 flex flex-col items-center">
        <div className="mb-2 transition-transform duration-700 hover:scale-105">
           <h1 className="text-7xl md:text-[10rem] font-marker text-white leading-none tracking-tighter select-none">
            MOSQUITO<br/>
            <span className="text-red-600 drop-shadow-[0_0_40px_rgba(220,38,38,0.6)]">MAYHEM</span>
          </h1>
        </div>
        <p className="text-zinc-500 text-sm uppercase tracking-[0.8em] mb-20 font-black opacity-80">Asymmetrical Bio-Warfare Simulator</p>
        
        {!showJoin && !showSinglePlayerRole && (
          <div className="flex flex-col gap-6 items-center w-full max-w-md">
            <button 
              onClick={() => setShowSinglePlayerRole(true)}
              className="group relative w-full py-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-2xl font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1"
            >
              SINGLE PLAYER
              <div className="text-[9px] text-zinc-500 mt-1 font-bold">vs Bot Swarm</div>
            </button>

            <button 
              onClick={onStart}
              className="group relative w-full py-7 bg-red-600 rounded-2xl text-2xl font-black uppercase tracking-[0.2em] hover:bg-red-500 transition-all shadow-[0_0_50px_rgba(220,38,38,0.3)] hover:shadow-[0_0_70px_rgba(220,38,38,0.5)] transform hover:-translate-y-1 active:translate-y-0"
            >
              CREATE ROOM
              <div className="text-[9px] text-red-200 mt-1 font-bold">Multiplayer Host</div>
            </button>

            <button 
              onClick={() => setShowJoin(true)}
              className="w-full py-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-2xl font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1"
            >
              JOIN ROOM
              <div className="text-[9px] text-zinc-500 mt-1 font-bold">Connect to Code</div>
            </button>
          </div>
        )}

        {showSinglePlayerRole && (
          <div className="flex flex-col gap-4 items-center w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-black mb-4 tracking-[0.3em] text-zinc-400 uppercase">Select Role</h2>
            <button 
              onClick={() => onSinglePlayer(PlayerRole.HUMAN)}
              className="group relative w-full py-5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-2xl text-xl font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1"
            >
              HUMAN
              <div className="text-[8px] text-blue-200 mt-1 font-bold italic">Protect the flesh</div>
            </button>
            <button 
              onClick={() => onSinglePlayer(PlayerRole.MOSQUITO)}
              className="group relative w-full py-5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-2xl text-xl font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1"
            >
              MOSQUITO
              <div className="text-[8px] text-red-200 mt-1 font-bold italic">The Silent Feeder</div>
            </button>
            <button 
              onClick={() => onSinglePlayer('RANDOM')}
              className="group relative w-full py-5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl text-xl font-black uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 shadow-lg"
            >
              RANDOM ROLE
              <div className="text-[8px] text-zinc-500 mt-1 font-bold italic">Let Fate Decide</div>
            </button>
            <button 
              onClick={() => setShowSinglePlayerRole(false)}
              className="mt-4 text-zinc-500 text-[10px] uppercase font-black hover:text-white transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {showJoin && (
          <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 mb-8 shadow-2xl w-full max-w-md mx-auto transition-all animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-black mb-8 tracking-[0.3em] text-zinc-400">ACCESS CODE</h2>
            <input 
              type="text" 
              maxLength={4}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="----"
              autoFocus
              className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-6 text-6xl text-center font-black tracking-[0.5em] focus:border-red-600 outline-none transition-all mb-8 placeholder:opacity-20"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => onJoin(inputCode)}
                disabled={inputCode.length < 4}
                className="flex-[2] bg-red-600 py-6 rounded-2xl font-black text-xl hover:bg-red-500 disabled:opacity-30 transition-all shadow-xl"
              >
                CONNECT
              </button>
              <button 
                onClick={() => setShowJoin(false)}
                className="flex-1 bg-zinc-800 px-8 py-6 rounded-2xl font-black text-xl hover:bg-zinc-700 transition-all"
              >
                BACK
              </button>
            </div>
          </div>
        )}

        <div className="mt-24 text-zinc-800 text-[10px] uppercase tracking-[0.4em] font-black space-y-3 max-w-lg mx-auto leading-relaxed opacity-60">
          <p>Real-time Kinematics • Dynamic Volumetrics • AI Swarm Intelligence</p>
          <div className="flex justify-center gap-6 pt-4 border-t border-white/5">
            <span className="text-zinc-600">WASD: MOVE</span>
            <span className="text-zinc-600">SWIPE: LOOK</span>
            <span className="text-zinc-600">CLICK: ACTION</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
