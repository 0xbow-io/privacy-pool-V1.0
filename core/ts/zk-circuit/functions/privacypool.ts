import * as snarkjs from 'snarkjs';
import { type TPrivacyPool, type MerkleProofT } from '@privacy-pool-v1/core-ts/zk-circuit';
import { type TCommitment } from '@privacy-pool-v1/core-ts/account';
import { 
    MERKLE_TREE_MAX_DEPTH, 
    DummyMerkleProof,
} from '@privacy-pool-v1/core-ts/zk-circuit';
import { LeanIMT, type LeanIMTMerkleProof } from '@zk-kit/lean-imt';



export namespace FnPrivacyPool {
  export function MerkleProofFn(index: bigint, mt: LeanIMT): MerkleProofT {
    let proof: LeanIMTMerkleProof;
    try {
      proof = mt.generateProof(Number(index));
    } catch (e) {
      throw new Error('MerkleProofFn failed', { cause: e });
    }

    const depth = proof.siblings.length;
    const merkleProofSiblings = proof.siblings;
    for (let i = 0; i < MERKLE_TREE_MAX_DEPTH; i += 1) {
      if (merkleProofSiblings[i] === undefined) {
        merkleProofSiblings[i] = BigInt(0);
      }
    }
    return {
      Root: proof.root,
      Depth: BigInt(depth),
      LeafIndex: index,
      Siblings: merkleProofSiblings,
    };
  }

  export function CalcPublicValFn(inputs: TCommitment.RawT[], outputs: TCommitment.RawT[]): bigint {
    const outputSum = outputs.reduce((acc, commitment) => acc + commitment.Units, 0n);
    const inputSum = inputs.reduce((acc, commitment) => acc + commitment.Units, 0n);
    return (outputSum ?? 0n) - (inputSum ?? 0n);
  }

  export function GetInputsFn(
    mt: LeanIMT,
    inputs: TCommitment.RawT[],
    outputs: TCommitment.RawT[],
    signalHash: bigint,
  ): TPrivacyPool.InT {
    const proofs = inputs.map((input) => input.Units === 0n ? DummyMerkleProof: MerkleProofFn(input.Index, mt));
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

      merkleProofLength: proofs[0].Root > 0n ? proofs[0].Depth : proofs[1].Depth,
      inLeafIndices: proofs.map((proof) => proof.LeafIndex),
      merkleProofSiblings: proofs.map((proof) => proof.Siblings),
    };
  }

  export async function ProveFn(
    inputs: snarkjs.CircuitSignals,
    wasm_path: string,
    zKey_path: string
  ): Promise<{ proof: snarkjs.Groth16Proof; publicSignals: snarkjs.PublicSignals }> {
    try {
      const wtns = {data: new Uint8Array, type: "mem"};
      await snarkjs.wtns.calculate(inputs, wasm_path, wtns);
      const out = await snarkjs.groth16.prove(
        zKey_path,
        // @ts-ignore
        wtns
      )
      return out;
    } catch (e) {
      console.log(e);
      throw new Error('snarkjs.groth16 fullProve failed ', { cause: e });
    }
  }

  export async function VerifyFn(
    vKJSON: any,
    publicSignals: snarkjs.PublicSignals,
    proof: snarkjs.Groth16Proof,
  ): Promise<boolean> {
    const out = await snarkjs.groth16
      .verify(vKJSON, publicSignals, proof)
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
