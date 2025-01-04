'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLAYERS, PASSWORD } from './types';

export default function LoginPage() {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      // Store auth info in localStorage
      localStorage.setItem('auth_token', new Date().getTime().toString());
      localStorage.setItem('auth_player', selectedPlayer);
      router.push(`/scoreboard?player=${selectedPlayer}`);
    } else {
      setError('Yanlış şifre!');
    }
  };

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Giriş Yap</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-2">
              Oyuncu Seçin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLAYERS.map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => setSelectedPlayer(player)}
                  className={`p-2 rounded font-medium ${
                    selectedPlayer === player
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {player}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-2">
              Şifre
            </label>
            <input
              type="password"
              placeholder="Mete'nin ilk okul numarası"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded text-gray-900 placeholder-gray-500 border-gray-300"
              required
            />
          </div>
          {error && <p className="text-red-700 text-base font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={!selectedPlayer}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50 font-semibold text-base"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
