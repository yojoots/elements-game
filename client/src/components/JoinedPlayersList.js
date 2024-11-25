import React from 'react';

const JoinedPlayersList = ({ players, currentUserId }) => {
  // Filter out bots and sort players so current user appears first
  const humanPlayers = players
    .filter(player => !player.isBot)
    .sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return 0;
    });

  return (
    <div className="text-white w-full max-w-md mx-auto my-4 rounded-lg shadow p-4 mt-4">
      <div className="border-b pb-2 mb-3">
        <h2 className="text-lg font-semibold">
          👥 Joined Players ({humanPlayers.length})
        </h2>
      </div>
      <ul className="space-y-2">
        {humanPlayers.map((player) => (
          <li 
            key={player.id} 
            className="flex items-center gap-2 p-2 rounded-lg"
          >
            <span 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: player.color }}
            />
            <span className="font-medium">
              {player.nickname}
              {player.id === currentUserId && " (You)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JoinedPlayersList;