import { useState, useEffect } from "react";
import { PartyPopper, LogOut, Mail } from "lucide-react";
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
            <Button
              variant="outline"
              className="w-fit border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                const status = expiresAt ? "Temporarily Suspended" : "Permanently Banned";
                const emailBody = `#------------------------------------------------#
| Unban request from user:
| (username)
#------------------------------------------------#
| Unban reason:
| Write reason here.
#------------------------------------------------#
|
|By writing this email i agree to not break the rules again,
|and i lose y right to appeal again.
|
#------------------------------------------------#

Ban details:
- Reason: ${reason || "No reason provided"}
- Status: ${status}`;
                window.location.href = `mailto:emailbot00noreply@gmail.com?subject=${encodeURIComponent("Ban Appeal Request")}&body=${encodeURIComponent(emailBody)}`;
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Request Appeal
            </Button>
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
