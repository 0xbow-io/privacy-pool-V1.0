import type { CircuitSignals, Groth16Proof, PublicSignals } from "snarkjs"
import { groth16 } from "snarkjs"
import type {
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import type { TCommitment, InclusionProofT } from "@privacy-pool-v1/domainobjs"
import { MerkleTreeInclusionProofs } from "@privacy-pool-v1/domainobjs"
import { isUrlOrFilePath } from "@privacy-pool-v1/global/utils/path"
import {
  fetchJsonWithRetry,
  loadBytesFromUrl
} from "@privacy-pool-v1/global/utils/fetch"

export namespace FnPrivacyPool {
  export const getExternIOFn =
    <
      argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      OuT = [bigint, bigint]
    >(
      args: argsT,
      diffFn: (args: argsT) => bigint = (args: argsT): bigint =>
        (args.new
          ? args.new.reduce(
              (acc, commitment) => acc + commitment.asTuple()[0],
              0n
            )
          : 0n) -
        (args.existing
          ? args.existing.reduce(
              (acc, commitment) => acc + commitment.asTuple()[0],
              0n
            )
          : 0n)
    ) =>
    (diff: bigint = diffFn(args)): OuT => {
      return [diff > 0 ? diff : 0n, diff < 0 ? diff * -1n : 0n] as OuT
    }

  export const getCircuitInFn =
    <
      argsT extends Required<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      InputsT extends Required<TPrivacyPool.CircuitInT>,
      ioT = [bigint, bigint]
    >(
      args: argsT
    ) =>
    (
      // calculate public value & isCommit
      externIO: ioT = getExternIOFn(args)() as ioT,
      // compute merkle proofs
      merkleProofs: InclusionProofT[] = MerkleTreeInclusionProofs(
        args
      )() as InclusionProofT[]
    ): InputsT => {
      /// To-Do add some verification checks here
      return {
        inputs: {
          scope: args.scope,
          actualTreeDepth: BigInt(args.mt.depth),
          context: args.context,
          externIO: externIO,
          existingStateRoot: args.mt.root || 0n,
          newSaltPublicKey: args.new.map(
            (c) => c.public().saltPk as [bigint, bigint]
          ),
          newCiphertext: args.new.map((c) =>
            c.public().cipher.map((x) => x as bigint)
          ) as TCommitment.CipherT[],
          privateKey: args.pkScalars,
          nonce: args.nonces,
          exSaltPublicKey: args.existing.map(
            (c) => c.public().saltPk as [bigint, bigint]
          ),
          exCiphertext: args.existing.map((c) =>
            c.public().cipher.map((x) => x as bigint)
          ) as TCommitment.CipherT[],
          exIndex: merkleProofs.map((p) => BigInt(p.index)),
          exSiblings: merkleProofs.map((p) => p.siblings)
        } as TPrivacyPool.InT,
        expectedOut: {
          newNullRoot: [
            ...args.existing.map((c) => c.nullRoot),
            ...args.new.map((c) => c.nullRoot)
          ],
          newCommitmentRoot: [
            ...args.existing.map((c) => c.commitmentRoot),
            ...args.new.map((c) => c.commitmentRoot)
          ],
          newCommitmentHash: [
            ...args.existing.map((c) => c.hash()),
            ...args.new.map((c) => c.hash())
          ]
        } as TPrivacyPool.PublicOutT
      } as InputsT
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
            throw new Error("Failed to load wasm module from URL", {
              cause: e
            })
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
            throw new Error("Failed to load wasm module from URL", {
              cause: e
            })
          })
        return buffer as artifactT
      }
      return _f
    }

  export const proveFn =
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
    async (inputs: CircuitSignals): Promise<proofT> => {

console.log('inputs', inputs)
      return Promise.all([artifactsFetcher(wasm), artifactsFetcher(zKey)])
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
    }

  export const verifyFn =
    <
      artifactT extends CircomArtifactT,
      proofT = SnarkJSOutputT | CircomOutputT
    >(
      vkey: artifactT
    ) =>
    async (
      proof: proofT,
      vKeyFetcher: (_v: artifactT) => Promise<artifactT> = LoadVkeyFn()
    ): Promise<boolean> => {
      return await vKeyFetcher(vkey).then(
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
    }

  export const parseOutputFn =
    <
      stdPackedT extends StdPackedGroth16ProofT<bigint>,
      proofT extends SnarkJSOutputT | CircomOutputT
    >(
      opt: "parse" | "pack" | "none" = "parse"
    ) =>
    (output: proofT): proofT | stdPackedT => {
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
          ? (packStdGroth16ProofFn(output as CircomOutputT) as stdPackedT)
          : output
    }

  export const packStdGroth16ProofFn = (
    outputs: CircomOutputT
  ): StdPackedGroth16ProofT<bigint> => {
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
        outputs.publicSignals[8],
        outputs.publicSignals[9],
        outputs.publicSignals[10],
        outputs.publicSignals[11],
        outputs.publicSignals[12],
        outputs.publicSignals[13],
        outputs.publicSignals[14],
        outputs.publicSignals[15],
        outputs.publicSignals[16],
        outputs.publicSignals[17],
        outputs.publicSignals[18],
        outputs.publicSignals[19],
        outputs.publicSignals[20],
        outputs.publicSignals[21],
        outputs.publicSignals[22],
        outputs.publicSignals[23],
        outputs.publicSignals[24],
        outputs.publicSignals[25],
        outputs.publicSignals[26],
        outputs.publicSignals[27],
        outputs.publicSignals[28],
        outputs.publicSignals[29],
        outputs.publicSignals[30],
        outputs.publicSignals[31],
        outputs.publicSignals[32],
        outputs.publicSignals[33],
        outputs.publicSignals[34],
        outputs.publicSignals[35]
      ]
    ]
  }
}
