pragma circom 2.1.9;

// IDEN3 Circomlib imports
include "mux1.circom";

// MACI imports
include "verifySignature.circom";

// local imports
include "tree.circom";
include "commitment.circom";
include "nullifier.circom";

template PrivacyPool(MAX_DEPTH, nIns, nOuts) {

    signal input publicVal;
    signal input signalHash;
    signal input actualMerkleTreeDepth;

    // data for nIns Nullifiers
    signal input inputNullifier[nIns];
    signal input inUnits[nIns];
    signal input inPk[nIns][2];
    signal input inBlinding[nIns];

    // input signature components
    // used to verify knowledge of private key
    // without revealing it
    signal input inSigR8[nIns][2];
    signal input inSigS[nIns];

    // merkle proofs for each input nullifiers
    signal input inLeafIndices[nIns];
    signal input merkleProofSiblings[nIns][MAX_DEPTH];

    // data for nOuts Commitments
    signal input outCommitment[nOuts];
    signal input outUnits[nOuts];
    signal input outPk[nOuts][2];
    signal input outBlinding[nOuts];

    signal output merkleRoot;

    component inCommitment[nIns];
    component inNullifier[nIns];
    component isSignatureValid[nIns];
    component isNullifierValid[nIns];

    component merkleRootMux[nIns];
    signal inMerkleRoots[nIns];

    // compute commitments, signatures, nullifiers and merkle roots
    var sumIns = 0;
    for (var i = 0; i < nIns; i++) {
        inCommitment[i] = Commitment();
        inCommitment[i].amount <== inUnits[i];
        inCommitment[i].pubKey <== inPk[i];
        inCommitment[i].blinding <== inBlinding[i];

        // verify signature from private key
        isSignatureValid[i] = VerifySignature();
        isSignatureValid[i].pubKey <== inPk[i];
        isSignatureValid[i].R8 <== inSigR8[i];
        isSignatureValid[i].S <== inSigS[i];
        isSignatureValid[i].preimage <== [inPk[i][0], inPk[i][1], inCommitment[i].out, inLeafIndices[i]];

        isSignatureValid[i].valid === 1;

        isNullifierValid[i] = IsEqual();
        isNullifierValid[i].in[0] <== inputNullifier[i];
        isNullifierValid[i].in[1] <== Nullifier()(inCommitment[i].out, inLeafIndices[i], inSigR8[i], inSigS[i]);

        isNullifierValid[i].out === 1;

        merkleRootMux[i] = Mux1();
        // compute the new merkle root
        merkleRootMux[i].c[0] <==  ComputeMerkleRoot(MAX_DEPTH)(
                            inCommitment[i].out,
                            actualMerkleTreeDepth,
                            inLeafIndices[i],
                            merkleProofSiblings[i]
                        );
        merkleRootMux[i].c[1] <==i == 0 ? 0 : inMerkleRoots[i-1];
        // if units is 0, then no merkle proof is needed
        // so adopt the previous computed merkle root
        merkleRootMux[i].s <== IsZero()(inUnits[i]);
        merkleRootMux[i].out ==> inMerkleRoots[i];

        sumIns += inUnits[i];
    }

    // verify that all computed roots are the same
    for (var i = 0; i < nIns - 1; i++) {
        inMerkleRoots[i] === inMerkleRoots[i+1];
    }

    // signal merkleroot as output
    merkleRoot <== inMerkleRoots[nIns-1];

    component computedOutCommitment[nOuts];
    component outUnitsCheck[nOuts];
    var sumOuts = 0;

    // verify correctness of outputs
    for (var i = 0; i < nOuts; i++) {
        computedOutCommitment[i] = Commitment();
        computedOutCommitment[i].amount <== outUnits[i];
        computedOutCommitment[i].pubKey <== outPk[i];
        computedOutCommitment[i].blinding <== outBlinding[i];

        computedOutCommitment[i].out === outCommitment[i];

        // Check that amount fits into 248 bits to prevent overflow
        outUnitsCheck[i] = Num2Bits(248);
        outUnitsCheck[i].in <== outUnits[i];

        sumOuts += outUnits[i];
    }

    // check that there are no same nullifiers among all inputs
    component sameNullifiers[nIns * (nIns - 1) / 2];
    var index = 0;
    for (var i = 0; i < nIns - 1; i++) {
      for (var j = i + 1; j < nIns; j++) {
          sameNullifiers[index] = IsEqual();
          sameNullifiers[index].in[0] <== inputNullifier[i];
          sameNullifiers[index].in[1] <== inputNullifier[j];
          sameNullifiers[index].out === 0;
          index++;
      }
    }
    sumIns + publicVal === sumOuts;
    signal signalSquare <== signalHash * signalHash;
}
