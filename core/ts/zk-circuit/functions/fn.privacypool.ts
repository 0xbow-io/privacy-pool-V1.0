import type { CircuitSignals, Groth16Proof, PublicSignals } from "snarkjs"
import { groth16 } from "snarkjs"
import type {
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  MerkleProofT,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  PackedGroth16ProofT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import type { Commitment } from "@privacy-pool-v1/core-ts/account"
import { FnCommitment } from "@privacy-pool-v1/core-ts/account"
import { DummyMerkleProof } from "@privacy-pool-v1/core-ts/zk-circuit"

import { isUrlOrFilePath } from "@privacy-pool-v1/global/utils/path"
import {
  fetchJsonWithRetry,
  loadBytesFromUrl
} from "@privacy-pool-v1/global/utils/fetch"

export namespace FnPrivacyPool {
  /**
   * returns the public value which is the
  // difference between the sum of
   * output commitments and input commmitments
   * @param inputs A set of commitments
   * @param outputs A set of commitments
   * @param diff The difference between
            the sum of output
            commitments and input commitments
            either automatically calculated or provid a
            function to calculate the difference (diffFn)
   */

  export const calcPublicValFn =
    <
      argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      OuT extends {
        publicVal: bigint | number
        isCommit: boolean
      }
    >(
      args: argsT,
      diffFn: (args: argsT) => bigint | number = (
        args: argsT
      ): bigint | number =>
        (args.outputs
          ? args.outputs.reduce((acc, commitment) => acc + commitment.value, 0n)
          : 0n) -
        (args.inputs
          ? args.inputs.reduce((acc, commitment) => acc + commitment.value, 0n)
          : 0n)
    ) =>
    (diff: bigint | number = diffFn(args)): OuT => {
      return { publicVal: diff > 0n ? diff : -diff, isCommit: diff > 0n } as OuT
    }

  /**
   * computes merkle proof for a commitment
   * @param index leaf index of commitment
   * @param mt lean-incremental merkle tree from zk-kit
   * @param maxDepth maximum permitted depht of the merkle tree.
   */
  export const merkleProofFn =
    <
      argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      OuT extends Required<MerkleProofT>
    >(
      args: argsT
    ) =>
    (leafIndex: bigint | number): OuT => {
      if (!args.mt) {
        throw Error("Merkle tree is not defined")
      }
      try {
        const proof = args.mt.generateProof(Number(leafIndex))
        const depth = proof.siblings.length
        for (let i = 0; i < (args.maxDepth ? args.maxDepth : 32); i += 1) {
          if (proof.siblings[i] === undefined) {
            proof.siblings[i] = BigInt(0)
          }
        }
        return {
          Root: proof.root,
          Depth: BigInt(depth),
          LeafIndex: BigInt(leafIndex),
          Siblings: proof.siblings
        } as OuT
      } catch (e) {
        throw Error(`Error generating merkle proof for leaf index ${leafIndex}`)
      }
    }

  export const merkleProofsFn =
    <
      argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      OuT extends Required<MerkleProofT>
    >(
      args: argsT,
      merkleProof: (
        args: argsT
      ) => (idx: bigint | number) => OuT = merkleProofFn
    ) =>
    (
      dummyPredicate: (c: Commitment) => boolean = (c: Commitment) => c.isDummy
    ): OuT[] =>
      args.inputs
        ? args.inputs.map((input) =>
            dummyPredicate(input)
              ? (DummyMerkleProof as OuT)
              : (merkleProof(args)(input.index) as OuT)
          )
        : []

  export const getInputsFn =
    <
      argsT extends Required<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      publicValT extends {
        publicVal: bigint
        isCommit: boolean
      },
      OuT extends Required<TPrivacyPool.CircuitInT>
    >(
      args: argsT
    ) =>
    (
      // calculate public value & isCommit
      publicVal: publicValT = calcPublicValFn(args)() as publicValT,
      // compute merkle proofs
      merkleProofs: MerkleProofT[] = merkleProofsFn(args)() as MerkleProofT[]
    ): OuT => {
      // Verify args
      for (let i = 0; i < args.inputs.length; i += 1) {
        if (args.inputs[i].isDummy) {
          continue
        }
        if (
          // check that signatures are valid
          !FnCommitment.VerifySignatureFn(
            args.inputs[i].signature,
            args.inputs[i].pubKey.rawPubKey,
            args.inputs[i].asArray()
          )
          // TO-DO check merkle proofs are valid
        ) {
          throw Error(`Invalid signature for ${args.inputs[i].hash}`)
        }
      }
      return {
        inputs: {
          commitFlag: publicVal.isCommit ? 1n : 0n,
          publicVal: publicVal.publicVal,
          scope: args.scope,
          inputNullifier: args.inputs.map((input) => input.nullifier),
          outputCommitment: args.outputs.map((output) => output.hash()),
          inputValue: args.inputs.map((input) => input.value),
          inputPublicKey: args.inputs.map((input) =>
            input.pubKey.asCircuitInputs()
          ),
          inputSalt: args.inputs.map((input) => input.salt),
          inputSigR8: args.inputs.map((input) => [
            input.signature.R8[0],
            input.signature.R8[1]
          ]),
          inputSigS: args.inputs.map((input) => input.signature.S),
          outputValue: args.outputs.map((output) => output.value),
          outputPublicKey: args.outputs.map((output) =>
            output.pubKey.asCircuitInputs()
          ),
          outputSalt: args.outputs.map((output) => output.salt),

          actualMerkleTreeDepth:
            merkleProofs[0].Root > 0n
              ? merkleProofs[0].Depth
              : merkleProofs[1].Depth,
          inputLeafIndex: merkleProofs.map((proof) => proof.LeafIndex),
          merkleProofSiblings: merkleProofs.map((proof) => proof.Siblings)
        },
        expectedOut: [merkleProofs[0].Root]
      } as OuT
    }

  export const LoadVkeyFn =
    <artifactT extends CircomArtifactT>() =>
    async (_v: artifactT): Promise<artifactT> => {
      if (isUrlOrFilePath(_v as string) === "url") {
        const vKey = await fetchJsonWithRetry<Groth16_VKeyJSONT>(_v as string)
          .then((data) => {
            return data
          })
          .catch((e) => {
            throw new Error("Failed to load wasm module from URL", { cause: e })
          })
        return vKey as artifactT
      }
      return JSON.parse(_v as string) as artifactT
    }

  export const FetchArtifactFn =
    <artifactT extends CircomArtifactT>() =>
    async (_f: artifactT): Promise<artifactT> => {
      if (typeof _f === "string" && isUrlOrFilePath(_f) === "url") {
        const buffer = await loadBytesFromUrl(_f)
          .then((uint8arr) => {
            return uint8arr
          })
          .catch((e) => {
            throw new Error("Failed to load wasm module from URL", { cause: e })
          })
        return buffer as artifactT
      }
      return _f
    }

  export const ProveFn =
    <
      artifactT extends CircomArtifactT,
      proofT = SnarkJSOutputT | CircomOutputT
    >(
      wasm: artifactT,
      zKey: artifactT,
      artifactsFetcher: (
        obj: artifactT
      ) => Promise<artifactT> = FetchArtifactFn()
    ) =>
    async (inputs: CircuitSignals): Promise<proofT> =>
      Promise.all([artifactsFetcher(wasm), artifactsFetcher(zKey)])
        .then(
          async ([_wasm, _zkey]) =>
            await groth16
              .fullProve(
                inputs,
                _wasm as string | Uint8Array,
                _zkey as string | Uint8Array
              )
              .then((out) => {
                return out as proofT
              })
              .catch((e) => {
                console.log(e)
                throw new Error("snarkjs.groth16 fullProve failed ", {
                  cause: e
                })
              })
        )
        .catch((e) => {
          console.log(e)
          throw new Error("Failed to load artifacts", { cause: e })
        })

  export const VerifyFn =
    <
      artifactT extends CircomArtifactT,
      proofT = SnarkJSOutputT | CircomOutputT
    >(
      vkey: artifactT
    ) =>
    async (
      proof: proofT,
      vKeyFetcher: (_v: artifactT) => Promise<artifactT> = LoadVkeyFn()
    ): Promise<boolean> =>
      await vKeyFetcher(vkey).then(
        async (_vkey) =>
          await groth16
            .verify(
              _vkey,
              (proof as SnarkJSOutputT).publicSignals as PublicSignals,
              (proof as SnarkJSOutputT).proof as Groth16Proof
            )
            .then((output) => {
              return output
            })
            .catch((e) => {
              console.log(e)
              throw new Error("snarkjs.groth16 verify failed ", { cause: e })
            })
      )

  export const parseOutputFn =
    <
      proofT extends SnarkJSOutputT | CircomOutputT,
      packedT extends PackedGroth16ProofT<bigint>
    >(
      opt: "parse" | "pack" | "none" = "parse"
    ) =>
    (output: proofT): proofT | packedT => {
      return opt === "parse"
        ? ({
            proof: {
              pi_a: output.proof.pi_a.map((x) => BigInt(x)) as bigint[],
              pi_b: output.proof.pi_b.map((x) =>
                x.map((y) => BigInt(y))
              ) as bigint[][],
              pi_c: output.proof.pi_c.map((x) => BigInt(x)) as bigint[],
              protocol: output.proof.protocol,
              curve: output.proof.curve
            },
            publicSignals: output.publicSignals.map((x) => BigInt(x))
          } as proofT)
        : opt === "pack"
          ? (packGroth16ProofFn(output as CircomOutputT) as packedT)
          : output
    }

  export const packGroth16ProofFn = (
    outputs: CircomOutputT
  ): PackedGroth16ProofT<bigint> => {
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
        outputs.publicSignals[7],
        outputs.publicSignals[8]
      ]
    ]
  }
}
