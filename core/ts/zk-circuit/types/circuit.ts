export namespace TPrivacyPool {
  export type PubInT<T = bigint> = {
    publicVal: T;
    signalHash: T;
    merkleProofLength: T;
  };

  export type PrivInT<T = bigint> = {
    inputNullifier: T[];
    inUnits: T[];
    inPk: T[][];
    inBlinding: T[];
    inSigR8: T[][];
    inSigS: T[];
    inLeafIndices: T[];
    merkleProofSiblings: T[][];
    outCommitment: T[];
    outUnits: T[];
    outPk: T[][];
    outBlinding: T[];
  };

  export type InT = PubInT & PrivInT;

  export type ProofT<T = bigint> = {
    pi_a: T[];
    pi_b: T[][];
    pi_c: T[];
    protocol: string;
    curve: string;
  };
  export type PublicSignalsT<T = bigint> = T[];
  export type OutputT = {
    proof: ProofT;
    publicSignals: PublicSignalsT;
  };
}
