import { useState, useEffect, useCallback } from "react";
import { Taskbar } from "./Taskbar";
import { DesktopIcon } from "./DesktopIcon";
import { StartMenu } from "./StartMenu";
import { WindowManager } from "./WindowManager";
import { ContextMenu, getDesktopMenuItems } from "./ContextMenu";
import { AltTabSwitcher } from "./AltTabSwitcher";
import { GlobalSearch } from "./GlobalSearch";
import { WidgetManager } from "./widgets/WidgetManager";
import { TaskView } from "./TaskView";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMultipleDesktops } from "@/hooks/useMultipleDesktops";
import { useOnlineAccount } from "@/hooks/useOnlineAccount";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useNotifications } from "@/hooks/useNotifications";
import { useWindowManager } from "@/hooks/useWindowManager";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { osToast } from "@/components/shared/OSToast";

export const Desktop = ({ 
  onLogout, 
  onReboot, 
  onShutdown,
  onCriticalKill, 
  onLockdown, 
  onEnterBios, 
  onUpdate,
  onLock,
  safeMode = false,
  onExitSafeMode
}: { 
  onLogout: () => void; 
  onReboot: () => void; 
  onShutdown?: () => void;
  onCriticalKill: (processName: string, type?: "kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload") => void; 
  onLockdown?: (protocolName: string) => void; 
  onEnterBios?: () => void; 
  onUpdate?: () => void;
  onLock?: () => void;
  safeMode?: boolean;
  onExitSafeMode?: () => void;
}) => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [taskViewOpen, setTaskViewOpen] = useState(false);

  const {
    windows, openWindow, closeWindow, minimizeWindow, focusWindow, restoreWindow, allApps, apps
  } = useWindowManager();
  
  // Multiple desktops
  const { 
    desktops, activeDesktopId, switchDesktop, createDesktop
  } = useMultipleDesktops();
  
  // Online account sync
  const { isOnlineMode } = useOnlineAccount();
  const { manualSync } = useAutoSync();
  const { addNotification } = useNotifications();
  
  // Welcome notification for online users (only once per session)
  useEffect(() => {
    if (isOnlineMode && !sessionStorage.getItem("welcomed")) {
      sessionStorage.setItem("welcomed", "true");
      addNotification({
        title: "Welcome Back!",
        message: "You're signed in with your online account. Settings will sync automatically.",
        type: "success"
      });
    }
  }, [isOnlineMode, addNotification]);
  
  // Load background gradient from settings
  const [bgGradient, setBgGradient] = useState(() => {
    const start = localStorage.getItem('settings_bg_gradient_start') || '#1a1a2e';
    const end = localStorage.getItem('settings_bg_gradient_end') || '#16213e';
    return { start, end };
  });

  useEffect(() => {
    actionDispatcher.system("Desktop environment loaded");
    actionDispatcher.system(`Installation type: ${localStorage.getItem('urbanshade_install_type') || 'standard'}`);
    
    const handleStorageChange = () => {
      const start = localStorage.getItem('settings_bg_gradient_start') || '#1a1a2e';
      const end = localStorage.getItem('settings_bg_gradient_end') || '#16213e';
      setBgGradient({ start, end });
      actionDispatcher.file("Settings updated");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const settingsApp = allApps.find(app => app.id === 'settings');

  // Handle Aero Shake - minimize all other windows
  const handleAeroShake = useCallback((shakingWindowId: string) => {
    let minimizedCount = 0;
    windows.forEach(w => {
      if (w.id !== shakingWindowId && !w.minimized) {
        minimizeWindow(w.id);
        minimizedCount++;
      }
    });
    if (minimizedCount > 0) {
      osToast.info('Aero Shake', `Minimized ${minimizedCount} window${minimizedCount > 1 ? 's' : ''}`);
    }
  }, [windows, minimizeWindow]);

  // Keyboard shortcuts
  const { altTabActive, altTabIndex, sortedWindows: altTabWindows } = useKeyboardShortcuts({
    windows,
    onFocusWindow: focusWindow,
    onMinimizeWindow: minimizeWindow,
    onCloseWindow: closeWindow,
    onToggleStartMenu: () => setStartMenuOpen(prev => !prev),
    openWindow,
    allApps,
    onToggleSearch: () => setSearchOpen(prev => !prev),
    onToggleTaskView: () => setTaskViewOpen(prev => !prev),
    onLock
  });

  const openWindowAndCloseStart = useCallback((app: any) => {
    openWindow(app);
    setStartMenuOpen(false);
  }, [openWindow]);

  return (
    <div 
      className={`relative h-screen w-full overflow-hidden ${safeMode ? 'grayscale-[30%] contrast-[90%]' : ''}`}
      style={{
        background: safeMode 
          ? 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)'
          : `linear-gradient(160deg, ${bgGradient.start} 0%, ${bgGradient.end} 50%, ${bgGradient.start} 100%)`
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Safe Mode Watermarks */}
      {safeMode && (
        <>
          <div className="fixed top-20 left-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">SAFE MODE</div>
          <div className="fixed top-20 right-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">SAFE MODE</div>
          <div className="fixed bottom-20 left-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">SAFE MODE</div>
          <div className="fixed bottom-20 right-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">SAFE MODE</div>
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9999] bg-yellow-600/90 text-black px-4 py-1.5 rounded-b-lg text-xs font-bold flex items-center gap-2 shadow-lg">
            <Shield className="w-4 h-4" />
            Safe Mode - Limited functionality. Restart to exit.
            {onExitSafeMode && (
              <button onClick={onExitSafeMode} className="ml-2 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[10px] transition-colors">
                Exit Safe Mode
              </button>
            )}
          </div>
        </>
      )}

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/30 to-transparent pointer-events-none z-[5]" />

      {!safeMode && (
        <WidgetManager onOpenApp={(appId) => {
          const app = allApps.find(a => a.id === appId);
          if (app) openWindow(app);
        }} />
      )}

      <div className="absolute inset-0 z-10 pt-16 px-6 pb-24 pointer-events-none">
        <div className="grid gap-3 pointer-events-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, 90px)', gridAutoRows: '100px' }}>
          {apps.map((app) => (
            <DesktopIcon key={app.id} app={app} />
          ))}
        </div>
      </div>

      <WindowManager 
        windows={windows} onClose={closeWindow} onFocus={focusWindow} onMinimize={minimizeWindow}
        allWindows={windows} onCloseWindow={closeWindow} onCriticalKill={onCriticalKill}
        onLockdown={onLockdown} onUpdate={onUpdate}
      />

      <StartMenu open={startMenuOpen} apps={apps} onClose={() => setStartMenuOpen(false)}
        onOpenApp={openWindowAndCloseStart} onReboot={onReboot} onShutdown={onShutdown} onLogout={onLogout}
      />

      <Taskbar onStartClick={() => setStartMenuOpen(!startMenuOpen)} pinnedApps={apps.slice(0, 4)}
        onPinnedClick={openWindow} windows={windows} onRestoreWindow={restoreWindow}
        onShutdown={onShutdown} onReboot={onReboot} onLogout={onLogout}
        onOpenSettings={() => settingsApp && openWindow(settingsApp)}
      />

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} apps={apps} onOpenApp={openWindow} />

      <TaskView open={taskViewOpen} onClose={() => setTaskViewOpen(false)} windows={windows}
        onFocusWindow={focusWindow} onCloseWindow={closeWindow} desktops={desktops}
        activeDesktopId={activeDesktopId} onSwitchDesktop={switchDesktop} onCreateDesktop={createDesktop}
      />

      {altTabActive && altTabWindows.length > 1 && (
        <AltTabSwitcher windows={altTabWindows} activeIndex={altTabIndex} isVisible={altTabActive} />
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}
          items={getDesktopMenuItems(
            () => toast.info("Folder creation coming soon!"),
            () => settingsApp && openWindow(settingsApp),
            () => window.location.reload(),
            isOnlineMode ? () => manualSync() : undefined,
            isOnlineMode
          )}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
