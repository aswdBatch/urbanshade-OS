import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Download, Check, Search, Package, Star, ChevronLeft,
  Sparkles, Shield, Gamepad2, Wrench, Cpu, Globe, Camera, Music,
  MessageSquare, BookOpen, Trash2, RefreshCw, HardDrive, Eye,
  Loader2, Heart, TrendingUp, Clock, ArrowUpDown,
  Play, Zap, Award, Crown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppReview {
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface StoreApp {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  size: string;
  rating: number;
  downloads: string;
  featured?: boolean;
  new?: boolean;
  reviews?: AppReview[];
  permissions?: string[];
  lastUpdate?: string;
  developer?: string;
  gradient?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Package; label: string; color: string; gradient: string }> = {
  Productivity: { icon: BookOpen, label: "Productivity", color: "text-blue-400", gradient: "from-blue-500/20 to-blue-600/5" },
  Graphics: { icon: Camera, label: "Graphics", color: "text-pink-400", gradient: "from-pink-500/20 to-pink-600/5" },
  Entertainment: { icon: Music, label: "Entertainment", color: "text-purple-400", gradient: "from-purple-500/20 to-purple-600/5" },
  Utilities: { icon: Wrench, label: "Utilities", color: "text-amber-400", gradient: "from-amber-500/20 to-amber-600/5" },
  Security: { icon: Shield, label: "Security", color: "text-green-400", gradient: "from-green-500/20 to-green-600/5" },
  Communication: { icon: MessageSquare, label: "Communication", color: "text-cyan-400", gradient: "from-cyan-500/20 to-cyan-600/5" },
  Network: { icon: Globe, label: "Network", color: "text-indigo-400", gradient: "from-indigo-500/20 to-indigo-600/5" },
  System: { icon: Cpu, label: "System", color: "text-orange-400", gradient: "from-orange-500/20 to-orange-600/5" },
  Games: { icon: Gamepad2, label: "Games", color: "text-red-400", gradient: "from-red-500/20 to-red-600/5" },
  Lifestyle: { icon: Heart, label: "Lifestyle", color: "text-rose-400", gradient: "from-rose-500/20 to-rose-600/5" },
};

const generateReviews = (_appName: string): AppReview[] => {
  const reviewers = ['Operator_X', 'FacilityTech', 'DeepSea_Admin', 'NightShift42', 'ContainmentLead'];
  const comments = [
    'Essential for facility operations. Runs flawlessly.',
    'Great tool, saved my shift multiple times.',
    'Reliable and fast. Exactly what we needed.',
    'Top-tier software. Highly recommended.',
    'Works well even during containment breaches.',
  ];
  
  return reviewers.slice(0, 3).map((user, i) => ({
    user,
    rating: 3 + Math.floor(Math.random() * 3),
    comment: comments[i % comments.length],
    date: `${Math.floor(Math.random() * 30) + 1} days ago`,
  }));
};

const AVAILABLE_APPS: StoreApp[] = [
  { id: "notepad", name: "Notepad", category: "Productivity", description: "Minimal text editor for quick notes and logs", version: "2.1.0", size: "1.2 MB", rating: 4.5, downloads: "12.5K", featured: true, permissions: ['File Access'], lastUpdate: '2024-01-15', developer: "UrbanShade Core" },
  { id: "paint", name: "Paint Tool", category: "Graphics", description: "Image editing and annotation suite", version: "3.0.1", size: "2.8 MB", rating: 4.2, downloads: "8.3K", new: true, permissions: ['File Access', 'Graphics'], lastUpdate: '2024-01-20', developer: "UrbanShade Graphics" },
  { id: "music-player", name: "Media Player", category: "Entertainment", description: "Audio and video playback system", version: "5.2.0", size: "8.4 MB", rating: 4.7, downloads: "25.1K", featured: true, permissions: ['Audio', 'File Access'], lastUpdate: '2024-01-18', developer: "UrbanShade Media" },
  { id: "weather", name: "Weather Station", category: "Utilities", description: "Environmental monitoring and forecasts", version: "1.8.3", size: "3.1 MB", rating: 4.3, downloads: "15.2K", permissions: ['Network'], lastUpdate: '2024-01-10', developer: "UrbanShade Utilities" },
  { id: "clock", name: "World Clock", category: "Utilities", description: "Multi-timezone chronometer", version: "2.5.0", size: "1.5 MB", rating: 4.4, downloads: "9.8K", permissions: ['Notifications'], lastUpdate: '2024-01-12', developer: "UrbanShade Utilities" },
  { id: "calendar", name: "Event Calendar", category: "Productivity", description: "Scheduling and event management", version: "4.1.2", size: "4.7 MB", rating: 4.6, downloads: "18.4K", featured: true, permissions: ['Notifications', 'File Access'], lastUpdate: '2024-01-08', developer: "UrbanShade Core" },
  { id: "notes", name: "Advanced Notes", category: "Productivity", description: "Rich text documentation system", version: "3.3.0", size: "5.2 MB", rating: 4.8, downloads: "22.7K", new: true, permissions: ['File Access', 'Encryption'], lastUpdate: '2024-01-22', developer: "UrbanShade Core" },
  { id: "vpn", name: "Secure Tunnel", category: "Security", description: "VPN encrypted network tunneling and secure proxy", version: "2.0.4", size: "6.3 MB", rating: 4.5, downloads: "31.2K", featured: true, permissions: ['Network', 'System'], lastUpdate: '2024-01-05', developer: "UrbanShade Security" },
  { id: "firewall", name: "Packet Shield", category: "Security", description: "Network traffic filtering and monitoring", version: "7.1.0", size: "12.5 MB", rating: 4.7, downloads: "28.9K", featured: true, permissions: ['Network', 'System', 'Admin'], lastUpdate: '2024-01-03', developer: "UrbanShade Security" },
  { id: "pdf-reader", name: "Document Viewer", category: "Productivity", description: "PDF reading and annotation", version: "6.1.0", size: "8.7 MB", rating: 4.5, downloads: "20.8K", permissions: ['File Access'], lastUpdate: '2024-01-09', developer: "UrbanShade Core" },
  { id: "spreadsheet", name: "Data Sheets", category: "Productivity", description: "Spreadsheet editor for data analysis", version: "5.3.1", size: "15.2 MB", rating: 4.7, downloads: "16.4K", new: true, permissions: ['File Access'], lastUpdate: '2024-01-21', developer: "UrbanShade Core" },
  { id: "chat", name: "Facility Chat", category: "Communication", description: "Secure inter-facility messaging", version: "7.4.2", size: "9.8 MB", rating: 4.7, downloads: "35.2K", permissions: ['Network', 'Notifications'], lastUpdate: '2024-01-16', developer: "UrbanShade Comms" },
  { id: "disk-manager", name: "Disk Utility", category: "System", description: "Storage analysis and management", version: "6.0.1", size: "8.9 MB", rating: 4.5, downloads: "10.1K", permissions: ['System', 'Admin'], lastUpdate: '2024-01-06', developer: "UrbanShade System" },
  { id: "game-center", name: "Game Hub", category: "Games", description: "Collection of facility-approved games", version: "2.0.0", size: "34.2 MB", rating: 4.5, downloads: "42.8K", new: true, permissions: ['Graphics', 'Audio'], lastUpdate: '2024-01-23', developer: "UrbanShade Entertainment" },
  { id: "containment-game", name: "Containment Breach", category: "Games", description: "Survive the night shift monitoring escaped anomalies. Use cameras, doors, and lures to prevent containment breaches until 6AM.", version: "1.0.0", size: "18.7 MB", rating: 4.9, downloads: "67.2K", featured: true, new: true, permissions: ['Graphics', 'Audio', 'Notifications'], lastUpdate: '2024-01-24', developer: "UrbanShade Games" },
  { id: "ucg", name: "Untitled Card Game", category: "Games", description: "A 21-style card game. Get as close to 21 as you can without going bust!", version: "1.0.0", size: "12.4 MB", rating: 4.6, downloads: "23.5K", new: true, permissions: ['Graphics', 'Audio'], lastUpdate: '2024-01-25', developer: "UrbanShade Games" },
  { id: "dice-roller", name: "Dice Roller", category: "Games", description: "Virtual dice for tabletop simulations. Supports d4 to d100.", version: "1.0.0", size: "0.8 MB", rating: 4.7, downloads: "18.2K", new: true, permissions: [], lastUpdate: '2026-01-13', developer: "UrbanShade Games" },
  { id: "reaction-test", name: "Reflex Protocol", category: "Games", description: "Test your reaction speed. Track your best times and compete.", version: "1.0.0", size: "0.5 MB", rating: 4.8, downloads: "31.4K", featured: true, new: true, permissions: [], lastUpdate: '2026-01-13', developer: "UrbanShade Training" },
  { id: "fortune", name: "Fortune Terminal", category: "Entertainment", description: "Receive mysterious fortunes and cryptic messages from the facility.", version: "1.0.0", size: "0.3 MB", rating: 4.5, downloads: "24.7K", new: true, permissions: [], lastUpdate: '2026-01-13', developer: "UrbanShade Misc" },
  { id: "shop", name: "Kroner Exchange", category: "Lifestyle", description: "Spend Kroner on themes, titles, badges, and profile effects.", version: "1.0.0", size: "2.1 MB", rating: 4.9, downloads: "89.3K", featured: true, new: true, permissions: ['Network'], lastUpdate: '2026-01-13', developer: "UrbanShade Economy" },
  { id: "certificate-viewer", name: "Certificate Archive", category: "Lifestyle", description: "View earned certificates from Battle Pass and achievements.", version: "1.0.0", size: "1.8 MB", rating: 4.8, downloads: "45.2K", new: true, permissions: [], lastUpdate: '2026-01-13', developer: "UrbanShade Rewards" },
  { id: "inventory", name: "Personal Inventory", category: "Lifestyle", description: "Manage collected items, titles, badges, and equipped gear.", version: "1.0.0", size: "1.5 MB", rating: 4.9, downloads: "78.6K", featured: true, new: true, permissions: ['Network'], lastUpdate: '2026-01-14', developer: "UrbanShade Profile" },
  { id: "toaster-simulator", name: "Toaster Simulator", category: "Entertainment", description: "Insert bread, adjust darkness, and make the perfect toast. Don't burn it!", version: "1.0.0", size: "0.4 MB", rating: 4.8, downloads: "14.7K", new: true, permissions: [], lastUpdate: '2026-02-17', developer: "UrbanShade Fun" },
].map(app => ({ ...app, reviews: generateReviews(app.name) }));

// Hero banner data
const HERO_PROMOTIONS = [
  {
    id: "containment-game",
    title: "Containment Breach",
    subtitle: "Can you survive until 6AM?",
    badge: "FEATURED GAME",
    gradient: "from-red-900/80 via-red-800/60 to-background",
    accentColor: "text-red-400",
  },
  {
    id: "shop",
    title: "Kroner Exchange",
    subtitle: "New items available. Spend your hard-earned Kroner.",
    badge: "SHOP UPDATE",
    gradient: "from-amber-900/80 via-amber-800/60 to-background",
    accentColor: "text-amber-400",
  },
  {
    id: "firewall",
    title: "Packet Shield",
    subtitle: "Military-grade network protection for your system.",
    badge: "SECURITY ESSENTIAL",
    gradient: "from-green-900/80 via-green-800/60 to-background",
    accentColor: "text-green-400",
  },
];

interface DownloadState {
  appId: string;
  progress: number;
  status: 'downloading' | 'installing' | 'complete';
}

type SortOption = 'popular' | 'rating' | 'newest' | 'name' | 'size';

export const AppStore = ({ onInstall }: { onInstall?: (appId: string) => void }) => {
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<StoreApp | null>(null);
  const [downloads, setDownloads] = useState<DownloadState[]>([]);
  const [activeTab, setActiveTab] = useState("browse");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const installed = localStorage.getItem("urbanshade_installed_apps");
    if (installed) setInstalledApps(JSON.parse(installed));
  }, []);

  // Auto-rotate hero banner
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_PROMOTIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const parseDownloads = (dl: string): number => {
    const num = parseFloat(dl.replace('K', ''));
    return dl.includes('K') ? num * 1000 : num;
  };

  const parseSize = (size: string): number => {
    const num = parseFloat(size);
    if (size.includes('GB')) return num * 1024;
    return num;
  };

  const sortedAndFilteredApps = useMemo(() => {
    let apps = AVAILABLE_APPS.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || 
                           app.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || app.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case 'popular':
        apps.sort((a, b) => parseDownloads(b.downloads) - parseDownloads(a.downloads));
        break;
      case 'rating':
        apps.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        apps.sort((a, b) => new Date(b.lastUpdate || 0).getTime() - new Date(a.lastUpdate || 0).getTime());
        break;
      case 'name':
        apps.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'size':
        apps.sort((a, b) => parseSize(a.size) - parseSize(b.size));
        break;
    }

    return apps;
  }, [search, selectedCategory, sortBy]);

  // Get app of the day (deterministic based on date)
  const appOfTheDay = useMemo(() => {
    const today = new Date();
    const dayIndex = (today.getDate() + today.getMonth()) % AVAILABLE_APPS.length;
    return AVAILABLE_APPS[dayIndex];
  }, []);

  // Get apps with updates (mock - apps where installed version is "outdated")
  const appsWithUpdates = useMemo(() => {
    return AVAILABLE_APPS.filter(app => 
      installedApps.includes(app.id) && app.new
    );
  }, [installedApps]);

  const handleInstall = useCallback((app: StoreApp) => {
    if (installedApps.includes(app.id)) {
      toast.info(`${app.name} is already installed`);
      return;
    }

    setDownloads(prev => [...prev, { appId: app.id, progress: 0, status: 'downloading' }]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setDownloads(prev => prev.map(d => 
          d.appId === app.id ? { ...d, progress: 100, status: 'installing' } : d
        ));

        setTimeout(() => {
          setDownloads(prev => prev.map(d => 
            d.appId === app.id ? { ...d, status: 'complete' } : d
          ));

          const currentInstalled = JSON.parse(localStorage.getItem('urbanshade_installed_apps') || '[]');
          if (!currentInstalled.includes(app.id)) {
            currentInstalled.push(app.id);
            localStorage.setItem('urbanshade_installed_apps', JSON.stringify(currentInstalled));
            setInstalledApps(currentInstalled);
          }

          toast.success(`${app.name} installed successfully!`);
          onInstall?.(app.id);
          window.dispatchEvent(new Event('storage'));

          setTimeout(() => {
            setDownloads(prev => prev.filter(d => d.appId !== app.id));
          }, 2000);
        }, 800);
      } else {
        setDownloads(prev => prev.map(d => 
          d.appId === app.id ? { ...d, progress } : d
        ));
      }
    }, 150);
  }, [onInstall, installedApps]);

  const [uninstallTarget, setUninstallTarget] = useState<{ id: string; name: string } | null>(null);

  const handleUninstall = (appId: string, appName: string) => {
    setUninstallTarget({ id: appId, name: appName });
  };

  const confirmUninstall = () => {
    if (!uninstallTarget) return;
    const newInstalled = installedApps.filter(id => id !== uninstallTarget.id);
    setInstalledApps(newInstalled);
    localStorage.setItem("urbanshade_installed_apps", JSON.stringify(newInstalled));
    toast.success(`${uninstallTarget.name} uninstalled!`);
    window.dispatchEvent(new Event('storage'));
    setUninstallTarget(null);
  };

  const handleOpenApp = (appId: string) => {
    window.dispatchEvent(new CustomEvent('open-app', { detail: { appId } }));
  };

  const isInstalled = (appId: string) => installedApps.includes(appId);
  const isDownloading = (appId: string) => downloads.some(d => d.appId === appId);
  const getDownloadState = (appId: string) => downloads.find(d => d.appId === appId);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star}
          className={cn(
            "w-3 h-3",
            star <= Math.floor(rating) 
              ? "fill-amber-400 text-amber-400" 
              : star - 0.5 <= rating 
                ? "fill-amber-400/50 text-amber-400" 
                : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  // App Detail View
  if (selectedApp) {
    const app = selectedApp;
    const config = CATEGORY_CONFIG[app.category];
    const AppIcon = config?.icon || Package;
    const dlState = getDownloadState(app.id);
    
    return (
      <>
      <div className="flex flex-col h-full bg-background">
        <div className={cn(
          "shrink-0 border-b border-border",
          "bg-gradient-to-br",
          config?.gradient || "from-cyan-500/20 to-background"
        )}>
          <div className="flex items-center gap-2 p-3 bg-background/50 backdrop-blur-sm">
            <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium flex-1 truncate">{app.name}</span>
            {app.developer && (
              <span className="text-xs text-muted-foreground">{app.developer}</span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* App Header */}
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-4 rounded-2xl shrink-0 border",
                "bg-gradient-to-br",
                config?.gradient || "from-muted to-muted/50",
                "border-border"
              )}>
                <AppIcon className={cn("w-10 h-10", config?.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{app.name}</h1>
                <p className="text-sm text-muted-foreground">{app.category} • {app.developer}</p>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(app.rating)}
                  <span className="text-sm font-medium">{app.rating}</span>
                  <span className="text-xs text-muted-foreground">({app.downloads} downloads)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isDownloading(app.id) ? (
              <div className="space-y-2">
                <Progress value={dlState?.progress || 0} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {dlState?.status === 'installing' ? 'Installing...' : `Downloading ${Math.round(dlState?.progress || 0)}%`}
                </div>
              </div>
            ) : isInstalled(app.id) ? (
              <div className="flex gap-2">
                <Button size="lg" onClick={() => handleOpenApp(app.id)} className="flex-1 gap-2 bg-cyan-600 hover:bg-cyan-700">
                  <Play className="w-4 h-4" />
                  Open
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleUninstall(app.id, app.name)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => handleInstall(app)} className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700">
                <Download className="w-4 h-4" />
                Install
              </Button>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                <div className="font-bold text-sm">{app.downloads}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Downloads</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                <div className="font-bold text-sm">{app.rating}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Rating</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                <div className="font-bold text-sm">v{app.version}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Version</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                <div className="font-bold text-sm">{app.size}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
            </div>

            {/* Permissions */}
            {app.permissions && app.permissions.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Required Permissions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {app.permissions.map(perm => (
                    <Badge key={perm} variant="outline" className="text-xs bg-muted/50">{perm}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                User Reviews
              </h3>
              <div className="space-y-3">
                {app.reviews?.map((review, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{review.user}</span>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Apps */}
            <div>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Similar Apps
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {AVAILABLE_APPS.filter(a => a.category === app.category && a.id !== app.id).slice(0, 4).map(relatedApp => {
                  const relConfig = CATEGORY_CONFIG[relatedApp.category];
                  const RelIcon = relConfig?.icon || Package;
                  return (
                    <button
                      key={relatedApp.id}
                      onClick={() => setSelectedApp(relatedApp)}
                      className="flex-shrink-0 w-24 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors text-center"
                    >
                      <div className={cn("mx-auto mb-2 p-2 rounded-lg bg-muted/50 w-fit", relConfig?.color)}>
                        <RelIcon className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-medium truncate">{relatedApp.name}</div>
                      <div className="text-[10px] text-muted-foreground">{relatedApp.rating} ★</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      {/* Custom Uninstall Confirmation Dialog */}
      <Dialog open={!!uninstallTarget} onOpenChange={(open) => !open && setUninstallTarget(null)}>
        <DialogContent className="sm:max-w-md border-destructive/30 bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Uninstall {uninstallTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              This will remove <span className="font-medium text-foreground">{uninstallTarget?.name}</span> from your system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUninstallTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmUninstall} className="gap-1.5">
              <Trash2 className="w-4 h-4" />
              Uninstall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  const currentHero = HERO_PROMOTIONS[heroIndex];
  const heroApp = AVAILABLE_APPS.find(a => a.id === currentHero.id);

  return (
    <>
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm p-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20">
            <Package className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">App Store</h1>
            <p className="text-xs text-muted-foreground">UrbanShade Software Repository</p>
          </div>
          <div className="flex items-center gap-2">
            {appsWithUpdates.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {appsWithUpdates.length} Updates
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Check className="w-3 h-3" />
              {installedApps.length}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-9">
            <TabsTrigger value="browse" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="installed" className="gap-1.5 text-xs">
              <HardDrive className="w-3.5 h-3.5" />
              Installed
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-1.5 text-xs relative">
              <RefreshCw className="w-3.5 h-3.5" />
              Updates
              {appsWithUpdates.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center text-white">
                  {appsWithUpdates.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        {activeTab === "browse" && (
          <div className="p-4 space-y-4">
            {/* Hero Banner - Responsive */}
            {!search && selectedCategory === "all" && (
              <div 
                className={cn(
                  "relative rounded-2xl overflow-hidden border border-border cursor-pointer group",
                  "bg-gradient-to-r min-h-[120px]",
                  currentHero.gradient
                )}
                onClick={() => heroApp && setSelectedApp(heroApp)}
              >
                <div className="p-4 md:p-5">
                  <Badge className={cn("mb-2 text-[10px]", currentHero.accentColor, "bg-background/20 border-0")}>
                    {currentHero.badge}
                  </Badge>
                  <h2 className="text-lg md:text-2xl font-bold mb-1 line-clamp-1">{currentHero.title}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">{currentHero.subtitle}</p>
                  <Button size="sm" className="gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs md:text-sm">
                    <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span className="hidden sm:inline">View App</span>
                    <span className="sm:hidden">View</span>
                    <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </Button>
                </div>
                {/* Hero dots indicator */}
                <div className="absolute bottom-2 md:bottom-3 right-3 md:right-4 flex gap-1.5">
                  {HERO_PROMOTIONS.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
                      className={cn(
                        "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors",
                        i === heroIndex ? "bg-white" : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* App of the Day - Responsive */}
            {!search && selectedCategory === "all" && (
              <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                  <span className="text-[10px] md:text-xs font-semibold text-purple-400 uppercase tracking-wide">App of the Day</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={cn(
                    "p-2 md:p-3 rounded-xl shrink-0",
                    "bg-gradient-to-br",
                    CATEGORY_CONFIG[appOfTheDay.category]?.gradient || "from-muted to-muted/50"
                  )}>
                    {(() => {
                      const Icon = CATEGORY_CONFIG[appOfTheDay.category]?.icon || Package;
                      return <Icon className={cn("w-6 h-6 md:w-8 md:h-8", CATEGORY_CONFIG[appOfTheDay.category]?.color)} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base truncate">{appOfTheDay.name}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">{appOfTheDay.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(appOfTheDay.rating)}
                      <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">{appOfTheDay.category}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedApp(appOfTheDay)} className="shrink-0 text-xs">
                    View
                  </Button>
                </div>
              </div>
            )}

            {/* Search & Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Recently Updated</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="size">Size (Small)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="shrink-0"
              >
                All Apps
              </Button>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const categoryKey = key.toLowerCase();
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === categoryKey ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(categoryKey)}
                    className="gap-1.5 shrink-0"
                  >
                    <Icon className={cn("w-3.5 h-3.5", selectedCategory !== categoryKey && config.color)} />
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Trending Section - Responsive */}
            {!search && selectedCategory === "all" && (
              <div>
                <h3 className="text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Trending Now
                </h3>
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                  {AVAILABLE_APPS.filter(a => a.featured).slice(0, 5).map((app, i) => {
                    const config = CATEGORY_CONFIG[app.category];
                    const Icon = config?.icon || Package;
                    return (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={cn(
                          "flex-shrink-0 w-24 md:w-32 p-2 md:p-3 rounded-xl border border-border",
                          "bg-gradient-to-br hover:border-primary/50 transition-all",
                          config?.gradient || "from-muted to-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <span className="text-base md:text-lg font-bold text-muted-foreground">#{i + 1}</span>
                          <div className={cn("p-1 md:p-1.5 rounded-lg bg-background/50", config?.color)}>
                            <Icon className="w-3 h-3 md:w-4 md:h-4" />
                          </div>
                        </div>
                        <div className="text-xs md:text-sm font-medium truncate text-left">{app.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(app.rating)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Releases - Responsive */}
            {!search && selectedCategory === "all" && (
              <div>
                <h3 className="text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  New Releases
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_APPS.filter(a => a.new).slice(0, 4).map(app => {
                    const config = CATEGORY_CONFIG[app.category];
                    const Icon = config?.icon || Package;
                    return (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={cn(
                          "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border border-border text-left",
                          "bg-gradient-to-br hover:border-green-500/30 transition-all",
                          config?.gradient || "from-muted to-muted/50"
                        )}
                      >
                        <div className={cn("p-1.5 md:p-2 rounded-lg bg-background/50 shrink-0", config?.color)}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-medium truncate">{app.name}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">{app.category}</div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 text-[8px] md:text-[10px] shrink-0">NEW</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Apps List */}
            <div>
              {(search || selectedCategory !== "all") && (
                <h3 className="text-sm font-semibold mb-3">
                  {search ? `Results for "${search}"` : `${CATEGORY_CONFIG[selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)]?.label || 'All'} Apps`}
                </h3>
              )}
              {!search && selectedCategory === "all" && (
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  All Applications
                </h3>
              )}
              <div className="space-y-2">
                {sortedAndFilteredApps.map(app => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={isInstalled(app.id)}
                    isDownloading={isDownloading(app.id)}
                    downloadProgress={getDownloadState(app.id)?.progress}
                    onInstall={() => handleInstall(app)}
                    onUninstall={() => handleUninstall(app.id, app.name)}
                    onView={() => setSelectedApp(app)}
                    onOpen={() => handleOpenApp(app.id)}
                    renderStars={renderStars}
                  />
                ))}

                {sortedAndFilteredApps.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No apps found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "installed" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                Installed Apps
              </h3>
              <span className="text-xs text-muted-foreground">{installedApps.length} apps</span>
            </div>

            {installedApps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No apps installed</p>
                <p className="text-sm mb-4">Browse the store to find apps</p>
                <Button variant="outline" onClick={() => setActiveTab("browse")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse Apps
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {AVAILABLE_APPS.filter(p => installedApps.includes(p.id)).map(app => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled
                    onInstall={() => {}}
                    onUninstall={() => handleUninstall(app.id, app.name)}
                    onView={() => setSelectedApp(app)}
                    onOpen={() => handleOpenApp(app.id)}
                    renderStars={renderStars}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                Available Updates
              </h3>
              {appsWithUpdates.length > 0 && (
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Update All
                </Button>
              )}
            </div>

            {appsWithUpdates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-400" />
                <p className="font-medium">All apps are up to date</p>
                <p className="text-sm">Check back later for updates</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appsWithUpdates.map(app => {
                  const config = CATEGORY_CONFIG[app.category];
                  const Icon = config?.icon || Package;
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                      <div className={cn("p-2.5 rounded-xl bg-muted/50", config?.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{app.name}</h4>
                        <p className="text-xs text-muted-foreground">Version {app.version} available</p>
                      </div>
                      <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                        <Download className="w-3.5 h-3.5" />
                        Update
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recently Updated */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recently Updated
              </h3>
              <div className="space-y-2">
                {AVAILABLE_APPS.filter(a => installedApps.includes(a.id)).slice(0, 5).map(app => {
                  const config = CATEGORY_CONFIG[app.category];
                  const Icon = config?.icon || Package;
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                      <div className={cn("p-2 rounded-lg bg-muted/50", config?.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{app.name}</h4>
                        <p className="text-xs text-muted-foreground">v{app.version} • {app.lastUpdate}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        <Check className="w-3 h-3 mr-1" />
                        Up to date
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Downloads Bar */}
      {downloads.length > 0 && (
        <div className="border-t border-border p-3 space-y-2 shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Downloads</span>
            <span className="text-xs text-muted-foreground">{downloads.length} active</span>
          </div>
          {downloads.map(dl => {
            const app = AVAILABLE_APPS.find(a => a.id === dl.appId);
            return (
              <div key={dl.appId} className="flex items-center gap-3">
                <span className="text-sm truncate flex-1">{app?.name}</span>
                <Progress value={dl.progress} className="w-24 h-2" />
                <span className="text-xs w-14 text-right text-muted-foreground">
                  {dl.status === 'complete' ? (
                    <span className="text-green-400">Complete</span>
                  ) : dl.status === 'installing' ? (
                    <span className="text-amber-400">Installing</span>
                  ) : (
                    `${Math.round(dl.progress)}%`
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* Custom Uninstall Confirmation Dialog */}
      <Dialog open={!!uninstallTarget} onOpenChange={(open) => !open && setUninstallTarget(null)}>
        <DialogContent className="sm:max-w-md border-destructive/30 bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Uninstall {uninstallTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              This will remove <span className="font-medium text-foreground">{uninstallTarget?.name}</span> from your system. 
              You can reinstall it anytime from the App Store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUninstallTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmUninstall} className="gap-1.5">
              <Trash2 className="w-4 h-4" />
              Uninstall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// App Card Component
interface AppCardProps {
  app: StoreApp;
  compact?: boolean;
  isInstalled: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  onInstall: () => void;
  onUninstall?: () => void;
  onView: () => void;
  onOpen?: () => void;
  renderStars: (rating: number) => React.ReactNode;
}

const AppCard = ({ 
  app, compact, isInstalled, isDownloading, downloadProgress, onInstall, onUninstall, onView, onOpen, renderStars 
}: AppCardProps) => {
  const config = CATEGORY_CONFIG[app.category];
  const Icon = config?.icon || Package;

  if (compact) {
    return (
      <button
        onClick={onView}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border border-border transition-all text-left",
          "bg-gradient-to-br hover:border-primary/30",
          config?.gradient || "from-muted to-muted/50"
        )}
      >
        <div className={cn("p-2 rounded-lg bg-background/50", config?.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{app.name}</div>
          <div className="flex items-center gap-2">
            {renderStars(app.rating)}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={cn(
      "group flex items-start gap-3 p-3 rounded-xl border border-border transition-all",
      "bg-gradient-to-br hover:border-primary/30",
      config?.gradient || "from-card to-card"
    )}>
      <button 
        onClick={onView}
        className={cn("p-2.5 rounded-xl bg-background/50 shrink-0 border border-border/50", config?.color)}
      >
        <Icon className="w-5 h-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <button onClick={onView} className="text-left w-full">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{app.name}</h3>
            {app.new && <Badge className="bg-green-500/20 text-green-400 text-[10px] px-1.5 border-0">NEW</Badge>}
            {app.featured && !app.new && <Crown className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{app.description}</p>
        </button>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {renderStars(app.rating)}
          <span>{app.downloads}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>{app.size}</span>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        {isDownloading ? (
          <Button variant="outline" size="sm" disabled className="gap-1 text-xs min-w-[70px]">
            <Loader2 className="w-3 h-3 animate-spin" />
            {Math.round(downloadProgress || 0)}%
          </Button>
        ) : isInstalled ? (
          <div className="flex gap-1.5">
            {onOpen && (
              <Button size="sm" onClick={onOpen} className="gap-1 text-xs bg-cyan-600 hover:bg-cyan-700">
                <Play className="w-3 h-3" />
                Open
              </Button>
            )}
            {onUninstall && (
              <Button variant="ghost" size="sm" onClick={onUninstall} className="text-destructive hover:text-destructive px-2">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={onInstall} className="gap-1 text-xs bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-3 h-3" />
            Install
          </Button>
        )}
      </div>
    </div>
  );
};
