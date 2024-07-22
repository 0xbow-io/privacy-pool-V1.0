import type { ICircuit, TPrivacyPool, Groth16_VKeyJSONT } from '@privacy-pool-v1/core-ts/zk-circuit';
import { FnPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit';

import { stringifyBigInts } from 'maci-crypto';

// Handy Aliases
export type PrivacyPoolCircuit = ICircuit.CircuitI;
export const NewPrivacyPoolCircuit = (
  wasm: string | Uint8Array,
  zkey: string | Uint8Array,
  vKJSON?: Groth16_VKeyJSONT) // TODO: remove optional
  : PrivacyPoolCircuit => new CPrivacyPool.CircuitC(wasm, zkey, vKJSON);

export namespace CPrivacyPool {
  export class CircuitC implements ICircuit.CircuitI {
    constructor(
      public wasm: string | Uint8Array,
      public zkey: string | Uint8Array,
      public vKJSON: Groth16_VKeyJSONT
    ) {}

    prove = async (input: TPrivacyPool.InT, pack?: boolean): Promise<TPrivacyPool.OutputT | TPrivacyPool.PackedGroth16ProofT<bigint>>  => {
      const output = await FnPrivacyPool.ProveFn(input, this.wasm, this.zkey)
      .then(({proof, publicSignals}) => {
        return FnPrivacyPool.ParseFn(proof, publicSignals)
      }).catch((e) => {
        throw new Error('unable to cmpute proof', { cause: e });
      })
      return pack ? FnPrivacyPool.packGroth16ProofFn(output) : output;
    }

    verify = async (output: TPrivacyPool.OutputT): Promise<boolean>  => {
        const out = await FnPrivacyPool.VerifyFn(
        this.vKJSON,
        output.publicSignals.map((x) => stringifyBigInts(x)) as string[],
        {
          pi_a: output.proof.pi_a.map((x) => stringifyBigInts(x)) as string[],
          pi_b: output.proof.pi_b.map((x) => x.map((y) => stringifyBigInts(y))) as string[][],
          pi_c: output.proof.pi_c.map((x) => stringifyBigInts(x)) as string[],
          protocol: output.proof.protocol,
          curve: output.proof.curve,
        },
      ).catch((e) => {
        throw new Error('unable to verify proof', { cause: e });
      });
      return out;
    }
  }
}
