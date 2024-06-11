import * as snarkjs from 'snarkjs';
import { TPrivacyPool, MerkleProofT } from '@core/circuit/types';
import { TCommitment } from '@core/account/types';
import { MERKLE_TREE_MAX_DEPTH } from '@core/circuit/constants';

// @ts-expect-error
import { LeanIMT } from '@zk-kit/lean-imt';

export namespace FnPrivacyPoolCircuit {
  export function MerkleProofFn(commitment: TCommitment.RawT, mt: LeanIMT): MerkleProofT {
    // if commitment value is empty, return empty proof
    if (commitment.Units === 0n) {
      return {
        Root: 0n,
        Depth: 0n,
        LeafIndex: 0n,
        Siblings: new Array<bigint>(MERKLE_TREE_MAX_DEPTH).fill(0n),
      };
    }

    const proof = mt.generateProof(Number(commitment.Index));
    const merkleProofSiblings = proof.siblings;
    for (let i = 0; i < MERKLE_TREE_MAX_DEPTH; i += 1) {
      if (merkleProofSiblings[i] === undefined) {
        merkleProofSiblings[i] = BigInt(0);
      }
    }

    return {
      Root: proof.root,
      Depth: BigInt(proof.siblings.length),
      LeafIndex: commitment.Index,
      Siblings: merkleProofSiblings,
    };
  }

  export function CalcPublicValFn(inputs: TCommitment.RawT[], outputs: TCommitment.RawT[]): bigint {
    const outputSum = outputs.reduce((acc, commitment) => acc + commitment.Units, 0n);
    const inputSum = inputs.reduce((acc, commitment) => acc + commitment.Units, 0n);
    return (outputSum ?? 0n) - (inputSum ?? 0n);
  }

  export function GenCircuitInputsFn(
    mt: LeanIMT,
    inputs: TCommitment.RawT[],
    outputs: TCommitment.RawT[],
    signalHash: bigint,
  ): TPrivacyPool.InT {
    const proofs = inputs.map((input) => MerkleProofFn(input, mt));
    return {
      publicVal: CalcPublicValFn(inputs, outputs),
      signalHash: signalHash,
      inputNullifier: inputs.map((input) => input.Nullifier),
      inUnits: inputs.map((input) => input.Units),
      inPk: inputs.map((input) => input.Pk),
      inBlinding: inputs.map((input) => input.blinding),
      inSigR8: inputs.map((input) => input.SigR8),
      inSigS: inputs.map((input) => input.SigS),
      outCommitment: outputs.map((output) => output.Hash),
      outUnits: outputs.map((output) => output.Units),
      outPk: outputs.map((output) => output.Pk),
      outBlinding: outputs.map((output) => output.blinding),

      merkleProofLength: proofs[0].Depth,
      inLeafIndices: proofs.map((proof) => proof.LeafIndex),
      merkleProofSiblings: proofs.map((proof) => proof.Siblings),
    };
  }

  export async function ProveFn(
    inputs: snarkjs.CircuitSignals,
    wasm: snarkjs.ZKArtifact,
    zKey: snarkjs.ZKArtifact,
  ): Promise<{ proof: snarkjs.Groth16Proof; publicSignals: snarkjs.PublicSignals }> {
    const out = await snarkjs.groth16
      .fullProve(inputs, wasm, zKey)
      .then((output) => {
        return output;
      })
      .catch((e) => {
        throw new Error('snarkjs.groth16 fullProve failed ', { cause: e });
      });
    return out;
  }

  export async function VerifyFn(
    vkPath: string,
    publicSignals: snarkjs.PublicSignals,
    proof: snarkjs.Groth16Proof,
  ): Promise<boolean> {
    const vK = await Bun.file(vkPath)
      .json()
      .then((output) => {
        return output;
      })
      .catch((e) => {
        throw new Error('unable to read vk file', { cause: e });
      });

    const out = await snarkjs.groth16
      .verify(vK, publicSignals, proof)
      .then((output) => {
        return output;
      })
      .catch((e) => {
        throw new Error('snarkjs.groth16 verify failed ', { cause: e });
      });
    return out;
  }

  export function ParseFn(
    proof: snarkjs.Groth16Proof,
    publicSignals: snarkjs.NumericString[],
  ): TPrivacyPool.OutputT {
    return {
      proof: {
        pi_a: proof.pi_a.map((x) => BigInt(x)) as bigint[],
        pi_b: proof.pi_b.map((x) => x.map((y) => BigInt(y))) as bigint[][],
        pi_c: proof.pi_c.map((x) => BigInt(x)) as bigint[],
        protocol: proof.protocol,
        curve: proof.curve,
      } as TPrivacyPool.ProofT,
      publicSignals: publicSignals.map((x) => BigInt(x)) as bigint[],
    };
  }
}
