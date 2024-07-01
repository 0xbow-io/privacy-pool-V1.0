// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {IPrivacyPool} from "./interfaces/IPrivacyPool.sol";
import {Verifier} from "./verifier/Verifier.sol";
import {NonNative} from "./processors/NonNative.sol";
import {Native} from "./processors/Native.sol";

import {
    N_INPUT_COMMITMENTS, N_OUTPUT_COMMITMENTS, NewNullifierStartIndex, NewCommitmentStartIndex
} from "./Constants.sol";

/// @title PrivacyPool pools contract.
contract PrivacyPool is IPrivacyPool, Verifier, NonNative, Native {
    /// @dev unitRepresentation is the address of the external contract
    /// that represents the unit of value that is being committed to the pool
    /// must support transferFrom() & balanceOf() function
    /// if set to 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, Native ETH is used as the unit of value
    address public immutable unitRepresentation;

    /**
     * @dev The constructor
     * @param _maxUnitsAllowed maximum amount  ofunits that can be committed to the pool at once
     * @param _unitRepresentation address of the external contract that represents the unit of value
     * @param _verifier the address of GROTH16 SNARK verifier
     */
    constructor(uint256 _maxUnitsAllowed, address _unitRepresentation, address _verifier)
        Verifier(_maxUnitsAllowed, _verifier)
    {
        // ensure unitRepresentation address is not zero address
        if (_unitRepresentation == address(0)) {
            revert InvalidRepresentation();
        }

        unitRepresentation = _unitRepresentation;
    }

    modifier _releaseFee(IPrivacyPool.Request calldata _r) {
        _;
        // toAccount set to false so _to should be the feeCollector address
        (address _to, uint256 _amnt) = _computeRelease(_r, false);
        require(_to == _r.feeCollector, "_to != FeeCollector");

        if (!IsNative(unitRepresentation)) {
            nonNativeRelease(_to, _amnt, unitRepresentation);
        } else {
            nativeRelease(_to, _amnt, unitRepresentation);
        }
    }

    /**
     * @dev process processes a commitment or release request
     * @param _r the actual request to be processed
     * @param _pA, _pB, _pC: the packed Groth16Proof SNARK (private)
     * @param _pubSignals the public inputs to the SNARK circuit
     */
    function process(
        Request calldata _r,
        Supplement calldata _s,
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[9] calldata _pubSignals
    ) public payable IsValidRequest(_r) IsValidProof(_r, _pA, _pB, _pC, _pubSignals) _releaseFee(_r) {
        // IsValidRequest: verify the request is valid
        // HasValidProof: verify the proof is valid

        // proceed with either a commit or release
        if (_r.isCommitFlag) {
            _doCommit(_r);
        } else {
            _doRelease(_r);
        }

        // Update the state of the pool
        _updateState(_r, _s, _pubSignals);

        //ReleaseFee: release the fee to the feeCollector if any

    }

    function _doCommit(Request calldata _r) internal OnlyCommit(_r) {
        (address _from, uint256 _amnt) = _computeCommit(_r);
        require(_from == _r.account, "_from address mismatch");

        if (!IsNative(unitRepresentation)) {
            nonNativeCommit(_from, _amnt, unitRepresentation);
        } else {
            nativeCommit(_from, _amnt, unitRepresentation);
        }
    }

    function _doRelease(Request calldata _r) internal OnlyRelease(_r) {
        // toAccount is set to true so _to should be the account address
        (address _to, uint256 _amnt) = _computeRelease(_r, true);
        require(_to == _r.account, "_to address mismatch");

        if (!IsNative(unitRepresentation)) {
            nonNativeRelease(_to, _amnt, unitRepresentation);
        } else {
            nativeRelease(_to, _amnt, unitRepresentation);
        }
    }

    function _updateState(Request calldata _r, Supplement calldata _s, uint256[9] calldata _pubSignals)
        internal
        ValidStateChange(_pubSignals)
    {
        // Insert nullifiers whilst checking for reuse
        uint256 _offset  = NewNullifierStartIndex;
        for (uint256 i = 0; i < N_INPUT_COMMITMENTS; i ++){
            if (markNullifierAsKnown(_pubSignals[i])) {
                revert NullifierReused();
            }
        }

        // Insert new commitments & ciphertexts
         _offset  = NewCommitmentStartIndex;
        for (uint256 i = 0; i < N_OUTPUT_COMMITMENTS; i ++){
            uint256 root = insertCommitment(_pubSignals[i+_offset]);
            if (
                    !insertCiphertext(
                    root,
                    _s.ciphertexts[i][0],
                    _s.ciphertexts[i][1],
                    _s.ciphertexts[i][2],
                    _s.ciphertexts[i][3]
                    )
                ) {
                revert CiphertextInsertionFailed();
            }
        }

        // emit the record
        emit Record(_r,  latestMerkleRoot(), merkleTreeDepth(), merkleTreeSize(), numberOfNullifiers);
    }

    function computePublicVal(Request calldata _r) external pure returns (uint256) {
        return _computePublicVal(_r);
    }

    function computeScope(Request calldata _r) external view returns (uint256) {
        return _computeScope(_r);
    }

    function root() external view returns (uint256) {
        return latestMerkleRoot();
    }

    function size() external view returns (uint256) {
        return merkleTreeSize();
    }

    function depth() external view returns (uint256) {
        return merkleTreeDepth();
    }
}
