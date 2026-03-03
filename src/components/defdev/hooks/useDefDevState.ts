import { useState, useEffect, useRef, useCallback } from "react";
import { loadState } from "@/lib/persistence";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { TerminalResult } from "@/lib/commandQueue";

export interface LogEntry {
  id: number;
  type: "info" | "warn" | "error" | "success" | "debug" | "system";
  timestamp: Date;
  message: string;
  simplified?: string;
  raw?: string;
  stack?: string;
}

export interface ActionEntry {
  id: number;
  type: "SYSTEM" | "APP" | "FILE" | "USER" | "SECURITY" | "WINDOW";
  timestamp: Date;
  message: string;
}

export interface RecoveryImage {
  name: string;
  data: Record<string, string>;
  created: string;
  size: number;
}

export interface BugcheckEntry {
  code: string;
  description: string;
  timestamp: string;
  location?: string;
  systemInfo?: Record<string, string>;
}

export interface CrashEntry {
  stopCode: string;
  process?: string;
  module?: string;
  timestamp: string;
}

export interface FakeModerationAction {
  id: string;
  type: "ban" | "warn" | "mute" | "kick";
  reason: string;
  duration?: string;
  timestamp: string;
  triggeredAt?: Date;
}

export type TabId = "console" | "actions" | "terminal" | "storage" | "images" | "bugchecks" | "admin" | "supabase" | "fakemod" | "performance" | "network" | "events" | "components" | "mockapi" | "state" | "timetravel" | "boot" | "crashes" | "memory" | "mods" | "screenpreview";

export const simplifyError = (message: string): string => {
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

export const useDefDevState = () => {
  // Core states
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [crashEntry, setCrashEntry] = useState<CrashEntry | null>(null);
  const [showCrashWarning, setShowCrashWarning] = useState(false);
  const [firstBootSetup, setFirstBootSetup] = useState(false);
  const [actionConsentChecked, setActionConsentChecked] = useState(false);
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState<TabId>("console");
  
  // Console state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "error" | "warn" | "info" | "system">("all");
  const [showTechnical, setShowTechnical] = useState(true);
  
  // Actions state
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<"ALL" | "SYSTEM" | "APP" | "FILE" | "USER" | "SECURITY" | "WINDOW">("ALL");
  const [actionPersistenceEnabled, setActionPersistenceEnabled] = useState(false);
  
  // Terminal state
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{ input: string; output: TerminalResult }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Storage state
  const [storageSearch, setStorageSearch] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Recovery Images
  const [recoveryImages, setRecoveryImages] = useState<RecoveryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<RecoveryImage | null>(null);
  
  // Bugchecks
  const [bugchecks, setBugchecks] = useState<BugcheckEntry[]>([]);
  
  // Fake Moderation
  const [fakeModerationActions, setFakeModerationActions] = useState<FakeModerationAction[]>([]);
  const [activeFakeMod, setActiveFakeMod] = useState<FakeModerationAction | null>(null);
  
  // Refs
  const logIdRef = useRef(0);
  const actionIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

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

  // Check if dev mode is enabled
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
    
    const saved = localStorage.getItem('urbanshade_recovery_images_data');
    if (saved) setRecoveryImages(JSON.parse(saved));

    const bugcheckData = localStorage.getItem('urbanshade_bugchecks');
    if (bugcheckData) setBugchecks(JSON.parse(bugcheckData));
    
    // Load fake mod actions
    const fakeModData = localStorage.getItem('def_dev_fake_mod_actions');
    if (fakeModData) setFakeModerationActions(JSON.parse(fakeModData));
  }, []);

  // Add log helper
  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const newLog: LogEntry = {
      id: logIdRef.current++,
      type,
      timestamp: new Date(),
      message,
      simplified: type === "error" ? simplifyError(message) : undefined,
      raw: message,
    };
    setLogs(prev => [...prev.slice(-500), newLog]);
  }, []);

  // Add action helper
  const addAction = useCallback((type: ActionEntry["type"], message: string) => {
    const newAction: ActionEntry = {
      id: actionIdRef.current++,
      type,
      timestamp: new Date(),
      message
    };
    setActions(prev => [...prev.slice(-200), newAction]);
  }, []);

  // Accept warning
  const acceptWarning = useCallback(() => {
    setWarningAccepted(true);
    setShowWarning(false);
    localStorage.setItem('def_dev_warning_accepted', 'true');
    if (firstBootSetup) {
      localStorage.setItem('def_dev_setup_complete', 'true');
      setFirstBootSetup(false);
    }
  }, [firstBootSetup]);

  // Filtered logs
  const filteredLogs = filter === "all" ? logs : logs.filter(l => l.type === filter);
  
  // Filtered actions
  const filteredActions = actionFilter === "ALL" ? actions : actions.filter(a => a.type === actionFilter);

  // Save fake mod actions
  const saveFakeModerationAction = useCallback((action: FakeModerationAction) => {
    setFakeModerationActions(prev => {
      const updated = [action, ...prev].slice(0, 50);
      localStorage.setItem('def_dev_fake_mod_actions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Trigger fake mod action (show the popup)
  const triggerFakeMod = useCallback((action: FakeModerationAction) => {
    setActiveFakeMod({ ...action, triggeredAt: new Date() });
  }, []);

  // Dismiss fake mod popup
  const dismissFakeMod = useCallback(() => {
    setActiveFakeMod(null);
  }, []);

  return {
    // Core
    devModeEnabled,
    showWarning,
    warningAccepted,
    crashEntry,
    setCrashEntry,
    showCrashWarning,
    setShowCrashWarning,
    firstBootSetup,
    actionConsentChecked,
    setActionConsentChecked,
    acceptWarning,
    
    // Tabs
    selectedTab,
    setSelectedTab,
    
    // Console
    logs,
    setLogs,
    filter,
    setFilter,
    showTechnical,
    setShowTechnical,
    filteredLogs,
    addLog,
    
    // Actions
    actions,
    setActions,
    actionFilter,
    setActionFilter,
    actionPersistenceEnabled,
    setActionPersistenceEnabled,
    filteredActions,
    addAction,
    
    // Terminal
    terminalInput,
    setTerminalInput,
    terminalHistory,
    setTerminalHistory,
    historyIndex,
    setHistoryIndex,
    
    // Storage
    storageSearch,
    setStorageSearch,
    editingKey,
    setEditingKey,
    editValue,
    setEditValue,
    
    // Recovery
    recoveryImages,
    setRecoveryImages,
    selectedImage,
    setSelectedImage,
    
    // Bugchecks
    bugchecks,
    setBugchecks,
    
    // Fake Moderation
    fakeModerationActions,
    setFakeModerationActions,
    activeFakeMod,
    saveFakeModerationAction,
    triggerFakeMod,
    dismissFakeMod,
    
    // Refs
    logIdRef,
    actionIdRef,
    logsEndRef,
    fileInputRef,
    terminalInputRef,
    terminalEndRef,
  };
};

export type DefDevState = ReturnType<typeof useDefDevState>;
