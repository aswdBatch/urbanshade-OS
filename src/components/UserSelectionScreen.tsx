import { useState, useEffect } from "react";
import { Lock, User, Shield, Power, ChevronRight, Loader2 } from "lucide-react";
import { ShutdownOptionsDialog } from "./ShutdownOptionsDialog";
import { VERSION } from "@/lib/versionInfo";

interface UserSelectionScreenProps {
  onLogin: (isGuest?: boolean) => void;
  onShutdown?: () => void;
  onRestart?: () => void;
}

export const UserSelectionScreen = ({ onLogin, onShutdown, onRestart }: UserSelectionScreenProps) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showShutdownOptions, setShowShutdownOptions] = useState(false);
  const [time, setTime] = useState(new Date());

  // Get admin user
  const adminData = localStorage.getItem("urbanshade_admin");
  let admin = null;
  
  try {
    if (adminData) {
      admin = JSON.parse(adminData);
      if (!admin.id || !admin.name) {
        admin = null;
      }
    }
  } catch (e) {
    admin = null;
  }

  // Get additional accounts
  const accountsData = localStorage.getItem("urbanshade_accounts");
  let additionalAccounts: any[] = [];
  
  try {
    if (accountsData) {
      additionalAccounts = JSON.parse(accountsData);
    }
  } catch (e) {
    // ignore
  }

  const guestAccountEnabled = localStorage.getItem("settings_guest_account_enabled") === "true";
  const users = admin ? [admin, ...additionalAccounts] : additionalAccounts;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    if (user && (!user.password || user.password.length === 0)) {
      setLoading(true);
      localStorage.setItem("urbanshade_current_user", JSON.stringify(user));
      setTimeout(() => onLogin(false), 500);
      return;
    }
    
    setSelectedUser(userId);
    setPassword("");
    setError("");
  };

  const handleGuestLogin = () => {
    setLoading(true);
    localStorage.setItem("urbanshade_current_user", JSON.stringify({
      id: "guest",
      name: "Guest",
      username: "Guest",
      role: "Guest",
      clearance: 1,
      isGuest: true
    }));
    setTimeout(() => onLogin(true), 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const user = users.find(u => u.id === selectedUser);
    if (!user) {
      setError("User not found");
      return;
    }

    const hasPassword = user.password && user.password.length > 0;

    if (!hasPassword) {
      setLoading(true);
      localStorage.setItem("urbanshade_current_user", JSON.stringify(user));
      setTimeout(() => onLogin(false), 800);
      return;
    }

    if (!password) {
      setError("Password required");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (password === user.password) {
        localStorage.setItem("urbanshade_current_user", JSON.stringify(user));
        onLogin(false);
      } else {
        setError("Incorrect password");
        setLoading(false);
        setPassword("");
      }
    }, 800);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPassword("");
    setError("");
  };

  const selectedUserData = users.find(u => u.id === selectedUser);

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
    <div className="h-screen w-full bg-slate-900 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950" />
      
      {/* Subtle ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* TOP LEFT - Account Tiles */}
      <div className="absolute top-8 left-8 z-20">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-4">
          <Lock className="w-4 h-4" />
          <span className="tracking-wider">SELECT USER</span>
        </div>
        
        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              disabled={loading}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left w-64 transition-all duration-200 ${
                selectedUser === user.id
                  ? "bg-cyan-500/20 border-cyan-500/50 scale-[1.02]"
                  : "bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/60 hover:border-cyan-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${
                user.id === admin?.id 
                  ? "bg-cyan-900/50 border-cyan-500/40" 
                  : "bg-slate-700/50 border-slate-600/50"
              }`}>
                {user.id === admin?.id ? (
                  <Shield className="w-5 h-5 text-cyan-400" />
                ) : (
                  <User className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {user.name}
                </div>
                <div className="text-xs text-slate-400 truncate">{user.role}</div>
              </div>
              
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </button>
          ))}

          {/* Guest account */}
          {guestAccountEnabled && (
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left w-64 bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/40 hover:border-slate-600/50 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-300 truncate">Guest</div>
                <div className="text-xs text-slate-500 truncate">Limited access</div>
              </div>
              
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* CENTER - Message or Password Form */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {!selectedUser ? (
          /* No user selected - show prompt */
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
              <User className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl text-slate-500 font-light">
              Select an account to log in to
            </p>
            <p className="text-sm text-slate-600 mt-2 font-mono">
              UrbanShade OS v{VERSION.shortVersion}
            </p>
          </div>
        ) : (
          /* User selected - show password form */
          <div className="w-full max-w-md mx-4 animate-fade-in">
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/80 backdrop-blur-lg p-8 shadow-2xl shadow-cyan-500/10">
              {/* Back button */}
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-6 transition-colors"
              >
                <span>←</span>
                <span>Back to users</span>
              </button>
              
              {/* User info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
                  selectedUserData?.id === admin?.id 
                    ? "bg-cyan-900/50 border-cyan-500/40" 
                    : "bg-slate-700/50 border-slate-600/50"
                }`}>
                  {selectedUserData?.id === admin?.id ? (
                    <Shield className="w-8 h-8 text-cyan-400" />
                  ) : (
                    <User className="w-8 h-8 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{selectedUserData?.name}</div>
                  <div className="text-sm text-slate-400">{selectedUserData?.role}</div>
                  <div className="text-xs text-cyan-500 font-mono mt-1">
                    Clearance Level {selectedUserData?.clearance || 1}
                  </div>
                </div>
              </div>
              
              {/* Password form */}
              {selectedUserData?.password && selectedUserData.password.length > 0 ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoFocus
                      disabled={loading}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${error ? 'animate-shake' : ''}`}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-400 text-center py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      ⚠ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 text-center py-2">
                    No password required for this account
                  </p>
                  
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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

      {/* BOTTOM RIGHT - Clock */}
      <div className="absolute bottom-8 right-8 text-right z-10">
        <div className="text-5xl font-extralight text-white/80 tracking-wide tabular-nums">
          {formatTime(time)}
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {formatDate(time)}
        </div>
      </div>

      {/* BOTTOM LEFT - Power button & branding */}
      <div className="absolute bottom-8 left-8 z-10 flex items-end gap-6">
        <button
          onClick={() => setShowShutdownOptions(true)}
          className="p-3 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
        >
          <Power className="w-5 h-5" />
        </button>
        
        <div>
          <div className="text-sm font-medium text-white/70">UrbanShade OS</div>
          <div className="text-xs text-slate-500">{VERSION.displayVersion}</div>
        </div>
      </div>

      {/* Shutdown Options Dialog */}
      {showShutdownOptions && (
        <ShutdownOptionsDialog
          onClose={() => setShowShutdownOptions(false)}
          onShutdown={() => onShutdown?.()}
          onSignOut={() => {}}
          onLock={() => {}}
          onRestart={() => onRestart?.()}
        />
      )}
    </div>
  );
};
