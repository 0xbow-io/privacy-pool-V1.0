import { FnPrivacyPoolCircuit } from '@core/circuit/functions';
import { ICircuit } from '@core/circuit/interfaces';
import { TPrivacyPool } from '@core/circuit/types';
import { LOCAL_WASM_PATH, LOCAL_ZKEY_PATH, LOCAL_VKEY_PATH } from '@core/circuit/constants';
import { stringifyBigInts } from 'maci-crypto';

export namespace CPrivacyPool {
  export class CircuitC implements ICircuit.CircuitI {
    public vKeyPath: string = LOCAL_VKEY_PATH;
    public zKeyPath: string = LOCAL_ZKEY_PATH;
    public wasmPath: string = LOCAL_WASM_PATH;

    _output: TPrivacyPool.OutputT | undefined = undefined;
    constructor() {}

    get output(): TPrivacyPool.OutputT | undefined {
      return this._output;
    }

    set output(snarkOut: { proof: snarkjs.Groth16Proof; publicSignals: snarkjs.NumericString[] }) {
      this._output = FnPrivacyPoolCircuit.ParseFn(snarkOut.proof, snarkOut.publicSignals);
    }

    async prove(input: TPrivacyPool.InT) {
      const { proof, publicSignals } = await Promise.resolve(
        FnPrivacyPoolCircuit.ProveFn(input, this.wasmPath, this.zKeyPath),
      ).catch((e) => {
        throw new Error('unable to prove circuit', { cause: e });
      });
      this.output = { proof, publicSignals };
    }

    async verify(output: TPrivacyPool.OutputT): Promise<boolean> {
      const out = await FnPrivacyPoolCircuit.VerifyFn(
        this.vKeyPath,
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
