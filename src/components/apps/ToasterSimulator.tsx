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

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  size: number;
  color: string;
  type: 'bread' | 'metal' | 'fire' | 'leg' | 'spark';
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
  const [screenFlash, setScreenFlash] = useState(false);
  const [totalToasted, setTotalToasted] = useState(() => {
    return parseInt(localStorage.getItem("urbanshade_toaster_count") || "0", 10);
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const dangerAudioRef = useRef<HTMLAudioElement | null>(null);

  const toastDuration = 2000 + (darkness / 100) * 4000;
  const burnThreshold = 80;

  const playDangerSfx = () => {
    try {
      if (dangerAudioRef.current) {
        dangerAudioRef.current.pause();
        dangerAudioRef.current.currentTime = 0;
      }
      dangerAudioRef.current = new Audio('/sounds/toaster-danger.mp3');
      dangerAudioRef.current.volume = 0.7;
      dangerAudioRef.current.play().catch(() => {});
    } catch {}
  };

  const stopDangerSfx = () => {
    if (dangerAudioRef.current) {
      dangerAudioRef.current.pause();
      dangerAudioRef.current.currentTime = 0;
      dangerAudioRef.current = null;
    }
  };

  const toggleBread = (slot: 0 | 1) => {
    if (toasting || exploded) return;
    setSlots(prev => {
      const next = [...prev] as [BreadState, BreadState];
      next[slot] = next[slot] === "empty" ? "bread" : "empty";
      return next;
    });
  };

  const spawnExplosion = useCallback(() => {
    const colors = ['#ff4500', '#ff6600', '#ffaa00', '#ffd700', '#ff0000', '#ff2200', '#8B4513', '#666', '#888', '#aaa', '#2d1600', '#fff'];
    const newParticles: Particle[] = [];
    // MASSIVE explosion - 80 particles
    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + (Math.random() - 0.5) * 0.8;
      const speed = 4 + Math.random() * 14;
      newParticles.push({
        id: i,
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        rotation: Math.random() * 360,
        size: 5 + Math.random() * 18,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: i < 15 ? 'bread' : i < 30 ? 'fire' : i < 45 ? 'spark' : i < 55 ? 'leg' : 'metal',
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
          vy: p.vy + 0.25,
          vx: p.vx * 0.99,
          rotation: p.rotation + p.vx * 4,
          size: p.size * (p.type === 'spark' ? 0.94 : 0.985),
        })).filter(p => p.y < 500 && p.size > 0.5);
        if (next.length === 0) clearInterval(interval);
        return next;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [particles.length > 0]);

  const triggerExplosion = useCallback(() => {
    setShaking(true);
    // Screen flash on explosion
    setTimeout(() => {
      setShaking(false);
      setExploded(true);
      setToasting(false);
      setLeverDown(false);
      setProgress(0);
      setScreenFlash(true);
      spawnExplosion();
      setTimeout(() => setScreenFlash(false), 300);
      osToast.error("💥💥💥 KABOOM!!! 💥💥💥", "THE TOASTER EXPLODED! BREAD AND LEGS EVERYWHERE!");
      setTimeout(() => {
        osToast.warning("🔥🔥 FIRE! FIRE! 🔥🔥", "The kitchen is on fire! Toaster debris flying!");
      }, 1200);
      setTimeout(() => {
        osToast.error("🦿 LEG DETECTED", "A toaster leg hit the ceiling.");
      }, 2500);
    }, 1000);
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

    // Play danger SFX if in danger zone
    if (darkness >= burnThreshold) {
      playDangerSfx();
    }

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
  }, [toasting, exploded, slots, toastDuration, darkness]);

  const finishToasting = useCallback(() => {
    const isBurnt = darkness >= burnThreshold;

    if (isBurnt) {
      triggerExplosion();
      return;
    }

    stopDangerSfx();
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
    stopDangerSfx();
    setExploded(false);
    setSlots(["empty", "empty"]);
    setParticles([]);
    setDarkness(50);
    setScreenFlash(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopDangerSfx();
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
    const intensity = darkness >= burnThreshold ? 0.5 + (progress / 150) : 0.3 + (progress / 200);
    return {
      boxShadow: `inset 0 0 ${darkness >= burnThreshold ? 20 : 12}px rgba(255, ${Math.max(0, 120 - (darkness * 0.8))}, 0, ${intensity})`,
    };
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-6 p-6 select-none overflow-hidden relative"
      style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" }}
    >
      {/* Screen flash on explosion */}
      {screenFlash && (
        <div className="absolute inset-0 z-50 pointer-events-none" style={{
          background: "radial-gradient(circle, rgba(255,255,200,0.9) 0%, rgba(255,150,0,0.6) 40%, transparent 80%)",
          animation: "screenFlash 0.3s ease-out forwards",
        }} />
      )}

      {/* Counter */}
      <div className="text-xs text-muted-foreground font-mono">
        Total slices toasted: {totalToasted}
      </div>

      {/* Toaster body */}
      <div className="relative" style={{ minHeight: 240 }}>
        {/* Explosion particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute pointer-events-none"
            style={{
              left: `calc(50% + ${p.x}px)`,
              top: `calc(40% + ${p.y}px)`,
              width: p.size,
              height: p.type === 'leg' ? p.size * 2.5 : p.size,
              backgroundColor: p.color,
              borderRadius: p.type === 'fire' ? '50%' : p.type === 'spark' ? '50%' : p.type === 'leg' ? '2px' : '3px',
              transform: `rotate(${p.rotation}deg)`,
              boxShadow: p.type === 'fire'
                ? `0 0 ${p.size * 1.5}px ${p.color}, 0 0 ${p.size * 3}px ${p.color}40`
                : p.type === 'spark'
                ? `0 0 ${p.size * 2}px #fff, 0 0 ${p.size * 4}px ${p.color}`
                : undefined,
            }}
          />
        ))}

        {/* Explosion flash - BIGGER */}
        {exploded && particles.length > 30 && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: 500,
              height: 500,
              background: "radial-gradient(circle, rgba(255,255,200,0.8) 0%, rgba(255,150,0,0.5) 30%, rgba(255,50,0,0.2) 60%, transparent 80%)",
              animation: "explosionFlash 0.8s ease-out forwards",
            }}
          />
        )}

        {/* Smoke particles when in danger zone */}
        {(toasting && darkness >= burnThreshold) && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 4 + i * 2,
                  height: 4 + i * 2,
                  backgroundColor: `rgba(100,100,100,${0.3 + progress * 0.005})`,
                  animation: `smoke ${0.8 + i * 0.15}s ease-out infinite`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}

        {!exploded ? (
          <div
            className="relative rounded-2xl border-2 border-border shadow-xl"
            style={{
              width: 200,
              height: 160,
              background: toasting && darkness >= burnThreshold
                ? `linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(0 ${Math.min(40, progress * 0.4)}% ${50 - progress * 0.1}%) 100%)`
                : "linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)",
              animation: shaking ? "toasterShake 0.08s linear infinite" : undefined,
              transition: "background 0.5s ease",
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

            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">
              UrbanToast™
            </div>

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
                style={{ background: `linear-gradient(90deg, #f5deb3, #8B4513, #1a0a00)` }}
              />
              <span className="text-[10px] text-muted-foreground">🔥</span>
            </div>

            {darkness >= burnThreshold && !toasting && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-destructive font-mono animate-pulse whitespace-nowrap">
                ⚠️ DANGER ZONE ⚠️
              </div>
            )}

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

            <div className="absolute -bottom-5 left-2 right-2 flex justify-between px-2">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-5 rounded-b-full"
                  style={{
                    background: "linear-gradient(180deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted)) 100%)",
                    animation: shaking ? `legPanic 0.08s linear infinite` : toasting ? `legWiggle 0.4s ease-in-out infinite` : undefined,
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-8xl" style={{ animation: "explosionBounce 2s ease-out" }}>💥</div>
            <div className="flex gap-3 text-3xl flex-wrap justify-center max-w-[200px]">
              {['🦿','⚙️','🍞','🔩','🦿','🔥','🍞','🦿','⚙️','💀'].map((e, i) => (
                <span key={i} style={{
                  transform: `rotate(${(i * 37) % 60 - 30}deg) translateY(${(i * 7) % 12}px)`,
                  animation: `debrisBounce ${0.5 + i * 0.1}s ease-out`,
                }}>{e}</span>
              ))}
            </div>
            <p className="text-sm text-destructive font-mono text-center mt-2 font-bold">
              💀 TOASTER OBLITERATED 💀
            </p>
            <p className="text-xs text-muted-foreground font-mono text-center">
              6 legs, 2 bread slices, and your dignity<br/>scattered across the facility.
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
              ? "⚠️ OVERHEATING... " + Math.round(progress) + "%"
              : "Toasting... " + Math.round(progress) + "%"
            }
          </p>
        </div>
      )}

      {shaking && (
        <p className="text-sm text-destructive font-mono font-bold" style={{ animation: "toasterShake 0.1s linear infinite" }}>
          💥 CRITICAL MELTDOWN 💥
        </p>
      )}

      {!exploded && (
        <div className="text-xs text-muted-foreground text-center space-y-1">
          {!toasting && slots.every(s => s === "empty") && <p>Click the slots to insert bread</p>}
          {!toasting && slots.some(s => s === "bread") && <p>Push the lever to start toasting →</p>}
          {!toasting && slots.some(s => s === "done") && <p className="text-primary">✨ Perfect toast! Click to remove.</p>}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/50 font-mono mt-2">
        Made by a friend :D
      </div>

      <style>{`
        @keyframes smoke {
          0% { opacity: 0.6; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(2.5); }
        }
        @keyframes legWiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          75% { transform: rotate(4deg); }
        }
        @keyframes legPanic {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        @keyframes toasterShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-5px, 2px) rotate(-2deg); }
          40% { transform: translate(5px, -2px) rotate(2deg); }
          60% { transform: translate(-4px, 3px) rotate(-1.5deg); }
          80% { transform: translate(4px, -1px) rotate(1.5deg); }
          100% { transform: translate(2px, -2px) rotate(1deg); }
        }
        @keyframes explosionFlash {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
        }
        @keyframes explosionBounce {
          0% { transform: scale(5); opacity: 1; }
          20% { transform: scale(1); }
          35% { transform: scale(2); }
          50% { transform: scale(0.9); }
          65% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes screenFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes debrisBounce {
          0% { transform: translateY(-30px) scale(0); opacity: 0; }
          50% { transform: translateY(5px) scale(1.3); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
