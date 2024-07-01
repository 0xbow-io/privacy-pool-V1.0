 SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title PrivacyPool contract interface.
interface IPrivacyPool {
    error InvalidRepresentation();
    error NullifierReused();
    error CiphertextInsertionFailed();

    /// @dev struct to holds
    /// the specificities
    /// of a commitment / release
    struct Request {
        // true if the request is a commitment
        // false if the request is a release
        bool isCommitFlag;
        uint256 units;
        uint256 fee;
        address account;
        address feeCollector;
    }

    /// @dev struct to hold the
    /// any additional information
    /// relevant to a commitment / release
    struct Supplement {
        uint256[4][2] ciphertexts;
        string associationProofURI;
    }

    event Record(
        Request _r,
        uint256 root,
        uint256 depth,
        uint256 size,
        uint256 nullifiers
    );

    function computePublicVal(Request calldata _r) external pure returns (uint256);
    function computeScope(Request calldata _r) external view returns (uint256);
    function process(
        Request calldata _r,
        Supplement calldata _s,
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[9] calldata _pubSignals
    ) external payable;
    function root() external view returns (uint256);
    function size() external view returns (uint256);
    function depth() external view returns (uint256);
}
