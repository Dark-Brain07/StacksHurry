/**
 * Stacks Hurry - UI Manager
 * Handles all screen transitions, toasts, and dynamic UI updates
 */

// ─── Screen Management ───

const screens = {};

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
  if (el) {
    el.textContent = score.toLocaleString();
    el.classList.remove('score-animate');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('score-animate');
  }
}

export function updateHUDLives(lives) {
  const el = document.getElementById('hud-lives');
  if (el) {
    el.textContent = '❤️'.repeat(Math.max(0, lives));
    el.classList.remove('lives-animate');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('lives-animate');
  }
}

export function updateHUDLevel(level) {
  const el = document.getElementById('hud-level');
  if (el) el.textContent = level;
}

export function updateHUDLevelProgress(percentage) {
  const el = document.getElementById('level-progress-bar');
  if (el) el.style.width = `${percentage}%`;
}

export function updateMuteButtonUI(isMuted) {
  const el = document.getElementById('btn-hud-mute');
  if (el) {
    el.textContent = isMuted ? '🔇' : '🔊';
    el.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }
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
  setTimeout(() => {
    const listEl = document.getElementById('local-scores-list');
    if (listEl) {
      try {
        const raw = localStorage.getItem('stacks_hurry_local_scores') || '[]';
        const list = JSON.parse(raw);
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

export function showAchievement(title, message, icon = '🏆') {
  toastQueue.push({
    isAchievement: true,
    title,
    message,
    icon,
    duration: 4500
  });
  processToastQueue();
}

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



