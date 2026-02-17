import { useState, useEffect } from "react";
import { PartyPopper, LogOut, Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BannedScreenProps {
  reason: string | null;
  expiresAt: Date | null;
  isFakeBan: boolean;
  onFakeBanDismiss?: () => void;
}

export const BannedScreen = ({ reason, expiresAt, isFakeBan, onFakeBanDismiss }: BannedScreenProps) => {
  const [showJoke, setShowJoke] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [appealState, setAppealState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [appealUsername, setAppealUsername] = useState('');

  // For fake bans, show the "just kidding" after 5 seconds
  useEffect(() => {
    if (isFakeBan) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowJoke(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isFakeBan]);

  const formatTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  // Fake ban reveal screen
  if (isFakeBan && showJoke) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-green-950 to-emerald-900 flex items-center justify-center z-[9999]">
        <div className="text-center p-8 max-w-lg animate-in zoom-in duration-500">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
            <PartyPopper className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-green-400 mb-4">
            JUST KIDDING! 🎉
          </h1>
          <p className="text-xl text-green-300 mb-6">
            You're not actually banned. This was a prank by an admin!
          </p>
          <p className="text-sm text-green-400/70 mb-8">
            "{reason || 'No reason given'}" - lol gottem
          </p>
          <Button 
            onClick={onFakeBanDismiss}
            className="bg-green-600 hover:bg-green-500 text-lg px-8 py-6"
          >
            Continue to UrbanShade OS
          </Button>
        </div>
      </div>
    );
  }

  // Clean, text-only ban screen
  return (
    <div className="fixed inset-0 bg-red-600 z-[9999] flex items-start justify-start overflow-auto">
      <div className="p-8 md:p-16 max-w-2xl border-l-2 border-white/10 ml-4 md:ml-8 mt-8 md:mt-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight">
          YOUR ACCOUNT HAS BEEN BANNED
        </h1>

        <div className="space-y-8 text-white">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/70 mb-1">Reason</p>
            <p className="text-lg">
              {reason || "No reason provided. Contact support for details."}
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-widest text-white/70 mb-1">Status</p>
            <p className="text-lg font-semibold">
              {expiresAt ? "TEMPORARILY SUSPENDED" : "PERMANENTLY BANNED"}
            </p>
            {expiresAt && (
              <p className="text-white/80 mt-1">{formatTimeRemaining()}</p>
            )}
          </div>

          <p className="text-white/80">
            All online features have been disabled.
          </p>

          <div>
            <p className="text-white/70 mb-1">
              If you believe this is a mistake, contact:
            </p>
            <a 
              href="mailto:emailbot00noreply@gmail.com" 
              className="text-white underline hover:text-white/80"
            >
              emailbot00noreply@gmail.com
            </a>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {appealState === 'idle' || appealState === 'error' ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70">Your username (for the appeal):</label>
                  <input
                    type="text"
                    value={appealUsername}
                    onChange={(e) => setAppealUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-64 px-3 py-2 bg-transparent border border-white/40 text-white placeholder:text-white/40 rounded text-sm focus:outline-none focus:border-white/70"
                  />
                </div>
                {appealState === 'error' && (
                  <p className="text-sm text-white/80">Failed to send. Try again or email directly.</p>
                )}
                <Button
                  variant="outline"
                  className="w-fit border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  disabled={!appealUsername.trim()}
                  onClick={async () => {
                    setAppealState('loading');
                    try {
                      const status = expiresAt ? "Temporarily Suspended" : "Permanently Banned";
                      const { data, error } = await supabase.functions.invoke('send-appeal', {
                        body: { reason: reason || "No reason provided", status, username: appealUsername.trim() },
                      });
                      if (error) throw error;
                      if (data?.success) {
                        setAppealState('sent');
                      } else {
                        throw new Error(data?.error || 'Unknown error');
                      }
                    } catch (err) {
                      console.error('Appeal failed:', err);
                      setAppealState('error');
                    }
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request Appeal
                </Button>
              </>
            ) : appealState === 'loading' ? (
              <div className="flex items-center gap-2 text-white/80">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Sending appeal...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Appeal sent successfully.</span>
              </div>
            )}

            <Button
              variant="outline"
              className="w-fit border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
