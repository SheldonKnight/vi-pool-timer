import { useState, useEffect, useRef } from "react";
import { useAudioPlayer } from "expo-audio";

export const useTimer = (
  initialTime = 0,
  warningTime = 0,
  extendTime = 0,
  finalBeepCountdown = 0
) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isWarningMode, setIsWarningMode] = useState(false);
  const timerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const timeoutsRef = useRef([]);
  const hasWarnedRef = useRef(false);

  const beepPlayer = useAudioPlayer(require("./assets/sounds/beep.mp3"));
  const buzzerPlayer = useAudioPlayer(require("./assets/sounds/buzzer.mp3"));

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    hasWarnedRef.current = false;
  };

  const playSound = async (player, label) => {
    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.error(`Error playing ${label}:`, error);
    }
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
    lastUpdateRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      setTimeLeft((prev) => {
        const decrement = Math.round(elapsed / 1000);
        const newTime = Math.max(0, prev - decrement);

        if (newTime <= 0) {
          clearTimer();
          setIsRunning(false);
          setIsWarningMode(false);
          const buzzerTimeout = setTimeout(
            () => playSound(buzzerPlayer, "buzzer"),
            100
          );
          timeoutsRef.current.push(buzzerTimeout);
          return 0;
        }

        // First warning beep when entering warning mode
        if (newTime <= warningTime && !hasWarnedRef.current) {
          setIsWarningMode(true);
          hasWarnedRef.current = true;
          const beepTimeout = setTimeout(
            () => playSound(beepPlayer, "beep"),
            50
          );
          timeoutsRef.current.push(beepTimeout);
        }

        // Final countdown beeps (e.g., 5, 4, 3, 2, 1)
        if (newTime <= finalBeepCountdown && newTime > 0) {
          const beepTimeout = setTimeout(
            () => playSound(beepPlayer, "beep"),
            50
          );
          timeoutsRef.current.push(beepTimeout);
        }

        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearTimer();
    setIsRunning(false);
    setIsWarningMode(false);
  };

  const resetTimer = () => {
    clearTimer();
    setIsRunning(false);
    setIsWarningMode(false);
    setTimeLeft(initialTime);
  };

  const extendTimer = () => {
    setTimeLeft((prev) => {
      const newTime = prev + extendTime;
      setIsWarningMode(newTime <= warningTime);
      if (newTime > warningTime) {
        hasWarnedRef.current = false; // allow warning beep again if extended past warning time
      }
      return newTime;
    });
  };

  return {
    timeLeft,
    isRunning,
    isWarningMode,
    startTimer,
    stopTimer,
    resetTimer,
    extendTimer,
  };
};
