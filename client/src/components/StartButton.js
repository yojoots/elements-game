import React from 'react';
import { Play } from 'lucide-react';
import { useTooltipHelp } from './TooltipSystem';

const StartButton = ({ onClick }) => {
  const { isShowingHelp } = useTooltipHelp();

  if (isShowingHelp) return null;

  return (
    <button 
      title="Start"
      onClick={onClick}
      className="fixed bottom-4 right-4 p-2 text-blue-400 text-xs rounded shadow z-101 transition-opacity hover:opacity-90"
    >
      <span className="rainbow rainbow_text_animated start-text">Start</span>
      <Play fill="lightgreen" stroke="lightgreen" size={24} />
    </button>
  );
};

export default StartButton;