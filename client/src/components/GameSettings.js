import React, { useState } from 'react';

const GameSettings = ({ socket, room, isFirstPlayer, currentSettings, setShowSettings }) => {
  const [roundCount, setRoundCount] = useState(currentSettings?.roundCount || 5);
  const [roundDuration, setRoundDuration] = useState(currentSettings?.roundDuration || 20);
  const [numPlayers, setNumPlayers] = useState(currentSettings?.numPlayers || 4);
  const [marketVariance, setMarketVariance] = useState(currentSettings?.marketVariance || 5);
  const [attackFriction, setAttackFriction] = useState(currentSettings?.attackFriction || 0.5);
  const [lifeGrowthRate, setLifeGrowthRate] = useState(currentSettings?.lifeGrowthRate || 1.5);
  const [botBehavior, setBotBehavior] = useState(currentSettings?.botBehavior || "random");
  const [settingsLocked, setSettingsLocked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    socket.emit("updateGameSettings", {
      roomId: room,
      settings: {
        roundCount: Math.min(Math.max(parseInt(roundCount), 1), 20),
        roundDuration: Math.min(Math.max(parseInt(roundDuration), 5), 300),
        numPlayers: Math.min(Math.max(parseInt(numPlayers), 1), 20),
        marketVariance: Math.min(Math.max(parseInt(marketVariance), 1), 10),
        attackFriction: Math.min(Math.max(parseFloat(attackFriction), 0), 1),
        lifeGrowthRate: Math.min(Math.max(parseFloat(lifeGrowthRate), 1), 10),
        botBehavior: botBehavior
      }
    });
    setSettingsLocked(true);
  };

  const handleStartGame = () => {
    socket.emit("startGame", { roomId: room });
  };

  const botBehaviorOptions = [
    { value: "random", label: "Random" },
    { value: "aggressive", label: "Aggressive" },
    { value: "defensive", label: "Defensive" },
    { value: "balanced", label: "Smart" }
  ];

  return (
    <div className="fixed inset-y-0 flex min-w-full items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 transform transition-all">
        <div className="border-b border-gray-200 p-4">
          <button 
            onClick={() => setShowSettings(false)} 
            className="absolute top-2 right-2 text-gray-400 text-xl hover:text-gray-500"
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {isFirstPlayer ? 'Game Settings' : 'Current Game Settings'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isFirstPlayer 
              ? settingsLocked 
                ? 'Settings saved - ready to start the game.'
                : 'As the first player in this room, choose the game settings or leave everything blank to use the default settings. Click "Ready" to lock things in and begin.' 
              : 'Game settings are controlled by the first player to join the room.'}
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {isFirstPlayer ? (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6 text-black">
                {!settingsLocked && (
                  <button
                    type="submit" 
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Ready
                  </button>
                )}

                {settingsLocked && (
                  <button
                    onClick={handleStartGame}
                    className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors text-lg font-semibold"
                  >
                    Start Game
                  </button>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="numPlayers" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Players (1-20)
                    </label>
                    <input
                      id="numPlayers"
                      type="number"
                      min="1"
                      max="20"
                      value={numPlayers}
                      onChange={(e) => setNumPlayers(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="roundCount" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Rounds (1-20)
                    </label>
                    <input
                      id="roundCount"
                      type="number"
                      min="1"
                      max="20"
                      value={roundCount}
                      onChange={(e) => setRoundCount(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="roundDuration" className="block text-sm font-medium text-gray-700 mb-1">
                      Round Duration (5-300 seconds)
                    </label>
                    <input
                      id="roundDuration"
                      type="number"
                      min="5"
                      max="300"
                      value={roundDuration}
                      onChange={(e) => setRoundDuration(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="marketVariance" className="block text-sm font-medium text-gray-700 mb-1">
                      Market Variance (1-10)
                    </label>
                    <input
                      id="marketVariance"
                      type="number"
                      min="1"
                      max="10"
                      value={marketVariance}
                      onChange={(e) => setMarketVariance(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="attackFriction" className="block text-sm font-medium text-gray-700 mb-1">
                      Attack Friction (0-1)
                    </label>
                    <input
                      id="attackFriction"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={attackFriction}
                      onChange={(e) => setAttackFriction(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="lifeGrowthRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Life Growth Rate (1-10)
                    </label>
                    <input
                      id="lifeGrowthRate"
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={lifeGrowthRate}
                      onChange={(e) => setLifeGrowthRate(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="botBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                      Bot Behavior Profile
                    </label>
                    <select
                      id="botBehavior"
                      value={botBehavior}
                      onChange={(e) => setBotBehavior(e.target.value)}
                      disabled={settingsLocked}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {botBehaviorOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Players
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.numPlayers || 4}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Rounds
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.roundCount || 5}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Round Duration
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.roundDuration || 20} seconds
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Market Variance
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.marketVariance || 5}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attack Friction
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.attackFriction || 0.1}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Life Growth Rate
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.lifeGrowthRate || 1.5}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bot Behavior Profile
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currentSettings?.botBehavior || "Random"}
                </p>
              </div>
              <p className="text-sm text-gray-500 italic">
                Waiting for first player to start the game...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSettings;