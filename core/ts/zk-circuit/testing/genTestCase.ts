import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import type { TPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
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
    existingCommits: Commitment[] = [0, 1].map((i) => {
      const c = NewCommitment({
        _pK: keys[i],
        _nonce: nonces[i],
        _scope: scope,
        _value: values[i]
      })
      stateTree.insert(c.commitmentRoot)
      // confirm mt has the leaf exists
      if (!stateTree.has(c.commitmentRoot)) {
        throw new Error("failed to insert commitment into state tree")
      }
      c.index = BigInt(stateTree.indexOf(c.commitmentRoot))
      return c
    }),
    newCommits: Commitment[] = [2, 3].map((i) =>
      NewCommitment({
        _pK: keys[i],
        _nonce: nonces[i],
        _scope: scope,
        _value: values[i]
      })
    )
  ): {
    case: string
    inputs: TPrivacyPool.InT
    expectedOutputs: TPrivacyPool.PublicOutT<bigint>
    expectPass: boolean
  } => {
    const _args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: stateTree,
      maxDepth: 32,
      pkScalars: keys.map((k) => deriveSecretScalar(k)),
      nonces: nonces,
      existing: existingCommits,
      new: newCommits
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
