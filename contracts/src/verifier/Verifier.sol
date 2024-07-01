// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IGroth16Verifier} from "../interfaces/IGroth16Verifier.sol";
import {IPrivacyPool} from "../interfaces/IPrivacyPool.sol";
import {IVerifier} from "../interfaces/IVerifier.sol";
import {State} from "../state/State.sol";
import {
    SNARK_SCALAR_FIELD,
    MAX_DEPTH,
    NATIVE_REPRESENTATION,
    N_INPUT_COMMITMENTS,
    N_OUTPUT_COMMITMENTS,
    MerkleRootIndex,
    IsCommitFlagIndex,
    ScopeIndex,
    PublicValIndex,
    MerkleTreeDepthIndex,
    NewNullifierStartIndex,
    NewCommitmentStartIndex
} from "../Constants.sol";

contract Verifier is IVerifier, State {
    /// @dev _groth16_verifier
    /// is the SNARK verifier contract
    IGroth16Verifier immutable groth16_verifier;

    /// @dev maxCommitVal is the maximum units allowed to be comitted to the pool at 1 time.
    uint256 public immutable maxUnitsAllowed;

    constructor(uint256 _maxUnitsAllowed, address _verifier) {
        // ensure verifier address is not zero address
        if (address(_verifier) == address(0)) {
            revert VerifierZero();
        }
        if (_maxUnitsAllowed == 0) {
            revert MaxUnitsAllowedZero();
        }

        groth16_verifier = IGroth16Verifier(_verifier);
        maxUnitsAllowed = _maxUnitsAllowed;
    }

    /**
     * @dev Modifier to ensure incoming requests to privacy pool is valid
     *
     * Requirements:
     *
     * - _maxUnitsAllowed < Units and Units > 0
     * - Fee < Units
     * - Account is not zero address
     * - FeeCollector is not zero address if Fee > 0
     */
    modifier IsValidRequest(IPrivacyPool.Request calldata _r) {
        _requireValidUnits(_r);
        _requireValidFees(_r);
        _requireValidAccount(_r);
        _requireValidFeeCollector(_r);
        _;
    }

    /**
     * @dev Modifier to ensure proof associated with request is verified
     *
     * Requirements:
     *
     * - Public Input IsCommitFlag matches the request
     * - Public Output contains known merkle root.
     * - Public Input contains valid Scope
     * - Public Input contains valid Public Value
     * - Public input contains valid Merkle Depth
     * - Public Input does not contain known nullifier.
     * - Proof can be verified by Groth16 SNARK verifier contract
     * - Request has not been tampered with
     */
    modifier IsValidProof(
        IPrivacyPool.Request calldata _r,
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[9] calldata _pubSignals
    ) {
        uint256 _commitFlag = _pubSignals[IsCommitFlagIndex];
        if ((_r.isCommitFlag && _commitFlag != 1) || (!_r.isCommitFlag && _commitFlag != 0)) {
            revert CommitFlagMismatch(_r.isCommitFlag, _commitFlag);
        }
        _requireKnownMerkleRoot(_pubSignals, MerkleRootIndex);
        _requireValidScope(_r, _pubSignals, ScopeIndex);
        _requireValidPublicVal(_r, _pubSignals, PublicValIndex);
        _requireValidMerkleTreeDepth(_pubSignals, MerkleTreeDepthIndex);
        _requireNewNullifiers(_pubSignals, NewNullifierStartIndex);
        _requireVerifiedGroth16Proof(_pA, _pB, _pC, _pubSignals);
        _;
    }

    /**
     * @dev Modifier to ensure state change
     *  is valid after processing request
     *
     * Requirements:
     *
     * - State should know of the new nullifiers
     * - State should know of the new commitments
     *
     */
    modifier ValidStateChange(uint256[9] calldata _pubSignals) {
        _;
        _requireNullifiersTobeKnown(_pubSignals, NewNullifierStartIndex);
        _requireCommitmentsTobeKnown(_pubSignals, NewCommitmentStartIndex);
    }

    modifier OnlyCommit(IPrivacyPool.Request calldata _r) {
        if (!_r.isCommitFlag) {
            revert NotCommit();
        }
        _;
    }

    modifier OnlyRelease(IPrivacyPool.Request calldata _r) {
        if (_r.isCommitFlag) {
            revert NotRelease();
        }
        _;
    }

    function _requireValidUnits(IPrivacyPool.Request calldata _r) public view {
        if (_r.units == 0) {
            revert UnitsZero();
        }
        if (_r.units > maxUnitsAllowed) {
            revert UnitsTooHigh(_r.units, maxUnitsAllowed);
        }
    }

    function _requireValidFees(IPrivacyPool.Request calldata _r) public pure {
        if (_r.fee >= _r.units) {
            revert FeeTooHigh(_r.fee, _r.units);
        }
    }

    function _requireValidAccount(IPrivacyPool.Request calldata _r) public pure {
        if (_r.account == address(0)) {
            revert AccountZero();
        }
    }

    function _requireValidFeeCollector(IPrivacyPool.Request calldata _r) public pure {
        if (_r.fee > 0 && _r.feeCollector == address(0)) {
            revert FeeCollectorZero();
        }
    }

        /// @dev if the commitment tree is non-empty then
        /// it is required that the circuit output  is a known merkle root
        /// but if both input commitments were dummy (0 value)
        /// then the circuit will output 0 for the merkle root
        /*
            snippet from privacyPool.cirom (line-93):
            var lastComputedMerkleRoot = i == 0 ? 0 : inMerkleRoots[i-1];
            var inputIsDummy = IsZero()(inputValue[i]);
            var merkleRootMux = Mux1()([inputVerifiers[i].computedMerkleRoot, lastComputedMerkleRoot], inputIsDummy);
            inMerkleRoots[i] <== merkleRootMux;
        */
        /// the verifier will confirm whether the inputs are dummy inputs or not
    function _requireKnownMerkleRoot(uint256[9] calldata _pubSignals, uint8 _index) internal view {
        if (
            merkleTreeSize() > 0 && !isMerkleRootKnown(_pubSignals[_index]) && _pubSignals[_index] != 0
        ) {
            revert InvalidMerkleRoot(_pubSignals[_index]);
        }
    }

    // M-01
    // Zk-Kit Binary merkle Root circuit will verify merkle root = 0 for depth > MAX_DEPTH
    // Hence need to make sure to enforce `depth <= MAX_DEPTH` outside the circuit.
    function _requireValidMerkleTreeDepth(uint256[9] calldata _pubSignals, uint8 _index) internal pure {
        if (_pubSignals[_index] > uint256(MAX_DEPTH)) {
            revert InvalidMerkleTreeDepth(_pubSignals[_index]);
        }
    }

    /// @dev Might be redundant as the EnumerableSet will report on duplicates
    function _requireNewNullifiers(uint256[9] calldata _pubSignals, uint8 _index) internal view {
        for (uint8 i = _index; i < _index + N_INPUT_COMMITMENTS; i++) {
            if (isNullifierKnown(_pubSignals[i])) {
                revert NullifierIsKnown(_pubSignals[i]);
            }
        }
    }

    function _requireNullifiersTobeKnown(uint256[9] calldata _pubSignals, uint8 _index) internal view {
        for (uint8 i = _index; i < _index + N_INPUT_COMMITMENTS; i++) {
            if (!isNullifierKnown(_pubSignals[i])) {
                revert NullifierIsNotKnown(_pubSignals[i]);
            }
        }
    }

    function _requireCommitmentsTobeKnown(uint256[9] calldata _pubSignals, uint8 _index) internal view {
        for (uint8 i = _index; i < _index + N_OUTPUT_COMMITMENTS; i++) {
            if (!hasCommitment(_pubSignals[i])) {
                revert CommitmentIsNotKnown(_pubSignals[i]);
            }
        }
    }

    function _getChainId() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /// @dev computeRequestHash hashes the request to a uint256 value
    /// This is a public input to the SNARK verifier
    /// checks if any of the request params were tampered with
    /// also confirms that the request is for the correct pool
    function _computeScope(IPrivacyPool.Request calldata _r) public view returns (uint256) {
        return uint256(
            keccak256(
                abi.encode(_getChainId(), address(this), _r.isCommitFlag, _r.units, _r.fee, _r.account, _r.feeCollector)
            )
        ) % SNARK_SCALAR_FIELD;
    }

    function _requireValidScope(IPrivacyPool.Request calldata _r, uint256[9] calldata _pubSignals, uint8 _index)
        internal
        view
    {
        uint256 expected = _computeScope(_r);
        uint256 _scope = _pubSignals[_index];
        if (_scope != expected || expected == 0) {
            revert InvalidScope(_scope, expected);
        }
    }

    function _computePublicVal(IPrivacyPool.Request calldata _r) public pure returns (uint256) {
        return _r.isCommitFlag ? _r.units - _r.fee : _r.units + _r.fee;
    }

    function _requireValidPublicVal(IPrivacyPool.Request calldata _r, uint256[9] calldata _pubSignals, uint8 _index)
        internal
        pure
    {
        uint256 expected = _computePublicVal(_r);
        uint256 _publicVal = _pubSignals[_index];
        if (_publicVal != expected) {
            revert InvalidPublicValue(_publicVal, expected);
        }
    }

    function _requireVerifiedGroth16Proof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[9] calldata _pubSignals
    ) internal view {
        // verify proof
        if (!groth16_verifier.verifyProof(_pA, _pB, _pC, _pubSignals)) {
            revert ProofVerificationFailed();
        }
    }

    function _computeRelease(IPrivacyPool.Request calldata _r, bool toAccount)
        internal
        pure
        returns (address, uint256)
    {
        address _to = toAccount ? _r.account : _r.feeCollector;
        uint256 _amnt = toAccount ? _r.units : _r.fee;
        return (_to, _amnt);
    }

    function _computeCommit(IPrivacyPool.Request calldata _r) internal pure returns (address, uint256) {
        return (_r.account, _r.units);
    }

    function IsNative(address unitRepresentation) public pure returns (bool) {
        return unitRepresentation == NATIVE_REPRESENTATION;
    }
}
