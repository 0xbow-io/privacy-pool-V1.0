pragma circom 2.1.9;

// circomlib import
include "comparators.circom";

//Local Imports
include "./handlers.circom";

/**
    A commitment is the binding of value to a domain (indentified by a scope value)
    & a cryptographic keypair.

    It is represented as a tuple: (value, scope, Secret.x, Secret.y)
    Where secret is the ECDH shared secret key derived from
    the keypair's private & public key

    Note:   The value must be a real number that is ≥ 0.
            A commitment in which the value = 0, is considered a "void" commitment.
            Void comitments do not exsits in the domain.

    ** stateRoot: Merkle root of Pool's state Tree (Lean IMT)
    ** actualTreeDepth:The current depth of the State Tree
    ** context: The context is the hash of transaction details & scope:
                ** keccak256(chainID, contractAddress, fee, feeCollector, units...)
                ** mitigation against tampering of values after proof generation
    ** externIO: external input & output values
    ** PrivateKey: Private keys with ownership of the existing/new commitments
    ** Nonce: Nonce values for the existing/new commitments
    ** CommitmentRoot: Commitment roots of the new/existing commitments:
                    ** Compute Hash (commitmentHash) of the commitment tuple:
                        ** Poseidon(4)([value, scope, Secret.x, Secret.y])
                    ** Construct Binary Merkle Tree with leave nodes being CipherText elements & Commitment Hash
                    ** Compute the root of the tree ==> Commitment
    ** NullRoot: Null roots of the existing/newcommitments
                ** Similary computed like the commitment root but leaf nodes are:
                    ** Keypair Public Key
                    ** Keypair Secret Key
                    ** Salt Public Key
                    ** Encryption Key
                ** Functions as a nullifier to the commitRoot when inserted into the state tree.
                ** Prevents replay attacks
                ** Private for the new commitments but public for the existing commitments
    ** SaltPublicKey: EdDSA Public-key derived from the Salt generated for the new/existing commitments
                ** Salts are random values in the BabyJub Curve
    ** Ciphertext: Encrypted values of new / existing commitments
                ** Poseidon encryption with ECDH shared secret key derived from either:
                    ** Salt & public key
                    ** Private key & Salt public key
                    ** Assume Salt is unrecoverable, only Salt public key is known and public
    ** Index & Siblings: Inclusion Merkle Proof of the commitmentRoot for existing commitments
**/


template PrivacyPool(maxTreeDepth, cipherLen, tupleLen, nExisting, nNew) {
    /// **** Public Signals ****

    // Scope is the domain identifier
    // i.e. Keccak256(chainID, contractAddress)
    signal input scope;
    // The depth of the State Tree
    // at which the merkleproofs
    // were generated
    signal input actualTreeDepth;

    signal input context;
    // external input values to existing commitments
    // external output values from new commitments
    signal input externIO[2];

    signal input existingStateRoot;
    signal input newSaltPublicKey[nNew][2];
    signal input newCiphertext[nNew][cipherLen];

    /// **** End Of Public Signals ****

    /// **** Private Signals ****

    signal input privateKey[nExisting+nNew];
    signal input nonce[nExisting+nNew];

    signal input exSaltPublicKey[nExisting][2];
    signal input exCiphertext[nExisting][cipherLen];
    signal input exIndex[nExisting];
    signal input exSiblings[nExisting][maxTreeDepth];

    /// **** End Of Private Signals ****

    signal output newNullRoot[nExisting+nNew];
    signal output newCommitmentRoot[nExisting+nNew];
    signal output newCommitmentHash[nExisting+nNew];

    // ensure that External Input & Output
    // fits within the 252 bits
    var n2bIO[2][252];
    n2bIO[0] = Num2Bits(252)(externIO[0]);
    n2bIO[1] = Num2Bits(252)(externIO[1]);

    signal _newNullRootOut[nNew+nExisting];
    signal _newCommitmentRootOut[nNew+nExisting];
    signal _newCommitmentHashOut[nNew+nExisting];

    // get ownership & membership proofs for existing commitments
    // and compute total sum
    signal totalEx[nExisting+1];
    totalEx[0] <== externIO[0];
    for (var i = 0; i < nExisting; i++) {
        var out[4] = HandleExistingCommitment(
                        maxTreeDepth,
                        cipherLen,
                        tupleLen
                    )(
                        scope,
                        existingStateRoot,
                        actualTreeDepth,
                        privateKey[i],
                        nonce[i],
                        exSaltPublicKey[i],
                        exCiphertext[i],
                        exIndex[i],
                        exSiblings[i]
                    );
        _newNullRootOut[i] <== out[0];
        _newCommitmentRootOut[i] <== out[1];
        _newCommitmentHashOut[i] <== out[2];
        totalEx[i+1] <== totalEx[i] + out[3];
    }

    // get ownership for new commitments
    // and compute total sum
    signal totalNew[nNew+1];
    totalNew[0] <== externIO[1];
    var k = nExisting; // offset for new commitments
    for (var i = 0; i < nNew; i++) {

        var out[4] = HandleNewCommitment(
                        cipherLen,
                        tupleLen
                    )(
                        scope,
                        privateKey[k],
                        nonce[k],
                        newSaltPublicKey[i],
                        newCiphertext[i]
                    );
        _newNullRootOut[k] <== out[0];
        _newCommitmentRootOut[k] <== out[1];
        _newCommitmentHashOut[k] <== out[2];
        totalNew[i+1] <== totalNew[i] + out[3];
        k++;
    }

    // lastly ensure that all total sums are equal
    signal sumEqCheck <== IsEqual()(
                        [
                            totalEx[nExisting],
                            totalNew[nNew]
                        ]
                    );
    sumEqCheck === 1;

    newNullRoot <== _newNullRootOut;
    newCommitmentRoot <== _newCommitmentRootOut;
    newCommitmentHash <== _newCommitmentHashOut;

    // constraint on context
    signal contextSqrd <== context * context;
}
