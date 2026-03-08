import {
  Folder, Terminal, Settings, Globe, FileText, Calculator, Music, Image, Clock, Cpu,
  PenTool, Play, Archive, Search, ExternalLink, ChevronDown, Shield, Camera, MapPin,
  BookOpen, Zap, Wind, Lock, Grid3x3, Radio, Mail, Bell, History, Package, Puzzle,
  Skull, MessageSquare, Gamepad2, Coins, Award, Dices, Timer, Cookie, HardDrive,
  Sheet, Video, Mic, Wifi, Key, ScanLine, Languages, BookOpenCheck, Globe2,
  MapPinned, Telescope, Beaker, Fingerprint, KeyRound, FileArchive, Monitor,
  Database, Activity, FileWarning, StickyNote, Palette, Volume2, CloudRain,
  Calendar, Newspaper, Download, Boxes, Users
} from "lucide-react";
import { DocLayout, DocHero, DocSection, DocAlert } from "@/components/docs";
import { useState, useMemo, useEffect, useRef } from "react";

type AppCategory = "Productivity" | "System" | "Media" | "Communication" | "Games" | "Facility" | "Security" | "Science" | "Reference";

interface AppEntry {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  category: AppCategory;
  builtin: boolean; // true = built-in, false = downloadable
  features?: string[];
  hot?: boolean;
}

const ALL_APPS: AppEntry[] = [
  // Productivity
  { id: "explorer", name: "File Explorer", icon: FileText, description: "Browse your virtual file system, navigate directories, and manage files.", category: "Productivity", builtin: true, features: ["Folder navigation", "File previews", "Search", "Context menus"] },
  { id: "notepad", name: "Notepad", icon: StickyNote, description: "Simple text editor for notes, logs, and documentation.", category: "Productivity", builtin: false, features: ["Auto-save", "Syntax highlighting", "Tabs"] },
  { id: "calculator", name: "Calculator", icon: Calculator, description: "Basic and scientific calculations.", category: "Productivity", builtin: true, features: ["Standard", "Scientific", "History"] },
  { id: "paint", name: "Paint Tool", icon: Palette, description: "Image editor for diagrams, annotations, and creative work.", category: "Productivity", builtin: false, features: ["Drawing tools", "Shapes", "Layers"] },
  { id: "spreadsheet", name: "Data Sheets", icon: Sheet, description: "Spreadsheet application for data analysis.", category: "Productivity", builtin: false },
  { id: "pdf-reader", name: "PDF Viewer", icon: FileText, description: "Read and annotate PDF documents.", category: "Productivity", builtin: false },
  { id: "file-reader", name: "File Reader", icon: FileText, description: "View file contents with syntax highlighting.", category: "Productivity", builtin: true },
  { id: "scanner", name: "Document Scanner", icon: ScanLine, description: "Scan and digitize documents.", category: "Productivity", builtin: false },
  { id: "img-editor", name: ".Img Editor", icon: FileArchive, description: "Edit disk image files.", category: "Productivity", builtin: false },

  // System
  { id: "terminal", name: "Terminal", icon: Terminal, description: "Command-line interface with 50+ commands.", category: "System", builtin: true, hot: true, features: ["Tab completion", "History", "Scripting"] },
  { id: "settings", name: "Settings", icon: Settings, description: "Configure system preferences, themes, and accounts.", category: "System", builtin: true, features: ["Personalization", "Privacy", "System"] },
  { id: "task-manager", name: "Task Manager", icon: Cpu, description: "Monitor running processes and system resources.", category: "System", builtin: true, features: ["Process list", "CPU/Memory", "Kill processes"] },
  { id: "monitor", name: "System Monitor", icon: Activity, description: "Real-time system performance monitoring.", category: "System", builtin: true },
  { id: "computer-management", name: "Computer Mgmt", icon: Monitor, description: "Advanced system management console.", category: "System", builtin: true },
  { id: "registry", name: "Registry Editor", icon: Key, description: "Direct access to system configuration values.", category: "System", builtin: false, features: ["Key browsing", "Value editing", "Search"] },
  { id: "disk-manager", name: "Disk Utility", icon: HardDrive, description: "Manage virtual disk partitions and storage.", category: "System", builtin: false },
  { id: "performance", name: "Performance Analyzer", icon: Activity, description: "Deep performance profiling and diagnostics.", category: "System", builtin: false },
  { id: "logger", name: "Action Logger", icon: Database, description: "Track all system and user actions.", category: "System", builtin: true },
  { id: "account-settings", name: "Account Settings", icon: Users, description: "Manage your online account and profile.", category: "System", builtin: true },
  { id: "crash-app", name: "System Crash", icon: Skull, description: "Deliberately trigger a system bugcheck.", category: "System", builtin: false },

  // Media
  { id: "browser", name: "Browser", icon: Globe, description: "Access the facility intranet and documentation.", category: "Media", builtin: true, features: ["Tabs", "Bookmarks", "History"] },
  { id: "music-player", name: "Media Player", icon: Volume2, description: "Listen to ambient sounds and facility audio.", category: "Media", builtin: false, features: ["Playlists", "Shuffle", "Repeat"] },
  { id: "image-viewer", name: "Photo Gallery", icon: Image, description: "View and manage images.", category: "Media", builtin: false },
  { id: "video-editor", name: "Video Editor", icon: Video, description: "Edit and compile video clips.", category: "Media", builtin: false },
  { id: "audio-editor", name: "Sound Editor", icon: Mic, description: "Audio editing and mixing.", category: "Media", builtin: false },
  { id: "audio-logs", name: "Audio Logs", icon: Music, description: "Listen to facility audio recordings.", category: "Media", builtin: false },
  { id: "clock", name: "World Clock", icon: Clock, description: "Track time across multiple zones.", category: "Media", builtin: false },
  { id: "weather", name: "Weather Monitor", icon: CloudRain, description: "Surface weather monitoring.", category: "Media", builtin: false },
  { id: "calendar", name: "Event Calendar", icon: Calendar, description: "Schedule events and set reminders.", category: "Media", builtin: false },

  // Communication
  { id: "messages", name: "Messages", icon: Mail, description: "Send and receive secure facility messages.", category: "Communication", builtin: true },
  { id: "system-messages", name: "System Messages", icon: Bell, description: "View warnings, bans, and NAVI alerts.", category: "Communication", builtin: true },
  { id: "notification-history", name: "Notification History", icon: History, description: "Browse past notification log.", category: "Communication", builtin: true },
  { id: "chat", name: "Instant Chat", icon: MessageSquare, description: "Real-time chat with other users.", category: "Communication", builtin: false },
  { id: "email-client", name: "Mail Client Pro", icon: Mail, description: "Advanced email client with folders.", category: "Communication", builtin: false },
  { id: "personnel-center", name: "Personnel Center", icon: Users, description: "View and manage personnel records.", category: "Communication", builtin: true },

  // Games
  { id: "game-center", name: "Game Hub", icon: Gamepad2, description: "Browse and launch available games.", category: "Games", builtin: false, hot: true },
  { id: "containment-game", name: "Containment Breach", icon: Skull, description: "Survive 5 nights monitoring anomalous subjects.", category: "Games", builtin: false, hot: true },
  { id: "ucg", name: "Untitled Card Game", icon: Gamepad2, description: "Play 21 (Blackjack) against the dealer.", category: "Games", builtin: false },
  { id: "dice-roller", name: "Dice Roller", icon: Dices, description: "Roll virtual dice for tabletop games.", category: "Games", builtin: false },
  { id: "reaction-test", name: "Reaction Test", icon: Timer, description: "Test your reflexes and reaction speed.", category: "Games", builtin: false },
  { id: "fortune", name: "Fortune Cookie", icon: Cookie, description: "Get a random fortune or wisdom.", category: "Games", builtin: false },
  { id: "toaster-simulator", name: "Toaster Simulator", icon: Zap, description: "The critically acclaimed toaster experience.", category: "Games", builtin: false },

  // Facility
  { id: "cameras", name: "Security Cameras", icon: Camera, description: "Monitor facility camera feeds.", category: "Facility", builtin: true },
  { id: "protocols", name: "Emergency Protocols", icon: Shield, description: "Access emergency procedure documentation.", category: "Facility", builtin: true },
  { id: "map", name: "Facility Map", icon: MapPin, description: "Interactive facility floor plan.", category: "Facility", builtin: true },
  { id: "research", name: "Research Notes", icon: BookOpen, description: "Browse classified research documents.", category: "Facility", builtin: false },
  { id: "power", name: "Power Grid", icon: Zap, description: "Monitor facility power distribution.", category: "Facility", builtin: false },
  { id: "containment", name: "Containment", icon: Lock, description: "Containment cell status monitoring.", category: "Facility", builtin: false },
  { id: "environment", name: "Environment", icon: Wind, description: "Environmental control systems.", category: "Facility", builtin: false },
  { id: "planner", name: "Facility Planner", icon: Grid3x3, description: "Design and edit facility layouts.", category: "Facility", builtin: true },
  { id: "database", name: "Specimen DB", icon: Database, description: "Browse the specimen database.", category: "Facility", builtin: true },
  { id: "incidents", name: "Incidents", icon: FileWarning, description: "View and file incident reports.", category: "Facility", builtin: true },
  { id: "signal-interceptor", name: "Signal Interceptor", icon: Radio, description: "Monitor intercepted communications.", category: "Facility", builtin: true },

  // Security
  { id: "network", name: "Network Scanner", icon: Wifi, description: "Scan and monitor network connections.", category: "Security", builtin: true },
  { id: "vpn", name: "Secure VPN", icon: Shield, description: "Encrypt your connection through VPN.", category: "Security", builtin: false },
  { id: "firewall", name: "Network Firewall", icon: Shield, description: "Manage firewall rules and filters.", category: "Security", builtin: false },
  { id: "encryption", name: "File Encryptor", icon: Lock, description: "Encrypt and decrypt files.", category: "Security", builtin: false },
  { id: "password-manager", name: "Password Vault", icon: KeyRound, description: "Secure password storage.", category: "Security", builtin: false },
  { id: "biometric", name: "Biometric Scanner", icon: Fingerprint, description: "Biometric authentication tools.", category: "Security", builtin: false },
  { id: "packet-analyzer", name: "Packet Sniffer", icon: Wifi, description: "Analyze network packet traffic.", category: "Security", builtin: false },

  // Science
  { id: "chemistry", name: "Chemistry Lab", icon: Beaker, description: "Virtual chemistry experiment tools.", category: "Science", builtin: false },
  { id: "astronomy", name: "Star Chart", icon: Telescope, description: "Map stellar objects and constellations.", category: "Science", builtin: false },

  // Reference
  { id: "translator", name: "Language Translator", icon: Languages, description: "Translate text between languages.", category: "Reference", builtin: false },
  { id: "dictionary", name: "Digital Dictionary", icon: BookOpenCheck, description: "Word definitions and synonyms.", category: "Reference", builtin: false },
  { id: "encyclopedia", name: "Encyclopedia", icon: Globe2, description: "General knowledge reference.", category: "Reference", builtin: false },
  { id: "map-viewer", name: "Map Navigator", icon: MapPinned, description: "Interactive geographical maps.", category: "Reference", builtin: false },

  // Stores
  { id: "app-store", name: "App Store", icon: Package, description: "Browse and install applications.", category: "System", builtin: true, hot: true },
  { id: "plugin-store", name: "Plugin Store", icon: Puzzle, description: "Extend the OS with plugins.", category: "System", builtin: true },
  { id: "shop", name: "Shop", icon: Coins, description: "Buy themes, titles, and cosmetics with Kroner.", category: "System", builtin: false },
  { id: "certificate-viewer", name: "Certificate Viewer", icon: Award, description: "View earned certificates and awards.", category: "System", builtin: false },
  { id: "uur-manager", name: "UUR Manager", icon: Package, description: "Manage Urbanshade Universal Repository packages.", category: "System", builtin: true },
];

const CATEGORIES: AppCategory[] = ["Productivity", "System", "Media", "Communication", "Games", "Facility", "Security", "Science", "Reference"];

const categoryMeta: Record<AppCategory, { icon: React.ElementType; color: string }> = {
  Productivity: { icon: FileText, color: "blue" },
  System: { icon: Cpu, color: "cyan" },
  Media: { icon: Play, color: "purple" },
  Communication: { icon: MessageSquare, color: "green" },
  Games: { icon: Gamepad2, color: "amber" },
  Facility: { icon: Shield, color: "red" },
  Security: { icon: Lock, color: "orange" },
  Science: { icon: Beaker, color: "emerald" },
  Reference: { icon: BookOpen, color: "indigo" },
};

const Applications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | AppCategory>("All");
  const [showDownloadable, setShowDownloadable] = useState<"all" | "builtin" | "downloadable">("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filteredApps = useMemo(() => {
    let results = ALL_APPS;
    if (activeCategory !== "All") results = results.filter(a => a.category === activeCategory);
    if (showDownloadable === "builtin") results = results.filter(a => a.builtin);
    if (showDownloadable === "downloadable") results = results.filter(a => !a.builtin);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return results;
  }, [searchQuery, activeCategory, showDownloadable]);

  const groupedApps = useMemo(() => {
    const map: Record<string, AppEntry[]> = {};
    for (const app of filteredApps) {
      if (!map[app.category]) map[app.category] = [];
      map[app.category].push(app);
    }
    return map;
  }, [filteredApps]);

  const builtinCount = ALL_APPS.filter(a => a.builtin).length;
  const downloadableCount = ALL_APPS.filter(a => !a.builtin).length;

  return (
    <DocLayout
      title="Applications"
      description="Complete catalog of all Urbanshade OS applications — productivity tools, system utilities, games, facility apps, and more."
      keywords={["apps", "applications", "file explorer", "terminal", "games", "facility", "security"]}
      accentColor="blue"
      prevPage={{ title: "Getting Started", path: "/docs/getting-started" }}
      nextPage={{ title: "Facility Apps", path: "/docs/facility" }}
    >
      <DocHero
        icon={Boxes}
        title="Application Catalog"
        subtitle={`${ALL_APPS.length} applications across ${CATEGORIES.length} categories. ${builtinCount} built-in, ${downloadableCount} downloadable from the App Store.`}
        accentColor="blue"
      />

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-mono">
          {ALL_APPS.length} Total
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-mono">
          {builtinCount} Built-in
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-mono">
          <Download className="w-3 h-3 inline mr-1" />{downloadableCount} Downloadable
        </div>
      </div>

      {/* Search & Filters */}
      <DocSection id="search">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 text-sm transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-slate-500 text-[10px] font-mono">/</kbd>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {(["all", "builtin", "downloadable"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setShowDownloadable(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  showDownloadable === type
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-slate-800/30 text-slate-500 border-slate-700/50 hover:text-slate-300"
                }`}
              >
                {type === "all" ? "All" : type === "builtin" ? "Built-in" : "Downloadable"}
              </button>
            ))}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeCategory === "All"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-slate-800/30 text-slate-500 border-slate-700/50 hover:text-slate-300"
              }`}
            >
              All ({filteredApps.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = filteredApps.filter(a => a.category === cat).length;
              if (count === 0 && activeCategory !== cat) return null;
              const meta = categoryMeta[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activeCategory === cat
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-slate-800/30 text-slate-500 border-slate-700/50 hover:text-slate-300"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </DocSection>

      {/* App Grid by Category */}
      {Object.entries(groupedApps).map(([category, apps]) => {
        const meta = categoryMeta[category as AppCategory];
        const Icon = meta.icon;
        const colorMap: Record<string, string> = {
          blue: "text-blue-400",
          cyan: "text-cyan-400",
          purple: "text-purple-400",
          green: "text-green-400",
          amber: "text-amber-400",
          red: "text-red-400",
          orange: "text-orange-400",
          emerald: "text-emerald-400",
          indigo: "text-indigo-400",
        };
        const bgMap: Record<string, string> = {
          blue: "bg-blue-500/10 border-blue-500/20",
          cyan: "bg-cyan-500/10 border-cyan-500/20",
          purple: "bg-purple-500/10 border-purple-500/20",
          green: "bg-green-500/10 border-green-500/20",
          amber: "bg-amber-500/10 border-amber-500/20",
          red: "bg-red-500/10 border-red-500/20",
          orange: "bg-orange-500/10 border-orange-500/20",
          emerald: "bg-emerald-500/10 border-emerald-500/20",
          indigo: "bg-indigo-500/10 border-indigo-500/20",
        };

        return (
          <DocSection key={category} title={category} icon={Icon} accentColor="blue" id={category.toLowerCase().replace(/ /g, '-')}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => {
                const AppIcon = app.icon;
                return (
                  <div
                    key={app.id}
                    className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${bgMap[meta.color]} border flex items-center justify-center flex-shrink-0`}>
                        <AppIcon className={`w-5 h-5 ${colorMap[meta.color]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white text-sm truncate">{app.name}</h4>
                          {app.hot && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/20 uppercase">Hot</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{app.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                            app.builtin
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          }`}>
                            {app.builtin ? "Built-in" : "Download"}
                          </span>
                          <a
                            href={`/?open=${app.id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Open
                          </a>
                        </div>
                      </div>
                    </div>
                    {app.features && (
                      <div className="flex flex-wrap gap-1 mt-3 pl-[52px]">
                        {app.features.map((f) => (
                          <span key={f} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-400">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DocSection>
        );
      })}

      {Object.keys(groupedApps).length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No apps found matching "{searchQuery}"</p>
          <button
            onClick={() => { setSearchQuery(""); setActiveCategory("All"); setShowDownloadable("all"); }}
            className="mt-3 px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      <DocAlert variant="tip" title="Installing Apps">
        Open the <code className="text-blue-400 font-mono">App Store</code> to browse and install downloadable apps. Built-in apps are always available from the Start Menu.
      </DocAlert>
    </DocLayout>
  );
};

export default Applications;
