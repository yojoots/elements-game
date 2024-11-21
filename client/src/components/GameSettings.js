import React, { useState } from 'react';

const GameSettings = ({ socket, room, isFirstPlayer, currentSettings, userUid }) => {
  const [roundCount, setRoundCount] = useState(currentSettings?.roundCount || 5);
  const [roundDuration, setRoundDuration] = useState(currentSettings?.roundDuration || 20);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    socket.emit("updateGameSettings", {
      roomId: room,
      userUid: userUid,
      settings: {
        roundCount: Math.min(Math.max(parseInt(roundCount), 1), 20), // Limit between 1-20 rounds
        roundDuration: Math.min(Math.max(parseInt(roundDuration), 5), 300), // Limit between 5-300 seconds
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4 p-4 bg-white rounded-lg shadow text-black">
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          {isFirstPlayer ? 'Configure Game Settings' : 'Current Game Settings'}
        </h2>
      </div>
      
      <div className="p-4">
        {isFirstPlayer ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roundCount" className="block font-medium">
                Number of Rounds (1-20)
              </label>
              <input
                id="roundCount"
                type="number"
                min="1"
                max="20"
                value={roundCount}
                onChange={(e) => setRoundCount(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="roundDuration" className="block font-medium">
                Round Duration (5-300 seconds)
              </label>
              <input
                id="roundDuration"
                type="number"
                min="5"
                max="300"
                value={roundDuration}
                onChange={(e) => setRoundDuration(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Settings
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-medium">Number of Rounds</label>
              <p className="text-lg">{currentSettings?.roundCount || 5}</p>
            </div>
            <div>
              <label className="block font-medium">Round Duration</label>
              <p className="text-lg">{currentSettings?.roundDuration || 20} seconds</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSettings;