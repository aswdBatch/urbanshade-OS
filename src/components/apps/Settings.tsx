import { useState, useEffect } from "react";
import { 
  Monitor, Volume2, Bell, Palette, Wifi, Shield, Info, 
  RotateCcw, Code, HardDrive, Gauge,
  ChevronRight, Search, Unlock, Terminal, Trash2, AlertTriangle,
  Sun, Moon, Sparkles, Lock, Check, Crown, Gift, Star, Paintbrush,
  Power, Image, Music, Bug, RefreshCw, FileText
} from "lucide-react";
import { ChangelogDialog } from "@/components/ChangelogDialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { saveState, loadState } from "@/lib/persistence";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { themePresets, useThemePresets, ThemePreset } from "@/hooks/useThemePresets";
import { THEME_PRESETS, useThemeEngine } from "@/hooks/useThemeEngine";
import { VERSION } from "@/lib/versionInfo";
import { commandQueue } from "@/lib/commandQueue";


// ============ TYPES ============

interface SettingItem {
  key: string;
  label: string;
  description?: string;
  type: 'toggle' | 'slider' | 'info' | 'action' | 'select';
  defaultValue: any;
  min?: number;
  max?: number;
  requiresRestart?: boolean;
  dangerous?: boolean;
  infoValue?: () => string;
  action?: () => void;
  actionLabel?: string;
  icon?: React.ElementType;
  options?: { value: string; label: string }[];
  functional?: boolean; // Whether this setting actually works
}

interface SettingCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description?: string;
  settings?: SettingItem[];
  customRender?: boolean;
}

// ============ BOOT ANIMATIONS ============

const BOOT_ANIMATIONS = [
  { id: 'default', name: 'Default', description: 'Classic progress bar animation' },
  { id: 'minimal', name: 'Minimal', description: 'Simple spinner with logo' },
  { id: 'terminal', name: 'Terminal', description: 'Text-based boot sequence' },
];

// ============ SETTINGS CONFIG ============

const getSettingsConfig = (handlers: {
  onOpenDefDev: () => void;
  onOemUnlock: () => void;
  onFactoryReset: () => void;
  onTriggerBugcheck: () => void;
  onTriggerCrash: () => void;
  onReboot: () => void;
}): SettingCategory[] => [
  {
    id: 'personalization',
    name: 'Personalization',
    icon: Paintbrush,
    description: 'Themes, colors, and visual customization',
    customRender: true,
  },
  {
    id: 'display',
    name: 'Display',
    icon: Monitor,
    description: 'Screen brightness and visual effects',
    settings: [
      { key: 'night_light', label: 'Night Light', description: 'Reduce blue light for eye comfort', type: 'toggle', defaultValue: false, icon: Sun, functional: true },
      { key: 'night_light_intensity', label: 'Night Light Intensity', type: 'slider', defaultValue: 30, min: 10, max: 80, functional: true },
      { key: 'brightness', label: 'Brightness', type: 'slider', defaultValue: 80, min: 20, max: 100, functional: true },
      { key: 'crt_effect', label: 'CRT Effect', description: 'Add retro scan lines', type: 'toggle', defaultValue: false, functional: true },
    ]
  },
  {
    id: 'sound',
    name: 'Sound',
    icon: Volume2,
    description: 'Volume and audio preferences',
    settings: [
      { key: 'volume', label: 'Master Volume', type: 'slider', defaultValue: 70, min: 0, max: 100, functional: true },
      { key: 'mute', label: 'Mute All Sounds', type: 'toggle', defaultValue: false, functional: true },
      { key: 'sound_effects', label: 'UI Sound Effects', description: 'Play sounds for clicks and alerts', type: 'toggle', defaultValue: true, functional: true },
      { key: 'notification_sound', label: 'Notification Sounds', type: 'toggle', defaultValue: true, functional: true },
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'Manage alerts and preferences',
    settings: [
      { key: 'notifications', label: 'Enable Notifications', type: 'toggle', defaultValue: true, functional: true },
      { key: 'dnd', label: 'Do Not Disturb', description: 'Silence all notifications', type: 'toggle', defaultValue: false, icon: Moon, functional: true },
      { key: 'toast_duration', label: 'Toast Duration (seconds)', type: 'slider', defaultValue: 4, min: 2, max: 10, functional: true },
    ]
  },
  {
    id: 'boot',
    name: 'Boot & Startup',
    icon: Power,
    description: 'Customize boot experience',
    customRender: true,
  },
  {
    id: 'network',
    name: 'Network',
    icon: Wifi,
    description: 'Connection settings',
    settings: [
      { key: 'wifi', label: 'Wi-Fi', description: 'Enable wireless networking', type: 'toggle', defaultValue: true, functional: true },
      { key: 'vpn', label: 'VPN', description: 'Route traffic through VPN', type: 'toggle', defaultValue: false, icon: Lock, functional: true },
      { key: 'offline_mode', label: 'Offline Mode', description: 'Disable all network features', type: 'toggle', defaultValue: false, functional: true },
    ]
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    icon: Shield,
    description: 'Security options',
    settings: [
      { key: 'telemetry', label: 'Usage Analytics', description: 'Help improve the system (cosmetic)', type: 'toggle', defaultValue: false, functional: true },
      { key: 'auto_updates', label: 'Automatic Updates', description: 'Check for updates on boot', type: 'toggle', defaultValue: true, functional: true },
      { key: 'lock_after_idle', label: 'Lock After Idle', description: 'Lock screen after inactivity', type: 'toggle', defaultValue: false, icon: Lock, functional: true },
    ]
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: Gauge,
    description: 'System optimization',
    settings: [
      { key: 'hardware_acceleration', label: 'Hardware Acceleration', description: 'Use GPU for rendering', type: 'toggle', defaultValue: true, functional: true },
      { key: 'animations', label: 'Animations', description: 'Enable UI animations', type: 'toggle', defaultValue: true, functional: true },
      { key: 'blur_effects', label: 'Blur Effects', description: 'Enable backdrop blur', type: 'toggle', defaultValue: true, icon: Sparkles, functional: true },
      { key: 'max_windows', label: 'Max Open Windows', type: 'slider', defaultValue: 10, min: 3, max: 20, functional: true },
    ]
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: HardDrive,
    description: 'Data and cache',
    settings: [
      { 
        key: 'storage_info', 
        label: 'LocalStorage Used', 
        type: 'info', 
        defaultValue: '', 
        infoValue: () => {
          let total = 0;
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              total += localStorage[key].length * 2;
            }
          }
          return `${(total / 1024).toFixed(2)} KB`;
        }
      },
      { key: 'auto_save', label: 'Auto-Save', description: 'Automatically save changes', type: 'toggle', defaultValue: true, functional: true },
    ]
  },
  {
    id: 'developer',
    name: 'Developer Options',
    icon: Code,
    description: 'Advanced tools for developers',
    settings: [
      { key: 'developer_mode', label: 'Developer Mode', description: 'Enable DEF-DEV console and debugging', type: 'toggle', defaultValue: false, icon: Terminal, functional: true },
      { 
        key: 'open_defdev', 
        label: 'Open DEF-DEV Console', 
        description: 'Launch the developer console', 
        type: 'action', 
        defaultValue: null,
        actionLabel: 'Launch',
        action: handlers.onOpenDefDev,
        icon: Terminal,
        functional: true
      },
      { key: 'debug_overlay', label: 'Debug Overlay', description: 'Show FPS and performance info', type: 'toggle', defaultValue: false, functional: true },
      { key: 'console_logs', label: 'Verbose Console Logs', description: 'Log detailed operations', type: 'toggle', defaultValue: false, functional: true },
      { key: 'show_render_boxes', label: 'Show Render Boxes', description: 'Highlight component boundaries', type: 'toggle', defaultValue: false, functional: true },
      { key: 'slow_animations', label: 'Slow Animations', description: 'Run animations at 0.25x speed', type: 'toggle', defaultValue: false, functional: true },
      { 
        key: 'trigger_bugcheck', 
        label: 'Trigger Test Bugcheck', 
        description: 'Force a BSOD-style bugcheck', 
        type: 'action', 
        defaultValue: null,
        actionLabel: 'Trigger',
        action: handlers.onTriggerBugcheck,
        icon: Bug,
        dangerous: true,
        functional: true
      },
      { 
        key: 'trigger_crash', 
        label: 'Trigger Crash Screen', 
        description: 'Force a styled crash screen', 
        type: 'action', 
        defaultValue: null,
        actionLabel: 'Crash',
        action: handlers.onTriggerCrash,
        icon: AlertTriangle,
        dangerous: true,
        functional: true
      },
      { 
        key: 'force_reboot', 
        label: 'Force Reboot', 
        description: 'Restart the system immediately', 
        type: 'action', 
        defaultValue: null,
        actionLabel: 'Reboot',
        action: handlers.onReboot,
        icon: RefreshCw,
        functional: true
      },
      { 
        key: 'oem_unlock', 
        label: 'OEM Unlock', 
        description: 'Allow bootloader modifications', 
        type: 'action', 
        defaultValue: null,
        actionLabel: 'Unlock',
        action: handlers.onOemUnlock,
        dangerous: true,
        icon: Unlock,
        functional: true
      },
    ]
  },
  {
    id: 'system',
    name: 'System',
    icon: Info,
    description: 'System info and reset',
    customRender: true,
  },
];

// ============ COMPONENT ============

interface SettingsProps {
  onUpdate?: () => void;
}

const Settings = ({ onUpdate }: SettingsProps) => {
  const [activeCategory, setActiveCategory] = useState('personalization');
  const [values, setValues] = useState<Record<string, any>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOemDialog, setShowOemDialog] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLightModeWarning, setShowLightModeWarning] = useState(false);
  const [oemUnlocked, setOemUnlocked] = useState(() => loadState('settings_oem_unlocked', false));
  const [isCompact, setIsCompact] = useState(false);
  
  // Theme hooks
  const { applyPreset, getCurrentPreset } = useThemePresets();
  const { currentTheme, setTheme, allThemes } = useThemeEngine();
  const [selectedBackgroundTheme, setSelectedBackgroundTheme] = useState<string | null>(null);
  const [themeTab, setThemeTab] = useState('presets');

  // Detect compact mode
  useEffect(() => {
    const checkSize = () => {
      const container = document.querySelector('[data-settings-container]');
      if (container) {
        setIsCompact(container.clientWidth < 600);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Handlers
  const handleOpenDefDev = () => {
    window.open('/def-dev', '_blank');
    toast.success('DEF-DEV Console opened in new tab');
  };

  const handleOemUnlock = () => setShowOemDialog(true);
  const handleFactoryReset = () => setShowResetDialog(true);

  const handleTriggerBugcheck = () => {
    commandQueue.queueBugcheck('DEV_TEST', 'Triggered from Settings Developer Options');
    toast.error('Bugcheck queued - will trigger on next poll');
  };

  const handleTriggerCrash = () => {
    commandQueue.queueCrash('KERNEL_PANIC', 'settings.exe');
    toast.error('Crash queued - will trigger on next poll');
  };

  const handleReboot = () => {
    commandQueue.queueReboot();
    toast.info('Reboot queued');
  };

  const confirmOemUnlock = () => {
    const newState = !oemUnlocked;
    setOemUnlocked(newState);
    saveState('settings_oem_unlocked', newState);
    setShowOemDialog(false);
    toast.success(newState ? 'OEM Unlock enabled' : 'OEM Unlock disabled');
  };

  const confirmFactoryReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    setShowResetDialog(false);
    toast.success('Factory reset complete. Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  };

  const settingsConfig = getSettingsConfig({
    onOpenDefDev: handleOpenDefDev,
    onOemUnlock: handleOemUnlock,
    onFactoryReset: handleFactoryReset,
    onTriggerBugcheck: handleTriggerBugcheck,
    onTriggerCrash: handleTriggerCrash,
    onReboot: handleReboot,
  });

  // Load settings
  useEffect(() => {
    const loaded: Record<string, any> = {};
    settingsConfig.forEach(category => {
      if (category.settings) {
        category.settings.forEach(setting => {
          if (setting.type !== 'info' && setting.type !== 'action') {
            const storageKey = `settings_${setting.key}`;
            loaded[setting.key] = loadState(storageKey, setting.defaultValue);
          }
        });
      }
    });
    // Boot settings
    loaded['boot_animation'] = loadState('settings_boot_animation', 'default');
    loaded['boot_sound'] = loadState('settings_boot_sound', true);
    loaded['boot_logo'] = loadState('settings_boot_logo', true);
    loaded['light_mode'] = loadState('settings_light_mode', false);
    
    setValues(loaded);
    setSelectedBackgroundTheme(getCurrentPreset()?.id || null);
    setIsLoaded(true);
  }, []);

  // Apply effects
  useEffect(() => {
    if (!isLoaded) return;

    // Night light
    if (values.night_light) {
      const intensity = values.night_light_intensity || 30;
      document.documentElement.style.filter = `sepia(${intensity}%) saturate(${100 - intensity / 2}%)`;
    } else {
      document.documentElement.style.filter = '';
    }

    // CRT Effect
    if (values.crt_effect) {
      document.documentElement.classList.add('crt-effect');
    } else {
      document.documentElement.classList.remove('crt-effect');
    }

    // Reduce motion
    if (!values.animations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Slow animations
    if (values.slow_animations) {
      document.documentElement.style.setProperty('--animation-speed', '4');
    } else {
      document.documentElement.style.removeProperty('--animation-speed');
    }

    // Show render boxes
    if (values.show_render_boxes) {
      document.documentElement.classList.add('show-render-boxes');
    } else {
      document.documentElement.classList.remove('show-render-boxes');
    }

    // Brightness
    if (values.brightness !== undefined && values.brightness !== 100) {
      document.documentElement.style.setProperty('--brightness', `${values.brightness}%`);
    } else {
      document.documentElement.style.removeProperty('--brightness');
    }

    // Verbose console
    if (values.console_logs) {
      (window as any).__URBANSHADE_VERBOSE__ = true;
    } else {
      delete (window as any).__URBANSHADE_VERBOSE__;
    }

    // ============ NEW FUNCTIONAL SETTINGS ============

    // Wi-Fi status (visual indicator for system tray)
    if (values.wifi === false) {
      document.documentElement.dataset.wifiDisabled = 'true';
      (window as any).__URBANSHADE_WIFI_DISABLED__ = true;
    } else {
      delete document.documentElement.dataset.wifiDisabled;
      delete (window as any).__URBANSHADE_WIFI_DISABLED__;
    }

    // Offline mode - affects network behavior
    if (values.offline_mode) {
      document.documentElement.dataset.offlineMode = 'true';
      (window as any).__URBANSHADE_OFFLINE_MODE__ = true;
      sessionStorage.setItem('urbanshade_offline_mode', 'true');
    } else {
      delete document.documentElement.dataset.offlineMode;
      delete (window as any).__URBANSHADE_OFFLINE_MODE__;
      sessionStorage.removeItem('urbanshade_offline_mode');
    }

    // Hardware acceleration
    if (values.hardware_acceleration) {
      document.documentElement.classList.remove('no-gpu');
      document.documentElement.style.setProperty('--transform-style', 'preserve-3d');
    } else {
      document.documentElement.classList.add('no-gpu');
      document.documentElement.style.removeProperty('--transform-style');
    }

    // Blur effects
    if (values.blur_effects === false) {
      document.documentElement.classList.add('no-blur');
    } else {
      document.documentElement.classList.remove('no-blur');
    }

    // Transparency
    if (values.transparency === false) {
      document.documentElement.classList.add('no-transparency');
    } else {
      document.documentElement.classList.remove('no-transparency');
    }

    // Telemetry (just sets a flag - cosmetic in this OS)
    (window as any).__URBANSHADE_TELEMETRY__ = values.telemetry === true;

    // Auto updates flag
    (window as any).__URBANSHADE_AUTO_UPDATES__ = values.auto_updates !== false;

    // Debug overlay
    if (values.debug_overlay) {
      document.documentElement.classList.add('debug-overlay');
    } else {
      document.documentElement.classList.remove('debug-overlay');
    }

    window.dispatchEvent(new Event('storage'));
  }, [values, isLoaded]);

  const updateValue = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    saveState(`settings_${key}`, value);
  };

  const handleLightModeToggle = (enabled: boolean) => {
    if (enabled) {
      setShowLightModeWarning(true);
    } else {
      updateValue('light_mode', false);
      setTheme('urbanshade-dark');
    }
  };

  const confirmLightMode = () => {
    updateValue('light_mode', true);
    setTheme('urbanshade-light');
    setShowLightModeWarning(false);
    toast.success('Light mode enabled');
  };

  const handleApplyBackgroundTheme = (preset: ThemePreset) => {
    applyPreset(preset);
    setSelectedBackgroundTheme(preset.id);
  };

  const handleApplySystemTheme = (themeId: string) => {
    setTheme(themeId);
    toast.success(`Applied ${allThemes.find(t => t.id === themeId)?.name || themeId}`);
  };

  const resetAll = () => {
    const defaults: Record<string, any> = {};
    settingsConfig.forEach(category => {
      if (category.settings) {
        category.settings.forEach(setting => {
          if (setting.type !== 'info' && setting.type !== 'action') {
            defaults[setting.key] = setting.defaultValue;
            saveState(`settings_${setting.key}`, setting.defaultValue);
          }
        });
      }
    });
    setValues(defaults);
    window.dispatchEvent(new Event('storage'));
    toast.success('Settings reset to defaults');
  };

  // Filter for search
  const filteredCategories = searchQuery 
    ? settingsConfig.filter(c => c.settings).map(cat => ({
        ...cat,
        settings: cat.settings!.filter(s => 
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })).filter(cat => cat.settings && cat.settings.length > 0)
    : settingsConfig;

  const currentCategory = searchQuery ? null : settingsConfig.find(c => c.id === activeCategory);

  // Categorize themes
  const presetThemes = themePresets.filter(t => t.source === 'default');
  const battlepassThemes = themePresets.filter(t => t.source === 'battlepass');
  const systemPresets = THEME_PRESETS.slice(0, 6);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  // ============ PERSONALIZATION RENDERER ============
  const renderPersonalization = () => (
    <div className="space-y-6">
      {/* Color Mode */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          Color Mode
        </h4>
        <div className={cn("grid gap-3", isCompact ? "grid-cols-1" : "grid-cols-2")}>
          <button
            onClick={() => handleLightModeToggle(false)}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
              !values.light_mode
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-border"
            )}
          >
            <Moon className="w-6 h-6" />
            <span className="text-sm font-medium">Dark Mode</span>
            <span className="text-xs text-muted-foreground">Recommended</span>
            {!values.light_mode && <Check className="w-4 h-4 text-primary" />}
          </button>
          <button
            onClick={() => handleLightModeToggle(true)}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
              values.light_mode
                ? "border-amber-500 bg-amber-500/10"
                : "border-border/50 hover:border-border"
            )}
          >
            <Sun className="w-6 h-6" />
            <span className="text-sm font-medium">Light Mode</span>
            <span className="text-xs text-amber-500">Not Recommended</span>
            {values.light_mode && <Check className="w-4 h-4 text-amber-500" />}
          </button>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          Themes
        </h4>
        
        <Tabs value={themeTab} onValueChange={setThemeTab}>
          <TabsList className={cn("w-full h-9", isCompact ? "grid-cols-2" : "grid-cols-3")}>
            <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
            <TabsTrigger value="battlepass" className="text-xs gap-1">
              <Crown className="w-3 h-3" />
              {!isCompact && "Battle Pass"}
            </TabsTrigger>
            {!isCompact && (
              <TabsTrigger value="purchased" className="text-xs gap-1">
                <Gift className="w-3 h-3" />
                Owned
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="presets" className="mt-3">
            <div className={cn("grid gap-2", isCompact ? "grid-cols-1" : "grid-cols-2")}>
              {presetThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedBackgroundTheme === theme.id}
                  onClick={() => handleApplyBackgroundTheme(theme)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="battlepass" className="mt-3">
            {battlepassThemes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No Battle Pass themes available</p>
              </div>
            ) : (
              <div className={cn("grid gap-2", isCompact ? "grid-cols-1" : "grid-cols-2")}>
                {battlepassThemes.map(theme => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={selectedBackgroundTheme === theme.id}
                    onClick={() => handleApplyBackgroundTheme(theme)}
                    badge={`Lv.${theme.requiredLevel}`}
                    badgeColor="text-purple-400 bg-purple-500/20"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchased" className="mt-3">
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No purchased themes yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* System Themes */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          System Themes
        </h4>
        <div className={cn("grid gap-2", isCompact ? "grid-cols-1" : "grid-cols-2")}>
          {systemPresets.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleApplySystemTheme(theme.id)}
              className={cn(
                "p-3 rounded-lg border transition-all text-left",
                currentTheme.id === theme.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-border bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-border/50"
                  style={{ 
                    background: `hsl(${theme.darkColors.primary.split(' ').slice(0, 2).join(' ')} / 1)` 
                  }}
                />
                <span className="text-sm font-medium truncate">{theme.name}</span>
                {currentTheme.id === theme.id && <Check className="w-3 h-3 text-primary ml-auto" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Effects */}
      <div className="space-y-2 bg-muted/20 rounded-xl p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
          Visual Effects
        </h4>
        <div className="space-y-1">
          <SettingRow
            setting={{ key: 'blur_effects', label: 'Blur Effects', description: 'Enable backdrop blur', type: 'toggle', defaultValue: true, icon: Sparkles, functional: true }}
            value={values.blur_effects}
            onChange={(val) => updateValue('blur_effects', val)}
          />
          <SettingRow
            setting={{ key: 'transparency', label: 'Window Transparency', type: 'toggle', defaultValue: true }}
            value={values.transparency}
            onChange={(val) => updateValue('transparency', val)}
          />
        </div>
      </div>
    </div>
  );

  // ============ BOOT RENDERER ============
  const renderBoot = () => (
    <div className="space-y-6">
      {/* Boot Animation */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          Boot Animation
        </h4>
        <div className="space-y-2">
          {BOOT_ANIMATIONS.map(anim => (
            <button
              key={anim.id}
              onClick={() => updateValue('boot_animation', anim.id)}
              className={cn(
                "w-full p-3 rounded-lg border transition-all text-left flex items-center justify-between",
                values.boot_animation === anim.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-border bg-muted/30"
              )}
            >
              <div>
                <span className="text-sm font-medium">{anim.name}</span>
                <p className="text-xs text-muted-foreground">{anim.description}</p>
              </div>
              {values.boot_animation === anim.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Boot Options */}
      <div className="space-y-2 bg-muted/20 rounded-xl p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
          Startup Options
        </h4>
        <div className="space-y-1">
          <SettingRow
            setting={{ key: 'boot_logo', label: 'Show Boot Logo', description: 'Display UrbanShade logo on startup', type: 'toggle', defaultValue: true, icon: Image, functional: true }}
            value={values.boot_logo}
            onChange={(val) => updateValue('boot_logo', val)}
          />
          <SettingRow
            setting={{ key: 'boot_sound', label: 'Boot Sound', description: 'Play sound on system startup', type: 'toggle', defaultValue: true, icon: Music, functional: true }}
            value={values.boot_sound}
            onChange={(val) => updateValue('boot_sound', val)}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
        <p className="text-xs text-muted-foreground">
          💡 Access BIOS settings by pressing F2 during boot for advanced boot configuration.
        </p>
      </div>
    </div>
  );

  // ============ SYSTEM RENDERER ============
  const renderSystem = () => {
    const buildId = `US-${VERSION.build}`;
    const installDate = loadState('urbanshade_install_date', new Date().toISOString());
    const formattedInstallDate = new Date(installDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    return (
      <div className="space-y-6">
        {/* OS Information */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">UrbanShade OS</h3>
              <p className="text-sm text-muted-foreground">Deep Ocean Edition</p>
            </div>
          </div>
          <div className={cn("grid gap-3", isCompact ? "grid-cols-1" : "grid-cols-2")}>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Version</p>
              <p className="text-sm font-bold text-primary">{VERSION.displayVersion}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Codename</p>
              <p className="text-sm font-bold text-foreground">{VERSION.codename}</p>
            </div>
          </div>
        </div>

        {/* View Changelog */}
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowChangelog(true)}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            View Changelog
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Button>
        <ChangelogDialog open={showChangelog} onOpenChange={setShowChangelog} />

        {/* Build Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Build Information
          </h4>
          <div className="space-y-1 bg-muted/20 rounded-xl p-3">
            <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30">
              <span className="text-sm font-medium text-foreground">Build Number</span>
              <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                {buildId}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30">
              <span className="text-sm font-medium text-foreground">Full Version</span>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                {VERSION.major}.{VERSION.minor}.{VERSION.patch}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30">
              <span className="text-sm font-medium text-foreground">Release Date</span>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                {VERSION.releaseDate}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30">
              <span className="text-sm font-medium text-foreground">Install Date</span>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                {formattedInstallDate}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary" />
            Storage
          </h4>
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">LocalStorage Used</span>
              <span className="text-xs font-mono text-primary">
                {(() => {
                  let total = 0;
                  for (const key in localStorage) {
                    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
                      total += localStorage[key].length * 2;
                    }
                  }
                  return `${(total / 1024).toFixed(2)} KB`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h4>
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Factory Reset</p>
                <p className="text-xs text-muted-foreground">Erase all data and restore to defaults</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleFactoryReset}
                className="h-8"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-background" data-settings-container>
      {/* Sidebar */}
      <div className={cn(
        "border-r border-border/40 bg-muted/20 flex flex-col shrink-0",
        isCompact ? "w-14" : "w-52"
      )}>
        <div className={cn("p-3 border-b border-border/40", isCompact && "px-2")}>
          {!isCompact && (
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-primary" />
              </div>
              Settings
            </h2>
          )}
          {!isCompact && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 bg-background/50 border-border/50 h-8 text-sm"
              />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-2">
          <div className={cn("space-y-0.5", isCompact ? "px-1" : "px-2")}>
            {settingsConfig.map(category => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id && !searchQuery;
              return (
                <button
                  key={category.id}
                  onClick={() => { setActiveCategory(category.id); setSearchQuery(''); }}
                  title={isCompact ? category.name : undefined}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg text-left transition-all group",
                    isCompact ? "p-2 justify-center" : "px-2.5 py-2 text-sm",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "rounded-lg flex items-center justify-center transition-colors shrink-0",
                    isCompact ? "w-8 h-8" : "w-7 h-7",
                    isActive ? "bg-primary/20" : "bg-muted/50 group-hover:bg-muted"
                  )}>
                    <Icon className={cn("w-3.5 h-3.5", isCompact && "w-4 h-4")} />
                  </div>
                  {!isCompact && (
                    <>
                      <span className="font-medium flex-1 truncate">{category.name}</span>
                      <ChevronRight className={cn(
                        "w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity shrink-0",
                        isActive && "opacity-100"
                      )} />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {!isCompact && (
          <div className="p-2 border-t border-border/40">
            <Button variant="ghost" size="sm" onClick={resetAll} className="w-full gap-2 text-xs text-muted-foreground">
              <RotateCcw className="w-3 h-3" />
              Reset All
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-w-0">
        <ScrollArea className="h-full">
          <div className={cn("p-6", isCompact ? "max-w-full" : "max-w-xl")}>
            {searchQuery ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">Search Results</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Found {filteredCategories.reduce((acc, cat) => acc + (cat.settings?.length || 0), 0)} settings
                  </p>
                </div>
                <div className="space-y-6">
                  {filteredCategories.map(category => (
                    <div key={category.id} className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        {category.name}
                      </h4>
                      <div className="space-y-1 bg-muted/20 rounded-xl p-2">
                        {category.settings?.map(setting => (
                          <SettingRow
                            key={setting.key}
                            setting={setting}
                            value={values[setting.key]}
                            onChange={(val) => updateValue(setting.key, val)}
                            oemUnlocked={oemUnlocked}
                            isCompact={isCompact}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : currentCategory ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                      <currentCategory.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{currentCategory.name}</h3>
                      {currentCategory.description && (
                        <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {currentCategory.customRender ? (
                  currentCategory.id === 'personalization' ? renderPersonalization() :
                  currentCategory.id === 'boot' ? renderBoot() :
                  currentCategory.id === 'system' ? renderSystem() : null
                ) : currentCategory.settings ? (
                  <div className="space-y-1 bg-muted/20 rounded-xl p-2">
                    {currentCategory.settings.map(setting => (
                      <SettingRow
                        key={setting.key}
                        setting={setting}
                        value={values[setting.key]}
                        onChange={(val) => updateValue(setting.key, val)}
                        oemUnlocked={oemUnlocked}
                        isCompact={isCompact}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showLightModeWarning} onOpenChange={setShowLightModeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Enable Light Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Light mode is not recommended for UrbanShade OS. The interface is designed for dark mode and some elements may not look optimal in light mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Dark</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLightMode} className="bg-amber-600 hover:bg-amber-700">
              Enable Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showOemDialog} onOpenChange={setShowOemDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {oemUnlocked ? 'Disable OEM Unlock?' : 'Enable OEM Unlock?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {oemUnlocked 
                ? 'This will re-enable bootloader protection.'
                : 'This will unlock the bootloader and allow custom firmware modifications.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOemUnlock} className={oemUnlocked ? "" : "bg-amber-600 hover:bg-amber-700"}>
              {oemUnlocked ? 'Disable' : 'Unlock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Factory Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your data and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFactoryReset} className="bg-destructive hover:bg-destructive/90">
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ============ THEME CARD ============

interface ThemeCardProps {
  theme: ThemePreset;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
  badgeColor?: string;
}

const ThemeCard = ({ theme, isSelected, onClick, badge, badgeColor }: ThemeCardProps) => (
  <button
    onClick={onClick}
    className={cn(
      "relative p-3 rounded-lg border transition-all text-left overflow-hidden",
      isSelected
        ? "border-primary ring-1 ring-primary/30"
        : "border-border/50 hover:border-border"
    )}
    style={{
      background: `linear-gradient(135deg, ${theme.colors.bgGradientStart}, ${theme.colors.bgGradientEnd})`
    }}
  >
    <div className="relative z-10">
      <div className="flex items-center gap-2">
        {theme.colors.accentColor && (
          <div 
            className="w-3 h-3 rounded-full border border-white/20"
            style={{ backgroundColor: theme.colors.accentColor }}
          />
        )}
        <span className="text-xs font-medium text-white/90 truncate">{theme.name}</span>
        {isSelected && <Check className="w-3 h-3 text-white ml-auto" />}
      </div>
    </div>
    {badge && (
      <span className={cn("absolute top-1 right-1 text-[9px] px-1 py-0.5 rounded font-semibold", badgeColor)}>
        {badge}
      </span>
    )}
  </button>
);

// ============ SETTING ROW ============

interface SettingRowProps {
  setting: SettingItem;
  value: any;
  onChange: (value: any) => void;
  oemUnlocked?: boolean;
  isCompact?: boolean;
}

const SettingRow = ({ setting, value, onChange, oemUnlocked, isCompact }: SettingRowProps) => {
  const Icon = setting.icon;

  if (setting.type === 'info') {
    const displayValue = setting.infoValue ? setting.infoValue() : value;
    return (
      <div className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors",
        isCompact && "flex-col items-start gap-2"
      )}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground">{setting.label}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
          {displayValue}
        </span>
      </div>
    );
  }

  if (setting.type === 'action') {
    return (
      <div className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors",
        setting.dangerous && "border border-destructive/20 bg-destructive/5",
        isCompact && "flex-col items-start gap-2"
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              setting.dangerous ? "bg-destructive/20" : "bg-muted/50"
            )}>
              <Icon className={cn("w-3.5 h-3.5", setting.dangerous ? "text-destructive" : "text-muted-foreground")} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
              <span className="truncate">{setting.label}</span>
              {setting.key === 'oem_unlock' && oemUnlocked && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded font-semibold shrink-0">
                  UNLOCKED
                </span>
              )}
            </div>
            {setting.description && <p className="text-xs text-muted-foreground truncate">{setting.description}</p>}
          </div>
        </div>
        <Button 
          size="sm" 
          variant={setting.dangerous ? "destructive" : "secondary"}
          onClick={setting.action}
          className={cn("h-7 text-xs shrink-0", isCompact && "w-full")}
        >
          {setting.key === 'oem_unlock' ? (oemUnlocked ? 'Lock' : 'Unlock') : setting.actionLabel}
        </Button>
      </div>
    );
  }

  if (setting.type === 'toggle') {
    return (
      <div className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors",
        setting.dangerous && "border border-destructive/20 bg-destructive/5"
      )}>
        <div className="flex items-center gap-2.5 flex-1 pr-4 min-w-0">
          {Icon && (
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              setting.dangerous ? "bg-destructive/20" : "bg-muted/50"
            )}>
              <Icon className={cn("w-3.5 h-3.5", setting.dangerous ? "text-destructive" : "text-muted-foreground")} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="truncate">{setting.label}</span>
              {setting.dangerous && (
                <span className="text-[9px] px-1.5 py-0.5 bg-destructive/20 text-destructive rounded font-semibold shrink-0">DANGER</span>
              )}
            </div>
            {setting.description && !isCompact && <p className="text-xs text-muted-foreground truncate">{setting.description}</p>}
          </div>
        </div>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} className="shrink-0" />
      </div>
    );
  }

  if (setting.type === 'slider') {
    return (
      <div className="py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground truncate">{setting.label}</span>
          <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded shrink-0">{value}</span>
        </div>
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange(val)}
          min={setting.min}
          max={setting.max}
          step={1}
          className="w-full"
        />
      </div>
    );
  }

  return null;
};

export default Settings;
