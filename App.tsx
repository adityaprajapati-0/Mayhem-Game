
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GamePhase, PlayerRole, GameState, PlayerInfo } from './types';
import Lobby from './components/Lobby';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import GameOver from './components/GameOver';
import MobileControls from './components/MobileControls';
import { GoogleGenAI } from "@google/genai";

const FALLBACK_NARRATIONS = ["", ""];

const App: React.FC = () => {
  const initialGameState: GameState = {
    phase: GamePhase.LOBBY,
    roomCode: null,
    isHost: false,
    players: [],
    localPlayerId: 'player-' + Math.random().toString(36).substr(2, 9),
    bites: 0,
    winner: null,
    humanHealth: 20
  };

  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [narratorText, setNarratorText] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  
  const lastBiteLevelRef = useRef(0);
  const lastHealthRef = useRef(5);
  const flashTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) handleJoinRoom(roomFromUrl);
    return () => { if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (gameState.phase !== GamePhase.PLAYING) return;
    const localPlayer = gameState.players.find(p => p.id === gameState.localPlayerId);
    if (!localPlayer) return;

    let triggerFlash = false;
    if (localPlayer.role === PlayerRole.HUMAN) {
      const currentBiteLevel = Math.floor(gameState.bites);
      if (currentBiteLevel > lastBiteLevelRef.current) {
        lastBiteLevelRef.current = currentBiteLevel;
        triggerFlash = true;
      }
    } else if (localPlayer.health < lastHealthRef.current) {
        triggerFlash = true;
        lastHealthRef.current = localPlayer.health;
    }

    if (triggerFlash) {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      setFlashRed(true);
      flashTimeoutRef.current = window.setTimeout(() => {
        setFlashRed(false);
        flashTimeoutRef.current = null;
      }, 500);
    }
  }, [gameState.bites, gameState.players, gameState.phase, gameState.localPlayerId]);

  const fetchNarration = useCallback(async (event: string) => {
    // Narrator is now silent to keep the screen clean
    setNarratorText("");
  }, []);

  const handleSinglePlayer = (selectedRole: PlayerRole | 'RANDOM' = 'RANDOM') => {
    const botsCount = 10;
    const players: PlayerInfo[] = [];
    const role = selectedRole === 'RANDOM' ? (Math.random() > 0.5 ? PlayerRole.HUMAN : PlayerRole.MOSQUITO) : selectedRole;

    players.push({
      id: gameState.localPlayerId!,
      name: "Subject Delta",
      role: role,
      isBot: false,
      isAlive: true,
      position: role === PlayerRole.HUMAN ? [0, 0, 0] : [40, 10, 40],
      rotation: [0, 0, 0],
      health: role === PlayerRole.HUMAN ? 20 : 5
    });

    if (role === PlayerRole.HUMAN) {
      for (let i = 0; i < botsCount; i++) {
        players.push({
          id: `bot-mosquito-${i}`,
          name: `Swarm Alpha-${i}`,
          role: PlayerRole.MOSQUITO,
          isBot: true,
          isAlive: true,
          position: [(Math.random() - 0.5) * 100, 15 + Math.random() * 10, (Math.random() - 0.5) * 100],
          rotation: [0, 0, 0],
          health: 5
        });
      }
    } else {
        players.push({
          id: `bot-human-01`,
          name: `The Specimen`,
          role: PlayerRole.HUMAN,
          isBot: true,
          isAlive: true,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          health: 20
        });
    }

    setGameState(prev => ({
      ...prev,
      phase: GamePhase.PLAYING,
      players,
      bites: 0,
      isHost: true,
      roomCode: "LOCAL"
    }));
  };

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.WAITING_FOR_PLAYERS,
      roomCode: code,
      isHost: true,
      players: [{
        id: prev.localPlayerId!,
        name: "Host Node",
        role: PlayerRole.HUMAN,
        isBot: false,
        isAlive: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        health: 20
      }]
    }));
    window.history.pushState({}, '', `?room=${code}`);
  };

  const handleJoinRoom = (code: string) => {
    const cleanCode = code.toUpperCase();
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.WAITING_FOR_PLAYERS,
      roomCode: cleanCode,
      isHost: false,
      players: [
        { id: 'host-id', name: "Host Node", role: PlayerRole.HUMAN, isBot: false, isAlive: true, position: [0,0,0], rotation:[0,0,0], health: 20 },
        { id: prev.localPlayerId!, name: "Visitor", role: PlayerRole.MOSQUITO, isBot: false, isAlive: true, position: [15,10,15], rotation:[0,0,0], health: 5 }
      ]
    }));
    window.history.pushState({}, '', `?room=${cleanCode}`);
  };

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.PLAYING,
      bites: 0,
      players: prev.players.map((p, i) => ({
        ...p,
        role: i === 0 ? PlayerRole.HUMAN : PlayerRole.MOSQUITO,
        position: i === 0 ? [0, 0, 0] : [(Math.random() - 0.5) * 50, 12, (Math.random() - 0.5) * 50],
        health: i === 0 ? 20 : 5,
        isAlive: true
      }))
    }));
  };

  const updateStats = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      const aliveMosquitoes = newState.players.filter(p => p.role === PlayerRole.MOSQUITO && p.isAlive);
      const localPlayer = newState.players.find(p => p.id === newState.localPlayerId);
      
      if (newState.phase === GamePhase.PLAYING) {
        if (newState.bites >= 20) {
          newState.phase = GamePhase.GAMEOVER;
          newState.winner = PlayerRole.MOSQUITO;
        } else if (aliveMosquitoes.length === 0 || (localPlayer && !localPlayer.isAlive && localPlayer.role === PlayerRole.MOSQUITO && newState.roomCode === "LOCAL")) {
          newState.phase = GamePhase.GAMEOVER;
          newState.winner = PlayerRole.HUMAN;
        }
      }
      return newState;
    });
  }, []);

  const resetToLobby = () => {
    window.history.pushState({}, '', window.location.pathname);
    setGameState({ ...initialGameState, players: [] });
    setNarratorText("");
  };

  return (
    <div className={`relative w-full h-full bg-slate-100 touch-none overflow-hidden select-none`}>
      {gameState.phase === GamePhase.LOBBY && (
        <Lobby onStart={handleCreateRoom} onJoin={handleJoinRoom} onSinglePlayer={handleSinglePlayer} roomCode={gameState.roomCode} />
      )}
      {gameState.phase === GamePhase.WAITING_FOR_PLAYERS && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-[80] text-slate-900 p-10">
          <div className="bg-white border border-slate-200 p-12 rounded-[3rem] flex flex-col items-center max-w-lg w-full shadow-2xl">
            <h2 className="text-4xl font-marker mb-2 text-slate-800">SECURE ROOM: <span className="text-red-600">{gameState.roomCode}</span></h2>
            <div className="flex flex-col gap-3 mb-10 w-full mt-10">
              {gameState.players.map(p => (
                <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="font-bold tracking-widest uppercase text-xs text-slate-600">{p.name}</span>
                  <span className="text-[9px] font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full border border-green-200">Ready</span>
                </div>
              ))}
            </div>
            {gameState.isHost && (
              <button onClick={startGame} className="w-full bg-red-600 py-6 rounded-2xl font-black uppercase tracking-widest text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/20">
                INITIATE PROTOCOL
              </button>
            )}
            <button onClick={resetToLobby} className="mt-8 text-slate-400 text-[10px] uppercase font-black hover:text-slate-900 transition-colors">Abort Connection</button>
          </div>
        </div>
      )}
      {gameState.phase === GamePhase.PLAYING && (
        <>
          <GameScene gameState={gameState} onStatsUpdate={updateStats} />
          <HUD gameState={gameState} narratorText={narratorText} onLeave={resetToLobby} isBitten={flashRed} />
          {isMobile && <MobileControls role={gameState.players.find(p=>p.id===gameState.localPlayerId)?.role || PlayerRole.HUMAN} />}
        </>
      )}
      {gameState.phase === GamePhase.GAMEOVER && (
        <GameOver winner={gameState.winner} onRestart={() => handleSinglePlayer()} onMenu={resetToLobby} />
      )}
    </div>
  );
};

export default App;
