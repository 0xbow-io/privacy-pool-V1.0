pragma circom 2.1.8;

include "./circomlib/poseidon.circom";

template Commitment() {
    signal input amount,Pk_x,Pk_y,blinding;
    signal output out;
    out <== Poseidon(4)([amount,Pk_x,Pk_y,blinding]);
}
