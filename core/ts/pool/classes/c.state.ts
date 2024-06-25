import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite/poseidon2"
import type { IState } from "@privacy-pool-v1/core-ts/pool"
import type { MerkleProofT } from "@privacy-pool-v1/core-ts/zk-circuit"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

export namespace CState {
  export class stateC implements IState.StateI {
    MAX_MERKLE_DEPTH = 32
    merkleTree = new LeanIMT((a, b) => poseidon2([a, b]))
    nullifiers = new Set<bigint>()

    static newState = (): IState.StateI => new stateC()

    insertNullifier = (nullifier: bigint): boolean => {
      if (this.nullifiers.has(nullifier)) {
        return false
      }
      this.nullifiers.add(nullifier)
      return true
    }

    genProof = (args: { index: bigint }): MerkleProofT => {
      return FnPrivacyPool.MerkleProofFn(
        args.index,
        this.merkleTree,
        this.MAX_MERKLE_DEPTH
      )
    }
  }
}
