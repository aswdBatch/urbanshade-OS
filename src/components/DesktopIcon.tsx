import { useState } from "react";
import { App } from "@/types/window";

interface DesktopIconProps {
  app: App;
  isSelected?: boolean;
  onSelect?: () => void;
  index?: number;
}

export const DesktopIcon = ({ app, isSelected, onSelect, index = 0 }: DesktopIconProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  const handleDoubleClick = () => {
    setIsLaunching(true);
    setTimeout(() => setIsLaunching(false), 400);
    app.run();
  };

  return (
    <div
      className={`
        w-20 h-[88px] flex flex-col items-center gap-1.5 p-2 rounded-lg
        select-none cursor-pointer transition-all duration-150 group animate-stagger-in
        ${isSelected 
          ? "bg-primary/20 ring-1 ring-primary/50" 
          : "hover:bg-white/5"
        }
        ${isPressed ? "scale-95" : ""}
        ${isLaunching ? "animate-toggle-pulse" : ""}
      `}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Icon Container */}
      <div className={`
        w-11 h-11 rounded-xl flex items-center justify-center
        transition-all duration-200 relative
        ${isSelected 
          ? "bg-primary/15 text-primary shadow-lg shadow-primary/20" 
          : "bg-background/60 backdrop-blur-sm border border-border/50 text-foreground/70 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:shadow-[0_4px_12px_hsl(var(--primary)/0.1)]"
        }
      `}>
        <div className="w-6 h-6 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">
          {app.icon}
        </div>
        
        {/* Glow effect on selection */}
        {isSelected && (
          <div className="absolute inset-0 rounded-xl bg-primary/10 blur-md -z-10" />
        )}
      </div>
      
      {/* App Name */}
      <div className={`
        text-[11px] leading-tight text-center w-full px-0.5
        transition-colors duration-150 line-clamp-2
        ${isSelected 
          ? "text-foreground font-medium" 
          : "text-foreground/70 group-hover:text-foreground"
        }
      `}>
        {app.name}
      </div>
    </div>
  );
};
