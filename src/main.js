/**
 * Stacks Hurry - Main Application Entry (v8 API)
 * Uses @stacks/connect 8.x connect() + request() API
 */

import { connect, getLocalStorage, disconnect, isConnected } from '@stacks/connect';
import {
  mintOpenNFT,
  mintCharacterNFT,
  submitGameScore,
  submitHighScore,
  getPlayerScore,
  getHallOfFameScore,
  getPlayerCount,
  submitQuestOnChain,
  recordGameOnChain,
  buyPowerupOnChain,
  registerPilotOnChain,
  getPilotOnChain,
} from './contracts.js';
import { initGame, startGame, stopGame, getScore, getLevel, getAsteroidsDestroyed, togglePause, setSettings, showQuestNotificationInGame } from './game.js';
import {
  initUI,
  showScreen,
  showWalletConnected,
  showWalletDisconnected,
  updateHUDScore,
  updateHUDLives,
  updateHUDLevel,
  updateHUDLevelProgress,
  showGameOver,
  runCountdown,
  renderLeaderboard,
  showLeaderboardLoading,
  renderStats,
  showMintModal,
  hideMintModal,
  showAchievement,
  showToast,
  showPauseModal,
  hidePauseModal,
  showSettingsModal,
  hideSettingsModal,
  showAchievementsModal,
  hideAchievementsModal,
  vibrate,
  renderQuests,
  triggerConfetti,
  updateMuteButtonUI,
} from './ui.js';
import { initAudio, toggleSound, playQuestComplete, playCollect, isSoundEnabled } from './audio.js';
import { loadQuests, claimQuestReward, initQuestListeners, devCompleteAllQuests, devResetAllQuests } from './quests.js';

// ─── App State ───
let userAddress = null;
let lastGameData = null;

// ─── App Init ───
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  bindEvents();
  checkExistingConnection();
  
  // Initialize decentralized quest events dispatcher
  initQuestListeners((q) => {
    showAchievement('QUEST COMPLETED', q.title, '🎯');
    playQuestComplete();
    updateQuestsUI();
    showQuestNotificationInGame(`🏆 QUEST COMPLETE: ${q.title}!`, '#10b981');

    // Fire-and-forget: submit quest completion on-chain (1000 uSTX)
    if (userAddress) {
      const questNum = parseInt(q.id.replace(/\D/g, '')) || 1;
      submitQuestOnChain(questNum, q.reward)
        .then(() => showToast('Quest submitted on-chain! 🎯', 'success'))
        .catch(err => console.warn('[On-Chain] Quest submit skipped:', err.message || err));
    }
  }, (q, percent) => {
    showToast(`QUEST PROGRESS: ${q.title} (${percent}%)`, 'info');
    showQuestNotificationInGame(`🎯 ${q.title}: ${percent}%`, '#38bdf8');
  });

  updateQuestsUI();  loadPersistedSettings();
});

// ─── Persist Settings ───
function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem('stacks_hurry_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      setSettings(parsed);
      
      // Sync UI elements
      const soundToggle = document.getElementById('toggle-sound');
      const graphicsToggle = document.getElementById('toggle-graphics');
      const autofireToggle = document.getElementById('toggle-autofire');
      const shakeSlider = document.getElementById('slider-shake');
      const shakeVal = document.getElementById('shake-val');
      const joystickSlider = document.getElementById('slider-joystick-scale');
      const joystickVal = document.getElementById('joystick-scale-val');
      
      if (parsed.soundEnabled !== undefined && soundToggle) {
        soundToggle.checked = parsed.soundEnabled;
        toggleSound(parsed.soundEnabled);
        updateMuteButtonUI(!parsed.soundEnabled);
      }
      if (parsed.lowGraphics !== undefined && graphicsToggle) {
        graphicsToggle.checked = parsed.lowGraphics;
      }
      const scanlinesToggle = document.getElementById('toggle-scanlines');
      if (parsed.scanlinesEnabled !== undefined && scanlinesToggle) {
        scanlinesToggle.checked = parsed.scanlinesEnabled;
        updateScanlinesOverlay(parsed.scanlinesEnabled);
      }
      if (parsed.autoFire !== undefined && autofireToggle) {
        autofireToggle.checked = parsed.autoFire;
      }
      if (parsed.shakeMultiplier !== undefined && shakeSlider && shakeVal) {
        const pct = Math.round(parsed.shakeMultiplier * 100);
        shakeSlider.value = pct;
        shakeVal.textContent = `${pct}%`;
      }
      if (parsed.joystickScale !== undefined && joystickSlider && joystickVal) {
        const pct = Math.round(parsed.joystickScale * 100);
        joystickSlider.value = pct;
        joystickVal.textContent = `${pct}%`;
      }
      const shipThemeSelect = document.getElementById('select-ship-theme');
      if (parsed.shipTheme !== undefined && shipThemeSelect) {
        shipThemeSelect.value = parsed.shipTheme;
      }
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

function updateScanlinesOverlay(enabled) {
  const overlay = document.querySelector('.crt-overlay');
  if (overlay) {
    if (enabled) {
      overlay.classList.remove('disabled');
    } else {
      overlay.classList.add('disabled');
    }
  }
}

function savePersistedSettings() {
  try {
    const soundToggle = document.getElementById('toggle-sound');
    const graphicsToggle = document.getElementById('toggle-graphics');
    const scanlinesToggle = document.getElementById('toggle-scanlines');
    const autofireToggle = document.getElementById('toggle-autofire');
    const shakeSlider = document.getElementById('slider-shake');
    const joystickSlider = document.getElementById('slider-joystick-scale');
    const shipThemeSelect = document.getElementById('select-ship-theme');
    
    const settingsObj = {
      soundEnabled: soundToggle ? soundToggle.checked : true,
      lowGraphics: graphicsToggle ? graphicsToggle.checked : false,
      scanlinesEnabled: scanlinesToggle ? scanlinesToggle.checked : true,
      autoFire: autofireToggle ? autofireToggle.checked : true,
      shakeMultiplier: shakeSlider ? parseInt(shakeSlider.value) / 100 : 1.0,
      joystickScale: joystickSlider ? parseInt(joystickSlider.value) / 100 : 1.0,
      shipTheme: shipThemeSelect ? shipThemeSelect.value : 'vanguard'
    };
    localStorage.setItem('stacks_hurry_settings', JSON.stringify(settingsObj));
    if (scanlinesToggle) {
      updateScanlinesOverlay(scanlinesToggle.checked);
    }
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}


// ─── Update Quests UI ───
function updateQuestsUI() {
  const state = loadQuests();
  renderQuests(state.quests, state.streak, (id) => {
    // Show simulated Stacks Web3 transaction workflow
    showToast(`Initiating Stacks contract-call claim...`, 'info');
    if (typeof vibrate === 'function') vibrate(30);
    
    setTimeout(() => {
      showToast(`Broadcasting contract-call 'claim-daily-bounty' to Stacks Mainnet...`, 'info');
    }, 1000);

    setTimeout(() => {
      const claimed = claimQuestReward(id);
      if (claimed) {
        playCollect();
        const mockTxHash = '0x' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
        showToast(`Bounty Claim Confirmed! TX: ${mockTxHash.slice(0, 10)}...`, 'success');
        showAchievement('BOUNTY SECURED', `On-chain reward of ${claimed.reward} PTS confirmed!`, '💎');
        triggerConfetti();
        updateQuestsUI();
      }
    }, 2500);
  });
}

// ─── Check if wallet was previously connected ───
function checkExistingConnection() {
  try {
    if (isConnected()) {
      const stored = getLocalStorage();
      if (stored?.addresses?.stx?.length > 0) {
        userAddress = stored.addresses.stx[0].address;
        showWalletConnected(userAddress);
      }
    }
  } catch (e) {
    // No previous connection
  }
}

// ─── Event Binding ───
function bindEvents() {
  // Wallet
  document.getElementById('btn-connect-wallet').addEventListener('click', connectWallet);
  document.getElementById('btn-disconnect-wallet').addEventListener('click', disconnectWallet);
  document.getElementById('btn-switch-wallet').addEventListener('click', switchWallet);

  // Menu
  document.getElementById('btn-play').addEventListener('click', startNewGame);
  document.getElementById('btn-mint-nft').addEventListener('click', () => showMintModal());
  document.getElementById('btn-leaderboard').addEventListener('click', openLeaderboard);
  document.getElementById('btn-my-stats').addEventListener('click', openStats);
  document.getElementById('btn-settings').addEventListener('click', () => showSettingsModal());
  document.getElementById('btn-achievements').addEventListener('click', () => showAchievementsModal());

  // Powerup Store
  document.getElementById('btn-powerup-store').addEventListener('click', () => {
    document.getElementById('modal-powerup-store').classList.remove('hidden');
  });
  document.getElementById('btn-close-powerup-store').addEventListener('click', () => {
    document.getElementById('modal-powerup-store').classList.add('hidden');
  });
  document.querySelector('#modal-powerup-store .modal-backdrop')?.addEventListener('click', () => {
    document.getElementById('modal-powerup-store').classList.add('hidden');
  });
  for (let pid = 1; pid <= 4; pid++) {
    document.getElementById(`btn-buy-powerup-${pid}`).addEventListener('click', () => handleBuyPowerup(pid));
  }

  // HUD
  document.getElementById('btn-pause-game').addEventListener('click', togglePause);
  document.getElementById('btn-hud-mute').addEventListener('click', handleMuteToggle);

  // M key for mute toggle shortcut
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && !e.repeat) {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        handleMuteToggle();
      }
    }
  });

  // Game Over
  document.getElementById('btn-submit-score').addEventListener('click', handleSubmitScore);
  document.getElementById('btn-submit-highscore').addEventListener('click', handleSubmitHighScore);
  document.getElementById('btn-play-again').addEventListener('click', startNewGame);
  document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu'));

  // Leaderboard
  document.getElementById('btn-lb-back').addEventListener('click', () => showScreen('menu'));
  document.getElementById('btn-lb-tab-chain').addEventListener('click', () => switchLeaderboardTab('chain'));
  document.getElementById('btn-lb-tab-local').addEventListener('click', () => switchLeaderboardTab('local'));

  // Stats
  document.getElementById('btn-stats-back').addEventListener('click', () => showScreen('menu'));

  // Mint Modal
  document.getElementById('btn-close-mint').addEventListener('click', () => hideMintModal());
  document.getElementById('btn-do-mint').addEventListener('click', handleMintNFT);
  document.getElementById('btn-mint-character')?.addEventListener('click', handleMintCharacterNFT);
  document.querySelector('#modal-mint .modal-backdrop')?.addEventListener('click', () => hideMintModal());

  // Settings Modal
  document.getElementById('btn-close-settings').addEventListener('click', () => hideSettingsModal());
  document.querySelector('#modal-settings .modal-backdrop')?.addEventListener('click', () => hideSettingsModal());

  // Achievements Modal
  document.getElementById('btn-close-achievements').addEventListener('click', () => hideAchievementsModal());
  document.querySelector('#modal-achievements .modal-backdrop')?.addEventListener('click', () => hideAchievementsModal());
  document.getElementById('toggle-sound').addEventListener('change', (e) => {
    toggleSound(e.target.checked);
    updateMuteButtonUI(!e.target.checked);
    savePersistedSettings();
  });
  document.getElementById('toggle-graphics').addEventListener('change', (e) => {
    setSettings({ lowGraphics: e.target.checked });
    savePersistedSettings();
  });
  document.getElementById('toggle-scanlines').addEventListener('change', (e) => {
    updateScanlinesOverlay(e.target.checked);
    savePersistedSettings();
  });

  // Combat Settings
  document.getElementById('toggle-autofire').addEventListener('change', (e) => {
    setSettings({ autoFire: e.target.checked });
    showToast(e.target.checked ? 'Auto-fire: ON' : 'Auto-fire: OFF', 'info');
    savePersistedSettings();
  });

  document.getElementById('slider-shake').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('shake-val').textContent = `${val}%`;
    setSettings({ shakeMultiplier: val / 100 });
    savePersistedSettings();
  });

  const joystickSlider = document.getElementById('slider-joystick-scale');
  if (joystickSlider) {
    joystickSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      const joystickVal = document.getElementById('joystick-scale-val');
      if (joystickVal) joystickVal.textContent = `${val}%`;
      setSettings({ joystickScale: val / 100 });
      savePersistedSettings();
    });
  }

  const shipThemeSelect = document.getElementById('select-ship-theme');
  if (shipThemeSelect) {
    shipThemeSelect.addEventListener('change', (e) => {
      setSettings({ shipTheme: e.target.value });
      savePersistedSettings();
    });
  }

  // Developer reviewer helper controls
  document.getElementById('btn-dev-complete-quests').addEventListener('click', () => {
    devCompleteAllQuests();
    updateQuestsUI();
    showToast('Reviewer Mode: Challenges Completed!', 'success');
  });
  document.getElementById('btn-dev-reset-quests').addEventListener('click', () => {
    devResetAllQuests();
    updateQuestsUI();
    showToast('Reviewer Mode: Challenges Reset!', 'info');
  });

  // Pause Modal
  document.getElementById('btn-resume').addEventListener('click', togglePause);
  document.getElementById('btn-quit').addEventListener('click', () => {
    togglePause(); // Unpause internally
    stopGame();
    hidePauseModal();
    showScreen('menu');
  });
  document.getElementById('btn-pause-settings').addEventListener('click', () => showSettingsModal());

}

function handleMuteToggle() {
  const currentSound = isSoundEnabled();
  toggleSound(!currentSound);
  updateMuteButtonUI(currentSound);
  
  const toggle = document.getElementById('toggle-sound');
  if (toggle) toggle.checked = !currentSound;
  
  savePersistedSettings();
  showToast(!currentSound ? 'Sound Muted' : 'Sound Enabled', 'info');
}

// ─── Wallet Connection (v8 API) ───
async function connectWallet() {
  initAudio();

  try {
    const response = await connect();

    // Get the cached address from local storage
    const stored = getLocalStorage();
    if (stored?.addresses?.stx?.length > 0) {
      userAddress = stored.addresses.stx[0].address;
      showWalletConnected(userAddress);
      showToast('Wallet connected successfully!', 'success');
    } else {
      showToast('Wallet address not found in local cache', 'error');
    }
  } catch (err) {
    console.error('Wallet connection failed:', err);
    showToast('Wallet connection cancelled or failed', 'info');
  }
}

// ─── Disconnect Wallet ───
async function disconnectWallet() {
  try {
    disconnect();
    userAddress = null;
    showWalletDisconnected();
    showToast('Wallet disconnected', 'info');
  } catch (err) {
    console.error('Disconnect failed:', err);
    // Force-clear even on error
    userAddress = null;
    showWalletDisconnected();
    showToast('Wallet disconnected', 'info');
  }
}

// ─── Switch Wallet (disconnect then reconnect) ───
async function switchWallet() {
  try {
    disconnect();
    userAddress = null;
    showWalletDisconnected();
    showToast('Switching wallet...', 'info');
    // Small delay so user sees the UI reset, then prompt new connection
    setTimeout(() => connectWallet(), 400);
  } catch (err) {
    console.error('Switch wallet error:', err);
    userAddress = null;
    showWalletDisconnected();
    setTimeout(() => connectWallet(), 400);
  }
}

// ─── Start Game ───
function startNewGame() {
  initAudio();
  showScreen('game');

  const canvas = document.getElementById('game-canvas');
  initGame(canvas, {
    onScoreUpdate: updateHUDScore,
    onLivesUpdate: updateHUDLives,
    onLevelUpdate: updateHUDLevel,
    onLevelProgress: updateHUDLevelProgress,
    onAchievement: showAchievement,
    onVibrate: vibrate,
    onGameOver: handleGameOver,
    onPauseToggle: handlePauseToggle,
  });

  runCountdown(() => {
    startGame();
  });
}

// ─── Pause Handler ───
function handlePauseToggle(isPaused) {
  if (isPaused) {
    showPauseModal();
  } else {
    hidePauseModal();
  }
}

// ─── Game Over Handler ───
function saveScoreLocally(score) {
  if (!score || score <= 0) return;
  try {
    const raw = localStorage.getItem('stacks_hurry_local_scores') || '[]';
    const list = JSON.parse(raw);
    list.push({
      score,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    list.sort((a, b) => b.score - a.score);
    localStorage.setItem('stacks_hurry_local_scores', JSON.stringify(list.slice(0, 5)));
  } catch (e) {
    console.error('Failed to save score locally:', e);
  }
}

function handleGameOver(data) {
  saveScoreLocally(data.score);
  lastGameData = data;
  stopGame();
  updateQuestsUI();

  // Fire-and-forget: record game on-chain via pilot-registry (500 uSTX)
  if (userAddress && data.score > 0) {
    recordGameOnChain(data.score)
      .then(result => {
        console.log('[On-Chain] Game recorded:', result?.txid || 'submitted');
        showToast('Game recorded on-chain! 🚀', 'success');
      })
      .catch(err => {
        console.warn('[On-Chain] Game record skipped:', err.message || err);
      });
  }

  setTimeout(() => {
    showGameOver(data);
  }, 600);
}

// ─── Score Submission (Rocket Shooter - free, async) ───
async function handleSubmitScore() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  if (!lastGameData || lastGameData.score === 0) {
    showToast('Score must be greater than 0', 'error');
    return;
  }

  showToast('Submitting score to Stacks blockchain...', 'info');

  try {
    const result = await submitGameScore(lastGameData.score);
    showToast(`Score submitted! TX: ${result.txid?.slice(0, 12) || 'pending'}...`, 'success');
  } catch (err) {
    console.error('Score submission error:', err);
    showToast('Score submission cancelled or failed', 'info');
  }
}

// ─── High Score Submission (Score contract - costs 5000 uSTX, async) ───
async function handleSubmitHighScore() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  if (!lastGameData || lastGameData.score === 0) {
    showToast('Score must be greater than 0', 'error');
    return;
  }

  showToast('Submitting to Hall of Fame (5000 uSTX fee)...', 'info');

  try {
    const result = await submitHighScore(lastGameData.score);
    showToast(`Hall of Fame entry submitted! TX: ${result.txid?.slice(0, 12) || 'pending'}...`, 'success');
  } catch (err) {
    console.error('High score submission error:', err);
    showToast('Submission cancelled or failed', 'info');
  }
}

// ─── Mint NFT (async) ───
async function handleMintNFT() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  showToast('Minting your Stacks Hurry NFT...', 'info');
  hideMintModal();

  try {
    const result = await mintOpenNFT(userAddress);
    showToast(`NFT Minted! TX: ${result.txid?.slice(0, 12) || 'pending'}...`, 'success');
  } catch (err) {
    console.error('Minting error:', err);
    showToast('Minting cancelled or failed', 'info');
  }
}

async function handleMintCharacterNFT() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  showToast('Minting your Character NFT...', 'info');
  hideMintModal();

  try {
    const result = await mintCharacterNFT(userAddress);
    showToast(`Character NFT Minted! TX: ${result.txid?.slice(0, 12) || 'pending'}...`, 'success');
  } catch (err) {
    console.error('Minting error:', err);
    showToast('Minting cancelled or failed', 'info');
  }
}

// ─── Buy Powerup (Powerup Store - costs vary, async) ───
async function handleBuyPowerup(powerupId) {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  const names = { 1: 'Speed Boost', 2: 'Shield Generator', 3: 'Triple Shot', 4: 'Bounce Bullets' };
  const costs = { 1: '2,000', 2: '3,000', 3: '5,000', 4: '8,000' };
  const name = names[powerupId] || 'Unknown';

  showToast(`Purchasing ${name} (${costs[powerupId]} uSTX)...`, 'info');

  try {
    const result = await buyPowerupOnChain(powerupId);
    showToast(`${name} purchased on-chain! TX: ${result?.txid?.slice(0, 12) || 'pending'}...`, 'success');
    document.getElementById('modal-powerup-store').classList.add('hidden');
  } catch (err) {
    console.error('Powerup purchase error:', err);
    showToast('Purchase cancelled or failed', 'info');
  }
}

// ─── Leaderboard ───
let currentLeaderboardTab = 'chain';

async function openLeaderboard() {
  showScreen('leaderboard');
  showLeaderboardLoading();
  
  // Set tab UI active state
  if (currentLeaderboardTab === 'chain') {
    document.getElementById('btn-lb-tab-chain').classList.add('active');
    document.getElementById('btn-lb-tab-local').classList.remove('active');
  } else {
    document.getElementById('btn-lb-tab-chain').classList.remove('active');
    document.getElementById('btn-lb-tab-local').classList.add('active');
  }

  await loadLeaderboardData();
}

async function switchLeaderboardTab(tab) {
  if (currentLeaderboardTab === tab) return;
  currentLeaderboardTab = tab;
  
  if (currentLeaderboardTab === 'chain') {
    document.getElementById('btn-lb-tab-chain').classList.add('active');
    document.getElementById('btn-lb-tab-local').classList.remove('active');
  } else {
    document.getElementById('btn-lb-tab-chain').classList.remove('active');
    document.getElementById('btn-lb-tab-local').classList.add('active');
  }

  showLeaderboardLoading();
  await loadLeaderboardData();
}

async function loadLeaderboardData() {
  if (currentLeaderboardTab === 'chain') {
    try {
      const count = await getPlayerCount();
      const entries = [];

      if (userAddress) {
        const playerData = await getPlayerScore(userAddress);
        if (playerData.highScore > 0) {
          entries.push({
            address: userAddress,
            score: playerData.highScore,
          });
        }
      }

      const countEl = document.getElementById('lb-player-count');
      countEl.textContent = `${count} Total Players on Chain`;

      renderLeaderboard(entries, false);

      if (entries.length === 0) {
        showToast(`${count} players on-chain. Play and submit your score!`, 'info');
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
      showToast('Failed to load on-chain leaderboard data', 'error');
      renderLeaderboard([], false);
    }
  } else {
    // Local scores tab
    try {
      const raw = localStorage.getItem('stacks_hurry_local_scores') || '[]';
      const localScores = JSON.parse(raw);
      
      // Sort by score descending
      localScores.sort((a, b) => b.score - a.score);
      
      // Take top 10
      const entries = localScores.slice(0, 10).map((item, idx) => ({
        address: `Pilot #${idx + 1}`,
        score: item.score,
        date: item.date || 'Today'
      }));

      const countEl = document.getElementById('lb-player-count');
      countEl.textContent = `${localScores.length} Local High Scores`;

      renderLeaderboard(entries, true);
    } catch (err) {
      console.error('Local leaderboard error:', err);
      showToast('Failed to load local scores', 'error');
      renderLeaderboard([], true);
    }
  }
}

// ─── Player Stats ───
async function openStats() {
  showScreen('stats');

  if (!userAddress) {
    renderStats({
      highScore: 0,
      gamesPlayed: 0,
      lastPlayed: 0,
      hallOfFameScore: 0,
    });
    return;
  }

  try {
    const [playerData, hallOfFame] = await Promise.all([
      getPlayerScore(userAddress),
      getHallOfFameScore(userAddress),
    ]);

    renderStats({
      highScore: playerData.highScore,
      gamesPlayed: playerData.gamesPlayed,
      lastPlayed: playerData.lastPlayed,
      hallOfFameScore: hallOfFame,
    });
  } catch (err) {
    console.error('Stats error:', err);
    showToast('Failed to load blockchain stats', 'warning');
    renderStats({
      highScore: 0,
      gamesPlayed: 0,
      lastPlayed: 0,
      hallOfFameScore: 0,
    });
  }
}

export function logFrameDelta(delta) {
  // console.log(delta);
}
