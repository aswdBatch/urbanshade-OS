import { useState, useEffect, useRef } from "react";

interface CrashRecoveryData {
  timestamp: string;
  code: string;
  description: string;
  windowState?: Array<{ id: string; appId: string; appName: string }>;
  localStorage?: Record<string, string>;
}

const CRASH_RECOVERY_KEY = 'urbanshade_crash_recovery';
const RECOVERY_POINTS_KEY = 'urbanshade_recovery_points';

interface RecoveryPoint {
  id: string;
  name: string;
  timestamp: string;
  data: Record<string, string>;
  autoCreated: boolean;
}

interface CrashRecoveryProps {
  onRecover: () => void;
  onSkip: () => void;
}

export const saveCrashRecoveryData = (data: CrashRecoveryData) => {
  try {
    localStorage.setItem(CRASH_RECOVERY_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save crash recovery data:', e);
  }
};

export const getCrashRecoveryData = (): CrashRecoveryData | null => {
  try {
    const stored = localStorage.getItem(CRASH_RECOVERY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const clearCrashRecoveryData = () => {
  localStorage.removeItem(CRASH_RECOVERY_KEY);
};

export const getRecoveryPoints = (): RecoveryPoint[] => {
  try {
    const stored = localStorage.getItem(RECOVERY_POINTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveRecoveryPoint = (name: string, autoCreated: boolean = false): RecoveryPoint => {
  const points = getRecoveryPoints();
  
  // Collect all localStorage data
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !key.startsWith('urbanshade_recovery') && !key.startsWith('urbanshade_crash')) {
      data[key] = localStorage.getItem(key) || '';
    }
  }
  
  const newPoint: RecoveryPoint = {
    id: `recovery-${Date.now()}`,
    name,
    timestamp: new Date().toISOString(),
    data,
    autoCreated
  };
  
  // Keep only last 10 recovery points
  const updated = [newPoint, ...points].slice(0, 10);
  localStorage.setItem(RECOVERY_POINTS_KEY, JSON.stringify(updated));
  
  return newPoint;
};

export const restoreFromRecoveryPoint = (point: RecoveryPoint) => {
  // Clear current localStorage (except recovery data)
  const keysToKeep = [RECOVERY_POINTS_KEY];
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Restore data from recovery point
  Object.entries(point.data).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};

export const deleteRecoveryPoint = (pointId: string) => {
  const points = getRecoveryPoints();
  const updated = points.filter(p => p.id !== pointId);
  localStorage.setItem(RECOVERY_POINTS_KEY, JSON.stringify(updated));
};

export const CrashRecoveryDialog = ({ onRecover, onSkip }: CrashRecoveryProps) => {
  const [recoveryData, setRecoveryData] = useState<CrashRecoveryData | null>(null);
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [selectedOption, setSelectedOption] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecoveryData(getCrashRecoveryData());
    setRecoveryPoints(getRecoveryPoints());
  }, []);

  // Handle cursor visibility on mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      setShowCursor(true);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      cursorTimeoutRef.current = setTimeout(() => {
        setShowCursor(false);
      }, 2000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPoints) {
        if (e.key === "ArrowUp") {
          setSelectedPointIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === "ArrowDown") {
          setSelectedPointIndex(prev => Math.min(recoveryPoints.length, prev + 1));
        } else if (e.key === "Enter") {
          if (selectedPointIndex < recoveryPoints.length) {
            restoreFromRecoveryPoint(recoveryPoints[selectedPointIndex]);
            clearCrashRecoveryData();
            onRecover();
          } else {
            setShowPoints(false);
          }
        } else if (e.key === "Escape") {
          setShowPoints(false);
        }
      } else {
        if (e.key === "ArrowUp") {
          setSelectedOption(prev => Math.max(0, prev - 1));
        } else if (e.key === "ArrowDown") {
          setSelectedOption(prev => Math.min(recoveryPoints.length > 0 ? 2 : 1, prev + 1));
        } else if (e.key === "Enter") {
          handleSelect();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOption, showPoints, selectedPointIndex, recoveryPoints]);

  const handleSelect = () => {
    if (selectedOption === 0) {
      clearCrashRecoveryData();
      onRecover();
    } else if (selectedOption === 1 && recoveryPoints.length > 0) {
      setShowPoints(true);
      setSelectedPointIndex(0);
    } else {
      clearCrashRecoveryData();
      onSkip();
    }
  };

  if (!recoveryData) {
    return null;
  }

  const mainOptions = [
    { label: "Continue Without Recovery", desc: "Proceed to UrbanShade normally" },
    ...(recoveryPoints.length > 0 ? [{ label: `Restore from Recovery Point (${recoveryPoints.length} available)`, desc: "Choose a saved system state to restore" }] : []),
    { label: "Skip Recovery", desc: "Dismiss this dialog without action" },
  ];

  if (showPoints) {
    return (
      <div className={`fixed inset-0 z-[9999] bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">Select Recovery Point</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px] overflow-auto">
          <p className="text-gray-400 mb-6">(Use ↑↓ to navigate, ENTER to select. Mouse optional.)</p>

          <div className="space-y-0.5 mb-8">
            {recoveryPoints.map((point, i) => (
              <div
                key={point.id}
                onClick={() => {
                  setSelectedPointIndex(i);
                  restoreFromRecoveryPoint(point);
                  clearCrashRecoveryData();
                  onRecover();
                }}
                onMouseEnter={() => setSelectedPointIndex(i)}
                className={`px-2 py-0.5 cursor-pointer ${
                  selectedPointIndex === i 
                    ? "bg-[#aaaaaa] text-black" 
                    : "text-white"
                }`}
              >
                {point.name} - {new Date(point.timestamp).toLocaleString()}
                {point.autoCreated && " [AUTO]"}
              </div>
            ))}
            <div
              onClick={() => setShowPoints(false)}
              onMouseEnter={() => setSelectedPointIndex(recoveryPoints.length)}
              className={`px-2 py-0.5 cursor-pointer ${
                selectedPointIndex === recoveryPoints.length 
                  ? "bg-[#aaaaaa] text-black" 
                  : "text-white"
              }`}
            >
              Back
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-300">
              {selectedPointIndex < recoveryPoints.length 
                ? `${Object.keys(recoveryPoints[selectedPointIndex]?.data || {}).length} entries saved`
                : "Return to previous menu"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
          <span>ENTER=Choose</span>
          <span>ESC=Back</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
      {/* Header */}
      <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
        <span className="font-bold tracking-wide">System Crash Detected</span>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 text-[13px]">
        <p className="mb-2">
          The system crashed previously. Would you like to recover?
        </p>
        
        {/* Crash info */}
        <div className="my-4 text-gray-400">
          <p>Time: {new Date(recoveryData.timestamp).toLocaleString()}</p>
          <p>Stop Code: {recoveryData.code}</p>
          <p>Info: {recoveryData.description}</p>
        </div>

        <p className="text-gray-400 mb-6">(Use ↑↓ to navigate, ENTER to select. Mouse optional.)</p>

        {/* Options */}
        <div className="space-y-0.5 mb-8">
          {mainOptions.map((opt, i) => (
            <div
              key={i}
              onClick={() => { setSelectedOption(i); handleSelect(); }}
              onMouseEnter={() => setSelectedOption(i)}
              className={`px-2 py-0.5 cursor-pointer ${
                selectedOption === i 
                  ? "bg-[#aaaaaa] text-black" 
                  : "text-white"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-gray-300">
            Description: {mainOptions[selectedOption]?.desc}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
        <span>ENTER=Choose</span>
        <span>ESC=Cancel</span>
      </div>
    </div>
  );
};

export default CrashRecoveryDialog;
