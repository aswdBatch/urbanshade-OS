import { useState, useEffect } from "react";
import { Lock, Terminal, User, ChevronUp, Eye, EyeOff, Cloud, Wifi } from "lucide-react";
import { VERSION } from "@/lib/versionInfo";

interface LockScreenProps {
  onUnlock: () => void;
  username?: string;
}

export const LockScreen = ({ onUnlock, username = "Administrator" }: LockScreenProps) => {
  const [time, setTime] = useState(new Date());
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPasswordVisible, setShowPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    // Check against stored admin credentials
    setTimeout(() => {
      const adminData = localStorage.getItem("urbanshade_admin");
      
      if (adminData) {
        const admin = JSON.parse(adminData);
        if (password === admin.password) {
          onUnlock();
        } else {
          setError("Incorrect password");
          setLoading(false);
        }
      } else {
        setError("System error");
        setLoading(false);
      }
    }, 800);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 animate-fade-in cursor-default"
      onClick={() => !showPasswordField && setShowPasswordField(true)}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
        </div>
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-primary/25 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Time Display */}
      <div className={`relative z-10 text-center mb-12 transition-all duration-500 ${showPasswordField ? 'translate-y-[-50px] opacity-80 scale-90' : ''}`}>
        <div className="text-8xl font-extralight text-foreground tracking-tight mb-2 animate-fade-in tabular-nums">
          {formatTime(time)}
        </div>
        <div className="text-2xl text-muted-foreground font-light animate-fade-in" style={{ animationDelay: '100ms' }}>
          {formatDate(time)}
        </div>
      </div>

      {/* User Profile & Password */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${showPasswordField ? 'translate-y-[-30px]' : ''}`}>
        {/* User Avatar */}
        <div 
          className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center mb-4 shadow-2xl shadow-primary/20 animate-scale-in cursor-pointer hover:scale-105 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            setShowPasswordField(true);
          }}
        >
          <User className="w-14 h-14 text-primary/80" />
        </div>
        
        <div className="text-xl font-medium text-foreground mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {username}
        </div>

        {/* Password Field */}
        {showPasswordField ? (
          <form onSubmit={handleUnlock} className="animate-fade-in">
            <div className="relative">
              <input
                type={showPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or PIN"
                className={`w-72 px-5 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-full text-foreground text-center focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${
                  error ? 'animate-shake border-destructive' : ''
                }`}
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasswordVisible(!showPasswordVisible)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {password && (
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <ChevronUp className="w-4 h-4 rotate-90" />
                  )}
                </button>
              )}
            </div>
            {error && (
              <div className="mt-3 text-sm text-destructive text-center animate-fade-in">
                {error}
              </div>
            )}
          </form>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <ChevronUp className="w-5 h-5" />
            <span className="text-sm">Click or press any key to unlock</span>
          </div>
        )}
      </div>

      {/* Status Icons */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4 text-muted-foreground/60">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-mono">Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-mono">URBANSHADE v{VERSION.shortVersion}</span>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 left-8 text-xs text-muted-foreground/40">
        © 2025 UrbanShade Corporation
      </div>
    </div>
  );
};
