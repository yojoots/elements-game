import React, { useState, useEffect } from 'react';

const EnergyTransferCircle = () => {
  // Energy levels for each orb (center and four directions)
  const [energies, setEnergies] = useState({
    center: 100,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });
  
  const [activeTransfer, setActiveTransfer] = useState(null);
  
  // Define positions and colors
  const orbs = {
    center: { x: 200, y: 200, color: "#ffffff" },
    top: { x: 200, y: 120, color: "#ff4444" },    // Red
    right: { x: 280, y: 200, color: "#44ff44" },  // Green
    bottom: { x: 200, y: 280, color: "#4444ff" }, // Blue
    left: { x: 120, y: 200, color: "#ffff44" }    // Yellow
  };

  useEffect(() => {
    let interval;
    if (activeTransfer) {
      interval = setInterval(() => {
        setEnergies(prev => {
          const { from, to } = activeTransfer;
          const newEnergies = { ...prev };
          
          if (from === 'center') {
            // Draining from center to outer
            if (prev.center > 0 && prev[to] < 100) {
              newEnergies.center = Math.max(prev.center - 2, 0);
              newEnergies[to] = Math.min(prev[to] + 2, 100);
            }
          } else {
            // Draining from outer to center
            if (prev[from] > 0 && prev.center < 100) {
              newEnergies[from] = Math.max(prev[from] - 2, 0);
              newEnergies.center = Math.min(prev.center + 2, 100);
            }
          }
          return newEnergies;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [activeTransfer]);

  const handleOrbClick = (orbId) => {
    if (orbId === 'center') {
      // Find the most filled outer orb to drain from
      const mostFilled = Object.entries(energies)
        .filter(([key]) => key !== 'center')
        .reduce((max, [key, value]) => value > (energies[max] || 0) ? key : max, null);
      
      if (mostFilled && energies[mostFilled] > 0) {
        setActiveTransfer({ from: mostFilled, to: 'center' });
      }
    } else {
      setActiveTransfer({ from: 'center', to: orbId });
    }
  };

  const handleRelease = () => {
    setActiveTransfer(null);
  };

  const shouldShowParticles = (from, to) => {
    return activeTransfer?.from === from && 
           activeTransfer?.to === to && 
           energies[from] > 0 && 
           energies[to] < 100;
  };

  return (
    <div className="w-full h-96 rounded-lg select-none touch-none" style={{height: '100vh'}}>
      <svg viewBox="0 0 400 400" className="w-full h-full select-none touch-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Energy transfer paths */}
        {Object.entries(orbs).map(([orbId, orbData]) => {
          if (orbId === 'center') return null;
          
          const isActive = shouldShowParticles('center', orbId) || 
                          shouldShowParticles(orbId, 'center');
          
          if (!isActive) return null;

          const from = activeTransfer?.from === 'center' ? orbs.center : orbData;
          const to = activeTransfer?.from === 'center' ? orbData : orbs.center;
          
          return (
            <g key={`particles-${orbId}`}>
              {[...Array(15)].map((_, i) => (
                <circle
                  key={i}
                  r="2"
                  fill={i % 2 === 0 ? from.color : to.color}
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="cx"
                    from={from.x}
                    to={to.x}
                    dur="0.7s"
                    begin={`${i * 0.05}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    from={from.y}
                    to={to.y}
                    dur="0.7s"
                    begin={`${i * 0.05}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="0.7s"
                    begin={`${i * 0.05}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          );
        })}

        {/* Render all orbs */}
        {Object.entries(orbs).map(([orbId, { x, y, color }]) => (
          <circle
            key={orbId}
            cx={x}
            cy={y}
            r="20"
            fill={`${color}${Math.round(energies[orbId] * 255 / 100).toString(16).padStart(2, '0')}`}
            stroke="white"
            strokeWidth="1"
            filter="url(#glow)"
            style={{ cursor: "pointer" }}
            onMouseDown={() => handleOrbClick(orbId)}
            onMouseUp={handleRelease}
            onMouseLeave={handleRelease}
            onTouchStart={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              handleOrbClick(orbId);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();  // Prevent default touch behavior
              handleRelease();
            }}
          >
            <animate
              attributeName="r"
              values="20;21;20"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default EnergyTransferCircle;