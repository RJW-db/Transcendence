import { socket } from '../services/socket'

export function Navbar() {
  const nav = document.createElement('nav');
  
  // GLASSMORPHISM: Desktop-optimized styling
  nav.className = 'sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800';

  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-8">
      <div class="flex justify-between h-16">
        
        <!-- LEFT SIDE: Logo & Navigation -->
        <div class="flex items-center gap-10">
          <!-- Logo -->
          <a href="/" data-link class="flex items-center group">
            <span class="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 group-hover:from-cyan-300 group-hover:to-indigo-400 transition-all">
              PONG
            </span>
          </a>
          
          <!-- Desktop Navigation -->
          <div class="flex items-center space-x-4">
            <a href="/" data-link class="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-all">Home</a>
            
            <!-- MATCHES DROPDOWN -->
            <div class="relative" id="matches-container">
              <button id="matches-menu-btn" class="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-all focus:outline-none">
                Matches
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              <div id="matches-menu" class="hidden absolute left-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 ring-1 ring-white/5">
                <div class="px-4 py-2 border-b border-slate-800 mb-1">
                  <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Game Modes</p>
                </div>
                <a href="/matches/player" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Player vs Player</a>
                <a href="/matches/ai" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Player vs AI</a>
                <a href="/matches/local" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Player vs Player (local)</a>
              </div>
            </div>

            <a href="/tournaments" data-link class="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-all">Tournaments</a>
          </div>
        </div>

        <!-- RIGHT SIDE: Profile Dropdown -->
        <div class="flex items-center">
          <div class="relative ml-3" id="profile-container">
            <button id="profile-menu-btn" class="flex items-center gap-3 p-1 pr-3 rounded-full bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
              <img class="h-8 w-8 rounded-full border border-slate-600 object-cover" src="https://ui-avatars.com/api/?name=Player&background=06b6d4&color=fff" alt="User profile">
              <span class="text-sm font-medium text-slate-200">Account</span>
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <!-- Profile Dropdown Menu -->
            <div id="login-menu" class="hidden absolute right-0 mt-3 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 ring-1 ring-white/5">
              <div class="px-4 py-2 border-b border-slate-800 mb-1">
                <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Welcome!</p>
              </div>
              <a href="/login" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Sign In</a>
              <a href="/register" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Create Account</a>
            </div>
            <div id="profile-menu" class="hidden absolute right-0 mt-3 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 ring-1 ring-white/5">
              <div class="px-4 py-2 border-b border-slate-800 mb-1">
                <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">User Settings</p>
              </div>
              <a href="/profile" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Your Profile</a>
              <a href="/dashboard" data-link class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors">Dashboard</a>
              <div class="h-px bg-slate-800 my-1"></div>
              <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">Sign Out</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // --- INTERACTIVE LOGIC ---

  const profileBtn = nav.querySelector('#profile-menu-btn');
  const profileMenu = nav.querySelector('#profile-menu');
  const loginMenu = nav.querySelector('#login-menu');
  const matchesBtn = nav.querySelector('#matches-menu-btn');
  const matchesMenu = nav.querySelector('#matches-menu');

  // Toggle Profile Dropdown
  profileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    matchesMenu?.classList.add('hidden'); // Close other dropdown
    if (localStorage.getItem('token') === null)
    {
      loginMenu?.classList.toggle('hidden');
    }
    else
      profileMenu?.classList.toggle('hidden');
  });

  // Toggle Matches Dropdown
  matchesBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu?.classList.add('hidden'); // Close other dropdown
    matchesMenu?.classList.toggle('hidden');
  });

  // Close menus when clicking anywhere else
  window.addEventListener('click', () => {
    profileMenu?.classList.add('hidden');
    matchesMenu?.classList.add('hidden');
  });

  // Logout Logic
  const handleLogout = () => {
    console.log("User logged out");
    // Your redirect/cleanup logic here
  };
  nav.querySelector('#logout-btn')?.addEventListener('click', handleLogout);

  return nav;
}