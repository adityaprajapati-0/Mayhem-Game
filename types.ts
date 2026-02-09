
export enum GamePhase {
  LOBBY = 'LOBBY',
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS', // In a specific room but not started
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export enum PlayerRole {
  HUMAN = 'HUMAN',
  MOSQUITO = 'MOSQUITO'
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: PlayerRole;
  isBot: boolean;
  isAlive: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number; // 5 for Mosquito
}

export interface GameState {
  phase: GamePhase;
  roomCode: string | null;
  isHost: boolean;
  players: PlayerInfo[];
  localPlayerId: string | null;
  bites: number; // Cumulative bites (Human dies at 20)
  winner: PlayerRole | null;
  humanHealth: number; // Initial 20
}
