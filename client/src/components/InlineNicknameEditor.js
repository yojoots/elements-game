import React, { useState } from 'react';
import { Pencil } from 'lucide-react';

const InlineNicknameEditor = ({ 
  currentNickname, 
  onSubmit, 
  displayName, 
  roundNumber,
  color
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nicknameInput.trim()) {
      onSubmit(e);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    if (roundNumber > 0) return; // Don't allow editing after round 0
    setNicknameInput(currentNickname);
    setIsEditing(true);
  };

  // Handle escape key to cancel editing
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 nickname-input"
            placeholder="Edit nickname"
            autoFocus
          />
          <button type="submit" className="ml-2 text-blue-400 hover:text-blue-600">
            <Pencil size={16} />
          </button>
        </form>
      ) : (
        <>
          <span style={{color: color}}>{currentNickname.length > 0 ? currentNickname : displayName}</span>
          {roundNumber <= 0 && (
            <button 
              onClick={startEditing}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit nickname"
            >
              <Pencil size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default InlineNicknameEditor;