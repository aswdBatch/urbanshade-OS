import { useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  BellOff, 
  Bell,
  Cloud,
  Loader2,
  Settings,
  Palette,
  X,
  Bluetooth,
  BluetoothOff,
  Plane,
  Battery,
  BatteryCharging,
  Clock
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useDoNotDisturb } from "@/hooks/useDoNotDisturb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuickSettingsFlyoutProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const QuickSettingsFlyout = ({ open, onClose, onOpenSettings }: QuickSettingsFlyoutProps) => {
  const [brightness, setBrightness] = useState(() => {
    return parseInt(localStorage.getItem("settings_brightness") || "100");
  });
  const [nightLight, setNightLight] = useState(() => {
    return localStorage.getItem("settings_night_light") === "true";
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("settings_sound_enabled") !== "false";
  });
  const { isDndEnabled, isScheduledDnd, toggleDnd, getTimeUntilEnd } = useDoNotDisturb();
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(() => {
    return localStorage.getItem("settings_bluetooth") === "true";
  });
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [volume, setVolume] = useState(() => {
    return parseInt(localStorage.getItem("settings_volume") || "75");
  });
  const [batteryLevel] = useState(() => Math.floor(Math.random() * 40) + 60); // Simulated 60-100%
  const [isCharging] = useState(() => Math.random() > 0.5);

  const { isEnabled: syncEnabled, isSyncing, lastSyncTime, manualSync } = useAutoSync();

  useEffect(() => {
    localStorage.setItem("settings_brightness", brightness.toString());
    document.documentElement.style.filter = `brightness(${brightness / 100})`;
  }, [brightness]);

  useEffect(() => {
    localStorage.setItem("settings_night_light", nightLight.toString());
    if (nightLight) {
      document.documentElement.style.filter = `brightness(${brightness / 100}) sepia(0.3)`;
    } else {
      document.documentElement.style.filter = `brightness(${brightness / 100})`;
    }
  }, [nightLight, brightness]);

  useEffect(() => {
    localStorage.setItem("settings_sound_enabled", soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("settings_bluetooth", bluetoothEnabled.toString());
  }, [bluetoothEnabled]);

  useEffect(() => {
    localStorage.setItem("settings_volume", volume.toString());
  }, [volume]);

  const handleAirplaneToggle = () => {
    const newState = !airplaneMode;
    setAirplaneMode(newState);
    if (newState) {
      setWifiEnabled(false);
      setBluetoothEnabled(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (!open) return null;

  const QuickToggle = ({ 
    active, 
    onClick, 
    icon: Icon, 
    activeIcon: ActiveIcon,
    label,
    disabled
  }: { 
    active: boolean; 
    onClick: () => void; 
    icon: React.ElementType;
    activeIcon?: React.ElementType;
    label: string;
    disabled?: boolean;
  }) => {
    const DisplayIcon = active && ActiveIcon ? ActiveIcon : Icon;
    const [justToggled, setJustToggled] = useState(false);
    
    const handleClick = () => {
      onClick();
      setJustToggled(true);
      setTimeout(() => setJustToggled(false), 200);
    };
    
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${
          active 
            ? "bg-primary/20 text-primary border border-primary/30" 
            : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
        } ${justToggled ? "animate-toggle-pulse" : ""}`}
      >
        <DisplayIcon className="w-5 h-5" />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div 
      className="fixed right-3 bottom-[78px] w-[340px] rounded-xl backdrop-blur-2xl bg-background/95 border border-border/50 z-[900] shadow-2xl overflow-hidden animate-notif-slide-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Battery */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-bold text-sm">Quick Settings</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isCharging ? (
              <BatteryCharging className="w-4 h-4 text-green-500" />
            ) : (
              <Battery className={`w-4 h-4 ${batteryLevel < 20 ? 'text-destructive' : ''}`} />
            )}
            <span className={batteryLevel < 20 ? 'text-destructive' : ''}>{batteryLevel}%</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-7 h-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Toggles Grid - 4 columns */}
      <div className="grid grid-cols-4 gap-2 p-3">
        <QuickToggle
          active={wifiEnabled && !airplaneMode}
          onClick={() => !airplaneMode && setWifiEnabled(!wifiEnabled)}
          icon={WifiOff}
          activeIcon={Wifi}
          label="Wi-Fi"
          disabled={airplaneMode}
        />
        <QuickToggle
          active={bluetoothEnabled && !airplaneMode}
          onClick={() => !airplaneMode && setBluetoothEnabled(!bluetoothEnabled)}
          icon={BluetoothOff}
          activeIcon={Bluetooth}
          label="Bluetooth"
          disabled={airplaneMode}
        />
        <QuickToggle
          active={airplaneMode}
          onClick={handleAirplaneToggle}
          icon={Plane}
          label="Airplane"
        />
        <div className="relative">
          <QuickToggle
            active={isDndEnabled}
            onClick={toggleDnd}
            icon={Bell}
            activeIcon={BellOff}
            label={isScheduledDnd ? "Sched." : "DND"}
          />
          {isScheduledDnd && (
            <Clock className="absolute top-1 right-1 w-3 h-3 text-primary" />
          )}
        </div>
        <QuickToggle
          active={nightLight}
          onClick={() => setNightLight(!nightLight)}
          icon={Sun}
          activeIcon={Moon}
          label="Night Light"
        />
        <QuickToggle
          active={soundEnabled}
          onClick={() => setSoundEnabled(!soundEnabled)}
          icon={VolumeX}
          activeIcon={Volume2}
          label="Sound"
        />
        <button
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent transition-all"
        >
          <Palette className="w-5 h-5" />
          <span className="text-[10px] font-medium">Themes</span>
        </button>
        <button
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>

      {/* Volume Slider */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <button onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-muted-foreground shrink-0 hover:text-foreground transition-colors" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground shrink-0 hover:text-foreground transition-colors" />
            )}
          </button>
          <Slider
            value={[volume]}
            onValueChange={([val]) => setVolume(val)}
            min={0}
            max={100}
            step={5}
            className="flex-1"
            disabled={!soundEnabled}
          />
          <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
        </div>
      </div>

      {/* Brightness Slider */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <Sun className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            value={[brightness]}
            onValueChange={([val]) => setBrightness(val)}
            min={30}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">{brightness}%</span>
        </div>
      </div>

      {/* Sync Status */}
      {syncEnabled && (
        <div className="px-4 pb-4">
          <button
            onClick={() => manualSync()}
            disabled={isSyncing}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
          >
            <div className="flex items-center gap-3">
              {isSyncing ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4 text-blue-400" />
              )}
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">
                  {isSyncing ? "Syncing..." : "Cloud Sync"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Last: {formatLastSync(lastSyncTime)}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-blue-400 font-medium">
              {isSyncing ? "" : "Sync Now"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
