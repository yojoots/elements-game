import React, { useState, useEffect, useRef, useMemo } from 'react';
import "../styles/SyncCountdownTimer.css";

export const SyncCountdownTimer = ({
  duration = 20,
  serverTimeRemaining = null,
  colors = ['green', '#F7B801', '#ed6403', '#c50202'],
  size = 60,
  strokeWidth = 4,
  onComplete = () => ({ shouldRepeat: true, delay: 0 })
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [color, setColor] = useState(colors[0]);
  const lastServerSync = useRef(null);
  const localStartTime = useRef(Date.now());
  
  // Calculate time thresholds based on duration
  const colorTimeThresholds = useMemo(() => {
    // Create 4 thresholds: 30%, 20%, 10%, and 5% of total duration
    return [
      duration * 0.75,  // First color change at 30% remaining
      duration * 0.5,  // Second color change at 20% remaining
      duration * 0.25,  // Third color change at 10% remaining
      duration * 0.1  // Final color change at 5% remaining
    ];
  }, [duration]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Handle server time sync
  useEffect(() => {
    if (serverTimeRemaining !== null) {
      setTimeLeft(serverTimeRemaining);
      lastServerSync.current = Date.now();
      localStartTime.current = Date.now();
    }
  }, [serverTimeRemaining]);

  // Main timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      // If we have a server sync, use time since last sync
      if (lastServerSync.current) {
        const elapsed = (Date.now() - localStartTime.current) / 1000;
        const estimatedTimeLeft = Math.max(0, serverTimeRemaining - elapsed);
        setTimeLeft(estimatedTimeLeft);
      }
      // Otherwise just countdown normally
      else {
        setTimeLeft(prev => Math.max(0, prev - 0.1));
      }
    }, 100);

    return () => clearInterval(timer);
  }, [serverTimeRemaining]);

  // Update color based on time remaining
  useEffect(() => {
    let newColor = colors[colors.length - 1]; // Default to last color
    
    // Find the appropriate color based on time thresholds
    for (let i = 0; i < colorTimeThresholds.length; i++) {
      if (timeLeft > colorTimeThresholds[i]) {
        newColor = colors[i];
        break;
      }
    }
    
    setColor(newColor);
  }, [timeLeft, colors, colorTimeThresholds]);

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(1, timeLeft / duration));
  const strokeDashoffset = (1 - progress) * circumference;

  // Animation frames for pulse effect in last 10% of time
  const pulseScale = timeLeft <= (duration * 0.1) ? 1 + (Math.sin(Date.now() / 200) * 0.05) : 1;

  // Format time display
  const displayTime = Math.ceil(timeLeft);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div 
        className="relative transition-transform duration-200"
        style={{ transform: `scale(${pulseScale})` }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none"
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none transition-colors duration-300"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Time display */}
        <div 
          className="absolute inset-0 flex items-center justify-center font-semibold text-lg transition-colors duration-300"
          style={{ color }}
        >
          {displayTime}
        </div>
      </div>
    </div>
  );
};