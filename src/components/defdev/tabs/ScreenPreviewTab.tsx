import { useState } from "react";
import { Monitor, X, Ban, AlertTriangle, Clock } from "lucide-react";
import { BannedScreen } from "@/components/BannedScreen";
import { TempBanPopup } from "@/components/TempBanPopup";
import { ModerationWarningPopup } from "@/components/ModerationWarningPopup";

type PreviewScreen = "ban" | "temp_ban" | "warning" | null;

const MOCK_DATA = {
  ban: {
    reason: "Repeated violations of community guidelines. Multiple incidents of harassment in Global Chat.",
    expiresAt: null,
  },
  temp_ban: {
    reason: "Spamming in Global Chat. This is your second offense.",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  warning: {
    reason: "Inappropriate language in Global Chat. Please review the community guidelines.",
  },
};

const PREVIEW_CARDS = [
  {
    id: "ban" as const,
    label: "Permanent Ban",
    icon: Ban,
    color: "bg-red-500/20 border-red-500/40 text-red-400",
    hoverColor: "hover:bg-red-500/30",
    description: "Full-screen ban screen with appeal form",
  },
  {
    id: "temp_ban" as const,
    label: "Temporary Ban",
    icon: Clock,
    color: "bg-amber-500/20 border-amber-500/40 text-amber-400",
    hoverColor: "hover:bg-amber-500/30",
    description: "Temp suspension dialog with checkbox acknowledgment",
  },
  {
    id: "warning" as const,
    label: "Warning",
    icon: AlertTriangle,
    color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400",
    hoverColor: "hover:bg-yellow-500/30",
    description: "Warning dialog with checkbox acknowledgment",
  },
];

const ScreenPreviewTab = () => {
  const [activePreview, setActivePreview] = useState<PreviewScreen>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Screen Preview
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Preview moderation screens as users would see them. Uses mock data — no real actions are taken.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PREVIEW_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => setActivePreview(card.id)}
            className={`p-6 rounded-lg border ${card.color} ${card.hoverColor} transition-all text-left space-y-3`}
          >
            <card.icon className="w-8 h-8" />
            <div>
              <h3 className="font-bold text-sm">{card.label}</h3>
              <p className="text-xs opacity-70 mt-1">{card.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Note:</strong> These previews render the actual components used in production. 
          The ban screen's appeal button will attempt to send a real email if clicked — use with care.
        </p>
      </div>

      {/* Permanent ban - full screen with close button */}
      {activePreview === "ban" && (
        <div className="fixed inset-0 z-[99999]">
          <button
            onClick={() => setActivePreview(null)}
            className="fixed top-4 right-4 z-[100000] w-10 h-10 rounded-full bg-black/80 border border-white/30 flex items-center justify-center hover:bg-black/90 transition-colors"
            title="Close preview"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="fixed top-4 left-4 z-[100000] px-3 py-1.5 bg-black/80 border border-white/30 rounded text-xs font-mono text-white/70">
            PREVIEW MODE — Click ✕ to close
          </div>
          <BannedScreen
            reason={MOCK_DATA.ban.reason}
            expiresAt={null}
            isFakeBan={false}
          />
        </div>
      )}

      {/* Temp ban - dialog popup */}
      <TempBanPopup
        open={activePreview === "temp_ban"}
        onDismiss={() => setActivePreview(null)}
        reason={MOCK_DATA.temp_ban.reason}
        expiresAt={MOCK_DATA.temp_ban.expiresAt}
        isFake
      />

      {/* Warning - dialog popup */}
      <ModerationWarningPopup
        open={activePreview === "warning"}
        onDismiss={() => setActivePreview(null)}
        reason={MOCK_DATA.warning.reason}
        isFake
      />
    </div>
  );
};

export default ScreenPreviewTab;
