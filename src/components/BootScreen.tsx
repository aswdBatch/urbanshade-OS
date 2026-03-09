import { useState, useEffect } from "react";
import { getBiosSettings } from "@/hooks/useBiosSettings";

interface BootScreenProps {
  onComplete: () => void;
  onSafeMode?: () => void;
}

export const BootScreen = ({ onComplete, onSafeMode }: BootScreenProps) => {
  const [safeModePressed, setSafeModePressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Starting...");

  const biosSettings = getBiosSettings();
  const isFastBoot = biosSettings.fastBoot;

  // Handle F8 keypress for safe mode (silent)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        setSafeModePressed(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple loading progression
  useEffect(() => {
    const stages = [
      { progress: 20, text: "Starting..." },
      { progress: 45, text: "Loading system..." },
      { progress: 70, text: "Starting services..." },
      { progress: 90, text: "Almost ready..." },
      { progress: 100, text: "Welcome" },
    ];

    let stageIndex = 0;
    const baseDelay = isFastBoot ? 100 : 250;

    const runStage = () => {
      if (stageIndex >= stages.length) {
        setTimeout(() => {
          if (safeModePressed) {
            onSafeMode?.();
          } else {
            onComplete();
          }
        }, isFastBoot ? 100 : 200);
        return;
      }

      const stage = stages[stageIndex];
      setProgress(stage.progress);
      setStatusText(stage.text);
      stageIndex++;

      setTimeout(runStage, baseDelay + Math.random() * 100);
    };

    // Small initial delay before starting
    const timer = setTimeout(runStage, isFastBoot ? 200 : 400);
    return () => clearTimeout(timer);
  }, [isFastBoot, onComplete, onSafeMode, safeModePressed]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      {/* Logo */}
      <img 
        src="/favicon.svg" 
        alt="UrbanShade" 
        className="w-20 h-20 mb-12 opacity-90"
      />

      {/* Loading section */}
      <div className="w-64">
        {/* Progress bar with shine sweep */}
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-primary/80 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shine sweep */}
            <div 
              className="absolute inset-0 overflow-hidden"
            >
              <div 
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ animation: 'progress-shine 2s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>
        
        {/* Status text with crossfade */}
        <div className="text-center mt-4">
          <span key={statusText} className="text-xs text-white/50 font-mono animate-text-crossfade inline-block">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};
