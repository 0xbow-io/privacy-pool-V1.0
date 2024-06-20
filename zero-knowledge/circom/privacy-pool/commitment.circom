pragma circom 2.1.9;

// MACI project imports
include "hashers.circom";

template Commitment() {
    signal input pubKey[2];
    signal input amount,blinding;
    signal output out;
    out <== PoseidonHasher(4)([amount,pubKey[0],pubKey[1],blinding]);
}
