import * as snarkjs from "snarkjs"
import {
  type TPrivacyPool,
  type MerkleProofT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import { type Commitment } from "@privacy-pool-v1/core-ts/account"
import { FnCommitment } from "@privacy-pool-v1/core-ts/account"
import {
  MERKLE_TREE_MAX_DEPTH,
  DummyMerkleProof
} from "@privacy-pool-v1/core-ts/zk-circuit"
import { LeanIMT, type LeanIMTMerkleProof } from "@zk-kit/lean-imt"

export namespace FnPrivacyPool {
  export function MerkleProofFn(index: bigint, mt: LeanIMT): MerkleProofT {
    let proof: LeanIMTMerkleProof
    try {
      proof = mt.generateProof(Number(index))
    } catch (e) {
      throw new Error("MerkleProofFn failed", { cause: e })
    }

    const depth = proof.siblings.length

    for (let i = 0; i < MERKLE_TREE_MAX_DEPTH; i += 1) {
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
    inputs: Commitment[],
    outputs: Commitment[],
    signalHash: bigint
  ): TPrivacyPool.InT {
    const proofs = inputs.map((input) =>
      input.isDummy ? DummyMerkleProof : MerkleProofFn(input.index, mt)
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
        proofs[0].Root > 0n ? proofs[0].Depth : proofs[1].Depth,
      inLeafIndices: proofs.map((proof) => proof.LeafIndex),
      merkleProofSiblings: proofs.map((proof) => proof.Siblings)
    }
  }

  export async function ProveFn(
    inputs: snarkjs.CircuitSignals,
    wasm_path: string,
    zKey_path: string
  ): Promise<{
    proof: snarkjs.Groth16Proof
    publicSignals: snarkjs.PublicSignals
  }> {
    try {
      const wtns = { data: new Uint8Array(), type: "mem" }
      await snarkjs.wtns.calculate(inputs, wasm_path, wtns)
      const out = await snarkjs.groth16.prove(
        zKey_path,
        // @ts-ignore
        wtns
      )
      return out
    } catch (e) {
      console.log(e)
      throw new Error("snarkjs.groth16 fullProve failed ", { cause: e })
    }
  }

  export async function VerifyFn(
    vKJSON: any,
    publicSignals: snarkjs.PublicSignals,
    proof: snarkjs.Groth16Proof
  ): Promise<boolean> {
    const out = await snarkjs.groth16
      .verify(vKJSON, publicSignals, proof)
      .then((output) => {
        return output
      })
      .catch((e) => {
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

  export async function AsGroth16CallData(
    outputs: TPrivacyPool.OutputT 
  ) {
    return [
      [
        outputs.proof.pi_a[0],
        outputs.proof.pi_a[1]
      ],
      [
          [
            outputs.proof.pi_b[0][1],
              outputs.proof.pi_b[0][0]
          ],
          [
            outputs.proof.pi_b[1][1],
            outputs.proof.pi_b[1][0],
          ],
      ],
      [
        outputs.proof.pi_c[0],
          outputs.proof.pi_c[1]
      ],
      [
        outputs.publicSignals[0],
        outputs.publicSignals[1],
        outputs.publicSignals[2],
        outputs.publicSignals[3],
        outputs.publicSignals[4],
        outputs.publicSignals[5],
        outputs.publicSignals[6],
        outputs.publicSignals[7],
      ]
    ]
  }
}
