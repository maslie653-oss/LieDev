import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Gamepad2,
  Trophy,
  Sparkles,
  Shield,
  Zap,
  Lock,
} from 'lucide-react';

export type GameKey = 'space_shooter' | 'cyber_runner' | 'brick_breaker';

interface GamePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle?: string;
  initialGame?: GameKey;
  onToggleHideGame?: () => void;
  isGameHidden?: boolean;
}

export const GamePlayerModal: React.FC<GamePlayerModalProps> = ({
  isOpen,
  onClose,
  gameTitle = 'Cyber Arcade Game Runner',
  initialGame = 'space_shooter',
  onToggleHideGame,
  isGameHidden = false,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameKey>(initialGame);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // High score persistence
  useEffect(() => {
    const saved = localStorage.getItem(`hyperclone_highscore_${selectedGame}`);
    if (saved) {
      setHighScore(parseInt(saved, 10) || 0);
    } else {
      setHighScore(selectedGame === 'space_shooter' ? 1250 : selectedGame === 'cyber_runner' ? 450 : 800);
    }
  }, [selectedGame]);

  useEffect(() => {
    setSelectedGame(initialGame);
    setGameState('idle');
    setScore(0);
  }, [initialGame, isOpen]);

  // Web Audio Synthesizer for 100% reliable local game sound effects
  const playSynthSound = (type: 'shoot' | 'explode' | 'jump' | 'coin' | 'hit') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'explode') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // Audio synth optional
    }
  };

  // Game Engine Canvas Logic
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ==========================================
    // GAME 1: SPACE SHOOTER (GALAXY RAIDER)
    // ==========================================
    let player = { x: canvas.width / 2, y: canvas.height - 45, width: 32, height: 28, speed: 6, health: 100 };
    let bullets: Array<{ x: number; y: number; vy: number }> = [];
    let enemies: Array<{ x: number; y: number; vx: number; vy: number; radius: number; hp: number }> = [];
    let stars: Array<{ x: number; y: number; speed: number; size: number }> = [];
    let lastShotTime = 0;
    let spawnTimer = 0;
    let currentScore = 0;

    // Initialize starry background
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 2,
        size: Math.random() * 2 + 0.8,
      });
    }

    // ==========================================
    // GAME 2: CYBER RUNNER 2048
    // ==========================================
    let runner = { x: 50, y: 160, vy: 0, width: 24, height: 32, isGrounded: true };
    let obstacles: Array<{ x: number; y: number; width: number; height: number; speed: number }> = [];
    let coins: Array<{ x: number; y: number; radius: number }> = [];
    let runnerSpawnTimer = 0;

    // ==========================================
    // GAME 3: BRICK BREAKER (NEON PADDLE)
    // ==========================================
    let paddle = { x: canvas.width / 2 - 40, y: canvas.height - 25, width: 80, height: 12, speed: 7 };
    let ball = { x: canvas.width / 2, y: canvas.height - 45, vx: 3.5, vy: -3.5, radius: 6 };
    let bricks: Array<{ x: number; y: number; width: number; height: number; color: string; alive: boolean }> = [];

    const initBricks = () => {
      bricks = [];
      const rows = 4;
      const cols = 8;
      const brickW = (canvas.width - 40) / cols;
      const brickH = 16;
      const colors = ['#f43f5e', '#f59e0b', '#06b6d4', '#10b981'];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: 20 + c * brickW,
            y: 35 + r * (brickH + 6),
            width: brickW - 4,
            height: brickH,
            color: colors[r % colors.length],
            alive: true,
          });
        }
      }
    };
    initBricks();

    // MAIN GAME LOOP
    const loop = (timestamp: number) => {
      // Clear canvas
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === 'idle') {
        // Draw splash screen
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          selectedGame === 'space_shooter'
            ? '🚀 GALAXY RAIDER: SPACE SHOOTER'
            : selectedGame === 'cyber_runner'
            ? '⚡ CYBER RUNNER 2048'
            : '🧱 NEON BRICK BREAKER',
          canvas.width / 2,
          canvas.height / 2 - 35
        );

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('Tekan tombol "Mulai Mainkan" di bawah atau tekan Spasi!', canvas.width / 2, canvas.height / 2 + 5);

        ctx.fillStyle = '#34d399';
        ctx.font = '11px monospace';
        ctx.fillText(
          selectedGame === 'space_shooter'
            ? 'Kontrol: Panah / WASD untuk bergerak, Spasi untuk menembak'
            : selectedGame === 'cyber_runner'
            ? 'Kontrol: Panah Atas / Spasi untuk melompat'
            : 'Kontrol: Panah Kiri & Kanan untuk menggerakkan Paddle',
          canvas.width / 2,
          canvas.height / 2 + 35
        );

        if (keys[' '] || keys['enter']) {
          setGameState('playing');
        }

        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('GAME DIHENTIKAN SEMENTARA (PAUSED)', canvas.width / 2, canvas.height / 2);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 25);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`Skor Akhir: ${currentScore}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px system-ui';
        ctx.fillText('Tekan "Main Lagi" untuk bertanding kembali!', canvas.width / 2, canvas.height / 2 + 40);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // ==========================================
      // PLAYING LOOP: SPACE SHOOTER
      // ==========================================
      if (selectedGame === 'space_shooter') {
        // Draw moving stars
        ctx.fillStyle = '#ffffff';
        for (const star of stars) {
          star.y += star.speed;
          if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
          }
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Handle Player Movement
        if ((keys['arrowleft'] || keys['a']) && player.x > player.width / 2) {
          player.x -= player.speed;
        }
        if ((keys['arrowright'] || keys['d']) && player.x < canvas.width - player.width / 2) {
          player.x += player.speed;
        }
        if ((keys['arrowup'] || keys['w']) && player.y > 40) {
          player.y -= player.speed;
        }
        if ((keys['arrowdown'] || keys['s']) && player.y < canvas.height - 25) {
          player.y += player.speed;
        }

        // Handle Shooting
        if (keys[' '] && timestamp - lastShotTime > 180) {
          bullets.push({ x: player.x, y: player.y - 15, vy: -9 });
          lastShotTime = timestamp;
          playSynthSound('shoot');
        }

        // Update Bullets
        ctx.fillStyle = '#38bdf8';
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y += b.vy;
          ctx.fillRect(b.x - 2, b.y, 4, 10);
          if (b.y < -10) bullets.splice(i, 1);
        }

        // Spawn Enemies
        spawnTimer++;
        if (spawnTimer % 45 === 0) {
          enemies.push({
            x: 20 + Math.random() * (canvas.width - 40),
            y: -20,
            vx: (Math.random() - 0.5) * 2,
            vy: 1.8 + Math.random() * 2,
            radius: 14 + Math.random() * 6,
            hp: 1,
          });
        }

        // Update Enemies & Collisions
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.y += e.vy;
          e.x += e.vx;
          if (e.x < e.radius || e.x > canvas.width - e.radius) e.vx = -e.vx;

          // Draw Enemy Alien
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(e.x - 4, e.y - 2, 3, 0, Math.PI * 2);
          ctx.arc(e.x + 4, e.y - 2, 3, 0, Math.PI * 2);
          ctx.fill();

          // Check Bullet collision
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            if (dist < e.radius + 3) {
              bullets.splice(j, 1);
              enemies.splice(i, 1);
              currentScore += 50;
              setScore(currentScore);
              playSynthSound('explode');
              break;
            }
          }

          // Check Player collision
          const playerDist = Math.hypot(e.x - player.x, e.y - player.y);
          if (playerDist < e.radius + player.width / 2) {
            playSynthSound('explode');
            setGameState('gameover');
            if (currentScore > highScore) {
              setHighScore(currentScore);
              localStorage.setItem(`hyperclone_highscore_${selectedGame}`, String(currentScore));
            }
          }

          if (e.y > canvas.height + 30) enemies.splice(i, 1);
        }

        // Draw Player Spaceship
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 16);
        ctx.lineTo(player.x - 16, player.y + 12);
        ctx.lineTo(player.x, player.y + 6);
        ctx.lineTo(player.x + 16, player.y + 12);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(player.x, player.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Thruster flame
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(player.x - 5, player.y + 8);
        ctx.lineTo(player.x, player.y + 16 + Math.random() * 6);
        ctx.lineTo(player.x + 5, player.y + 8);
        ctx.closePath();
        ctx.fill();
      }

      // ==========================================
      // PLAYING LOOP: CYBER RUNNER 2048
      // ==========================================
      else if (selectedGame === 'cyber_runner') {
        const groundY = canvas.height - 40;

        // Draw neon grid ground
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();

        // Jump logic
        if ((keys['arrowup'] || keys[' '] || keys['w']) && runner.isGrounded) {
          runner.vy = -12;
          runner.isGrounded = false;
          playSynthSound('jump');
        }

        runner.vy += 0.7; // Gravity
        runner.y += runner.vy;
        if (runner.y >= groundY - runner.height) {
          runner.y = groundY - runner.height;
          runner.vy = 0;
          runner.isGrounded = true;
        }

        // Spawn obstacles & coins
        runnerSpawnTimer++;
        if (runnerSpawnTimer % 70 === 0) {
          obstacles.push({
            x: canvas.width + 20,
            y: groundY - 28,
            width: 22,
            height: 28,
            speed: 5 + Math.min(6, currentScore / 500),
          });
        }
        if (runnerSpawnTimer % 45 === 0) {
          coins.push({
            x: canvas.width + 30,
            y: groundY - 50 - Math.random() * 40,
            radius: 8,
          });
        }

        // Draw & Update Coins
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i];
          c.x -= 4.5;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.fill();

          // Coin pickup
          if (
            Math.hypot(runner.x + runner.width / 2 - c.x, runner.y + runner.height / 2 - c.y) <
            runner.width / 2 + c.radius + 6
          ) {
            coins.splice(i, 1);
            currentScore += 30;
            setScore(currentScore);
            playSynthSound('coin');
          } else if (c.x < -20) {
            coins.splice(i, 1);
          }
        }

        // Draw & Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.x -= obs.speed;
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

          // Collision Check
          if (
            runner.x < obs.x + obs.width &&
            runner.x + runner.width > obs.x &&
            runner.y < obs.y + obs.height &&
            runner.y + runner.height > obs.y
          ) {
            playSynthSound('explode');
            setGameState('gameover');
            if (currentScore > highScore) {
              setHighScore(currentScore);
              localStorage.setItem(`hyperclone_highscore_${selectedGame}`, String(currentScore));
            }
          }

          if (obs.x < -30) {
            obstacles.splice(i, 1);
            currentScore += 20;
            setScore(currentScore);
          }
        }

        // Draw Cyber Runner
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(runner.x, runner.y, runner.width, runner.height);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(runner.x + 4, runner.y + 6, runner.width - 8, 8); // Visor
      }

      // ==========================================
      // PLAYING LOOP: BRICK BREAKER
      // ==========================================
      else if (selectedGame === 'brick_breaker') {
        // Move paddle
        if ((keys['arrowleft'] || keys['a']) && paddle.x > 10) {
          paddle.x -= paddle.speed;
        }
        if ((keys['arrowright'] || keys['d']) && paddle.x < canvas.width - paddle.width - 10) {
          paddle.x += paddle.speed;
        }

        // Draw paddle
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, [6]);
        ctx.fill();

        // Move ball
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - ball.radius < 5 || ball.x + ball.radius > canvas.width - 5) {
          ball.vx = -ball.vx;
          playSynthSound('hit');
        }
        if (ball.y - ball.radius < 25) {
          ball.vy = -ball.vy;
          playSynthSound('hit');
        }

        // Paddle collision
        if (
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.width
        ) {
          ball.vy = -Math.abs(ball.vy);
          // Angle modifier based on where ball hits paddle
          const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          ball.vx = hitOffset * 5;
          playSynthSound('hit');
        }

        // Bricks collision
        let aliveBricks = 0;
        for (const b of bricks) {
          if (!b.alive) continue;
          aliveBricks++;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.width, b.height);

          if (
            ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + b.width &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + b.height
          ) {
            b.alive = false;
            ball.vy = -ball.vy;
            currentScore += 25;
            setScore(currentScore);
            playSynthSound('coin');
          }
        }

        if (aliveBricks === 0) {
          // Cleared stage
          initBricks();
          ball.vx *= 1.15;
          ball.vy *= 1.15;
        }

        // Ball falls off screen
        if (ball.y > canvas.height + 20) {
          playSynthSound('explode');
          setGameState('gameover');
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem(`hyperclone_highscore_${selectedGame}`, String(currentScore));
          }
        }

        // Draw ball
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Top HUD Score
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SKOR: ${currentScore}`, 15, 20);

      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'right';
      ctx.fillText(`REKOR: ${highScore}`, canvas.width - 15, 20);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, selectedGame, gameState, soundEnabled, highScore]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">{gameTitle}</h3>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  Playable Engine
                </span>
                {isGameHidden && (
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20 flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>Tersembunyi</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Dimainkan langsung tanpa lag di brankas HP Anda</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onToggleHideGame && (
              <button
                onClick={onToggleHideGame}
                title={isGameHidden ? 'Keluarkan Game dari Brankas Rahasia' : 'Sembunyikan Game ke Brankas Rahasia'}
                className={`rounded-xl p-2 text-xs font-semibold transition-all ${
                  isGameHidden
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-purple-300'
                }`}
              >
                <Lock className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              onClick={onClose}
              aria-label="Tutup Game"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Game Mode Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 py-2.5">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => {
                setSelectedGame('space_shooter');
                setGameState('idle');
              }}
              className={`rounded-xl px-3 py-1.5 transition-all ${
                selectedGame === 'space_shooter'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚀 Galaxy Space Raider
            </button>
            <button
              onClick={() => {
                setSelectedGame('cyber_runner');
                setGameState('idle');
              }}
              className={`rounded-xl px-3 py-1.5 transition-all ${
                selectedGame === 'cyber_runner'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Cyber Runner 2048
            </button>
            <button
              onClick={() => {
                setSelectedGame('brick_breaker');
                setGameState('idle');
              }}
              className={`rounded-xl px-3 py-1.5 transition-all ${
                selectedGame === 'brick_breaker'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧱 Neon Brick Breaker
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-xs text-amber-400 font-semibold font-mono">
            <Trophy className="h-3.5 w-3.5" />
            <span>Rekor: {highScore}</span>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="relative bg-slate-950 p-2 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={340}
            className="w-full max-w-[600px] h-[320px] rounded-2xl border border-slate-800 bg-black shadow-inner"
          />
        </div>

        {/* Bottom Game Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/90 px-5 py-3">
          <div className="flex items-center space-x-2">
            {gameState !== 'playing' ? (
              <button
                onClick={() => setGameState('playing')}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Mulai Mainkan</span>
              </button>
            ) : (
              <button
                onClick={() => setGameState('paused')}
                className="flex items-center space-x-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all"
              >
                <Pause className="h-4 w-4" />
                <span>Jeda (Pause)</span>
              </button>
            )}

            <button
              onClick={() => {
                setGameState('playing');
                setScore(0);
              }}
              title="Mulai Ulang Game"
              className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Virtual On-Screen Mobile Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
              onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
              onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
              className="h-9 w-9 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-xs"
            >
              ◀
            </button>
            <button
              onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))}
              onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))}
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))}
              onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))}
              className="px-3.5 h-9 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-600/50 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-xs"
            >
              Aksi / Tembak
            </button>
            <button
              onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
              onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
              onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
              onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
              className="h-9 w-9 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-xs"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
