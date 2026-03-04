import { useState } from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ModerationWarningPopupProps {
  open: boolean;
  onDismiss: () => void;
  reason: string | null;
  isFake?: boolean;
}

export const ModerationWarningPopup = ({ open, onDismiss, reason, isFake }: ModerationWarningPopupProps) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleDismiss = () => {
    setAcknowledged(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-gradient-to-br from-yellow-950/95 to-slate-950 border-yellow-500/50 max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-yellow-400">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            You Have Been Warned
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isFake && (
            <div className="px-3 py-1.5 bg-white/10 rounded text-xs font-mono text-slate-400 w-fit">
              FAKE — DEF-DEV Testing Mode
            </div>
          )}

          <p className="text-slate-300">
            A moderator has issued a warning against your account. Continued violations may result in a 
            <strong className="text-red-400"> temporary or permanent ban</strong>.
          </p>
          
          {reason && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-xs text-red-400 font-mono mb-1">REASON</div>
              <p className="text-sm text-red-300">{reason}</p>
            </div>
          )}

          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-400" />
              <p className="text-sm text-slate-400">
                Please review and follow the community guidelines. Further infractions will escalate moderation actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <Checkbox
              id="ack-warning"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="border-yellow-500/50 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
            />
            <Label htmlFor="ack-warning" className="text-sm text-yellow-300 cursor-pointer select-none">
              I acknowledge this warning
            </Label>
          </div>
          
          <Button 
            onClick={handleDismiss} 
            disabled={!acknowledged}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
