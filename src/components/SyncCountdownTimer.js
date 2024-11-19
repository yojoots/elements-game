import React, { useState, useEffect, useRef } from 'react';

export const SyncCountdownTimer = ({ 
  duration = 10, 
  size = 130,
  strokeWidth = 12,
  colors = ['#004777', '#F7B801', '#ed6403', '#A30000'],
  colorsTime = [7, 5, 2, 0],
  isPlaying = true,
  serverTimeRemaining = null,
  onComplete = () => ({ shouldRepeat: true, delay: 0 }),
  className = ''
}) => {
  const [remainingTime, setRemainingTime] = useState(duration);
  const timerRef = useRef(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const getColor = (timeLeft) => {
    const index = colorsTime.findIndex((t) => timeLeft > t);
    return colors[index === -1 ? colors.length - 1 : index];
  };

  useEffect(() => {
    if (serverTimeRemaining !== null) {
      setRemainingTime(serverTimeRemaining);
    }
  }, [serverTimeRemaining]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setRemainingTime((time) => {
          if (time <= 0) {
            const { shouldRepeat, delay } = onComplete();
            if (shouldRepeat) {
              return duration;
            }
            clearInterval(timerRef.current);
            return 0;
          }
          return time - 0.1;
        });
      }, 100);

      return () => clearInterval(timerRef.current);
    }
  }, [isPlaying, duration, onComplete]);

  const strokeDashoffset = circumference - (remainingTime / duration) * circumference;

  return (
    <div className={`centered inline-flex items-center justify-center relative ${className}`}>
        <div style={{ 
            position: 'relative',
            fontSize: '40px',
            top: '87px',
            // left: '75px',
            textAlign: 'center',
            left: '-1px',
        }}>
            {Math.ceil(remainingTime)}
        </div>
      <svg
        className="transform"
        width={size}
        height={size}
        style={ {transform: 'rotate(90deg) scaleX(-1)'} }
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          className="transition-colors duration-300"
          style={{ opacity: 0.2 }}
          stroke={getColor(remainingTime)}
          fill="none"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress circle */}
        <circle
          className="transition-all duration-300 ease-linear"
          stroke={getColor(remainingTime)}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
      </svg>

    </div>
  );
};