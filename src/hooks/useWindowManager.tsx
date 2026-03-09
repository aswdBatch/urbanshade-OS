import { useState, useCallback, useMemo, useEffect } from "react";
import { Download } from "lucide-react";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { trackAppOpen, trackWindowCount } from "@/hooks/useAchievementTriggers";
import { createAppRegistry } from "@/lib/appRegistry";
import { App } from "@/types/window";

export const useWindowManager = () => {
  const [windows, setWindows] = useState<Array<{ id: string; app: App; zIndex: number; minimized?: boolean }>>([]);
  const [nextZIndex, setNextZIndex] = useState(100);

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
      trackAppOpen(app.id);
      trackWindowCount(newWindows.length);
    }
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

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, minimized: false, zIndex: nextZIndex } : w
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  // Helper to open app by ID (needs allApps, set up below)
  const openAppById = useCallback((appId: string) => {
    const app = allApps.find(a => a.id === appId);
    if (app) openWindow(app);
  }, [openWindow]);

  // App registry
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allApps = useMemo(() => createAppRegistry(openAppById), [openAppById]);

  // Handle URL parameter to open apps
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const openApp = urlParams.get('open');
    if (openApp) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        const app = allApps.find(a => a.id === openApp);
        if (app) openWindow(app);
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
  }, [nextZIndex, openWindow]);

  // Installed apps tracking
  const [installedApps, setInstalledApps] = useState<string[]>(() => {
    const installed = localStorage.getItem('urbanshade_installed_apps');
    return installed ? JSON.parse(installed) : [];
  });

  useEffect(() => {
    const handleStorage = () => {
      const installed = localStorage.getItem('urbanshade_installed_apps');
      setInstalledApps(installed ? JSON.parse(installed) : []);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter apps based on installation type
  const installType = localStorage.getItem('urbanshade_install_type') || 'standard';

  const apps = useMemo(() => allApps.filter(app => {
    if (app.downloadable) return installedApps.includes(app.id);
    if (installType === 'minimal') return app.minimalInclude === true || app.id === 'app-store';
    if (installType === 'standard') return app.minimalInclude === true || app.standardInclude === true || app.id === 'app-store';
    return true;
  }), [allApps, installedApps, installType]);

  return {
    windows,
    nextZIndex,
    openWindow,
    closeWindow,
    minimizeWindow,
    focusWindow,
    restoreWindow,
    allApps,
    apps,
  };
};
