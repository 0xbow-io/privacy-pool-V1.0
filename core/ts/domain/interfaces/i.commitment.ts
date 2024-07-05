import type { CipherText } from "@zk-kit/poseidon-cipher"
import type { Point } from "@zk-kit/baby-jubjub"
import type { TCommitment } from "@privacy-pool-v1/core-ts/domain"
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
    }
  > {
    index: bigint
    isDummy: () => boolean
    commitmentRoot: bigint
    nullRoot: bigint
    public: () => PubT
    isEqual: (c: CommitmentI) => boolean
    asTuple: () => TCommitment.TupleT
    hash: () => bigint

    toJSON: () => {
      public: PubT
      private: PrivT
      hash: string
      cRoot: string
      nullRoot: string
    }
  }
}
