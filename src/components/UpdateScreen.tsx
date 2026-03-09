import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface UpdateScreenProps {
  onComplete: () => void;
}

export const UpdateScreen = ({ onComplete }: UpdateScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("downloading");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    // Update stage based on progress
    const stageInterval = setInterval(() => {
      if (progress < 30) setStage("downloading");
      else if (progress < 60) setStage("preparing");
      else if (progress < 90) setStage("installing");
      else setStage("finishing");
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(stageInterval);
    };
  }, [onComplete, progress]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground overflow-hidden animate-fade-in">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-cyan-500" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>
      
      {/* Spinning Loading Animation */}
      <div className="relative z-10 mb-12">
        <div className="w-28 h-28 relative">
          <div className="absolute inset-0 rounded-full border-8 border-primary-foreground/20 animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary-foreground animate-spin" style={{ animationDuration: '1s' }}></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-lg px-8">
        <h1 className="text-5xl font-bold mb-3 animate-fade-in drop-shadow-lg">System Update</h1>
        
        <div className="space-y-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="text-xl font-medium">
            {stage === "downloading" && "Downloading updates..."}
            {stage === "preparing" && "Preparing installation..."}
            {stage === "installing" && "Installing updates..."}
            {stage === "finishing" && "Finalizing update..."}
          </p>
          
          <div className="bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-xl p-4 space-y-2">
            <p className="text-sm opacity-95">
              Please don't turn off your device. This may take several minutes.
            </p>
            <p className="text-sm opacity-80">
              Your system will restart automatically when the update completes.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="pt-6 space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="text-4xl font-bold tabular-nums">{progress}%</div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-primary-foreground/20 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-primary-foreground transition-all duration-300 ease-out rounded-full shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-sm opacity-70 font-mono">
            {progress < 30 && "Fetching update packages..."}
            {progress >= 30 && progress < 60 && "Verifying system integrity..."}
            {progress >= 60 && progress < 90 && "Applying changes..."}
            {progress >= 90 && "Completing installation..."}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-8 text-center text-sm opacity-70 animate-fade-in space-y-1" style={{ animationDelay: "0.6s" }}>
        <p className="font-bold">UrbanShade OS V3.5.0</p>
        <p className="text-xs opacity-60">Build 8736</p>
      </div>
    </div>
  );
};
