// import fkin everything
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Desktop } from "@/components/Desktop";
import { UserSelectionScreen } from "@/components/UserSelectionScreen";
import { BootScreen } from "@/components/BootScreen";
import { BiosScreen } from "@/components/BiosScreen";
import { PostScreen } from "@/components/PostScreen";
import { ShutdownScreen } from "@/components/ShutdownScreen";
import { RebootScreen } from "@/components/RebootScreen";
import { CrashScreen, CrashType, CrashData, triggerCrash } from "@/components/CrashScreen";
import { InstallationScreen } from "@/components/InstallationScreen";
import { MaintenanceMode } from "@/components/MaintenanceMode";
import { LockdownScreen } from "@/components/LockdownScreen";
import { NaviLockoutScreen } from "@/components/NaviLockoutScreen";
import { WelcomeModal } from "@/components/WelcomeModal";
import { RecoveryMode } from "@/components/RecoveryMode";
import { RecoveryEnvironment } from "@/components/RecoveryEnvironment";
import { DisclaimerScreen } from "@/components/DisclaimerScreen";
import { OOBEScreen } from "@/components/OOBEScreen";
import { ChangelogDialog } from "@/components/ChangelogDialog";
import { UpdateScreen } from "@/components/UpdateScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { LogoutScreen } from "@/components/LogoutScreen";
import { DevModeConsole } from "@/components/DevModeConsole";
import { LockScreen } from "@/components/LockScreen";
import { BugcheckScreen, createBugcheck, BugcheckData } from "@/components/BugcheckScreen";
import { BannedScreen } from "@/components/BannedScreen";
import { TempBanPopup } from "@/components/TempBanPopup";
import { TempBanBanner } from "@/components/TempBanBanner";
import { VipWelcomeDialog } from "@/components/VipWelcomeDialog";
import { BootPasswordPrompt } from "@/components/BootPasswordPrompt";
import { MobileBlockScreen } from "@/components/MobileBlockScreen";
import { actionDispatcher } from "@/lib/actionDispatcher";
import { systemBus } from "@/lib/systemBus";
import { commandQueue, QueuedCommand } from "@/lib/commandQueue";
import { useNaviSecurity } from "@/hooks/useNaviSecurity";
import { useBanCheck } from "@/hooks/useBanCheck";
import { useIdleLock } from "@/hooks/useIdleLock";
import { useIsMobile } from "@/hooks/use-mobile";
import { requiresBootPassword, requiresAdminPassword, verifyAdminPassword } from "@/hooks/useBiosSettings";
import SupabaseConnectivityChecker from "@/components/SupabaseConnectivityChecker";

const Index = () => {
  // detect mobile and nuke it
  const isMobile = useIsMobile();

  // security
  const naviSecurity = useNaviSecurity();
  // check for ban
  const banCheck = useBanCheck();
  const [adminSetupComplete, setAdminSetupComplete] = useState(false);
  const [showingBiosTransition, setShowingBiosTransition] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [postComplete, setPostComplete] = useState(() => {
    // Skip POST if fast boot or if this is a warm reboot
    const warmReboot = sessionStorage.getItem("urbanshade_warm_reboot");
    if (warmReboot === "true") {
      sessionStorage.removeItem("urbanshade_warm_reboot");
      return true;
    }
    return false;
  });
  const [biosComplete, setBiosComplete] = useState(() => {
    // Check if we should reboot to BIOS
    const rebootToBios = localStorage.getItem("urbanshade_reboot_to_bios");
    if (rebootToBios === "true") {
      localStorage.removeItem("urbanshade_reboot_to_bios");
      return false;
    }
    // Don't boot to BIOS by default
    return true;
  });
  const [booted, setBooted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [blackScreen, setBlackScreen] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [crashData, setCrashData] = useState<CrashData | null>(null);
  const [killedProcess, setKilledProcess] = useState<string>("");
  const [crashType, setCrashType] = useState<"kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload">(
    "kernel",
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [customCrashData, setCustomCrashData] = useState<{ title: string; message: string } | null>(null);
  const [bugcheckData, setBugcheckData] = useState<BugcheckData | null>(null);
  const [lockdownMode, setLockdownMode] = useState(false);
  const [lockdownProtocol, setLockdownProtocol] = useState<string>("");
  const [siteLocked, setSiteLocked] = useState(false);
  const [siteLockReason, setSiteLockReason] = useState<string>("");
  const [showTour, setShowTour] = useState(false);
  const [safeMode, setSafeMode] = useState(() => {
    return sessionStorage.getItem("urbanshade_safe_mode") === "true";
  });
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [inRecoveryMode, setInRecoveryMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [oobeComplete, setOobeComplete] = useState(() => {
    return localStorage.getItem("urbanshade_oobe_complete") === "true";
  });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem("urbanshade_disclaimer_accepted") === "true";
  });
  const [devModeOpen, setDevModeOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  // fakemod beta ig??
  const [fakeBanData, setFakeBanData] = useState<{ reason: string; duration?: string; isFake: boolean } | null>(null);
  const [fakeTempBanData, setFakeTempBanData] = useState<{
    reason: string;
    duration: string;
    expiresAt?: string;
    isFake: boolean;
  } | null>(null);
  const [fakeWarnData, setFakeWarnData] = useState<{ reason: string; isFake: boolean } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Idle lock
  useIdleLock({
    onLock: () => setIsLocked(true),
    idleTimeMinutes: 5,
    enabled: loggedIn && !crashed && !shuttingDown && !rebooting && !isLocked,
  });

  // Check site lock status from Supabase
  useEffect(() => {
    const checkSiteLock = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from('site_locks')
          .select('is_locked, lock_reason')
          .eq('id', 'global')
          .maybeSingle();
        
        if (data?.is_locked) {
          // Check if user is admin (admins bypass site lock)
          const { data: session } = await supabase.auth.getSession();
          if (session.session) {
            const { data: roleData } = await supabase.rpc('has_role', { 
              _user_id: session.session.user.id, 
              _role: 'admin' 
            });
            if (roleData) return; // Admin bypasses lock
          }
          setSiteLocked(true);
          setSiteLockReason(data.lock_reason || 'Site is currently locked by an administrator.');
        } else {
          setSiteLocked(false);
        }
      } catch (e) {
        // Silently fail - don't block the site if we can't check
        console.warn("Could not check site lock status:", e);
      }
    };
    
    checkSiteLock();
    // Re-check every 30 seconds
    const interval = setInterval(checkSiteLock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if admin setup is complete
  useEffect(() => {
    try {
      const adminData = localStorage.getItem("urbanshade_admin");
      if (adminData) {
        // Validate admin data structure
        const parsed = JSON.parse(adminData);
        if (parsed && parsed.id && parsed.name && parsed.password) {
          setAdminSetupComplete(true);
        } else {
          console.warn("Invalid admin data structure, clearing...");
          localStorage.removeItem("urbanshade_admin");
          setAdminSetupComplete(false);
        }
      } else {
        setAdminSetupComplete(false);
      }
    } catch (e) {
      console.error("Error checking admin setup:", e);
      localStorage.removeItem("urbanshade_admin");
      setAdminSetupComplete(false);
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Accumulate typed characters for 10% friendly shortcuts bcuz chromebooks
      if (e.key.length === 1) {
        const newBuffer = (keyBuffer + e.key.toLowerCase()).slice(-10);
        setKeyBuffer(newBuffer);

        // Check for typed commands
        if (newBuffer.endsWith("del") || newBuffer.endsWith("delete")) {
          if (!booted && !inRecoveryMode) {
            e.preventDefault();
            if (rebooting) {
              setRebooting(false);
              setBlackScreen(false);
            }
            setShowingBiosTransition(true);
            setTimeout(() => {
              setBiosComplete(false);
              setShowingBiosTransition(false);
            }, 1500);
            toast.info("Entering BIOS Setup...");
            setKeyBuffer("");
          }
        }
      }

      // F2 for recovery mode
      if (e.key === "F2" && !booted && !inRecoveryMode) {
        e.preventDefault();
        setInRecoveryMode(true);
        toast.info("Entering Recovery Mode...");
      }
      // DEL key to access BIOS (before boot or during reboot)
      if ((e.key === "Delete" || e.key === "Del") && !booted && !inRecoveryMode) {
        e.preventDefault();
        // If rebooting, interrupt and go to BIOS
        if (rebooting) {
          setRebooting(false);
          setBlackScreen(false);
        }
        setShowingBiosTransition(true);
        setTimeout(() => {
          setBiosComplete(false);
          setShowingBiosTransition(false);
        }, 1500);
        toast.info("Entering BIOS Setup...");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Expose console commands to window object
    (window as any).adminPanel = () => {
      setShowAdminPanel(true);
      console.log("%c[SYSTEM] Admin Panel Opened", "color: #00ff00; font-weight: bold");
    };

    (window as any).maintenanceMode = () => {
      setMaintenanceMode(true);
      console.log("%c[SYSTEM] Entering Maintenance Mode...", "color: #ffff00; font-weight: bold");
    };

    (window as any).normalMode = () => {
      setMaintenanceMode(false);
      console.log("%c[SYSTEM] Returning to Normal Mode...", "color: #00ff00; font-weight: bold");
    };

    (window as any).devMode = () => {
      setDevModeOpen(true);
      console.log("%c[SYSTEM] Opening Developer Console...", "color: #ff00ff; font-weight: bold");
    };

    // Expose NAVI (lol)
    (window as any).naviSecurity = {
      reportViolation: naviSecurity.reportViolation,
      triggerLockout: naviSecurity.triggerLockout,
      clearLockout: naviSecurity.clearLockout,
      getStatus: () => ({
        violations: naviSecurity.violations,
        warningLevel: naviSecurity.warningLevel,
        isLockedOut: naviSecurity.isLockedOut,
      }),
    };

    // Show available commands in console
    console.log("%c[URBANSHADE OS] Console Commands Available", "color: #00ffff; font-weight: bold; font-size: 14px");
    console.log("%cadminPanel() - Access admin panel (password required)", "color: #888888");
    console.log("%cmaintenanceMode() - Enter maintenance mode", "color: #888888");
    console.log("%cnormalMode() - Return to normal mode", "color: #888888");
    console.log("%cdevMode() - Open developer console", "color: #ff00ff");
    console.log("%c\nHint: Check the HTML source for hidden secrets...", "color: #ffaa00; font-style: italic");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loggedIn, lockdownMode, crashed, shuttingDown, rebooting, booted, biosComplete, inRecoveryMode, keyBuffer]);

  // Command Queue Polling the thing that makes Def-Dev work (DO NOT EDIT ISTG)
  useEffect(() => {
    const handleCommand = (cmd: QueuedCommand) => {
      actionDispatcher.system(`Executing queued command: ${cmd.type}`, { source: cmd.source });

      switch (cmd.type) {
        case "CRASH":
          const crash = triggerCrash(cmd.payload.type as CrashType, { process: cmd.payload.process || "queue.exe" });
          setCrashData(crash);
          setCrashed(true);
          break;

        case "BUGCHECK":
          const bugcheck = createBugcheck(cmd.payload.code, cmd.payload.description, cmd.source);
          setBugcheckData(bugcheck);
          break;

        case "REBOOT":
          handleReboot();
          break;

        case "SHUTDOWN":
          handleShutdown();
          break;

        case "LOCKDOWN":
          setLockdownProtocol(cmd.payload.protocol || "ALPHA");
          setLockdownMode(true);
          break;

        case "RECOVERY":
          setInRecoveryMode(true);
          break;

        case "WIPE":
          localStorage.clear();
          window.location.reload();
          break;

        case "WRITE_STORAGE":
          if (cmd.payload.key && cmd.payload.value !== undefined) {
            localStorage.setItem(cmd.payload.key, cmd.payload.value);
            actionDispatcher.file(`Storage write: ${cmd.payload.key}`);
          }
          break;

        case "DELETE_STORAGE":
          if (cmd.payload.key) {
            localStorage.removeItem(cmd.payload.key);
            actionDispatcher.file(`Storage delete: ${cmd.payload.key}`);
          }
          break;

        case "TOAST":
          const toastType = cmd.payload.type || "info";
          if (toastType === "success") toast.success(cmd.payload.message);
          else if (toastType === "error") toast.error(cmd.payload.message);
          else if (toastType === "warning") toast.warning(cmd.payload.message);
          else toast.info(cmd.payload.message);
          break;

        case "CUSTOM":
          // Handle custom commands via system bus
          systemBus.emit("CUSTOM_COMMAND", cmd.payload);
          break;

        case "LOGOUT":
          setLoggingOut(true);
          break;

        case "LOCK":
          setIsLocked(true);
          break;

        case "OOBE":
          localStorage.removeItem("urbanshade_oobe_complete");
          setOobeComplete(false);
          break;

        case "CHANGELOG":
          setShowChangelog(true);
          break;

        case "MAINTENANCE":
          setMaintenanceMode(cmd.payload.enable ?? true);
          break;

        case "SAFE_MODE":
          sessionStorage.setItem("urbanshade_safe_mode", "true");
          setSafeMode(true);
          handleReboot();
          break;

        case "UPDATE":
          setIsUpdating(true);
          break;

        // fakemod ig i dont like dis
        case "FAKE_BAN":
          setFakeBanData({
            reason: cmd.payload.reason || "Testing ban screen",
            duration: cmd.payload.duration,
            isFake: true,
          });
          break;

        case "FAKE_TEMP_BAN":
          setFakeTempBanData({
            reason: cmd.payload.reason || "Testing temp ban",
            duration: cmd.payload.duration || "7 days",
            expiresAt: cmd.payload.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isFake: true,
          });
          break;

        case "FAKE_WARN":
          setFakeWarnData({ reason: cmd.payload.reason || "Testing warning", isFake: true });
          toast.warning(`⚠️ WARNING: ${cmd.payload.reason || "Testing warning"}`, {
            description: "[FAKE - DEF-DEV Testing Mode]",
            duration: 8000,
          });
          break;

        case "FAKE_MUTE":
          toast.error(`🔇 MUTED: ${cmd.payload.reason || "Testing mute"}`, {
            description: `Duration: ${cmd.payload.duration || "30 minutes"} [FAKE - DEF-DEV Testing Mode]`,
            duration: 8000,
          });
          break;

        case "FAKE_KICK":
          toast.error(`👢 KICKED: ${cmd.payload.reason || "Testing kick"}`, {
            description: "[FAKE - DEF-DEV Testing Mode]",
            duration: 5000,
          });
          // Simulate kick by showing logout briefly
          setTimeout(() => {
            setLoggingOut(true);
            setTimeout(() => setLoggingOut(false), 2000);
          }, 1000);
          break;

        // Simulation triggers
        case "TIMEOUT":
          toast.error("⏱️ Operation timed out", { description: "[Simulated]" });
          break;

        case "NETWORK_FAILURE":
          toast.error("🌐 Network connection lost", { description: "[Simulated]" });
          break;

        case "STORAGE_FULL":
          toast.error("💾 Storage quota exceeded", { description: "[Simulated]" });
          break;

        case "AUTH_FAILURE":
          toast.error("🔐 Authentication failed", { description: "[Simulated]" });
          break;

        case "DB_ERROR":
          toast.error(`🗄️ ${cmd.payload.message || "Database error"}`, { description: "[Simulated]" });
          break;

        case "HANDSHAKE_REQUEST":
          // DEF-DEV is asking if we're dead but not - respond with current "yes we are dead but no"
          const currentUser = localStorage.getItem("urbanshade_current_user");
          let username = "Unknown";
          try {
            if (currentUser) {
              username = JSON.parse(currentUser).name || "Unknown";
            }
          } catch {}

          const handshakeResponse = {
            status: "online" as const,
            user: username,
            systemState: crashed ? "crashed" : lockdownMode ? "lockdown" : loggedIn ? "desktop" : "boot",
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem("urbanshade_handshake_response", JSON.stringify(handshakeResponse));
          actionDispatcher.system("Handshake response sent to DEF-DEV");
          break;
      }
    };

    // Subscribe to command queue (MAKE SURE TO LIKE)
    const unsubscribe = commandQueue.onAny(handleCommand);

    // Start polling (4 times per second)
    commandQueue.startPolling(250);

    // Also check for legacy pending crashes/bugchecks
    const pendingCrash = localStorage.getItem("urbanshade_pending_crash");
    if (pendingCrash) {
      localStorage.removeItem("urbanshade_pending_crash");
      try {
        const data = JSON.parse(pendingCrash);
        actionDispatcher.system(`Processing legacy pending crash: ${data.type}`);
        const crash = triggerCrash(data.type as CrashType, { process: data.process || "admin.exe" });
        setCrashData(crash);
        setCrashed(true);
      } catch (e) {
        console.error("Failed to parse pending crash", e);
      }
    }

    const pendingBugcheck = localStorage.getItem("urbanshade_pending_bugcheck");
    if (pendingBugcheck) {
      localStorage.removeItem("urbanshade_pending_bugcheck");
      try {
        const data = JSON.parse(pendingBugcheck);
        actionDispatcher.system(`Processing legacy pending bugcheck: ${data.code}`);
        const bugcheck = createBugcheck(data.code, data.description, "DEF-DEV Admin");
        setBugcheckData(bugcheck);
      } catch (e) {
        console.error("Failed to parse pending bugcheck", e);
      }
    }

    return () => {
      unsubscribe();
      commandQueue.stopPolling();
    };
  }, [crashed, lockdownMode, loggedIn]);

  // System Bus listeners (whatever that is lol)
  useEffect(() => {
    const unsubCrash = systemBus.on("TRIGGER_CRASH", (event) => {
      const { crashType, process } = event.payload || {};
      if (crashType) {
        const crash = triggerCrash(crashType, { process: process || "systembus.exe" });
        setCrashData(crash);
        setCrashed(true);
        setShowAdminPanel(false);
      }
    });

    const unsubBugcheck = systemBus.on("TRIGGER_BUGCHECK", (event) => {
      const { code, description } = event.payload || {};
      if (code) {
        const bugcheck = createBugcheck(code, description || "System Bus triggered bugcheck", "SystemBus");
        setBugcheckData(bugcheck);
        setShowAdminPanel(false);
      }
    });

    const unsubRecovery = systemBus.on("ENTER_RECOVERY", () => {
      setInRecoveryMode(true);
      setShowAdminPanel(false);
    });

    const unsubReboot = systemBus.on("TRIGGER_REBOOT", () => {
      handleReboot();
      setShowAdminPanel(false);
    });

    const unsubShutdown = systemBus.on("TRIGGER_SHUTDOWN", () => {
      handleShutdown();
      setShowAdminPanel(false);
    });

    const unsubDevMode = systemBus.on("OPEN_DEV_MODE", () => {
      setDevModeOpen(true);
    });

    const unsubCloseAdmin = systemBus.on("CLOSE_ADMIN_PANEL", () => {
      setShowAdminPanel(false);
    });

    return () => {
      unsubCrash();
      unsubBugcheck();
      unsubRecovery();
      unsubReboot();
      unsubShutdown();
      unsubDevMode();
      unsubCloseAdmin();
    };
  }, []);

  // Check for first time tour (now just a popup "hey docs exists")
  useEffect(() => {
    if (loggedIn && !crashed && !lockdownMode) {
      const tourCompleted = localStorage.getItem("urbanshade_tour_completed");
      if (!tourCompleted) {
        setTimeout(() => setShowTour(true), 2000);
      }
    }
  }, [loggedIn, crashed, lockdownMode]);

  const handleReboot = () => {
    setLoggedIn(false);
    setRebooting(true);
  };

  const handleRebootComplete = () => {
    setRebooting(false);
    setLoggedIn(false);
    setBlackScreen(true);
    // Set warm reboot flag to skip POST
    sessionStorage.setItem("urbanshade_warm_reboot", "true");
    // Black screen for 3 seconds
    setTimeout(() => {
      setBlackScreen(false);
      setPostComplete(true); // Skip POST on warm reboot
      setBooted(false);
    }, 3000);
  };

  const handleEnterBios = () => {
    setShowingBiosTransition(true);
    setTimeout(() => {
      setBiosComplete(false);
      setPostComplete(true); // Skip POST when entering BIOS
      setBooted(false);
      setShowingBiosTransition(false);
    }, 1500);
  };

  const handlePostComplete = () => {
    setPostComplete(true);
  };

  const handlePostEnterBios = () => {
    setPostComplete(true);
    setBiosComplete(false);
  };

  const handleInstallationComplete = (adminData: { username: string; password: string }) => {
    try {
      const fullAdminData = {
        username: adminData.username,
        password: adminData.password,
        id: "P000",
        name: `Administrator (${adminData.username})`,
        role: "System Administrator",
        clearance: 5,
        department: "Administration",
        location: "Control Room",
        status: "active",
        phone: "x1000",
        email: "admin@urbanshade.corp",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("urbanshade_admin", JSON.stringify(fullAdminData));
      setAdminSetupComplete(true);

      // Show OOBE after installation if not already complete
      if (!oobeComplete) {
        localStorage.removeItem("urbanshade_oobe_complete");
      }
    } catch (e) {
      // If setup fails, create admin with NO PASSWORD so user can still log in
      console.error("Setup failed, creating passwordless admin:", e);
      const fallbackAdmin = {
        username: "Admin",
        password: "", // No password
        id: "P000",
        name: "Administrator (Admin)",
        role: "System Administrator",
        clearance: 5,
        department: "Administration",
        location: "Control Room",
        status: "active",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("urbanshade_admin", JSON.stringify(fallbackAdmin));
      setAdminSetupComplete(true);
    }
  };

  const handleShutdownComplete = () => {
    setShuttingDown(false);
    // Cold boot - reset POST state too
    setTimeout(() => {
      setBooted(false);
      setPostComplete(false); // Show POST on next boot (cold start)
    }, 3000);
  };

  const handleLogout = () => {
    setLoggingOut(true);
  };

  const handleLogoutComplete = () => {
    setLoggingOut(false);
    setLoggedIn(false);
    setIsGuestMode(false);
    localStorage.removeItem("urbanshade_current_user");
  };

  const handleShutdown = () => {
    setLoggedIn(false);
    setShuttingDown(true);
  };

  const handleCriticalKill = (
    processName: string,
    type: "kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload" = "kernel",
  ) => {
    setKilledProcess(processName);
    setCrashType(type);
    setCustomCrashData(null);
    setCrashed(true);

    // Some crash types require recovery mode
    if (type === "corruption" || type === "virus" || Math.random() < 0.3) {
      setNeedsRecovery(true);
    }
  };

  const handleCustomCrash = (
    title: string,
    message: string,
    type: "kernel" | "virus" | "bluescreen" | "memory" | "corruption" | "overload",
  ) => {
    setCustomCrashData({ title, message });
    setKilledProcess("admin.custom");
    setCrashType(type);
    setCrashed(true);
  };

  const handleAdminCrash = (type: string) => {
    const crashTypes: any = {
      kernel: "kernel",
      bluescreen: "bluescreen",
      memory: "memory",
      corruption: "corruption",
      overload: "overload",
      virus: "virus",
    };
    handleCriticalKill("admin.panel", crashTypes[type] || "kernel");
  };

  const handleCrashReboot = () => {
    if (needsRecovery) {
      setInRecoveryMode(true);
      setCrashed(false);
    } else {
      setCrashed(false);
      setLoggedIn(false);
      setBooted(false);
      setPostComplete(false); // Show POST on cold reboot after crash
      setKilledProcess("");
      setCrashType("kernel");
      setCustomCrashData(null);
    }
  };

  const handleLockdown = (protocolName: string) => {
    setLockdownMode(true);
    setLockdownProtocol(protocolName);
  };

  const handleLockdownAuthorized = () => {
    setLockdownMode(false);
    setLockdownProtocol("");
  };

  // Mobile block is now rendered as an overlay at the end of the component

  if (!disclaimerAccepted) {
    return (
      <DisclaimerScreen
        onAccept={(skipInstall) => {
          localStorage.setItem("urbanshade_disclaimer_accepted", "true");
          setDisclaimerAccepted(true);

          if (skipInstall) {
            // Create default admin and skip installation
            const defaultAdmin = {
              username: "Admin",
              password: "admin",
              id: "P000",
              name: "Administrator (Admin)",
              role: "System Administrator",
              clearance: 5,
              department: "Administration",
              location: "Control Room",
              status: "active",
              phone: "x1000",
              email: "admin@urbanshade.corp",
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem("urbanshade_admin", JSON.stringify(defaultAdmin));
            localStorage.setItem("urbanshade_accounts", JSON.stringify([defaultAdmin]));
            localStorage.setItem("urbanshade_oobe_complete", "true");
            localStorage.setItem("urbanshade_first_boot", "true");
            localStorage.setItem("urbanshade_tour_completed", "true");
            localStorage.setItem("urbanshade_install_type", "standard");
            setOobeComplete(true);
            setAdminSetupComplete(true);
          }
        }}
      />
    );
  }

  if (!adminSetupComplete) {
    return <InstallationScreen onComplete={handleInstallationComplete} />;
  }

  // Ban check - permanent bans block ALL access (highest priority, no bypass)
  if (banCheck.isBanned && !banCheck.isLoading && !banCheck.isTempBan && !banCheck.isFakeBan) {
    return <BannedScreen reason={banCheck.reason} expiresAt={banCheck.expiresAt} isFakeBan={false} />;
  }

  // Fake ban - show scary screen then reveal
  if (banCheck.isBanned && !banCheck.isLoading && banCheck.isFakeBan) {
    return (
      <BannedScreen
        reason={banCheck.reason}
        expiresAt={banCheck.expiresAt}
        isFakeBan={true}
        onFakeBanDismiss={banCheck.refreshBanStatus}
      />
    );
  }

  // NAVI AI lockout (after ban checks)
  if (naviSecurity.isLockedOut && naviSecurity.lockoutTime) {
    return (
      <NaviLockoutScreen
        reason={naviSecurity.lockoutReason}
        lockoutTime={naviSecurity.lockoutTime}
        onUnlock={naviSecurity.clearLockout}
      />
    );
  }

  // Site lock from admin panel (Supabase-backed)
  if (siteLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-red-950 via-slate-950 to-black flex items-center justify-center">
        <div className="text-center max-w-lg p-8">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-red-400 mb-4 font-mono tracking-wider">SITE LOCKED</h1>
          <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed">{siteLockReason}</p>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-6">
            <p className="text-xs text-red-300/70 font-mono">
              An administrator has locked access to this site. Please check back later or contact support.
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            URBANSHADE SECURITY SYSTEM • ALL ACCESS RESTRICTED
          </div>
        </div>
      </div>
    );
  }

  if (lockdownMode) {
    return <LockdownScreen onAuthorized={handleLockdownAuthorized} protocolName={lockdownProtocol} />;
  }

  if (bugcheckData) {
    return (
      <BugcheckScreen
        bugcheck={bugcheckData}
        onRestart={() => {
          setBugcheckData(null);
          setBooted(false);
          setLoggedIn(false);
        }}
        onReportToDev={() => {
          setBugcheckData(null);
          window.open("/def-dev", "_blank");
        }}
        onRecovery={() => {
          setBugcheckData(null);
          setInRecoveryMode(true);
        }}
      />
    );
  }

  if (crashed) {
    return (
      <CrashScreen
        onReboot={handleCrashReboot}
        crashData={crashData || undefined}
        killedProcess={killedProcess}
        crashType={crashType}
        customData={customCrashData}
      />
    );
  }

  if (loggingOut) {
    const currentUser = localStorage.getItem("urbanshade_current_user");
    const username = currentUser ? JSON.parse(currentUser).name : "User";
    return <LogoutScreen onComplete={handleLogoutComplete} username={username} />;
  }

  if (shuttingDown) {
    return <ShutdownScreen onComplete={handleShutdownComplete} />;
  }

  if (rebooting) {
    return <RebootScreen onComplete={handleRebootComplete} />;
  }

  if (blackScreen) {
    return <div className="fixed inset-0 bg-black" />;
  }

  if (inRecoveryMode) {
    return (
      <RecoveryEnvironment
        onContinue={() => {
          setInRecoveryMode(false);
          setNeedsRecovery(false);
          setBooted(true);
          setLoggedIn(true);
        }}
        onShutdown={handleShutdown}
        onBootToBios={() => {
          setInRecoveryMode(false);
          setBiosComplete(false);
        }}
        onTerminalBoot={() => {
          sessionStorage.setItem("urbanshade_terminal_only", "true");
          setInRecoveryMode(false);
          setBooted(true);
          setLoggedIn(true);
        }}
        onSafeMode={() => {
          sessionStorage.setItem("urbanshade_safe_mode", "true");
          setSafeMode(true);
          setInRecoveryMode(false);
          setBooted(true);
          setLoggedIn(true);
        }}
        onOfflineMode={() => {
          sessionStorage.setItem("urbanshade_offline_mode", "true");
          setInRecoveryMode(false);
          setBooted(true);
          setLoggedIn(true);
        }}
      />
    );
  }

  // POST Screen (Power-On Self Test) - shows before BIOS/Boot
  if (!postComplete) {
    return <PostScreen onComplete={handlePostComplete} onEnterBios={handlePostEnterBios} />;
  }

  if (!biosComplete) {
    return <BiosScreen onExit={() => setBiosComplete(true)} />;
  }

  if (!booted) {
    return (
      <BootScreen
        onComplete={() => setBooted(true)}
        onSafeMode={() => {
          sessionStorage.setItem("urbanshade_safe_mode", "true");
          setSafeMode(true);
          setBooted(true);
        }}
      />
    );
  }

  // Skip login on first boot after installation
  const isFirstBoot = localStorage.getItem("urbanshade_first_boot") === "true";

  if (!loggedIn) {
    if (isFirstBoot) {
      // Auto-login on first boot, then clear the flag
      localStorage.removeItem("urbanshade_first_boot");
      setLoggedIn(true);
      return null;
    }
    return (
      <UserSelectionScreen
        onLogin={(guest) => {
          setIsGuestMode(guest || false);
          setLoggedIn(true);
        }}
        onShutdown={handleShutdown}
        onRestart={handleReboot}
      />
    );
  }

  // Show OOBE after first login
  if (!oobeComplete) {
    return <OOBEScreen onComplete={() => setOobeComplete(true)} />;
  }

  if (isUpdating) {
    return (
      <UpdateScreen
        onComplete={() => {
          setIsUpdating(false);
          setBooted(false);
          setLoggedIn(false);
        }}
      />
    );
  }

  if (isLocked) {
    const currentUser = localStorage.getItem("urbanshade_current_user");
    const username = currentUser ? JSON.parse(currentUser).name : "Administrator";
    return <LockScreen onUnlock={() => setIsLocked(false)} username={username} />;
  }

  // FakeMod: Show full BannedScreen when triggered from DEF-DEV
  if (fakeBanData) {
    return (
      <BannedScreen
        reason={fakeBanData.reason}
        expiresAt={null}
        isFakeBan={true}
        onFakeBanDismiss={() => setFakeBanData(null)}
      />
    );
  }

  return (
    <>
      {/* Temp ban banner at top of screen */}
      {banCheck.isBanned && banCheck.isTempBan && banCheck.tempBanDismissed && (
        <TempBanBanner expiresAt={banCheck.expiresAt} />
      )}

      <Desktop
        onLogout={handleLogout}
        onReboot={handleReboot}
        onShutdown={handleShutdown}
        onCriticalKill={handleCriticalKill}
        onLockdown={handleLockdown}
        onEnterBios={handleEnterBios}
        onUpdate={() => setIsUpdating(true)}
        onLock={() => setIsLocked(true)}
        safeMode={safeMode}
        onExitSafeMode={() => {
          sessionStorage.removeItem("urbanshade_safe_mode");
          setSafeMode(false);
          // Trigger reboot to exit safe mode
          handleReboot();
        }}
      />
      <ChangelogDialog open={showChangelog} onOpenChange={setShowChangelog} />
      {maintenanceMode && <MaintenanceMode onExit={() => setMaintenanceMode(false)} />}
      {showTour && <WelcomeModal onComplete={() => setShowTour(false)} />}
      {showAdminPanel && (
        <AdminPanel
          onExit={() => setShowAdminPanel(false)}
          onCrash={handleAdminCrash}
          onCustomCrash={handleCustomCrash}
        />
      )}
      {devModeOpen && <DevModeConsole onClose={() => setDevModeOpen(false)} />}
      <SupabaseConnectivityChecker currentRoute="main" />

      {/* VIP Welcome Dialog */}
      <VipWelcomeDialog
        open={banCheck.showVipWelcome}
        onClose={banCheck.dismissVipWelcome}
        reason={banCheck.vipReason}
      />

      {/* Real Temp ban popup (from ban check) */}
      <TempBanPopup
        open={banCheck.isBanned && banCheck.isTempBan && !banCheck.tempBanDismissed}
        onDismiss={banCheck.dismissTempBan}
        reason={banCheck.reason}
        expiresAt={banCheck.expiresAt}
      />

      {/* FakeMod: Fake Temp ban popup */}
      <TempBanPopup
        open={!!fakeTempBanData}
        onDismiss={() => setFakeTempBanData(null)}
        reason={fakeTempBanData?.reason || null}
        expiresAt={fakeTempBanData?.expiresAt ? new Date(fakeTempBanData.expiresAt) : null}
      />

      {/* Mobile block overlay - shows on top of everything on mobile devices */}
      {isMobile && <MobileBlockScreen />}
    </>
  );
};

export default Index;
