import { useState, useEffect, useRef, useCallback } from "react";
import { osToast } from "@/components/shared/OSToast";

type BreadState = "empty" | "bread" | "toasting" | "done" | "burnt";

const BREAD_COLORS: Record<BreadState, string> = {
  empty: "transparent",
  bread: "#f5deb3",
  toasting: "#d2a446",
  done: "#b8860b",
  burnt: "#2d1600",
};

export const ToasterSimulator = () => {
  const [slots, setSlots] = useState<[BreadState, BreadState]>(["empty", "empty"]);
  const [darkness, setDarkness] = useState(50);
  const [leverDown, setLeverDown] = useState(false);
  const [toasting, setToasting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [popAnim, setPopAnim] = useState<[boolean, boolean]>([false, false]);
  const [totalToasted, setTotalToasted] = useState(() => {
    return parseInt(localStorage.getItem("urbanshade_toaster_count") || "0", 10);
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const toastDuration = 2000 + (darkness / 100) * 4000; // 2-6 seconds based on darkness
  const burnThreshold = 80;

  const toggleBread = (slot: 0 | 1) => {
    if (toasting) return;
    setSlots(prev => {
      const next = [...prev] as [BreadState, BreadState];
      if (next[slot] === "empty") {
        next[slot] = "bread";
      } else {
        next[slot] = "empty";
      }
      return next;
    });
  };

  const startToasting = useCallback(() => {
    if (toasting) return;
    if (slots[0] === "empty" && slots[1] === "empty") {
      osToast.warning("No bread!", "Insert bread into the slots first.");
      return;
    }

    setLeverDown(true);
    setToasting(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    setSlots(prev => prev.map(s => (s === "bread" ? "toasting" : s)) as [BreadState, BreadState]);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / toastDuration) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishToasting();
      }
    }, 50);
  }, [toasting, slots, darkness, toastDuration]);

  const finishToasting = useCallback(() => {
    setToasting(false);
    setLeverDown(false);
    setProgress(0);

    const isBurnt = darkness >= burnThreshold;

    setSlots(prev => {
      const next = prev.map(s => {
        if (s === "toasting") return isBurnt ? "burnt" : "done";
        return s;
      }) as [BreadState, BreadState];
      return next;
    });

    // Pop animation
    setPopAnim(prev => {
      const next: [boolean, boolean] = [...prev] as [boolean, boolean];
      slots.forEach((s, i) => {
        if (s === "toasting" || s === "bread") next[i as 0 | 1] = true;
      });
      return next;
    });

    setTimeout(() => setPopAnim([false, false]), 500);

    // Count toasted slices
    const count = slots.filter(s => s === "toasting" || s === "bread").length;
    if (count > 0) {
      const newTotal = totalToasted + count;
      setTotalToasted(newTotal);
      localStorage.setItem("urbanshade_toaster_count", String(newTotal));
    }

    if (isBurnt) {
      osToast.error("BURNT! 🔥", "Your toast is charcoal. The smoke alarm is going off.");
    } else {
      osToast.success("Ding! 🍞", "Your toast is ready!");
    }
  }, [darkness, slots, totalToasted, burnThreshold]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getBreadStyle = (state: BreadState, slotIndex: 0 | 1): React.CSSProperties => ({
    backgroundColor: BREAD_COLORS[state],
    transform: popAnim[slotIndex] ? "translateY(-18px)" : state === "empty" ? "translateY(10px)" : "translateY(0px)",
    transition: popAnim[slotIndex] ? "transform 0.15s ease-out" : "transform 0.3s ease, background-color 1s ease",
    opacity: state === "empty" ? 0 : 1,
  });

  const getSlotGlow = () => {
    if (!toasting) return {};
    return {
      boxShadow: `inset 0 0 12px rgba(255, ${120 - (darkness * 0.8)}, 0, ${0.3 + (progress / 200)})`,
    };
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 select-none"
      style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" }}>

      {/* Counter */}
      <div className="text-xs text-muted-foreground font-mono">
        Total slices toasted: {totalToasted}
      </div>

      {/* Toaster body */}
      <div className="relative">
        {/* Smoke particles */}
        {slots.some(s => s === "burnt") && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-muted-foreground/40"
                style={{
                  animation: `smoke ${1.5 + i * 0.3}s ease-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Toaster */}
        <div
          className="relative rounded-2xl border-2 border-border shadow-xl"
          style={{
            width: 200,
            height: 160,
            background: "linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)",
          }}
        >
          {/* Slots */}
          <div className="flex gap-3 justify-center pt-3">
            {([0, 1] as const).map(i => (
              <button
                key={i}
                onClick={() => toggleBread(i)}
                disabled={toasting}
                className="relative w-16 h-10 rounded-md border border-border/60 overflow-hidden transition-colors"
                style={{
                  backgroundColor: "hsl(var(--background))",
                  ...getSlotGlow(),
                }}
                title={slots[i] === "empty" ? "Click to insert bread" : "Click to remove"}
              >
                {/* Bread slice */}
                <div
                  className="absolute inset-x-1 h-8 rounded-sm"
                  style={getBreadStyle(slots[i], i)}
                >
                  {/* Bread texture */}
                  {slots[i] !== "empty" && (
                    <div className="w-full h-full rounded-sm flex items-center justify-center">
                      <div className="w-6 h-4 rounded-full border border-current opacity-20" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Toaster label */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">
            UrbanToast™
          </div>

          {/* Darkness dial */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">🍞</span>
            <input
              type="range"
              min={10}
              max={100}
              value={darkness}
              onChange={e => setDarkness(Number(e.target.value))}
              disabled={toasting}
              className="w-20 h-1 appearance-none rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #f5deb3, #8B4513, #1a0a00)`,
              }}
            />
            <span className="text-[10px] text-muted-foreground">🔥</span>
          </div>

          {/* Lever */}
          <button
            onClick={startToasting}
            disabled={toasting}
            className="absolute -right-5 top-8 w-4 rounded-full border border-border shadow-md transition-all cursor-pointer hover:brightness-110"
            style={{
              height: leverDown ? 24 : 36,
              marginTop: leverDown ? 12 : 0,
              background: "linear-gradient(180deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted)) 100%)",
              transition: "all 0.3s ease",
            }}
            title="Push down to start toasting"
          />

          {/* 6 Legs */}
          <div className="absolute -bottom-5 left-2 right-2 flex justify-between px-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="w-1.5 h-5 rounded-b-full"
                style={{
                  background: "linear-gradient(180deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted)) 100%)",
                  animation: toasting ? `legWiggle 0.4s ease-in-out infinite` : undefined,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Progress */}
      {toasting && (
        <div className="w-48 mt-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: progress > 80 ? "hsl(0 70% 50%)" : "hsl(30 80% 50%)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1 font-mono">
            Toasting... {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        {!toasting && slots.every(s => s === "empty") && (
          <p>Click the slots to insert bread</p>
        )}
        {!toasting && slots.some(s => s === "bread") && (
          <p>Push the lever to start toasting →</p>
        )}
        {!toasting && slots.some(s => s === "done") && (
          <p className="text-primary">✨ Perfect toast! Click to remove.</p>
        )}
        {!toasting && slots.some(s => s === "burnt") && (
          <p className="text-destructive">💀 Charcoal. Maybe lower the dial next time.</p>
        )}
      </div>

      {/* Credit */}
      <div className="text-[10px] text-muted-foreground/50 font-mono mt-2">
        Made by a friend :D
      </div>

      {/* Animations */}
      <style>{`
        @keyframes smoke {
          0% { opacity: 0.6; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-30px) scale(2); }
        }
        @keyframes legWiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          75% { transform: rotate(4deg); }
        }
      `}</style>
    </div>
  );
};
