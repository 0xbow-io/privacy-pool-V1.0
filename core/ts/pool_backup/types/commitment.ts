






export type CommitmentSignals = {
  Pk: bigint;
  Units: bigint;
  Nullifier: bigint;
  blinding: bigint;
  SigR8: bigint[][];
  SigS: bigint;
};

export type InCommmitmentSignals = {
  inputNullifier: bigint[];
  inUnits: bigint[];
  inPk: bigint[];
  inBlinding: bigint[];
  inSigR8: bigint[][][];
  inSigS: bigint[];
  inLeafIndex: bigint[];
  merkleProofSiblings: bigint[][];
};

export type OutCommitmentSignals = {
  outCommitment: bigint[];
  outUnits: bigint[];
  outPk: bigint[];
  outBlinding: bigint[];
};
