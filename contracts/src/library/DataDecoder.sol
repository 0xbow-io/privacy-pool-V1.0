// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// library to decode the data input to Privacy Pool
library DataDecoder {
    /**
     * @notice Creates input decoder from input data
     * @param input input data
     */
    function createDecoderStream(bytes memory input) internal pure returns (uint256 out) {
        assembly {
            out := mload(0x40)
            mstore(0x40, add(input, 64))
            mstore(out, input)
            let length := mload(input)
            mstore(add(input, 32), add(input, length))
        }
    }

    /**
     * @notice Checks if input input is not empty
     * @param input input
     */
    function isNotEmpty(uint256 input) internal pure returns (bool) {
        uint256 pos;
        uint256 finish;
        assembly {
            pos := mload(input)
            finish := mload(add(input, 32))
        }
        return pos < finish;
    }

    /**
     * @notice Reads uint8 from the input
     * @param input input
     */
    function readUint8(uint256 input) internal pure returns (uint8 output) {
        assembly {
            let pos := mload(input)
            pos := add(pos, 1)
            output := mload(pos)
            mstore(input, pos)
        }
    }

    /**
     * @notice Reads uint256 from the input
     * @param input input
     */
    function readUint(uint256 input) internal pure returns (uint256 output) {
        assembly {
            let pos := mload(input)
            pos := add(pos, 32)
            output := mload(pos)
            mstore(input, pos)
        }
    }

    /**
     * @notice Reads address from the input
     * @param input input
     */
    function readAddress(uint256 input) internal pure returns (address output) {
        assembly {
            let pos := mload(input)
            pos := add(pos, 20)
            output := mload(pos)
            mstore(input, pos)
        }
    }

    /**
     * @notice Reads bytes from the input
     * @param input input
     */
    function readBytes(uint256 input) internal pure returns (bytes memory output) {
        assembly {
            let pos := mload(input)
            output := add(pos, 32)
            let length := mload(output)
            mstore(input, add(output, length))
        }
    }

    /**
     * @notice Reads int256 from the input
     * @param input input
     */
    function readInt256(uint256 input) internal pure returns (int256 output) {
        assembly {
            let pos := mload(input)
            pos := add(pos, 32)
            output := mload(pos)
            mstore(input, pos)
        }
    }
}
