import React, { useState } from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = () => {
  const [isHovering, setIsHovering] = useState(false);

  const tooltipData = [
    {
      id: 'airOrderDiv',
      text: 'Drag to reorder elements. The order determines battle advantages!',
      position: 'top-1/3 left-1/2 transform -translate-x-1/2'
    },
    {
      id: 'earthItem',
      text: 'Convert life force into elements. Each element has a dynamic price that changes with supply and demand.',
      position: 'top-1/2 left-1/4'
    },
    {
      id: 'floatingMenu',
      text: 'Attack neighboring players! Select their color to queue an attack with your strongest element.',
      position: 'bottom-1/4 right-12'
    },
    {
      id: 'lifeInCenter',
      text: 'Your life force - the core resource. Protect it from attacks and convert it into elements.',
      position: 'top-1/2 left-1/2 transform -translate-x-1/2'
    },
    {
      id: 'scry',
      text: 'Cast spells by combining elements. Scry reveals information about your opponents!',
      position: 'bottom-1/2 right-1/4'
    }
  ];

  return (
    <div className="relative">
      {/* Info Icon */}
      <div 
        className="fixed top-20 mt-2 left-6 z-50 cursor-help"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Info className="w-6 h-6 text-blue-400 hover:text-blue-500 transition-colors" />
      </div>

      {/* Dark Overlay */}
      {isHovering && (
        <div className="fixed inset-0 bg-black/60 z-40">
          {/* Tooltip Bubbles */}
          {tooltipData.map((tooltip) => (
            <div
              key={tooltip.id}
              className={`absolute ${tooltip.position} z-50 bg-white rounded-lg p-3 shadow-lg max-w-xs animate-bounce-slow`}
            >
              <p className="text-sm text-gray-700">{tooltip.text}</p>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;