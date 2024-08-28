import type { ICommitment, InclusionProofT } from "@privacy-pool-v1/domainobjs"
import type { Hex } from "viem"

export type MembershipProofJSON = TCommitment.MembershipProofJSON
export namespace TCommitment {
  export type TupleT<N = bigint> = [N, N, N, N]
  // 7 elements
  export type CipherT<N = bigint> = [N, N, N, N, N, N, N]
  export type CommitmentsT = ICommitment.CommitmentI[]

  export type CommitmentJSON = {
    public: {
      scope: string
      cipher: string[]
      saltPk: string[]
    }
    hash: string
    cRoot: Hex
    nullRoot: Hex
    pkScalar: Hex
    nonce: string
  }

  export type MembershipProofJSON = {
    public: {
      scope: {
        raw: string
        hex: Hex
      }
      cipher: string[]
      saltPk: string[]
      hash: {
        raw: string
        hex: Hex
      }
    }
    private: {
      inclusion: {
        stateRoot: {
          raw: string
          hex: Hex
        }
        index: string
        leafIndex: string
        stateDepth: string
        siblings: string[]
      }
      pkScalar: {
        raw: string
        hex: Hex
      }
      nonce: string
      root: {
        raw: string
        hex: Hex
      }
      null: {
        raw: string
        hex: Hex
      }
    }
  }
}
