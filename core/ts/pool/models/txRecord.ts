import { ICommitment } from '@core/account/models';
import { ISignal } from '@core/pool/models';
import { CircuitInputs } from '@core/pool/types'
import { hash2, hash4 } from 'maci-crypto';

export interface TxRecordState {
  inputs: ICommitment[];
  outputs: ICommitment[];
  publicVal: bigint;
  isRelease: boolean;
}

export interface TxRecordActions {
  ComputePublicVal(): bigint
  Hash(): bigint
  ComputeCircuitInputs(signal: ISignal): { inputs: CircuitInputs; expectedMerkleRoot: bigint }
}

export type TxRecord = TxRecordState & TxRecordActions;

export class txRecord implements TxRecord {
  publicVal: bigint = 0n;
  isRelease: boolean = false;
  constructor(
    public inputs: ICommitment[],
    public outputs: ICommitment[],
  ) {
    // ensure correct length of input & output CTXs
    if (inputs.length != 2 || outputs.length != 2) {
      throw new Error('Invalid txRecordEvent, incorrect number of commitments');
    }
    this.isRelease = this.ComputePublicVal() < 0n;
  }

  ComputePublicVal(): bigint {

    return this.publicVal;
  }

  Hash(): bigint {
    return hash4([
      hash2([this.inputs[0].nullifier ? 0n, this.inputs[0].nullifier ? 0n]),
      hash2([this.outputs[0].hash, this.outputs[0].hash]),
      this.publicVal,
      this.outputs[0].index,
    ]);
  }

  ComputeCircuitInputs(signal: ISignal): { inputs: CircuitInputs; expectedMerkleRoot: bigint } {
    const circuitInputs: CircuitInputs;

    // get signature & nullifier
    // check against pool that nullifier isn't spent
    // then get merkle proofs from pool

    // start with inputs
    // for each inputs
    this.inputs.forEach((c, i) => {
    

      // get public key & secrets
      circuitInputs.inPk.push(c.pubKey);
      circuitInputs.inUnits.push(c.secrets.amount);
      circuitInputs.inBlinding.push(c.secrets.blinding!);

    

      // check nullifiers against pool



    }

  }
}
