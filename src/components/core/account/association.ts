
export type ProofPrivateInputs = {

    // data to compute input nullifier
    publicVal: bigint,
    inUnits: bigint[],
    inPk: bigint[][],
    inBlinding: bigint[],
    inLeafIndices: bigint[],
    inSigS: bigint[],

    // data to compute output comitment
    outUnits: bigint[],
    outPk: bigint[][],
    outBlinding : bigint[],

    commitmentProofLength: bigint,
    commitmentProofIndices: bigint[][],
    commitmentProofSiblings: bigint[][],

    // signatures for output nullifiers
    outSigR8: bigint[][],
    outSigS: bigint[],
    outLeafIndices: bigint[],

    // tx record merkle proof
    associationProofLength: bigint,
    associationProofIndices: bigint[],
    associationProofSiblings: bigint[],
}
