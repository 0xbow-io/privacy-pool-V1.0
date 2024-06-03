import { expect, test, describe, beforeAll } from 'bun:test';
import { PrivacyKey, privacyKey } from '@core/account/models';

describe('Generating a PrivacyKey', () => {
  test('No PrivateKey given, should pass', () => {
    const pk = new privacyKey();
    expect(pk).toBeDefined();
    expect(pk.privateKey).not.toBe('0x');
    expect(pk.account).not.toBe({});
    expect(pk.keypair).not.toBeNull();
    expect(pk.eK).not.toEqual([0n, 0n]);
  });
  test('Valid PrivateKey given, should pass', () => {
    const pk = new privacyKey();
    expect(pk).toBeDefined();
    expect(pk).toBeDefined();
    expect(pk.privateKey).not.toBe('0x');
    expect(pk.account).not.toBe({});
    expect(pk.keypair).not.toBeNull();
    expect(pk.eK).not.toEqual([0n, 0n]);
  });
  test('Invalid privatekey given, should throw error', () => {
    expect(() => {
      new privacyKey('0x');
    }).toThrow();
  });
});

describe('Test PrivacyKey Actions', () => {
  let pK: PrivacyKey;
  beforeAll(() => {
    pK = new privacyKey();
  });
  test('PublicAddress should return a valid address', () => {
    const address = pK.publicAddress;
    const expected = pK.account.address;
    expect(address).toBe(expected);
  });
  test('Encrypt should return a valid Ciphertext', () => {
    const secret = [1n, 2n, 3n];
    const nonce = 1n;
    const ciphertext = pK.encrypt(secret, nonce);
    expect(ciphertext).toBeDefined();
  });
  test('Decrypt should return a valid Plaintext', () => {
    const secret = [1n, 2n, 3n];
    const nonce = 1n;
    const ciphertext = pK.encrypt(secret, nonce);
    const plaintext = pK.decrypt(ciphertext, nonce, secret.length);
    expect(plaintext).not.toBeNull();
    expect(plaintext![0]).toBe(secret[0]);
    expect(plaintext![1]).toBe(secret[1]);
  });
  test('Sign message should return a valid signature', () => {
    const message = 100n;
    const signature = pK.signMsg(message);
    expect(signature.R8[0]).not.toBe(0n);
    expect(signature.R8[1]).not.toBe(0n);
    expect(signature.S).not.toBe(0n);
  });
  test('Decrypt with a different privacy key should not return a valid Plaintext', () => {
    const secret = [1n, 2n, 3n];
    const nonce = 1n;
    const ciphertext = pK.encrypt(secret, nonce);
    const pK2 = new privacyKey();
    expect(() => {
      pK2.decrypt(ciphertext, nonce, secret.length);
    }).toThrow();
  });
});
