import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "@/types/window";
import { 
  LogOut, RotateCcw, Power, Shield, HardDrive, X, Search
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import * as icons from "lucide-react";

interface StartMenuProps {
  open: boolean;
  apps: App[];
  onClose: () => void;
  onOpenApp: (app: App) => void;
  onReboot: () => void;
  onShutdown: () => void;
  onLogout: () => void;
}

export const StartMenu = ({ open, apps, onClose, onOpenApp, onReboot, onShutdown, onLogout }: StartMenuProps) => {
  const [search, setSearch] = useState("");
  const [rebootMenuOpen, setRebootMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // User data
  const currentUserData = JSON.parse(localStorage.getItem("urbanshade_current_user") || "{}");
  const userName = currentUserData.name || currentUserData.username || "User";
  const userRole = currentUserData.role || "User";
  const profileIconName = localStorage.getItem("urbanshade_profile_icon") || "User";
  const profileColor = localStorage.getItem("urbanshade_profile_color") || "#00d4ff";
  const ProfileIcon = (icons as any)[profileIconName] || icons.User;

  // Grouped apps for right panel (alphabetical)
  const groupedApps = useMemo(() => {
    const sorted = [...apps].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, App[]> = {};
    sorted.forEach(app => {
      const letter = app.name[0]?.toUpperCase() || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(app);
    });
    return groups;
  }, [apps]);

  // Search filtering
  const filteredApps = useMemo(() => {
    if (!search) return [];
    return apps.filter(app =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.searchAliases?.some(a => a.toLowerCase().includes(search.toLowerCase()))
    );
  }, [apps, search]);

  const pinnedApps = apps.slice(0, 9);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const startBtn = document.querySelector('[data-start-button]');
        if (startBtn && !startBtn.contains(e.target as Node)) {
          handleClose();
        }
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setIsClosing(false);
    }
  }, [open]);

  if (!open && !isClosing) return null;

  const handleOpenApp = (app: App) => {
    addRecent({ name: app.name, type: "app", appId: app.id });
    onOpenApp(app);
    handleClose();
  };

  const getRecentIcon = (item: RecentFile) => {
    if (item.type === "app") {
      const app = apps.find(a => a.id === item.appId);
      return app?.icon || <Zap className="w-4 h-4" />;
    }
    return <Zap className="w-4 h-4" />;
  };

  const formatRecentTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const isSearching = search.length > 0;

  return (
    <div
      ref={menuRef}
      className={`fixed left-4 top-[56px] w-[640px] rounded-xl bg-background/95 backdrop-blur-2xl border border-border/40 z-[9999] shadow-2xl overflow-hidden ${isClosing ? 'animate-start-menu-out' : 'animate-start-menu-in'}`}
    >
      {/* Search */}
      <div className="p-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search apps, settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isSearching ? (
        /* Search Results */
        <ScrollArea className="h-[360px] px-4 pb-2">
          <div className="space-y-1">
            {filteredApps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
            )}
            {filteredApps.map((app, i) => (
              <button
                key={app.id}
                onClick={() => handleOpenApp(app)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-all text-left group active:scale-[0.98] animate-stagger-in"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <div className="w-8 h-8 flex items-center justify-center text-primary shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                  {app.icon}
                </div>
                <span className="text-sm text-foreground group-hover:text-foreground">{app.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        /* Two-Panel Layout */
        <div className="flex h-[360px] border-t border-border/20">
          {/* Left Panel: Pinned + Recommended */}
          <div className="w-[300px] border-r border-border/20 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 pt-3">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">{getGreeting()}, {userName.split(' ')[0]} 👋</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {pinnedApps.map((app, i) => (
                    <button
                      key={app.id}
                      onClick={() => handleOpenApp(app)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/60 transition-all group active:scale-95 animate-stagger-in"
                      style={{ animationDelay: `${i * 15}ms` }}
                    >
                      <div className="w-12 h-12 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200 [&>svg]:w-7 [&>svg]:h-7">
                        {app.icon}
                      </div>
                      <span className="text-[11px] text-center text-foreground/80 leading-tight line-clamp-2 group-hover:text-foreground">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Recommended / Recent */}
                {recentFiles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Recommended
                      </h3>
                      <button onClick={clearRecent} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        Clear
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentFiles.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.appId) {
                              const app = apps.find(a => a.id === item.appId);
                              if (app) handleOpenApp(app);
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-all text-left"
                        >
                          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
                            {getRecentIcon(item)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatRecentTime(item.timestamp)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: All Apps A-Z */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 pt-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Apps</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-2 pb-2">
                {Object.entries(groupedApps).map(([letter, letterApps]) => (
                  <div key={letter}>
                    <div className="px-2 py-1.5 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                      <span className="text-[11px] font-bold text-primary/80">{letter}</span>
                    </div>
                    {letterApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => handleOpenApp(app)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg hover:bg-muted/50 transition-all text-left group active:scale-[0.98]"
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-foreground/60 group-hover:text-primary shrink-0 [&>svg]:w-4 [&>svg]:h-4 transition-colors">
                          {app.icon}
                        </div>
                        <span className="text-[13px] text-foreground/80 group-hover:text-foreground truncate transition-colors">
                          {app.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/30 px-3 py-2.5 bg-muted/20 flex items-center justify-between">
        <button 
          onClick={() => {
            navigate("/acc-manage");
            handleClose();
          }}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-all"
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${profileColor}15` }}
          >
            <ProfileIcon className="w-4 h-4" style={{ color: profileColor }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground leading-tight">{userName}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{userRole}</div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => { onShutdown(); handleClose(); }}
            className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-all group"
            title="Shut down"
          >
            <Power className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          
          <Popover open={rebootMenuOpen} onOpenChange={setRebootMenuOpen}>
            <PopoverTrigger asChild>
              <button 
                className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-all group"
                title="Restart options"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="end"
              className="w-52 p-2 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl"
            >
              <div className="space-y-1">
                {[
                  { icon: RotateCcw, label: "Restart", desc: "Standard reboot", action: () => { onReboot(); handleClose(); setRebootMenuOpen(false); } },
                  { icon: Shield, label: "Restart to BIOS", desc: "Enter system setup", action: () => setRebootMenuOpen(false) },
                  { icon: HardDrive, label: "Restart to Recovery", desc: "Advanced options", action: () => setRebootMenuOpen(false) },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all text-left group"
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <button 
            onClick={() => { onLogout(); handleClose(); }}
            className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-all group"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
