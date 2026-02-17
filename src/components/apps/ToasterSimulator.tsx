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

// Explosion debris particle
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  size: number;
  color: string;
  type: 'bread' | 'metal' | 'fire' | 'leg';
}

export const ToasterSimulator = () => {
  const [slots, setSlots] = useState<[BreadState, BreadState]>(["empty", "empty"]);
  const [darkness, setDarkness] = useState(50);
  const [leverDown, setLeverDown] = useState(false);
  const [toasting, setToasting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [popAnim, setPopAnim] = useState<[boolean, boolean]>([false, false]);
  const [exploded, setExploded] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shaking, setShaking] = useState(false);
  const [totalToasted, setTotalToasted] = useState(() => {
    return parseInt(localStorage.getItem("urbanshade_toaster_count") || "0", 10);
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const toastDuration = 2000 + (darkness / 100) * 4000;
  const burnThreshold = 80;

  const toggleBread = (slot: 0 | 1) => {
    if (toasting || exploded) return;
    setSlots(prev => {
      const next = [...prev] as [BreadState, BreadState];
      next[slot] = next[slot] === "empty" ? "bread" : "empty";
      return next;
    });
  };

  const spawnExplosion = useCallback(() => {
    const colors = ['#ff4500', '#ff6600', '#ffaa00', '#ffd700', '#8B4513', '#666', '#888', '#aaa', '#2d1600'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 8;
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        rotation: Math.random() * 360,
        size: 4 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: i < 8 ? 'bread' : i < 16 ? 'fire' : i < 22 ? 'leg' : 'metal',
      });
    }
    setParticles(newParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3, // gravity
          rotation: p.rotation + p.vx * 3,
          size: p.size * 0.98,
        })).filter(p => p.y < 300 && p.size > 1);
        if (next.length === 0) clearInterval(interval);
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length > 0]);

  const triggerExplosion = useCallback(() => {
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setExploded(true);
      setToasting(false);
      setLeverDown(false);
      setProgress(0);
      spawnExplosion();
      osToast.error("💥 KABOOM!", "The toaster exploded! Toast everywhere!");
      setTimeout(() => {
        osToast.warning("🔥 Fire hazard!", "Toaster parts are scattered across the kitchen.");
      }, 1500);
    }, 800);
  }, [spawnExplosion]);

  const startToasting = useCallback(() => {
    if (toasting || exploded) return;
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
  }, [toasting, exploded, slots, toastDuration]);

  const finishToasting = useCallback(() => {
    const isBurnt = darkness >= burnThreshold;

    if (isBurnt) {
      // EXPLOSION TIME
      triggerExplosion();
      return;
    }

    setToasting(false);
    setLeverDown(false);
    setProgress(0);

    setSlots(prev => {
      return prev.map(s => {
        if (s === "toasting") return "done";
        return s;
      }) as [BreadState, BreadState];
    });

    setPopAnim(prev => {
      const next: [boolean, boolean] = [...prev] as [boolean, boolean];
      slots.forEach((s, i) => {
        if (s === "toasting" || s === "bread") next[i as 0 | 1] = true;
      });
      return next;
    });

    setTimeout(() => setPopAnim([false, false]), 500);

    const count = slots.filter(s => s === "toasting" || s === "bread").length;
    if (count > 0) {
      const newTotal = totalToasted + count;
      setTotalToasted(newTotal);
      localStorage.setItem("urbanshade_toaster_count", String(newTotal));
    }

    osToast.success("Ding! 🍞", "Your toast is ready!");
  }, [darkness, slots, totalToasted, burnThreshold, triggerExplosion]);

  const resetToaster = () => {
    setExploded(false);
    setSlots(["empty", "empty"]);
    setParticles([]);
    setDarkness(50);
  };

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
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 select-none overflow-hidden"
      style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" }}>

      {/* Counter */}
      <div className="text-xs text-muted-foreground font-mono">
        Total slices toasted: {totalToasted}
      </div>

      {/* Toaster body */}
      <div className="relative" style={{ minHeight: 200 }}>
        {/* Explosion particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute pointer-events-none"
            style={{
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.type === 'fire' ? '50%' : p.type === 'leg' ? '2px' : '3px',
              transform: `rotate(${p.rotation}deg)`,
              boxShadow: p.type === 'fire' ? `0 0 ${p.size}px ${p.color}` : undefined,
            }}
          />
        ))}

        {/* Explosion flash */}
        {exploded && particles.length > 20 && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: 250,
              height: 250,
              background: "radial-gradient(circle, rgba(255,200,0,0.6) 0%, rgba(255,100,0,0.3) 40%, transparent 70%)",
              animation: "explosionFlash 0.5s ease-out forwards",
            }}
          />
        )}

        {/* Smoke particles when burning */}
        {(toasting && darkness >= burnThreshold) && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-muted-foreground/50"
                style={{
                  animation: `smoke ${1 + i * 0.2}s ease-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        {!exploded ? (
          /* Toaster */
          <div
            className="relative rounded-2xl border-2 border-border shadow-xl"
            style={{
              width: 200,
              height: 160,
              background: "linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)",
              animation: shaking ? "toasterShake 0.1s linear infinite" : undefined,
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
                  <div
                    className="absolute inset-x-1 h-8 rounded-sm"
                    style={getBreadStyle(slots[i], i)}
                  >
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

            {/* Danger zone indicator */}
            {darkness >= burnThreshold && !toasting && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-destructive font-mono animate-pulse whitespace-nowrap">
                ⚠️ DANGER ZONE ⚠️
              </div>
            )}

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
                    animation: toasting ? `legWiggle 0.4s ease-in-out infinite` : shaking ? `legPanic 0.15s linear infinite` : undefined,
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Exploded state - wreckage */
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl" style={{ animation: "explosionBounce 2s ease-out" }}>💥</div>
            <div className="flex gap-2 text-2xl">
              <span style={{ transform: "rotate(-30deg) translateY(4px)" }}>🦿</span>
              <span style={{ transform: "rotate(15deg)" }}>⚙️</span>
              <span style={{ transform: "rotate(-10deg) translateY(8px)" }}>🍞</span>
              <span style={{ transform: "rotate(25deg)" }}>🔩</span>
              <span style={{ transform: "rotate(-20deg) translateY(6px)" }}>🦿</span>
            </div>
            <p className="text-xs text-destructive font-mono text-center mt-2">
              The toaster has been obliterated.<br/>
              Bread crumbs and legs everywhere.
            </p>
            <button
              onClick={resetToaster}
              className="px-4 py-2 text-xs rounded-lg border border-border bg-card hover:bg-muted transition-colors font-mono"
            >
              🔧 Rebuild Toaster
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      {toasting && !shaking && (
        <div className="w-48 mt-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: darkness >= burnThreshold
                  ? `hsl(${Math.max(0, 30 - progress * 0.3)} 90% ${Math.max(30, 50 - progress * 0.2)}%)`
                  : progress > 80 ? "hsl(30 70% 45%)" : "hsl(40 80% 50%)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1 font-mono">
            {darkness >= burnThreshold && progress > 60
              ? "⚠️ Overheating... " + Math.round(progress) + "%"
              : "Toasting... " + Math.round(progress) + "%"
            }
          </p>
        </div>
      )}

      {/* Shaking warning */}
      {shaking && (
        <p className="text-xs text-destructive font-mono animate-pulse">
          ⚠️ CRITICAL TEMPERATURE ⚠️
        </p>
      )}

      {/* Status */}
      {!exploded && (
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
        </div>
      )}

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
        @keyframes legPanic {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(12deg); }
        }
        @keyframes toasterShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-3px, 1px) rotate(-1deg); }
          50% { transform: translate(3px, -1px) rotate(1deg); }
          75% { transform: translate(-2px, 2px) rotate(-0.5deg); }
          100% { transform: translate(2px, -1px) rotate(0.5deg); }
        }
        @keyframes explosionFlash {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        @keyframes explosionBounce {
          0% { transform: scale(3); opacity: 1; }
          30% { transform: scale(1.2); }
          50% { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
