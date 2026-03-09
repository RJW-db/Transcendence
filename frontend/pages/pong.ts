import { socket } from '../services/socket';

// Match the Backend state structure
interface GameState {
  ball: { x: number; y: number; dx: number; dy: number };
  p1X: number;
  p1Y: number;
  p2X: number;
  p2Y: number;
  score: { p1: number; p2: number };
}

  // 1. A set to keep track of keys currently held down
const activeKeys = new Set<string>();

const interval = 1000/60;
// 2. Map your keys to directions
const KEY_MAP: Record<string, string> = {
  'w': 'up', 'o': 'up', 'ArrowUp': 'up',
  's': 'down', 'l': 'down', 'ArrowDown': 'down'
};

export function pong() {
  const container = document.createElement('div');
  container.className = 'flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4';

  container.innerHTML = `
    <!-- Scoreboard -->
    <div class="flex justify-between w-full max-w-[800px] mb-6 px-10 py-4 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
      <div class="text-center">
        <p id="p1-alias" class="text-xs text-slate-500 font-bold tracking-widest uppercase">Player 1</p>
        <p id="p1-score" class="text-5xl font-black text-cyan-400">0</p>
      </div>
      <div class="text-center">
        <p id="p2-alias" class="text-xs text-slate-500 font-bold tracking-widest uppercase">Player 2</p>
        <p id="p2-score" class="text-5xl font-black text-rose-500">0</p>
      </div>
    </div>

    <!-- Game Arena -->
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg blur opacity-20"></div>
      
      <!-- Status Overlay -->
      <div id="game-overlay" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm transition-opacity duration-300">
        <div id="overlay-content" class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4 mx-auto"></div>
            <p class="text-white text-xl font-bold tracking-widest uppercase">Waiting for Opponent...</p>
        </div>
      </div>
      
      <canvas id="pongCanvas" width="800" height="600" class="relative bg-black rounded-lg border border-slate-700 shadow-2xl"></canvas>
    </div>
  `;

  // Get Canvas and Context
  const canvas = container.querySelector('#pongCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const p1ScoreEl = container.querySelector('#p1-score')!;
  const p2ScoreEl = container.querySelector('#p2-score')!;
  const p1AliasEl = container.querySelector('#p1-alias')!;
  const p2AliasEl = container.querySelector('#p2-alias')!;
  const overlay = container.querySelector('#game-overlay') as HTMLElement;
  const overlayContent = container.querySelector('#overlay-content') as HTMLElement;

  // Game Constants (Match these with your backend paddle size)
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 100;
  const BALL_RADIUS = 10;
  let serverState: GameState = {
    ball: { x: 400, y: 300, dx: 0, dy: 0 },
    p1X: 50, p1Y: 250,
    p2X: 740, p2Y: 250,
    score: { p1: 0, p2: 0 }
  };

  const showWaiting = () => {
    overlay.classList.remove('hidden', 'opacity-0');
    overlayContent.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4 mx-auto"></div>
        <p class="text-white text-xl font-bold tracking-widest uppercase animate-pulse">Waiting for Opponent...</p>
    `;
  };

  const hideOverlay = () => {
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  };

  const showWinner = (winnerName: string) => {
    overlay.classList.remove('hidden', 'opacity-0');
    const color = winnerName === 'Player 1' ? 'text-cyan-400' : 'text-rose-500';
    overlayContent.innerHTML = `
        <h2 class="text-4xl font-black ${color} mb-2 uppercase italic tracking-tighter">Victory!</h2>
        <p class="text-white text-lg mb-6">${winnerName} has won the match</p>
        <button id="rematch-btn" class="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-cyan-400 transition-colors">
            PLAY AGAIN
        </button>
    `;

    container.querySelector('#rematch-btn')?.addEventListener('click', () => {
        socket.emit('joinGame');
        showWaiting();
    });
  };

  // --- Socket.io Listeners ---

  // 1. When the game starts (Both players joined)
  socket.on('gameStarted', (p1: string, p2: string) => {
    p1AliasEl.textContent = p1;
    p2AliasEl.textContent = p2;
    hideOverlay();
  });

  // 2. When the game ends
  socket.on('finished', (data: any) => {
    onGameStateUpdate(data.state)
    const winnerLabel = `Player ${data.winner}`;
    showWinner(winnerLabel);
  });

  // // 3. Optional: If a player leaves mid-game
  // socket.on('playerDisconnected', () => {
  //   showWaiting();
  // });

  // RENDERING FUNCTION
  const render = (state: GameState) => {
    // 1. Clear Canvas
    if (state) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Center Line
      ctx.setLineDash([10, 15]);
      ctx.strokeStyle = '#1e293b'; // Slate-800
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 3. Draw Paddles with Neon Glow
      ctx.shadowBlur = 15;

      // Player 1 (Left)
      ctx.shadowColor = '#22d3ee'; // Cyan
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(state.p1X, state.p1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Player 2 (Right)
      ctx.shadowColor = '#f43f5e'; // Rose
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(state.p2X, state.p2Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // 4. Draw Ball
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // 5. Update Scoreboard text
      p1ScoreEl.textContent = state.score.p1.toString();
      p2ScoreEl.textContent = state.score.p2.toString();
    }
    // requestAnimationFrame(render(state))
  };

  const loop = () => {
    render(serverState);
    // activeKeys.forEach(direction => {
    //   socket.emit('gameKey', direction);
    // });
    requestAnimationFrame(loop);
  }

  function startInputLoop() {
    setInterval(() => {
      // If there are directions being held, emit them
      activeKeys.forEach((direction) => {
        socket.emit('gameKey', direction);
        // console.log(`Emitting continuous input: ${direction}`);
      });
    }, interval); // Adjust this number (ms) for repeat speed
  }

    // SOCKET LISTENERS
    const onGameStateUpdate = (state: GameState) => {
      serverState = state;
      // We use requestAnimationFrame to ensure the draw happens 
      // synced with the monitor's refresh rate
      // requestAnimationFrame(() => render(state));
    };

  function handleKeyDown(event: KeyboardEvent) {
    const direction = KEY_MAP[event.key];
    if (direction) {
      activeKeys.add(direction);
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    const direction = KEY_MAP[event.key];
    if (direction) {
      activeKeys.delete(direction);
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  startInputLoop();


  socket.on('gameState', onGameStateUpdate);

  requestAnimationFrame(loop)


  // RETURN FOR ROUTER
  // return {
  //   element: container,
  //   cleanup: () => {
  //     // Very important: Stop listening when user leaves the page
  //     socket.off('gameState', onGameStateUpdate);
  //     window.removeEventListener('keydown', onKeyDown);
  //   }
  // };
  return container
}