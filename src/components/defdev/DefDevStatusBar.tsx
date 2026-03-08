import { useState, useEffect } from "react";
import { TabId } from "./hooks/useDefDevState";

interface DefDevStatusBarProps {
  logCount: number;
  errorCount: number;
  warnCount: number;
  currentTab: TabId;
  sessionStart: number;
}

const DefDevStatusBar = ({ logCount, errorCount, warnCount, currentTab, sessionStart }: DefDevStatusBarProps) => {
  const [uptime, setUptime] = useState("0:00");
  const [storageUsage, setStorageUsage] = useState("0 KB");

  useEffect(() => {
    const update = () => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setUptime(`${mins}:${secs.toString().padStart(2, "0")}`);

      try {
        const bytes = JSON.stringify(localStorage).length;
        setStorageUsage(bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`);
      } catch { setStorageUsage("N/A"); }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  return (
    <div className="h-6 bg-slate-950 border-t border-slate-800/60 flex items-center px-3 gap-4 text-[10px] font-mono text-slate-500 select-none shrink-0">
      <span className="text-slate-400">{currentTab.toUpperCase()}</span>
      <span className="border-l border-slate-800 pl-3">Logs: <span className="text-slate-300">{logCount}</span></span>
      {errorCount > 0 && <span className="text-red-400">Errors: {errorCount}</span>}
      {warnCount > 0 && <span className="text-amber-400">Warnings: {warnCount}</span>}
      <span className="ml-auto border-l border-slate-800 pl-3">Storage: {storageUsage}</span>
      <span className="border-l border-slate-800 pl-3">Uptime: {uptime}</span>
    </div>
  );
};

export default DefDevStatusBar;
