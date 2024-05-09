

export type ProofInputs = {
    publicValue: bigint,
    signalHash: bigint,
    merkleProofLength: number,

    inputNullifier: bigint[],
    inUnits: bigint[],
    inpK: bigint[],
    inBlinding: bigint[],
    inLeafIndices: bigint[],
    merkleProofIndices: number[][],
    merkleProofSiblings: bigint[][],


    outCommitment: bigint[],
    outUnits    : bigint[],
    outPk_x     : bigint[],
    outPk_y     : bigint[],
    outBlinding : bigint[],
}