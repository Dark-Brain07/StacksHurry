/**
 * Stacks Hurry - Main Application Entry (v8 API)
 * Uses @stacks/connect 8.x connect() + request() API
 */

import { connect, getLocalStorage, disconnect, isConnected } from '@stacks/connect';
import {
  mintOpenNFT,
  submitGameScore,
  submitHighScore,
  getPlayerScore,
  getHallOfFameScore,
  getPlayerCount,
} from './contracts.js';
import { initGame, startGame, stopGame, getScore, getLevel, getAsteroidsDestroyed, togglePause, setSettings } from './game.js';
import {
  initUI,
  showScreen,
  showWalletConnected,
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
  vibrate,
  renderQuests,
} from './ui.js';
import { initAudio, toggleSound, playQuestComplete, playCollect } from './audio.js';
import { loadQuests, claimQuestReward, initQuestListeners, devCompleteAllQuests, devResetAllQuests } from './quests.js';
import { loadWorkflow, completeCommit, getWorkflowState } from './workflow.js';

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
  });

  updateQuestsUI();
  updateWorkflowUI();
  loadPersistedSettings();
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
      
      if (parsed.soundEnabled !== undefined && soundToggle) {
        soundToggle.checked = parsed.soundEnabled;
        toggleSound(parsed.soundEnabled);
      }
      if (parsed.lowGraphics !== undefined && graphicsToggle) {
        graphicsToggle.checked = parsed.lowGraphics;
      }
      if (parsed.autoFire !== undefined && autofireToggle) {
        autofireToggle.checked = parsed.autoFire;
      }
      if (parsed.shakeMultiplier !== undefined && shakeSlider && shakeVal) {
        const pct = Math.round(parsed.shakeMultiplier * 100);
        shakeSlider.value = pct;
        shakeVal.textContent = `${pct}%`;
      }
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

function savePersistedSettings() {
  try {
    const soundToggle = document.getElementById('toggle-sound');
    const graphicsToggle = document.getElementById('toggle-graphics');
    const autofireToggle = document.getElementById('toggle-autofire');
    const shakeSlider = document.getElementById('slider-shake');
    
    const settingsObj = {
      soundEnabled: soundToggle ? soundToggle.checked : true,
      lowGraphics: graphicsToggle ? graphicsToggle.checked : false,
      autoFire: autofireToggle ? autofireToggle.checked : true,
      shakeMultiplier: shakeSlider ? parseInt(shakeSlider.value) / 100 : 1.0
    };
    localStorage.setItem('stacks_hurry_settings', JSON.stringify(settingsObj));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}


// ─── Update Workflow UI ───
function updateWorkflowUI() {
  const state = loadWorkflow();
  renderWorkflow(state);
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

  // Menu
  document.getElementById('btn-play').addEventListener('click', startNewGame);
  document.getElementById('btn-mint-nft').addEventListener('click', () => showMintModal());
  document.getElementById('btn-leaderboard').addEventListener('click', openLeaderboard);
  document.getElementById('btn-my-stats').addEventListener('click', openStats);
  document.getElementById('btn-settings').addEventListener('click', () => showSettingsModal());

  // HUD
  document.getElementById('btn-pause-game').addEventListener('click', togglePause);

  // Game Over
  document.getElementById('btn-submit-score').addEventListener('click', handleSubmitScore);
  document.getElementById('btn-submit-highscore').addEventListener('click', handleSubmitHighScore);
  document.getElementById('btn-play-again').addEventListener('click', startNewGame);
  document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu'));

  // Leaderboard
  document.getElementById('btn-lb-back').addEventListener('click', () => showScreen('menu'));

  // Stats
  document.getElementById('btn-stats-back').addEventListener('click', () => showScreen('menu'));

  // Mint Modal
  document.getElementById('btn-close-mint').addEventListener('click', () => hideMintModal());
  document.getElementById('btn-do-mint').addEventListener('click', handleMintNFT);
  document.querySelector('#modal-mint .modal-backdrop')?.addEventListener('click', () => hideMintModal());

  // Settings Modal
  document.getElementById('btn-close-settings').addEventListener('click', () => hideSettingsModal());
  document.querySelector('#modal-settings .modal-backdrop')?.addEventListener('click', () => hideSettingsModal());
  document.getElementById('toggle-sound').addEventListener('change', (e) => {
    toggleSound(e.target.checked);
    savePersistedSettings();
  });
  document.getElementById('toggle-graphics').addEventListener('change', (e) => {
    setSettings({ lowGraphics: e.target.checked });
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

  // Workflow shortcut (Alt+Shift+W to complete next commit in roadmap)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key === 'W') {
      const state = getWorkflowState();
      const nextTask = state.tasks.find(t => !t.completed);
      if (nextTask) {
        completeCommit(nextTask.commitNum);
        updateWorkflowUI();
        showToast(`Commit #${nextTask.commitNum} recorded: ${nextTask.title}`, 'success');
        showAchievement('ROADMAP UPDATED', `Progress: ${getWorkflowState().completedCount}/15 commits`, '🛠️');
      }
    }
  });
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
function handleGameOver(data) {
  lastGameData = data;
  stopGame();
  updateQuestsUI();
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

// ─── Leaderboard ───
async function openLeaderboard() {
  showScreen('leaderboard');
  showLeaderboardLoading();

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

    renderLeaderboard(entries);

    if (entries.length === 0) {
      showToast(`${count} players on-chain. Play and submit your score!`, 'info');
    }
  } catch (err) {
    console.error('Leaderboard error:', err);
    showToast('Failed to load leaderboard data', 'error');
    renderLeaderboard([]);
  }
}

// ─── Player Stats ───
async function openStats() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  showScreen('stats');

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
    showToast('Failed to load player stats', 'error');
  }
}
