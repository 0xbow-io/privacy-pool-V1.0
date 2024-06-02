export type CircuitInputs = {
  publicVal: bigint;
  signalHash: bigint;
  merkleProofLength: bigint;

  inputNullifier: bigint[];
  inUnits: bigint[];
  inPk: bigint[][];

  inSigR8: bigint[][];
  inSigS: bigint[];

  inBlinding: bigint[];
  inLeafIndices: bigint[];
  merkleProofSiblings: bigint[][];

  outCommitment: bigint[];
  outUnits: bigint[];
  outPk: bigint[][];
  outBlinding: bigint[];
};
