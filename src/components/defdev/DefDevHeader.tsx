import { Bug, BookOpen, Link2, Link2Off, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { commandQueue } from "@/lib/commandQueue";
import { toast } from "sonner";

export type HandshakeStatus = "disconnected" | "waiting" | "connected" | "standalone";

interface HandshakeResponse {
  status: "online" | "offline";
  user?: string;
  systemState?: string;
  timestamp: string;
}

interface DefDevHeaderProps {
  onHandshakeStatusChange?: (status: HandshakeStatus, response?: HandshakeResponse) => void;
}

const HANDSHAKE_TIMEOUT = 3000; // 3 seconds
const HANDSHAKE_RESPONSE_KEY = "urbanshade_handshake_response";

const DefDevHeader = ({ onHandshakeStatusChange }: DefDevHeaderProps) => {
  const [handshakeStatus, setHandshakeStatus] = useState<HandshakeStatus>("disconnected");
  const [handshakeResponse, setHandshakeResponse] = useState<HandshakeResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const performHandshake = useCallback(() => {
    setHandshakeStatus("waiting");
    setIsRetrying(true);
    
    // Clear any old response
    localStorage.removeItem(HANDSHAKE_RESPONSE_KEY);
    
    // Send handshake request
    commandQueue.queue("HANDSHAKE_REQUEST", { 
      source: "def-dev",
      requestedAt: new Date().toISOString()
    }, "def-dev");

    // Wait for response with timeout
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const response = localStorage.getItem(HANDSHAKE_RESPONSE_KEY);
      
      if (response) {
        clearInterval(checkInterval);
        try {
          const parsed = JSON.parse(response) as HandshakeResponse;
          setHandshakeResponse(parsed);
          setHandshakeStatus("connected");
          onHandshakeStatusChange?.("connected", parsed);
          toast.success("Handshake successful - Main OS connected");
          localStorage.removeItem(HANDSHAKE_RESPONSE_KEY);
        } catch {
          setHandshakeStatus("standalone");
          onHandshakeStatusChange?.("standalone");
        }
        setIsRetrying(false);
        return;
      }

      // Check timeout
      if (Date.now() - startTime > HANDSHAKE_TIMEOUT) {
        clearInterval(checkInterval);
        setHandshakeStatus("standalone");
        onHandshakeStatusChange?.("standalone");
        toast.info("No response from Main OS - running in standalone mode");
        setIsRetrying(false);
      }
    }, 100);
  }, [onHandshakeStatusChange]);

  // Auto-handshake on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      performHandshake();
    }, 500);
    return () => clearTimeout(timer);
  }, [performHandshake]);

  const getStatusDisplay = () => {
    switch (handshakeStatus) {
      case "connected":
        return {
          icon: <Link2 className="w-3 h-3" />,
          text: "CONNECTED",
          color: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30"
        };
      case "waiting":
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: "HANDSHAKING...",
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/30"
        };
      case "standalone":
        return {
          icon: <Link2Off className="w-3 h-3" />,
          text: "STANDALONE",
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/30"
        };
      default:
        return {
          icon: <Link2Off className="w-3 h-3" />,
          text: "DISCONNECTED",
          color: "text-slate-400",
          bg: "bg-slate-500/10",
          border: "border-slate-500/30"
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-orange-950/60 to-amber-950/80 border-b-2 border-amber-500/40 px-4 py-3 flex items-center justify-between relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(251,191,36,0.1) 2px, rgba(251,191,36,0.1) 4px)',
        }} />
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-center justify-center">
            <Bug className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-amber-400 text-lg tracking-wide">DEF-DEV 3.5 CONSOLE</h1>
            <p className="text-xs text-amber-600/80 font-mono">UrbanShade Developer Environment • V3.5</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3 ml-8">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1 ${status.bg} border ${status.border} rounded`}>
            <span className={status.color}>{status.icon}</span>
            <span className={`text-xs ${status.color} font-mono`}>{status.text}</span>
          </div>
          
          {/* Retry Handshake Button */}
          {(handshakeStatus === "standalone" || handshakeStatus === "disconnected") && (
            <button
              onClick={performHandshake}
              disabled={isRetrying}
              className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry
            </button>
          )}
          
          {/* Connected User Info */}
          {handshakeStatus === "connected" && handshakeResponse?.user && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-600/30 rounded">
              <span className="text-xs text-slate-400 font-mono">User: {handshakeResponse.user}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded">
            <span className="text-xs text-amber-400 font-mono">SESSION: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 relative z-10">
        <Link 
          to="/docs/def-dev" 
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-amber-400" /> 
          <span className="hidden sm:inline">Documentation</span>
        </Link>
        <button 
          onClick={() => window.location.href = "/"} 
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
        >
          Exit Console
        </button>
      </div>
    </div>
  );
};

export default DefDevHeader;
