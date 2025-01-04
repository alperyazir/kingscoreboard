'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Player, GameLog, GameLogEdit, PLAYERS } from '../types';
import * as FirebaseService from '../services/firebase';

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPlayer = searchParams.get('player');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [selectedLosers, setSelectedLosers] = useState<string[]>([]);
  const [editingGame, setEditingGame] = useState<GameLog | null>(null);
  const [deletingGame, setDeletingGame] = useState<GameLog | null>(null);

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('auth_token');
    const authPlayer = localStorage.getItem('auth_player');
    
    if (!authToken || !authPlayer || authPlayer !== currentPlayer) {
      router.push('/');
      return;
    }

    // Initialize data
    const loadData = async () => {
      try {
        // Initialize players if needed
        await FirebaseService.initializePlayers(PLAYERS);

        // Get players and game logs
        const [fetchedPlayers, fetchedLogs] = await Promise.all([
          FirebaseService.getPlayers(),
          FirebaseService.getGameLogs()
        ]);

        setPlayers(fetchedPlayers);
        setGameLogs(fetchedLogs);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [currentPlayer, router]);

  const handlePlayerSelection = (player: string, type: 'winner' | 'loser') => {
    if (type === 'winner') {
      if (selectedWinners.includes(player)) {
        setSelectedWinners(prev => prev.filter(p => p !== player));
      } else if (!selectedLosers.includes(player) && selectedWinners.length + selectedLosers.length < 4) {
        setSelectedWinners(prev => [...prev, player]);
      }
    } else {
      if (selectedLosers.includes(player)) {
        setSelectedLosers(prev => prev.filter(p => p !== player));
      } else if (!selectedWinners.includes(player) && selectedWinners.length + selectedLosers.length < 4) {
        setSelectedLosers(prev => [...prev, player]);
      }
    }
  };

  const saveGame = async () => {
    const newLog: Omit<GameLog, 'id'> = {
      timestamp: new Date(),
      winners: selectedWinners,
      losers: selectedLosers,
      addedBy: currentPlayer || '',
      editHistory: []
    };

    try {
      // Add new game log
      await FirebaseService.addGameLog(newLog);

      // Fetch updated data
      const [updatedPlayers, updatedLogs] = await Promise.all([
        FirebaseService.getPlayers(),
        FirebaseService.getGameLogs()
      ]);

      setPlayers(updatedPlayers);
      setGameLogs(updatedLogs);
      setShowNewGameModal(false);
      setSelectedWinners([]);
      setSelectedLosers([]);
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleEditGame = (game: GameLog) => {
    setEditingGame(game);
    setSelectedWinners(game.winners);
    setSelectedLosers(game.losers);
    setShowNewGameModal(true);
  };

  const handleDeleteGame = async (game: GameLog) => {
    setDeletingGame(game);
  };

  const confirmDelete = async () => {
    if (!deletingGame || !currentPlayer) return;

    try {
      await FirebaseService.deleteGameLog(deletingGame.id, currentPlayer);
      
      // Fetch updated data
      const [updatedPlayers, updatedLogs] = await Promise.all([
        FirebaseService.getPlayers(),
        FirebaseService.getGameLogs()
      ]);

      setPlayers(updatedPlayers);
      setGameLogs(updatedLogs);
      setDeletingGame(null);
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const saveEditedGame = async () => {
    if (!editingGame) return;

    const editLog: GameLogEdit = {
      timestamp: new Date(),
      editedBy: currentPlayer || '',
      previousWinners: editingGame.winners,
      previousLosers: editingGame.losers,
      newWinners: selectedWinners,
      newLosers: selectedLosers
    };

    try {
      await FirebaseService.updateGameLog(editingGame.id, {
        winners: selectedWinners,
        losers: selectedLosers,
        editHistory: [...(editingGame.editHistory || []), editLog]
      });

      // Fetch updated data
      const [updatedPlayers, updatedLogs] = await Promise.all([
        FirebaseService.getPlayers(),
        FirebaseService.getGameLogs()
      ]);

      setPlayers(updatedPlayers);
      setGameLogs(updatedLogs);
      setShowNewGameModal(false);
      setSelectedWinners([]);
      setSelectedLosers([]);
      setEditingGame(null);
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_player');
    router.push('/');
  };

  // Get sorted players and leaders
  const sortedPlayers = [...players].sort((a, b) => b.percentage - a.percentage);
  const topPercentage = sortedPlayers[0]?.percentage || 0;
  const leaders = sortedPlayers.filter(player => 
    player.percentage === topPercentage && player.total > 0
  );

  return (
    <div className="min-h-screen bg-green-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            King Çetele
          </h1>
          <div className="text-2xl font-bold text-yellow-300">2025</div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 font-semibold text-base"
          >
            Çıkış Yap
          </button>
        </div>

        {/* 2024 Champion Banner - Static */}
        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-semibold">2024 Şampiyonu</span>
              <h2 className="text-3xl font-bold">Tarık</h2>
            </div>
            <div className="text-right">
              <span className="text-5xl font-bold">%60</span>
              <div className="text-base font-medium">Kazanma Oranı</div>
            </div>
          </div>
        </div>

        {/* Current Year Champion Banner - Dynamic */}
        {leaders.length > 0 && leaders[0].total > 0 && (
          <div className="bg-green-600 text-white p-6 rounded-lg shadow-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-semibold">2025 Sıralaması</span>
                <h2 className="text-3xl font-bold">
                  {leaders.length === 1 
                    ? leaders[0].name 
                    : leaders.map(p => p.name).join(' & ')}
                </h2>
                {leaders.length > 1 && (
                  <p className="text-base font-medium">Liderliği paylaşıyor</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-5xl font-bold">%{topPercentage.toFixed(1)}</span>
                <div className="text-base font-medium">Kazanma Oranı</div>
              </div>
            </div>
          </div>
        )}

        {/* Scoreboard Table */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6 overflow-auto">
          <div className="min-w-[600px]"> {/* Minimum genişlik garantisi */}
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3 font-bold text-gray-900 text-xl">Oyuncu</th>
                  <th className="p-3 font-bold text-gray-900 text-xl">Kazandı</th>
                  <th className="p-3 font-bold text-gray-900 text-xl">Kaybetti</th>
                  <th className="p-3 font-bold text-gray-900 text-xl">Toplam</th>
                  <th className="p-3 font-bold text-gray-900 text-xl">Yüzde</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => (
                  <tr 
                    key={player.name} 
                    className={`border-b hover:bg-gray-100 ${
                      index % 2 === 0 
                        ? 'bg-white' 
                        : 'bg-gray-100'
                    }`}
                  >
                    <td className="p-3 text-gray-900 font-bold text-lg whitespace-nowrap">{player.name}</td>
                    <td className="p-3 text-center text-gray-900 font-semibold text-lg">{player.wins}</td>
                    <td className="p-3 text-center text-gray-900 font-semibold text-lg">{player.losses}</td>
                    <td className="p-3 text-center text-gray-900 font-semibold text-lg">{player.total}</td>
                    <td className="p-3 text-center text-gray-900 font-semibold text-lg">{player.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Responsive padding for mobile */}
        <div className="px-2 sm:px-0">
          <button
            onClick={() => setShowNewGameModal(true)}
            className="bg-yellow-500 text-white px-8 py-4 rounded-lg shadow hover:bg-yellow-600 mx-auto block mb-6 font-bold text-xl w-full sm:w-auto"
          >
            Yeni Oyun
          </button>
        </div>

        {/* Game History */}
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">Oyun Geçmişi</h2>
          <div className="space-y-4">
            {gameLogs
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((log) => (
              <div 
                key={log.id} 
                className={`border rounded-lg p-3 sm:p-4 ${
                  log.deleted 
                    ? 'bg-red-50 border-red-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                  <p className="text-base sm:text-lg text-gray-900 font-semibold">
                    {new Date(log.timestamp).toLocaleString('tr-TR')} - {log.addedBy} tarafından eklendi
                    {log.deleted && (
                      <span className="block sm:inline ml-0 sm:ml-2 text-red-600">
                        (Silindi - {new Date(log.deletedAt!).toLocaleString('tr-TR')} - {log.deletedBy} tarafından)
                      </span>
                    )}
                  </p>
                  {!log.deleted && (
                    <div className="flex space-x-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleEditGame(log)}
                        className="text-blue-700 hover:text-blue-800 text-base sm:text-lg font-semibold"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteGame(log)}
                        className="text-red-700 hover:text-red-800 text-base sm:text-lg font-semibold"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-900 mb-3 text-base sm:text-lg break-words">
                  <span className="text-green-800 font-bold">Kazananlar: {log.winners.join(', ')}</span>
                  <br className="sm:hidden" /> 
                  <span className="hidden sm:inline"> | </span>
                  <span className="text-red-800 font-bold">Kaybedenler: {log.losers.join(', ')}</span>
                </p>
                {log.editHistory && log.editHistory.length > 0 && (
                  <div className="mt-3 text-lg text-gray-900">
                    <p className="font-bold">Düzenleme Geçmişi:</p>
                    <div className="space-y-3">
                      {log.editHistory.map((edit, editIndex) => (
                        <div key={`${log.id}-edit-${editIndex}`} className="ml-4 mt-2 border-l-2 border-gray-400 pl-3">
                          <p className="text-gray-900 font-semibold">
                            {new Date(edit.timestamp).toLocaleString('tr-TR')} - {edit.editedBy} tarafından düzenlendi
                          </p>
                          <p className="text-lg text-gray-800 font-medium">
                            Eski: Kazananlar: {edit.previousWinners.join(', ')} | Kaybedenler: {edit.previousLosers.join(', ')}
                          </p>
                          <p className="text-lg text-gray-800 font-medium">
                            Yeni: Kazananlar: {edit.newWinners.join(', ')} | Kaybedenler: {edit.newLosers.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNewGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingGame ? 'Oyunu Düzenle' : 'Yeni Oyun'}
            </h2>
            <p className="text-base text-gray-900 mb-4 font-medium">
              Oyuncular ya kazananlar ya da kaybedenler arasında olabilir.
            </p>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2 text-gray-900">Kazananlar</h3>
              <p className="text-base text-gray-900 mb-2 font-medium">
                Toplam seçilen: {selectedWinners.length + selectedLosers.length}/4
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PLAYERS.map(player => (
                  <button
                    key={player}
                    onClick={() => handlePlayerSelection(player, 'winner')}
                    disabled={
                      selectedLosers.includes(player) || 
                      (!selectedWinners.includes(player) && selectedWinners.length + selectedLosers.length >= 4)
                    }
                    className={`p-2 rounded font-medium ${
                      selectedWinners.includes(player)
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : selectedLosers.includes(player) || (!selectedWinners.includes(player) && selectedWinners.length + selectedLosers.length >= 4)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {player}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2 text-gray-900">Kaybedenler</h3>
              <div className="grid grid-cols-2 gap-2">
                {PLAYERS.map(player => (
                  <button
                    key={player}
                    onClick={() => handlePlayerSelection(player, 'loser')}
                    disabled={
                      selectedWinners.includes(player) || 
                      (!selectedLosers.includes(player) && selectedWinners.length + selectedLosers.length >= 4)
                    }
                    className={`p-2 rounded font-medium ${
                      selectedLosers.includes(player)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : selectedWinners.includes(player) || (!selectedLosers.includes(player) && selectedWinners.length + selectedLosers.length >= 4)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {player}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewGameModal(false);
                  setSelectedWinners([]);
                  setSelectedLosers([]);
                  setEditingGame(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded text-gray-900 font-medium hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={editingGame ? saveEditedGame : saveGame}
                disabled={
                  selectedWinners.length + selectedLosers.length !== 4 || 
                  selectedWinners.length === 0 || 
                  selectedLosers.length === 0
                }
                className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600"
              >
                {editingGame ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Oyun Silme Onayı</h2>
            <p className="text-base text-gray-900 mb-6">
              Bu oyunu silmek istediğinize emin misiniz?
            </p>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {new Date(deletingGame.timestamp).toLocaleString('tr-TR')} - {deletingGame.addedBy} tarafından eklendi
              </p>
              <p className="text-gray-900">
                <span className="text-green-800 font-semibold">Kazananlar: {deletingGame.winners.join(', ')}</span>
                {' | '}
                <span className="text-red-800 font-semibold">Kaybedenler: {deletingGame.losers.join(', ')}</span>
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingGame(null)}
                className="px-4 py-2 bg-gray-200 rounded text-gray-900 font-medium hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScoreboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-white text-2xl">Yükleniyor...</div>
      </div>
    }>
      <ScoreboardContent />
    </Suspense>
  );
} 