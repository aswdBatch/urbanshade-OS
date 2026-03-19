import { useState, useEffect, useCallback, useRef } from "react";
import { Gamepad2, Space, Target, FileText, ArrowLeft, Trophy, Zap, Dices, Cookie, Timer, RotateCcw, Plus, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type GameType = "menu" | "invaders" | "pong" | "wordle" | "reaction" | "dice" | "fortune";

const WORD_LIST = [
  "apple", "brave", "crane", "dream", "eagle", "flame", "grape", "heart", "ivory", "joker",
  "karma", "lemon", "mango", "noble", "ocean", "piano", "queen", "river", "solar", "tiger",
  "urban", "vivid", "water", "xenon", "youth", "zebra", "angel", "blaze", "charm", "dance",
  "earth", "faith", "giant", "happy", "ideal", "jewel", "knife", "light", "magic", "night",
  "olive", "peace", "quiet", "rapid", "storm", "tower", "unity", "voice", "wrist", "xylon",
  "young", "zesty", "about", "begin", "catch", "drive", "early", "found", "grand", "house",
  "input", "joint", "known", "learn", "money", "never", "order", "power", "quick", "right",
  "small", "think", "under", "value", "world", "xerox", "yield", "zones", "audio", "blank",
  "clear", "depth", "every", "fresh", "green", "human", "issue", "judge", "kings", "level"
];

const FORTUNES = [
  "The deep calls to those who listen.",
  "Something lurks in the pressure of your future.",
  "The specimens have noted your presence.",
  "Trust not the calm waters ahead.",
  "A path opens where none existed before.",
  "Your clearance level will soon be... adjusted.",
  "The abyss gazes back with interest.",
  "Fortune favors the brave. The deep does not.",
  "Change approaches from unexpected depths.",
  "What you seek seeks you in return.",
  "Beware the one who watches from Terminal 7.",
  "An old friend remembers what you forgot.",
  "The lights will flicker. Count them.",
  "Your reflection knows something you don't.",
  "Z-13 has noted your browsing history.",
];

// Alien Invaders Game
const AlienInvaders = ({ onBack }: { onBack: () => void }) => {
  const GRID_WIDTH = 30;
  const GRID_HEIGHT = 15;
  
  const [playerPos, setPlayerPos] = useState(Math.floor(GRID_WIDTH / 2));
  const [aliens, setAliens] = useState<{ x: number; y: number }[]>([]);
  const [bullets, setBullets] = useState<{ x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [alienDir, setAlienDir] = useState(1);

  useEffect(() => {
    const initialAliens: { x: number; y: number }[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 2; col < GRID_WIDTH - 2; col += 3) {
        initialAliens.push({ x: col, y: row + 1 });
      }
    }
    setAliens(initialAliens);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    if (e.key === "ArrowLeft" && playerPos > 0) {
      setPlayerPos(p => p - 1);
    } else if (e.key === "ArrowRight" && playerPos < GRID_WIDTH - 1) {
      setPlayerPos(p => p + 1);
    } else if (e.key === " ") {
      e.preventDefault();
      setBullets(b => [...b, { x: playerPos, y: GRID_HEIGHT - 2 }]);
    }
  }, [playerPos, gameOver]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver || aliens.length === 0) return;

    const interval = setInterval(() => {
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - 1 })).filter(b => b.y >= 0));

      setAliens(prevAliens => {
        const newAliens = [...prevAliens];
        setBullets(prevBullets => {
          const remainingBullets = prevBullets.filter(bullet => {
            const hitIndex = newAliens.findIndex(a => a.x === bullet.x && a.y === bullet.y);
            if (hitIndex !== -1) {
              newAliens.splice(hitIndex, 1);
              setScore(s => s + 10);
              return false;
            }
            return true;
          });
          return remainingBullets;
        });
        return newAliens;
      });

      setAliens(prev => {
        if (prev.length === 0) return prev;
        const rightMost = Math.max(...prev.map(a => a.x));
        const leftMost = Math.min(...prev.map(a => a.x));
        
        let newDir = alienDir;
        let moveDown = false;
        
        if (rightMost >= GRID_WIDTH - 1 && alienDir === 1) {
          newDir = -1;
          moveDown = true;
        } else if (leftMost <= 0 && alienDir === -1) {
          newDir = 1;
          moveDown = true;
        }
        
        if (newDir !== alienDir) setAlienDir(newDir);
        
        const newAliens = prev.map(a => ({
          x: a.x + (moveDown ? 0 : alienDir),
          y: moveDown ? a.y + 1 : a.y
        }));

        if (newAliens.some(a => a.y >= GRID_HEIGHT - 1)) {
          setGameOver(true);
        }
        
        return newAliens;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [gameOver, alienDir, aliens.length]);

  useEffect(() => {
    if (aliens.length === 0 && score > 0) {
      setGameOver(true);
    }
  }, [aliens.length, score]);

  const renderGrid = () => {
    const grid: string[][] = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(" "));
    aliens.forEach(a => {
      if (a.y >= 0 && a.y < GRID_HEIGHT && a.x >= 0 && a.x < GRID_WIDTH) {
        grid[a.y][a.x] = "W";
      }
    });
    bullets.forEach(b => {
      if (b.y >= 0 && b.y < GRID_HEIGHT) {
        grid[b.y][b.x] = "|";
      }
    });
    grid[GRID_HEIGHT - 1][playerPos] = "A";
    return grid.map(row => row.join("")).join("\n");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-mono text-sm">Score: {score}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <pre className="font-mono text-xs text-primary bg-muted p-2 rounded border border-border leading-tight">
          {renderGrid()}
        </pre>
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-primary">
              {aliens.length === 0 ? "YOU WIN!" : "GAME OVER"}
            </p>
            <p className="text-sm text-muted-foreground">Final Score: {score}</p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Play Again
            </Button>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          ← → to move • SPACE to shoot
        </p>
      </div>
    </div>
  );
};

// Pong Game
const Pong = ({ onBack }: { onBack: () => void }) => {
  const WIDTH = 40;
  const HEIGHT = 15;
  const PADDLE_SIZE = 3;

  const [leftPaddle, setLeftPaddle] = useState(Math.floor(HEIGHT / 2) - 1);
  const [rightPaddle, setRightPaddle] = useState(Math.floor(HEIGHT / 2) - 1);
  const [ball, setBall] = useState({ x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) });
  const [ballVel, setBallVel] = useState({ x: 1, y: 1 });
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameOver, setGameOver] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    if (e.key === "w" && leftPaddle > 0) {
      setLeftPaddle(p => p - 1);
    } else if (e.key === "s" && leftPaddle < HEIGHT - PADDLE_SIZE) {
      setLeftPaddle(p => p + 1);
    }
  }, [leftPaddle, gameOver]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBall(prev => {
        let newX = prev.x + ballVel.x;
        let newY = prev.y + ballVel.y;
        let newVelX = ballVel.x;
        let newVelY = ballVel.y;

        if (newY <= 0 || newY >= HEIGHT - 1) {
          newVelY = -newVelY;
          newY = Math.max(0, Math.min(HEIGHT - 1, newY));
        }

        if (newX <= 2 && newY >= leftPaddle && newY < leftPaddle + PADDLE_SIZE) {
          newVelX = 1;
          newX = 3;
        }

        if (newX >= WIDTH - 3 && newY >= rightPaddle && newY < rightPaddle + PADDLE_SIZE) {
          newVelX = -1;
          newX = WIDTH - 4;
        }

        if (newX <= 0) {
          setScore(s => {
            const newScore = { ...s, right: s.right + 1 };
            if (newScore.right >= 5) setGameOver(true);
            return newScore;
          });
          return { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
        }
        if (newX >= WIDTH - 1) {
          setScore(s => {
            const newScore = { ...s, left: s.left + 1 };
            if (newScore.left >= 5) setGameOver(true);
            return newScore;
          });
          return { x: Math.floor(WIDTH / 2), y: Math.floor(HEIGHT / 2) };
        }

        if (newVelX !== ballVel.x || newVelY !== ballVel.y) {
          setBallVel({ x: newVelX, y: newVelY });
        }

        return { x: newX, y: newY };
      });

      setRightPaddle(prev => {
        if (ball.y < prev + 1 && prev > 0) return prev - 1;
        if (ball.y > prev + 1 && prev < HEIGHT - PADDLE_SIZE) return prev + 1;
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver, ballVel, ball.y, leftPaddle, rightPaddle]);

  const renderGrid = () => {
    const grid: string[][] = Array(HEIGHT).fill(null).map(() => Array(WIDTH).fill(" "));
    for (let i = 0; i < PADDLE_SIZE; i++) {
      grid[leftPaddle + i][1] = "|";
      grid[rightPaddle + i][WIDTH - 2] = "|";
    }
    if (ball.y >= 0 && ball.y < HEIGHT && ball.x >= 0 && ball.x < WIDTH) {
      grid[ball.y][ball.x] = "O";
    }
    return grid.map(row => row.join("")).join("\n");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-mono text-sm">{score.left} - {score.right}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <pre className="font-mono text-xs text-primary bg-muted p-2 rounded border border-border leading-tight">
          {renderGrid()}
        </pre>
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-primary">
              {score.left >= 5 ? "YOU WIN!" : "AI WINS!"}
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Play Again
            </Button>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          W/S to move paddle • First to 5 wins
        </p>
      </div>
    </div>
  );
};

// Wordle Game
const Wordle = ({ onBack }: { onBack: () => void }) => {
  const [targetWord] = useState(() => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toUpperCase());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [usedLetters, setUsedLetters] = useState<Record<string, "correct" | "present" | "absent">>({});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    
    if (e.key === "Enter" && currentGuess.length === 5) {
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      
      const newUsedLetters = { ...usedLetters };
      currentGuess.split("").forEach((letter, i) => {
        if (targetWord[i] === letter) {
          newUsedLetters[letter] = "correct";
        } else if (targetWord.includes(letter) && newUsedLetters[letter] !== "correct") {
          newUsedLetters[letter] = "present";
        } else if (!newUsedLetters[letter]) {
          newUsedLetters[letter] = "absent";
        }
      });
      setUsedLetters(newUsedLetters);
      
      if (currentGuess === targetWord) {
        setWon(true);
        setGameOver(true);
      } else if (newGuesses.length >= 6) {
        setGameOver(true);
      }
      setCurrentGuess("");
    } else if (e.key === "Backspace") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + e.key.toUpperCase());
    }
  }, [currentGuess, gameOver, guesses, targetWord, usedLetters]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getLetterColor = (letter: string, index: number) => {
    if (targetWord[index] === letter) return "bg-green-600 text-white";
    if (targetWord.includes(letter)) return "bg-yellow-600 text-white";
    return "bg-muted-foreground/30 text-foreground";
  };

  const renderGuess = (guess: string, isCurrentRow: boolean = false) => {
    const letters = isCurrentRow 
      ? currentGuess.padEnd(5, " ").split("")
      : guess.padEnd(5, " ").split("");
    
    return (
      <div className="flex gap-1">
        {letters.map((letter, i) => (
          <div
            key={i}
            className={`w-8 h-8 flex items-center justify-center font-mono font-bold text-sm border border-border rounded ${
              !isCurrentRow && letter !== " " ? getLetterColor(letter, i) : "bg-background"
            }`}
          >
            {letter}
          </div>
        ))}
      </div>
    );
  };

  const keyboard = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-mono text-sm">Wordle</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
        {guesses.map((guess, i) => (
          <div key={i}>{renderGuess(guess)}</div>
        ))}
        {!gameOver && guesses.length < 6 && renderGuess("", true)}
        {Array(Math.max(0, 5 - guesses.length)).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="flex gap-1">
            {Array(5).fill(null).map((_, j) => (
              <div key={j} className="w-8 h-8 border border-border rounded bg-background" />
            ))}
          </div>
        ))}

        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-primary">
              {won ? "CORRECT!" : `The word was: ${targetWord}`}
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Play Again
            </Button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1">
          {keyboard.map((row, i) => (
            <div key={i} className="flex justify-center gap-1">
              {row.map(letter => (
                <button
                  key={letter}
                  className={`w-6 h-8 text-xs font-mono rounded ${
                    usedLetters[letter] === "correct" ? "bg-green-600 text-white" :
                    usedLetters[letter] === "present" ? "bg-yellow-600 text-white" :
                    usedLetters[letter] === "absent" ? "bg-muted-foreground/30" :
                    "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => {
                    if (!gameOver && currentGuess.length < 5) {
                      setCurrentGuess(prev => prev + letter);
                    }
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reaction Test Game
const ReactionTest = ({ onBack }: { onBack: () => void }) => {
  type GameState = "waiting" | "ready" | "go" | "result" | "too-early";

  const [gameState, setGameState] = useState<GameState>("waiting");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [scores, setScores] = useState<{ time: number }[]>(() => {
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("too-early");
    } else if (gameState === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState("result");
      const newScores = [{ time }, ...scores].slice(0, 10);
      setScores(newScores);
      localStorage.setItem("urbanshade_reaction_scores", JSON.stringify(newScores));
    } else {
      startGame();
    }
  };

  const getBestTime = () => scores.length > 0 ? Math.min(...scores.map(s => s.time)) : null;
  const getTimeColor = (time: number) => {
    if (time < 200) return "text-green-400";
    if (time < 300) return "text-cyan-400";
    if (time < 400) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {getBestTime() && <span className="text-xs text-green-400">Best: {getBestTime()}ms</span>}
      </div>
      <button
        onClick={handleClick}
        className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors ${
          gameState === "waiting" ? "bg-muted/30" :
          gameState === "ready" ? "bg-red-500/20" :
          gameState === "go" ? "bg-green-500/20 animate-pulse" :
          gameState === "too-early" ? "bg-orange-500/20" :
          "bg-cyan-500/10"
        }`}
      >
        {gameState === "waiting" && (
          <>
            <Zap className="w-12 h-12 text-cyan-400 mb-4" />
            <div className="text-xl font-bold">Click to Start</div>
          </>
        )}
        {gameState === "ready" && (
          <>
            <Timer className="w-12 h-12 text-red-400 mb-4" />
            <div className="text-xl font-bold text-red-400">Wait for green...</div>
          </>
        )}
        {gameState === "go" && (
          <div className="text-3xl font-bold text-green-400">CLICK NOW!</div>
        )}
        {gameState === "too-early" && (
          <>
            <RotateCcw className="w-12 h-12 text-orange-400 mb-4" />
            <div className="text-xl font-bold text-orange-400">Too Early!</div>
          </>
        )}
        {gameState === "result" && reactionTime && (
          <>
            <Trophy className="w-12 h-12 text-cyan-400 mb-4" />
            <div className={`text-5xl font-bold ${getTimeColor(reactionTime)}`}>{reactionTime}ms</div>
            <div className="text-muted-foreground mt-2">Click to try again</div>
          </>
        )}
      </button>
    </div>
  );
};

// Dice Roller
const DiceRollerGame = ({ onBack }: { onBack: () => void }) => {
  const [numDice, setNumDice] = useState(2);
  const [sides, setSides] = useState(6);
  const [currentRoll, setCurrentRoll] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const dicePresets = [4, 6, 8, 10, 12, 20, 100];

  const rollDice = () => {
    setIsRolling(true);
    let iterations = 0;
    const animate = setInterval(() => {
      const tempRoll = Array.from({ length: numDice }, () => Math.floor(Math.random() * sides) + 1);
      setCurrentRoll(tempRoll);
      iterations++;
      if (iterations >= 10) {
        clearInterval(animate);
        setIsRolling(false);
      }
    }, 50);
  };

  const total = currentRoll.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-mono text-sm">Dice Roller</span>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="text-xs text-muted-foreground mb-2">Dice Count</div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumDice(Math.max(1, numDice - 1))}>
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-2xl font-bold text-purple-400">{numDice}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumDice(Math.min(10, numDice + 1))}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="text-xs text-muted-foreground mb-2">Sides (d{sides})</div>
            <div className="flex flex-wrap gap-1">
              {dicePresets.map(d => (
                <button
                  key={d}
                  onClick={() => setSides(d)}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${sides === d ? "bg-purple-500 text-white" : "bg-muted/50 text-muted-foreground"}`}
                >
                  d{d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 rounded-lg bg-muted/30 border border-border flex flex-col items-center justify-center">
          {currentRoll.length > 0 ? (
            <>
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {currentRoll.map((value, i) => (
                  <div key={i} className={`w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-lg ${isRolling ? "animate-bounce" : ""}`}>
                    {value}
                  </div>
                ))}
              </div>
              <div className="text-3xl font-bold">Total: <span className="text-purple-400">{total}</span></div>
            </>
          ) : (
            <div className="text-muted-foreground text-center">
              <Dices className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Click roll to start</p>
            </div>
          )}
        </div>

        <Button onClick={rollDice} disabled={isRolling} className="w-full bg-purple-500 hover:bg-purple-600">
          {isRolling ? <RotateCcw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Roll {numDice}d{sides}
        </Button>
      </div>
    </div>
  );
};

// Fortune Cookie
const FortuneCookie = ({ onBack }: { onBack: () => void }) => {
  const [fortune, setFortune] = useState<string | null>(null);
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);
  const [isOpening, setIsOpening] = useState(false);

  const openCookie = () => {
    setIsOpening(true);
    setTimeout(() => {
      setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
      setLuckyNumbers(Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1));
      setIsOpening(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <span className="font-mono text-sm">Fortune Cookie</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {fortune ? (
          <div className="text-center space-y-6 animate-fade-in max-w-sm">
            <Cookie className="w-16 h-16 text-amber-400 mx-auto" />
            <p className="text-lg italic text-foreground">"{fortune}"</p>
            <div className="text-sm text-muted-foreground">
              Lucky numbers: <span className="text-amber-400 font-mono">{luckyNumbers.join(" - ")}</span>
            </div>
            <Button variant="outline" onClick={openCookie}>
              <Cookie className="w-4 h-4 mr-2" /> Another Cookie
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto mb-6 ${isOpening ? "animate-bounce" : ""}`}>
              <Cookie className="w-full h-full text-amber-400" />
            </div>
            <Button onClick={openCookie} disabled={isOpening} className="bg-amber-500 hover:bg-amber-600">
              {isOpening ? "Opening..." : "Open Fortune Cookie"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Game Hub
export const GameHub = () => {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  if (currentGame === "invaders") return <AlienInvaders onBack={() => setCurrentGame("menu")} />;
  if (currentGame === "pong") return <Pong onBack={() => setCurrentGame("menu")} />;
  if (currentGame === "wordle") return <Wordle onBack={() => setCurrentGame("menu")} />;
  if (currentGame === "reaction") return <ReactionTest onBack={() => setCurrentGame("menu")} />;
  if (currentGame === "dice") return <DiceRollerGame onBack={() => setCurrentGame("menu")} />;
  if (currentGame === "fortune") return <FortuneCookie onBack={() => setCurrentGame("menu")} />;

  const games = [
    { id: "invaders" as GameType, name: "Alien Invaders", desc: "Defend against the alien horde", icon: Space, color: "text-green-400" },
    { id: "pong" as GameType, name: "Pong", desc: "Classic paddle vs AI battle", icon: Target, color: "text-blue-400" },
    { id: "wordle" as GameType, name: "Wordle", desc: "Guess the 5-letter word", icon: FileText, color: "text-yellow-400" },
    { id: "reaction" as GameType, name: "Reaction Test", desc: "Test your reflexes", icon: Zap, color: "text-cyan-400" },
    { id: "dice" as GameType, name: "Dice Roller", desc: "Roll virtual tabletop dice", icon: Dices, color: "text-purple-400" },
    { id: "fortune" as GameType, name: "Fortune Cookie", desc: "Receive mysterious fortunes", icon: Cookie, color: "text-amber-400" },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="p-2 rounded-xl bg-primary/10">
          <Gamepad2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Game Hub</h1>
          <p className="text-xs text-muted-foreground">Arcade games & utilities</p>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 grid gap-3">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setCurrentGame(game.id)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 hover:border-border transition-all text-left group"
            >
              <div className={`p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors ${game.color}`}>
                <game.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{game.name}</h3>
                <p className="text-xs text-muted-foreground">{game.desc}</p>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 pt-0">
          <div className="p-3 rounded-xl border border-border/30 bg-muted/20 flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>All games use keyboard controls</span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
