// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title PrivacyPool contract interface.
interface IPrivacyPool {
    error ValMismatch(uint256 got, uint256 expected);
    error ExceedsMax(uint256 got, uint256 expected);
    error NullifierIsKnown(uint256 nullifier);

    error InvalidFee(uint256 got, uint256 expected);
    error InvalidUnits(uint256 got, uint256 expected);

    error FeeFailed();

    error InvalidMerkleRoot(uint256 root);

    error ProofVerificationFailed();

    error IsZeroAddress();

    error NoETHAllowed();

    event NewCommitment(uint256 commitment, uint256 index, uint256[4] ciphertext);
    event NewNullifier(uint256 nullifier);
    event NewTxRecord(
        uint256 inputNullifier1,
        uint256 inputNullifier2,
        uint256 outputCommitment1,
        uint256 outputCommitment2,
        uint256 publicAmount,
        uint256 index
    );
    event NewRelease(
        address to,
        address feeCollector,
        uint256 value,
        string associationProofURI,
        uint256 inputNullifier1,
        uint256 inputNullifier2
    );

    struct signal {
        int256 units;
        uint256 fee;
        address account;
        address feeCollector;
    }

    struct supplement {
        uint256[4][2] ciphertexts;
        string associationProofURI;
    }

    function maxCommitValue() external view returns (uint256);
    function latestRoot() external view returns (uint256);
    function size() external view returns (uint256);
    function knownRoot(uint256 root) external view returns (bool);
    function IsKnownNullifier(uint256 nullifier) external view returns (bool);
    function currentDepth() external view returns (uint256);

    function valueUnitRepresentative() external view returns (address);
    function process(
        signal calldata s,
        supplement calldata sp,
        uint256[2] memory _pA,
        uint256[2][2] memory _pB,
        uint256[2] memory _pC,
        uint256[8] memory _pubSignals
    ) external payable;

    function calcSignalHash(int256 units, uint256 fee, address account, address feeCollector)
        external
        view
        returns (uint256);

    function calcPublicVal(int256 units, uint256 fee) external view returns (uint256);
}
