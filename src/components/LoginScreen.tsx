import { useState, useEffect } from "react";
import { Lock, User, Shield, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { trackLogin, startSessionTracking, checkTimeAchievements } from "@/hooks/useAchievementTriggers";
import { VERSION } from "@/lib/versionInfo";

interface LoginScreenProps {
  onLogin: () => void;
}

interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: string;
  clearance: number;
  hasPassword: boolean;
  isAdmin: boolean;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Load accounts from localStorage
  useEffect(() => {
    const loadedAccounts: UserAccount[] = [];
    
    const adminData = localStorage.getItem("urbanshade_admin");
    if (adminData) {
      const admin = JSON.parse(adminData);
      loadedAccounts.push({
        id: "admin",
        username: admin.username,
        displayName: admin.displayName || admin.username,
        role: "System Administrator",
        clearance: 5,
        hasPassword: !!admin.password,
        isAdmin: true,
      });
    }
    
    const additionalAccounts = localStorage.getItem("urbanshade_accounts");
    if (additionalAccounts) {
      const parsed = JSON.parse(additionalAccounts);
      parsed.forEach((acc: any, index: number) => {
        loadedAccounts.push({
          id: acc.id || `user-${index}`,
          username: acc.username,
          displayName: acc.displayName || acc.username,
          role: acc.role || "Operator",
          clearance: acc.clearance || 3,
          hasPassword: !!acc.password,
          isAdmin: false,
        });
      });
    }
    
    setAccounts(loadedAccounts);
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAccount = (account: UserAccount) => {
    setSelectedAccount(account);
    setPassword("");
    setError("");
  };

  const handleBack = () => {
    setSelectedAccount(null);
    setPassword("");
    setError("");
  };

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    
    if (!selectedAccount) return;

    if (selectedAccount.hasPassword && !password) {
      setError("Password required");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (selectedAccount.isAdmin) {
        const adminData = localStorage.getItem("urbanshade_admin");
        if (adminData) {
          const admin = JSON.parse(adminData);
          if (!selectedAccount.hasPassword || password === admin.password) {
            trackLogin();
            startSessionTracking();
            checkTimeAchievements();
            onLogin();
            return;
          }
        }
      } else {
        const additionalAccounts = localStorage.getItem("urbanshade_accounts");
        if (additionalAccounts) {
          const parsed = JSON.parse(additionalAccounts);
          const account = parsed.find((a: any) => 
            a.username === selectedAccount.username || a.id === selectedAccount.id
          );
          if (account && (!selectedAccount.hasPassword || password === account.password)) {
            trackLogin();
            startSessionTracking();
            checkTimeAchievements();
            onLogin();
            return;
          }
        }
      }

      setError("Incorrect password");
      setLoading(false);
    }, 800);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden select-none">
      {/* Background layers */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: mounted ? 1 : 0,
          background: `
            radial-gradient(ellipse 60% 40% at 50% 100%, hsl(var(--primary) / 0.06), transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 20%, hsl(var(--primary) / 0.03), transparent 50%),
            linear-gradient(to bottom, hsl(var(--background)), hsl(var(--card)))
          `
        }}
      />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px'
      }} />
      
      {/* Account tiles - TOP LEFT */}
      <div className={`absolute top-6 left-6 z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <div className="flex items-center gap-2 text-primary text-[10px] font-mono mb-3 opacity-60 tracking-[0.2em] uppercase">
          <Lock className="w-3 h-3" />
          <span>Select User</span>
        </div>
        
        <div className="space-y-1.5">
          {accounts.map((account, i) => (
            <button
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left w-64 transition-all duration-200 group ${
                selectedAccount?.id === account.id
                  ? "bg-primary/12 border border-primary/30 shadow-lg shadow-primary/5"
                  : "bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-border/50"
              }`}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                selectedAccount?.id === account.id
                  ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                  : "bg-muted/50 text-muted-foreground group-hover:text-foreground/80 group-hover:bg-muted/70"
              }`}>
                {account.isAdmin ? (
                  <Shield className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {account.displayName}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{account.role}</div>
              </div>
              
              <ChevronRight className={`w-4 h-4 transition-all duration-200 flex-shrink-0 ${
                selectedAccount?.id === account.id 
                  ? "text-primary translate-x-0.5" 
                  : "text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5"
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* CENTER - Either message or password form */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {!selectedAccount ? (
          <div className={`text-center transition-all duration-500 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center mx-auto mb-5">
              <User className="w-9 h-9 text-muted-foreground/25" />
            </div>
            <p className="text-lg text-muted-foreground/50 font-light">
              Select an account to sign in
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm mx-4 animate-scale-in">
            <div 
              className="rounded-2xl border border-border/40 p-6 backdrop-blur-2xl shadow-2xl shadow-black/10"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--card) / 0.85) 0%, hsl(var(--card) / 0.75) 100%)'
              }}
            >
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>
              
              {/* User info */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border/20">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm">
                  {selectedAccount.isAdmin ? (
                    <Shield className="w-7 h-7 text-primary" />
                  ) : (
                    <User className="w-7 h-7 text-primary" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground leading-tight">{selectedAccount.displayName}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{selectedAccount.role}</div>
                  <div className="text-[10px] text-primary/70 font-mono mt-1.5 tracking-wider">CLEARANCE {selectedAccount.clearance}</div>
                </div>
              </div>
              
              {/* Password form or direct login */}
              {selectedAccount.hasPassword ? (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoFocus
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/40 text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-muted/40 focus:ring-2 focus:ring-primary/10 focus:outline-none text-sm transition-all"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-destructive text-center py-2.5 px-3 rounded-xl bg-destructive/8 border border-destructive/15 animate-fade-in">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary/15 border border-primary/25 text-primary font-medium hover:bg-primary/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-sm text-muted-foreground/60 text-center py-2">
                    No password required
                  </p>
                  
                  <button
                    onClick={() => handleLogin()}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary/15 border border-primary/25 text-primary font-medium hover:bg-primary/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Time - bottom right */}
      <div className={`absolute bottom-8 right-8 text-right z-10 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '200ms' }}
      >
        <div className="text-5xl font-extralight text-foreground/80 tracking-tight tabular-nums">
          {formatTime(time)}
        </div>
        <div className="text-sm text-muted-foreground/60 mt-1 font-light">
          {formatDate(time)}
        </div>
      </div>

      {/* System info - bottom left */}
      <div className={`absolute bottom-8 left-8 z-10 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '300ms' }}
      >
        <div className="text-sm font-medium text-foreground/50">UrbanShade OS</div>
        <div className="text-[11px] text-muted-foreground/40 font-mono">{VERSION.displayVersion}</div>
      </div>
    </div>
  );
};
