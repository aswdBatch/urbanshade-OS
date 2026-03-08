import { useEffect, useRef } from "react";
import { AlertOctagon } from "lucide-react";
import { saveState } from "@/lib/persistence";
import { toast } from "sonner";
import { actionDispatcher } from "@/lib/actionDispatcher";
import DefDevTabs from "./DefDevTabs";
import DefDevHeader from "./DefDevHeader";
import DefDevStatusBar from "./DefDevStatusBar";
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

import { useDefDevState } from "./hooks/useDefDevState";
import type { LogEntry, ActionEntry } from "./hooks/useDefDevState";

const DefDevMain = () => {
  const state = useDefDevState();
  const sessionStartRef = useRef<number>(Date.now());

  // Console capture
  useEffect(() => {
    if (!state.devModeEnabled || state.showWarning) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    const addLog = (type: LogEntry["type"], ...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");

      state.addLog(type, message);
    };

    const addAction = (type: ActionEntry["type"], message: string) => {
      state.addAction(type, message);
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

    state.addLog("system", "DEF-DEV 3.5 Console initialized - All systems operational");
    state.addLog("system", `LocalStorage: ${localStorage.length} entries, ${(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB`);
    state.addAction("SYSTEM", "DEF-DEV 3.5 Console initialized");

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
  }, [state.devModeEnabled, state.showWarning]);

  // Not enabled state
  if (!state.devModeEnabled) {
    const handleManualEnable = () => {
      saveState("settings_developer_mode", true);
      toast.success("Developer Mode manually enabled");
      window.location.reload();
    };

    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <span className="text-red-500 text-3xl">✕</span>
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">!COULDN'T BIND TO PAGE!</h1>
          <p className="text-gray-400 mb-6">
            Developer Mode is not enabled on this system. Enable it in Settings → Developer Options or during installation.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleManualEnable} className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-amber-400 flex items-center justify-center gap-2">
              ⚡ Manual Handshake (Enable Dev Mode)
            </button>
            <button onClick={() => window.location.href = "/"} className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400">
              Return to System
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Warning screen
  if (state.showWarning) {
    return (
      <WarningScreen
        firstBootSetup={state.firstBootSetup}
        actionConsentChecked={state.actionConsentChecked}
        onConsentChange={state.setActionConsentChecked}
        onAccept={() => {
          if (state.actionConsentChecked) {
            actionDispatcher.setPersistence(true);
            state.setActionPersistenceEnabled(true);
            localStorage.setItem('def_dev_actions_consent', 'true');
            toast.success("Persistent action logging enabled");
          }
          state.acceptWarning();
        }}
        onCancel={() => window.location.href = "/"}
      />
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (state.selectedTab) {
      case "console":
        return (
          <ConsoleTab
            logs={state.logs}
            filter={state.filter}
            onFilterChange={state.setFilter}
            showTechnical={state.showTechnical}
            onShowTechnicalChange={state.setShowTechnical}
            filteredLogs={state.filteredLogs}
            onClearLogs={() => state.setLogs([])}
            logsEndRef={state.logsEndRef}
          />
        );
      case "actions":
        return (
          <ActionsTab
            actions={state.actions}
            setActions={state.setActions}
            actionFilter={state.actionFilter}
            onFilterChange={state.setActionFilter}
            actionPersistenceEnabled={state.actionPersistenceEnabled}
            filteredActions={state.filteredActions}
          />
        );
      case "terminal": return <TerminalTab />;
      case "storage": return <StorageTab />;
      case "images": return <RecoveryTab />;
      case "bugchecks": return <BugchecksTab />;
      case "performance": return <PerformanceTab />;
      case "network": return <NetworksTab />;
      case "events": return <EventsDebugTab />;
      case "components": return <ComponentsTab />;
      case "boot": return <BootAnalyzerTab />;
      case "crashes": return <CrashAnalyzerTab />;
      case "memory": return <MemoryProfilerTab />;
      case "mods": return <ModManagerTab />;
      case "supabase": return <SupabaseTab />;
      case "fakemod":
        return (
          <FakeModTab
            fakeModerationActions={state.fakeModerationActions}
            saveFakeModerationAction={state.saveFakeModerationAction}
            triggerFakeMod={state.triggerFakeMod}
            activeFakeMod={state.activeFakeMod}
            dismissFakeMod={state.dismissFakeMod}
          />
        );
      case "admin": return <AdminTab />;
      case "screenpreview": return <ScreenPreviewTab />;
      default: return <div className="p-8 text-center text-slate-500">Tab not implemented</div>;
    }
  };

  const errorCount = state.logs.filter(l => l.type === "error").length;
  const warnCount = state.logs.filter(l => l.type === "warn").length;

  return (
    <div className="fixed inset-0 bg-[#0d1117] text-gray-100 flex flex-col font-mono">
      {/* Crash entry banner */}
      {state.crashEntry && (
        <div className="bg-red-500/20 border-b border-red-500/50 px-4 py-2 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <div className="flex-1">
            <span className="text-red-400 font-bold text-sm">CRASH DEBUG MODE</span>
            <span className="text-red-300/70 text-xs ml-3">
              Stop code: {state.crashEntry.stopCode} | Module: {state.crashEntry.module || 'Unknown'}
            </span>
          </div>
          <button onClick={() => state.setCrashEntry(null)} className="text-red-400/70 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      <DefDevHeader />

      <div className="flex-1 flex overflow-hidden">
        <DefDevTabs
          selectedTab={state.selectedTab}
          onTabChange={state.setSelectedTab}
          bugcheckCount={state.bugchecks.length}
          crashEntry={!!state.crashEntry}
        />
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      <DefDevStatusBar
        logCount={state.logs.length}
        errorCount={errorCount}
        warnCount={warnCount}
        currentTab={state.selectedTab}
        sessionStart={sessionStartRef.current}
      />
    </div>
  );
};

export default DefDevMain;
