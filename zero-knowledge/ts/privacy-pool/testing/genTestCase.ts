import { FnPrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import type { TPrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import type { LeanIMT } from "@zk-kit/lean-imt"
import type { Hex } from "viem"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import { NewCommitment } from "@privacy-pool-v1/core-ts/domain"
import type { Commitment } from "@privacy-pool-v1/core-ts/domain"

export type TestCaseData = {
  case: string
  inputs: TPrivacyPool.InT
  expectedOutputs: TPrivacyPool.PublicOutT<bigint>
  expectPass: boolean
}

export const genTestCase =
  (
    caseName: string,
    scope: bigint,
    stateTree: LeanIMT,
    keys: [Hex, Hex, Hex, Hex],
    nonces: [bigint, bigint, bigint, bigint],
    values: [bigint, bigint, bigint, bigint],
    outModifiers: bigint[][],
    expectPass: boolean
  ) =>
  (
    commits: Commitment[] = [0, 1, 2, 3].map((i) => {
      const c = NewCommitment({
        _pK: keys[i],
        _scope: scope,
        _nonce: nonces[i],
        _value: values[i]
      })
      return c
    })
  ): {
    case: string
    inputs: TPrivacyPool.InT
    expectedOutputs: TPrivacyPool.PublicOutT<bigint>
    expectPass: boolean
  } => {
    // batch insert leaves into the stateTree
    const leaves = commits.flatMap((c) => [c.commitmentRoot, c.nullRoot])
    stateTree.insertMany(leaves)
    // set the indexes of the commitments
    for (let i = 0; i < commits.length; i++) {
      commits[i].setIndex(stateTree)
    }

    const _args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: stateTree,
      maxDepth: 32,
      pkScalars: keys.map((k) => deriveSecretScalar(k)),
      nonces: nonces,
      existing: commits.slice(0, 2),
      new: commits.slice(2, 4)
    })()
    return {
      case: caseName,
      inputs: _args.inputs,
      expectPass: expectPass,
      expectedOutputs: {
        newNullRoot: _args.expectedOut.newNullRoot.map(
          (v, i) => v * outModifiers[0][i]
        ),
        newCommitmentRoot: _args.expectedOut.newCommitmentRoot.map(
          (v, i) => v * outModifiers[1][i]
        ),
        newCommitmentHash: _args.expectedOut.newCommitmentHash.map(
          (v, i) => v * outModifiers[2][i]
        )
      }
    }
  }
