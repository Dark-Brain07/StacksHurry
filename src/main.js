/**
 * Stacks Hurry - Main Application Entry
 * Orchestrates wallet connection, game state, and contract interactions
 */

import { showConnect } from '@stacks/connect';
import {
  mintOpenNFT,
  submitGameScore,
  submitHighScore,
  getPlayerScore,
  getHallOfFameScore,
  getPlayerCount,
} from './contracts.js';
import { initGame, startGame, stopGame, getScore, getLevel, getAsteroidsDestroyed } from './game.js';
import {
  initUI,
  showScreen,
  showWalletConnected,
  updateHUDScore,
  updateHUDLives,
  updateHUDLevel,
  showGameOver,
  runCountdown,
  renderLeaderboard,
  showLeaderboardLoading,
  renderStats,
  showMintModal,
  hideMintModal,
  showToast,
} from './ui.js';
import { initAudio } from './audio.js';

// ─── App State ───
let userAddress = null;
let lastGameData = null;

// ─── App Init ───
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  bindEvents();
});

// ─── Event Binding ───
function bindEvents() {
  // Wallet
  document.getElementById('btn-connect-wallet').addEventListener('click', connectWallet);

  // Menu
  document.getElementById('btn-play').addEventListener('click', startNewGame);
  document.getElementById('btn-mint-nft').addEventListener('click', () => showMintModal());
  document.getElementById('btn-leaderboard').addEventListener('click', openLeaderboard);
  document.getElementById('btn-my-stats').addEventListener('click', openStats);

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
  document.querySelector('.modal-backdrop')?.addEventListener('click', () => hideMintModal());
}

// ─── Wallet Connection ───
function connectWallet() {
  initAudio();

  showConnect({
    appDetails: {
      name: 'Stacks Hurry',
      icon: window.location.origin + '/favicon.svg',
    },
    onFinish: (payload) => {
      userAddress = payload.userSession.loadUserData().profile.stxAddress.mainnet;
      showWalletConnected(userAddress);
      showToast('Wallet connected successfully!', 'success');
    },
    onCancel: () => {
      showToast('Wallet connection cancelled', 'info');
    },
  });
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
    onGameOver: handleGameOver,
  });

  runCountdown(() => {
    startGame();
  });
}

// ─── Game Over Handler ───
function handleGameOver(data) {
  lastGameData = data;
  stopGame();
  setTimeout(() => {
    showGameOver(data);
  }, 600);
}

// ─── Score Submission (Rocket Shooter - free) ───
function handleSubmitScore() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  if (!lastGameData || lastGameData.score === 0) {
    showToast('Score must be greater than 0', 'error');
    return;
  }

  showToast('Submitting score to Stacks blockchain...', 'info');

  submitGameScore(
    lastGameData.score,
    (data) => {
      showToast(`Score submitted! TX: ${data.txId.slice(0, 12)}...`, 'success');
    },
    () => {
      showToast('Score submission cancelled', 'info');
    }
  );
}

// ─── High Score Submission (Score contract - costs 5000 uSTX) ───
function handleSubmitHighScore() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  if (!lastGameData || lastGameData.score === 0) {
    showToast('Score must be greater than 0', 'error');
    return;
  }

  showToast('Submitting to Hall of Fame (5000 uSTX fee)...', 'info');

  submitHighScore(
    lastGameData.score,
    (data) => {
      showToast(`Hall of Fame entry submitted! TX: ${data.txId.slice(0, 12)}...`, 'success');
    },
    () => {
      showToast('Submission cancelled', 'info');
    }
  );
}

// ─── Mint NFT ───
function handleMintNFT() {
  if (!userAddress) {
    showToast('Connect your wallet first!', 'error');
    return;
  }

  showToast('Minting your Stacks Hurry NFT...', 'info');
  hideMintModal();

  mintOpenNFT(
    userAddress,
    (data) => {
      showToast(`NFT Minted! TX: ${data.txId.slice(0, 12)}...`, 'success');
    },
    () => {
      showToast('Minting cancelled', 'info');
    }
  );
}

// ─── Leaderboard ───
async function openLeaderboard() {
  showScreen('leaderboard');
  showLeaderboardLoading();

  try {
    const count = await getPlayerCount();
    // Since we can't enumerate all players from the contract directly,
    // we show a message with total player count and the connected user's score.
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

    // Add total player count info
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
