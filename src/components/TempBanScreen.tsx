import { Clock, Cloud, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TempBanScreenProps {
  reason: string | null;
  expiresAt: Date | null;
  onAcknowledge: () => void;
  isFake?: boolean;
}

export const TempBanScreen = ({ reason, expiresAt, onAcknowledge, isFake }: TempBanScreenProps) => {
  const formatTimeRemaining = () => {
    if (!expiresAt) return "Unknown";
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

  return (
    <div className="fixed inset-0 z-[9999] bg-amber-800 flex items-start justify-start overflow-auto">
      <div className="p-8 md:p-16 max-w-2xl border-l-2 border-white/10 ml-4 md:ml-8 mt-8 md:mt-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight">
          YOUR ACCOUNT HAS BEEN TEMPORARILY SUSPENDED
        </h1>

        <div className="space-y-8 text-white">
          {isFake && (
            <div className="px-3 py-1.5 bg-white/20 rounded text-xs font-mono w-fit">
              FAKE — DEF-DEV Testing Mode
            </div>
          )}

          <div>
            <p className="text-sm uppercase tracking-widest text-white/70 mb-1">Reason</p>
            <p className="text-lg">
              {reason || "No reason provided. Contact support for details."}
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-widest text-white/70 mb-1">Time Remaining</p>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <p className="text-lg font-semibold font-mono">{formatTimeRemaining()}</p>
            </div>
            {expiresAt && (
              <p className="text-white/70 text-sm mt-1">
                Suspension lifts on {expiresAt.toLocaleString()}
              </p>
            )}
          </div>

          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-300" />
              <div>
                <p className="text-sm font-semibold mb-2">Cloud features disabled during suspension:</p>
                <ul className="text-sm text-white/80 space-y-1">
                  <li>• Messages & Chat</li>
                  <li>• Cloud Sync</li>
                  <li>• Online Features</li>
                  <li>• Moderation Panel</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white/90">
                You can still use UrbanShade OS offline. You must acknowledge this suspension to continue.
              </p>
            </div>
          </div>

          <Button
            onClick={onAcknowledge}
            className="w-fit bg-white text-amber-800 hover:bg-white/90 font-bold px-8 py-6 text-lg"
          >
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
};
