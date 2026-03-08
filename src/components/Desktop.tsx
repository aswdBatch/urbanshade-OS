import { useState, useEffect, useCallback, useMemo } from "react";
import { Taskbar } from "./Taskbar";
import { DesktopIcon } from "./DesktopIcon";
import { StartMenu } from "./StartMenu";
import { WindowManager } from "./WindowManager";
import { RecoveryMode } from "./RecoveryMode";
import { ContextMenu, getDesktopMenuItems } from "./ContextMenu";
import { AltTabSwitcher } from "./AltTabSwitcher";
import { WindowSnapIndicator } from "./WindowSnapIndicator";
import { GlobalSearch } from "./GlobalSearch";
import { WidgetManager } from "./widgets/WidgetManager";
import { TaskView } from "./TaskView";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMultipleDesktops } from "@/hooks/useMultipleDesktops";
import { useOnlineAccount } from "@/hooks/useOnlineAccount";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useWindowSnap, SnapZone } from "@/hooks/useWindowSnap";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { trackAppOpen, trackWindowCount, checkSessionAchievements } from "@/hooks/useAchievementTriggers";
import { Shield, Download } from "lucide-react";
import { toast } from "sonner";
import { osToast } from "@/components/shared/OSToast";
import { createAppRegistry } from "@/lib/appRegistry";
import { App } from "@/types/window";

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
  const [windows, setWindows] = useState<Array<{ id: string; app: App; zIndex: number; minimized?: boolean }>>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [taskViewOpen, setTaskViewOpen] = useState(false);
  
  // Multiple desktops
  const { 
    desktops, 
    activeDesktopId, 
    switchDesktop, 
    createDesktop, 
    deleteDesktop, 
    renameDesktop,
    moveWindowToDesktop,
    switchToNextDesktop,
    switchToPreviousDesktop 
  } = useMultipleDesktops();
  
  // Online account sync
  const { isOnlineMode, isDevMode, syncSettings } = useOnlineAccount();
  const { manualSync } = useAutoSync();
  const { addNotification } = useNotifications();
  const { snapZone, handleDragMove, handleDragEnd, clearSnapZone } = useWindowSnap();
  
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

  // Define window management functions first for keyboard shortcuts
  const openWindow = useCallback((app: App) => {
    const existing = windows.find(w => w.id === app.id);
    if (existing) {
      setWindows(prev => prev.map(w => 
        w.id === app.id ? { ...w, zIndex: nextZIndex } : w
      ));
      setNextZIndex(prev => prev + 1);
      actionDispatcher.window(`Focused: ${app.name}`);
    } else {
      const newWindows = [...windows, { id: app.id, app, zIndex: nextZIndex }];
      setWindows(newWindows);
      setNextZIndex(prev => prev + 1);
      actionDispatcher.window(`Opened: ${app.name}`);
      actionDispatcher.app(`${app.name} started`);
      
      // Track achievements
      trackAppOpen(app.id);
      trackWindowCount(newWindows.length);
    }
    setStartMenuOpen(false);
  }, [windows, nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    const win = windows.find(w => w.id === id);
    if (win) {
      actionDispatcher.window(`Closed: ${win.app.name}`);
    }
    setWindows(prev => prev.filter(w => w.id !== id));
  }, [windows]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, minimized: true } : w
    ));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: nextZIndex, minimized: false } : w
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  // Listen for settings changes and dispatch startup event
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

  // Helper function to open app by ID
  const openAppById = useCallback((appId: string) => {
    const app = allApps.find(a => a.id === appId);
    if (app) openWindow(app);
  }, [openWindow]);

  // App registry from centralized source
  const allApps = useMemo(() => createAppRegistry(openAppById), [openAppById]);

  // Handle URL parameter to open apps
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const openApp = urlParams.get('open');
    if (openApp) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        const app = allApps.find(a => a.id === openApp);
        if (app) {
          openWindow(app);
        }
      }, 500);
    }
  }, []);

  // Listen for installer window requests
  useEffect(() => {
    const handleOpenInstaller = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { appName } = customEvent.detail;
      const installerApp: App = {
        id: "installer",
        name: `${appName} Setup`,
        icon: <Download className="w-11 h-11" />,
        run: () => {}
      };
      openWindow(installerApp);
    };
    window.addEventListener('open-installer', handleOpenInstaller);
    return () => window.removeEventListener('open-installer', handleOpenInstaller);
  }, [nextZIndex]);

  const [installedApps, setInstalledApps] = useState<string[]>(() => {
    const installed = localStorage.getItem('urbanshade_installed_apps');
    return installed ? JSON.parse(installed) : [];
  });

  const restoreWindow = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, minimized: false, zIndex: nextZIndex } : w
    ));
    setNextZIndex(prev => prev + 1);
  };

  // Get installation type to filter apps
  const installType = localStorage.getItem('urbanshade_install_type') || 'standard';

  // Listen for app installations
  useEffect(() => {
    const handleStorage = () => {
      const installed = localStorage.getItem('urbanshade_installed_apps');
      setInstalledApps(installed ? JSON.parse(installed) : []);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter apps based on installation type and installed apps
  const apps = allApps.filter(app => {
    if (app.downloadable) {
      return installedApps.includes(app.id);
    }
    if (installType === 'minimal') {
      return app.minimalInclude === true || app.id === 'app-store';
    } else if (installType === 'standard') {
      return app.minimalInclude === true || app.standardInclude === true || app.id === 'app-store';
    } else {
      return true;
    }
  });

  const desktopApps = apps;

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
          <div className="fixed top-20 left-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">
            SAFE MODE
          </div>
          <div className="fixed top-20 right-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">
            SAFE MODE
          </div>
          <div className="fixed bottom-20 left-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">
            SAFE MODE
          </div>
          <div className="fixed bottom-20 right-4 text-yellow-500/40 font-bold text-sm z-[9999] pointer-events-none select-none">
            SAFE MODE
          </div>
          {/* Safe Mode Banner */}
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[9999] bg-yellow-600/90 text-black px-4 py-1.5 rounded-b-lg text-xs font-bold flex items-center gap-2 shadow-lg">
            <Shield className="w-4 h-4" />
            Safe Mode - Limited functionality. Restart to exit.
            {onExitSafeMode && (
              <button 
                onClick={onExitSafeMode}
                className="ml-2 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[10px] transition-colors"
              >
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
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/30 to-transparent pointer-events-none z-[5]" />

      {/* Widgets Layer - Disabled in Safe Mode */}
      {!safeMode && (
        <WidgetManager onOpenApp={(appId) => {
          const app = allApps.find(a => a.id === appId);
          if (app) openWindow(app);
        }} />
      )}

      {/* Desktop Icons - Grid layout with top padding for taskbar */}
      <div className="absolute inset-0 z-10 pt-16 px-6 pb-24 pointer-events-none">
        <div 
          className="grid gap-3 pointer-events-auto"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, 90px)',
            gridAutoRows: '100px'
          }}
        >
          {desktopApps.map((app) => (
            <DesktopIcon key={app.id} app={app} />
          ))}
        </div>
      </div>

      {/* Windows */}
      <WindowManager 
        windows={windows} 
        onClose={closeWindow}
        onFocus={focusWindow}
        onMinimize={minimizeWindow}
        allWindows={windows}
        onCloseWindow={closeWindow}
        onCriticalKill={onCriticalKill}
        onLockdown={onLockdown}
        onUpdate={onUpdate}
      />

      {/* Start Menu */}
      <StartMenu 
        open={startMenuOpen} 
        apps={apps}
        onClose={() => setStartMenuOpen(false)}
        onOpenApp={openWindow}
        onReboot={onReboot}
        onShutdown={onShutdown}
        onLogout={onLogout}
      />

      {/* Taskbar */}
      <Taskbar 
        onStartClick={() => setStartMenuOpen(!startMenuOpen)}
        pinnedApps={apps.slice(0, 4)}
        onPinnedClick={openWindow}
        windows={windows}
        onRestoreWindow={restoreWindow}
        onShutdown={onShutdown}
        onReboot={onReboot}
        onLogout={onLogout}
        onOpenSettings={() => settingsApp && openWindow(settingsApp)}
      />

      {/* Window Snap Indicator */}
      <WindowSnapIndicator zone={snapZone} />

      {/* Global Search */}
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        apps={apps}
        onOpenApp={openWindow}
      />

      {/* Task View */}
      <TaskView
        open={taskViewOpen}
        onClose={() => setTaskViewOpen(false)}
        windows={windows}
        onFocusWindow={focusWindow}
        onCloseWindow={closeWindow}
        desktops={desktops}
        activeDesktopId={activeDesktopId}
        onSwitchDesktop={switchDesktop}
        onCreateDesktop={createDesktop}
      />

      {/* Alt+Tab Switcher */}
      {altTabActive && altTabWindows.length > 1 && (
        <AltTabSwitcher 
          windows={altTabWindows}
          activeIndex={altTabIndex}
          isVisible={altTabActive}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
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
