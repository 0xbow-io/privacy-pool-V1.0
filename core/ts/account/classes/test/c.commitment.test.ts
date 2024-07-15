import type {
  Commitment,
  PrivacyKey,
  TCommitment
} from "@privacy-pool-v1/core-ts/account"
import {
  CreateCommitment,
  CreatePrivacyKey,
  FnCommitment
} from "@privacy-pool-v1/core-ts/account"
import { expect, test, describe, beforeEach } from "bun:test"

import type { Ciphertext, Plaintext } from "maci-crypto"
import { hash4 } from "maci-crypto"

describe("Creating Commitments with Signature & Nullifier", () => {
  let pK: PrivacyKey
  beforeEach(() => {
    pK = CreatePrivacyKey()
  })

  test("Creating with salt & index specified", () => {
    const test_index: bigint = 1n
    const test_secret: TCommitment.SecretsT = {
      value: 100n,
      salt: FnCommitment.SaltFn()
    }
    const test_commitment_hash = FnCommitment.hashFn(pK.pubKey)(test_secret)
    const sig_msg = hash4([
      ...pK.pubKey.asArray(),
      test_commitment_hash,
      test_index
    ])

    const test_signature = pK.sign(sig_msg)

    const test_nullifier = FnCommitment.NullifierFn(
      test_signature,
      test_commitment_hash,
      test_index
    )

    const commitment: Commitment = CreateCommitment(pK, test_secret, test_index)
    expect(commitment).toBeDefined()
    expect(commitment.index).toBe(test_index)
    expect(commitment.hash()).toEqual(test_commitment_hash)
    expect(commitment.signature).toEqual(test_signature)
    expect(commitment.nullifier).toEqual(test_nullifier)
    expect(commitment.isVoid).not.toBeTrue()

    // check that a valid signature is produced
    expect(
      FnCommitment.VerifySignatureFn(
        commitment.signature,
        pK.pubKey.rawPubKey,
        commitment.asArray()
      )
    ).toBeTrue()

    const cipherText: Ciphertext = commitment.cipherText
    const plaintext: Plaintext = pK.decrypt(
      cipherText,
      commitment.nonce,
      commitment.secret_len
    )
    expect(plaintext.length).toBe(2)
    expect(plaintext[0]).toEqual(test_secret.value)
    expect(plaintext[1]).toEqual(test_secret.salt ?? 0n)
  })

  test("Creating with salt specified but no index ", () => {
    const test_secret: TCommitment.SecretsT = {
      value: 100n,
      salt: FnCommitment.SaltFn()
    }
    const test_commitment_hash = FnCommitment.hashFn(pK.pubKey)(test_secret)
    const commitment: Commitment = CreateCommitment(pK, test_secret)
    expect(commitment).toBeDefined()
    expect(commitment.hash()).toEqual(test_commitment_hash)
    expect(commitment.isVoid).not.toBeTrue()

    const cipherText: Ciphertext = commitment.cipherText
    const plaintext: Plaintext = pK.decrypt(
      cipherText,
      commitment.nonce,
      commitment.secret_len
    )
    expect(plaintext.length).toBe(2)
    expect(plaintext[0]).toEqual(test_secret.value)
    expect(plaintext[1]).toEqual(test_secret.salt ?? 0n)
  })

  test("Creating with only amount specified ", () => {
    const test_secret: TCommitment.SecretsT = {
      value: 100n
    }
    const commitment: Commitment = CreateCommitment(pK, test_secret)
    expect(commitment).toBeDefined()
    expect(commitment.isVoid).not.toBeTrue()

    const cipherText: Ciphertext = commitment.cipherText
    const plaintext: Plaintext = pK.decrypt(
      cipherText,
      commitment.nonce,
      commitment.secret_len
    )
    expect(plaintext.length).toBe(2)
    expect(plaintext[0]).toEqual(test_secret.value)
  })

  test("Creating with 0 amount", () => {
    const test_secret: TCommitment.SecretsT = {
      value: 0n
    }
    const commitment: Commitment = CreateCommitment(pK, test_secret)
    expect(commitment).toBeDefined()
    expect(commitment.isVoid).toBeTrue()
  })
})
