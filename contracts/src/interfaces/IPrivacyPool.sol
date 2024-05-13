// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title PrivacyPool contract interface.
interface IPrivacyPool {
    error ValMismatch(uint256 got, uint256 expected);
    error ExceedsMax(uint256 got, uint256 expected);
    error NullifierIsKnown(uint256 nullifier);

    error InvalidFee(uint256 got, uint256 expected);
    error InvalidUnits(uint256 got, uint256 expected);
    error InvalidPublicVal(uint256 got, uint256 expected);
    error InvalidExtHash(bytes32 extDataHash);

    error FeeFailed();

    error InvalidMerkleRoot(bytes32 root);

    error ProofVerificationFailed();

    error IsZeroAddress();

    error NoETHAllowed();

    event NewCommitment(uint256 commitment, uint256 index, bytes encryptedOutput);
    event NewNullifier(uint256 nullifier);
    event NewTxRecord(uint256[] inputNullifiers, uint256[] outputCommitments, uint256 publicVal, uint256 index);
    event NewRelease(
        address to, address feeCollector, uint256 value, bytes associationProofHash, uint256[] inputNullifiers
    );
}
