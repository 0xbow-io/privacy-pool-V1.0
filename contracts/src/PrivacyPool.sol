// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {InternalLeanIMT, LeanIMTData} from "./library/InternalLeanIMT.sol";
import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {IPoseidonT3} from "./interfaces/IPoseidonT3.sol";
import {MAX_FEE, NATIVE_REPRESENTATION, SNARK_SCALAR_FIELD} from "./library/Constants.sol";
import {IPrivacyPool} from "./interfaces/IPrivacyPool.sol";
import {DataDecoder} from "./library/DataDecoder.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PrivacyPool pools contract.
abstract contract PrivacyPool is IPrivacyPool, ReentrancyGuard {
    using InternalLeanIMT for LeanIMTData;
    using DataDecoder for uint256;

    /// @dev merkleTree that stores the commitments
    /// The tree is an Incremental Merkle Tree
    /// which a merkle tree with dynamic depth.
    LeanIMTData commitmentTree;

    /// @dev verifier is the SNARK verifier for the pool
    IGroth16Verifier verifier;
    /// @dev refer to snark verifier circuit
    uint256 public constant pubSignalsLen = 8;

    /// @dev maxCommitVal is the maximum value that can be committed to the pool at once
    uint256 public immutable maxCommitVal;

    /// @dev valueUnitRepresentative is the address of the external contract
    /// that represents the unit of value that is being committed to the pool
    /// must support transferFrom() & balanceOf() function
    /// if set to 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, Native ETH is used as the unit of value
    address public immutable valueUnitRepresentative;

    /// @dev nullifiers are the hash of the commitments that are known
    mapping(uint256 => bool) public knownNullifiers;

    /**
     * @dev The constructor
     * @param _groth16Verifier the address of GROTH16 SNARK verifier
     * @param _treeHasher address of poseidon hasher contract for the commitment tree
     * @param _maxCommitVal maximum value that can be committed to the pool at once
     * @param _valueUnitRepresentative address of the external contract that represents the unit of value
     */
    constructor(
        address _groth16Verifier,
        address _treeHasher,
        uint256 _maxCommitVal,
        address _valueUnitRepresentative
    ) {
        if (_verifier == address(0)) {
            revert IsZeroAddress();
        }

        verifier = IVerifier(verifier);

        if (_hasher == address(0)) {
            revert IsZeroAddress();
        }

        commitmentTree.PoseidonT3 = IPoseidonT3(_treeHasher);

        if (_valueUnitRepresentative == address(0)) {
            revert IsZeroAddress();
        }

        valueUnitRepresentative = _valueUnitRepresentative;
        if (_maxCommitVal == 0) {
            revert ValMismatch(_maxCommitVal, 0);
        }
        maxCommitVal = _maxCommitVal;
    }

    /*
        Data should be streamed in the following order & type: 
            *** Proof carrying data:
            *** Proof Inputs (nIns + nIns + 2) * uint256: 
            --> proofSize: uint8
            --> proof: uint256[proofSize]
            --> nullifiers: uint256[nIns]
            --> commitments: uint256[nIns]

            *** Signal data: 
            
            --> units: int256 (32 bytes)
            --> fee: uint256 (32 bytes)
            --> account: Address (20 bytes)
            --> feecollector: Address (20 bytes)

            *** Supplementary Data:   

            *** encrypted secrets (nOut secrets)
            --> secret ==> bytes   

            --> associationProofURI ==> bytes 
    */

    function process(bytes memory data) public payable {
        uint256 decoder = DataDecoder.createDecoderStream(data);
        while (decoder.isNotEmpty()) {
            // read the proof size
            uint8 proofSize = decoder.readUint8();
            // read the proof
            uint256[] memory proof = new uint256[](proofSize);
            for (uint256 i = 0; i < proofSize; i++) {
                proof[i] = decoder.readUint();
            }

            uint256[] memory pubInputs = new uint256[](nIns * 2 + 2);

            // read the nullifiers
            uint256[] memory inputNullifiers = new uint256[](nIns);
            for (uint256 i = 0; i < nIns; i++) {
                pubInputs[i] = decoder.readUint();
                inputNullifiers[i] = pubInputs[i];
                // check if nullifier is known
                // revert if known
                if (knownNullifiers[inputNullifiers[i]]) {
                    revert NullifierIsKnown(inputNullifiers[i]);
                }
                emit NewNullifier(inputNullifiers[i]);
            }
            // read output commitments
            uint256[] memory outputCommitments = new uint256[](nIns);
            for (uint256 i = 0; i < nIns; i++) {
                outputCommitments[i] = decoder.readUint();
                pubInputs[nIns + i] = outputCommitments[i];
            }

            // Get supplementary data
            int256 units = int256(decoder.readUint());
            uint256 fee = decoder.readUint();
            address account = decoder.readAddress();
            address feeCollector = decoder.readAddress();

            pubInputs[nIns + nIns + 1] = calcPublicVal(units, fee);
            pubInputs[nIns + nIns + 2] = calcSignalHash(units, fee, account);

            // verify proof
            if (!verifier.verifyProof(proof, pubInputs, nIns + nIns + 2)) {
                revert ProofVerificationFailed();
            }

            _commit(account, units, fee, feeCollector);

            // commit output commitments to commitmentTree
            uint256 currentIndex = commitmentTree.size;
            commitmentTree._insertMany(outputCommitments);

            // announce the commitments
            for (uint256 i = 0; i < nIns; i++) {
                // read encrypted output
                bytes memory encryptedOutput = decoder.readBytes();
                emit NewCommitment(outputCommitments[i], currentIndex + i, encryptedOutput);
            }

            _release(account, units, fee, feeCollector, inputNullifiers, decoder);

            // For ASP Ingestion
            emit NewTxRecord(inputNullifiers, outputCommitments, pubInputs[nIns + nIns + 1], currentIndex);
        }
    }

    function abs(int256 x) private pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    // publicVal is the value that is publicly released
    // it is used as a public input to the snark verifier
    function calcPublicVal(int256 units, uint256 fee) public pure returns (uint256) {
        int256 publicVal = units - int256(fee);
        return (publicVal >= 0) ? uint256(publicVal) : SNARK_SCALAR_FIELD - uint256(-publicVal);
    }

    // signal hash is a keccak256 hash of the signal data (units, fee, account, pool address)
    // this is used as a public input to the snark verifier
    // ensures that the signal data has not been tampered with
    function calcSignalHash(int256 units, uint256 fee, address account) public view returns (uint256) {
        return uint256(keccak256(abi.encode(address(this), units, fee, account)));
    }

    function _verifyFeeAndUnits(int256 units, uint256 fee) internal view returns (bool) {
        // fee must be < max fee
        // fee must be < units committed or released
        if (fee > MAX_FEE || abs(units) < fee) {
            revert InvalidFee(fee, uint256(units));
        }
        // check units value against maximum commitment allowed (- if release, + if commit)
        if (abs(units) > maxCommitVal && units > 0) {
            revert ExceedsMax(uint256(units), maxCommitVal);
        }
        return true;
    }

    function _commit(address account, int256 units, uint256 fee, address feeCollector) internal {
        // commit when units is +ve
        if (units > 0 && _verifyFeeAndUnits(units, fee)) {
            uint256 unitsCommitted = 0;

            if (valueUnitRepresentative != NATIVE_REPRESENTATION) {
                if (msg.value > 0) {
                    revert NoETHAllowed();
                }

                uint256 _before = _sumViaRepresentative();

                // commitment of value from account
                commitFromViaRepresentative(account, uint256(units));

                // Check if the value sent with the commitment
                // matches the specified units value
                unitsCommitted = _sumViaRepresentative() - _before;
            } else {
                unitsCommitted = msg.value - fee;
            }
            // check units received from the commitment
            if (uint256(units) != unitsCommitted) {
                revert InvalidUnits(unitsCommitted, uint256(units));
            }

            // Send the specified fee to the feeCollector
            if (feeCollector != address(0) && fee > 0) {
                if (valueUnitRepresentative != NATIVE_REPRESENTATION) {
                    commitFromViaRepresentative(feeCollector, fee);
                } else {
                    (bool sent,) = feeCollector.call{value: fee}("");
                    if (!sent) {
                        revert FeeFailed();
                    }
                }
            }
        }
    }

    function _release(
        address account,
        int256 units,
        uint256 fee,
        address feeCollector,
        uint256[] memory inputNullifiers,
        uint256 decoder
    ) internal {
        // commit when units is +ve
        if (units > 0 && _verifyFeeAndUnits(units, fee)) {
            // read associationProofHash
            bytes memory associationProofHash = decoder.readBytes();

            // release units back to account
            if (valueUnitRepresentative != NATIVE_REPRESENTATION) {
                releaseToViaRepresentative(account, uint256(units));
            } else {
                (bool sent,) = account.call{value: uint256(units)}("");
                if (!sent) {
                    revert FeeFailed();
                }
            }
            // Send the specified fee to the feeCollector
            // Send the specified fee to the feeCollector
            if (feeCollector != address(0) && fee > 0) {
                if (valueUnitRepresentative != NATIVE_REPRESENTATION) {
                    commitFromViaRepresentative(feeCollector, fee);
                } else {
                    (bool sent,) = feeCollector.call{value: fee}("");
                    if (!sent) {
                        revert FeeFailed();
                    }
                }
            }
            emit NewRelease(account, feeCollector, uint256(units), associationProofHash, inputNullifiers);
        }
    }

    // commiting Users unit values from representative to pool
    function commitFromViaRepresentative(address from, uint256 units) internal {
        address extern = valueUnitRepresentative;
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(0x60, units) // units to be committed
            mstore(0x40, address()) // to pool
            mstore(0x2c, shl(96, from)) // from
            mstore(0x0c, 0x23b872dd000000000000000000000000)
            if iszero(
                and(or(eq(mload(0x00), 1), iszero(returndatasize())), call(gas(), extern, 0, 0x1c, 0x64, 0x00, 0x20))
            ) {
                mstore(0x00, 0x7939f424)
                revert(0x1c, 0x04)
            }
            mstore(0x60, 0)
            mstore(0x40, m)
        }
    }

    // releasing committed unit values via representative
    function releaseToViaRepresentative(address to, uint256 units) internal {
        address extern = valueUnitRepresentative;
        /// @solidity memory-safe-assembly
        assembly {
            let m := mload(0x40)
            mstore(0x60, units) // units to be released
            mstore(0x40, to) // to
            mstore(0x2c, shl(96, address())) // from pool
            mstore(0x0c, 0x23b872dd000000000000000000000000)
            if iszero(
                and(or(eq(mload(0x00), 1), iszero(returndatasize())), call(gas(), extern, 0, 0x1c, 0x64, 0x00, 0x20))
            ) {
                mstore(0x00, 0x7939f424)
                revert(0x1c, 0x04)
            }
            mstore(0x60, 0)
            mstore(0x40, m)
        }
    }

    // total sum of all commited values
    // if values were commited via a Representative
    function _sumViaRepresentative() internal view returns (uint256 sum) {
        address extern = valueUnitRepresentative;
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x14, address())
            mstore(0x00, 0x70a08231000000000000000000000000)
            sum := mul(mload(0x20), and(gt(returndatasize(), 0x1f), staticcall(gas(), extern, 0x10, 0x24, 0x20, 0x20)))
        }
    }
}
