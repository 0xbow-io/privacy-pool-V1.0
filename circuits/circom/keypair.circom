pragma circom 2.1.9;

// circomlib imports
include  "./circomlib/bitify.circom"; 
include "./circomlib/escalarmulfix.circom"; 
include "./EdDSAPoseidonVerifier.circom";
include "./circomlib/poseidon.circom";


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



/**
 * Verifies the EdDSA signature of Poseidon(2)([Commitment, index])
 */
template VerifySignature() {
    // Public key of the signer, consisting of two coordinates [x, y].
    signal input pubKey[2];
    // R8 point from the signature, consisting of two coordinates [x, y]. 
    signal input R8[2];
    // Scalar component of the signature.
    signal input S;


    // The preimage data that was hashed, an array of size NumOfElements
    signal input commitment;
    signal input leafIndex;
    signal output valid;

    // Hash the preimage using the Poseidon hashing function configured for four inputs.
    var computedM = Poseidon(2)([commitment, leafIndex]);

    // Instantiate the patched EdDSA Poseidon verifier with the necessary inputs.
    var computedVerifier = EdDSAPoseidonVerifier()(
        pubKey[0],
        pubKey[1],
        S,
        R8[0],
        R8[1],
        computedM
    );

    valid <== computedVerifier;
}