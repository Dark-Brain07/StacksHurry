/**
 * Stacks Hurry - Contract Interaction Layer
 * Wraps all 4 deployed Clarity contracts on Stacks mainnet
 */

import { openContractCall, openSTXTransfer } from '@stacks/connect';
import {
  uintCV,
  principalCV,
  callReadOnlyFunction,
  cvToValue,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

// ─── Contract Addresses ───
const DEPLOYER = 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF';

export const CONTRACTS = {
  OPEN_MINT_NFT: { address: DEPLOYER, name: 'open-mint-nft' },
  CHARACTER_NFT: { address: DEPLOYER, name: 'character-nft' },
  SCORE:         { address: DEPLOYER, name: 'score' },
  ROCKET_SHOOTER:{ address: DEPLOYER, name: 'rocket-shooter' },
};

const network = new StacksMainnet();

// ─── Helper: Read-only contract call ───
async function readOnly(contract, functionName, args = []) {
  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress: contract.address,
      contractName: contract.name,
      functionName,
      functionArgs: args,
      senderAddress: contract.address,
    });
    return cvToValue(result);
  } catch (err) {
    console.error(`Read-only call failed: ${contract.name}.${functionName}`, err);
    return null;
  }
}

// ─── Helper: Write contract call ───
function writeContract(contract, functionName, args, onFinish, onCancel) {
  openContractCall({
    network,
    contractAddress: contract.address,
    contractName: contract.name,
    functionName,
    functionArgs: args,
    onFinish: (data) => {
      console.log(`TX submitted: ${data.txId}`);
      if (onFinish) onFinish(data);
    },
    onCancel: () => {
      console.log('TX cancelled');
      if (onCancel) onCancel();
    },
  });
}

// ══════════════════════════════════════════
// 1. OPEN MINT NFT
// ══════════════════════════════════════════

/** Mint an open-edition NFT to the given recipient */
export function mintOpenNFT(recipientAddress, onFinish, onCancel) {
  writeContract(
    CONTRACTS.OPEN_MINT_NFT,
    'mint',
    [principalCV(recipientAddress)],
    onFinish,
    onCancel
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
export function submitHighScore(score, onFinish, onCancel) {
  writeContract(
    CONTRACTS.SCORE,
    'submit-score',
    [uintCV(score)],
    onFinish,
    onCancel
  );
}

/** Get a player's hall-of-fame high score */
export async function getHallOfFameScore(playerAddress) {
  const result = await readOnly(
    CONTRACTS.SCORE,
    'get-high-score',
    [principalCV(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}

// ══════════════════════════════════════════
// 4. ROCKET SHOOTER CONTRACT (Free score submit)
// ══════════════════════════════════════════

/** Submit game score (free, just gas) */
export function submitGameScore(score, onFinish, onCancel) {
  writeContract(
    CONTRACTS.ROCKET_SHOOTER,
    'submit-score',
    [uintCV(score)],
    onFinish,
    onCancel
  );
}

/** Get player's full score data { highScore, gamesPlayed, lastPlayed } */
export async function getPlayerScore(playerAddress) {
  const result = await readOnly(
    CONTRACTS.ROCKET_SHOOTER,
    'get-score',
    [principalCV(playerAddress)]
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
    [principalCV(playerAddress)]
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
    [principalCV(playerAddress)]
  );
  return typeof result === 'number' ? result : (result || 0);
}
