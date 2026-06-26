/**
 * Stacks Hurry - UI Manager
 * Handles all screen transitions, toasts, and dynamic UI updates
 */

// ─── Screen Management ───

const screens = {};

/** JSDoc for exported member */
export function initUI() {
  // A11y: Press Escape to close overlay modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const settings = document.getElementById('modal-settings');
      if (settings && !settings.classList.contains('hidden')) {
        hideSettingsModal();
        e.stopPropagation();
      }
      const mint = document.getElementById('modal-mint');
      if (mint && !mint.classList.contains('hidden')) {
        hideMintModal();
        e.stopPropagation();
      }
    }
  });
  ['menu', 'game', 'gameover', 'leaderboard', 'stats'].forEach(name => {
    screens[name] = document.getElementById(`screen-${name}`);
  });
}

/** JSDoc for exported member */
export function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  if (screens[name]) {
    screens[name].classList.add('active');
  }
}

// ─── Wallet UI ───

/** JSDoc for exported member */
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

/** JSDoc for exported member */
export function showWalletDisconnected() {
  const btn = document.getElementById('btn-connect-wallet');
  const info = document.getElementById('wallet-info');
  const addrEl = document.getElementById('wallet-address');

  // Reset connect button
  btn.innerHTML = '<span class="btn-icon">⚡</span> Connect Wallet';
  btn.style.pointerEvents = '';
  btn.style.opacity = '';

  // Hide wallet info
  addrEl.textContent = '';
  info.classList.add('hidden');

  // Disable wallet-gated buttons
  document.getElementById('btn-play').disabled = true;
  document.getElementById('btn-mint-nft').disabled = true;
  document.getElementById('btn-my-stats').disabled = true;
}

// ─── HUD Updates ───

/** JSDoc for exported member */
export function updateHUDScore(score) {
  const el = document.getElementById('hud-score');
  if (el) {
    el.textContent = score.toLocaleString();
    el.classList.remove('score-animate');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('score-animate');
  }
}

/** JSDoc for exported member */
export function updateHUDLives(lives) {
  const el = document.getElementById('hud-lives');
  if (el) {
    el.textContent = '❤️'.repeat(Math.max(0, lives));
    el.classList.remove('lives-animate');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('lives-animate');
  }
}

/** JSDoc for exported member */
export function updateHUDLevel(level) {
  const el = document.getElementById('hud-level');
  if (el) el.textContent = level;
}

/** JSDoc for exported member */
export function updateHUDLevelProgress(percentage) {
  const el = document.getElementById('level-progress-bar');
  if (el) el.style.width = `${percentage}%`;
}

/** JSDoc for exported member */
export function updateMuteButtonUI(isMuted) {
  const el = document.getElementById('btn-hud-mute');
  if (el) {
    el.textContent = isMuted ? '🔇' : '🔊';
    el.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }
}

// ─── Game Over UI ───

/** JSDoc for exported member */
export function showGameOver(data) {
  document.getElementById('final-score').textContent = data.score.toLocaleString();
  document.getElementById('final-level').textContent = data.level;
  document.getElementById('final-asteroids').textContent = data.asteroidsDestroyed;
  showScreen('gameover');
}

// ─── Countdown ───

/** JSDoc for exported member */
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

/** JSDoc for exported member */
export function renderLeaderboard(entries, isLocal = false) {
  const list = document.getElementById('leaderboard-list');
  const countEl = document.getElementById('lb-player-count');

  if (!entries || entries.length === 0) {
    list.innerHTML = `
      <div class="leaderboard-loading">
        <p>${isLocal ? 'No local scores recorded yet. Play a game to set a record!' : 'No scores recorded yet. Be the first!'}</p>
      </div>
    `;
    countEl.textContent = '0 Players';
    return;
  }

  countEl.textContent = isLocal 
    ? `${entries.length} Score${entries.length > 1 ? 's' : ''}`
    : `${entries.length} Player${entries.length > 1 ? 's' : ''}`;

  list.innerHTML = entries.map((entry, i) => {
    const rank = i + 1;
    const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const addr = isLocal ? `Pilot #${rank} (${entry.date || 'Today'})` : (entry.address.slice(0, 8) + '...' + entry.address.slice(-4));

    return `
      <div class="lb-entry ${rankClass}">
        <div class="lb-rank">${rankIcon}</div>
        <div class="lb-address">${addr}</div>
        <div class="lb-score">${entry.score.toLocaleString()}</div>
      </div>
    `;
  }).join('');
}

/** JSDoc for exported member */
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

/** JSDoc for exported member */
export function renderStats(data) {
  setTimeout(() => {
    const listEl = document.getElementById('local-scores-list');
    if (listEl) {
      try {
        const raw = localStorage.getItem('stacks_hurry_local_scores') || '[]';
        const list = (()=>{try{return JSON.parse(raw)}catch(e){return null}})();
        if (list.length === 0) {
          listEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 13px;">No local scores yet. Start playing!</div>';
        } else {
          listEl.innerHTML = list.map((item, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--cyan); font-weight: bold;">#${idx + 1}</span>
                <span style="color: var(--text-secondary); font-size: 11px;">${item.date} ${item.time}</span>
              </div>
              <strong style="color: var(--gold); font-family: var(--font-display);">${item.score.toLocaleString()}</strong>
            </div>
          `).join('');
        }
      } catch (e) {
        listEl.innerHTML = '<div style="text-align: center; color: var(--red); font-size: 13px;">Failed to load local scores.</div>';
      }
    }
  }, 10);

  // Load cumulative statistics from local storage
  let localStats = {
    totalAsteroids: 0,
    totalEnemies: 0,
    totalDuration: 0,
    bulletsFired: 0,
    bulletsHit: 0,
    gamesPlayed: 0
  };
  try {
    const raw = localStorage.getItem('stacks_hurry_local_stats');
    if (raw) {
      localStats = { ...localStats, ...(()=>{try{return JSON.parse(raw)}catch(e){return null}})() };
    }
  } catch (e) {
    /* log removed */
  }

  // Load local high score from local scores list as fallback
  let localHighScore = 0;
  try {
    const scoresList = (()=>{try{return JSON.parse(localStorage.getItem('stacks_hurry_local_scores')}catch(e){return null}})() || '[]');
    if (scoresList.length > 0) {
      localHighScore = Math.max(...scoresList.map(s => s.score));
    }
  } catch (e) {}

  const finalHighScore = data.highScore || localHighScore;
  const finalGamesPlayed = data.gamesPlayed || localStats.gamesPlayed;

  // Render main cards
  document.getElementById('stat-highscore').textContent = finalHighScore.toLocaleString();
  document.getElementById('stat-games').textContent = finalGamesPlayed.toLocaleString();
  document.getElementById('stat-halloffame').textContent = (data.hallOfFameScore || 0).toLocaleString();

  if (data.lastPlayed && data.lastPlayed > 0) {
    document.getElementById('stat-lastplayed').textContent = `Block #${data.lastPlayed}`;
  } else {
    document.getElementById('stat-lastplayed').textContent = 'N/A';
  }

  // Render new cumulative/local stats cards
  document.getElementById('stat-total-asteroids').textContent = localStats.totalAsteroids.toLocaleString();
  document.getElementById('stat-total-enemies').textContent = localStats.totalEnemies.toLocaleString();

  // Format Time Flew (Duration) nicely, e.g., "3m 42s"
  const sec = localStats.totalDuration;
  let durationStr = '0s';
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    durationStr = `${m}m ${s}s`;
  } else {
    durationStr = `${sec}s`;
  }
  document.getElementById('stat-total-duration').textContent = durationStr;

  // Calculate and format Shot Accuracy percentage
  const accuracy = localStats.bulletsFired > 0
    ? Math.min(100, Math.round((localStats.bulletsHit / localStats.bulletsFired) * 100))
    : 0;
  document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
}

// ─── Mint Modal ───

/** JSDoc for exported member */
export function showMintModal() {
  document.getElementById('modal-mint').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hideMintModal() {
  document.getElementById('modal-mint').classList.add('hidden');
}

// ─── Pause & Settings Modals ───

/** JSDoc for exported member */
export function showPauseModal() {
  document.getElementById('modal-pause').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hidePauseModal() {
  document.getElementById('modal-pause').classList.add('hidden');
}

/** JSDoc for exported member */
export function showSettingsModal() {
  document.getElementById('modal-settings').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hideSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

// ─── Toast Notifications ───

const toastQueue = [];
let isProcessingToast = false;

function processToastQueue() {
  if (isProcessingToast || toastQueue.length === 0) return;
  isProcessingToast = true;

  const item = toastQueue.shift();
  const container = document.getElementById('toast-container');
  if (!container) {
    isProcessingToast = false;
    return;
  }

  const toast = document.createElement('div');
  toast.className = item.isAchievement ? 'toast achievement' : `toast ${item.type || ''}`;
  
  if (item.isAchievement) {
    toast.innerHTML = `
      <div class="toast-icon">${item.icon}</div>
      <div class="toast-content">
        <div class="toast-title">${item.title}</div>
        <div class="toast-msg">${item.message}</div>
      </div>
    `;
  } else {
    toast.innerHTML = `
      <div class="toast-icon">${item.icon}</div>
      <div class="toast-content">
        <div class="toast-msg">${item.message}</div>
      </div>
    `;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
      isProcessingToast = false;
      processToastQueue();
    });
  }, item.duration || 3000);
}

/** JSDoc for exported member */
export const ACHIEVEMENT_DEFINITIONS = [
  { id: 'score1k', title: 'SCORE MASTER', desc: 'Reach 1,000 points', icon: '💎' },
  { id: 'score5k', title: 'GRAND MASTER', desc: 'Reach 5,000 points', icon: '🏆' },
  { id: 'level5', title: 'ELITE PILOT', desc: 'Reach Level 5', icon: '🚀' },
  { id: 'asteroids50', title: 'DESTROYER', desc: 'Smash 50 asteroids', icon: '💥' }
];

/** JSDoc for exported member */
export function renderAchievementsGallery() {
  const listEl = document.getElementById('achievements-gallery-list');
  if (!listEl) return;

  const earned = (()=>{try{return JSON.parse(localStorage.getItem('stacks_hurry_earned_achievements')}catch(e){return null}})() || '{}');

  listEl.innerHTML = ACHIEVEMENT_DEFINITIONS.map(ach => {
    const isUnlocked = !!earned[ach.id];
    const dateStr = isUnlocked ? new Date(earned[ach.id]).toLocaleDateString() : '';
    
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        ${!isUnlocked ? '<div class="achievement-lock-overlay">🔒</div>' : ''}
        <div class="achievement-icon-wrapper">
          ${ach.icon}
        </div>
        <div class="achievement-name">${ach.title}</div>
        <div class="achievement-desc">${ach.desc}</div>
        ${isUnlocked ? `<span class="achievement-date">Unlocked ${dateStr}</span>` : ''}
      </div>
    `;
  }).join('');
}

/** JSDoc for exported member */
export function showAchievementsModal() {
  renderAchievementsGallery();
  document.getElementById('modal-achievements').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hideAchievementsModal() {
  document.getElementById('modal-achievements').classList.add('hidden');
}

/** JSDoc for exported member */
export function showAchievement(title, message, icon = '🏆') {
  // Persist the achievement automatically when it's shown as a toast
  const ach = ACHIEVEMENT_DEFINITIONS.find(a => a.title.toLowerCase() === title.toLowerCase());
  if (ach) {
    const earned = (()=>{try{return JSON.parse(localStorage.getItem('stacks_hurry_earned_achievements')}catch(e){return null}})() || '{}');
    if (!earned[ach.id]) {
      earned[ach.id] = Date.now();
      localStorage.setItem('stacks_hurry_earned_achievements', JSON.stringify(earned));
    }
  }

  toastQueue.push({
    isAchievement: true,
    title,
    message,
    icon,
    duration: 4500
  });
  processToastQueue();
}


/** JSDoc for exported member */
export function showToast(message, type = 'info', duration = 4000) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const icon = icons[type] || 'ℹ️';
  toastQueue.push({
    isAchievement: false,
    message,
    type,
    icon,
    duration
  });
  processToastQueue();
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
    if (streak > 0) {
      streakEl.style.transform = 'scale(1.15)';
      streakEl.style.transition = 'transform 0.3s ease-out';
      setTimeout(() => streakEl.style.transform = 'scale(1)', 300);
    }
  }

  // Render total claimed points badge
  const totalPointsEl = document.getElementById('total-points-badge');
  if (totalPointsEl && quests) {
    const totalPoints = quests.reduce((sum, q) => q.claimed ? sum + q.reward : sum, 0);
    totalPointsEl.textContent = `🏆 ${totalPoints} PTS`;
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
    progressContainer.style.position = 'relative';
    let markersHtml = '';
    if (q.target > 10) {
      markersHtml = `
        <div style="position: absolute; left: 33.3%; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,0.3); z-index: 2;"></div>
        <div style="position: absolute; left: 66.6%; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,0.3); z-index: 2;"></div>
      `;
    }
    progressContainer.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; border-radius: inherit; overflow: hidden;">
        <div class="quest-progress-fill" style="width: ${percent}%"></div>
        ${markersHtml}
      </div>
    `;
    
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

export function logLoadingSpinner() {
  console.log('[UI] Loading spinner active...');
}

export function getLeaderboardRenderContext() {
  return 'lb_context';
}

/**
 * Helper to safely hide elements
 */
export function safeHideElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/**
 * Helper to safely show elements
 */
export function safeShowElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}


export function triggerConfetti() {
  const container = document.body;
  const count = 45;
  const colors = ['#00f0ff', '#a855f7', '#fbbf24', '#f472b6', '#38bdf8', '#10b981'];
  
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = `-2vh`;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = `${Math.random() * 8 + 6}px`;
    el.style.height = `${Math.random() * 12 + 6}px`;
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.position = 'fixed';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.borderRadius = '2px';
    
    el.style.transition = 'transform 2s cubic-bezier(0.1, 0.8, 0.3, 1), top 2s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 2s ease-out';
    
    container.appendChild(el);
    
    requestAnimationFrame(() => {
      el.style.top = `${Math.random() * 55 + 35}vh`;
      el.style.transform = `rotate(${Math.random() * 720 + 360}deg) translate(${(Math.random() - 0.5) * 150}px)`;
      el.style.opacity = '0';
    });
    
    setTimeout(() => {
      el.remove();
    }, 2000);
  }
}



