
pragma circom 2.1.9;

// PSE MACI project imports
include "hashers.circom";

// local imports
include "./commitment.circom";

// txRecordHash: Hash(Hash(inNullifier[0], inNullifier[1]), Hash(outCommitment[0], outCommitment[1]), publicAmount, outIndex[0])
template GetTxRecordHash(nIns, nOuts) {
    signal input inNullifiers[nIns];
    signal input outCommitments[nOuts];
    signal input publicVal;
    signal input leafIndex;

    signal output out;

    // 1.a - Hash(inputNullifier1, inNullifiers)
    component inNullifierHasher = PoseidonHasher(nIns);
    for (var i = 0; i < nIns; i++) {
        inNullifierHasher.inputs[i] <== inNullifiers[i];
    }

    // 1.b - Hash(outputCommitment1, outputCommitment2)
    component outputCommitmentHasher = PoseidonHasher(nOuts);
    for (var i = 0; i < nOuts; i++) {
        outputCommitmentHasher.inputs[i] <== outCommitments[i];
    }

    // 1.c - Hash(1.a, 1.b, publicAmount, outIndexes[0])
    out <== PoseidonHasher(4)([inNullifierHasher.out, outputCommitmentHasher.out, publicVal, leafIndex]);
}
