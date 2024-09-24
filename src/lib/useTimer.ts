import { useState, useEffect } from "react";

export const useTimer = (startAt: number = 0) => {
  const [time, setTime] = useState(startAt);
  const [isActive, setIsActive] = useState(false);

  // Start the timer
  const start = () => {
    setIsActive(true);
  };

  // Stop the timer
  const stop = () => {
    setIsActive(false);
  };

  // Reset the timer
  const reset = () => {
    setTime(startAt);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000); // Increment every second
    } else if (!isActive && time !== 0 && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  return { time, start, stop, reset, isActive };
};
