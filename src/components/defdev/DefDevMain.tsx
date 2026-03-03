import { useState, useEffect, useRef } from "react";
import { X, AlertOctagon, Zap } from "lucide-react";
import { saveState } from "@/lib/persistence";
import { toast } from "sonner";
import { actionDispatcher } from "@/lib/actionDispatcher";
import DefDevTabs from "./DefDevTabs";
import DefDevHeader from "./DefDevHeader";
import WarningScreen from "./WarningScreen";

// Import all tab components
import ConsoleTab from "./tabs/ConsoleTab";
import ActionsTab from "./tabs/ActionsTab";
import TerminalTab from "./tabs/TerminalTab";
import StorageTab from "./tabs/StorageTab";
import RecoveryTab from "./tabs/RecoveryTab";
import BugchecksTab from "./tabs/BugchecksTab";
import { PerformanceTab } from "./tabs/PerformanceTab";
import NetworksTab from "./tabs/NetworksTab";
import EventsDebugTab from "./tabs/EventsDebugTab";
import ComponentsTab from "./tabs/ComponentsTab";
import BootAnalyzerTab from "./tabs/BootAnalyzerTab";
import CrashAnalyzerTab from "./tabs/CrashAnalyzerTab";
import MemoryProfilerTab from "./tabs/MemoryProfilerTab";
import ModManagerTab from "./tabs/ModManagerTab";
import SupabaseTab from "./tabs/SupabaseTab";
import FakeModTab from "./tabs/FakeModTab";
import AdminTab from "./tabs/AdminTab";
import ScreenPreviewTab from "./tabs/ScreenPreviewTab";
import { TabId, LogEntry, ActionEntry, RecoveryImage, BugcheckEntry, FakeModerationAction, CrashEntry } from "./hooks/useDefDevState";
import { loadState } from "@/lib/persistence";

const DefDevMain = () => {
  // Core state
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [crashEntry, setCrashEntry] = useState<CrashEntry | null>(null);
  const [firstBootSetup, setFirstBootSetup] = useState(false);
  const [actionConsentChecked, setActionConsentChecked] = useState(false);
  const [actionPersistenceEnabled, setActionPersistenceEnabled] = useState(false);
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState<TabId>("console");
  
  // Data state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [recoveryImages, setRecoveryImages] = useState<RecoveryImage[]>([]);
  const [bugchecks, setBugchecks] = useState<BugcheckEntry[]>([]);
  const [fakeModerationActions, setFakeModerationActions] = useState<FakeModerationAction[]>([]);
  const [activeFakeMod, setActiveFakeMod] = useState<FakeModerationAction | null>(null);
  
  // Filter state
  const [filter, setFilter] = useState<"all" | "error" | "warn" | "info" | "system">("all");
  const [actionFilter, setActionFilter] = useState<"ALL" | "SYSTEM" | "APP" | "FILE" | "USER" | "SECURITY" | "WINDOW">("ALL");
  const [showTechnical, setShowTechnical] = useState(true);
  
  // Refs
  const logIdRef = useRef(0);
  const actionIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Check if coming from crash screen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCrash = urlParams.get('from') === 'crash';
    
    if (fromCrash) {
      const crashData = localStorage.getItem('urbanshade_crash_entry');
      if (crashData) {
        const parsed = JSON.parse(crashData);
        setCrashEntry(parsed);
        setShowWarning(false);
        setSelectedTab("bugchecks");
        // Add crash to bugchecks
        const existingBugchecks = JSON.parse(localStorage.getItem('urbanshade_bugchecks') || '[]');
        const newBugcheck: BugcheckEntry = {
          code: parsed.stopCode,
          description: `Crash from ${parsed.process || 'unknown process'}`,
          timestamp: parsed.timestamp,
          location: parsed.module,
          systemInfo: { source: 'crash_screen' }
        };
        const updated = [newBugcheck, ...existingBugchecks].slice(0, 50);
        localStorage.setItem('urbanshade_bugchecks', JSON.stringify(updated));
        setBugchecks(updated);
        localStorage.removeItem('urbanshade_crash_entry');
      }
      setDevModeEnabled(true);
    }
  }, []);

  // Check dev mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCrash = urlParams.get('from') === 'crash';
    if (fromCrash) return;
    
    const devEnabled = loadState("settings_developer_mode", false) || loadState("urbanshade_dev_mode_install", false);
    setDevModeEnabled(devEnabled);
    
    const hasAcceptedWarning = localStorage.getItem('def_dev_warning_accepted') === 'true';
    if (hasAcceptedWarning && devEnabled) {
      setWarningAccepted(true);
      setShowWarning(false);
    }
    
    const hasCompletedSetup = localStorage.getItem('def_dev_setup_complete') === 'true';
    if (!hasCompletedSetup && devEnabled) {
      setFirstBootSetup(true);
    }
    
    const hasConsent = localStorage.getItem('def_dev_actions_consent') === 'true';
    setActionPersistenceEnabled(hasConsent);
    
    // Load saved data
    const saved = localStorage.getItem('urbanshade_recovery_images_data');
    if (saved) setRecoveryImages(JSON.parse(saved));
    
    const bugcheckData = localStorage.getItem('urbanshade_bugchecks');
    if (bugcheckData) setBugchecks(JSON.parse(bugcheckData));
    
    const fakeModData = localStorage.getItem('def_dev_fake_mod_actions');
    if (fakeModData) setFakeModerationActions(JSON.parse(fakeModData));
  }, []);

  // Console capture
  useEffect(() => {
    if (!devModeEnabled || showWarning) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    const simplifyError = (message: string): string => {
      const simplifications: [RegExp, string][] = [
        [/cannot read propert(y|ies) of (undefined|null)/i, "Something tried to use data that doesn't exist yet"],
        [/is not a function/i, "The system tried to run something that isn't runnable"],
        [/is not defined/i, "The system is looking for something that doesn't exist"],
        [/syntax error/i, "There's a typo or formatting problem"],
        [/network error|failed to fetch/i, "Couldn't connect to the internet or server"],
        [/timeout/i, "The operation took too long and was stopped"],
        [/permission denied|unauthorized/i, "You don't have permission to do this"],
        [/out of memory/i, "The system ran out of memory"],
        [/maximum call stack/i, "The system got stuck in a loop"],
        [/unexpected token/i, "The system found something it didn't expect"],
        [/failed to load/i, "Couldn't load a required file"],
        [/cors|cross-origin/i, "Security blocked a connection to another website"],
      ];

      for (const [pattern, simple] of simplifications) {
        if (pattern.test(message)) return simple;
      }
      return message.length > 100 ? "An unexpected error occurred" : message;
    };

    const addLog = (type: LogEntry["type"], ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");
      
      const newLog: LogEntry = {
        id: logIdRef.current++,
        type,
        timestamp: new Date(),
        message,
        simplified: type === "error" ? simplifyError(message) : undefined,
        raw: message,
      };

      setLogs(prev => [...prev.slice(-500), newLog]);
    };

    const addAction = (type: ActionEntry["type"], message: string) => {
      const newAction: ActionEntry = {
        id: actionIdRef.current++,
        type,
        timestamp: new Date(),
        message
      };
      setActions(prev => [...prev.slice(-200), newAction]);
    };

    console.log = (...args) => { originalConsole.log(...args); addLog("info", ...args); };
    console.warn = (...args) => { originalConsole.warn(...args); addLog("warn", ...args); };
    console.error = (...args) => { originalConsole.error(...args); addLog("error", ...args); };
    console.info = (...args) => { originalConsole.info(...args); addLog("info", ...args); };
    console.debug = (...args) => { originalConsole.debug(...args); addLog("debug", ...args); };

    const handleAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, message } = customEvent.detail || {};
      if (type && message) addAction(type, message);
    };

    const handleError = (event: ErrorEvent) => {
      addLog("error", `CRASH: ${event.message} at ${event.filename}:${event.lineno}`);
      addAction("SYSTEM", `Fatal error: ${event.message}`);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog("error", `ASYNC ERROR: ${event.reason}`);
      addAction("SYSTEM", `Unhandled rejection: ${event.reason}`);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("defdev-action", handleAction);

    addLog("system", "DEF-DEV 3.0 Console initialized - All systems operational");
    addLog("system", `LocalStorage: ${localStorage.length} entries, ${(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB`);
    addAction("SYSTEM", "DEF-DEV 3.0 Console initialized");

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("defdev-action", handleAction);
    };
  }, [devModeEnabled, showWarning]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Not enabled state
  if (!devModeEnabled) {
    const handleManualEnable = () => {
      saveState("settings_developer_mode", true);
      setDevModeEnabled(true);
      toast.success("Developer Mode manually enabled");
    };

    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">!COULDN'T BIND TO PAGE!</h1>
          <p className="text-gray-400 mb-6">
            Developer Mode is not enabled on this system. Enable it in Settings → Developer Options or during installation.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleManualEnable}
              className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-amber-400 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Manual Handshake (Enable Dev Mode)
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400"
            >
              Return to System
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Warning screen
  if (showWarning) {
    return (
      <WarningScreen
        firstBootSetup={firstBootSetup}
        actionConsentChecked={actionConsentChecked}
        onConsentChange={setActionConsentChecked}
        onAccept={() => {
          if (actionConsentChecked) {
            actionDispatcher.setPersistence(true);
            setActionPersistenceEnabled(true);
            localStorage.setItem('def_dev_actions_consent', 'true');
            toast.success("Persistent action logging enabled");
          }
          localStorage.setItem('def_dev_warning_accepted', 'true');
          if (firstBootSetup) {
            localStorage.setItem('def_dev_setup_complete', 'true');
            toast.success("DEF-DEV 3.0 setup complete!");
          }
          setWarningAccepted(true);
          setShowWarning(false);
        }}
        onCancel={() => window.location.href = "/"}
      />
    );
  }

  // Helper functions
  const filteredLogs = logs.filter(log => filter === "all" || log.type === filter);
  const filteredActions = actionFilter === "ALL" ? actions : actions.filter(a => a.type === actionFilter);

  const saveFakeModerationAction = (action: FakeModerationAction) => {
    const updated = [...fakeModerationActions, action];
    setFakeModerationActions(updated);
    localStorage.setItem('def_dev_fake_mod_actions', JSON.stringify(updated));
  };

  const triggerFakeMod = (action: FakeModerationAction) => {
    setActiveFakeMod(action);
  };

  const dismissFakeMod = () => {
    setActiveFakeMod(null);
  };

  const clearBugchecks = () => {
    setBugchecks([]);
    localStorage.removeItem('urbanshade_bugchecks');
    toast.success("Bugcheck reports cleared");
  };

  // Render tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case "console":
        return (
          <ConsoleTab
            logs={logs}
            filter={filter}
            onFilterChange={setFilter}
            showTechnical={showTechnical}
            onShowTechnicalChange={setShowTechnical}
            filteredLogs={filteredLogs}
            onClearLogs={() => setLogs([])}
            logsEndRef={logsEndRef}
          />
        );
      case "actions":
        return (
          <ActionsTab
            actions={actions}
            setActions={setActions}
            actionFilter={actionFilter}
            onFilterChange={setActionFilter}
            actionPersistenceEnabled={actionPersistenceEnabled}
            filteredActions={filteredActions}
          />
        );
      case "terminal":
        return <TerminalTab />;
      case "storage":
        return <StorageTab />;
      case "images":
        return <RecoveryTab />;
      case "bugchecks":
        return <BugchecksTab />;
      case "performance":
        return <PerformanceTab />;
      case "network":
        return <NetworksTab />;
      case "events":
        return <EventsDebugTab />;
      case "components":
        return <ComponentsTab />;
      case "boot":
        return <BootAnalyzerTab />;
      case "crashes":
        return <CrashAnalyzerTab />;
      case "memory":
        return <MemoryProfilerTab />;
      case "mods":
        return <ModManagerTab />;
      case "supabase":
        return <SupabaseTab />;
      case "fakemod":
        return (
          <FakeModTab
            fakeModerationActions={fakeModerationActions}
            saveFakeModerationAction={saveFakeModerationAction}
            triggerFakeMod={triggerFakeMod}
            activeFakeMod={activeFakeMod}
            dismissFakeMod={dismissFakeMod}
          />
        );
      case "admin":
        return <AdminTab />;
      case "screenpreview":
        return <ScreenPreviewTab />;
      default:
        return <div className="p-8 text-center text-slate-500">Tab not implemented</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d1117] text-gray-100 flex flex-col font-mono">
      {/* Crash entry banner */}
      {crashEntry && (
        <div className="bg-red-500/20 border-b border-red-500/50 px-4 py-2 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <div className="flex-1">
            <span className="text-red-400 font-bold text-sm">CRASH DEBUG MODE</span>
            <span className="text-red-300/70 text-xs ml-3">
              Stop code: {crashEntry.stopCode} | Module: {crashEntry.module || 'Unknown'}
            </span>
          </div>
          <button 
            onClick={() => setCrashEntry(null)}
            className="text-red-400/70 hover:text-red-400 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Header */}
      <DefDevHeader />

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tabs Sidebar */}
        <DefDevTabs
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          bugcheckCount={bugchecks.length}
          crashEntry={!!crashEntry}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default DefDevMain;