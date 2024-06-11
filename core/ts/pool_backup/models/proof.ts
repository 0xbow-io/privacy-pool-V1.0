import { Groth16Proof } from '@core/pool/types';
import { CircuitOutput } from '@core/pool/models';
import * as snarkjs from 'snarkjs';

export class groth16Proof
  implements
    CircuitOutput<
      Required<Groth16Proof | snarkjs.Groth16Proof>,
      bigint[] | snarkjs.NumericString[]
    >
{
  _output?: {
    proof: Groth16Proof;
    public: bigint[];
  };
  constructor() {}

  get output(): { proof: Groth16Proof; public: bigint[] } | undefined {
    return this._output;
  }

  set output(snarkOut: { proof: snarkjs.Groth16Proof; publicSignals: snarkjs.NumericString[] }) {
    this._output = groth16Proof.Parse(snarkOut.proof, snarkOut.publicSignals);
  }

  static Parse(
    proof: snarkjs.Groth16Proof,
    publicSignals: snarkjs.NumericString[],
  ): {
    proof: Groth16Proof;
    public: bigint[];
  } {
    return {
      proof: {
        pi_a: proof.pi_a.map((x) => BigInt(x)) as bigint[],
        pi_b: proof.pi_b.map((x) => x.map((y) => BigInt(y))) as bigint[][],
        pi_c: proof.pi_c.map((x) => BigInt(x)) as bigint[],
        protocol: proof.protocol,
        curve: proof.curve,
      } as Groth16Proof,
      public: publicSignals.map((x) => BigInt(x)) as bigint[],
    };
  }
}

/*s
s


constructor() { }
set output(val: {
  snarkJs: SnarkJsProof;
  publicSignals: NumericString[];
}): {
this._output = NormalizeSnarkJSGroth16Proof(val);
    }
get output(): {
proof: Groth16Proof
public: bigint[];
} {
return this._output;
}
static NormalizeSnarkJSGroth16Proof({
snarkJs: SnarkJsProof;
publicSignals: NumericString[];
}) {
 as CircuitProof;


 { proof: Groth16Proof; publicInputs: bigint[] } | undefined
constructor() {}

  set proof(proof: SnarkJsProof) {
    const { proof, pubInputs } = NormalizeSnarkJSGroth16Proof(output);
  }
  get proof(): { proof: Groth16Proof; publicInput: bigint[] } {}

  static fromSnarkJSProof(output: {
    proof: snarkjs.Groth16Proof;
    publicSignals: NumericString[];
  }): CircuitProof {
    const { proof, pubInputs } = NormalizeSnarkJSGroth16Proof(output);
    return new Proof(proof, pubInputs);
  }

  get calldata() {
    return {};
  }

  get pubInputsStr() {
    return stringifyBigInts(this.pubInputs);
  }

  get groth16Proof() {
    return stringifyBigInts(this.proof);
  }*/
