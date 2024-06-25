// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {NATIVE_REPRESENTATION} from "../Constants.sol";
import {IProcessor} from "../interfaces/IProcessor.sol";

contract NonNative is IProcessor {
    modifier MustNotBeNative(address _unitRepresentation) {
        if (_unitRepresentation == NATIVE_REPRESENTATION || msg.value > 0) {
            revert PoolIsNonNative();
        }
        _;
    }

    modifier _verifyNonNativeCommit(uint256 _amnt, address _unitRepresentation) {
        uint256 _sum = sumNonNative(_unitRepresentation);
        _;
        uint256 _total_commit = _sum - sumNonNative(_unitRepresentation);
        if (_total_commit != _amnt) {
            revert InvalidCommitAmnt(_total_commit, _amnt);
        }
    }

    modifier _verifyNonNativeRelase(uint256 _amnt, address _unitRepresentation) {
        uint256 _sum = sumNonNative(_unitRepresentation);
        _;
        uint256 _total_release = sumNonNative(_unitRepresentation) - _sum;
        if (_total_release != _amnt) {
            revert InvalidReleaseAmnt(_total_release, _amnt);
        }
    }

    function nonNativeCommit(address _from, uint256 _amnt, address _unitRepresentation)
        internal
        MustNotBeNative(_unitRepresentation)
        _verifyNonNativeCommit(_amnt, _unitRepresentation)
    {
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(0x60, _amnt)
            mstore(0x40, address())
            mstore(0x2c, shl(96, _from))
            mstore(0x0c, 0x23b872dd000000000000000000000000)
            if iszero(
                and(
                    or(eq(mload(0x00), 1), iszero(returndatasize())),
                    call(gas(), _unitRepresentation, 0, 0x1c, 0x64, 0x00, 0x20)
                )
            ) {
                mstore(0x00, 0x7939f424)
                revert(0x1c, 0x04)
            }
            mstore(0x60, 0)
            mstore(0x40, m)
        }
    }

    function nonNativeRelease(address _to, uint256 _amnt, address _unitRepresentation)
        internal
        MustNotBeNative(_unitRepresentation)
        _verifyNonNativeRelase(_amnt, _unitRepresentation)
    {
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(0x60, _amnt) // units to be released
            mstore(0x40, _to) // to
            mstore(0x2c, shl(96, address())) // from pool
            mstore(0x0c, 0x23b872dd000000000000000000000000)
            if iszero(
                and(
                    or(eq(mload(0x00), 1), iszero(returndatasize())),
                    call(gas(), _unitRepresentation, 0, 0x1c, 0x64, 0x00, 0x20)
                )
            ) {
                mstore(0x00, 0x7939f424)
                revert(0x1c, 0x04)
            }
            mstore(0x60, 0)
            mstore(0x40, m)
        }
    }

    // total sum of all commited values in the pool
    function sumNonNative(address _unitRepresentation) internal view returns (uint256 sum) {
        address extern = _unitRepresentation;
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x14, address())
            mstore(0x00, 0x70a08231000000000000000000000000)
            sum := mul(mload(0x20), and(gt(returndatasize(), 0x1f), staticcall(gas(), extern, 0x10, 0x24, 0x20, 0x20)))
        }
    }
}
