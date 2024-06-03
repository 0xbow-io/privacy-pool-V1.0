import { CircuitInputs } from '@core/pool/types';
import { Pool } from '@core/pool/models';
import { Intent, Signal } from '@core/pool/types';
import { hashSignal } from '@core/pool/utils';

export interface PoolCircuit {
  publicVal: bigint;
  Intent: Intent;
  extVal: bigint;
  signal: Signal;
  BuildInputs(): {
    circuitInput: CircuitInputs;
    expectedMerkleRoot: bigint;
    extVal: bigint;
    isRelease: boolean;
  };
  /*
    To-DO:
      - ComputeProof
      - VerifyProof
      - Prepare CallData
  */
}

export class PrivacyPoolCircuit implements PoolCircuit {
  intent?: Intent;
  constructor(private pool: Pool) {}

  set Intent(intent: Intent) {
    this.intent = intent;
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

  BuildInputs(): {
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
