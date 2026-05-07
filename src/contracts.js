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
const DEPLOYER = 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF';
const NETWORK = 'mainnet';

export const CONTRACTS = {
  OPEN_MINT_NFT:  `${DEPLOYER}.open-mint-nft`,
  CHARACTER_NFT:  `${DEPLOYER}.character-nft`,
  SCORE:          `${DEPLOYER}.score`,
  ROCKET_SHOOTER: `${DEPLOYER}.rocket-shooter`,
};

// ─── Helper: Read-only contract call ───
async function readOnly(contractId, functionName, args = []) {
  try {
    const [contractAddress, contractName] = contractId.split('.');
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
async function writeContract(contractId, functionName, functionArgs) {
  const hexArgs = functionArgs.map(arg => Cl.serialize(arg));

  const result = await request('stx_callContract', {
    contract: contractId,
    functionName,
    functionArgs: hexArgs,
    network: NETWORK,
  });

  console.log(`TX submitted:`, result);
  return result;
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
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-score',
    [Cl.principal(playerAddress)]
  );
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
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-high-score',
    [Cl.principal(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}

/** Get total player count */
export async function getPlayerCount() {
  const result = await readOnly(CONTRACTS.ROCKET_SHOOTER, 'get-player-count');
  return typeof result === 'number' ? result : (result || 0);
}

/** Get games played for a player */
export async function getGamesPlayed(playerAddress) {
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-games-played',
    [Cl.principal(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}
