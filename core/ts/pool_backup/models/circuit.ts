import { LOCAL_WASM_PATH, LOCAL_ZKEY_PATH, LOCAL_VKEY_PATH } from '@core/pool/config';
import { cleanThreads } from '@core/utils';
import { groth16Proof } from '@core/pool/models';
import { PrivateInputs, PublicInputs } from '@core/pool/types';
import { CommitmentSignals, InCommmitmentSignals, OutCommitmentSignals } from '@core/pool/types';
import { stringifyBigInts } from 'maci-crypto';
import fs from 'fs';
import * as snarkjs from 'snarkjs';


export interface CircuitOpts<T> {
  _must_verify: () => T;
  _generate_calldata: () => T;
}

export class circuitOpts implements CircuitOpts<boolean> {
  // default values
  _mustVerify: boolean = true;
  _generateCallData: boolean = false;
  constructor() { }

  get mustVerify(): boolean {
    return this._mustVerify;
  }
}

export interface Circuit<Input, Output, Opts> {
  compute: (input: Input, opts?: Opts) => Promise<Output | undefined>;
}
export interface CircuitOutput<T, F> {
  output: { proof: T; public: F } | undefined;
}

export interface CircuitInput<PrivIn extends PrivateInputs, PublicIn extends PublicInputs, Sigs extends CommitmentSignals> {
  compute: (ags0: Sigs[][]) => (PrivIn & PublicIn) | undefined;
}


export type ZkCircuit = Circuit<
  CircuitInput<PrivateInputs, PublicInputs, CommitmentSignals>,
  CircuitOutput<groth16Proof, bigint[]>,
  CircuitOpts<boolean>
>;


export class Groth16Inputs implements CircuitInput<PrivateInputs, PublicInputs, CommitmentSignals> {
  static _input_size = 2
  constructor(public pub?: PublicInputs) { }

  compute(privIn: CommitmentSignals[][]) {
    if (this.pub === undefined) {
      return undefined;
    }
    return {
      publicVal: this.pub.publicVal,
      signalHash: this.pub.signalHash,
      merkleProofLength: this.pub.merkleProofLength,
      inputNullifier: [privIn.map((priv) => priv.Nullifier)],
      inUnits: [privIn.map((input) => input.Units)],
      inPk: [privIn.map((input) => input.Pk)],
      inBlinding: [privIn.map((input) => input.blinding)],
      inSigR8: [privIn.map((input) => input.SigR8)],
      inSigS: [privIn.map((input) => input.SigS)],
      inLeafIndices: [privIn.map((input) => input.inLeafIndices)],
      merkleProofSiblings: [privIn.map((input) => input.Siblings)],
      outCommitment: [privIn.map((output) => output.Pk)],
      outUnits: [privIn.map((output) => output.Units)],
      outPk: [privIn.map((output) => output.Pk)],
      outBlinding: [outputs.map((output) => output.blinding)],
    }
  }
}





export class Groth16Circuit
  implements
  ZkCircuit {
  static _artifacts_path_ = {
    vKey: LOCAL_VKEY_PATH,
    wasm: LOCAL_WASM_PATH,
    zKey: LOCAL_ZKEY_PATH,
  };
  _IN?: Groth16Inputs | undefined;
  constructor() { }


  // Computes circuit ouptut for a given set of Inputs.
  async compute(privateInputs, opts): Promise<Required<groth16Proof> | undefined> {
    let proof: groth16Proof = new groth16Proof();
    await snarkjs.groth16
      .fullProve(input, ZkCircuit._artifacts_path_.wasm, ZkCircuit._artifacts_path_.zKey)
      .then((output) => {
        proof.output = output
      })
      .catch((e) => {
        throw new Error('Proof generation failed', { cause: e });
      })
      .finally(() => {
        if (opts?.mustVerify !== true) {
          await ZkCircuit.verify(proof).catch((e) => {
            throw new Error('Proof verification failed', { cause: e });
          });
        }
      });
    await cleanThreads();
    return proof;
  }

  static async prove(): Promise<void> {

  }

  static async verify(proof: groth16Proof): Promise<void> {
    try {
      const ok = await snarkjs.groth16.verify(
        JSON.parse(fs.readFileSync(ZkCircuit._artifacts_path_.vKey, 'utf-8')),
        stringifyBigInts(proof.output.public),
        stringifyBigInts(proof.output.proof),
      );
      await cleanThreads();
      if (!ok) throw new Error('Proof verification failed');
    } catch (e) {
      throw new Error('unable to verify proof', { cause: e });
    }
  }

/* _vk_verifier: any,
_publicSignals: PublicSignals,
_proof: Groth16Proof,
static async verify(proof: Proof): Proof {

}

export interface PoolCircuit {
publicVal: bigint;
intent?: Intent;
extVal: bigint;
signal: Signal;
proof: Promise<Proof>;
inputs: {
  circuitInput: CircuitInputs;
  expectedMerkleRoot: bigint;
  extVal: bigint;
  isRelease: boolean;
};
verify(proof: CircuitProof): Promise<boolean>;
}

export class PrivacyPoolCircuit implements PoolCircuit {
constructor(
  private pool: Pool,
  public intent?: Intent,
  public keyPaths: {
    vKeyPath: string;
    wasmPath: string;
    zKeyPath: string;
  } = { vKeyPath: LOCAL_VKEY_PATH, wasmPath: LOCAL_WASM_PATH, zKeyPath: LOCAL_ZKEY_PATH },
) {}

static Compute(pool: Pool, intent: Intent): PoolCircuit {
  const circuit = new PrivacyPoolCircuit(pool, intent);
  try {
    return await circuit.args;
  } catch (e) {
    console.error(e);
    throw new Error('Failed to compute circuit', { cause: e });
  }
}

get vKeyPath() {
  return this.keyPaths.vKeyPath;
}

get vKey() {
  return JSON.parse(fs.readFileSync(this.vKeyPath, 'utf-8'));
}

get wasmPath() {
  return this.keyPaths.wasmPath;
}

get zkeyPath() {
  return this.keyPaths.zKeyPath;
}

get publicVal(): bigint {
  const outputSum = this.intent?.outputs.reduce(
    (acc, commitment) => acc + commitment.secrets.amount,
    0n,
  );
  const inputSum = this.intent?.inputs.reduce(
    (acc, commitment) => acc + commitment.secrets.amount,
    0n,
  );
  return (outputSum ?? 0n) - (inputSum ?? 0n);
}

get extVal(): bigint {
  return this.publicVal + (this.intent?.feeVal ?? 0n);
}

get signal(): Signal {
  return {
    pool: this.pool.address,
    extVal: this.extVal,
    feeVal: this.intent?.feeVal ?? 0n,
    account: this.intent?.account ?? '0x',
    feeCollector: this.intent?.feeCollector ?? '0x',
  };
}

// For the set intent
// Generate a verifiable proof
// Then compose the args required for on-chain verification & transaction
get args() {
  if (this.intent === undefined) {
    throw new Error('undefined intent');
  }
  return (async () => {
    try {

    } catch (e) {
      throw new Error('Proof generation failed', { cause: e });
    }
  })();
}



async verify(proof: Proof): Promise<boolean> {
  try {
    const ok = await Promise.resolve(verify(this.vKey, proof.pubInputsStr, proof.groth16Proof));
    await cleanThreads();
    return ok;
  } catch (e) {
    throw new Error('unable to verify proof', { cause: e });
  }
}

get inputs(): {
  circuitInput: CircuitInputs;
  expectedMerkleRoot: bigint;
  extVal: bigint;
  signal: Signal;
  isRelease: boolean;
} {
  if (this.intent === undefined) {
    throw new Error('intent is undefined');
  }
  if (this.intent.inputs.length != 2 || this.intent.outputs.length != 2) {
    throw new Error('Invalid txRecordEvent, incorrect number of commitments');
  }

  const proofs = [
    this.pool.MerkleProof(this.intent.inputs[0].dummy ? undefined : this.intent.inputs[0].index),
    this.pool.MerkleProof(this.intent.inputs[1].dummy ? undefined : this.intent.inputs[1].index),
  ];

  const circuitInputs: CircuitInputs = {
    publicVal: this.publicVal,
    signalHash: hashSignal(this.signal),

    inputNullifier: [
      this.intent.inputs[0].nullifier ?? 0n,
      this.intent.inputs[1].nullifier ?? 0n,
    ],
    inUnits: [this.intent.inputs[0].secrets.amount, this.intent.inputs[1].secrets.amount],
    inPk: [this.intent.inputs[0].pubKey, this.intent.inputs[1].pubKey],
    inBlinding: [
      this.intent.inputs[0].secrets.blinding ?? 0n,
      this.intent.inputs[1].secrets.blinding ?? 0n,
    ],

    inSigR8: [
      [
        this.intent.inputs[0].Signature().R8[0] as bigint,
        this.intent.inputs[0].Signature().R8[1] as bigint,
      ],
      [
        this.intent.inputs[1].Signature().R8[0] as bigint,
        this.intent.inputs[1].Signature().R8[1] as bigint,
      ],
    ],
    inSigS: [
      this.intent.inputs[0].Signature().S as bigint,
      this.intent.inputs[1].Signature().S as bigint,
    ],

    inLeafIndices: [this.intent.inputs[0].index, this.intent.inputs[1].index],
    merkleProofLength: proofs[0].depth,
    merkleProofSiblings: [proofs[0].siblings, proofs[1].siblings],

    outCommitment: [this.intent.outputs[0].hash, this.intent.outputs[1].hash],
    outUnits: [this.intent.outputs[0].secrets.amount, this.intent.outputs[1].secrets.amount],
    outPk: [this.intent.outputs[0].pubKey, this.intent.outputs[1].pubKey],
    outBlinding: [
      this.intent.outputs[0].secrets.blinding ?? 0n,
      this.intent.outputs[1].secrets.blinding ?? 0n,
    ],
  };

  return {
    circuitInput: circuitInputs,
    expectedMerkleRoot: proofs[0].root,
    extVal: this.extVal,
    signal: this.signal,
    isRelease: circuitInputs.publicVal < 0n,
  };
}
}
*/
