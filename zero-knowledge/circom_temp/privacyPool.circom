pragma circom 2.1.9;

// IDEN3 Circomlib imports
include "mux1.circom";
include "comparators.circom";

// MACI imports
include "verifySignature.circom";

// local imports
include "tree.circom";
include "commitment.circom";


template VerifyInput(maxMerkleTreeDepth){
    signal input publicKey[2];
    signal input value;
    signal input salt;
    signal input sigR8[2];
    signal input sigS;
    signal input nullifier;
    signal input leafIndex;
    signal input actualMerkleTreeDepth;
    signal input merkleProofSiblings[maxMerkleTreeDepth];

    signal output isSignatureValid;
    signal output isNullifierValid;
    signal output computedMerkleRoot;

    component valCheck = Num2Bits(252);
    valCheck.in <== value;

    var computedCommitment = Commitment()(publicKey, value, salt);

    isSignatureValid <== VerifySignature()(publicKey, sigR8, sigS, [publicKey[0], publicKey[1], computedCommitment, leafIndex]);
    isNullifierValid <== VerifyNullifier()(computedCommitment, leafIndex, sigR8, sigS, nullifier);
    computedMerkleRoot <== ComputeMerkleRoot(maxMerkleTreeDepth)(computedCommitment,actualMerkleTreeDepth,leafIndex,merkleProofSiblings);
}

template PrivacyPool(maxMerkleTreeDepth, nIns, nOuts) {

    // Public inputs
    signal input commitFlag; // either 1 or 0
    signal input publicVal;
    signal input scope;
    signal input actualMerkleTreeDepth;
    signal input inputNullifier[nIns];
    signal input outputCommitment[nOuts];

    signal input inputPublicKey[nIns][2];
    signal input inputValue[nIns];
    signal input inputSalt[nIns];

    // EdDSA signature components
    signal input inputSigR8[nIns][2];
    signal input inputSigS[nIns];

    signal input inputLeafIndex[nIns];
    signal input merkleProofSiblings[nIns][maxMerkleTreeDepth];

    signal input outputPublicKey[nOuts][2];
    signal input outputValue[nOuts];
    signal input outputSalt[nOuts];

    signal output merkleRoot;

    signal computedMerkleRoots[nIns];

    // check publicVal is within range
    component publicValCheck = Num2Bits(252);
    publicValCheck.in <== publicVal;

    component inputVerifiers[nIns];
    var sumIns = 0;
    signal inMerkleRoots[nIns];
    for (var i = 0; i < nIns; i++) {

        // Verify input
        inputVerifiers[i] = VerifyInput(maxMerkleTreeDepth);
        inputVerifiers[i].publicKey <== inputPublicKey[i];
        inputVerifiers[i].value <== inputValue[i];
        inputVerifiers[i].salt <== inputSalt[i];
        inputVerifiers[i].sigR8 <== inputSigR8[i];
        inputVerifiers[i].sigS <== inputSigS[i];
        inputVerifiers[i].nullifier <== inputNullifier[i];
        inputVerifiers[i].leafIndex <== inputLeafIndex[i];
        inputVerifiers[i].actualMerkleTreeDepth <== actualMerkleTreeDepth;
        inputVerifiers[i].merkleProofSiblings <== merkleProofSiblings[i];

        inputVerifiers[i].isSignatureValid === 1;
        inputVerifiers[i].isNullifierValid === 1;

        var lastComputedMerkleRoot = i == 0 ? 0 : inMerkleRoots[i-1];
        var inputIsDummy = IsZero()(inputValue[i]);
        var merkleRootMux = Mux1()([inputVerifiers[i].computedMerkleRoot, lastComputedMerkleRoot], inputIsDummy);
        inMerkleRoots[i] <== merkleRootMux;

        sumIns += inputValue[i];
    }

    // verify that all computed roots are the same
    for (var i = 0; i < nIns - 1; i++) {
        inMerkleRoots[i] === inMerkleRoots[i+1];
    }


    component outValueCheck[nOuts];
    component outputVerifiers[nOuts];
    var sumOuts = 0;
    // verify correctness of outputs
    for (var i = 0; i < nOuts; i++) {
        outputVerifiers[i] = VerifyCommitment();
        outputVerifiers[i].pubKey <== outputPublicKey[i];
        outputVerifiers[i].value <== outputValue[i];
        outputVerifiers[i].salt <== outputSalt[i];
        outputVerifiers[i].commitment <== outputCommitment[i];

        outputVerifiers[i].isValid === 1;

        outValueCheck[i] = Num2Bits(252);
        outValueCheck[i].in <== outputValue[i];
        sumOuts += outputValue[i];
    }

    // if commitFlag = 0, a release was requested
    // therefore input is deducted by publicVal
    component expectedOutputSum = Mux1();
    expectedOutputSum.c[0] <== sumIns + publicVal;
    expectedOutputSum.c[1] <== sumIns - publicVal;
    expectedOutputSum.s <== IsZero()(commitFlag);

    expectedOutputSum.out === sumOuts;

    // signal merkleroot as output
    merkleRoot <== inMerkleRoots[nIns-1];

    signal scopeSquare <== scope * scope;
}
