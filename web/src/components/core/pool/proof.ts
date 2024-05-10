

export type ProofInputs = {
    publicValue: bigint,
    signalHash: bigint,
    merkleProofLength: bigint,

    inputNullifier: bigint[],
    inUnits: bigint[],
    inpK: string[],
    inBlinding: bigint[],
    inLeafIndices: bigint[],
    merkleProofIndices: bigint[][],
    merkleProofSiblings: bigint[][],

    outCommitment: bigint[],
    outUnits    : bigint[],
    outPk_x     : string[],
    outPk_y     : string[],
    outBlinding : bigint[],
}