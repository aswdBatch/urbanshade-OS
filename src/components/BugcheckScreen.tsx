import { useEffect, useState, useRef } from "react";

export interface BugcheckData {
  code: string;
  description: string;
  timestamp: string;
  location?: string;
  stackTrace?: string;
  systemInfo?: Record<string, string>;
}

interface BugcheckScreenProps {
  bugcheck: BugcheckData;
  onRestart: () => void;
  onReportToDev: () => void;
  onRecovery?: () => void;
}

// Bugcheck codes - expanded with new ones
export const BUGCHECK_CODES: Record<string, { 
  hex: string; 
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO"; 
  category: string;
  userDescription: string;
  technicalDescription: string;
  possibleCauses: string[];
  suggestedFixes: string[];
}> = {
  // Data integrity
  DATA_INCONSISTENCY_ERROR: { 
    hex: "0x00000050", 
    severity: "CRITICAL", 
    category: "Data Integrity",
    userDescription: "System data validation failed",
    technicalDescription: "One or more localStorage keys contain corrupted or invalid data that does not match expected schema",
    possibleCauses: ["Corrupted localStorage entry", "Schema version mismatch", "Incomplete write operation", "Browser storage corruption"],
    suggestedFixes: ["Clear corrupted keys via Recovery", "Factory reset", "Restore from backup"]
  },
  SYSTEM_ERROR_HANDLE: { 
    hex: "0x00000051", 
    severity: "CRITICAL", 
    category: "Error Handler",
    userDescription: "Multiple error screens triggered simultaneously",
    technicalDescription: "The error handling system detected concurrent error states, indicating cascading failures",
    possibleCauses: ["Cascading errors", "Error handler recursion", "Multiple component failures", "Stack corruption"],
    suggestedFixes: ["Immediate restart required", "Check for memory leaks", "Review recent changes"]
  },
  STORAGE_VALIDATION_FAILED: { 
    hex: "0x00000052", 
    severity: "HIGH", 
    category: "Storage",
    userDescription: "Storage validation check failed",
    technicalDescription: "Periodic storage integrity check detected anomalies in saved data",
    possibleCauses: ["Partial writes", "Concurrent modification", "Storage quota issues"],
    suggestedFixes: ["Run storage cleanup", "Verify storage permissions"]
  },
  RENDER_DEADLOCK: { 
    hex: "0x00000053", 
    severity: "CRITICAL", 
    category: "Rendering",
    userDescription: "Rendering system became unresponsive",
    technicalDescription: "React render cycle detected mutual blocking between components",
    possibleCauses: ["Circular dependencies", "Infinite state updates", "Blocked event loop"],
    suggestedFixes: ["Force restart", "Disable problematic components"]
  },
  SECURITY_VIOLATION: { 
    hex: "0x00000054", 
    severity: "CRITICAL", 
    category: "Security",
    userDescription: "Security policy violation detected",
    technicalDescription: "An operation attempted to bypass security restrictions",
    possibleCauses: ["Unauthorized access attempt", "Policy bypass", "Injection attack"],
    suggestedFixes: ["Review security logs", "Enable enhanced protection"]
  },
  CONFIG_CORRUPTION: { 
    hex: "0x00000055", 
    severity: "HIGH", 
    category: "Configuration",
    userDescription: "System configuration is corrupted",
    technicalDescription: "Critical configuration values are missing or invalid",
    possibleCauses: ["Settings corruption", "Version migration failure", "Manual tampering"],
    suggestedFixes: ["Reset settings to default", "Factory reset"]
  },
  // Original codes
  DESKTOP_MALFUNC: { 
    hex: "0x00000001", 
    severity: "HIGH", 
    category: "Desktop",
    userDescription: "The desktop display system has malfunctioned",
    technicalDescription: "Desktop component failed to render or entered an invalid state",
    possibleCauses: ["Icon collision", "Layout corruption", "Render loop"],
    suggestedFixes: ["Restart the system", "Clear desktop layout", "Reset to defaults"]
  },
  RENDER_FAILURE: { 
    hex: "0x00000002", 
    severity: "HIGH", 
    category: "Rendering",
    userDescription: "A visual component failed to display correctly",
    technicalDescription: "React component threw an unhandled exception during render",
    possibleCauses: ["Invalid props", "Missing data", "Component crash"],
    suggestedFixes: ["Refresh the page", "Check for corrupted data", "Report to developers"]
  },
  ICON_COLLISION: { 
    hex: "0x00000003", 
    severity: "MEDIUM", 
    category: "Desktop",
    userDescription: "Desktop icons overlapped in an unrecoverable way",
    technicalDescription: "Multiple icons assigned to same position, conflict resolution failed",
    possibleCauses: ["Drag-drop error", "Layout save failure", "Position corruption"],
    suggestedFixes: ["Reset icon positions", "Clear desktop cache"]
  },
  WINDOW_OVERFLOW: { 
    hex: "0x00000004", 
    severity: "MEDIUM", 
    category: "Window Manager",
    userDescription: "Too many windows were open or window state became invalid",
    technicalDescription: "Window manager exceeded maximum window count or z-index overflow",
    possibleCauses: ["Window leak", "Unclosed modals", "Z-index overflow"],
    suggestedFixes: ["Close all windows", "Restart system"]
  },
  DATA_INCORRECT: { 
    hex: "0x00000010", 
    severity: "CRITICAL", 
    category: "Data Integrity",
    userDescription: "Saved data was found to be corrupted or invalid",
    technicalDescription: "Data validation failed - stored data does not match expected schema",
    possibleCauses: ["Storage corruption", "Incomplete save", "Version mismatch"],
    suggestedFixes: ["Factory reset", "Restore from backup", "Clear localStorage"]
  },
  STATE_CORRUPTION: { 
    hex: "0x00000011", 
    severity: "CRITICAL", 
    category: "State",
    userDescription: "The application's internal state became inconsistent",
    technicalDescription: "React state entered an impossible combination of values",
    possibleCauses: ["Race condition", "Improper state update", "Memory issue"],
    suggestedFixes: ["Restart immediately", "Report bug with steps to reproduce"]
  },
  STORAGE_OVERFLOW: { 
    hex: "0x00000012", 
    severity: "HIGH", 
    category: "Storage",
    userDescription: "Storage space has been exhausted",
    technicalDescription: "localStorage quota exceeded - cannot save any more data",
    possibleCauses: ["Too many files", "Large file stored", "Quota limit reached"],
    suggestedFixes: ["Delete unnecessary files", "Clear old data", "Use recovery mode"]
  },
  STORAGE_QUOTA_EXCEEDED: { 
    hex: "0x00000012", 
    severity: "HIGH", 
    category: "Storage",
    userDescription: "Storage space has been exhausted",
    technicalDescription: "localStorage quota exceeded - cannot save any more data",
    possibleCauses: ["Too many files", "Large file stored", "Quota limit reached"],
    suggestedFixes: ["Delete unnecessary files", "Clear old data", "Use recovery mode"]
  },
  PARSE_FAILURE: { 
    hex: "0x00000013", 
    severity: "HIGH", 
    category: "Data",
    userDescription: "Could not read saved data - it appears corrupted",
    technicalDescription: "JSON.parse threw an exception on stored data",
    possibleCauses: ["Incomplete write", "Manual edit error", "Encoding issue"],
    suggestedFixes: ["Clear corrupted key", "Factory reset if critical data"]
  },
  KERNEL_PANIC: { 
    hex: "0x00000020", 
    severity: "CRITICAL", 
    category: "Kernel",
    userDescription: "The core system encountered a fatal error",
    technicalDescription: "Core system module threw an unrecoverable exception",
    possibleCauses: ["Critical module failure", "Memory exhaustion", "Infinite loop"],
    suggestedFixes: ["Restart required", "May need factory reset"]
  },
  MEMORY_EXHAUSTED: { 
    hex: "0x00000021", 
    severity: "CRITICAL", 
    category: "Memory",
    userDescription: "The system ran out of available memory",
    technicalDescription: "Browser memory limit reached - allocation failed",
    possibleCauses: ["Memory leak", "Too many open apps", "Large data set"],
    suggestedFixes: ["Close browser tabs", "Restart browser", "Reduce open apps"]
  },
  MEMORY_PRESSURE: { 
    hex: "0x00000021", 
    severity: "HIGH", 
    category: "Memory",
    userDescription: "The system is running low on available memory",
    technicalDescription: "JavaScript heap usage is critically high",
    possibleCauses: ["Memory leak", "Too many open apps", "Large data set"],
    suggestedFixes: ["Close browser tabs", "Restart browser", "Reduce open apps"]
  },
  INFINITE_LOOP: { 
    hex: "0x00000022", 
    severity: "HIGH", 
    category: "Process",
    userDescription: "A process got stuck in an endless loop",
    technicalDescription: "Detected infinite re-render or processing loop",
    possibleCauses: ["useEffect dependency error", "Recursive call", "Logic error"],
    suggestedFixes: ["Restart system", "Report bug to developers"]
  },
  INFINITE_LOOP_DETECTED: { 
    hex: "0x00000022", 
    severity: "HIGH", 
    category: "Process",
    userDescription: "A component is re-rendering excessively",
    technicalDescription: "Detected infinite re-render loop in React component",
    possibleCauses: ["useEffect dependency error", "Recursive call", "State update loop"],
    suggestedFixes: ["Restart system", "Report bug to developers"]
  },
  STACK_OVERFLOW: { 
    hex: "0x00000023", 
    severity: "CRITICAL", 
    category: "Stack",
    userDescription: "Too many nested operations caused a stack overflow",
    technicalDescription: "Maximum call stack size exceeded",
    possibleCauses: ["Deep recursion", "Circular reference", "Infinite recursion"],
    suggestedFixes: ["Restart required", "Report to developers with reproduction steps"]
  },
  COMPONENT_STACK_OVERFLOW: { 
    hex: "0x00000024", 
    severity: "CRITICAL", 
    category: "Stack",
    userDescription: "A component caused a stack overflow",
    technicalDescription: "Maximum call stack size exceeded in component tree",
    possibleCauses: ["Deeply nested components", "Recursive rendering", "Circular dependencies"],
    suggestedFixes: ["Restart required", "Check component hierarchy"]
  },
  DOM_MUTATION_OVERFLOW: { 
    hex: "0x00000025", 
    severity: "HIGH", 
    category: "DOM",
    userDescription: "Too many DOM changes occurred rapidly",
    technicalDescription: "Excessive DOM mutations detected - possible infinite update loop",
    possibleCauses: ["Animation loop error", "Rapid state updates", "MutationObserver issue"],
    suggestedFixes: ["Restart system", "Check for runaway animations"]
  },
  NETWORK_FAILURE_CASCADE: { 
    hex: "0x00000030", 
    severity: "HIGH", 
    category: "Network",
    userDescription: "Multiple network connections failed consecutively",
    technicalDescription: "Detected cascade of network failures - API or connectivity issue",
    possibleCauses: ["Server unreachable", "API rate limiting", "Network instability"],
    suggestedFixes: ["Check internet connection", "Wait and retry", "Check server status"]
  },
  LOCALSTORAGE_CORRUPTION: { 
    hex: "0x00000031", 
    severity: "CRITICAL", 
    category: "Storage",
    userDescription: "Critical system data is corrupted",
    technicalDescription: "JSON parse failed on critical localStorage keys",
    possibleCauses: ["Incomplete write", "Browser crash during save", "Manual tampering"],
    suggestedFixes: ["Use data recovery", "Factory reset", "Restore from backup"]
  },
  DEV_ERR: { 
    hex: "0x000000FF", 
    severity: "INFO", 
    category: "Developer",
    userDescription: "This is a developer-triggered test error",
    technicalDescription: "Manually triggered via DEF-DEV console for testing",
    possibleCauses: ["Developer testing", "DEF-DEV command"],
    suggestedFixes: ["No action needed - this was intentional"]
  },
  DEV_TEST: { 
    hex: "0x000000FE", 
    severity: "INFO", 
    category: "Developer",
    userDescription: "This is a test bugcheck for debugging purposes",
    technicalDescription: "Test bugcheck triggered via DEF-DEV admin panel",
    possibleCauses: ["Intentional test"],
    suggestedFixes: ["Click restart to continue"]
  },
  UNHANDLED_EXCEPTION: { 
    hex: "0x00000099", 
    severity: "HIGH", 
    category: "Exception",
    userDescription: "An unexpected error occurred that wasn't handled",
    technicalDescription: "Uncaught exception propagated to top level error boundary",
    possibleCauses: ["Unhandled promise rejection", "Uncaught throw", "Async error"],
    suggestedFixes: ["Restart system", "Report bug with console logs"]
  },
  ASYNC_FAILURE: { 
    hex: "0x0000009A", 
    severity: "MEDIUM", 
    category: "Async",
    userDescription: "An asynchronous operation failed unexpectedly",
    technicalDescription: "Unhandled promise rejection at top level",
    possibleCauses: ["Network timeout", "API error", "Race condition"],
    suggestedFixes: ["Retry the operation", "Check network connection"]
  },
  UNKNOWN_FATAL: { 
    hex: "0x000000DE", 
    severity: "CRITICAL", 
    category: "Unknown",
    userDescription: "An unknown fatal error occurred",
    technicalDescription: "Unrecognized error type triggered system halt",
    possibleCauses: ["Unknown"],
    suggestedFixes: ["Factory reset may be required", "Contact developers"]
  },
};

export const BugcheckScreen = ({ bugcheck, onRestart, onReportToDev, onRecovery }: BugcheckScreenProps) => {
  const [selectedOption, setSelectedOption] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [counter, setCounter] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeInfo = BUGCHECK_CODES[bugcheck.code] || {
    hex: "0x000000DE",
    severity: "CRITICAL" as const,
    category: "Unknown",
    userDescription: "An unknown error occurred",
    technicalDescription: bugcheck.description,
    possibleCauses: ["Unknown cause"],
    suggestedFixes: ["Restart the system"]
  };

  // Save bugcheck to localStorage for DEF-DEV
  useEffect(() => {
    try {
      const existing = localStorage.getItem('urbanshade_bugchecks');
      const bugchecks = existing ? JSON.parse(existing) : [];
      bugchecks.push({ ...bugcheck, fromError: true });
      localStorage.setItem('urbanshade_bugchecks', JSON.stringify(bugchecks.slice(-50)));
    } catch {}
  }, [bugcheck]);

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
      if (e.key === "ArrowUp") setSelectedOption(prev => Math.max(0, prev - 1));
      else if (e.key === "ArrowDown") setSelectedOption(prev => Math.min(2, prev + 1));
      else if (e.key === "Enter") {
        if (selectedOption === 0) onRestart();
        else if (selectedOption === 1) onRestart();
        else if (selectedOption === 2 && onRecovery) onRecovery();
      }
      else if (e.key === "F8") setShowDetails(!showDetails);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOption, onRestart, onRecovery, showDetails]);

  // Memory address counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => (prev + 1) % 9999);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const options = [
    "Launch Startup Repair (recommended)",
    "Start UrbanShade Normally", 
    "Open Recovery Environment",
  ];

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
    if (index === 0) onRestart();
    else if (index === 1) onRestart();
    else if (index === 2 && onRecovery) onRecovery();
    else if (index === 2) onReportToDev();
  };

  return (
    <div className={`fixed inset-0 bg-black text-white font-mono flex flex-col z-[9999] select-none ${!showCursor ? 'cursor-none' : ''}`}>
      {/* Top border accent */}
      <div className="h-1 bg-white" />

      {/* Header */}
      <div className="px-8 py-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">UrbanShade Error Recovery</h1>
          <p className="text-sm text-gray-400 mt-1">A problem has been detected and the system has been halted</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>{bugcheck.timestamp}</div>
          <div className="font-mono">{codeInfo.hex}</div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-8 border-t border-white/20" />

      {/* Main content */}
      <div className="flex-1 px-8 py-6 flex gap-12">
        {/* Left side - Error info */}
        <div className="flex-1 space-y-6">
          {/* Error box */}
          <div className="border border-white p-4">
            <div className="flex items-center gap-4 mb-3">
              <span className="px-2 py-1 border border-white text-xs">
                {codeInfo.severity}
              </span>
              <span className="text-gray-400">{codeInfo.category}</span>
            </div>
            <div className="text-lg font-bold mb-2">{bugcheck.code}</div>
            <div className="text-sm text-gray-300">{codeInfo.userDescription}</div>
          </div>

          {/* Technical info */}
          <div className="space-y-2 text-xs">
            <div className="flex gap-4">
              <span className="text-gray-500 w-20">Address:</span>
              <span className="font-mono">0x{counter.toString(16).padStart(8, '0').toUpperCase()}</span>
            </div>
            {bugcheck.location && (
              <div className="flex gap-4">
                <span className="text-gray-500 w-20">Location:</span>
                <span>{bugcheck.location}</span>
              </div>
            )}
            <div className="flex gap-4">
              <span className="text-gray-500 w-20">Build:</span>
              <span>US-2.5.0</span>
            </div>
          </div>

          {/* Recovery options */}
          <div className="border border-white/40 p-4 mt-8">
            <div className="text-xs text-gray-400 mb-3">(Use ↑↓ to navigate, ENTER to select. Mouse optional.)</div>
            {options.map((opt, i) => (
              <div
                key={i}
                onClick={() => { 
                  setSelectedOption(i);
                  if (i === 0 || i === 1) onRestart();
                  else if (i === 2 && onRecovery) onRecovery();
                }}
                onMouseEnter={() => setSelectedOption(i)}
                className={`py-2 px-3 cursor-pointer flex items-center gap-2 ${
                  selectedOption === i ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
              >
                <span className={`w-4 ${selectedOption === i ? 'text-black' : 'text-gray-600'}`}>
                  {selectedOption === i ? '►' : ' '}
                </span>
                <span className="text-sm">{opt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Details panel */}
        <div className="w-72 border-l border-white/20 pl-8">
          <div className="text-xs text-gray-500 mb-4">TECHNICAL DETAILS</div>
          
          <div className="space-y-4 text-xs">
            <div>
              <div className="text-gray-500">Description</div>
              <div className="mt-1">{codeInfo.technicalDescription}</div>
            </div>
            
            <div>
              <div className="text-gray-500">Possible Causes</div>
              <ul className="mt-1 space-y-1">
                {codeInfo.possibleCauses.map((cause, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-600">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-gray-500">Suggested Fixes</div>
              <ul className="mt-1 space-y-1">
                {codeInfo.suggestedFixes.map((fix, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-600">•</span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>

            {showDetails && bugcheck.stackTrace && (
              <div>
                <div className="text-gray-500">Stack Trace</div>
                <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap text-gray-400 max-h-32 overflow-y-auto">
                  {bugcheck.stackTrace}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/20 px-8 py-4 flex items-center justify-between">
        <div className="text-xs text-gray-500 space-x-6">
          <span>ENTER=Choose</span>
          <span>↑↓=Select</span>
          <span>F8=Details</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onReportToDev}
            className="px-4 py-2 text-xs border border-white/40 hover:bg-white/10 transition-colors"
          >
            DEF-DEV
          </button>
          <button
            onClick={onRestart}
            className="px-4 py-2 text-xs bg-white text-black font-bold hover:bg-gray-200 transition-colors"
          >
            RESTART
          </button>
        </div>
      </div>

      {/* Bottom border accent */}
      <div className="h-1 bg-white" />
    </div>
  );
};

// Helper to create bugcheck
export const createBugcheck = (
  code: keyof typeof BUGCHECK_CODES | string, 
  description: string, 
  location?: string,
  stackTrace?: string
): BugcheckData => ({
  code,
  description,
  timestamp: new Date().toISOString(),
  location,
  stackTrace,
  systemInfo: {
    userAgent: navigator.userAgent.slice(0, 80),
    localStorage: `${localStorage.length} entries`,
    url: window.location.pathname,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
  }
});