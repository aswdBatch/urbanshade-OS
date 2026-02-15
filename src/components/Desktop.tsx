import { useState, useEffect, useCallback } from "react";
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
import { FileText, Database, Activity, Radio, FileBox, Terminal, Users, Wifi, Cpu, Mail, Globe, Music, Camera, Shield, MapPin, BookOpen, Zap, Wind, Calculator as CalcIcon, Lock, FileWarning, Grid3x3, ShoppingBag, StickyNote, Palette, Volume2, CloudRain, Clock as ClockIcon, Calendar, Newspaper, Key, HardDrive, FileArchive, FileText as PdfIcon, Sheet, Presentation, Video, Image, Mic, Gamepad2, MessageSquare, VideoIcon, MailOpen, FolderUp, TerminalSquare, Network, HardDrive as DiskIcon, Settings as SettingsIcon, Activity as PerformanceIcon, ScanLine, Languages, BookOpenCheck, Globe2, MapPinned, Telescope, Beaker, Calculator as PhysicsIcon, Fingerprint, Lock as EncryptionIcon, KeyRound, Puzzle, Skull, Monitor, Package, Star, Download, Spade, Award, Coins, Sparkles, Dices, Timer, Cookie, Bell, History } from "lucide-react";
import { toast } from "sonner";
import { osToast } from "@/components/shared/OSToast";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface App {
  id: string;
  name: string;
  icon: React.ReactNode;
  run: () => void;
  minimalInclude?: boolean;
  standardInclude?: boolean;
  downloadable?: boolean;
  searchAliases?: string[];
}
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
  const [showVipWelcome, setShowVipWelcome] = useState(false);
  
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
  
  // Check for VIP status and show welcome popup if first time
  useEffect(() => {
    const checkVipStatus = async () => {
      if (!isOnlineMode) return;
      
      const hasSeenVipWelcome = localStorage.getItem('vip_welcome_seen');
      if (hasSeenVipWelcome) return;
      
      // TODO: When VIP table is implemented, check actual VIP status here
      // For now, this is just the framework - Aswd needs to implement the vips table
      // const { data: vipData } = await supabase.from('vips').select('*').eq('user_id', userId).single();
      // if (vipData) {
      //   setShowVipWelcome(true);
      //   localStorage.setItem('vip_welcome_seen', 'true');
      // }
    };
    
    checkVipStatus();
  }, [isOnlineMode]);
  
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

  // Handle URL parameter to open apps
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const openApp = urlParams.get('open');
    if (openApp) {
      // Clear the URL param
      window.history.replaceState({}, '', window.location.pathname);
      // Find and open the app after a short delay
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
      const installerApp = {
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
  
  // Helper function to open app by ID
  const openAppById = useCallback((appId: string) => {
    const app = allAppsRef.current.find(a => a.id === appId);
    if (app) openWindow(app);
  }, [openWindow]);

  // Use a ref to store the apps array to avoid circular reference issues
  const allAppsRef = { current: [] as App[] };

  const allApps: App[] = [
    {
      id: "app-store",
      name: "App Store",
      icon: <ShoppingBag className="w-11 h-11" />,
      run: () => openAppById("app-store"),
      minimalInclude: true
    },
    {
      id: "explorer",
      name: "File Explorer",
      icon: <FileText className="w-11 h-11" />,
      run: () => openAppById("explorer"),
      minimalInclude: true
    },
    {
      id: "monitor",
      name: "System Monitor",
      icon: <Activity className="w-11 h-11" />,
      run: () => openAppById("monitor"),
      minimalInclude: true
    },
    {
      id: "personnel-center",
      name: "Personnel Center",
      icon: <Users className="w-11 h-11" />,
      run: () => openAppById("personnel-center"),
      standardInclude: true
    },
    {
      id: "logger",
      name: "Action Logger",
      icon: <Database className="w-11 h-11" />,
      run: () => openAppById("logger"),
      minimalInclude: true
    },
    {
      id: "network",
      name: "Network Scanner",
      icon: <Wifi className="w-11 h-11" />,
      run: () => openAppById("network"),
      standardInclude: true
    },
    {
      id: "terminal",
      name: "Terminal",
      icon: <Terminal className="w-11 h-11" />,
      run: () => openAppById("terminal"),
      minimalInclude: true
    },
    {
      id: "task-manager",
      name: "Task Manager",
      icon: <Cpu className="w-11 h-11" />,
      run: () => openAppById("task-manager"),
      minimalInclude: true
    },
    {
      id: "messages",
      name: "Messages",
      icon: <Mail className="w-11 h-11" />,
      run: () => openAppById("messages"),
      standardInclude: true
    },
    {
      id: "system-messages",
      name: "System Messages",
      icon: <Bell className="w-11 h-11" />,
      run: () => openAppById("system-messages"),
      standardInclude: true,
      searchAliases: ["warnings", "bans", "navi", "alerts", "notifications"]
    },
    {
      id: "notification-history",
      name: "Notification History",
      icon: <History className="w-11 h-11" />,
      run: () => openAppById("notification-history"),
      standardInclude: true,
      searchAliases: ["notifications", "history", "alerts", "log"]
    },
    {
      id: "incidents",
      name: "Incidents",
      icon: <FileWarning className="w-11 h-11" />,
      run: () => openAppById("incidents"),
      standardInclude: true
    },
    {
      id: "database",
      name: "Specimen DB",
      icon: <Database className="w-11 h-11" />,
      run: () => openAppById("database"),
      standardInclude: true
    },
    {
      id: "browser",
      name: "Browser",
      icon: <Globe className="w-11 h-11" />,
      run: () => openAppById("browser"),
      minimalInclude: true
    },
    {
      id: "audio-logs",
      name: "Audio Logs",
      icon: <Music className="w-11 h-11" />,
      run: () => openAppById("audio-logs")
    },
    {
      id: "cameras",
      name: "Security Cameras",
      icon: <Camera className="w-11 h-11" />,
      run: () => openAppById("cameras"),
      standardInclude: true
    },
    {
      id: "protocols",
      name: "Emergency Protocols",
      icon: <Shield className="w-11 h-11" />,
      run: () => openAppById("protocols"),
      standardInclude: true
    },
    {
      id: "map",
      name: "Facility Map",
      icon: <MapPin className="w-11 h-11" />,
      run: () => openAppById("map"),
      standardInclude: true
    },
    {
      id: "research",
      name: "Research Notes",
      icon: <BookOpen className="w-11 h-11" />,
      run: () => openAppById("research")
    },
    {
      id: "power",
      name: "Power Grid",
      icon: <Zap className="w-11 h-11" />,
      run: () => openAppById("power")
    },
    {
      id: "containment",
      name: "Containment",
      icon: <Lock className="w-11 h-11" />,
      run: () => openAppById("containment")
    },
    {
      id: "environment",
      name: "Environment",
      icon: <Wind className="w-11 h-11" />,
      run: () => openAppById("environment")
    },
    {
      id: "calculator",
      name: "Calculator",
      icon: <CalcIcon className="w-11 h-11" />,
      run: () => openAppById("calculator"),
      minimalInclude: true
    },
    {
      id: "planner",
      name: "Facility Planner",
      icon: <Grid3x3 className="w-11 h-11" />,
      run: () => openAppById("planner"),
      standardInclude: true
    },
    {
      id: "computer-management",
      name: "Computer Mgmt",
      icon: <Monitor className="w-11 h-11" />,
      run: () => openAppById("computer-management"),
      standardInclude: true
    },
    {
      id: "signal-interceptor",
      name: "Signal Interceptor",
      icon: <Radio className="w-11 h-11" />,
      run: () => openAppById("signal-interceptor"),
      standardInclude: true
    },
    {
      id: "plugin-store",
      name: "Plugin Store",
      icon: <Puzzle className="w-11 h-11" />,
      run: () => openAppById("plugin-store"),
      minimalInclude: true
    },
    {
      id: "crash-app",
      name: "System Crash",
      icon: <Skull className="w-11 h-11" />,
      run: () => openAppById("crash-app")
    },
    {
      id: "settings",
      name: "Settings",
      icon: <SettingsIcon className="w-11 h-11" />,
      run: () => openAppById("settings"),
      minimalInclude: true
    },
    {
      id: "file-reader",
      name: "File Reader",
      icon: <FileText className="w-11 h-11" />,
      run: () => openAppById("file-reader"),
      standardInclude: true
    },
    // Downloadable Apps
    {
      id: "notepad",
      name: "Notepad",
      icon: <StickyNote className="w-11 h-11" />,
      run: () => openAppById("notepad"),
      downloadable: true
    },
    {
      id: "paint",
      name: "Paint Tool",
      icon: <Palette className="w-11 h-11" />,
      run: () => openAppById("paint"),
      downloadable: true
    },
    {
      id: "music-player",
      name: "Media Player",
      icon: <Volume2 className="w-11 h-11" />,
      run: () => openAppById("music-player"),
      downloadable: true
    },
    {
      id: "weather",
      name: "Weather Monitor",
      icon: <CloudRain className="w-11 h-11" />,
      run: () => openAppById("weather"),
      downloadable: true
    },
    {
      id: "clock",
      name: "World Clock",
      icon: <ClockIcon className="w-11 h-11" />,
      run: () => openAppById("clock"),
      downloadable: true
    },
    {
      id: "calendar",
      name: "Event Calendar",
      icon: <Calendar className="w-11 h-11" />,
      run: () => openAppById("calendar"),
      downloadable: true
    },
    {
      id: "notes",
      name: "Advanced Notes",
      icon: <Newspaper className="w-11 h-11" />,
      run: () => openAppById("notes"),
      downloadable: true
    },
    {
      id: "vpn",
      name: "Secure VPN",
      icon: <Shield className="w-11 h-11" />,
      run: () => openAppById("vpn"),
      downloadable: true
    },
    {
      id: "firewall",
      name: "Network Firewall",
      icon: <Shield className="w-11 h-11" />,
      run: () => openAppById("firewall"),
      downloadable: true
    },
    {
      id: "antivirus",
      name: "Virus Scanner",
      icon: <Shield className="w-11 h-11" />,
      run: () => openAppById("antivirus"),
      downloadable: true
    },
    {
      id: "backup",
      name: "Data Backup",
      icon: <HardDrive className="w-11 h-11" />,
      run: () => openAppById("backup"),
      downloadable: true
    },
    {
      id: "compression",
      name: "File Compressor",
      icon: <FileArchive className="w-11 h-11" />,
      run: () => openAppById("compression"),
      downloadable: true
    },
    {
      id: "pdf-reader",
      name: "PDF Viewer",
      icon: <PdfIcon className="w-11 h-11" />,
      run: () => openAppById("pdf-reader"),
      downloadable: true
    },
    {
      id: "spreadsheet",
      name: "Data Sheets",
      icon: <Sheet className="w-11 h-11" />,
      run: () => openAppById("spreadsheet"),
      downloadable: true
    },
    {
      id: "presentation",
      name: "Slide Maker",
      icon: <Presentation className="w-11 h-11" />,
      run: () => openAppById("presentation"),
      downloadable: true
    },
    {
      id: "video-editor",
      name: "Video Editor",
      icon: <Video className="w-11 h-11" />,
      run: () => openAppById("video-editor"),
      downloadable: true
    },
    {
      id: "image-viewer",
      name: "Photo Gallery",
      icon: <Image className="w-11 h-11" />,
      run: () => openAppById("image-viewer"),
      downloadable: true
    },
    {
      id: "audio-editor",
      name: "Sound Editor",
      icon: <Mic className="w-11 h-11" />,
      run: () => openAppById("audio-editor"),
      downloadable: true
    },
    {
      id: "game-center",
      name: "Game Hub",
      icon: <Gamepad2 className="w-11 h-11" />,
      run: () => openAppById("game-center"),
      downloadable: true
    },
    {
      id: "containment-game",
      name: "Containment Breach",
      icon: <Skull className="w-11 h-11" />,
      run: () => openAppById("containment-game"),
      downloadable: true
    },
    {
      id: "ucg",
      name: "Untitled Card Game",
      icon: <Spade className="w-11 h-11" />,
      run: () => openAppById("ucg"),
      downloadable: true,
      searchAliases: ["UCG", "21", "twenty one", "blackjack", "card game"]
    },
    {
      id: "shop",
      name: "Shop",
      icon: <Coins className="w-11 h-11" />,
      run: () => openAppById("shop"),
      downloadable: true,
      searchAliases: ["store", "kroner", "buy", "themes", "titles"]
    },
    {
      id: "certificate-viewer",
      name: "Certificate Viewer",
      icon: <Award className="w-11 h-11" />,
      run: () => openAppById("certificate-viewer"),
      downloadable: true,
      searchAliases: ["certificates", "awards", "battlepass", "achievements"]
    },
    {
      id: "dice-roller",
      name: "Dice Roller",
      icon: <Dices className="w-11 h-11" />,
      run: () => openAppById("dice-roller"),
      downloadable: true,
      searchAliases: ["dice", "d20", "tabletop", "random", "roll"]
    },
    {
      id: "reaction-test",
      name: "Reaction Test",
      icon: <Timer className="w-11 h-11" />,
      run: () => openAppById("reaction-test"),
      downloadable: true,
      searchAliases: ["reflex", "speed", "reaction", "test"]
    },
    {
      id: "fortune",
      name: "Fortune Cookie",
      icon: <Cookie className="w-11 h-11" />,
      run: () => openAppById("fortune"),
      downloadable: true,
      searchAliases: ["fortune", "luck", "prediction", "cookie"]
    },
    {
      id: "chat",
      name: "Instant Chat",
      icon: <MessageSquare className="w-11 h-11" />,
      run: () => openAppById("chat"),
      downloadable: true
    },
    {
      id: "video-call",
      name: "Video Conference",
      icon: <VideoIcon className="w-11 h-11" />,
      run: () => openAppById("video-call"),
      downloadable: true
    },
    {
      id: "email-client",
      name: "Mail Client Pro",
      icon: <MailOpen className="w-11 h-11" />,
      run: () => openAppById("email-client"),
      downloadable: true
    },
    {
      id: "ftp",
      name: "FTP Manager",
      icon: <FolderUp className="w-11 h-11" />,
      run: () => openAppById("ftp"),
      downloadable: true
    },
    {
      id: "ssh",
      name: "SSH Terminal",
      icon: <TerminalSquare className="w-11 h-11" />,
      run: () => openAppById("ssh"),
      downloadable: true
    },
    {
      id: "packet-analyzer",
      name: "Packet Sniffer",
      icon: <Network className="w-11 h-11" />,
      run: () => openAppById("packet-analyzer"),
      downloadable: true
    },
    {
      id: "disk-manager",
      name: "Disk Utility",
      icon: <DiskIcon className="w-11 h-11" />,
      run: () => openAppById("disk-manager"),
      downloadable: true
    },
    {
      id: "registry",
      name: "Registry Editor",
      icon: <Key className="w-11 h-11" />,
      run: () => openAppById("registry"),
      downloadable: true
    },
    {
      id: "performance",
      name: "Performance Analyzer",
      icon: <PerformanceIcon className="w-11 h-11" />,
      run: () => openAppById("performance"),
      downloadable: true
    },
    {
      id: "scanner",
      name: "Document Scanner",
      icon: <ScanLine className="w-11 h-11" />,
      run: () => openAppById("scanner"),
      downloadable: true
    },
    {
      id: "translator",
      name: "Language Translator",
      icon: <Languages className="w-11 h-11" />,
      run: () => openAppById("translator"),
      downloadable: true
    },
    {
      id: "dictionary",
      name: "Digital Dictionary",
      icon: <BookOpenCheck className="w-11 h-11" />,
      run: () => openAppById("dictionary"),
      downloadable: true
    },
    {
      id: "encyclopedia",
      name: "Encyclopedia",
      icon: <Globe2 className="w-11 h-11" />,
      run: () => openAppById("encyclopedia"),
      downloadable: true
    },
    {
      id: "map-viewer",
      name: "Map Navigator",
      icon: <MapPinned className="w-11 h-11" />,
      run: () => openAppById("map-viewer"),
      downloadable: true
    },
    {
      id: "gps",
      name: "GPS Tracker",
      icon: <MapPin className="w-11 h-11" />,
      run: () => openAppById("gps"),
      downloadable: true
    },
    {
      id: "astronomy",
      name: "Star Chart",
      icon: <Telescope className="w-11 h-11" />,
      run: () => openAppById("astronomy"),
      downloadable: true
    },
    {
      id: "chemistry",
      name: "Chemistry Lab",
      icon: <Beaker className="w-11 h-11" />,
      run: () => openAppById("chemistry"),
      downloadable: true
    },
    {
      id: "physics",
      name: "Physics Simulator",
      icon: <PhysicsIcon className="w-11 h-11" />,
      run: () => openAppById("physics"),
      downloadable: true
    },
    {
      id: "biometric",
      name: "Biometric Scanner",
      icon: <Fingerprint className="w-11 h-11" />,
      run: () => openAppById("biometric"),
      downloadable: true
    },
    {
      id: "encryption",
      name: "File Encryptor",
      icon: <EncryptionIcon className="w-11 h-11" />,
      run: () => openAppById("encryption"),
      downloadable: true
    },
    {
      id: "password-manager",
      name: "Password Vault",
      icon: <KeyRound className="w-11 h-11" />,
      run: () => openAppById("password-manager"),
      downloadable: true
    },
    {
      id: "img-editor",
      name: ".Img Editor",
      icon: <FileArchive className="w-11 h-11" />,
      run: () => openAppById("img-editor"),
      downloadable: true
    },
    {
      id: "account-settings",
      name: "Account Settings",
      icon: <Users className="w-11 h-11" />,
      run: () => openAppById("account-settings"),
      minimalInclude: true
    },
    {
      id: "uur-manager",
      name: "UUR Manager",
      icon: <Package className="w-11 h-11" />,
      run: () => openAppById("uur-manager"),
      standardInclude: true
    },
  ];

  // Assign the apps to the ref for the openAppById function
  allAppsRef.current = allApps;

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
    // If app is downloadable, only show if installed
    if (app.downloadable) {
      return installedApps.includes(app.id);
    }
    
    // For base apps, filter by install type
    if (installType === 'minimal') {
      return app.minimalInclude === true || app.id === 'app-store';
    } else if (installType === 'standard') {
      return app.minimalInclude === true || app.standardInclude === true || app.id === 'app-store';
    } else {
      // Full installation shows all base (non-downloadable) apps
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

      {/* VIP Welcome Dialog */}
      <Dialog open={showVipWelcome} onOpenChange={setShowVipWelcome}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 border-purple-500/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <Star className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome to VIP!
              </span>
            </DialogTitle>
            <DialogDescription className="text-base">
              Congratulations! You've been recognized by Aswd and granted VIP status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <h4 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Your VIP Benefits
              </h4>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span><strong>Cloud Priority</strong> - Your requests get processed first</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span><strong>VIP Badge</strong> - Everyone can see you're trusted</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span><strong>Direct Line to Aswd</strong> - Skip the queue when messaging the creator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span><strong>Overall Priority</strong> - You're at the front of the line</span>
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Thank you for being awesome! 💜
            </p>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowVipWelcome(false)} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              Let's Go!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
