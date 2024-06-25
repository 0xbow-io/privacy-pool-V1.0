// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IPrivacyPool} from "../interfaces/IPrivacyPool.sol";

/// @title Verifier contract interface.
interface IVerifier {
    error VerifierZero();
    error MaxUnitsAllowedZero();
    error UnitsZero();
    error UnitsTooHigh(uint256 units, uint256 MaxAllowed);
    error FeeTooHigh(uint256 fee, uint256 units);
    error AccountZero();
    error FeeCollectorZero(); // M-02
    error NotCommit();
    error NotRelease();

    error CommitFlagMismatch(bool got, uint256 expected);
    error InvalidScope(uint256 got, uint256 expected);
    error InvalidPublicValue(uint256 got, uint256 expected);
    error InvalidMerkleRoot(uint256 root);
    error InvalidMerkleTreeDepth(uint256 depth);
    error NullifierIsKnown(uint256 nullifier);
    error NullifierIsNotKnown(uint256 nullifier);
    error CommitmentIsNotKnown(uint256 nullifier);

    error ProofVerificationFailed();
}
