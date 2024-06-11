import { Commitment, CreateCommitment } from '@core/account/classes';
import { PrivacyKey, CreatePrivacyKey } from '@core/account/classes';
import { FnCommitment } from '@core/account/functions';
import { TCommitment } from '@core/account/types';
import { Ciphertext, Plaintext } from 'maci-crypto';

describe('Creating Commitments with Signature & Nullifier', () => {
  let pK: PrivacyKey;
  beforeEach(() => {
    pK = CreatePrivacyKey();
  });

  test('Creating with blinding & index specified', () => {
    const test_index: bigint = 1n;
    const test_secret: TCommitment.SecretsT = {
      amount: 100n,
      blinding: FnCommitment.BlinderFn(),
    };
    const test_commitment_hash = FnCommitment.HashFn(test_secret, pK.pubKey);
    const test_signature = FnCommitment.SignatureFn(pK.signer, test_commitment_hash, test_index);
    const test_nullifier = FnCommitment.NullifierFn(
      test_signature,
      test_commitment_hash,
      test_index,
    );

    const commitment: Commitment = CreateCommitment(pK, test_secret, test_index);
    expect(commitment).toBeDefined();
    expect(commitment.index).toBe(test_index);
    expect(commitment.hash).toEqual(test_commitment_hash);
    expect(commitment.signature).toEqual(test_signature);
    expect(commitment.nullifier).toEqual(test_nullifier);
    expect(commitment.isDummy).not.toBeTrue();

    const cipherText: Ciphertext = commitment.cipherText;
    const plaintext: Plaintext = pK.decryptor(cipherText, commitment.nonce, commitment.secret_len);
    expect(plaintext.length).toBe(2);
    expect(plaintext[0]).toEqual(test_secret.amount);
    expect(plaintext[1]).toEqual(test_secret.blinding);
  });

  test('Creating with blinding specified but no index ', () => {
    const test_secret: TCommitment.SecretsT = {
      amount: 100n,
      blinding: FnCommitment.BlinderFn(),
    };
    const test_commitment_hash = FnCommitment.HashFn(test_secret, pK.pubKey);
    const commitment: Commitment = CreateCommitment(pK, test_secret);
    expect(commitment).toBeDefined();
    expect(commitment.hash).toEqual(test_commitment_hash);
    expect(commitment.isDummy).not.toBeTrue();

    const cipherText: Ciphertext = commitment.cipherText;
    const plaintext: Plaintext = pK.decryptor(cipherText, commitment.nonce, commitment.secret_len);
    expect(plaintext.length).toBe(2);
    expect(plaintext[0]).toEqual(test_secret.amount);
    expect(plaintext[1]).toEqual(test_secret.blinding);
  });

  test('Creating with only amount specified ', () => {
    const test_secret: TCommitment.SecretsT = {
      amount: 100n,
    };
    const commitment: Commitment = CreateCommitment(pK, test_secret);
    expect(commitment).toBeDefined();
    expect(commitment.isDummy).not.toBeTrue();

    const cipherText: Ciphertext = commitment.cipherText;
    const plaintext: Plaintext = pK.decryptor(cipherText, commitment.nonce, commitment.secret_len);
    expect(plaintext.length).toBe(2);
    expect(plaintext[0]).toEqual(test_secret.amount);
  });

  test('Creating with 0 amount', () => {
    const test_secret: TCommitment.SecretsT = {
      amount: 0n,
    };
    const commitment: Commitment = CreateCommitment(pK, test_secret);
    expect(commitment).toBeDefined();
    expect(commitment.isDummy).toBeTrue();
  });
});
