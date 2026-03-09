import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseBootKeyboardProps {
  booted: boolean;
  inRecoveryMode: boolean;
  rebooting: boolean;
  setRebooting: (v: boolean) => void;
  setBlackScreen: (v: boolean) => void;
  setBiosComplete: (v: boolean) => void;
  setInRecoveryMode: (v: boolean) => void;
}

export const useBootKeyboard = ({
  booted, inRecoveryMode, rebooting,
  setRebooting, setBlackScreen, setBiosComplete, setInRecoveryMode,
}: UseBootKeyboardProps) => {
  const keyBufferRef = useRef("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        keyBufferRef.current = (keyBufferRef.current + e.key.toLowerCase()).slice(-10);
        if (keyBufferRef.current.endsWith("del") || keyBufferRef.current.endsWith("delete")) {
          if (!booted && !inRecoveryMode) {
            e.preventDefault();
            if (rebooting) {
              setRebooting(false);
              setBlackScreen(false);
            }
            setTimeout(() => setBiosComplete(false), 1500);
            toast.info("Entering BIOS Setup...");
            keyBufferRef.current = "";
          }
        }
      }
      if (e.key === "F2" && !booted && !inRecoveryMode) {
        e.preventDefault();
        setInRecoveryMode(true);
        toast.info("Entering Recovery Mode...");
      }
      if ((e.key === "Delete" || e.key === "Del") && !booted && !inRecoveryMode) {
        e.preventDefault();
        if (rebooting) {
          setRebooting(false);
          setBlackScreen(false);
        }
        setTimeout(() => setBiosComplete(false), 1500);
        toast.info("Entering BIOS Setup...");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [booted, inRecoveryMode, rebooting, setRebooting, setBlackScreen, setBiosComplete, setInRecoveryMode]);
};
