import { ISignal } from '@core/pool/models';
import { CircuitInputs } from '@core/pool/types';
import { ICommitment } from '@core/account/models';

export function BuildCircuitInputs(
  inputs: ICommitment[],
  outputs: ICommitment[],
  signal: ISignal,
): { inputs: CircuitInputs; expectedMerkleRoot: bigint; extVal: bigint; isRelease: boolean } {
  if (inputs.length != 2 || outputs.length != 2) {
    throw new Error('Invalid txRecordEvent, incorrect number of commitments');
  }

  const outputSum = outputs.reduce((acc, commitment) => acc + commitment.secrets.amount, 0n);
  const inputSum = inputs.reduce((acc, commitment) => acc + commitment.secrets.amount, 0n);
  const publicVal = outputSum - inputSum;
  const signalHash = signal.Hash(publicVal);
  const expectedMerkleRoot = 0n;

  const circuitInputs: CircuitInputs = {
    publicVal: publicVal,
    signalHash: signalHash.hash,

    inputNullifier: [inputs[0].nullifier ?? 0n, inputs[1].nullifier ?? 0n],
    inUnits: [inputs[0].secrets.amount, inputs[1].secrets.amount],
    inPk: [inputs[0].pubKey, inputs[1].pubKey],
    inBlinding: [inputs[0].secrets.blinding ?? 0n, inputs[1].secrets.blinding ?? 0n],

    inSigR8: [
      [inputs[0].Signature().R8[0] as bigint, inputs[0].Signature().R8[0] as bigint],
      [inputs[1].Signature().R8[0] as bigint, inputs[1].Signature().R8[0] as bigint],
    ],
    inSigS: [inputs[0].Signature().S as bigint, inputs[1].Signature().S as bigint],

    inLeafIndices: [inputs[0].index, inputs[1].index],
    merkleProofLength: BigInt(0),
    merkleProofSiblings: [],

    outCommitment: [outputs[0].hash, outputs[1].hash],
    outUnits: [outputs[0].secrets.amount, outputs[1].secrets.amount],
    outPk: [outputs[0].pubKey, outputs[1].pubKey],
    outBlinding: [outputs[0].secrets.blinding ?? 0n, outputs[1].secrets.blinding ?? 0n],
  };

  return {
    inputs: circuitInputs,
    expectedMerkleRoot: expectedMerkleRoot,
    extVal: signalHash.extVal,
    isRelease: publicVal < 0n,
  };
}
