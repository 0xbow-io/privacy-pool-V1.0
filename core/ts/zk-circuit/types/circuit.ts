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
    publicVal: T
    signalHash: T
    actualMerkleTreeDepth: T
  }

  export type PrivInT<T = bigint | string> = {
    inputNullifier: T[]
    inUnits: T[]
    inPk: T[][]
    inBlinding: T[]
    inSigR8: T[][]
    inSigS: T[]
    inLeafIndices: T[]
    merkleProofSiblings: T[][]
    outCommitment: T[]
    outUnits: T[]
    outPk: T[][]
    outBlinding: T[]
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
    [T, T],           // pi_a
    [[T, T], [T, T]], // pi_b
    [T, T],           // pi_c
    [T, T, T, T, T, T, T, T] // publicInput
  ];
}


