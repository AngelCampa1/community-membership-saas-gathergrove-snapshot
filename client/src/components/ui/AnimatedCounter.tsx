import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = 0;
    const increment = value / (duration / 16); // 60fps approximation
    let currentValue = startValue;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(currentValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span data-testid="animated-counter">{displayValue}</span>;
}

export default AnimatedCounter;