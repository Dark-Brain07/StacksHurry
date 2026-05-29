import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;

describe('powerup-store contract', () => {
  it('allows user to buy a multi-shot powerup', () => {
    // Buy multi-shot (id: u1, cost: 250 uSTX)
    const response = simnet.callPublicFn(
      'powerup-store',
      'buy-powerup',
      [Cl.uint(1)],
      wallet1
    );

    // buy-powerup returns (ok powerup-id)
    expect(response.result).toBeOk(Cl.uint(1));

    // Verify ownership
    const hasPowerup = simnet.callReadOnlyFn(
      'powerup-store',
      'has-powerup',
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(hasPowerup.result).toBeBool(true);
  });

  it('fails if powerup ID is invalid', () => {
    const response = simnet.callPublicFn(
      'powerup-store',
      'buy-powerup',
      [Cl.uint(99)], // Invalid ID
      wallet1
    );

    // ERR_INVALID_ITEM = u100
    expect(response.result).toBeErr(Cl.uint(100));
  });

  it('fails if user tries to buy same powerup again', () => {
    // Wallet1 buys multi-shot (id: 1)
    simnet.callPublicFn(
      'powerup-store',
      'buy-powerup',
      [Cl.uint(1)],
      wallet1
    );

    // Try to buy again
    const response = simnet.callPublicFn(
      'powerup-store',
      'buy-powerup',
      [Cl.uint(1)],
      wallet1
    );

    // ERR_ALREADY_OWNED = u102
    expect(response.result).toBeErr(Cl.uint(102));
  });
});
