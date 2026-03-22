import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw } from 'lucide-react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 70;

const TRACKS = [
  {
    id: 1,
    title: 'SYSTEM.BOOT',
    artist: 'UNKNOWN_ENTITY',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400',
    shadow: 'shadow-cyan-400/50',
    hex: '#22d3ee',
  },
  {
    id: 2,
    title: 'MEMORY.LEAK',
    artist: 'CORRUPTED_DATA',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-500',
    shadow: 'shadow-fuchsia-500/50',
    hex: '#d946ef',
  },
  {
    id: 3,
    title: 'OVERRIDE.EXE',
    artist: 'ROOT_ACCESS',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400',
    shadow: 'shadow-cyan-400/50',
    hex: '#22d3ee',
  },
];

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Ensure food doesn't spawn on the snake
    const isOnSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) break;
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Use refs to avoid dependency issues in the game loop
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    snakeRef.current = INITIAL_SNAKE;
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsPaused(false);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default scrolling for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === ' ' && !gameOver) {
      setIsPaused((prev) => !prev);
      return;
    }

    if (gameOver && e.key === 'Enter') {
      resetGame();
      return;
    }

    const currentDir = directionRef.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (currentDir !== 'DOWN') directionRef.current = 'UP';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (currentDir !== 'UP') directionRef.current = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (currentDir !== 'RIGHT') directionRef.current = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (currentDir !== 'LEFT') directionRef.current = 'RIGHT';
        break;
    }
  }, [gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return;
      }

      // Check self collision
      if (currentSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return;
      }

      currentSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(currentSnake));
      } else {
        currentSnake.pop();
      }

      snakeRef.current = currentSnake;
      setSnake(currentSnake);
      setDirection(currentDir);
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [gameOver, isPaused, food]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono selection:bg-fuchsia-500/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="scanline" />
      
      {/* Background Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${currentTrack.bg}`} />

      {/* Header */}
      <header className="xl:absolute xl:top-8 xl:left-1/2 xl:-translate-x-1/2 mb-8 xl:mb-0 text-center z-10 tear">
        <h1 
          className="text-6xl md:text-8xl font-mono font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)] glitch"
          data-text="SYS.SNAKE"
        >
          SYS.SNAKE
        </h1>
        <p className="text-fuchsia-500 uppercase tracking-[0.3em] text-sm mt-2 font-bold glitch" data-text="UNAUTHORIZED_ACCESS">
          UNAUTHORIZED_ACCESS
        </p>
      </header>

      <div className="flex flex-col items-center justify-center w-full z-10">
        
        {/* Music Player (Floating on Desktop) */}
        <div className="xl:absolute xl:bottom-8 xl:left-8 w-full max-w-md xl:w-80 flex-shrink-0 flex flex-col gap-6 order-2 xl:order-none mt-12 xl:mt-0 z-10">
          <div className="bg-black border-2 border-cyan-500/50 rounded-none p-6 shadow-[0_0_15px_rgba(0,255,255,0.2)] relative overflow-hidden group">
            {/* Player Neon Accent */}
            <div className={`absolute top-0 left-0 w-full h-1 ${currentTrack.bg} shadow-[0_0_10px_currentColor]`} />
            
            <h2 className="text-sm uppercase tracking-widest text-cyan-600 font-bold mb-6 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-none ${isPlaying ? 'animate-pulse ' + currentTrack.bg : 'bg-zinc-800'}`} />
              DATA_STREAM
            </h2>

            {/* Track Info */}
            <div className="mb-8">
              <div className={`text-3xl font-bold truncate ${currentTrack.color} drop-shadow-[0_0_8px_currentColor] transition-colors duration-500 uppercase`}>
                {currentTrack.title}
              </div>
              <div className="text-fuchsia-500 text-sm mt-1 uppercase tracking-widest">{currentTrack.artist}</div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevTrack} className={`p-2 transition-colors ${currentTrack.color} drop-shadow-[0_0_8px_currentColor] hover:brightness-125`}>
                <SkipBack size={28} />
              </button>
              <button 
                onClick={togglePlay} 
                className={`w-16 h-16 rounded-none flex items-center justify-center bg-black border-2 border-cyan-500 hover:border-fuchsia-500 transition-all duration-300 ${isPlaying ? `shadow-[0_0_20px_rgba(0,255,255,0.3)] group-hover:${currentTrack.shadow}` : ''}`}
              >
                {isPlaying ? <Pause size={28} className={`${currentTrack.color} drop-shadow-[0_0_8px_currentColor]`} /> : <Play size={28} className={`ml-1 ${currentTrack.color} drop-shadow-[0_0_8px_currentColor]`} />}
              </button>
              <button onClick={nextTrack} className={`p-2 transition-colors ${currentTrack.color} drop-shadow-[0_0_8px_currentColor] hover:brightness-125`}>
                <SkipForward size={28} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 text-cyan-600">
              <button onClick={() => setIsMuted(!isMuted)} className="hover:text-cyan-400 transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-900 rounded-none appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Audio Element (Hidden) */}
            <audio
              ref={audioRef}
              src={currentTrack.url}
              onEnded={handleTrackEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>

          {/* Tracklist */}
          <div className="bg-black border-2 border-fuchsia-500/50 rounded-none p-4 shadow-[0_0_15px_rgba(255,0,255,0.1)]">
            <h3 className="text-sm uppercase tracking-widest text-fuchsia-600 font-bold mb-4 px-2">INDEX</h3>
            <div className="flex flex-col gap-1">
              {TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`flex items-center justify-between p-3 rounded-none transition-all text-left ${
                    idx === currentTrackIndex 
                      ? 'bg-zinc-900 border-l-4 border-cyan-500' 
                      : 'hover:bg-zinc-900/50 border-l-4 border-transparent'
                  }`}
                >
                  <div>
                    <div className={`text-lg font-bold uppercase ${idx === currentTrackIndex ? track.color : 'text-cyan-700'}`}>
                      {track.title}
                    </div>
                    <div className="text-sm text-fuchsia-700 uppercase">{track.artist}</div>
                  </div>
                  {idx === currentTrackIndex && isPlaying && (
                    <div className="flex gap-1 h-4 items-end">
                      <div className={`w-2 bg-current animate-[bounce_1s_infinite] ${track.color}`} style={{ animationDelay: '0ms' }} />
                      <div className={`w-2 bg-current animate-[bounce_1s_infinite] ${track.color}`} style={{ animationDelay: '200ms' }} />
                      <div className={`w-2 bg-current animate-[bounce_1s_infinite] ${track.color}`} style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game Board (Centered Box) */}
        <div className="flex flex-col items-center w-full max-w-2xl order-1 xl:order-none z-10">
          
          {/* Game Header */}
          <div className="w-full flex justify-between items-end mb-4 px-2">
            <div>
              <div className="text-cyan-600 text-sm uppercase tracking-widest font-bold mb-1">SCORE_VAL</div>
              <div className={`text-5xl font-mono font-black ${currentTrack.color} drop-shadow-[0_0_10px_currentColor] transition-colors duration-500 leading-none`}>
                {score.toString().padStart(4, '0')}
              </div>
            </div>
            <div className="text-right">
               <div className="text-fuchsia-600 text-sm uppercase tracking-widest font-bold mb-1">SYS_STATUS</div>
               <div className={`text-xl font-mono font-bold ${gameOver ? 'text-red-500 glitch' : isPaused ? 'text-yellow-500' : 'text-cyan-400'}`} data-text={gameOver ? 'FATAL_ERR' : isPaused ? 'SUSPENDED' : 'ACTIVE'}>
                 {gameOver ? 'FATAL_ERR' : isPaused ? 'SUSPENDED' : 'ACTIVE'}
               </div>
            </div>
          </div>

          {/* Game Grid Container */}
          <div className="relative p-2 rounded-none bg-black border-4 border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.3)] w-full max-w-[600px] aspect-square">
            {/* Neon Border Glow */}
            <div className={`absolute inset-0 opacity-50 blur-md transition-colors duration-500 ${currentTrack.bg}`} />
            
            <div 
              className="relative bg-black overflow-hidden z-10 w-full h-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {/* Grid Lines (Subtle) */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'linear-gradient(to right, #0ff 1px, transparent 1px), linear-gradient(to bottom, #0ff 1px, transparent 1px)',
                  backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                }}
              />

              {/* Render Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                const segmentOpacity = isHead ? 1 : Math.max(0.25, 1 - (index / snake.length));
                return (
                  <div
                    key={index}
                    className={`rounded-none ${currentTrack.bg} ${
                      isHead 
                        ? 'z-20 scale-110' 
                        : 'z-10 scale-90'
                    }`}
                    style={{
                      gridColumnStart: segment.x + 1,
                      gridRowStart: segment.y + 1,
                      opacity: segmentOpacity,
                      boxShadow: isHead ? `0 0 15px ${currentTrack.hex}` : `0 0 8px ${currentTrack.hex}`,
                      width: '100%',
                      height: '100%',
                    }}
                  />
                );
              })}

              {/* Render Food */}
              <div
                className="bg-fuchsia-500 rounded-none shadow-[0_0_15px_rgba(255,0,255,0.8)] animate-pulse z-10 scale-75"
                style={{
                  gridColumnStart: food.x + 1,
                  gridRowStart: food.y + 1,
                  width: '100%',
                  height: '100%',
                }}
              />

              {/* Overlays */}
              {gameOver && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                  <div className="text-fuchsia-500 text-6xl font-black tracking-widest uppercase mb-2 drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] glitch" data-text="SYSTEM_FAILURE">
                    SYSTEM_FAILURE
                  </div>
                  <div className="text-cyan-400 text-2xl mb-8 font-mono">
                    DATA_RECOVERED: <span className="text-white font-bold">{score}</span>
                  </div>
                  <button
                    onClick={resetGame}
                    className={`flex items-center gap-2 px-8 py-4 rounded-none bg-black border-2 border-cyan-500 hover:bg-cyan-500 hover:text-black text-cyan-500 font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]`}
                  >
                    <RefreshCw size={24} />
                    REBOOT_SEQ
                  </button>
                </div>
              )}

              {isPaused && !gameOver && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="text-cyan-400 text-5xl font-black tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] glitch" data-text="PROCESS_SUSPENDED">
                    PROCESS_SUSPENDED
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Hint */}
          <div className="mt-8 text-cyan-600 text-sm font-mono flex gap-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-black border border-cyan-500 text-cyan-400">W A S D</span>
              <span>||</span>
              <span className="px-3 py-1 bg-black border border-cyan-500 text-cyan-400">ARROWS</span>
              <span>: NAVIGATE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-black border border-fuchsia-500 text-fuchsia-400">SPACE</span>
              <span>: HALT</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
