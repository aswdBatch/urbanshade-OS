import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModerationWarningScreenProps {
  reason: string | null;
  onAcknowledge: () => void;
  isFake?: boolean;
}

export const ModerationWarningScreen = ({ reason, onAcknowledge, isFake }: ModerationWarningScreenProps) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-amber-600 flex items-start justify-start overflow-auto">
      <div className="p-8 md:p-16 max-w-2xl border-l-2 border-white/10 ml-4 md:ml-8 mt-8 md:mt-12">
        <div className="flex items-center gap-4 mb-10">
          <ShieldAlert className="w-10 h-10 text-white" />
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            YOU HAVE BEEN WARNED
          </h1>
        </div>

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
            <p className="text-sm uppercase tracking-widest text-white/70 mb-1">What this means</p>
            <p className="text-white/90">
              A moderator has issued a warning against your account. Continued violations may result in a temporary or permanent ban. Please review and follow the community guidelines.
            </p>
          </div>

          <div className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white/90">
                You must acknowledge this warning before continuing to use UrbanShade OS. 
                Further infractions will escalate moderation actions.
              </p>
            </div>
          </div>

          <Button
            onClick={onAcknowledge}
            className="w-fit bg-white text-amber-700 hover:bg-white/90 font-bold px-8 py-6 text-lg"
          >
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
};
