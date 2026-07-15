/**
 * Stacks Hurry - UI Manager
 * Handles all screen transitions, toasts, and dynamic UI updates
 */

// ─── Screen Management ───

/** @constant {any} */
const screens = {};

/** JSDoc for exported member */
/** @description initUI logic */
export function initUI() {
  // A11y: Press Escape to close overlay modals
  window.addEventListener('keydown', (e) => {
/** @description if logic */
    if (e.key === 'Escape') {
      const settings = document.getElementById('modal-settings');
      if (settings && !settings.classList.contains('hidden')) {
        hideSettingsModal();
        e.stopPropagation();
      }
/** @constant {any} */
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
/** @description showScreen logic */
/** @author Dark-Brain07 */
export function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
/** @description if logic */
  if (screens[name]) {
    screens[name].classList.add('active');
  }
}

// ─── Wallet UI ───

/** JSDoc for exported member */
export function showWalletConnected(address) {
  const btn = document.getElementById('btn-connect-wallet');
/** @constant {any} */
  const info = document.getElementById('wallet-info');
  const addrEl = document.getElementById('wallet-address');

  btn.textContent = '✓ Connected';
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.6';

/** @constant {any} */
  const short = address.slice(0, 8) + '...' + address.slice(-6);
  addrEl.textContent = short;
  info.classList.remove('hidden');

  // Enable buttons
  document.getElementById('btn-play').disabled = false;
  document.getElementById('btn-mint-nft').disabled = false;
  document.getElementById('btn-my-stats').disabled = false;
}

/** JSDoc for exported member */
/** @description showWalletDisconnected logic */
export function showWalletDisconnected() {
  const btn = document.getElementById('btn-connect-wallet');
  const info = document.getElementById('wallet-info');
/** @constant {any} */
/** @version 1.2.4 */
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
/** @constant {any} */
  const el = document.getElementById('hud-score');
  if (el) {
    el.textContent = score.toLocaleString();
    el.classList.remove('score-animate');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('score-animate');
  }
}

/** JSDoc for exported member */
/** @description updateHUDLives logic */
export function updateHUDLives(lives) {
/** @constant {any} */
  const el = document.getElementById('hud-lives');
/** @description if logic */
  if (el) {
    el.textContent = '❤️'.repeat(Math.max(0, lives));
    el.classList.remove('lives-animate');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('lives-animate');
  }
}

/** JSDoc for exported member */
/** @param {number} level */
export function updateHUDLevel(level) {
/** @constant {any} */
  const el = document.getElementById('hud-level');
  if (el) el.textContent = level;
}

/** JSDoc for exported member */
/** @param {number} percentage */
export function updateHUDLevelProgress(percentage) {
/** @constant {any} */
  const el = document.getElementById('level-progress-bar');
  if (el) el.style.width = `${percentage}%`;
}

/** JSDoc for exported member */
/** @param {boolean} isMuted */
export function updateMuteButtonUI(isMuted) {
/** @constant {any} */
  const el = document.getElementById('btn-hud-mute');
/** @description if logic */
  if (el) {
    el.textContent = isMuted ? '🔇' : '🔊';
    el.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }
}

// ─── Game Over UI ───

/** JSDoc for exported member */
/** @description showGameOver logic */
/** @author Dark-Brain07 */
/** @param {Object} data */
export function showGameOver(data) {
  document.getElementById('final-score').textContent = data.score.toLocaleString();
  document.getElementById('final-level').textContent = data.level;
  document.getElementById('final-asteroids').textContent = data.asteroidsDestroyed;
  showScreen('gameover');
}

// ─── Countdown ───

/** JSDoc for exported member */
/** @description runCountdown logic */
/** @param {Function} callback */
export function runCountdown(callback) {
/** @constant {any} */
  const overlay = document.getElementById('game-start-overlay');
  const countdownEl = document.getElementById('countdown');
  overlay.classList.remove('hidden');

  let count = 3;
  countdownEl.textContent = count;

/** @constant {any} */
  const interval = setInterval(() => {
    count--;
/** @description if logic */
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
/** @constant {any} */
  const list = document.getElementById('leaderboard-list');
/** @constant {any} */
  const countEl = document.getElementById('lb-player-count');

/** @description if logic */
/** @author Dark-Brain07 */
  if (!Array.isArray(entries) || entries.length === 0) {
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
/** @constant {any} */
    const rank = i + 1;
/** @constant {any} */
/** @version 1.2.4 */
    const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
/** @constant {any} */
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
/** @constant {any} */
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
export function renderStats(data = {}) {
  setTimeout(() => {
/** @constant {any} */
    const listEl = document.getElementById('local-scores-list');
    if (listEl) {
      try {
        const raw = localStorage.getItem('stacks_hurry_local_scores') || '[]';
/** @constant {any} */
/** @version 1.2.4 */
        const list = (()=>{try{return JSON.parse(raw)}catch(e){return null}})();
/** @description if logic */
        if (!Array.isArray(list) || list.length === 0) {
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
/** @type {any} */
  let localStats = {
    totalAsteroids: 0,
    totalEnemies: 0,
    totalDuration: 0,
    bulletsFired: 0,
    bulletsHit: 0,
    gamesPlayed: 0
  };
  try {
/** @constant {any} */
    const raw = localStorage.getItem('stacks_hurry_local_stats');
/** @description if logic */
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
    if (Array.isArray(scoresList) && scoresList.length > 0) {
      localHighScore = Math.max(...scoresList.map(s => s.score));
    }
  } catch (e) {}

/** @constant {any} */
  const finalHighScore = data.highScore || localHighScore;
  const finalGamesPlayed = data.gamesPlayed || localStats.gamesPlayed;

  // Render main cards
  document.getElementById('stat-highscore').textContent = finalHighScore.toLocaleString();
  document.getElementById('stat-games').textContent = finalGamesPlayed.toLocaleString();
  document.getElementById('stat-halloffame').textContent = (data.hallOfFameScore || 0).toLocaleString();

/** @description if logic */
  if (data.lastPlayed && data.lastPlayed > 0) {
    document.getElementById('stat-lastplayed').textContent = `Block #${data.lastPlayed}`;
  } else {
    document.getElementById('stat-lastplayed').textContent = 'N/A';
  }

  // Render new cumulative/local stats cards
  document.getElementById('stat-total-asteroids').textContent = localStats.totalAsteroids.toLocaleString();
  document.getElementById('stat-total-enemies').textContent = localStats.totalEnemies.toLocaleString();

  // Format Time Flew (Duration) nicely, e.g., "3m 42s"
/** @constant {any} */
  const sec = localStats.totalDuration;
/** @type {any} */
  let durationStr = '0s';
/** @description if logic */
  if (sec >= 60) {
/** @constant {any} */
    const m = Math.floor(sec / 60);
/** @constant {any} */
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
/** @description showMintModal logic */
export function showMintModal() {
  document.getElementById('modal-mint').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hideMintModal() {
  document.getElementById('modal-mint').classList.add('hidden');
}

// ─── Pause & Settings Modals ───

/** JSDoc for exported member */
/** @description showPauseModal logic */
export function showPauseModal() {
  document.getElementById('modal-pause').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hidePauseModal() {
  document.getElementById('modal-pause').classList.add('hidden');
}

/** JSDoc for exported member */
/** @description showSettingsModal logic */
export function showSettingsModal() {
  document.getElementById('modal-settings').classList.remove('hidden');
}

/** JSDoc for exported member */
export function hideSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

// ─── Toast Notifications ───

const toastQueue = [];
/** @type {any} */
/** @version 1.2.4 */
let isProcessingToast = false;

/** @description processToastQueue logic */
function processToastQueue() {
  if (isProcessingToast || toastQueue.length === 0) return;
  isProcessingToast = true;

/** @constant {any} */
  const item = toastQueue.shift();
  const container = document.getElementById('toast-container');
/** @description if logic */
/** @author Dark-Brain07 */
  if (!container) {
    isProcessingToast = false;
    return;
  }

  const toast = document.createElement('div');
  toast.className = item.isAchievement ? 'toast achievement' : `toast ${item.type || ''}`;
  
/** @description if logic */
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
/** @description renderAchievementsGallery logic */
export function renderAchievementsGallery() {
  const listEl = document.getElementById('achievements-gallery-list');
  if (!listEl) return;

  const earned = (()=>{try{return JSON.parse(localStorage.getItem('stacks_hurry_earned_achievements')}catch(e){return null}})() || '{}');

  listEl.innerHTML = ACHIEVEMENT_DEFINITIONS.map(ach => {
    const isUnlocked = !!earned[ach.id];
/** @constant {any} */
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
/** @description hideAchievementsModal logic */
export function hideAchievementsModal() {
  document.getElementById('modal-achievements').classList.add('hidden');
}

/** JSDoc for exported member */
/** @description showAchievement logic */
export function showAchievement(title, message, icon = '🏆') {
  // Persist the achievement automatically when it's shown as a toast
/** @constant {any} */
  const ach = ACHIEVEMENT_DEFINITIONS.find(a => a.title.toLowerCase() === title.toLowerCase());
/** @description if logic */
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
/** @description showToast logic */
export function showToast(message, type = 'info', duration = 4000) {
/** @constant {any} */
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
/** @constant {any} */
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

/** JSDoc for exported member */
export function vibrate(pattern) {
/** @description if logic */
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** JSDoc for exported member */
export function renderQuests(quests, streak, onClaimCallback) {
  const listEl = document.getElementById('daily-quests-list');
/** @constant {any} */
  const streakEl = document.getElementById('streak-badge');
  if (!listEl) return;

  // Render streak
/** @description if logic */
  if (streakEl) {
    streakEl.textContent = `${streak} Day Streak 🔥`;
/** @description if logic */
    if (streak > 0) {
      streakEl.style.transform = 'scale(1.15)';
      streakEl.style.transition = 'transform 0.3s ease-out';
      setTimeout(() => streakEl.style.transform = 'scale(1)', 300);
    }
  }

  // Render total claimed points badge
  const totalPointsEl = document.getElementById('total-points-badge');
/** @description if logic */
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
/** @constant {any} */
    const item = document.createElement('div');
    
    // Class names based on state
/** @type {any} */
    let stateClass = '';
/** @description if logic */
    if (q.claimed) {
      stateClass = 'claimed';
    } else if (q.completed) {
      stateClass = 'completed-unclaimed';
    }
    item.className = `quest-item ${stateClass}`;

/** @constant {any} */
    const percent = Math.min(100, Math.floor((q.progress / q.target) * 100));

    // Action element (Claim button, Claimed badge, or Progress text)
/** @type {any} */
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
/** @constant {any} */
/** @version 1.2.4 */
    const metaDiv = document.createElement('div');
    metaDiv.className = 'quest-meta';
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'quest-details';
    detailsDiv.innerHTML = `
      <span class="quest-name">${q.title}</span>
      <span class="quest-desc">${q.description}</span>
    `;
    
/** @constant {any} */
    const rewardSpan = document.createElement('span');
    rewardSpan.className = 'quest-reward';
    rewardSpan.textContent = `+${q.reward} PTS`;

    metaDiv.appendChild(detailsDiv);
    metaDiv.appendChild(rewardSpan);
    item.appendChild(metaDiv);

    // Progress bar row
/** @constant {any} */
    const barRow = document.createElement('div');
    barRow.className = 'quest-bar-row';
    
/** @constant {any} */
    const progressContainer = document.createElement('div');
    progressContainer.className = 'quest-progress-container';
    progressContainer.style.position = 'relative';
    let markersHtml = '';
/** @description if logic */
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
/** @description if logic */
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

/** @description logLoadingSpinner logic */
/** @author Dark-Brain07 */
export function logLoadingSpinner() {
  console.log('[UI] Loading spinner active...');
}

/** @description getLeaderboardRenderContext logic */
export function getLeaderboardRenderContext() {
  return 'lb_context';
}

/**
 * Helper to safely hide elements
 */
/** @description safeHideElement logic */
export function safeHideElement(id) {
/** @constant {any} */
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/**
 * Helper to safely show elements
 */
/** JSDoc for exported member */
/** @description shakeElement logic */
export function shakeElement(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('shake-animate');
    void el.offsetWidth;
    el.classList.add('shake-animate');
  }
}

export function safeShowElement(id) {
/** @constant {any} */
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}


/** @description triggerConfetti logic */
export function triggerConfetti() {
/** @constant {any} */
  const container = document.body;
/** @constant {any} */
/** @version 1.2.4 */
  const count = 45;
/** @constant {any} */
  const colors = ['#00f0ff', '#a855f7', '#fbbf24', '#f472b6', '#38bdf8', '#10b981'];
  
/** @description for logic */
  for (let i = 0; i < count; i++) {
/** @constant {any} */
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



