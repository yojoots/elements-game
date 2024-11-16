import React, { useEffect, useState, useRef } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

const AnimatedCounter = ({ value, duration = 1000, delay = 0 }) => {
  const spring = useSpring({
    from: { val: value },
    to: { val: value },
    config: { tension: 100, friction: 20, duration },
    delay,
    reset: true
  });

  return (
    <animated.div>
      {spring.val.to(val => Math.round(val / 100))}
    </animated.div>
  );
};

const AnimatedBattleStats = ({ 
  lifeScore,
  airScore,
  earthScore,
  fireScore,
  waterScore,
  airPrice,
  earthPrice,
  firePrice,
  waterPrice,
  elementOrder,
  onConvertLifeTo
}) => {
  const [prevScores, setPrevScores] = useState({
    life: lifeScore,
    air: airScore,
    earth: earthScore,
    fire: fireScore,
    water: waterScore
  });
  
  const [displayedLifeScore, setDisplayedLifeScore] = useState(lifeScore);
  const lifeScoreTimeoutRef = useRef(null);

  const [animating, setAnimating] = useState({
    life: false,
    air: false,
    earth: false,
    fire: false,
    water: false
  });

  useEffect(() => {
    const newScores = {
      life: lifeScore,
      air: airScore,
      earth: earthScore,
      fire: fireScore,
      water: waterScore
    };

    const changedScores = {};
    Object.keys(newScores).forEach(key => {
      if (newScores[key] !== prevScores[key]) {
        changedScores[key] = true;
      }
    });

    if (Object.keys(changedScores).length > 0) {
      if (lifeScoreTimeoutRef.current) {
        clearTimeout(lifeScoreTimeoutRef.current);
      }

      const isConversion = newScores.life < prevScores.life && 
        (newScores.air > prevScores.air || 
         newScores.earth > prevScores.earth || 
         newScores.fire > prevScores.fire || 
         newScores.water > prevScores.water);

      if (changedScores.life) {
        if (isConversion) {
          // Immediate update for conversions
          setDisplayedLifeScore(lifeScore);
          setAnimating(prev => ({ ...prev, life: true }));
          setTimeout(() => setAnimating(prev => ({ ...prev, life: false })), 300);
        } else {
          // For battles, sync with looting circles
          const BATTLE_ANIMATION_DURATION = 2200; // Match with your circle animation duration
          
          lifeScoreTimeoutRef.current = setTimeout(() => {
            setDisplayedLifeScore(lifeScore);
            setAnimating(prev => ({ ...prev, life: true }));
            setTimeout(() => setAnimating(prev => ({ ...prev, life: false })), 500);
          }, BATTLE_ANIMATION_DURATION);
        }
      }

      setAnimating(prev => ({
        ...prev,
        air: changedScores.air || false,
        earth: changedScores.earth || false,
        fire: changedScores.fire || false,
        water: changedScores.water || false
      }));

      setTimeout(() => {
        setAnimating(prev => ({
          ...prev,
          air: false,
          earth: false,
          fire: false,
          water: false
        }));
      }, 2200);
    }

    setPrevScores(newScores);
  }, [lifeScore, airScore, earthScore, fireScore, waterScore]);

  useEffect(() => {
    return () => {
      if (lifeScoreTimeoutRef.current) {
        clearTimeout(lifeScoreTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className={`lifeInCenter btn-4 anyElement ${animating.life ? 'score-animating' : ''}`}>
        <span>🌱</span>
        <strong>
          <AnimatedCounter 
            value={displayedLifeScore} 
            duration={animating.life ? 300 : 1000}
          />
        </strong>
      </div>

      <div 
        className={`air airItem anyElement clickableButton ${animating.air ? 'score-animating' : ''}`}
        onClick={(e) => onConvertLifeTo("air", e)}
      >
        <div>
          <strong><AnimatedCounter value={airScore} duration={2000} /></strong>
        </div>
        <span>💨</span>
        <small>{Math.round(airPrice * 100) / 100}</small>
      </div>

      <div 
        className={`earth earthItem anyElement clickableButton ${animating.earth ? 'score-animating' : ''}`}
        onClick={(e) => onConvertLifeTo("earth", e)}
      >
        <div>
          <strong><AnimatedCounter value={earthScore} duration={2000} /></strong>
        </div>
        <span>⛰️</span>
        <small>{Math.round(earthPrice * 100) / 100}</small>
      </div>

      <div 
        className={`fire fireItem anyElement clickableButton ${animating.fire ? 'score-animating' : ''}`}
        onClick={(e) => onConvertLifeTo("fire", e)}
      >
        <div>
          <strong><AnimatedCounter value={fireScore} duration={2000} /></strong>
        </div>
        <span>🔥</span>
        <small>{Math.round(firePrice * 100) / 100}</small>
      </div>

      <div 
        className={`water waterItem anyElement clickableButton ${animating.water ? 'score-animating' : ''}`}
        onClick={(e) => onConvertLifeTo("water", e)}
      >
        <div>
          <strong><AnimatedCounter value={waterScore} duration={2000} /></strong>
        </div>
        <span>💧</span>
        <small>{Math.round(waterPrice * 100) / 100}</small>
      </div>
    </>
  );
};

export default AnimatedBattleStats;