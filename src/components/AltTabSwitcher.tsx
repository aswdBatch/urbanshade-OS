import { cn } from "@/lib/utils";
import { WindowData } from "@/types/window";

interface AltTabSwitcherProps {
  windows: WindowData[];
  activeIndex: number;
  isVisible: boolean;
}

export const AltTabSwitcher = ({ windows, activeIndex, isVisible }: AltTabSwitcherProps) => {
  if (!isVisible || windows.length < 2) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20">
        <div className="flex gap-4">
          {windows.map((window, index) => (
            <div
              key={window.id}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                index === activeIndex 
                  ? "bg-cyan-500/20 border-2 border-cyan-500 scale-110" 
                  : "bg-slate-800/50 border border-slate-700/50"
              )}
            >
              <div className="w-16 h-16 flex items-center justify-center text-cyan-400">
                {window.app.icon || (
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl font-bold">
                    {window.app.name[0]}
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium max-w-20 truncate",
                index === activeIndex ? "text-cyan-400" : "text-slate-400"
              )}>
                {window.app.name}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          Press Tab to switch • Release Alt to select
        </p>
      </div>
    </div>
  );
};
