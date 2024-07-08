// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {IPrivacyPool} from "./interfaces/IPrivacyPool.sol";
import {Verifier} from "./verifier/Verifier.sol";

import "./Constants.sol";

/**
 *
 *
 *     Privacy Pool V1.0 is a protocol designed for confidential data operations with the EVM.
 *     V1.0 operates on 252-bit polymorphic field-elements (fE) that can encode various data types
 *     (i.e.data hash, encoded secret, a storage pointer) and are preserved as an encrypted cipher.
 *
 *     Computations over encrypted fEs are modelled as zero-knowledge arithmetic circuits to enable
 *     privacy-preserving fE operations. V1.0 integrates 1 main circuit which
 *
 *
 */

/// @title PrivacyPool pools contract.
contract PrivacyPool is IPrivacyPool, Verifier {
    /// @dev fieldInterpreter contract is responsible for interpreting
    /// and managing the actual values represented by the field elements.
    /// By default it is set to the base field interpreter address
    /// which appoints the chain's native gas token to be the
    /// field interpreter. A pool with this default configuration is
    /// considered operating with a simple field.
    /// Otherwise if the pool is required to interact with an external contract
    /// to interpret field elements, then the pool is considered to be
    /// operating with a complex field.
    address public immutable fieldInterpreter;

    /**
     * @dev The constructor for the Privacy Pool Contract
     * @param _fieldInterpreter address
     * @param _groth16Verifier the address of GROTH16 SNARK verifier
     */
    constructor(address _fieldInterpreter, address _groth16Verifier) Verifier(_groth16Verifier) {
        // ensure _primitive address is not zero address
        if (_fieldInterpreter == address(0)) {
            revert InvalidFieldInterpreter();
        }
        fieldInterpreter = _fieldInterpreter;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////////////////*/

    modifier StateIsUpdated(Request calldata _r, GROTH16Proof calldata _proof) {
        _;
        // update state with proof values
        ApplyProofToState(_proof);

        // Emit the record event
        emit Record(_r, GetStateRoot(), GetStateSize());
    }

    modifier FeeIsReleased(Request calldata _r, GROTH16Proof calldata _proof) {
        _;
        /// release the fee to the fee collector
        /// only 1 of the two functions will be executed
        /// depending on the field type (complex / simple)
        _ReleaseSimpleOutput(_r.feeCollector, _r.fee);
        _ReleaseComplexOutput(_r.feeCollector, _r.fee);
    }

    modifier OnlySimpleField() {
        if (!IsComplexField(fieldInterpreter)) {
            _;
            /// execute function body
        }
        /// do nothing
    }

    modifier OnlyComplexField() {
        if (IsComplexField(fieldInterpreter)) {
            _;
            /// execute function body
        }
        /// do nothing
    }

    /*//////////////////////////////////////////////////////////////////////////
                                PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /**
     * Aggregation of all field elements that are members of the pool
     */
    function AggregatedFieldSum() public view returns (uint256 sum) {
        address _fieldInterpreter = fieldInterpreter;
        if (!IsComplexField(fieldInterpreter)) {
            return address(this).balance;
        }
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x14, address())
            mstore(0x00, 0x70a08231000000000000000000000000)
            sum :=
                mul(
                    mload(0x20),
                    and(gt(returndatasize(), 0x1f), staticcall(gas(), _fieldInterpreter, 0x10, 0x24, 0x20, 0x20))
                )
        }
    }

    /**
     * @dev process processes a data commitment request
     * @param _r the actual request to be processed
     * @param _proof: the packed Groth16Proof SNARK proof
     */
    function Process(Request calldata _r, GROTH16Proof calldata _proof)
        public
        payable
        // ensure the request is valid
        IsValidRequest(_r, _proof)
        // ensure the proof is valid
        IsValidProof(_r, _proof)
        // updates the state with the proof values
        StateIsUpdated(_r, _proof)
        /// try to release the fee to the fee collector
        /// if the fee is non-zero
        /// and the fee collector is not the zero address
        FeeIsReleased(_r, _proof)
    {
        /// external IO values are specified within the proof public input signals
        VerifyExternalInput(_r, _proof);
        /// checks for any inputs matching the external IO[0] value
        VerifyExternalOutput(_r, _proof);
        /// checks for any outputs matching the external IO[1] value
    }

    /*//////////////////////////////////////////////////////////////////////////
                                INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /*
     * @dev detects if pool has received an a simple field element from _src
     */

    /// @dev if external Input / externIO[0] > 0
    /// and a non-zero src address was given
    /// then verify that src has transferred the field element to the pool
    /// Consider the external input to be an unencrypted field element
    /// that is required in some computation over encrypted field elements
    function VerifyExternalInput(Request calldata _r, GROTH16Proof calldata _proof)
        internal
        /// Checks for external Input value >0
        /// And non-zero _src address
        InputSrcRequired(_r, _proof)
    {
        uint256 _value = _externalInputValue(_proof);
        /// either-one of the two functions will be executed
        /// depending on the type of fieldInterpreter (native / non-native)
        _DetectSimpleInput(_r.src, _value);
        _DetectComplexInput(_r.src, _value);
    }

    /// @dev if external Output / externIO[1] > 0
    /// and a non-zero sink address was given
    /// then make sure that a field element of the expected value
    /// has been released to the sink address
    /// Consider the external output to be an unencrypted field element
    /// that is the remainder of some computation over encrypted field elements
    function VerifyExternalOutput(Request calldata _r, GROTH16Proof calldata _proof)
        internal
        /// Checks for external Input value >0
        /// And non-zero _src address
        OutputSinkRequired(_r, _proof)
    {
        uint256 _value = _externalOutputValue(_proof);
        /// either-one of the two functions will be executed
        /// depending on the field type (complex / simple)
        _ReleaseSimpleOutput(_r.sink, _value);
        _ReleaseComplexOutput(_r.sink, _value);
    }

    function _DetectSimpleInput(address _src, uint256 _value) internal OnlySimpleField {
        /// Simple field elements are carried in the tx msg value of the transaction
        /// the src address must be the same as the tx msg sender
        if (!(msg.value == _value && msg.sender == _src)) {
            revert MissingExternalInput(msg.value, _value, msg.sender, _src);
        }
    }

    /*
     * @dev release a field element of _value to _sink address
     */
    function _ReleaseSimpleOutput(address _sink, uint256 _value) internal OnlySimpleField {
        uint256 sum = AggregatedFieldSum();
        if (sum < _value) {
            revert OutputWillOverdraw(sum, _value);
        }
        /// @solidity memory-safe-assembly
        assembly {
            if iszero(call(gas(), _sink, _value, codesize(), 0x00, codesize(), 0x00)) {
                mstore(0x00, 0xb12d13eb)
                revert(0x1c, 0x04)
            }
        }
    }

    /*
        * @dev ennsures that pool has received an a copmlex field element 
        * of some _value from _src
        * will need to invoke the fieldInterpreter 
        * contract to initiate the transfer of the field element
        * from _src to the pool
    */
    function _DetectComplexInput(address _src, uint256 _value) internal OnlyComplexField {
        uint256 _sum = AggregatedFieldSum();
        address _fieldInterpreter = fieldInterpreter;
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(0x60, _value)
            mstore(0x40, address())
            mstore(0x2c, shl(96, _src))
            mstore(0x0c, 0x23b872dd000000000000000000000000)
            if iszero(
                and(
                    or(eq(mload(0x00), 1), iszero(returndatasize())),
                    call(gas(), _fieldInterpreter, 0, 0x1c, 0x64, 0x00, 0x20)
                )
            ) {
                mstore(0x00, 0x7939f424)
                revert(0x1c, 0x04)
            }
            mstore(0x60, 0)
            mstore(0x40, m)
        }
        uint256 _got = AggregatedFieldSum() - _sum;
        if (_got < _value) {
            revert MissingExternalInput(_got, _value, _src, _src);
        }
    }

    /*
        * @dev release a field element of _value to _sink address
        * will need to invoke the fieldInterpreter 
        * contract to initiate the release of the field element
        * from pool to _sink
    */
    function _ReleaseComplexOutput(address _sink, uint256 _value) internal OnlyComplexField {
        uint256 _sum = AggregatedFieldSum();
        address _fieldInterpreter = fieldInterpreter;
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(0x60, _value)
            mstore(0x40, _sink)
            mstore(0x2c, shl(96, address()))
            mstore(0x0c, 0x23b872dd000000000000000000000000)
            if iszero(
                and(
                    or(eq(mload(0x00), 1), iszero(returndatasize())),
                    call(gas(), _fieldInterpreter, 0, 0x1c, 0x64, 0x00, 0x20)
                )
            ) {
                mstore(0x00, 0x7939f424)
                revert(0x1c, 0x04)
            }
            mstore(0x60, 0)
            mstore(0x40, m)
        }
        uint256 _released = _sum - AggregatedFieldSum();
        if (_released > _value) {
            revert OutputWillOverdraw(_released, _value);
        }
    }
}
