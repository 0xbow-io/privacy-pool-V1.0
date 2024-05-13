pragma circom 2.1.9;

/**
    Taken from MACI circom circuits: 
        https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/utils/verifySignature.circom
*/

include "./circomlib/compconstant.circom";
include "./circomlib/comparators.circom";
include "./circomlib/pointbits.circom";
include "./circomlib/bitify.circom";
include "./circomlib/escalarmulany.circom";
include "./circomlib/escalarmulfix.circom";
include "./circomlib/poseidon.circom";


/**
 * Variant of the EdDSAPoseidonVerifier template from circomlib
 * https://github.com/iden3/circomlib/blob/master/circuits/eddsa.circom
 */
template EdDSAPoseidonVerifier() {
    // The x and y coordinates of the public key.
    signal input Ax;
    signal input Ay;
    // Signature scalar.
    signal input S;
    // The x and y coordinates of the signature point.
    signal input R8x;
    signal input R8y;
    // Message hash.
    signal input M;

    signal output valid;

    // Ensure S<Subgroup Order.
    // convert the signature scalar S into its binary representation.
    var computedNum2Bits[254] = Num2Bits(254)(S);

    var computedCompConstantIn[254];
    for (var i=0; i<253; i++) {
        computedCompConstantIn[i] = computedNum2Bits[i];
    }
    computedCompConstantIn[253] = 0;

    // A component that ensures S is within a valid range, 
    // comparing it against a constant representing the subgroup order.
    var computedCompConstant = CompConstant(2736030358979909402780800718157159386076813972158567259200215660948447373040)(computedCompConstantIn);

    // Calculate the h = H(R,A, msg).
    var computedH2Bits[254] = Num2Bits_strict()(Poseidon(5)([R8x, R8y, Ax, Ay, M]));

    // These components perform point doubling operations on the public key
    // to align it within the correct subgroup as part of the verification process.
    var (computedDbl1XOut, computedDbl1YOut) = BabyDbl()(Ax, Ay);
    var (computedDbl2XOut, computedDbl2YOut) = BabyDbl()(computedDbl1XOut, computedDbl1YOut);
    var (computedDbl3XOut, computedDbl3YOut) = BabyDbl()(computedDbl2XOut, computedDbl2YOut);

    // A component that performs scalar multiplication of the 
    // adjusted public key by the hash output, essential for the verification calculation.
    var computedEscalarMulAny[2] = EscalarMulAny(254)(computedH2Bits, [computedDbl3XOut, computedDbl3YOut]);

    // Compute the right side: right =  R8 + right2.
    var (computedAddRightXOut, computedAddRightYOut) = BabyAdd()(R8x, R8y, computedEscalarMulAny[0], computedEscalarMulAny[1]);

    // Calculate the left side: left = S * B8.
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    
    // Fixed-base scalar multiplication of a base point by S.
    var computedEscalarMulFix[2] = EscalarMulFix(254, BASE8)(computedNum2Bits);

    // Components to check the equality of x and y coordinates 
    // between the computed and expected points of the signature.
    var computedIsRightValid = IsEqual()([computedEscalarMulFix[0], computedAddRightXOut]);
    var computedIsLeftValid = IsEqual()([computedEscalarMulFix[1], computedAddRightYOut]);
    var computedIsLeftRightValid = IsEqual()([computedIsRightValid + computedIsLeftValid, 2]);

    // Components to handle edge cases and ensure that all conditions 
    // for a valid signature are met, including the 
    // public key not being zero and other integrity checks.
    var computedIsAxZero = IsZero()(Ax);
    var computedIsAxEqual = IsEqual()([computedIsAxZero, 0]);
    var computedIsCcZero = IsZero()(computedCompConstant);
    var computedIsValid = IsEqual()([computedIsLeftRightValid + computedIsAxEqual + computedIsCcZero, 3]);

    valid <== computedIsValid;
}
