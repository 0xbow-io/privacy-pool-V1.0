export namespace TCommitment {
  export type RawT<N = bigint> = {
    Pk: N[];
    Units: N;
    Hash: N;
    Index: N;
    Nullifier: N;
    blinding: N;
    SigR8: N[];
    SigS: N;
  };
  export type SecretsT<N = bigint> = { amount?: N; blinding?: N };
}
