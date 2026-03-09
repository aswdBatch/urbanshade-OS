import { useState, useRef, useEffect, useCallback } from "react";
import { X, Minus, Square, Copy, Loader2 } from "lucide-react";
import { useWindowSnap, SnapZone } from "@/hooks/useWindowSnap";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  onMinimize?: () => void;
  onSnap?: (zone: SnapZone) => void;
  onShake?: () => void;
  accentColor?: string;
}

export const Window = ({ 
  title, 
  children, 
  zIndex, 
  onClose, 
  onFocus, 
  onMinimize, 
  onSnap, 
  onShake,
  accentColor 
}: WindowProps) => {
  const [position, setPosition] = useState({ x: 100 + Math.random() * 200, y: 80 + Math.random() * 100 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [previousState, setPreviousState] = useState<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSnapped, setIsSnapped] = useState(false);
  const [currentSnapZone, setCurrentSnapZone] = useState<SnapZone>(null);
  const [isHoveringControls, setIsHoveringControls] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  
  const shakeRef = useRef<{ positions: { x: number; y: number; time: number }[]; lastShake: number }>({
    positions: [],
    lastShake: 0
  });

  const { handleDragMove, handleDragEnd, getSnapDimensions } = useWindowSnap();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800 + Math.random() * 400);
    return () => clearTimeout(timer);
  }, []);

  const detectShake = useCallback((x: number, y: number) => {
    const now = Date.now();
    const positions = shakeRef.current.positions;
    positions.push({ x, y, time: now });
    while (positions.length > 0 && now - positions[0].time > 500) {
      positions.shift();
    }
    if (positions.length < 5) return false;
    let directionChanges = 0;
    for (let i = 2; i < positions.length; i++) {
      const prevDx = positions[i - 1].x - positions[i - 2].x;
      const currDx = positions[i].x - positions[i - 1].x;
      if ((prevDx > 0 && currDx < 0) || (prevDx < 0 && currDx > 0)) {
        directionChanges++;
      }
    }
    if (directionChanges >= 3 && now - shakeRef.current.lastShake > 1000) {
      shakeRef.current.lastShake = now;
      return true;
    }
    return false;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    if (isSnapped || isMaximized) {
      if (previousState) {
        const cursorRatio = (e.clientX - position.x) / size.width;
        setDragStart({ x: previousState.size.width * cursorRatio, y: e.clientY - position.y });
        setSize(previousState.size);
        setIsMaximized(false);
        setIsSnapped(false);
        setCurrentSnapZone(null);
      }
    }
    onFocus();
  };

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    handleMaximize();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
        const zone = handleDragMove(e.clientX, e.clientY);
        setCurrentSnapZone(zone);
        if (detectShake(e.clientX, e.clientY)) {
          onShake?.();
        }
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        setSize({
          width: Math.max(400, resizeStart.width + deltaX),
          height: Math.max(300, resizeStart.height + deltaY)
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        const snapDimensions = handleDragEnd(e.clientX, e.clientY);
        if (snapDimensions) {
          setPreviousState({ position, size });
          setPosition({ x: snapDimensions.x, y: snapDimensions.y });
          setSize({ width: snapDimensions.width, height: snapDimensions.height });
          setIsSnapped(true);
        }
      }
      setIsDragging(false);
      setIsResizing(false);
      setCurrentSnapZone(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, handleDragMove, handleDragEnd, detectShake, onShake, position, size]);

  const handleMaximize = () => {
    if (isMaximized) {
      if (previousState) {
        setPosition(previousState.position);
        setSize(previousState.size);
      }
      setIsMaximized(false);
      setIsSnapped(false);
    } else {
      setPreviousState({ position, size });
      setPosition({ x: 0, y: 48 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 48 });
      setIsMaximized(true);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setTimeout(() => {
      if (onMinimize) onMinimize();
    }, 150);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized || isSnapped) return;
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
  };

  const getAnimationClass = () => {
    if (isMinimized) return 'animate-window-minimize';
    if (isMaximized && !previousState) return 'animate-window-maximize';
    if (isSnapped) return 'animate-window-snap';
    return 'animate-window-open';
  };

  // Accent color style for the title bar
  const accentStyle = accentColor ? {
    '--window-accent': accentColor,
  } as React.CSSProperties : {};

  return (
    <>
      <div
        ref={windowRef}
        className={`absolute rounded-xl overflow-hidden gpu-accelerated flex flex-col ${getAnimationClass()} ${isDragging ? 'is-dragging' : 'transition-all duration-200 ease-out'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex: Math.max(zIndex, 1000),
          transformOrigin: 'bottom center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(var(--border))',
          ...accentStyle,
        }}
        onMouseDown={onFocus}
      >
        {/* Window Chrome - Modern Title Bar */}
        <div
          className="h-11 flex items-center gap-2 px-3 cursor-move select-none relative"
          style={{
            background: accentColor 
              ? `linear-gradient(180deg, ${accentColor}15 0%, hsl(var(--glass)) 100%)`
              : 'linear-gradient(180deg, hsl(var(--glass)) 0%, hsl(var(--glass-strong)) 100%)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid hsl(var(--border))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleTitleDoubleClick}
        >
          {/* Accent line at top */}
          {accentColor && (
            <div 
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: accentColor }}
            />
          )}
          
          {/* Window Title */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-medium text-foreground/90 truncate">
              {title}
            </span>
          </div>

          {/* Window Controls - macOS style but right-aligned */}
          <div className="window-controls flex items-center">
            {/* Minimize */}
            <button 
              onClick={handleMinimize}
              onMouseEnter={() => setIsHoveringControls('min')}
              onMouseLeave={() => setIsHoveringControls(null)}
              className="w-11 h-11 flex items-center justify-center transition-colors duration-150 hover:bg-white/10"
              title="Minimize"
            >
              <Minus className={`w-4 h-4 transition-colors duration-150 ${isHoveringControls === 'min' ? 'text-foreground' : 'text-muted-foreground'}`} />
            </button>

            {/* Maximize/Restore */}
            <button 
              onClick={handleMaximize}
              onMouseEnter={() => setIsHoveringControls('max')}
              onMouseLeave={() => setIsHoveringControls(null)}
              className="w-11 h-11 flex items-center justify-center transition-colors duration-150 hover:bg-white/10"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Copy className={`w-3.5 h-3.5 transition-colors duration-150 ${isHoveringControls === 'max' ? 'text-foreground' : 'text-muted-foreground'}`} />
              ) : (
                <Square className={`w-3.5 h-3.5 transition-colors duration-150 ${isHoveringControls === 'max' ? 'text-foreground' : 'text-muted-foreground'}`} />
              )}
            </button>

            {/* Close */}
            <button 
              onClick={onClose}
              onMouseEnter={() => setIsHoveringControls('close')}
              onMouseLeave={() => setIsHoveringControls(null)}
              className="w-11 h-11 flex items-center justify-center transition-colors duration-150 hover:bg-destructive"
              title="Close"
            >
              <X className={`w-4 h-4 transition-colors duration-150 ${isHoveringControls === 'close' ? 'text-white' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 overflow-auto relative"
          style={{
            background: 'hsl(var(--glass-strong))',
            backdropFilter: 'blur(12px)',
          }}
        >
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
              {/* Shimmer skeleton loading */}
              <div className="w-4/5 space-y-3">
                <div className="h-4 rounded-lg animate-shimmer" />
                <div className="h-4 rounded-lg animate-shimmer w-3/4" style={{ animationDelay: '0.1s' }} />
                <div className="h-4 rounded-lg animate-shimmer w-1/2" style={{ animationDelay: '0.2s' }} />
                <div className="h-20 rounded-lg animate-shimmer mt-4" style={{ animationDelay: '0.3s' }} />
                <div className="h-4 rounded-lg animate-shimmer w-2/3" style={{ animationDelay: '0.4s' }} />
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-2">Loading {title}...</div>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Resize Handle - larger hit target */}
        {!isMaximized && !isSnapped && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group z-10"
          >
            <svg 
              className="absolute bottom-1 right-1 w-2.5 h-2.5 text-muted-foreground/30 group-hover:text-primary/50 group-hover:scale-110 transition-all duration-150"
              viewBox="0 0 10 10"
            >
              <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 5v4H5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Snap Zone Indicator */}
      {isDragging && currentSnapZone && (
        <SnapIndicator zone={currentSnapZone} />
      )}
    </>
  );
};

const SnapIndicator = ({ zone }: { zone: SnapZone }) => {
  if (!zone) return null;

  const getZoneStyles = () => {
    switch (zone) {
      case "left": return "left-1 top-[49px] bottom-1 w-[calc(50%-4px)]";
      case "right": return "right-1 top-[49px] bottom-1 w-[calc(50%-4px)]";
      case "top": return "left-1 right-1 top-[49px] bottom-1";
      case "top-left": return "left-1 top-[49px] w-[calc(50%-4px)] h-[calc(50%-26px)]";
      case "top-right": return "right-1 top-[49px] w-[calc(50%-4px)] h-[calc(50%-26px)]";
      case "bottom-left": return "left-1 bottom-1 w-[calc(50%-4px)] h-[calc(50%-26px)]";
      case "bottom-right": return "right-1 bottom-1 w-[calc(50%-4px)] h-[calc(50%-26px)]";
      default: return "";
    }
  };

  return (
    <div
      className={`fixed ${getZoneStyles()} rounded-xl border-2 border-primary/60 bg-primary/15 backdrop-blur-sm z-[9998] pointer-events-none animate-scale-in`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-transparent rounded-xl" />
    </div>
  );
};
