export interface Player {
  name: string;
  wins: number;
  losses: number;
  total: number;
  percentage: number;
}

export interface GameLogEdit {
  timestamp: Date;
  editedBy: string;
  previousWinners: string[];
  previousLosers: string[];
  newWinners: string[];
  newLosers: string[];
}

export interface GameLog {
  id: string;
  timestamp: Date;
  winners: string[];
  losers: string[];
  addedBy: string;
  editHistory?: GameLogEdit[];
  deleted?: boolean;
  deletedBy?: string;
  deletedAt?: Date;
}

export const PLAYERS = ['Alper', 'Mete', 'Oğuzhan', 'Tarık', 'Mali'];
export const PASSWORD = '650'; 