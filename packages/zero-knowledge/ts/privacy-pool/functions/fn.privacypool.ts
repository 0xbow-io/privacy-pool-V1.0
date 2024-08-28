import type {
  InclusionProofT,
  Commitment,
  TCommitment,
  MembershipProofJSON
} from "@privacy-pool-v1/domainobjs"

import { MerkleTreeInclusionProofs } from "@privacy-pool-v1/domainobjs"
import {
  fetchJsonWithRetry,
  loadBytesFromUrl
} from "@privacy-pool-v1/global/utils/fetch"
import { isUrlOrFilePath } from "@privacy-pool-v1/global/utils/path"
import type {
  CircomArtifactT,
  CircomOutputT,
  Groth16_VKeyJSONT,
  SnarkJSOutputT,
  StdPackedGroth16ProofT,
  TPrivacyPool
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import type { CircuitSignals, Groth16Proof, PublicSignals } from "snarkjs"
import { groth16 } from "snarkjs"
import { hexToBigInt, type IntegerOutOfRangeErrorType } from "viem"

export const GetNewSum = (
  args: {
    new: Commitment[]
    existing: Commitment[]
  },
  externIO: [bigint, bigint]
): {
  expected: bigint
  actual: bigint
} => FnPrivacyPool.getNewSum(args, externIO)

export const GetOutputVals = (
  args: {
    new: Commitment[]
    existing: Commitment[]
  },
  externIO: [bigint, bigint]
): [bigint, bigint] => FnPrivacyPool.getOutputValsFn(args, externIO)

export const ComputeExternIO = (args: {
  new: Commitment[]
  existing: Commitment[]
}): [bigint, bigint] => FnPrivacyPool.getExternIOFn(args)()

export namespace FnPrivacyPool {
  export const getNewSum = <
    argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>
  >(
    args: argsT,
    externIO: [bigint, bigint]
  ): {
    expected: bigint
    actual: bigint
  } => {
    const existingVals = args.existing
      ? args.existing.map((commitment) => commitment.asTuple()[0])
      : [0n, 0n]

    const newVals = args.new
      ? args.new.map((commitment) => commitment.asTuple()[0])
      : [0n, 0n]

    return {
      expected:
        existingVals.reduce((acc, val) => acc + val, 0n) +
        externIO[0] -
        externIO[1],
      actual: newVals.reduce((acc, val) => acc + val, 0n)
    }
  }

  // given the externIO values
  // assuming static values for existing commitments
  // compute the values of the new commitments
  // if a new commitment exists with non zero values
  // adjust these values to ensure the sum of the new commitments
  // is equal to the sum of the existing commitments
  export const getOutputValsFn = <
    argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>
  >(
    args: argsT,
    externIO: [bigint, bigint]
  ): [bigint, bigint] => {
    const newVals = args.new
      ? args.new.map((commitment) => commitment.asTuple()[0])
      : [0n, 0n]

    const existingVals = args.existing
      ? args.existing.map((commitment) => commitment.asTuple()[0])
      : [0n, 0n]

    const sumNew = newVals.reduce((acc, val) => acc + val, 0n)
    const expectedSumNew =
      existingVals.reduce((acc, val) => acc + val, 0n) +
      externIO[0] -
      externIO[1]

    if (expectedSumNew < 0n) {
      return [-1n, -1n]
    }

    const adjustednewVals = newVals.map((val) =>
      sumNew === 0n ? 0n : (val * expectedSumNew) / sumNew
    ) as [bigint, bigint]

    console.log(
      `NewVals: ${newVals}`,
      `AdjustedNewVals: ${adjustednewVals}`,
      `ExternIO: ${externIO}`
    )

    if (adjustednewVals[0] === 0n) {
      adjustednewVals[0] = expectedSumNew
    }
    return adjustednewVals
  }

  // TODO - getExternIOFn is biased to one side (input or output)
  // So any set externIO values could be reset to 0
  // This is not ideal when user whishes to have both input and output values
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
      args: argsT,
      externIO?: ioT
    ) =>
    (
      // calculate public value & isCommit
      io: ioT = externIO ?? (getExternIOFn(args)() as ioT),
      newCommitments: TCommitment.CommitmentJSON[] = args.new.map((c) =>
        c.toJSON()
      ),
      membershipProofs: MembershipProofJSON[] = args.existing.map((c) =>
        c.membershipProof(args.mt)
      )
    ): InputsT => {
      return {
        inputs: {
          scope: hexToBigInt(membershipProofs[0].public.scope.hex),
          actualTreeDepth: BigInt(
            Math.max(
              Number(membershipProofs[0].private.inclusion.stateDepth),
              Number(membershipProofs[1].private.inclusion.stateDepth)
            )
          ),
          context: args.context,
          externIO: io,
          existingStateRoot:
            args.existing.findIndex((c) => c.isVoid()) !== 0
              ? hexToBigInt(membershipProofs[0].private.inclusion.stateRoot.hex)
              : hexToBigInt(
                  membershipProofs[1].private.inclusion.stateRoot.hex
                ),
          newSaltPublicKey: newCommitments.map(
            (c) => c.public.saltPk.map((x) => BigInt(x)) as [bigint, bigint]
          ),
          newCiphertext: newCommitments.map((c) =>
            c.public.cipher.map((x) => BigInt(x))
          ) as TCommitment.CipherT[],
          privateKey: membershipProofs
            .map((p) => hexToBigInt(p.private.pkScalar.hex))
            .concat(newCommitments.map((c) => hexToBigInt(c.pkScalar))),
          nonce: membershipProofs
            .map((p) => BigInt(p.private.nonce))
            .concat(newCommitments.map((c) => BigInt(c.nonce))),
          exSaltPublicKey: membershipProofs.map(
            (c) => c.public.saltPk.map((x) => BigInt(x)) as [bigint, bigint]
          ),
          exCiphertext: membershipProofs.map((c) =>
            c.public.cipher.map((x) => BigInt(x))
          ) as TCommitment.CipherT[],
          exIndex: membershipProofs.map((p) =>
            BigInt(p.private.inclusion.index)
          ),
          exSiblings: membershipProofs.map((p, i) =>
            !args.existing[i].isVoid()
              ? p.private.inclusion.siblings.map((x) => BigInt(x))
              : Array(32).fill(0n)
          )
        } as TPrivacyPool.InT,
        expectedOut: {
          newNullRoot: [
            ...membershipProofs.map((c) => hexToBigInt(c.private.null.hex)),
            ...newCommitments.map((c) => hexToBigInt(c.nullRoot))
          ],
          newCommitmentRoot: [
            ...membershipProofs.map((c) => hexToBigInt(c.private.root.hex)),
            ...newCommitments.map((c) => hexToBigInt(c.cRoot))
          ],
          newCommitmentHash: [
            ...membershipProofs.map((c) => hexToBigInt(c.public.hash.hex)),
            ...newCommitments.map((c) => BigInt(c.hash))
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
      console.log("inputs", inputs)
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
