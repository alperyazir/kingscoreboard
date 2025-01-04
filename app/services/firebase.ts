import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Player, GameLog, GameLogEdit } from '../types';

// Define players constant
const PLAYERS: string[] = ['Tarık', 'Mete', 'Oğuzhan', 'Mali', 'Alper'];

// Players
export const initializePlayers = async (playerNames: string[]) => {
  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(playersRef);
  const existingPlayers = new Set(
    snapshot.docs.map(doc => doc.data().name)
  );

  const batch = writeBatch(db);
  let updatesNeeded = false;
  
  playerNames.forEach(name => {
    if (!existingPlayers.has(name)) {
      updatesNeeded = true;
      const newPlayerRef = doc(playersRef);
      batch.set(newPlayerRef, {
        name,
        wins: 0,
        losses: 0,
        total: 0,
        percentage: 0
      });
    }
  });

  if (updatesNeeded) {
    await batch.commit();
  }
};

export const getPlayers = async (): Promise<Player[]> => {
  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(query(playersRef, orderBy('percentage', 'desc')));
  return snapshot.docs.map(doc => ({ ...doc.data() as Player }));
};

export const updatePlayerStats = async (players: Player[]) => {
  const batch = writeBatch(db);
  const playersRef = collection(db, 'players');

  // First, get all existing players
  const snapshot = await getDocs(playersRef);
  const existingPlayers = new Map(
    snapshot.docs.map(doc => [doc.data().name, doc.id])
  );

  players.forEach(player => {
    if (existingPlayers.has(player.name)) {
      // Update existing player
      const docId = existingPlayers.get(player.name)!;
      const playerDoc = doc(playersRef, docId);
      batch.update(playerDoc, {
        name: player.name,
        wins: player.wins,
        losses: player.losses,
        total: player.total,
        percentage: player.percentage
      });
    } else {
      // Create new player document
      const newPlayerRef = doc(playersRef);
      batch.set(newPlayerRef, {
        name: player.name,
        wins: player.wins,
        losses: player.losses,
        total: player.total,
        percentage: player.percentage
      });
    }
  });

  await batch.commit();
};

// Game Logs
export const getGameLogs = async (): Promise<GameLog[]> => {
  const snapshot = await getDocs(collection(db, 'gameLogs'));
  
  // Convert dates but don't sort
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: new Date(data.timestamp),
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : undefined,
      editHistory: data.editHistory?.map((edit: GameLogEdit) => ({
        ...edit,
        timestamp: new Date(edit.timestamp)
      }))
    } as GameLog;
  });
};

export const addGameLog = async (gameLog: Omit<GameLog, 'id'>) => {
  const logsRef = collection(db, 'gameLogs');
  const docRef = await addDoc(logsRef, {
    ...gameLog,
    timestamp: new Date().toISOString()
  });
  
  // Update player stats
  await updatePlayerStatsFromLogs();
  
  return docRef.id;
};

export const updateGameLog = async (
  gameId: string, 
  updates: Partial<GameLog>
) => {
  const logRef = doc(db, 'gameLogs', gameId);
  
  // Convert any dates in editHistory to ISO strings
  const updatesWithStringDates = {
    ...updates,
    editHistory: updates.editHistory?.map(edit => ({
      ...edit,
      timestamp: edit.timestamp.toISOString()
    }))
  };

  await updateDoc(logRef, updatesWithStringDates);
  
  // Update player stats
  await updatePlayerStatsFromLogs();
};

export const deleteGameLog = async (gameId: string, deletedBy: string) => {
  const logRef = doc(db, 'gameLogs', gameId);
  await updateDoc(logRef, {
    deleted: true,
    deletedBy,
    deletedAt: new Date().toISOString()
  });
  
  // Update player stats
  await updatePlayerStatsFromLogs();
};

// Helper function to recalculate player stats
const updatePlayerStatsFromLogs = async () => {
  const logs = await getGameLogs();
  const playerStats: { [key: string]: Player } = {};

  // Initialize all players with zero stats
  PLAYERS.forEach((name: string) => {
    playerStats[name] = {
      name,
      wins: 0,
      losses: 0,
      total: 0,
      percentage: 0
    };
  });

  // Calculate stats only from non-deleted games
  logs.filter(log => !log.deleted).forEach(log => {
    log.winners.forEach(winner => {
      if (playerStats[winner]) {
        playerStats[winner].wins += 1;
        playerStats[winner].total += 1;
      }
    });

    log.losers.forEach(loser => {
      if (playerStats[loser]) {
        playerStats[loser].losses += 1;
        playerStats[loser].total += 1;
      }
    });
  });

  // Calculate percentages
  Object.values(playerStats).forEach(player => {
    player.percentage = player.total === 0 ? 0 : (player.wins / player.total) * 100;
  });

  // Update all players in Firebase
  await updatePlayerStats(Object.values(playerStats));
}; 