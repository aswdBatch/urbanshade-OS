import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Cloud, Rocket, Shield, Monitor, Star, ArrowRight, Info, Paintbrush, Heart, Gift, Terminal, ChevronDown, ChevronRight } from "lucide-react";
import { VERSION, getShortVersion, getBuildNumber } from "@/lib/versionInfo";

interface ChangelogDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ChangelogDialog = ({ open: controlledOpen, onOpenChange }: ChangelogDialogProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(VERSION.fullVersion);
  const [legacyExpanded, setLegacyExpanded] = useState(false);
  const currentVersion = getShortVersion();
  const currentBuild = getBuildNumber();
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  useEffect(() => {
    // Only auto-open on first visit if not controlled
    if (isControlled) return;
    
    // Compare both version string AND build number
    const lastSeenVersion = localStorage.getItem("urbanshade_last_seen_version");
    const lastSeenBuild = localStorage.getItem("urbanshade_last_seen_build");
    
    const isNewVersion = lastSeenVersion !== currentVersion;
    const isNewBuild = lastSeenBuild !== String(currentBuild);
    
    if (isNewVersion || isNewBuild) {
      // Small delay to avoid race conditions with boot screens
      const timer = setTimeout(() => {
        setInternalOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isControlled, currentVersion, currentBuild]);

  const handleClose = () => {
    localStorage.setItem("urbanshade_last_seen_version", currentVersion);
    localStorage.setItem("urbanshade_last_seen_build", String(currentBuild));
    setOpen(false);
  };

  interface ChangeItem {
    text: string;
    isHighlight?: boolean;
  }

  interface VersionData {
    icon: React.ReactNode;
    color: string;
    tagline: string;
    overview: string;
    thankyou?: string;
    sections: Record<string, ChangeItem[]>;
  }

  const changelogs: Record<string, VersionData> = {
    "3.5.0": {
      icon: <Sparkles className="w-5 h-5" />,
      color: "from-purple-500 to-indigo-600",
      tagline: "POLISHED",
      overview: "The polish update: site lock now works for real, legacy DEF-DEV monolith removed, enhanced developer console, version consistency pass, and documentation improvements.",
      sections: {
        "🔒 Site Lock (Working!)": [
          { text: "Admin site lock now persists to Supabase and blocks non-admin users", isHighlight: true },
          { text: "Locked screen shown to all visitors when site is locked" },
          { text: "Admins bypass the lock automatically" },
          { text: "Lock status synced in real-time (30s polling)" },
        ],
        "🧹 DEF-DEV Cleanup": [
          { text: "Removed legacy 1500-line DevMode.tsx monolith", isHighlight: true },
          { text: "/def-dev now exclusively uses the modular DefDevMain architecture" },
          { text: "All 17 tabs preserved in sidebar-based layout" },
        ],
        "🔧 Developer Console Enhancements": [
          { text: "Floating DEF-DEV overlay available from main OS" },
          { text: "Console, performance, and network tabs in mini mode" },
          { text: "Keyboard shortcuts for quick tab switching" },
        ],
        "📋 System Polish": [
          { text: "Version bumped to 3.5.0 across all references", isHighlight: true },
          { text: "HTML title, version index, and changelog updated" },
          { text: "Moderation panel lockdown persists to database" },
        ],
      }
    },
    "3.4.1": {
      icon: <Rocket className="w-5 h-5" />,
      color: "from-orange-500 to-red-600",
      tagline: "PATCH",
      overview: "Quick patch: Resend email integration now operational, brand new Toaster Simulator with 6 legs and explosive toast, plus a bug fix.",
      sections: {
        "📧 Resend Integration": [
          { text: "Ban appeal emails now send via Resend API", isHighlight: true },
        ],
        "🍞 Toaster Simulator": [
          { text: "New app: Toaster with 6 wiggly legs", isHighlight: true },
          { text: "Overcook your toast and the toaster EXPLODES with 80 particles" },
          { text: "Danger zone SFX when toasting at high darkness" },
          { text: "Made by a friend :D" },
        ],
        "🐛 Bug Fixes": [
          { text: "Singular bug fix" },
        ],
      }
    },
    "3.4.0": {
      icon: <Rocket className="w-5 h-5" />,
      color: "from-cyan-500 to-teal-600",
      tagline: "STOREFRONT",
      overview: "Major OS polish update: custom notification toasts, File Manager drag-and-drop, taskbar window thumbnails, App Store redesign, VPN fixes, and changelog improvements.",
      sections: {
        "🔨 Security & UI": [
          { text: "Redesigned ban screen" },
        ],
        "🏪 App Store Improvements": [
          { text: "Custom uninstall confirmation dialog replaces browser default", isHighlight: true },
          { text: "VPN now searchable by 'vpn' keyword in store" },
          { text: "VPN marked as featured app for better visibility" },
        ],
        "🔔 Custom OS Notifications": [
          { text: "New OS-styled toast notification system", isHighlight: true },
          { text: "Type-specific icons and accent colors (success, error, warning, info)" },
          { text: "Auto-dismiss with animated progress bar" },
          { text: "Action buttons and swipe-to-dismiss support" },
        ],
        "📁 File Manager Overhaul": [
          { text: "Drag-and-drop files between folders", isHighlight: true },
          { text: "Visual drop target highlighting on folders" },
          { text: "Drag opacity feedback on source files" },
        ],
        "🪟 Window Management Polish": [
          { text: "Taskbar window thumbnails on hover", isHighlight: true },
          { text: "Rich preview cards showing app name and status" },
          { text: "Active/minimized state indicators per window" },
        ],
        "🔒 VPN Layout Fix": [
          { text: "Responsive server list sidebar adapts to window size", isHighlight: true },
          { text: "Proper scrolling in server list without overflow" },
        ],
        "📋 Changelog Improvements": [
          { text: "Versions grouped by era: Current, V3.x Series, Legacy", isHighlight: true },
          { text: "Legacy versions collapsible to reduce clutter" },
          { text: "Fixed auto-open detection using build numbers" },
          { text: "View Changelog button added to Settings > System" },
        ],
      }
    },
    "3.3.1": {
      icon: <Shield className="w-5 h-5" />,
      color: "from-cyan-500 to-blue-600",
      tagline: "PANEL POLISH",
      overview: "Quality-of-life improvements to the moderation panel: enhanced user list with avatars and online status, access log filtering and export, mod logs now show the acting admin, direct NAVI messaging from user panels, and trial admin stats.",
      sections: {
        "👤 User List Enhancements": [
          { text: "User avatars with online status indicators", isHighlight: true },
          { text: "Last seen timestamps shown inline" },
          { text: "Clearance level badges displayed per user" },
        ],
        "📋 Access Log Improvements": [
          { text: "Search, filter by action type, and date range", isHighlight: true },
          { text: "Export filtered logs as JSON" },
        ],
        "🛡️ Mod & Admin Tools": [
          { text: "Mod logs now display the admin who performed each action", isHighlight: true },
          { text: "Send NAVI direct messages from user detail panel" },
          { text: "Stats tab now counts trial admins separately" },
          { text: "Online user count shown in panel header" },
        ],
      }
    },
    "3.2": {
      icon: <Shield className="w-5 h-5" />,
      color: "from-red-500 to-orange-600",
      tagline: "WHERE'S URBANSHADE OS V3.2?",
      overview: "There was a big security vulnaribility, to the point we forgot to add changelog for it. Noticed on Feb. 15, 2026. So long nerds-",
      sections: {}
    },
    "3.1": {
      icon: <Terminal className="w-5 h-5" />,
      color: "from-green-500 to-cyan-600",
      tagline: "DEF-DEV & POLISH UPDATE",
      overview: "Major DEF-DEV improvements with real moderation screen integration, massively expanded Admin tools, all Settings toggles are now fully functional, plus quality-of-life improvements with mobile detection, notification history, idle lock, and terminal enhancements.",
      sections: {
        "📱 Mobile Detection": [
          { text: "Mobile users now see a dedicated block screen", isHighlight: true },
          { text: "Docs remain accessible on mobile devices" },
          { text: "Bypass option with reminder banner for desktop experience" },
        ],
        "🔔 Notification History": [
          { text: "New Notification History app to view all past notifications", isHighlight: true },
          { text: "Search and filter by type (info, success, warning, error)" },
          { text: "Filter by date range (today, week, month)" },
        ],
        "🔒 Lock After Idle": [
          { text: "Lock screen now triggers after 5 minutes of inactivity", isHighlight: true },
          { text: "Controlled by Settings > Privacy & Security toggle" },
          { text: "Activity tracking for mouse, keyboard, and touch" },
        ],
        "🔧 FakeMod Integration": [
          { text: "FakeMod now triggers REAL screens on main OS window", isHighlight: true },
          { text: "Ban action shows the actual BannedScreen component" },
          { text: "Temp ban displays real TempBanPopup with duration countdown" },
          { text: "Warn/Mute/Kick trigger proper toast notifications" },
        ],
        "🛠️ Admin Tab Expansion": [
          { text: "System Modes: Maintenance, Safe Mode, Fake Update, Offline simulation", isHighlight: true },
          { text: "Simulation Triggers: Timeout, Network Fail, Storage Full, Auth Fail, DB Error" },
          { text: "User State: Force Logout, Force Lock, Clear Sessions, Reset Preferences" },
          { text: "Debug Tools: Re-trigger OOBE, Show Changelog, Debug Overlay, Re-Disclaimer" },
        ],
        "⚙️ All Settings Now Functional": [
          { text: "Every toggle in Settings now has real system effects", isHighlight: true },
          { text: "Wi-Fi toggle updates system network state" },
          { text: "Offline Mode disables network-dependent features" },
          { text: "Hardware Acceleration controls GPU rendering hints" },
          { text: "Transparency & Blur toggles affect all UI elements" },
          { text: "Reduce Motion respects animation preferences" },
        ],
        "⌨️ Terminal Improvements": [
          { text: "Improved tab-completion with 8 suggestions (up from 5)" },
          { text: "Theme commands now autocomplete (theme green, theme matrix, etc.)" },
          { text: "Better fuzzy matching for multi-word commands" },
        ],
        "🎨 Technical Improvements": [
          { text: "New CSS utility classes: no-blur, no-gpu, debug-overlay" },
          { text: "GPU rendering hints via transform-style preserve-3d" },
          { text: "Desktop grid system prepared for future drag-and-drop" },
          { text: "Command queue system for cross-window communication" },
        ],
      }
    },
    "3.0": {
      icon: <Rocket className="w-5 h-5" />,
      color: "from-cyan-500 to-purple-600",
      tagline: "THE YEAR UPDATE",
      overview: "The biggest update yet! App Store redesign, Task Manager overhaul, Battle Pass system, quest tracking, Containment Breach game, Kroner currency & Shop, Certificate Viewer, and so much more.",
      thankyou: "From the bottom of my heart, thank you to everyone who has supported UrbanShade OS since January 2025. What started as a small passion project has grown into something I never imagined possible. To my friends who helped test and debug countless builds, to the early adopters who dealt with broken features and random crashes, to the community members who submitted feedback and ideas — you are the reason this project exists. Special thanks to everyone who's been here since v0.1 ALPHA, through the complete Vite rewrite in v2.0, and now to this massive Year Update. Your patience, enthusiasm, and creativity inspire me every single day. Here's to another year of building cool things together! 💙🚀",
      sections: {
        "✨ Major Features": [
          { text: "App Store completely redesigned with Hero Banner, App of the Day, and Updates tab", isHighlight: true },
          { text: "Task Manager rewritten with modern UI, search, sorting, and system health metrics", isHighlight: true },
          { text: "New System Messages app for warnings, ban logs, and NAVI messages", isHighlight: true },
          { text: "Full Battle Pass system with 100 levels and seasonal rewards", isHighlight: true },
          { text: "Kroner economy - earn and spend currency on cosmetics", isHighlight: true },
          { text: "Containment Breach - FNAF-style survival horror game", isHighlight: true },
          { text: "Certificate Viewer for all earned certificates" },
          { text: "Untitled Card Game (UCG) - 21-style card game" },
        ],
        "🎨 App Store Overhaul": [
          { text: "Immersive Hero Banner carousel for featured promotions", isHighlight: true },
          { text: "App of the Day spotlight section" },
          { text: "Dedicated Updates tab with version tracking and changelogs" },
          { text: "Advanced sorting: Rating, Downloads, Size, Date, Name" },
          { text: "New Lifestyle category with gradient backgrounds" },
          { text: "Direct 'Open' button to launch apps after installation" },
        ],
        "🖥️ Interface Improvements": [
          { text: "Task Manager with mini graphs for CPU/memory usage" },
          { text: "System health overview in Task Manager" },
          { text: "Admin broadcasts now use custom toast notifications" },
          { text: "DEF-DEV Console opens correctly from Settings" },
          { text: "Documentation Hub redesign with tag-based search" },
        ],
        "🏆 Battle Pass & Economy": [
          { text: "100 levels with XP progression and passive earning" },
          { text: "Quest system with 5 rarities resetting every 6 hours" },
          { text: "Shop app to spend Kroner on themes, titles, badges" },
          { text: "Season 1: Genesis and Season 2: Phantom Protocol" },
          { text: "Daily login bonus with streak multiplier" },
        ],
        "🛠️ DEF-DEV Console": [
          { text: "17 functional tabs in sidebar layout", isHighlight: true },
          { text: "Manual handshake to connect with main OS" },
          { text: "5 new pressure-inspired themes" },
          { text: "Window animations: open, close, minimize, maximize" },
        ],
        "🎮 Games & Apps": [
          { text: "Containment Breach: 5 nights, 8 subjects, camera system" },
          { text: "UCG with bot difficulty levels and score tracking" },
          { text: "12 new Battle Pass exclusive themes" },
          { text: "10 new achievements (48 total)" },
        ],
      }
    },
    "2.9": {
      icon: <Paintbrush className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600",
      tagline: "Visual Overhaul",
      overview: "Complete redesign of Security Cameras and Facility Map apps with retro-modern CRT aesthetic. New shared UI components, radar scanner effects, and improved visual polish throughout.",
      sections: {
        "Security Cameras Redesign": [
          { text: "CRT visual effects with scanlines, noise, and vignette" },
          { text: "Chromatic aberration and phosphor glow effects" },
          { text: "Animated moving scanline across camera feed" },
          { text: "Blueprint grid overlay with corner brackets" },
          { text: "Motion detection zones with visual indicators" },
        ],
        "Facility Map Redesign": [
          { text: "Dark blueprint aesthetic with cyan grid lines" },
          { text: "Glowing room cards with status-based colors" },
          { text: "Animated dashed connection lines between rooms" },
          { text: "Radar scanner with animated sweep and blips" },
        ],
        "New Shared Components": [
          { text: "CRTEffect - Reusable CRT overlay" },
          { text: "StatusIndicator - Unified online/offline badges" },
          { text: "RadarScanner - Animated radar with entity blips" },
        ],
      }
    },
    "2.8": {
      icon: <Rocket className="w-5 h-5" />,
      color: "from-cyan-500 to-blue-600",
      tagline: "The Mass Update",
      overview: "A massive overhaul bringing real cloud messaging, admin moderation panel, contacts system, simulation triggers, and polished UI throughout.",
      sections: {
        "Cloud Messaging": [
          { text: "Real messaging system between cloud users" },
          { text: "Contacts/Favorites system" },
          { text: "Message search and templates" },
        ],
        "Admin Moderation Panel": [
          { text: "/moderation route for admin-only access" },
          { text: "Warn, temp ban, or permanent ban users" },
          { text: "FAKE BAN prank feature" },
        ],
      }
    },
    "2.7": {
      icon: <Cloud className="w-5 h-5" />,
      color: "from-blue-500 to-purple-600",
      tagline: "Cloud Sync Update",
      overview: "Introducing cloud synchronization powered by Supabase. Your settings, desktop icons, and installed apps now sync across devices.",
      sections: {
        "Online Accounts": [
          { text: "UUR submissions sync to Supabase" },
          { text: "Cloud sync indicator in Start Menu" },
        ],
        "UUR Manager Redesign": [
          { text: "Complete visual overhaul" },
          { text: "Sidebar navigation with category filters" },
        ],
      }
    },
    "2.6": {
      icon: <Shield className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600",
      tagline: "Security Update",
      overview: "The foundation for online accounts is here. Sign up with email and password, and your settings automatically sync to the cloud.",
      sections: {
        "Online Accounts": [
          { text: "Full Supabase-powered account system" },
          { text: "Automatic settings sync every 2 minutes" },
        ],
      }
    },
    "2.0": {
      icon: <Monitor className="w-5 h-5" />,
      color: "from-gray-500 to-slate-600",
      tagline: "The Vite Rewrite — August 2025",
      overview: "The foundation of modern UrbanShade. Complete rewrite from the ground up using React, TypeScript, Vite, and Tailwind CSS.",
      sections: {
        "Major Changes": [
          { text: "Complete rewrite using React and Tailwind CSS" },
          { text: "Modern component-based architecture" },
          { text: "TypeScript for better code quality" },
        ],
      }
    }
  };

  // Group versions by era
  const currentVersionKey = VERSION.fullVersion;
  const v3Versions = Object.keys(changelogs).filter(v => v.startsWith('3.') && v !== currentVersionKey);
  const legacyVersions = Object.keys(changelogs).filter(v => v.startsWith('2.'));

  const versionData = changelogs[selectedVersion];
  const isLatestVersion = selectedVersion === currentVersion;

  const renderVersionButton = (version: string, isCurrentGroup = false) => {
    const data = changelogs[version];
    const isSelected = selectedVersion === version;
    const isLatest = version === currentVersion;

    return (
      <button
        key={version}
        onClick={() => setSelectedVersion(version)}
        className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 group ${
          isSelected
            ? isCurrentGroup
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "hover:bg-muted text-foreground"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            isSelected ? "bg-primary-foreground/20" : "bg-muted"
          }`}>
            {data.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs">v{version}</span>
              {isLatest && (
                <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                  isSelected ? "bg-primary-foreground/20" : "bg-primary/20 text-primary"
                }`}>
                  NEW
                </span>
              )}
            </div>
            <p className={`text-[10px] truncate ${
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}>
              {data.tagline}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden animate-scale-in bg-background border-border/50 gap-0 flex flex-col">
        <div className="flex h-full min-h-0 flex-1">
          {/* Left Sidebar - Version List */}
          <div className="w-56 bg-muted/30 border-r border-border/50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-sm">
                  U
                </div>
                <span className="font-bold text-foreground text-sm">URBANSHADE</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Release Notes</p>
            </div>

            {/* Version List - Grouped */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Current Version */}
                <div className="mb-2">
                  <p className="text-[9px] uppercase tracking-widest text-primary font-bold px-2 py-1.5">
                    Current
                  </p>
                  {renderVersionButton(currentVersionKey, true)}
                </div>

                {/* V3.x Series */}
                {v3Versions.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold px-2 py-1.5 border-t border-border/30 mt-1 pt-2">
                      V3.x Series
                    </p>
                    {v3Versions.map(v => renderVersionButton(v))}
                  </div>
                )}

                {/* Legacy (V2.x) - Collapsible */}
                {legacyVersions.length > 0 && (
                  <div>
                    <button
                      onClick={() => setLegacyExpanded(!legacyExpanded)}
                      className="w-full flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold px-2 py-1.5 border-t border-border/30 mt-1 pt-2 hover:text-foreground transition-colors"
                    >
                      {legacyExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Legacy (V2.x)
                      <span className="ml-auto text-[8px] bg-muted px-1.5 py-0.5 rounded">
                        {legacyVersions.length}
                      </span>
                    </button>
                    {legacyExpanded && (
                      <div className="space-y-1 mt-1">
                        {legacyVersions.map(v => renderVersionButton(v))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Content - Changelog Details */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Version Header */}
            <div className={`relative px-6 py-6 bg-gradient-to-br ${versionData?.color || "from-primary to-primary/60"} overflow-hidden shrink-0`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTQgMC00IDQtNCA0czAgNCA0IDRjMiAwIDItMiAyLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    {versionData?.icon || <Sparkles className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-white">Version {selectedVersion}</h1>
                      {isLatestVersion && (
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                          <Star className="w-3 h-3" /> Latest
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm mt-0.5">{versionData?.tagline}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Changelog Content - Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-4 pb-4">
                {/* Thank You Message - Only for v3.0 */}
                {versionData?.thankyou && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-rose-400 mb-1">Thank You!</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {versionData.thankyou}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Update Overview */}
                {versionData?.overview && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Info className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-xs text-primary">Update Overview</h3>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {versionData.overview}
                    </p>
                  </div>
                )}

                {/* Change Sections */}
                {Object.entries(versionData?.sections || {}).map(([section, items], sectionIndex) => (
                  <div 
                    key={section} 
                    className="rounded-xl border border-border/50 overflow-hidden animate-fade-in bg-card/50"
                    style={{ animationDelay: `${sectionIndex * 60}ms` }}
                  >
                    <div className="px-4 py-2.5 bg-muted/50 border-b border-border/30 flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm">{section}</h3>
                      <span className="ml-auto text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">
                        {items.length}
                      </span>
                    </div>
                    <ul className="p-3 space-y-1.5">
                      {items.map((item, i) => {
                        const changeItem = typeof item === 'string' ? { text: item } : item;
                        return (
                          <li
                            key={i}
                            className={`flex items-start gap-2 text-sm animate-fade-in group ${
                              changeItem.isHighlight ? 'bg-primary/5 -mx-1 px-1 py-1 rounded-lg' : ''
                            }`}
                            style={{ animationDelay: `${(sectionIndex * 60) + (i * 30)}ms` }}
                          >
                            {changeItem.isHighlight ? (
                              <Star className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            ) : (
                              <ArrowRight className="w-3 h-3 text-muted-foreground mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            )}
                            <span className={`leading-relaxed ${
                              changeItem.isHighlight ? 'text-foreground font-medium' : 'text-foreground/80'
                            }`}>
                              {changeItem.text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Thank you for using URBANSHADE OS!
              </p>
              <Button onClick={handleClose} size="sm" className="px-6 font-bold">
                Let's Go!
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
