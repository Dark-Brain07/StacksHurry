import { describe, it, expect, beforeEach } from 'vitest';
import { Cl, cvToValue } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('pilot-registry contract', () => {
  it('ensures deployer account is defined', () => {
    expect(deployer).toBeDefined();
  });

  it('allows a user to register a valid pilot name', () => {
    const response = simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Maverick')],
      wallet1
    );

    expect(response.result).toBeOk(Cl.bool(true));

    // Verify state
    const pilotData = simnet.callReadOnlyFn(
      'pilot-registry',
      'get-pilot',
      [Cl.principal(wallet1)],
      deployer
    );
    const data = cvToValue(pilotData.result);
    // data is { value: { name: "Maverick", "games-played": 0n, "best-score": 0n, "registered-at": 3n } }
    expect(data.value.name.value).toEqual('Maverick');
    expect(data.value['games-played'].value).toEqual('0');
    expect(data.value['best-score'].value).toEqual('0');
  });

  it('fails if name is less than 3 characters', () => {
    const response = simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Ma')],
      wallet1
    );
    // ERR_NAME_TOO_SHORT = u102
    expect(response.result).toBeErr(Cl.uint(102));
  });

  it('fails if user registers twice', () => {
    simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Iceman')],
      wallet2
    );

    const response2 = simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Viper')],
      wallet2
    );
    // ERR_ALREADY_REGISTERED = u100
    expect(response2.result).toBeErr(Cl.uint(100));
  });

  it('fails if name is already taken', () => {
    // Wallet1 registers Maverick
    simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Maverick')],
      wallet1
    );

    // Wallet2 tries to register same name
    const response = simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Maverick')],
      wallet2
    );
    
    // ERR_NAME_TAKEN = u101
    expect(response.result).toBeErr(Cl.uint(101));
  });

  it('allows user to record a game and updates stats', () => {
    // Register first
    simnet.callPublicFn(
      'pilot-registry',
      'register-pilot',
      [Cl.stringAscii('Maverick')],
      wallet1
    );

    const response = simnet.callPublicFn(
      'pilot-registry',
      'record-game',
      [Cl.uint(5000)], // Score 5000
      wallet1
    );

    expect(response.result).toBeOk(Cl.bool(true));

    // Verify stats updated
    const pilotData = simnet.callReadOnlyFn(
      'pilot-registry',
      'get-pilot',
      [Cl.principal(wallet1)],
      deployer
    );
    
    const data = cvToValue(pilotData.result);
    expect(data.value.name.value).toEqual('Maverick');
    expect(data.value['games-played'].value).toEqual('1');
    expect(data.value['best-score'].value).toEqual('5000');
  });
});
