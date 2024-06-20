import type { ICircuit, TPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit';
import { FnPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit';


import { stringifyBigInts } from 'maci-crypto';
// Handy Aliases
export type PrivacyPoolCircuit = ICircuit.CircuitI;
export function NewPrivacyPoolCircuit(paths: {
  vKey: any;
  zKeyPath: string;
  wasmPath: string;
}): PrivacyPoolCircuit {return new CPrivacyPool.CircuitC(paths)}

export namespace CPrivacyPool {
  export class CircuitC implements ICircuit.CircuitI {
    public _vKey: any;
    public _zKeyPath: string;
    public _wasmPath: string;

    public _inputs: TPrivacyPool.InT | undefined = undefined;

    _output: TPrivacyPool.OutputT | undefined = undefined;
    constructor(paths: {
      vKey: any;
      zKeyPath: string;
      wasmPath: string;
    }) {
      this._vKey = paths.vKey;
      this._zKeyPath = paths.zKeyPath;
      this._wasmPath = paths.wasmPath;
    }

    set inputs(input: TPrivacyPool.InT ) {
      this._inputs = input;
    }

    get inputs(): TPrivacyPool.InT | undefined {
      return this._inputs;
    }

    get output(): TPrivacyPool.OutputT | undefined {
      return this._output;
    }

    set output(snarkOut: { proof: snarkjs.Groth16Proof; publicSignals: snarkjs.NumericString[] }) {
      this._output = FnPrivacyPool.ParseFn(snarkOut.proof, snarkOut.publicSignals);
    }

    async compute() {
      if (this._inputs === undefined) {
        throw new Error('inputs not set');
      }
      const { proof, publicSignals } = await Promise.resolve(
        FnPrivacyPool.ProveFn(this._inputs, this._wasmPath, this._zKeyPath),
      ).catch((e) => {
        throw new Error('unable to prove circuit', { cause: e });
      });
      this.output = { proof, publicSignals };
    }

    async verify(output: TPrivacyPool.OutputT): Promise<boolean> {
      const out = await FnPrivacyPool.VerifyFn(
        this._vKey,
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
