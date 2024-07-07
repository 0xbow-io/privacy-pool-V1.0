// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {IPrivacyPool} from "./interfaces/IPrivacyPool.sol";
import {Verifier} from "./verifier/Verifier.sol";
import {NonNative} from "./processors/NonNative.sol";
import {Native} from "./processors/Native.sol";

import "./Constants.sol";

/// @title PrivacyPool pools contract.
contract PrivacyPool is IPrivacyPool, Verifier, NonNative, Native {
    /// @dev primitiveHandler is the address of the contract
    /// that handles the primitive type of the pool.
    /// Of set to D_NATIVE_PRIMITIVE, the native chain gas token will be used.
    address public immutable primitiveHandler;

    /**
     * @dev The constructor
     * @param _primitiveHandler address of the primitive handler
     * @param _verifier the address of GROTH16 SNARK verifier
     */
    constructor(address _primitiveHandler, address _verifier) Verifier(_verifier) {
        // ensure _primitive address is not zero address
        if (_primitiveHandler == address(0)) {
            revert InvalidPrimitive();
        }

        primitiveHandler = _primitiveHandler;
    }

    modifier _releaseFee(Request calldata _r, GROTH16Proof calldata _proof) {
        _;
        if (!IsNative(primitiveHandler)) {
            nonNativeRelease(_r.feeCollector, _r.fee, primitiveHandler);
        } else {
            nativeRelease(_r.feeCollector, _r.fee, primitiveHandler);
        }
    }

    modifier _updateInternalState(Request calldata _r, GROTH16Proof calldata _proof) {
        _;
        // update state with proof values
        ApplyProofToState(_proof);

        // Emit the record event
        emit Record(_r, GetStateRoot(), GetStateSize());
    }

    /**
     * @dev process processes a data commitment request
     * @param _r the actual request to be processed
     * @param _proof: the packed Groth16Proof SNARK proof
     */
    function process(Request calldata _r, GROTH16Proof calldata _proof)
        public
        payable
        // ensure the request is valid
        IsValidRequest(_r, _proof)
        // ensure the proof is valid
        IsValidProof(_r, _proof)
        // updates the state with the proof values
        _updateInternalState(_r, _proof)
        // release the fee to the fee collector
        _releaseFee(_r, _proof)
    {
        /// external IO values are fetched from the proof public input singals
        /// external IO[0] or external Input will be commited to the pool
        _doCommit(_r, _proof);
        /// external IO[1] or external Output will be released to the sink
        _doSink(_r, _proof);
    }

    /// @dev commit from a source address to the pool
    /// Consider the external input to be the necessary input value required for a computation between
    /// existing commitments (i.e addition of two commitment values + exeternal input )
    /// _commit will ensure that the pool has received this external input amount
    function _doCommit(Request calldata _r, GROTH16Proof calldata _proof) internal OnlyCommit(_proof) {
        uint256 _amnt = _fetchCommitmentAmt(_proof);

        if (!IsNative(primitiveHandler)) {
            nonNativeCommit(_r.src, _amnt, primitiveHandler);
        } else {
            nativeCommit(_r.src, _amnt, primitiveHandler);
        }
    }

    /// @dev sink from the pool to a sink address
    /// Consider the external output to be the remainder or carry over of a computation between existing commitments
    /// This output will then be released to a designated sink address via the primitive handler
    function _doSink(Request calldata _r, GROTH16Proof calldata _proof) internal OnlySink(_proof) {
        uint256 _amt = _fetchSinkAmnt(_proof);

        if (!IsNative(primitiveHandler)) {
            nonNativeRelease(_r.sink, _amt, primitiveHandler);
        } else {
            nativeRelease(_r.sink, _amt, primitiveHandler);
        }
    }

    function context(IPrivacyPool.Request calldata _r) public pure returns (uint256) {
        return _r.fee;
    }
}
