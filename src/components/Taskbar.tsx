import { useState, useEffect, useRef } from "react";
import { Bell, Volume2, VolumeX, Power, Cloud, CloudOff, Loader2, BellOff, WifiOff, Clock } from "lucide-react";
import { VERSION } from "@/lib/versionInfo";
import { App, WindowData } from "@/types/window";
import { NotificationCenter } from "./NotificationCenter";
import { ShutdownOptionsDialog } from "./ShutdownOptionsDialog";
import { QuickSettingsFlyout } from "./QuickSettingsFlyout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useDoNotDisturb } from "@/hooks/useDoNotDisturb";
import { useSyncHistory } from "@/hooks/useSyncHistory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Notification button with anchor ref for popover positioning
const NotificationButton = ({ 
  notificationsOpen, setNotificationsOpen, setQuickSettingsOpen, isDndEnabled, unreadCount
}: {
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  setQuickSettingsOpen: (open: boolean) => void;
  isDndEnabled: boolean;
  unreadCount: number;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => { setNotificationsOpen(!notificationsOpen); setQuickSettingsOpen(false); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all relative"
        title="Notifications"
      >
        {isDndEnabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        {unreadCount > 0 && !isDndEnabled && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} anchorRef={buttonRef} />
    </>
  );
};

interface TaskbarProps {
  onStartClick: () => void;
  pinnedApps: App[];
  onPinnedClick: (app: App) => void;
  windows?: WindowData[];
  onRestoreWindow?: (id: string) => void;
  onShutdown?: () => void;
  onReboot?: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Taskbar = ({ 
  onStartClick, pinnedApps, onPinnedClick, windows = [], onRestoreWindow,
  onShutdown, onReboot, onLogout, onOpenSettings
}: TaskbarProps) => {
  const [time, setTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { isDndEnabled } = useDoNotDisturb();
  const { pendingChanges, isOnline } = useSyncHistory();
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('settings_sound_enabled') !== 'false');
  const { isEnabled: syncEnabled, isSyncing, lastSyncTime, manualSync } = useAutoSync();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('settings_sound_enabled', String(newValue));
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const groupedWindows = windows.reduce((acc, win) => {
    const key = win.app.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(win);
    return acc;
  }, {} as Record<string, typeof windows>);

  return (
    <>
      {/* Bottom Left - Version Info */}
      <div className="fixed left-6 bottom-6 z-[750] flex items-center gap-3">
        <button onClick={() => setPowerMenuOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-primary/20 transition-all">
          <Power className="w-4 h-4" />
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">UrbanShade OS</span>
          <span className="text-xs text-muted-foreground">{VERSION.displayVersion}</span>
        </div>
      </div>

      {/* Bottom Right - Clock */}
      <div className="fixed right-6 bottom-6 z-[750] text-right">
        <button onClick={() => { setQuickSettingsOpen(!quickSettingsOpen); setNotificationsOpen(false); }} className="text-right hover:opacity-80 transition-opacity">
          <div className="text-5xl font-light tracking-wide text-foreground/90 font-mono tabular-nums">{formatTime(time)}</div>
          <div className="text-sm text-muted-foreground mt-1">{formatDate(time)}</div>
        </button>
      </div>

      {/* Top Taskbar */}
      <div className="fixed left-0 right-0 top-0 h-12 flex justify-between items-center px-4 z-[800] bg-background/40 backdrop-blur-xl border-b border-primary/10 relative">
        {/* Glass edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="flex items-center gap-2">
          <button onClick={onStartClick} data-start-button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200">
            <img src="/favicon.svg" alt="U" className="w-7 h-7" />
            <span className="text-sm font-medium text-muted-foreground">Start</span>
          </button>
          <div className="h-6 w-px bg-primary/10 mx-1" />
          <div className="flex gap-1">
            {pinnedApps.map(app => (
              <button key={app.id} onClick={() => onPinnedClick(app)} className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5" title={app.name}>
                <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{app.icon}</div>
              </button>
            ))}
          </div>
          {Object.keys(groupedWindows).length > 0 && (
            <>
              <div className="h-6 w-px bg-primary/10 mx-1" />
              <div className="flex gap-1">
                {Object.entries(groupedWindows).map(([appId, wins]) => {
                  const firstWin = wins[0];
                  const hasOpen = wins.some(w => !w.minimized);
                  return (
                    <TooltipProvider key={appId} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => onRestoreWindow?.(firstWin.id)} className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${hasOpen ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
                            <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{firstWin.app.icon}</div>
                            {wins.length > 1 && (
                              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {wins.slice(0, 3).map((_, i) => <span key={i} className="w-1 h-1 rounded-full bg-primary" />)}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="p-0 bg-transparent border-0 shadow-none">
                          <div className="rounded-lg border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden min-w-[200px]">
                            {wins.map(win => (
                              <button key={win.id} onClick={() => onRestoreWindow?.(win.id)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left border-b border-border/30 last:border-b-0">
                                <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 text-primary flex-shrink-0">{win.app.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{win.app.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{win.minimized ? 'Minimized' : 'Active'}</p>
                                </div>
                                {!win.minimized && <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-dot-appear" />}
                              </button>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {windows.some(w => !w.minimized) && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 mr-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono text-foreground/80 tabular-nums">{formatTime(time)}</span>
            </div>
          )}
          {syncEnabled && (!isOnline || pendingChanges.length > 0) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs">
                    {!isOnline ? (<><WifiOff className="w-3 h-3" /><span>Offline</span></>) : (<><CloudOff className="w-3 h-3" /><span>{pendingChanges.length}</span></>)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{!isOnline ? "You're offline. Changes will sync when reconnected." : `${pendingChanges.length} changes waiting to sync`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {syncEnabled && isOnline && pendingChanges.length === 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => manualSync()} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSyncing ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{isSyncing ? "Syncing..." : `Last sync: ${formatLastSync(lastSyncTime)}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <button onClick={toggleSound} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all" title={soundEnabled ? "Mute sounds" : "Enable sounds"}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <NotificationButton notificationsOpen={notificationsOpen} setNotificationsOpen={setNotificationsOpen} setQuickSettingsOpen={setQuickSettingsOpen} isDndEnabled={isDndEnabled} unreadCount={unreadCount} />
        </div>
        
        <QuickSettingsFlyout open={quickSettingsOpen} onClose={() => setQuickSettingsOpen(false)} onOpenSettings={onOpenSettings || (() => {})} />
      </div>

      {powerMenuOpen && onShutdown && onReboot && onLogout && (
        <ShutdownOptionsDialog onClose={() => setPowerMenuOpen(false)} onShutdown={onShutdown} onSignOut={onLogout} onLock={() => onLogout()} onRestart={onReboot} />
      )}
    </>
  );
};
