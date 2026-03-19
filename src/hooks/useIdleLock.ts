import { useEffect, useRef, useCallback } from "react";
import { loadState } from "@/lib/persistence";

interface UseIdleLockOptions {
  onLock: () => void;
  idleTimeMinutes?: number;
  enabled?: boolean;
}

export const useIdleLock = ({ 
  onLock, 
  idleTimeMinutes = 5,
  enabled = false 
}: UseIdleLockOptions) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if lock after idle is enabled from settings
    const lockAfterIdleEnabled = loadState('settings_lock_after_idle', false);
    
    if (!lockAfterIdleEnabled || !enabled) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      onLock();
    }, idleTimeMinutes * 60 * 1000);
  }, [onLock, idleTimeMinutes, enabled]);

  useEffect(() => {
    const lockAfterIdleEnabled = loadState('settings_lock_after_idle', false);
    
    if (!lockAfterIdleEnabled || !enabled) {
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove', 
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle the reset to avoid excessive calls
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledReset = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetTimer();
        throttleTimer = null;
      }, 1000);
    };

    events.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Initial timer
    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [resetTimer, enabled]);

  return {
    resetTimer,
    getIdleTime: () => Date.now() - lastActivityRef.current
  };
};
