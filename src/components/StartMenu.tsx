import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "@/types/window";
import { 
  LogOut, RotateCcw, Power, Shield, HardDrive, Clock, X, 
  Search, Settings, Grid3X3, ChevronRight, User, Zap
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useRecentFiles, RecentFile } from "@/hooks/useRecentFiles";
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
  const [showAllApps, setShowAllApps] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { recentFiles, addRecent, clearRecent } = useRecentFiles();
  const navigate = useNavigate();

  // Get current user data
  const currentUserData = JSON.parse(localStorage.getItem("urbanshade_current_user") || "{}");
  const userName = currentUserData.name || currentUserData.username || "User";
  const userRole = currentUserData.role || "User";
  
  // Get profile icon
  const profileIconName = localStorage.getItem("urbanshade_profile_icon") || "User";
  const profileColor = localStorage.getItem("urbanshade_profile_color") || "#00d4ff";
  const ProfileIcon = (icons as any)[profileIconName] || icons.User;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const startBtn = document.querySelector('[data-start-button]');
        if (startBtn && !startBtn.contains(e.target as Node)) {
          onClose();
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
      setShowAllApps(false);
    }
  }, [open]);

  if (!open) return null;

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedApps = apps.slice(0, 12);
  const displayApps = showAllApps || search ? filteredApps : pinnedApps;

  const handleOpenApp = (app: App) => {
    addRecent({ name: app.name, type: "app", appId: app.id });
    onOpenApp(app);
    onClose();
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

  return (
    <div
      ref={menuRef}
      className="fixed left-4 top-[56px] w-[580px] rounded-xl bg-background/95 backdrop-blur-2xl border border-border/40 z-[9999] shadow-2xl overflow-hidden animate-start-menu-in"
    >
      {/* Search Header */}
      <div className="p-5 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Type to search apps, settings, or files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-primary" />
            {search ? "Search Results" : showAllApps ? "All Apps" : "Pinned"}
          </h3>
          {!search && (
            <button 
              onClick={() => setShowAllApps(!showAllApps)}
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              {showAllApps ? "Show less" : "All apps"}
              <ChevronRight className={`w-3 h-3 transition-transform ${showAllApps ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        
        {/* Apps Grid */}
        <ScrollArea className={showAllApps || search ? "h-[280px]" : "h-auto"}>
          <div className="grid grid-cols-6 gap-2 pb-4">
            {displayApps.map((app, index) => (
              <button
                key={app.id}
                onClick={() => handleOpenApp(app)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/60 transition-all group active:scale-95 animate-stagger-in"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="w-10 h-10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                  {app.icon}
                </div>
                <span className="text-[11px] text-center text-foreground/80 leading-tight line-clamp-2 group-hover:text-foreground">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Recommended / Recent Section */}
        {!search && recentFiles.length > 0 && (
          <div className="border-t border-border/30 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recommended
              </h3>
              <button onClick={clearRecent} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recentFiles.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.appId) {
                      const app = apps.find(a => a.id === item.appId);
                      if (app) handleOpenApp(app);
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {getRecentIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRecentTime(item.timestamp)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/30 p-3 bg-muted/20 flex items-center justify-between">
        <button 
          onClick={() => {
            navigate("/acc-manage");
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 transition-all"
        >
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${profileColor}15` }}
          >
            <ProfileIcon className="w-5 h-5" style={{ color: profileColor }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">{userName}</div>
            <div className="text-[10px] text-muted-foreground">{userRole}</div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              onShutdown();
              onClose();
            }}
            className="w-10 h-10 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-all group"
            title="Shut down"
          >
            <Power className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          
          <Popover open={rebootMenuOpen} onOpenChange={setRebootMenuOpen}>
            <PopoverTrigger asChild>
              <button 
                className="w-10 h-10 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-all group"
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
                  { icon: RotateCcw, label: "Restart", desc: "Standard reboot", action: () => { onReboot(); onClose(); setRebootMenuOpen(false); } },
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
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-10 h-10 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-all group"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};