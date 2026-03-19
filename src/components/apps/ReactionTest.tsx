import { useState, useEffect, useRef } from "react";
import { Zap, RotateCcw, Trophy, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type GameState = "waiting" | "ready" | "go" | "result" | "too-early";

interface Score {
  time: number;
  timestamp: Date;
}

export const ReactionTest = () => {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [scores, setScores] = useState<Score[]>(() => {
    const saved = localStorage.getItem("urbanshade_reaction_scores");
    return saved ? JSON.parse(saved) : [];
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startGame = () => {
    setGameState("ready");
    setReactionTime(null);
    
    // Random delay between 1-5 seconds
    const delay = 1000 + Math.random() * 4000;
    
    timeoutRef.current = setTimeout(() => {
      setGameState("go");
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (gameState === "waiting") {
      startGame();
    } else if (gameState === "ready") {
      // Clicked too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("too-early");
    } else if (gameState === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState("result");
      
      const newScore: Score = { time, timestamp: new Date() };
      const newScores = [newScore, ...scores].slice(0, 10);
      setScores(newScores);
      localStorage.setItem("urbanshade_reaction_scores", JSON.stringify(newScores));
    } else {
      startGame();
    }
  };

  const getBestTime = () => {
    if (scores.length === 0) return null;
    return Math.min(...scores.map(s => s.time));
  };

  const getAverageTime = () => {
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b.time, 0) / scores.length);
  };

  const getTimeColor = (time: number) => {
    if (time < 200) return "text-green-400";
    if (time < 300) return "text-cyan-400";
    if (time < 400) return "text-yellow-400";
    return "text-red-400";
  };

  const getTimeRating = (time: number) => {
    if (time < 150) return "Superhuman! 🦸";
    if (time < 200) return "Incredible! ⚡";
    if (time < 250) return "Excellent! 🔥";
    if (time < 300) return "Great! 👍";
    if (time < 350) return "Good! 👌";
    if (time < 400) return "Average 😐";
    return "Keep practicing! 💪";
  };

  const clearScores = () => {
    setScores([]);
    localStorage.removeItem("urbanshade_reaction_scores");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-cyan-500/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Reaction Test</h1>
            <p className="text-xs text-muted-foreground">How fast are your reflexes?</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-3 text-right">
          {getBestTime() && (
            <div>
              <div className="text-xs text-muted-foreground">Best</div>
              <div className="text-sm font-bold text-green-400">{getBestTime()}ms</div>
            </div>
          )}
          {getAverageTime() && (
            <div>
              <div className="text-xs text-muted-foreground">Average</div>
              <div className="text-sm font-bold text-cyan-400">{getAverageTime()}ms</div>
            </div>
          )}
        </div>
      </div>

      {/* Game Area */}
      <button
        onClick={handleClick}
        className={`flex-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
          gameState === "waiting"
            ? "bg-muted/30 hover:bg-muted/50 border-2 border-dashed border-border"
            : gameState === "ready"
            ? "bg-red-500/20 border-2 border-red-500/50"
            : gameState === "go"
            ? "bg-green-500/20 border-2 border-green-500/50 animate-pulse"
            : gameState === "too-early"
            ? "bg-orange-500/20 border-2 border-orange-500/50"
            : "bg-cyan-500/10 border-2 border-cyan-500/30"
        }`}
      >
        {gameState === "waiting" && (
          <>
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
              <Zap className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold mb-2">Click to Start</div>
            <div className="text-muted-foreground">Test your reaction time</div>
          </>
        )}

        {gameState === "ready" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center mb-4">
              <Timer className="w-10 h-10 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400 mb-2">Wait for green...</div>
            <div className="text-muted-foreground">Don't click yet!</div>
          </>
        )}

        {gameState === "go" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center mb-4 animate-bounce">
              <Zap className="w-10 h-10 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">CLICK NOW!</div>
          </>
        )}

        {gameState === "too-early" && (
          <>
            <div className="w-20 h-20 rounded-full bg-orange-500/30 flex items-center justify-center mb-4">
              <RotateCcw className="w-10 h-10 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400 mb-2">Too Early!</div>
            <div className="text-muted-foreground">Click to try again</div>
          </>
        )}

        {gameState === "result" && reactionTime && (
          <>
            <div className="w-20 h-20 rounded-full bg-cyan-500/30 flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-cyan-400" />
            </div>
            <div className={`text-5xl font-bold mb-2 ${getTimeColor(reactionTime)}`}>
              {reactionTime}ms
            </div>
            <div className="text-xl mb-4">{getTimeRating(reactionTime)}</div>
            <div className="text-muted-foreground">Click to try again</div>
          </>
        )}
      </button>

      {/* History */}
      {scores.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Recent Attempts</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearScores();
              }}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <ScrollArea className="h-[80px]">
            <div className="flex flex-wrap gap-2">
              {scores.map((score, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 rounded-lg bg-muted/30 text-sm font-medium ${getTimeColor(score.time)}`}
                >
                  {score.time}ms
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
