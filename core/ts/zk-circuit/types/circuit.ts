import type { Groth16Proof, PublicSignals } from "snarkjs"
import type { LeanIMT } from "@zk-kit/lean-imt"
import type { Commitment, TCommitment } from "@privacy-pool-v1/core-ts/domain"
import type { Point } from "@zk-kit/baby-jubjub"

export type Groth16_VKeyJSONT = {
  protocol: string
  curve: string
  nPublic: number
  vk_alpha_1: string[]
  vk_beta_2: string[][]
  vk_gamma_2: string[][]
  vk_delta_2: string[][]
  vk_alphabeta_12: string[][][]
  IC: string[][]
}

export type CircomArtifactT = string | Uint8Array | Groth16_VKeyJSONT
export type CircomArtifactsT = {
  wasm: CircomArtifactT
  zKey: CircomArtifactT
  vKey: CircomArtifactT
}

export type Groth16ProofT<T = bigint> = {
  pi_a: T[]
  pi_b: T[][]
  pi_c: T[]
  protocol: string
  curve: string
}

// Note, this is for the params:
// 32, 7, 4, 2, 2
// which is the default params for the circuit
// Max Merkle Depth of 32
// Cipher Text of 7 elements
// Commitment tuple of 4 elements
// 2 existing & 2 new commitments
export type StdPackedGroth16ProofT<T = bigint | string> = [
  [T, T], // pi_a
  [[T, T], [T, T]], // pi_b
  [T, T], // pi_c
  [
    /// **** Public Output Signals ****
    T, // newRoot[0]
    T, // newRoot[1]
    T, // newRoot[2]
    T, // newRoot[3]
    T, // newCommitmentRoot[0]
    T, // newCommitmentRoot[1]
    T, // newCommitmentRoot[2]
    T, // newCommitmentRoot[3]
    T, // newCommitmentHash[0]
    T, // newCommitmentHash[1]
    T, // newCommitmentHash[2]
    T, // newCommitmentHash[3]
    /// **** End of Public Output Signals ****
    /// **** Public Input Signals ****
    T, // scope
    T, // actualTreeDepth
    T, // context
    T, // externIO[0]
    T, // externIO[1]
    T, // existingStateRoot
    T, // newSaltPublicKey[0][0]
    T, // newSaltPublicKey[0][1]
    T, // newSaltPublicKey[1][0]
    T, // newSaltPublicKey[1][1]
    T, // newCiphertext[0][0]
    T, // newCiphertext[0][1]
    T, // newCiphertext[0][2]
    T, // newCiphertext[0][3]
    T, // newCiphertext[0][4]
    T, // newCiphertext[0][5]
    T, // newCiphertext[0][6]
    T, // newCiphertext[1][0]
    T, // newCiphertext[1][1]
    T, // newCiphertext[1][2]
    T, // newCiphertext[1][3]
    T, // newCiphertext[1][4]
    T, // newCiphertext[1][5]
    T // newCiphertext[1][6]
    /// **** End of Public Input Signals ****
  ] // publicInput
]

export type PublicSignalsT<T = bigint> = T[]

export type SnarkJSOutputT = {
  proof: Groth16Proof
  publicSignals: PublicSignals
}

export type CircomOutputT = {
  proof: Groth16ProofT
  publicSignals: PublicSignalsT
}

export namespace TPrivacyPool {
  export type PubInT<T = bigint> = {
    scope: T
    actualTreeDepth: T
    context: T
    externIO: [T, T]
    existingStateRoot: T
    newSaltPublicKey: [T, T][]
    newCiphertext: TCommitment.CipherT[]
  }

  export type PrivInT<T = bigint> = {
    privateKey: T[]
    nonce: T[]
    exSaltPublicKey: [T, T][]
    exCiphertext: TCommitment.CipherT[]
    exIndex: T[]
    exSiblings: T[][]
  }

  export type PublicOutT<T = bigint> = {
    newNullRoot: T[]
    newCommitmentRoot: T[]
    newCommitmentHash: T[]
  }

  export type InT = PubInT & PrivInT

  export type CircuitInT<T = bigint> = {
    inputs: InT
    expectedOut: PublicOutT<T>
  }

  export type GetCircuitInArgsT = {
    scope: bigint
    context: bigint
    mt: LeanIMT
    maxDepth: number
    pkScalars: bigint[]
    nonces: bigint[]
    existing: Commitment[]
    new: Commitment[]
  }
}
