import type {
  TCommitment,
  TPrivacyKey
} from "@privacy-pool-v1/core-ts/account/types"
import type { PubKey } from "maci-domainobjs"
import type { Signature } from "maci-crypto"
import {
  hash5,
  hash4,
  genRandomBabyJubValue,
  verifySignature
} from "maci-crypto"
import type { Ciphertext } from "maci-crypto"

export namespace FnCommitment {
  // Hash function for commitment
  // Default: Poseidon(4)([secrets.value, pubKey[0], pubKey[1], secrets.salt])
  export const hashFn =
    <ST extends TCommitment.SecretsT, PkT extends PubKey>(
      pubKey: PkT,
      hasFn: (args: bigint[]) => bigint = hash4
    ) =>
    (secrets: ST): bigint =>
      hasFn([
        secrets.value ?? 0n,
        pubKey.rawPubKey[0],
        pubKey.rawPubKey[1],
        secrets.salt ?? 0n
      ])

  export function VerifySignatureFn(
    signature: Signature,
    pubKey: bigint[],
    inputs: bigint[]
  ): boolean {
    try {
      return verifySignature(hash4(inputs), signature, [pubKey[0], pubKey[1]])
    } catch (e) {
      console.log(" caught error, ", e)
      return false
    }
  }

  // circom: PoseidonHasher(5)([commitment, leafIndex, signature_R8[0], signature_R8[1], signature_S]);
  export function NullifierFn(sig: Signature, hash: bigint, index: bigint) {
    return hash5([
      hash,
      index,
      BigInt(sig.R8[0]),
      BigInt(sig.R8[1]),
      BigInt(sig.S)
    ])
  }

  export function EncryptFn(
    encryptor: TPrivacyKey.EncryptorT,
    secrets: TCommitment.SecretsT,
    nonce: bigint
  ): Ciphertext {
    return encryptor([secrets.value || 0n, secrets.salt || 0n], nonce)
  }

  export function SaltFn(): bigint {
    return genRandomBabyJubValue()
  }
}
