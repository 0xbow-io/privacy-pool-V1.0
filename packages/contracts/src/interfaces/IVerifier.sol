// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IPrivacyPool} from "../interfaces/IPrivacyPool.sol";

/// @title Verifier contract interface.
interface IVerifier {
    error VerifierIsZero();

    error FeeTooHigh(uint256 fee, uint256 units);
    error FeeCollectorIsZero();
    error InvalidScope(uint256 got, uint256 expected);
    error InvalidContext(uint256 got);
    error InvalidStateTreeDepth(uint256 root, uint256 depth, uint256 actualDepth);

    error ProofVerificationFailed();
    error InvalidProofOutput();
}
