import React, { useState } from 'react';
import { Sword } from 'lucide-react';

const FloatingMenu = ({ neighborhood = [], attacking = 0, onAttackClick = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Calculate position for each menu item
  const getItemStyle = (index) => {
    const totalItems = neighborhood.length;
    if (totalItems === 0) return {};
    
    // Handle special cases for 1 or 2 items
    if (totalItems === 1) {
      // Position single item directly above (at -90 degrees)
      const radius = 80;
      const angle = 230 * (Math.PI / 180);
      return {
        transform: isOpen 
          ? `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(1)`
          : 'translate(0, 0) scale(0)',
        opacity: isOpen ? 1 : 0,
        transitionDelay: `${index * 50}ms`
      };
    }
    
    if (totalItems === 2) {
      // Position two items closer together, from -60° to -120°
      const radius = 80;
      const angleSpread = 50;
      const baseAngle = -130;
      const angle = (baseAngle + (angleSpread * (index - 0.5))) * (Math.PI / 180);
      
      return {
        transform: isOpen 
          ? `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(1)`
          : 'translate(0, 0) scale(0)',
        opacity: isOpen ? 1 : 0,
        transitionDelay: `${index * 50}ms`
      };
    }
    
    // Original logic for 3+ items
    const radius = 80;
    const angleStep = 120 / (totalItems - 1);
    const angle = (165 + (angleStep * index)) * (Math.PI / 180);
    
    return {
      transform: isOpen 
        ? `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(1)`
          : 'translate(0, 0) scale(0)',
      opacity: isOpen ? 1 : 0,
      transitionDelay: `${index * 50}ms`
    };
  };

  return (
    <div className="fixed bottom-6 right-6">
      {/* Menu Items */}
      {neighborhood.map((neighbor, index) => (
        <button
          key={neighbor.playerIndex}
          onClick={() => {
            onAttackClick(neighbor.playerIndex);
          }}
          className={`
            absolute bottom-0 right-0
            w-12 h-12
            rounded-full
            text-white
            shadow-lg
            flex items-center justify-center
            transition-all duration-300 ease-in-out
            hover:scale-110
            ${attacking === neighbor.playerIndex ? 'shadow-[inset_0_0_15px_rgba(239,68,68,0.7)]' : 'bg-transparent'}
          `}
          style={{
            ...getItemStyle(index),
            border: `1px solid ${neighbor.color}`,
          }}
        >
          {'netWorth' in neighbor && (
            <small className="absolute -top-6 text-base">
              {Math.round(neighbor.netWorth / 100)}
            </small>
          )}
          <span title={neighbor.nickname} className="text-xxs font-bold">
            {neighbor.nickname}
          </span>
        </button>
      ))}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          z-50
          w-16 h-16
          rounded-full
          bg-blue-600
          text-white
          shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:bg-blue-700
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        <Sword size={24} />
      </button>
    </div>
  );
};

export default FloatingMenu;