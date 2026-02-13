interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface Match {
  id: string;
  player1: Player | null;
  player2: Player | null;
  score1?: number;
  score2?: number;
  winnerId?: string;
  status: 'upcoming' | 'live' | 'completed';
}

interface Round {
  title: string;
  matches: Match[];
}

// Mock Data for demonstration
const mockRounds: Round[] = [
  { 
    title: "Round of 32", 
    matches: Array.from({ length: 16 }, (_, i) => ({
      id: `r1-m${i}`,
      player1: { id: '1', name: 'Alpha_Pongo' },
      player2: { id: '2', name: 'Beta_Bot' },
      score1: 11, score2: 8,
      winnerId: '1',
      status: 'completed'
    }))
  },
  { title: "Round of 16", matches: Array.from({ length: 8 }, (_, i) => ({
      id: `r2-m${i}`,
      player1: { id: '1', name: 'Alpha_Pongo' },
      player2: null, // Waiting for winner
      status: 'upcoming'
    }))
  },
  { title: "Quarter-finals", matches: Array.from({ length: 4 }, (_, i) => ({ id: `r3-m${i}`, player1: null, player2: null, status: 'upcoming' })) },
  { title: "Semi-finals", matches: Array.from({ length: 2 }, (_, i) => ({ id: `r4-m${i}`, player1: null, player2: null, status: 'upcoming' })) },
  { title: "Final", matches: [{ id: `r5-m1`, player1: null, player2: null, status: 'upcoming' }] },
];

export function tournament() {
  const currentRoundIndex = 1; // Round of 16 is "Live"
  const container = document.createElement('div');
  container.className = 'min-h-screen p-4 md:p-8 text-slate-200';

  container.innerHTML = `
    <!-- Header Section -->
    <div class="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 uppercase tracking-tighter">
          Winter Championship 2024
        </h1>
        <p class="text-slate-500 mt-2 font-medium">32 Players • Single Elimination • $500 Prize Pool</p>
      </div>
      
      <!-- Current Status Badge -->
      <div class="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full backdrop-blur-sm">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
        <span class="text-sm font-bold text-cyan-400 uppercase tracking-widest">Live: ${mockRounds[currentRoundIndex].title}</span>
      </div>
    </div>

    <!-- Bracket Container (Horizontal Scroll) -->
    <div class="relative w-full overflow-x-auto pb-12 no-scrollbar cursor-grab active:cursor-grabbing" id="bracket-scroll">
      <div class="flex gap-12 min-w-max px-4">
        ${mockRounds.map((round, idx) => renderRound(round, idx, currentRoundIndex)).join('')}
      </div>
    </div>
  `;

  return container;
}

function renderRound(round: Round, index: number, currentIdx: number): string {
  const isCurrent = index === currentIdx;
  const opacity = index < currentIdx ? 'opacity-50' : 'opacity-100';

  return `
    <div class="flex flex-col gap-6 w-64 ${opacity}">
      <div class="text-center pb-4 border-b border-slate-800">
        <h3 class="text-xs uppercase tracking-[0.2em] font-black ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}">
          ${round.title}
        </h3>
      </div>
      
      <div class="flex flex-col justify-around flex-grow gap-8">
        ${round.matches.map(m => renderMatch(m)).join('')}
      </div>
    </div>
  `;
}

function renderMatch(match: Match): string {
  const p1Winner = match.winnerId === match.player1?.id;
  const p2Winner = match.winnerId === match.player2?.id;

  return `
    <div class="group relative">
      <!-- Glow Effect for Live/Completed Matches -->
      ${match.status !== 'upcoming' ? '<div class="absolute -inset-0.5 bg-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>' : ''}
      
      <div class="relative bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <!-- Player 1 -->
        <div class="flex items-center justify-between p-3 border-b border-slate-800/50 ${p1Winner ? 'bg-cyan-500/5' : ''}">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full ${p1Winner ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}"></div>
            <span class="text-sm font-semibold ${p1Winner ? 'text-white' : 'text-slate-400'}">
              ${match.player1?.name || '---'}
            </span>
          </div>
          <span class="font-mono text-sm ${p1Winner ? 'text-cyan-400 font-bold' : 'text-slate-600'}">
            ${match.score1 ?? ''}
          </span>
        </div>

        <!-- Player 2 -->
        <div class="flex items-center justify-between p-3 ${p2Winner ? 'bg-cyan-500/5' : ''}">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full ${p2Winner ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}"></div>
            <span class="text-sm font-semibold ${p2Winner ? 'text-white' : 'text-slate-400'}">
              ${match.player2?.name || '---'}
            </span>
          </div>
          <span class="font-mono text-sm ${p2Winner ? 'text-cyan-400 font-bold' : 'text-slate-600'}">
            ${match.score2 ?? ''}
          </span>
        </div>
      </div>
    </div>
  `;
}