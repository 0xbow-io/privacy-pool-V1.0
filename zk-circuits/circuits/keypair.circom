pragma circom 2.0.0;

// circomlib imports
include  "./circomlib/bitify.circom"; 
include "./circomlib/escalarmulfix.circom"; 

// It utilizes the {@link https://eips.ethereum.org/EIPS/eip-2494|Baby Jubjub} elliptic curve
// to derive a public key from a EdDSA private key.
// refer to MACI implementation: 
// https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/utils/privToPubKey.circom
template PrivToPubKey() {
    // The base point of the BabyJubJub curve.
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // pK is the scalar generated from a EdDSA private key.
    signal input pK;
    signal output Pk[2];

    // Convert the private key to bits.
    var computedPrivBits[253] = Num2Bits(253)(pK);

    // Perform scalar multiplication with the basepoint.
    var computedEscalarMulFix[2] = EscalarMulFix(253, BASE8)(computedPrivBits);

    Pk <== computedEscalarMulFix;
}



template Signature() {
    signal input pk;
    signal input commitment;
    signal input leafIndex;
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== pk;
    hasher.inputs[1] <== commitment;
    hasher.inputs[2] <== leafIndex;
    out <== hasher.out;
}
