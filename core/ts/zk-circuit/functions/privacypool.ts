import * as snarkjs from "snarkjs"
import fs from "fs"

import type {
  MerkleProofT,
  Groth16_VKeyJSONT,
  TPrivacyPool
} from "@privacy-pool-v1/core-ts/zk-circuit"
import { type Commitment } from "@privacy-pool-v1/core-ts/account"
import { FnCommitment } from "@privacy-pool-v1/core-ts/account"
import { DummyMerkleProof } from "@privacy-pool-v1/core-ts/zk-circuit"
import { LeanIMT, type LeanIMTMerkleProof } from "@zk-kit/lean-imt"

import {
  isUrlOrFilePath,
  fetchJsonWithRetry,
  loadBytesFromUrl
} from "@privacy-pool-v1/global"

export namespace FnPrivacyPool {
  export function MerkleProofFn(
    index: bigint,
    mt: LeanIMT,
    maxDepth: number
  ): MerkleProofT {
    let proof: LeanIMTMerkleProof
    try {
      proof = mt.generateProof(Number(index))
    } catch (e) {
      throw new Error("MerkleProofn failed", { cause: e })
    }

    const depth = proof.siblings.length

    for (let i = 0; i < maxDepth; i += 1) {
      if (proof.siblings[i] === undefined) {
        proof.siblings[i] = BigInt(0)
      }
    }

    return {
      Root: proof.root,
      Depth: BigInt(depth),
      LeafIndex: index,
      Siblings: proof.siblings
    }
  }

  export function CalcPublicValFn(
    inputs: Commitment[],
    outputs: Commitment[]
  ): bigint {
    const outputSum = outputs.reduce(
      (acc, commitment) => acc + commitment.amount,
      0n
    )
    const inputSum = inputs.reduce(
      (acc, commitment) => acc + commitment.amount,
      0n
    )
    return (outputSum ?? 0n) - (inputSum ?? 0n)
  }

  export function GetInputsFn(
    mt: LeanIMT,
    maxDepth: number,
    inputs: Commitment[],
    outputs: Commitment[],
    signalHash: bigint
  ): TPrivacyPool.InT {
    const merkleProofs = inputs.map((input) =>
      input.isDummy
        ? DummyMerkleProof
        : MerkleProofFn(input.index, mt, maxDepth)
    )

    // check that signatures are valid
    inputs.forEach((input) => {
      if (
        !FnCommitment.VerifySignatureFn(
          input.signature,
          input.pubKey.rawPubKey,
          input.asArray()
        )
      ) {
        throw Error(`Invalid signatur found in input for ${input.hash}`)
      }
    })

    return {
      publicVal: CalcPublicValFn(inputs, outputs),
      signalHash: signalHash,
      inputNullifier: inputs.map((input) => input.nullifier),
      inUnits: inputs.map((input) => input.amount),
      inPk: inputs.map((input) => input.pubKey.asCircuitInputs()),
      inBlinding: inputs.map((input) => input.blinding),
      inSigR8: inputs.map((input) => [
        input.signature.R8[0],
        input.signature.R8[1]
      ]),
      inSigS: inputs.map((input) => input.signature.S),
      outCommitment: outputs.map((output) => output.hash),
      outUnits: outputs.map((output) => output.amount),
      outPk: outputs.map((output) => output.pubKey.asCircuitInputs()),
      outBlinding: outputs.map((output) => output.blinding),

      actualMerkleTreeDepth:
        merkleProofs[0].Root > 0n
          ? merkleProofs[0].Depth
          : merkleProofs[1].Depth,
      inLeafIndices: merkleProofs.map((proof) => proof.LeafIndex),
      merkleProofSiblings: merkleProofs.map((proof) => proof.Siblings)
    }
  }

  export const LoadVkeyFn = async (
    vKeyPath: string
  ): Promise<Groth16_VKeyJSONT> => {
    switch (isUrlOrFilePath(vKeyPath)) {
      case "file":
        return JSON.parse(fs.readFileSync(vKeyPath, "utf-8"))
      case "url":
        try {
          const data = await fetchJsonWithRetry<Groth16_VKeyJSONT>(vKeyPath)
          return data
        } catch (e) {
          throw new Error("Failed to load verifying key from URL", { cause: e })
        }
      default:
        throw new Error("Invalid path")
    }
  }

  export const loadBytesFn = async (
    filepath: string
  ): Promise<Uint8Array | string> => {
    if (isUrlOrFilePath(filepath) == "url") {
      const module = await loadBytesFromUrl(filepath)
        .then((uint8arr) => {
          return uint8arr
        })
        .catch((e) => {
          throw new Error("Failed to load wasm module from URL", { cause: e })
        })
      return module
    }
    return filepath
  }

  export const ProveFn = async (
    inputs: snarkjs.CircuitSignals,
    wasm: string | Uint8Array,
    zkey: string | Uint8Array
  ): Promise<{
    proof: snarkjs.Groth16Proof
    publicSignals: snarkjs.PublicSignals
  }> => {
    const out = await snarkjs.groth16
      .fullProve(inputs, wasm, zkey)
      .then((output) => {
        return output
      })
      .catch((e) => {
        console.log(e)
        throw new Error("snarkjs.groth16 fullProve failed ", { cause: e })
      })
    return out
  }

  export const VerifyFn = async (
    vKJSON: Groth16_VKeyJSONT,
    publicSignals: snarkjs.PublicSignals,
    proof: snarkjs.Groth16Proof
  ): Promise<boolean> => {
    const out = await snarkjs.groth16
      .verify(vKJSON, publicSignals, proof)
      .then((output) => {
        return output
      })
      .catch((e) => {
        console.log(e)
        throw new Error("snarkjs.groth16 verify failed ", { cause: e })
      })
    return out
  }

  export function ParseFn(
    proof: snarkjs.Groth16Proof,
    publicSignals: snarkjs.NumericString[]
  ): TPrivacyPool.OutputT {
    return {
      proof: {
        pi_a: proof.pi_a.map((x) => BigInt(x)) as bigint[],
        pi_b: proof.pi_b.map((x) => x.map((y) => BigInt(y))) as bigint[][],
        pi_c: proof.pi_c.map((x) => BigInt(x)) as bigint[],
        protocol: proof.protocol,
        curve: proof.curve
      } as TPrivacyPool.ProofT,
      publicSignals: publicSignals.map((x) => BigInt(x)) as bigint[]
    }
  }

  export function packGroth16ProofFn(
    outputs: TPrivacyPool.OutputT
  ): TPrivacyPool.PackedGroth16ProofT<bigint> {
    return [
      [outputs.proof.pi_a[0], outputs.proof.pi_a[1]],
      [
        [outputs.proof.pi_b[0][1], outputs.proof.pi_b[0][0]],
        [outputs.proof.pi_b[1][1], outputs.proof.pi_b[1][0]]
      ],
      [outputs.proof.pi_c[0], outputs.proof.pi_c[1]],
      [
        outputs.publicSignals[0],
        outputs.publicSignals[1],
        outputs.publicSignals[2],
        outputs.publicSignals[3],
        outputs.publicSignals[4],
        outputs.publicSignals[5],
        outputs.publicSignals[6],
        outputs.publicSignals[7]
      ]
    ]
  }
}
