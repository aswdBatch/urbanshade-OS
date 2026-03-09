import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const formatDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const GRID_COLS = 4;

export const StartMenu = ({ open, apps, onClose, onOpenApp, onReboot, onShutdown, onLogout }: StartMenuProps) => {
  const [search, setSearch] = useState("");
  const [rebootMenuOpen, setRebootMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const currentUserData = JSON.parse(localStorage.getItem("urbanshade_current_user") || "{}");
  const userName = currentUserData.name || currentUserData.username || "User";
  const firstName = userName.split(" ")[0];
  const userRole = currentUserData.role || "User";
  const profileIconName = localStorage.getItem("urbanshade_profile_icon") || "User";
  const profileColor = localStorage.getItem("urbanshade_profile_color") || "#00d4ff";
  const ProfileIcon = (icons as any)[profileIconName] || icons.User;

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

  // Flat list of all apps in display order for keyboard navigation
  const flatApps = useMemo(() => {
    return Object.values(groupedApps).flat();
  }, [groupedApps]);

  const filteredApps = useMemo(() => {
    if (!search) return [];
    return apps.filter(app =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.searchAliases?.some(a => a.toLowerCase().includes(search.toLowerCase()))
    );
  }, [apps, search]);

  const isSearching = search.length > 0;
  const navApps = isSearching ? filteredApps : flatApps;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  const handleOpenApp = useCallback((app: App) => {
    onOpenApp(app);
    handleClose();
  }, [onOpenApp, handleClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const count = navApps.length;
      if (count === 0 && e.key !== "Escape") return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex(prev => {
            if (isSearching) return Math.min(prev + 1, count - 1);
            return Math.min(prev + GRID_COLS, count - 1);
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex(prev => {
            if (isSearching) return Math.max(prev - 1, 0);
            return Math.max(prev - GRID_COLS, 0);
          });
          break;
        case "ArrowRight":
          if (!isSearching) {
            e.preventDefault();
            setFocusedIndex(prev => Math.min(prev + 1, count - 1));
          }
          break;
        case "ArrowLeft":
          if (!isSearching) {
            e.preventDefault();
            setFocusedIndex(prev => Math.max(prev - 1, 0));
          }
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < count) {
            handleOpenApp(navApps[focusedIndex]);
          }
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, navApps, focusedIndex, isSearching, handleClose, handleOpenApp]);

  // Reset focus when search changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [search]);

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
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setIsClosing(false);
      setFocusedIndex(-1);
    }
  }, [open]);

  if (!open && !isClosing) return null;

  // Calculate global index for a tile given its letter group and position
  let globalIndexCounter = 0;
  const getGlobalIndex = () => globalIndexCounter++;

  return (
    <div
      ref={menuRef}
      className={`fixed left-4 top-[56px] w-[520px] rounded-xl bg-background/95 backdrop-blur-2xl border border-border/40 z-[9999] shadow-2xl overflow-hidden ${isClosing ? 'animate-start-menu-out' : 'animate-start-menu-in'}`}
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

      {/* Greeting */}
      {!isSearching && (
        <div className="px-5 pb-3 animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground">{getGreeting()}, {firstName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate()}</p>
        </div>
      )}

      {/* Main Content */}
      {isSearching ? (
        <ScrollArea className="h-[360px] px-4 pb-2">
          <div className="space-y-1">
            {filteredApps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
            )}
            {filteredApps.map((app, i) => (
              <button
                key={app.id}
                onClick={() => handleOpenApp(app)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-all text-left group active:scale-[0.98] animate-stagger-in ${focusedIndex === i ? 'bg-muted/60 ring-2 ring-primary/40' : ''}`}
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
        <ScrollArea className="h-[360px] border-t border-border/20">
          <div className="px-3 pb-3 pt-1">
            {Object.entries(groupedApps).map(([letter, letterApps], groupIdx) => (
              <div key={letter}>
                <div
                  className="px-1 py-1.5 sticky top-0 bg-background/90 backdrop-blur-sm z-10 animate-fade-in"
                  style={{ animationDelay: `${groupIdx * 30}ms` }}
                >
                  <span className="text-[11px] font-bold text-primary/80">{letter}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {letterApps.map((app) => {
                    const idx = getGlobalIndex();
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleOpenApp(app)}
                        onMouseEnter={() => setFocusedIndex(idx)}
                        className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-150 group active:scale-[0.93] hover:scale-[1.03] animate-stagger-in ${
                          focusedIndex === idx
                            ? 'bg-muted/60 ring-2 ring-primary/40 scale-[1.03]'
                            : 'hover:bg-muted/50 hover:shadow-[0_0_12px_hsl(var(--primary)/0.08)]'
                        }`}
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 shrink-0 [&>svg]:w-5 [&>svg]:h-5 text-primary ${
                          focusedIndex === idx ? 'bg-primary/25' : 'bg-primary/10 group-hover:bg-primary/20'
                        }`}>
                          {app.icon}
                        </div>
                        <span className="text-[11px] font-medium text-foreground/70 group-hover:text-foreground text-center leading-tight line-clamp-2 w-full transition-colors">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="border-t border-border/30 px-3 py-2.5 bg-muted/20 flex items-center justify-between">
        <button 
          onClick={() => {
            navigate("/acc-manage");
            handleClose();
          }}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-all active:scale-95"
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
            className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-all group active:scale-90"
            title="Shut down"
          >
            <Power className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          
          <Popover open={rebootMenuOpen} onOpenChange={setRebootMenuOpen}>
            <PopoverTrigger asChild>
              <button 
                className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-all group active:scale-90"
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-all text-left group active:scale-95"
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
            className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-all group active:scale-90"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
