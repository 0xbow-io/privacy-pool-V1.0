pragma circom 2.1.9;

include "./circomlib/poseidon.circom";
include "./circomlib/comparators.circom";


template Nullifier() {
    signal input commitment, leafIndex, signature;
    signal output out <== Poseidon(3)([commitment, leafIndex, signature]);
}
