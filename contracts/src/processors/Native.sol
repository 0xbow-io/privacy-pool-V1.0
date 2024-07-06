// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {D_NATIVE_PRIMITIVE} from "../Constants.sol";
import {IProcessor} from "../interfaces/IProcessor.sol";

contract Native is IProcessor {
    modifier MustBeNative(address _primitive) {
        if (_primitive != D_NATIVE_PRIMITIVE) {
            revert PoolIsNative();
        }
        _;
    }

    modifier _verifyNativeCommit(address _from, uint256 _amnt) {
        if (msg.value < _amnt) {
            revert InvalidCommitAmnt(msg.value, _amnt);
        }
        _;
    }

    modifier _verifyNativeRelease(address _from, uint256 _amnt) {
        if (address(this).balance < _amnt) {
            revert InvalidReleaseAmnt(address(this).balance, _amnt);
        }
        _;
    }

    function nativeCommit(address _from, uint256 _amnt, address _primitive)
        internal
        MustBeNative(_primitive)
        _verifyNativeCommit(_from, _amnt)
    {}

    function nativeRelease(address _to, uint256 _amnt, address _primitive)
        internal
        MustBeNative(_primitive)
        _verifyNativeRelease(_to, _amnt)
    {
        /// @solidity memory-safe-assembly
        assembly {
            if iszero(call(gas(), _to, _amnt, codesize(), 0x00, codesize(), 0x00)) {
                mstore(0x00, 0xb12d13eb)
                revert(0x1c, 0x04)
            }
        }
    }
}
