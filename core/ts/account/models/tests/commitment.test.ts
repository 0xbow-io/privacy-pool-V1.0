import { expect, test, describe, beforeAll } from 'bun:test';
import { privacyKey, PrivacyKey, Commitment } from '@core/account/models';

describe('Test Commitment', () => {
  let pK: PrivacyKey;
  beforeAll(() => {
    pK = new privacyKey();
  });

  test('Dummy commitment without signature', () => {
    const commit = new Commitment(pK);
    expect(commit).toBeDefined();
    expect(commit.dummy).toBe(true);
    expect(commit.hash).not.toBe(0n);
    expect(commit.secrets.blinding).toBeGreaterThan(0n);
    expect(commit.nullifier).toBeUndefined(); // since we didn't sign it
  });

  test('Non-dummy commitment without signature', () => {
    const commit = new Commitment(pK, { amount: 100n });
    expect(commit).toBeDefined();
    expect(commit.hash).not.toBe(0n);
    expect(commit.secrets.blinding).toBeGreaterThan(0n);
    expect(commit.nullifier).toBeUndefined(); // since we didn't sign it
  });

  test('Non-dummy commitment and sign later', () => {
    const commit = new Commitment(pK, { amount: 100n });
    commit.SignWithKey(pK, 100n);
    expect(commit).toBeDefined();
    expect(commit.dummy).toBe(false);
    expect(commit.hash).not.toBe(0n);
    expect(commit.secrets.blinding).toBeGreaterThan(0n);
    expect(commit.signature).not.toBe(0n);
    expect(commit.nullifier).not.toBe(0n);
  });
  test('Non-dummy & signed commitment ', () => {
    const commit = new Commitment(pK, { amount: 100n }, 0n, { sign: true });
    expect(commit).toBeDefined();
    expect(commit.dummy).toBe(false);
    expect(commit.hash).not.toBe(0n);
    expect(commit.secrets.blinding).toBeGreaterThan(0n);
    expect(commit.signature).not.toBe(0n);
    expect(commit.nullifier).not.toBe(0n);
  });
  test('Non-dummy, signed & encrypted commitment ', () => {
    const index = 20n;
    const secret = {
      amount: 100n,
    };
    const nonce = 1n;

    const commit = new Commitment(pK, secret, index, {
      sign: true,
      encrypt: true,
      encryptionNonce: nonce,
    });
    expect(commit).toBeDefined();
    expect(commit.hash).not.toBe(0n);
    expect(commit.dummy).toBe(false);
    expect(commit.secrets.blinding).toBeGreaterThan(0n);
    expect(commit.signature).not.toBe(0n);
    expect(commit.nullifier).not.toBe(0n);
    expect(commit.cipher).toBeDefined();

    // Decrypt the cipher text
    // re-create a commitment with the decrypted secrets
    // and check if the hash is the same
    // if the hash is the same, then the decryption was successful
    // and the commitment is valid
    expect(() => {
      const secrets = pK.decrypt(commit.cipher!, 1n, 2);
      const newCommit = new Commitment(pK, { amount: secrets![0], blinding: secrets![1] }, index, {
        sign: true,
      });
      expect(newCommit.SameAs(commit));
      expect(newCommit.nullifier).toBe(commit.nullifier!);
    }).not.toThrow();
  });
});
