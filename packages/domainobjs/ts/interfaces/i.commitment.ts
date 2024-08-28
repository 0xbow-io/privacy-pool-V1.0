import type { CipherText } from "@zk-kit/poseidon-cipher"
import type { Point } from "@zk-kit/baby-jubjub"
import type {
  TCommitment,
  MembershipProofJSON
} from "@privacy-pool-v1/domainobjs"
import type { LeanIMT } from "@zk-kit/lean-imt"
import type { Hex } from "viem"

export namespace ICommitment {
  export interface CommitmentI<
    PubT = {
      scope: bigint | string
      cipher: CipherText<bigint> | string[]
      saltPk: Point<bigint> | string[]
    },
    PrivT = {
      nonce: bigint | string
      value: bigint | string
      secret: Point<bigint> | string[]
    },
    RooT = {
      hash: bigint | string
      commitmentRoot: bigint | string
      nullRoot: bigint | string
    }
  > {
    setIndex: (mt: LeanIMT) => void
    index: bigint
    isVoid: () => boolean
    root: () => RooT
    commitmentRoot: bigint
    nullRoot: bigint
    public: () => PubT
    isEqual: (c: CommitmentI) => boolean
    asTuple: () => TCommitment.TupleT
    hash: () => bigint
    toJSON: () => TCommitment.CommitmentJSON
    membershipProof: (mt: LeanIMT) => MembershipProofJSON
  }
}
