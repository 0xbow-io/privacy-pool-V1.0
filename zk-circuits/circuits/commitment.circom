pragma circom 2.1.8;

include "./circomlib/poseidon.circom";

template Commitment() {
    signal input pubKey[2];
    signal input amount,blinding;
    signal output out;
    out <== Poseidon(4)([amount,pubKey[0],pubKey[1],blinding]);
}
