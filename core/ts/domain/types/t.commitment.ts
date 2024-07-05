import type { ICommitment } from "@privacy-pool-v1/core-ts/domain"

export namespace TCommitment {
  export type TupleT<N = bigint> = [N, N, N, N]
  // 7 elements
  export type CipherT<N = bigint> = [N,N,N,N,N,N,N]
  export type CommitmentsT = ICommitment.CommitmentI[]
}
