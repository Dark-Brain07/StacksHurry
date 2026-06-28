/**
 * Stacks Hurry - Contract Interaction Layer (v8 API)
 * Uses @stacks/connect 8.x request() API with JSON-RPC
 */

import { request } from '@stacks/connect';
import {
  Cl,
  fetchCallReadOnlyFunction,
  cvToValue,
} from '@stacks/transactions';

// ─── Contract Addresses ───
/** @constant {any} */
const DEPLOYER = 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF';
const NETWORK = 'mainnet';

/** JSDoc for exported member */
/** @constant {any} */
export const CONTRACTS = {
  OPEN_MINT_NFT:  `${DEPLOYER}.open-mint-nft`,
  CHARACTER_NFT:  `${DEPLOYER}.character-nft`,
  SCORE:          `${DEPLOYER}.score`,
  ROCKET_SHOOTER: `${DEPLOYER}.rocket-shooter`,
};

// ─── Helper: Read-only contract call ───
/** @param {any} param */
async function readOnly(contractId, functionName, args = []) {
  try {
    const [contractAddress, contractName] = contractId.split('.');
/** @constant {any} */
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName,
      functionArgs: args,
      senderAddress: contractAddress,
    });
    return cvToValue(result);
  } catch (err) {
    console.error(`Read-only call failed: ${contractId}.${functionName}`, err);
    return null;
  }
}

// ─── Helper: Write contract call via request() ───
/** @param {any} param */
async function writeContract(contractId, functionName, functionArgs, retries = 3, delay = 1000) {
/** @constant {any} */
  const hexArgs = functionArgs.map(arg => Cl.serialize(arg));

/** @param {any} param */
/** @description for logic */
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[TX Attempt ${attempt}/${retries}] calling ${functionName} on ${contractId}...`);
/** @constant {any} */
      const result = await request('stx_callContract', {
        contract: contractId,
        functionName,
        functionArgs: hexArgs,
        network: NETWORK,
      });
      console.log(`[TX Success] ${functionName} transaction submitted:`, result);
      return result;
    } catch (error) {
      console.error(`[TX Error] Attempt ${attempt} failed for ${functionName}:`, error);
/** @param {any} param */
/** @description if logic */
      if (attempt === retries) {
        throw new Error(`Transaction failed after ${retries} attempts. Reason: ${error.message || error}`);
      }
/** @constant {any} */
      const backoff = delay * Math.pow(2, attempt - 1);
      console.log(`[TX Retry] Backing off for ${backoff}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

// ══════════════════════════════════════════
// 1. OPEN MINT NFT
// ══════════════════════════════════════════

/** Mint an open-edition NFT to the given recipient */
export async function mintOpenNFT(recipientAddress) {
  return writeContract(
    CONTRACTS.OPEN_MINT_NFT,
    'mint',
    [Cl.principal(recipientAddress)]
  );
}

/** Get total minted count */
export async function getOpenMintCount() {
/** @constant {any} */
  const result = await readOnly(CONTRACTS.OPEN_MINT_NFT, 'get-last-token-id');
  return result?.value || 0;
}

// ══════════════════════════════════════════
// 2. CHARACTER NFT
// ══════════════════════════════════════════

/** Get total characters minted */
export async function getCharacterCount() {
  const result = await readOnly(CONTRACTS.CHARACTER_NFT, 'get-last-token-id');
  return result?.value || 0;
}

/** Mint a character NFT */
export async function mintCharacterNFT(recipientAddress) {
  return writeContract(
    CONTRACTS.CHARACTER_NFT,
    'mint',
    [Cl.principal(recipientAddress)]
  );
}

// ══════════════════════════════════════════
// 3. SCORE CONTRACT (Hall of Fame - costs 5000 uSTX)
// ══════════════════════════════════════════

/** Submit high score (requires 5000 uSTX fee) */
export async function submitHighScore(score) {
  return writeContract(
    CONTRACTS.SCORE,
    'submit-score',
    [Cl.uint(score)]
  );
}

/** Get a player's hall-of-fame high score */
export async function getHallOfFameScore(playerAddress) {
/** @constant {any} */
  const result = await readOnly(
    CONTRACTS.SCORE,
    'get-high-score',
    [Cl.principal(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}

// ══════════════════════════════════════════
// 4. ROCKET SHOOTER CONTRACT (Free score submit)
// ══════════════════════════════════════════

/** Submit game score (free, just gas) */
export async function submitGameScore(score) {
  return writeContract(
    CONTRACTS.ROCKET_SHOOTER,
    'submit-score',
    [Cl.uint(score)]
  );
}

/** Get player's full score data { highScore, gamesPlayed, lastPlayed } */
export async function getPlayerScore(playerAddress) {
/** @constant {any} */
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-score',
    [Cl.principal(playerAddress)]
  );
/** @param {any} param */
/** @description if logic */
  if (result) {
    return {
      highScore: result['high-score'] || 0,
      gamesPlayed: result['games-played'] || 0,
      lastPlayed: result['last-played'] || 0,
    };
  }
  return { highScore: 0, gamesPlayed: 0, lastPlayed: 0 };
}

/** Get player's high score only */
export async function getPlayerHighScore(playerAddress) {
/** @constant {any} */
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-high-score',
    [Cl.principal(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}

/** Get total player count */
export async function getPlayerCount() {
/** @constant {any} */
  const result = await readOnly(CONTRACTS.ROCKET_SHOOTER, 'get-player-count');
  return typeof result === 'number' ? result : (result || 0);
}

/** Get games played for a player */
export async function getGamesPlayed(playerAddress) {
/** @constant {any} */
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-games-played',
    [Cl.principal(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}

// ══════════════════════════════════════════
// 5. DAILY QUEST TRACKER CONTRACT
// ══════════════════════════════════════════

const CONTRACT_DAILY_QUESTS = `${DEPLOYER}.daily-quest-tracker-v2`;

/** Submit a daily quest completion on-chain (1000 uSTX fee) */
export async function submitQuestOnChain(questId, score) {
  return writeContract(
    CONTRACT_DAILY_QUESTS,
    'complete-quest',
    [Cl.uint(questId), Cl.uint(score)]
  );
}

/** Get quest completion status for a player */
export async function getQuestStatusOnChain(playerAddress, questId) {
  return readOnly(
    CONTRACT_DAILY_QUESTS,
    'get-quest-status',
    [Cl.principal(playerAddress), Cl.uint(questId)]
  );
}

/** Get total quests completed by a player */
export async function getPlayerTotalQuests(playerAddress) {
/** @constant {any} */
  const result = await readOnly(
    CONTRACT_DAILY_QUESTS,
    'get-player-total-quests',
    [Cl.principal(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}

// ══════════════════════════════════════════
// 6. POWERUP STORE CONTRACT
// ══════════════════════════════════════════

/** @constant {any} */
const CONTRACT_POWERUP_STORE = `${DEPLOYER}.powerup-store`;

/** Buy a permanent powerup on-chain (cost varies by tier) */
export async function buyPowerupOnChain(powerupId) {
  return writeContract(
    CONTRACT_POWERUP_STORE,
    'buy-powerup',
    [Cl.uint(powerupId)]
  );
}

/** Check if a player owns a specific powerup */
export async function hasPowerupOnChain(playerAddress, powerupId) {
/** @constant {any} */
  const result = await readOnly(
    CONTRACT_POWERUP_STORE,
    'has-powerup',
    [Cl.principal(playerAddress), Cl.uint(powerupId)]
  );
  return !!result;
}

/** Get all powerup ownership status for a player */
export async function getAllPowerupsOnChain(playerAddress) {
  return readOnly(
    CONTRACT_POWERUP_STORE,
    'get-all-powerups',
    [Cl.principal(playerAddress)]
  );
}

// ══════════════════════════════════════════
// 7. PILOT REGISTRY CONTRACT
// ══════════════════════════════════════════

/** @constant {any} */
const CONTRACT_PILOT_REGISTRY = `${DEPLOYER}.pilot-registry`;

/** Register a pilot name on-chain (5000 uSTX fee) */
export async function registerPilotOnChain(name) {
  return writeContract(
    CONTRACT_PILOT_REGISTRY,
    'register-pilot',
    [Cl.stringAscii(name)]
  );
}

/** Record a game result on-chain (500 uSTX fee, must be registered pilot) */
export async function recordGameOnChain(score) {
  return writeContract(
    CONTRACT_PILOT_REGISTRY,
    'record-game',
    [Cl.uint(score)]
  );
}

/** Get full pilot profile */
export async function getPilotOnChain(playerAddress) {
  return readOnly(
    CONTRACT_PILOT_REGISTRY,
    'get-pilot',
    [Cl.principal(playerAddress)]
  );
}

/** Look up a pilot by name */
export async function getPilotByNameOnChain(name) {
  return readOnly(
    CONTRACT_PILOT_REGISTRY,
    'get-pilot-by-name',
    [Cl.stringAscii(name)]
  );
}

/** Get total registered pilots */
export async function getTotalPilots() {
/** @constant {any} */
  const result = await readOnly(CONTRACT_PILOT_REGISTRY, 'get-total-pilots');
  return typeof result === 'number' ? result : (result || 0);
}
