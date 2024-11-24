import React, { createContext, useContext, useState } from 'react';
import { Info } from 'lucide-react';

// Create context for managing overlay state
const TooltipContext = createContext();

export const TooltipProvider = ({ children }) => {
  const [isShowingHelp, setIsShowingHelp] = useState(false);

  return (
    <TooltipContext.Provider value={{ isShowingHelp, setIsShowingHelp }}>
      {/* Info Icon */}
      <div 
        className="fixed top-10 left-6 z-50 cursor-help"
        onMouseEnter={() => setIsShowingHelp(true)}
        onMouseLeave={() => setIsShowingHelp(false)}
      >
        <Info className="w-6 h-6 text-blue-400 hover:text-blue-500 transition-colors" />
      </div>

      {/* Dark Overlay */}
      {isShowingHelp && (
        <div className="fixed inset-0 bg-black/60 z-3" />
      )}

      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltipHelp = () => {
    const context = useContext(TooltipContext);
    if (!context) {
      throw new Error('useTooltipHelp must be used within a TooltipProvider');
    }
    return context;
  };

  export const ForceVisibleWhen = ({ children, when, className = "" }) => {
    const { isShowingHelp } = useTooltipHelp();
    
    if (!when && !isShowingHelp) return null;
    
    return (
      <div className={`${className} ${isShowingHelp ? "!visible !opacity-100" : ""}`}>
        {children}
      </div>
    );
  };

export const InfoBubble = ({ children, className = "", direction = "down", tooltipStyle }) => {
  const { isShowingHelp } = useContext(TooltipContext);

  if (!isShowingHelp) return null;

  const trianglePosition = {
    down: "-bottom-2 left-1/2 transform -translate-x-1/2",
    up: "-top-2 left-1/2 transform -translate-x-1/2",
    left: "-left-2 top-1/2 transform -translate-y-1/2",
    right: "-right-2 top-1/2 transform -translate-y-1/2",
    lowright: "-right-2 top-1/2 transform mt-6",
    downright: "-bottom-2 left-1/2 transform -translate-x-1/2 ml-6",
    upperleft: "-top-2 right-1/2 transform mr-6",
  };

  const triangleRotation = {
    down: "rotate-45",
    up: "-rotate-45",
    left: "-rotate-45",
    right: "rotate-45",
    lowright: "rotate-45",
    downright: "rotate-45",
    upperleft: "-rotate-45"
  };

  return (
    <div className={`absolute z-50 bg-white rounded-lg p-3 shadow-lg max-w-64 animate-bounce-slow ${className}`} style={tooltipStyle}>
      <p className="text-sm text-gray-700 text-center">{children}</p>
      <div className={`absolute ${trianglePosition[direction]} w-4 h-4 bg-white ${triangleRotation[direction]}`} />
    </div>
  );
};