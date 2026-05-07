/**
 * Stacks Hurry - UI Manager
 * Handles all screen transitions, toasts, and dynamic UI updates
 */

// ─── Screen Management ───

const screens = {};

export function initUI() {
  ['menu', 'game', 'gameover', 'leaderboard', 'stats'].forEach(name => {
    screens[name] = document.getElementById(`screen-${name}`);
  });
}

export function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  if (screens[name]) {
    screens[name].classList.add('active');
  }
}

// ─── Wallet UI ───

export function showWalletConnected(address) {
  const btn = document.getElementById('btn-connect-wallet');
  const info = document.getElementById('wallet-info');
  const addrEl = document.getElementById('wallet-address');

  btn.textContent = '✓ Connected';
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.6';

  const short = address.slice(0, 8) + '...' + address.slice(-6);
  addrEl.textContent = short;
  info.classList.remove('hidden');

  // Enable buttons
  document.getElementById('btn-play').disabled = false;
  document.getElementById('btn-mint-nft').disabled = false;
  document.getElementById('btn-my-stats').disabled = false;
}

// ─── HUD Updates ───

export function updateHUDScore(score) {
  const el = document.getElementById('hud-score');
  if (el) el.textContent = score.toLocaleString();
}

export function updateHUDLives(lives) {
  const el = document.getElementById('hud-lives');
  if (el) el.textContent = '❤️'.repeat(Math.max(0, lives));
}

export function updateHUDLevel(level) {
  const el = document.getElementById('hud-level');
  if (el) el.textContent = level;
}

// ─── Game Over UI ───

export function showGameOver(data) {
  document.getElementById('final-score').textContent = data.score.toLocaleString();
  document.getElementById('final-level').textContent = data.level;
  document.getElementById('final-asteroids').textContent = data.asteroidsDestroyed;
  showScreen('gameover');
}

// ─── Countdown ───

export function runCountdown(callback) {
  const overlay = document.getElementById('game-start-overlay');
  const countdownEl = document.getElementById('countdown');
  overlay.classList.remove('hidden');

  let count = 3;
  countdownEl.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else if (count === 0) {
      countdownEl.textContent = 'GO!';
    } else {
      clearInterval(interval);
      overlay.classList.add('hidden');
      callback();
    }
  }, 800);
}

// ─── Leaderboard UI ───

export function renderLeaderboard(entries) {
  const list = document.getElementById('leaderboard-list');
  const countEl = document.getElementById('lb-player-count');

  if (!entries || entries.length === 0) {
    list.innerHTML = `
      <div class="leaderboard-loading">
        <p>No scores recorded yet. Be the first!</p>
      </div>
    `;
    countEl.textContent = '0 Players';
    return;
  }

  countEl.textContent = `${entries.length} Player${entries.length > 1 ? 's' : ''}`;

  list.innerHTML = entries.map((entry, i) => {
    const rank = i + 1;
    const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const addr = entry.address.slice(0, 8) + '...' + entry.address.slice(-4);

    return `
      <div class="lb-entry ${rankClass}">
        <div class="lb-rank">${rankIcon}</div>
        <div class="lb-address">${addr}</div>
        <div class="lb-score">${entry.score.toLocaleString()}</div>
      </div>
    `;
  }).join('');
}

export function showLeaderboardLoading() {
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = `
    <div class="leaderboard-loading">
      <div class="spinner"></div>
      <p>Loading scores from Stacks blockchain...</p>
    </div>
  `;
}

// ─── Stats UI ───

export function renderStats(data) {
  document.getElementById('stat-highscore').textContent = (data.highScore || 0).toLocaleString();
  document.getElementById('stat-games').textContent = (data.gamesPlayed || 0).toLocaleString();
  document.getElementById('stat-halloffame').textContent = (data.hallOfFameScore || 0).toLocaleString();

  if (data.lastPlayed && data.lastPlayed > 0) {
    document.getElementById('stat-lastplayed').textContent = `Block #${data.lastPlayed}`;
  } else {
    document.getElementById('stat-lastplayed').textContent = 'N/A';
  }
}

// ─── Mint Modal ───

export function showMintModal() {
  document.getElementById('modal-mint').classList.remove('hidden');
}

export function hideMintModal() {
  document.getElementById('modal-mint').classList.add('hidden');
}

// ─── Toast Notifications ───

export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
