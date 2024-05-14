// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {InternalLeanIMT, LeanIMTData} from "./library/InternalLeanIMT.sol";
import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {IPoseidonT3} from "./interfaces/IPoseidonT3.sol";
import {MAX_FEE, NATIVE_REPRESENTATION, SNARK_SCALAR_FIELD} from "./library/Constants.sol";
import {IPrivacyPool} from "./interfaces/IPrivacyPool.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PrivacyPool pools contract.
contract PrivacyPool is IPrivacyPool, ReentrancyGuard {
    using InternalLeanIMT for LeanIMTData;

    /// @dev merkleTree that stores the commitments
    /// The tree is an Incremental Merkle Tree
    /// which a merkle tree with dynamic depth.
    LeanIMTData commitmentTree;

    /// @dev verifier is the SNARK verifier for the pool
    uint256 constant nIns = 2;
    uint256 constant nOuts = 2;
    IGroth16Verifier immutable verifier;

    /// @dev maxCommitVal is the maximum value that can be committed to the pool at once
    uint256 public immutable maxCommitVal;

    /// @dev valueUnitRepresentative is the address of the external contract
    /// that represents the unit of value that is being committed to the pool
    /// must support transferFrom() & balanceOf() function
    /// if set to 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, Native ETH is used as the unit of value
    address public immutable valueUnitRepresentative;

    /// @dev nullifiers are the hash of the commitments that are known
    mapping(uint256 => bool) public knownNullifiers;

    /// @dev used tokeep track of known merkle roots for each commitment inserts
    mapping(uint256 => bool) KnownRoots;

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
        if (_groth16Verifier == address(0)) {
            revert IsZeroAddress();
        }

        verifier = IGroth16Verifier(_groth16Verifier);

        if (_treeHasher == address(0)) {
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

    function maxCommitValue() public view override returns (uint256) {
        return maxCommitVal;
    }

    function latestRoot() public view returns (uint256) {
        return commitmentTree.sideNodes[commitmentTree.depth];
    }

    function size() public view returns (uint256) {
        return commitmentTree.size;
    }

    function knownRoot(uint256 root) public view returns (bool) {
        return KnownRoots[root];
    }

    function IsKnownNullifier(uint256 nullifier) public view returns (bool) {
        return knownNullifiers[nullifier];
    }

    function currentDepth() public view returns (uint256) {
        return commitmentTree.depth;
    }

    function process(
        signal calldata s,
        supplement calldata sp,
        uint256[2] memory _pA,
        uint256[2][2] memory _pB,
        uint256[2] memory _pC,
        uint256[8] memory _pubSignals
    ) public payable {
        // check nullifiers against known nullifiers
        for (uint256 i = 0; i < nIns; i++) {
            // check if nullifier is known
            // revert if known
            if (knownNullifiers[_pubSignals[2 + i]]) {
                revert NullifierIsKnown(_pubSignals[2 + i]);
            }
            emit NewNullifier(_pubSignals[2 + i]);
        }

        // check merkle root against history
        if (!KnownRoots[_pubSignals[0]]) {
            revert InvalidMerkleRoot(_pubSignals[0]);
        }

        _pubSignals[1] = calcPublicVal(s.units, s.fee);
        _pubSignals[2] = calcSignalHash(s.units, s.fee, s.account, s.feeCollector);

        // verify proof
        if (!verifier.verifyProof(_pA, _pB, _pC, _pubSignals)) {
            revert ProofVerificationFailed();
        }

        // commit output commitments to commitmentTree
        for (uint256 i = 0; i < nOuts; i++) {
            // insert commitment
            uint256 newRoot = commitmentTree._insert(_pubSignals[4 + i]);
            // update known roots
            KnownRoots[newRoot] = true;
            // emit commitment
            emit NewCommitment(_pubSignals[4 + i], commitmentTree.size - 1, sp.encryptedOutputs);
        }

        // finalize any commitments
        _commit(s.account, s.units, s.fee, s.feeCollector);

        // finalize any releases
        _release(s.account, s.units, s.fee, s.feeCollector, sp.associationProofURI, _pubSignals[4], _pubSignals[5]);

        emit NewTxRecord(
            _pubSignals[4], _pubSignals[5], _pubSignals[6], _pubSignals[7], _pubSignals[1], commitmentTree.size - 2
        );
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

    // signal hash is a keccak256 hash of the signal data (pool address, units, fee, account, feeCollector)
    // this is used as a public input to the snark verifier
    // ensures that the signal data has not been tampered with
    function calcSignalHash(int256 units, uint256 fee, address account, address feeCollector)
        public
        view
        returns (uint256)
    {
        return uint256(keccak256(abi.encode(address(this), units, fee, account, feeCollector)));
    }

    function _verifyFeeAndUnits(int256 units, uint256 fee) internal view returns (bool) {
        // fee must be < max fee
        // fee must be < units committed or released
        if (fee > MAX_FEE || abs(units) < fee) {
            revert InvalidFee(fee, uint256(units));
        }
        // check units value against maximum commitment allowed (- if release, + if commit)
        if (abs(units) > maxCommitVal) {
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
        string calldata associationProofURI,
        uint256 inputNullifier1,
        uint256 inputNullifier2
    ) internal {
        // commit when units is +ve
        if (units > 0 && _verifyFeeAndUnits(units, fee)) {
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
            emit NewRelease(
                account, feeCollector, uint256(units), associationProofURI, inputNullifier1, inputNullifier2
            );
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
