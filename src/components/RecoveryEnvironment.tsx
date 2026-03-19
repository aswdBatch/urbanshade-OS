import { useState, useEffect, useRef } from "react";
import { RecoveryTerminal } from "./RecoveryTerminal";

type RecoveryScreen = 
  | "main" 
  | "troubleshoot" 
  | "startup-settings" 
  | "data-recovery" 
  | "system-image"
  | "recovery-image"
  | "terminal"
  | "rebooting";

interface RecoveryEnvironmentProps {
  onContinue: () => void;
  onShutdown: () => void;
  onBootToBios: () => void;
  onTerminalBoot: () => void;
  onSafeMode: () => void;
  onOfflineMode: () => void;
}

export const RecoveryEnvironment = ({
  onContinue,
  onShutdown,
  onBootToBios,
  onTerminalBoot,
  onSafeMode,
  onOfflineMode,
}: RecoveryEnvironmentProps) => {
  const [screen, setScreen] = useState<RecoveryScreen>("main");
  const [selectedOption, setSelectedOption] = useState(0);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [recoveredItems, setRecoveredItems] = useState<string[]>([]);
  const [recoveryImages, setRecoveryImages] = useState<any[]>([]);
  const [rebootTarget, setRebootTarget] = useState<string | null>(null);
  const [rebootProgress, setRebootProgress] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recovery images from localStorage
  useEffect(() => {
    const images = localStorage.getItem("urbanshade_recovery_images");
    if (images) {
      try {
        setRecoveryImages(JSON.parse(images));
      } catch {}
    }
  }, []);

  // Handle cursor visibility on mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      setShowCursor(true);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      cursorTimeoutRef.current = setTimeout(() => {
        setShowCursor(false);
      }, 2000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

  // Handle reboot animation
  useEffect(() => {
    if (screen === "rebooting") {
      const interval = setInterval(() => {
        setRebootProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              if (rebootTarget === "bios") onBootToBios();
              else if (rebootTarget === "safe-mode") onSafeMode();
              else if (rebootTarget === "safe-mode-terminal") onTerminalBoot();
              else if (rebootTarget === "offline-mode") onOfflineMode();
              else if (rebootTarget === "normal") onContinue();
            }, 300);
            return 100;
          }
          return prev + 8;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [screen, rebootTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (screen === "terminal" || screen === "rebooting") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        setSelectedOption(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown") {
        setSelectedOption(prev => prev + 1);
      } else if (e.key === "Escape" || e.key === "Backspace") {
        handleBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, selectedOption]);

  const handleBack = () => {
    if (screen === "troubleshoot") setScreen("main");
    else if (["startup-settings", "data-recovery", "system-image", "recovery-image"].includes(screen)) {
      setScreen("troubleshoot");
    }
    setSelectedOption(0);
  };

  const initiateReboot = (target: string) => {
    setRebootTarget(target);
    setRebootProgress(0);
    setScreen("rebooting");
  };

  const runDataRecovery = async () => {
    setRecoveryProgress(0);
    setRecoveryStatus("Scanning localStorage...");
    setRecoveredItems([]);

    const steps = [
      { progress: 10, status: "Checking key integrity..." },
      { progress: 30, status: "Validating JSON structures..." },
      { progress: 50, status: "Scanning for orphaned data..." },
      { progress: 70, status: "Attempting repairs..." },
      { progress: 90, status: "Verifying data consistency..." },
      { progress: 100, status: "Scan complete" },
    ];

    const recovered: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) JSON.parse(value);
        } catch {
          recovered.push(key);
        }
      }
    }

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400));
      setRecoveryProgress(step.progress);
      setRecoveryStatus(step.status);
    }
    setRecoveredItems(recovered);
  };

  const applyStartupSetting = (setting: string) => {
    switch (setting) {
      case "safe-mode":
        sessionStorage.setItem("urbanshade_safe_mode", "true");
        initiateReboot("safe-mode");
        break;
      case "safe-mode-terminal":
        sessionStorage.setItem("urbanshade_safe_mode", "true");
        sessionStorage.setItem("urbanshade_terminal_only", "true");
        initiateReboot("safe-mode-terminal");
        break;
      case "offline-mode":
        sessionStorage.setItem("urbanshade_offline_mode", "true");
        initiateReboot("offline-mode");
        break;
      case "boot-logging":
        sessionStorage.setItem("urbanshade_boot_logging", "true");
        initiateReboot("normal");
        break;
      case "force-verification":
        sessionStorage.setItem("urbanshade_force_verify", "true");
        initiateReboot("normal");
        break;
      case "disable-auto-restart":
        sessionStorage.setItem("urbanshade_no_auto_restart", "true");
        initiateReboot("normal");
        break;
      case "clear-cache":
        const essentialKeys = [
          "urbanshade_admin", "urbanshade_accounts", "urbanshade_oobe_complete",
          "urbanshade_disclaimer_accepted", "urbanshade_install_type",
        ];
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && !essentialKeys.includes(key) && !key.startsWith("urbanshade_admin")) {
            if (key.includes("cache") || key.includes("temp") || key.includes("session")) {
              localStorage.removeItem(key);
            }
          }
        }
        initiateReboot("normal");
        break;
      case "normal":
        initiateReboot("normal");
        break;
    }
  };

  const loadRecoveryImage = (image: any) => {
    if (!image?.data) return;
    Object.entries(image.data).forEach(([key, value]) => {
      if (key !== "urbanshade_recovery_images") {
        localStorage.setItem(key, value as string);
      }
    });
    onContinue();
  };

  const handleImportImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        onContinue();
      } catch {
        alert("Invalid image file");
      }
    };
    reader.readAsText(file);
  };

  // Rebooting screen - simple text
  if (screen === "rebooting") {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center font-mono">
        <div className="text-center">
          <p className="mb-4">Restarting...</p>
          <div className="w-48 h-1 bg-gray-800">
            <div 
              className="h-full bg-gray-400 transition-all"
              style={{ width: `${rebootProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Terminal screen
  if (screen === "terminal") {
    return (
      <RecoveryTerminal 
        onExit={() => setScreen("troubleshoot")}
        onReboot={() => initiateReboot("normal")}
      />
    );
  }

  // Classic BIOS-style option component
  const BiosOption = ({ 
    index,
    label, 
    onClick,
  }: { 
    index: number;
    label: string; 
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      onMouseEnter={() => setSelectedOption(index)}
      className={`px-2 py-0.5 cursor-pointer text-[13px] ${
        selectedOption === index 
          ? "bg-[#aaaaaa] text-black" 
          : "text-white"
      }`}
    >
      {label}
    </div>
  );

  // Main Menu
  if (screen === "main") {
    const mainOptions = [
      { label: "Continue", action: onContinue },
      { label: "Turn off your PC", action: onShutdown },
      { label: "Troubleshoot", action: () => { setScreen("troubleshoot"); setSelectedOption(0); } },
    ];

    const descriptions: Record<number, string> = {
      0: "Exit and continue to UrbanShade OS",
      1: "Turn off the system completely",
      2: "Reset your PC or see advanced options",
    };

    return (
      <div className={`fixed inset-0 bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">Choose an option</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px]">
          <p className="text-gray-400 mb-6">(Use ↑↓ to navigate, ENTER to select. Mouse optional.)</p>

          <div className="space-y-0.5 mb-8">
            {mainOptions.map((opt, i) => (
              <BiosOption
                key={i}
                index={i}
                label={opt.label}
                onClick={opt.action}
              />
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-300">
              Description: {descriptions[selectedOption]}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
          <span>ENTER=Choose</span>
          <span>ESC=Cancel</span>
        </div>
      </div>
    );
  }

  // Troubleshoot
  if (screen === "troubleshoot") {
    const troubleshootOptions = [
      { id: "data-recovery", label: "Data Recovery", action: () => { setScreen("data-recovery"); runDataRecovery(); } },
      { id: "terminal", label: "Command Prompt", action: () => setScreen("terminal") },
      { id: "bios", label: "UEFI Firmware Settings", action: () => initiateReboot("bios") },
      { id: "system-image", label: "System Image Recovery", action: () => setScreen("system-image") },
      { id: "recovery-image", label: "DEF-DEV Snapshots", action: () => setScreen("recovery-image") },
      { id: "startup-settings", label: "Startup Settings", action: () => { setScreen("startup-settings"); setSelectedOption(0); } },
      { id: "back", label: "Go back", action: handleBack },
    ];

    const descriptions: Record<number, string> = {
      0: "Scan and repair corrupted data entries",
      1: "Use the Command Prompt for advanced troubleshooting",
      2: "Change settings in your PC's UEFI firmware",
      3: "Recover UrbanShade using a specific system image file",
      4: "Restore from a DEF-DEV recovery snapshot",
      5: "Change UrbanShade startup behavior",
      6: "Return to the previous menu",
    };

    return (
      <div className={`fixed inset-0 bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">Advanced Options</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px]">
          <p className="text-gray-400 mb-6">(Use ↑↓ to navigate, ENTER to select. Mouse optional.)</p>

          <div className="space-y-0.5 mb-8">
            {troubleshootOptions.map((opt, i) => (
              <BiosOption
                key={opt.id}
                index={i}
                label={opt.label}
                onClick={opt.action}
              />
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-300">
              Description: {descriptions[selectedOption] || ""}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
          <span>ENTER=Choose</span>
          <span>ESC=Back</span>
        </div>
      </div>
    );
  }

  // Startup Settings
  if (screen === "startup-settings") {
    const startupSettings = [
      { id: "safe-mode", num: "1", label: "Enable Safe Mode" },
      { id: "safe-mode-terminal", num: "2", label: "Enable Safe Mode with Command Prompt" },
      { id: "offline-mode", num: "3", label: "Enable Offline Mode" },
      { id: "boot-logging", num: "4", label: "Enable Boot Logging" },
      { id: "force-verification", num: "5", label: "Enable low-resolution video (640x480)" },
      { id: "disable-auto-restart", num: "6", label: "Disable automatic restart on system failure" },
      { id: "clear-cache", num: "7", label: "Clear Cache and Restart" },
      { id: "normal", num: "8", label: "Start UrbanShade Normally" },
    ];

    const descriptions: Record<number, string> = {
      0: "Start with minimal drivers and services",
      1: "Start with a command prompt instead of the desktop",
      2: "Start without network connectivity",
      3: "Create a file listing all drivers that are installed during startup",
      4: "Start with lower resolution display mode",
      5: "On system failure, remain at the error screen instead of restarting",
      6: "Clear temporary cache data and restart",
      7: "Start UrbanShade using normal settings",
    };

    return (
      <div className={`fixed inset-0 bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">Startup Settings</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px]">
          <p className="text-gray-400 mb-6">(Use ↑↓ to navigate, ENTER to select. Mouse optional.)</p>

          <div className="space-y-0.5 mb-8">
            {startupSettings.map((s, i) => (
              <div
                key={s.id}
                onClick={() => applyStartupSetting(s.id)}
                onMouseEnter={() => setSelectedOption(i)}
                className={`px-2 py-0.5 cursor-pointer ${
                  selectedOption === i 
                    ? "bg-[#aaaaaa] text-black" 
                    : "text-white"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-300">
              Description: {descriptions[selectedOption] || ""}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
          <span>ENTER=Choose</span>
          <span>Press F10 to see more options</span>
          <span>ESC=Back</span>
        </div>
      </div>
    );
  }

  // Data Recovery
  if (screen === "data-recovery") {
    return (
      <div className={`fixed inset-0 bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">Data Recovery</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px]">
          <p className="mb-4">{recoveryStatus}</p>
          
          {/* Progress bar - text based */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span>[</span>
              <div className="flex-1 h-4 flex items-center">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className={i < Math.floor(recoveryProgress / 5) ? "text-white" : "text-gray-700"}>
                    {i < Math.floor(recoveryProgress / 5) ? "█" : "░"}
                  </span>
                ))}
              </div>
              <span>]</span>
              <span className="w-12 text-right">{recoveryProgress}%</span>
            </div>
          </div>

          {/* Results */}
          {recoveryProgress === 100 && (
            <div className="space-y-2">
              {recoveredItems.length === 0 ? (
                <p className="text-green-400">No issues found. Your data appears to be intact.</p>
              ) : (
                <>
                  <p className="text-yellow-400">Found {recoveredItems.length} corrupted entries:</p>
                  {recoveredItems.slice(0, 10).map((item, i) => (
                    <p key={i} className="text-gray-400">  - {item}</p>
                  ))}
                  {recoveredItems.length > 10 && (
                    <p className="text-gray-500">  ... and {recoveredItems.length - 10} more</p>
                  )}
                </>
              )}
              
              <p className="mt-6 text-gray-400">Press ESC to go back</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-[13px]">
          <span>ESC=Back</span>
        </div>
      </div>
    );
  }

  // System Image Recovery
  if (screen === "system-image") {
    return (
      <div className={`fixed inset-0 bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">System Image Recovery</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px]">
          <p className="mb-4">Re-image your computer using a system image file.</p>
          <p className="text-gray-400 mb-6">
            A system image is a copy of the UrbanShade system files and programs.
            It can be used to restore your PC if it becomes corrupted.
          </p>

          <div className="space-y-2 mb-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setSelectedOption(0)}
              className={`px-2 py-0.5 cursor-pointer ${
                selectedOption === 0 
                  ? "bg-[#aaaaaa] text-black" 
                  : "text-white"
              }`}
            >
              Select a system image file...
            </div>
            <div
              onClick={handleBack}
              onMouseEnter={() => setSelectedOption(1)}
              className={`px-2 py-0.5 cursor-pointer ${
                selectedOption === 1 
                  ? "bg-[#aaaaaa] text-black" 
                  : "text-white"
              }`}
            >
              Cancel
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportImage}
            accept=".img,.json"
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
          <span>ENTER=Choose</span>
          <span>ESC=Cancel</span>
        </div>
      </div>
    );
  }

  // Recovery Image (DEF-DEV Snapshots)
  if (screen === "recovery-image") {
    return (
      <div className={`fixed inset-0 bg-black text-white flex flex-col font-mono select-none ${!showCursor ? 'cursor-none' : ''}`}>
        {/* Header */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 text-center">
          <span className="font-bold tracking-wide">DEF-DEV Snapshots</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 text-[13px] overflow-auto">
          <p className="text-gray-400 mb-6">
            (Use ↑↓ to navigate, ENTER to select. Mouse optional.)
          </p>

          {recoveryImages.length === 0 ? (
            <p className="text-gray-500">No recovery snapshots available.</p>
          ) : (
            <div className="space-y-0.5 mb-8">
              {recoveryImages.map((img, i) => (
                <div
                  key={img.name || i}
                  onClick={() => loadRecoveryImage(img)}
                  onMouseEnter={() => setSelectedOption(i)}
                  className={`px-2 py-0.5 cursor-pointer ${
                    selectedOption === i 
                      ? "bg-[#aaaaaa] text-black" 
                      : "text-white"
                  }`}
                >
                  {img.name || `Snapshot ${i + 1}`} - {new Date(img.created || img.timestamp).toLocaleString()}
                </div>
              ))}
            </div>
          )}

          <div
            onClick={handleBack}
            onMouseEnter={() => setSelectedOption(recoveryImages.length)}
            className={`px-2 py-0.5 cursor-pointer ${
              selectedOption === recoveryImages.length 
                ? "bg-[#aaaaaa] text-black" 
                : "text-white"
            }`}
          >
            Go back
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#aaaaaa] text-black px-4 py-1.5 flex justify-between text-[13px]">
          <span>ENTER=Choose</span>
          <span>ESC=Back</span>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
};