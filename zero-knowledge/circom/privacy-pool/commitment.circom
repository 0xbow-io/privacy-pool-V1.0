pragma circom 2.1.9;

// MACI project imports
include "hashers.circom";

template Commitment() {
    signal input pubKey[2], value, salt;
    signal output out;

    out <== PoseidonHasher(4)([value,pubKey[0],pubKey[1],salt]);
}

template VerifyCommitment() {
    signal input pubKey[2], value, salt;

    signal input commitment;
    signal output isValid;

    var computed = Commitment()(pubKey, value, salt);
    var commitmentIsValid = IsEqual()([commitment, computed]);

    isValid <== commitmentIsValid;
}


// Hash(commitment, leafIndex, signature components) -> output
template Nullifier() {
    signal input commitment;
    signal input leafIndex;
    signal input signature_R8[2];
    signal input signature_S;
    signal output out <== PoseidonHasher(5)([commitment, leafIndex, signature_R8[0], signature_R8[1], signature_S]);
}

template VerifyNullifier() {
    signal input commitment;
    signal input leafIndex;
    signal input signature_R8[2];
    signal input signature_S;

    signal input nullifer;
    signal output isValid;

    var computed = Nullifier()(commitment, leafIndex, signature_R8, signature_S);
    var nullifierIsValid = IsEqual()([nullifer, computed]);


    isValid <== nullifierIsValid;
}
