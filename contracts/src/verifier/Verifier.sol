// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/*  Local Imports */
import "../interfaces/IGroth16Verifier.sol";
import "../interfaces/IPrivacyPool.sol";
import "../interfaces/IVerifier.sol";
import "../state/State.sol";
import "../Constants.sol";

contract Verifier is IVerifier, State {
    /// @dev _groth16_verifier
    /// is the SNARK verifier contract
    IGroth16Verifier immutable groth16_verifier;

    constructor(address _verifier) {
        // ensure verifier address is not zero address
        if (address(_verifier) == address(0)) {
            revert VerifierIsZero();
        }
        groth16_verifier = IGroth16Verifier(_verifier);
    }

    /*//////////////////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////////////////*/

    /**
     * @dev Modifier to ensure incoming requests to privacy pool is valid
     * Requirements:
     * - Fee < Sum of Inputs & Output (IO)
     * - Sink Address is not zero address
     * - FeeCollector is not zero address if Fee > 0
     * @param _r the request
     * @param _proof the proof
     */
    modifier IsValidRequest(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof) {
        _requireValidFees(_r, _proof);
        _requireValidSrcAndSink(_r, _proof);
        _requireValidFeeCollector(_r);
        _;
    }

    /**
     *
     * @dev Modifier to ensure proof associated with request is verified
     * Requirements:
     * - verify that the scope match the pool's scope
     * - Verify that the context is computed correctly
     * - Verify the tree depth & state root matches the state's records
     * - Verify the proof with the verifier contract
     * - Verify that the outputs are valid
     * @param _r the request
     * @param _proof the proof
     */
    modifier IsValidProof(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof) {
        _requireValidScope(_proof);
        _requireValidContext(_r, _proof);
        _requireValidStateRootDepth(_proof);
        _requireVerifiedGroth16Proof(_proof);
        _requireValidOutputs(_proof);
        _;
    }

    /**
     * @dev modifier that only executes the function body when:
     *  Commitment Amount > 0 (or externalIO[0] > 0)
     */
    modifier OnlyCommit(IPrivacyPool.GROTH16Proof calldata _proof) {
        if (_fetchCommitmentAmt(_proof) > 0) {
            /// the functio body should verify if the input value has been committed to the pool
            /// from the src address
            _;
        }
    }

    /**
     * @dev modifier that only executes the function body when:
     *  Sink Amount > 0 (or externalIO[1] > 0)
     */
    modifier OnlySink(IPrivacyPool.GROTH16Proof calldata _proof) {
        if (_fetchSinkAmnt(_proof) > 0) {
            /// the function body should release the output value to the specified sink address
            _;
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function GetChainId() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    function IsNative(address unitRepresentation) public pure returns (bool) {
        return unitRepresentation == D_NATIVE_PRIMITIVE;
    }

    /// @dev scope is the domain identifier
    /// and is embedded in the commitment tuple
    /// to bind the commitment value to the domain
    function Scope() public view returns (uint256) {
        return uint256(
            keccak256(
                abi.encode(
                    GetChainId(),
                    address(this),
                    /// note: these are the params
                    /// for the zk circuit
                    D_MAX_MT_DEPTH,
                    D_CIPHERTEXT_SIZE,
                    D_COMMIT_TUPLE_SIZE,
                    D_MAX_ALLOWED_EXISTING,
                    D_MAX_ALLOWED_NEW
                )
            )
        ) % SNARK_SCALAR_FIELD;
    }

    /// @dev _context is the hash of the request data
    /// used as an input signal to the zk circuit
    /// to ensure that any tampering of the request
    /// after proof-generation will invalidate the proof
    function Context(IPrivacyPool.Request calldata _r) internal view returns (uint256) {
        return uint256(keccak256(abi.encode(_r.src, _r.sink, _r.feeCollector, _r.fee, Scope()))) % SNARK_SCALAR_FIELD;
    }

    /*//////////////////////////////////////////////////////////////////////////
                                INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _requireValidFees(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        internal
        pure
    {
        /// fee can't be greater than the total sum of IO values
        uint256 SumOfIO = _proof._pubSignals[D_ExternIO_StartIdx] + _proof._pubSignals[D_ExternIO_StartIdx + 1];
        if (_r.fee >= SumOfIO) {
            revert FeeTooHigh(_r.fee, SumOfIO);
        }
    }

    function _fetchCommitmentAmt(IPrivacyPool.GROTH16Proof calldata _proof) internal pure returns (uint256) {
        return _proof._pubSignals[D_ExternIO_StartIdx];
    }

    function _fetchSinkAmnt(IPrivacyPool.GROTH16Proof calldata _proof) internal pure returns (uint256) {
        return _proof._pubSignals[D_ExternIO_StartIdx + 1];
    }

    function _requireValidSrcAndSink(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        internal
        pure
    {
        if (_fetchCommitmentAmt(_proof) > 0 && _r.src == address(0)) {
            revert SrcIsZero();
        }
        if (_fetchSinkAmnt(_proof) > 0 && _r.sink == address(0)) {
            revert SinkIsZero();
        }
    }

    function _requireValidFeeCollector(IPrivacyPool.Request calldata _r) internal pure {
        if (_r.fee > 0 && _r.feeCollector == address(0)) {
            revert FeeCollectorIsZero();
        }
    }

    /// @dev _requireValidScope: verifies that the scope
    /// used as the public input to the circuit
    /// matches with the scope for this pool
    function _requireValidScope(IPrivacyPool.GROTH16Proof calldata _proof) internal view {
        /// extract scope value from the _proof public inputs
        uint256 _scopeSignal = _proof._pubSignals[D_Scope_StartIdx];
        /// get the pool's scope value
        uint256 _actualScope = Scope();
        if (_scopeSignal != _actualScope) {
            revert InvalidScope(_scopeSignal, _actualScope);
        }
    }

    function _requireValidContext(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        internal
        view
    {
        uint256 _contextSignal = _proof._pubSignals[D_Context_StartIdx];
        uint256 _actualContext = Context(_r);
        if (_contextSignal != _actualContext) {
            revert InvalidContext(_contextSignal);
        }
    }

    /// @dev _requireValidStateRootDepth verifies that the
    /// state Root & depth used as input signals to the circuit
    /// are known by the state
    function _requireValidStateRootDepth(IPrivacyPool.GROTH16Proof calldata _proof) internal view returns (bool ok) {
        /// extract the stateRoot & depth from the _proof public inputs
        uint256 _existingStateRoot_signal = _proof._pubSignals[D_ExistingStateRoot_StartIdx];
        uint256 _actualTreeDepth_signal = _proof._pubSignals[D_ActualTreeDepth_StartIdx];

        ///  if 0 was set for both root & depht but the state is not empty
        /// revert to force users to re-generate the proof based on the latest state
        if (_existingStateRoot_signal == 0 && _actualTreeDepth_signal == 0 && GetStateSize() == 0) {
            return true;
        }
        /// otherwise verify that the stateRoot & depth is a known checkpoint
        (bool found, uint256 _actualDepth) = FetchCheckpoint(_existingStateRoot_signal);
        if (!found) {
            revert InvalidStateTreeDepth(_existingStateRoot_signal, _actualTreeDepth_signal, _actualDepth);
        }

        if (found && _actualDepth != _actualTreeDepth_signal) {
            revert InvalidStateTreeDepth(_existingStateRoot_signal, _actualTreeDepth_signal, _actualDepth);
        }
    }

    function _requireVerifiedGroth16Proof(IPrivacyPool.GROTH16Proof calldata _proof) internal view {
        // verify proof
        if (!groth16_verifier.verifyProof(_proof._pA, _proof._pB, _proof._pC, _proof._pubSignals)) {
            revert ProofVerificationFailed();
        }
    }

    /**
     * @dev Ensure that the public output signals are valid:
     * * Only the first D_MAX_ALLOWED_EXISTING null roots should be non-zero
     * * Only the first D_MAX_ALLOWED_EXISTING commitment roots should be zero
     * * Only the first D_MAX_ALLOWED_EXISTING commitment hashes should be zero
     * * Only the Last D_MAX_ALLOWED_NEW null roots should be zero
     * * Only the Last D_MAX_ALLOWED_NEW commitment roots should be non-zero
     * * Only the Last D_MAX_ALLOWED_NEW commitment hashes should be non-zero
     * @param _proof the proof to be validated
     */
    function _requireValidOutputs(IPrivacyPool.GROTH16Proof calldata _proof) internal pure {
        for (uint8 i = 0; i < D_MAX_ALLOWED_EXISTING; i++) {
            if (_proof._pubSignals[D_NewNullRoot_StartIdx + i] == 0) {
                revert InvalidProofOutput();
            }
            if (_proof._pubSignals[D_NewCommitmentRoot_StartIdx + i] != 0) {
                revert InvalidProofOutput();
            }
            if (_proof._pubSignals[D_NewCommitmentHash_StartIdx + i] != 0) {
                revert InvalidProofOutput();
            }
        }

        for (uint8 i = D_MAX_ALLOWED_EXISTING; i < D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW; i++) {
            if (_proof._pubSignals[D_NewNullRoot_StartIdx + i] != 0) {
                revert InvalidProofOutput();
            }
            if (_proof._pubSignals[D_NewCommitmentRoot_StartIdx + i] == 0) {
                revert InvalidProofOutput();
            }
            if (_proof._pubSignals[D_NewCommitmentHash_StartIdx + i] == 0) {
                revert InvalidProofOutput();
            }
        }
    }
}
