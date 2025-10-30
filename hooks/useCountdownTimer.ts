
import { useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { setCountdown, setEstimatedGenerateTime } from '../context/appActions';

export const useCountdownTimer = () => {
  const { state, dispatch } = useAppContext();
  const { isLoading, currentStep } = state; 

  const countdownIntervalRef = useRef<number | null>(null);
  const latestCountdownValueRef = useRef(0); // Store the latest countdown value

  const startCountdown = useCallback((initialSeconds: number) => {
    // Set initial countdown value and update ref
    latestCountdownValueRef.current = Math.ceil(initialSeconds);
    dispatch(setCountdown(latestCountdownValueRef.current));

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = window.setInterval(() => {
      console.log("Countdown Interval tick. Current latestCountdownValueRef.current:", latestCountdownValueRef.current);
      if (latestCountdownValueRef.current <= 1) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        dispatch(setCountdown(0));
        dispatch(setEstimatedGenerateTime(0));
        console.log("Countdown finished.");
        return;
      }
      latestCountdownValueRef.current -= 1;
      dispatch(setCountdown(latestCountdownValueRef.current));
    }, 1000);
  }, [dispatch]); // Only dispatch is a dependency

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    dispatch(setCountdown(0));
    dispatch(setEstimatedGenerateTime(0));
    latestCountdownValueRef.current = 0; // Reset ref value too
  }, [dispatch]);

  // Effect to clear countdown if generation finishes early or step changes
  useEffect(() => {
    // If isLoading becomes false (generation finished) while countdown is active
    if (!isLoading && countdownIntervalRef.current) {
      console.log("Generation finished, clearing countdown.");
      clearCountdown();
    }
    // If currentStep changes from 2 (meaning user navigated away) while countdown is active
    if (currentStep !== 2 && countdownIntervalRef.current) {
      console.log("Step changed, clearing countdown.");
      clearCountdown();
    }
  }, [isLoading, currentStep, clearCountdown]);

  useEffect(() => {
    return () => {
      // Ensure interval is cleared on unmount
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    startCountdown,
    clearCountdown,
  };
};
