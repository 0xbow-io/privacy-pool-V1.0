import { ISignal } from '@core/pool/models';
import { CircuitInputs } from '@core/pool/types';
import { ICommitment } from '@core/account/models';
import { PrivacyPool } from '@core/pool/models';
import { Intent, PoolMetadata, Signal } from '@core/pool/types';
import { Address } from 'viem';
import { hashSignal } from '@core/pool/utils';

export interface circuit {
  publicVal: bigint;
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

export class PrivacyPoolCircuit extends PrivacyPool implements circuit {
  constructor(
    meta: PoolMetadata,
    public intent: Intent,
  ) {
    super(meta);
  }

  get publicVal(): bigint {
    const outputSum = this.intent.outputs.reduce(
      (acc, commitment) => acc + commitment.secrets.amount,
      0n,
    );
    const inputSum = this.intent.inputs.reduce(
      (acc, commitment) => acc + commitment.secrets.amount,
      0n,
    );
    return outputSum - inputSum;
  }

  get extVal(): bigint {
    return this.publicVal + this.intent.feeVal;
  }

  get signal(): Signal {
    return {
      pool: this.meta.address,
      extVal: this.extVal,
      feeVal: this.intent.feeVal,
      account: this.intent.account,
      feeCollector: this.intent.feeCollector,
    };
  }

  BuildInputs(): {
    circuitInput: CircuitInputs;
    expectedMerkleRoot: bigint;
    extVal: bigint;
    signal: Signal;
    isRelease: boolean;
  } {
    if (this.intent.inputs.length != 2 || this.intent.outputs.length != 2) {
      throw new Error('Invalid txRecordEvent, incorrect number of commitments');
    }

    const proofs = [
      this.MerkleProof(this.intent.inputs[0].hash),
      this.MerkleProof(this.intent.inputs[1].hash),
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
          this.intent.inputs[0].Signature().R8[0] as bigint,
        ],
        [
          this.intent.inputs[1].Signature().R8[0] as bigint,
          this.intent.inputs[1].Signature().R8[0] as bigint,
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
