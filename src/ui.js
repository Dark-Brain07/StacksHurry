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

export function updateHUDLevelProgress(percentage) {
  const el = document.getElementById('level-progress-bar');
  if (el) el.style.width = `${percentage}%`;
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

// ─── Pause & Settings Modals ───

export function showPauseModal() {
  document.getElementById('modal-pause').classList.remove('hidden');
}

export function hidePauseModal() {
  document.getElementById('modal-pause').classList.add('hidden');
}

export function showSettingsModal() {
  document.getElementById('modal-settings').classList.remove('hidden');
}

export function hideSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

// ─── Toast Notifications ───

export function showAchievement(title, message, icon = '🏆') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4500);
}

export function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const icon = icons[type] || 'ℹ️';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

export function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function renderQuests(quests, streak, onClaimCallback) {
  const listEl = document.getElementById('daily-quests-list');
  const streakEl = document.getElementById('streak-badge');
  if (!listEl) return;

  // Render streak
  if (streakEl) {
    streakEl.textContent = `${streak} Day Streak 🔥`;
  }

  if (!quests || quests.length === 0) {
    listEl.innerHTML = '<div class="quest-item-placeholder">No quests active today.</div>';
    return;
  }

  listEl.innerHTML = '';
  quests.forEach(q => {
    const item = document.createElement('div');
    
    // Class names based on state
    let stateClass = '';
    if (q.claimed) {
      stateClass = 'claimed';
    } else if (q.completed) {
      stateClass = 'completed-unclaimed';
    }
    item.className = `quest-item ${stateClass}`;

    const percent = Math.min(100, Math.floor((q.progress / q.target) * 100));

    // Action element (Claim button, Claimed badge, or Progress text)
    let actionHtml = '';
    if (q.claimed) {
      actionHtml = '<span class="claimed-badge">Claimed ✓</span>';
    } else if (q.completed) {
      const btn = document.createElement('button');
      btn.className = 'btn-claim';
      btn.textContent = 'CLAIM';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClaimCallback(q.id);
      });
      actionHtml = btn;
    } else {
      actionHtml = `<span class="quest-progress-text">${q.progress}/${q.target}</span>`;
    }

    // Build item container
    const metaDiv = document.createElement('div');
    metaDiv.className = 'quest-meta';
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'quest-details';
    detailsDiv.innerHTML = `
      <span class="quest-name">${q.title}</span>
      <span class="quest-desc">${q.description}</span>
    `;
    
    const rewardSpan = document.createElement('span');
    rewardSpan.className = 'quest-reward';
    rewardSpan.textContent = `+${q.reward} PTS`;

    metaDiv.appendChild(detailsDiv);
    metaDiv.appendChild(rewardSpan);
    item.appendChild(metaDiv);

    // Progress bar row
    const barRow = document.createElement('div');
    barRow.className = 'quest-bar-row';
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'quest-progress-container';
    progressContainer.innerHTML = `<div class="quest-progress-fill" style="width: ${percent}%"></div>`;
    
    barRow.appendChild(progressContainer);
    if (typeof actionHtml === 'string') {
      const tempSpan = document.createElement('div');
      tempSpan.innerHTML = actionHtml;
      barRow.appendChild(tempSpan.firstElementChild || tempSpan);
    } else {
      barRow.appendChild(actionHtml);
    }

    item.appendChild(barRow);
    listEl.appendChild(item);
  });
}


  if (!state.tasks || state.tasks.length === 0) {
    listEl.innerHTML = '<div class="quest-item-placeholder">No active sprint today.</div>';
    return;
  }

  listEl.innerHTML = '';
  state.tasks.forEach(t => {
    const item = document.createElement('div');
    item.className = `workflow-item ${t.completed ? 'completed' : ''}`;
    
    item.innerHTML = `
      <div class="workflow-num">${t.completed ? '✓' : t.commitNum}</div>
      <div class="workflow-details">
        <span class="workflow-name">${t.title}</span>
        <span class="workflow-desc">${t.desc}</span>
      </div>
      <div class="workflow-status">${t.completed ? '🚀' : '⏳'}</div>
    `;
    
    listEl.appendChild(item);
  });
}

export function logLoadingSpinner() {
  console.log('[UI] Loading spinner active...');
}

export function getLeaderboardRenderContext() {
  return 'lb_context';
}
