import { Terminal, Activity, Send, Database, HardDrive, Shield, Skull, Gavel, Cpu, Globe, Zap, Monitor, Layers, FlaskConical, MemoryStick, Package, Cloud, Wrench } from "lucide-react";
import { TabId } from "./hooks/useDefDevState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DefDevTabsProps {
  selectedTab: TabId;
  onTabChange: (tab: TabId) => void;
  bugcheckCount: number;
  crashEntry: boolean;
}

const TAB_GROUPS = [
  {
    label: "Core",
    tabs: [
      { id: "console" as TabId, label: "Console", icon: Terminal, color: "text-cyan-400", shortcut: "1" },
      { id: "terminal" as TabId, label: "Terminal", icon: Send, color: "text-green-400", shortcut: "2" },
      { id: "actions" as TabId, label: "Actions", icon: Activity, color: "text-purple-400", shortcut: "3" },
    ]
  },
  {
    label: "Diagnostics",
    tabs: [
      { id: "bugchecks" as TabId, label: "Crashes", icon: Shield, color: "text-red-400" },
      { id: "performance" as TabId, label: "Performance", icon: Cpu, color: "text-teal-400" },
      { id: "network" as TabId, label: "Network", icon: Globe, color: "text-sky-400" },
      { id: "boot" as TabId, label: "Boot Analyzer", icon: Wrench, color: "text-lime-400" },
      { id: "crashes" as TabId, label: "Crash Analyzer", icon: FlaskConical, color: "text-rose-400" },
      { id: "memory" as TabId, label: "Memory", icon: MemoryStick, color: "text-violet-400" },
    ]
  },
  {
    label: "Data",
    tabs: [
      { id: "storage" as TabId, label: "Storage", icon: Database, color: "text-blue-400" },
      { id: "events" as TabId, label: "Events", icon: Zap, color: "text-yellow-400" },
      { id: "components" as TabId, label: "Components", icon: Layers, color: "text-indigo-400" },
      { id: "supabase" as TabId, label: "Supabase", icon: Cloud, color: "text-emerald-400" },
    ]
  },
  {
    label: "Tools",
    tabs: [
      { id: "images" as TabId, label: "Recovery", icon: HardDrive, color: "text-orange-400" },
      { id: "fakemod" as TabId, label: "FakeMod", icon: Gavel, color: "text-rose-400" },
      { id: "screenpreview" as TabId, label: "Screens", icon: Monitor, color: "text-pink-400" },
      { id: "mods" as TabId, label: "Mods", icon: Package, color: "text-fuchsia-400" },
      { id: "admin" as TabId, label: "Admin", icon: Skull, color: "text-amber-400" },
    ]
  },
];

const DefDevTabs = ({ selectedTab, onTabChange, bugcheckCount, crashEntry }: DefDevTabsProps) => {
  return (
    <div className="w-44 min-w-44 border-l border-slate-800/80 bg-slate-950/70 flex flex-col h-full">
      <div className="p-2.5 border-b border-slate-800/60">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Navigation</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-3">
          {TAB_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-2 py-1 text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.tabs.map(tab => {
                  const isActive = selectedTab === tab.id;
                  const isBugcheck = tab.id === "bugchecks";
                  const hasBugchecks = isBugcheck && bugcheckCount > 0;
                  const isCrashTab = crashEntry && isBugcheck;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      title={'shortcut' in tab ? `Ctrl+${(tab as any).shortcut}` : undefined}
                      className={cn(
                        "flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md transition-all",
                        isActive
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent",
                        isCrashTab && "ring-1 ring-red-500/50"
                      )}
                    >
                      <tab.icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-amber-400" : tab.color)} />
                      <span className="font-medium truncate flex-1 text-left">{tab.label}</span>
                      {hasBugchecks && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">{bugcheckCount}</span>
                      )}
                      {isCrashTab && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DefDevTabs;
