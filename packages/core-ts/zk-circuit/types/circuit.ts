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

export namespace TPrivacyPool {
  export type PubInT<T = bigint> = {
    commitFlag: T
    publicVal: T
    scope: T
    actualMerkleTreeDepth: T
    inputNullifier: T[]
    outputCommitment: T[]
  }

  export type PrivInT<T = bigint | string> = {
    inputPublicKey: T[][]
    inputValue: T[]
    inputSalt: T[]
    inputSigR8: T[][]
    inputSigS: T[]
    inputLeafIndex: T[]
    merkleProofSiblings: T[][]
    outputPublicKey: T[][]
    outputValue: T[]
    outputSalt: T[]
  }

  export type InT = PubInT & PrivInT

  export type ProofT<T = bigint> = {
    pi_a: T[]
    pi_b: T[][]
    pi_c: T[]
    protocol: string
    curve: string
  }
  export type PublicSignalsT<T = bigint> = T[]
  export type OutputT = {
    proof: ProofT
    publicSignals: PublicSignalsT
  }

  export type PackedGroth16ProofT<T = bigint | string> = [
    [T, T], // pi_a
    [[T, T], [T, T]], // pi_b
    [T, T], // pi_c
    [T, T, T, T, T, T, T, T, T] // publicInput
  ]
}
