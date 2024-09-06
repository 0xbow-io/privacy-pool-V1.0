// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {D_CIPHERTEXT_SIZE, D_KEY_SIZE} from "../Constants.sol";
import "./IPrivacyPool.sol";

/// @title State contract interface.
interface IState {
    error NullRootExists(uint256 value);
    error CommitmentRootExists(uint256 value);
    error RootSetOutOfSync(uint256 dataset_len, uint256 state_len);

    function UnpackCipherAtIdx(
        uint256 _index
    )
        external
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        );

    function UnpackCiphersWithinRange(
        uint256 _from,
        uint256 _to
    )
        external
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE][] memory cipherTexts,
            uint256[D_KEY_SIZE][] memory saltPubkeys,
            uint256[] memory commitmentHashes
        );

    function SeekRootIdx(
        uint256 _root
    ) external view returns (bool ok, uint256 idx);

    function SeekRootIdxs(
        uint256[] memory _roots
    ) external view returns (bool[] memory ok, uint256[] memory idx);

    function FetchRoot(uint256 idx) external view returns (uint256 element);

    function FetchRoots(
        uint256 _from,
        uint256 _to
    ) external view returns (uint256[] memory roots);

    function PackCipher(
        uint256[D_CIPHERTEXT_SIZE] memory _cipherText,
        uint256[D_KEY_SIZE] memory _saltPubkey,
        uint256 _commitmentHash
    )
        external
        pure
        returns (uint256[D_CIPHERTEXT_SIZE + D_KEY_SIZE + 1] memory packed);

    function FetchCipherComponentsFromProof(
        IPrivacyPool.GROTH16Proof calldata _proof,
        uint8 _idx
    )
        external
        pure
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        );

    function FetchCheckpointAtRoot(
        uint256 _stateRoot
    ) external view returns (bool found, uint256 depth);

    function GetLastCheckpoint()
        external
        view
        returns (uint256 root, uint256 depth);

    function FetchNullRootFromProof(
        IPrivacyPool.GROTH16Proof calldata _proof,
        uint8 _idx
    ) external pure returns (uint256 nullRoot);

    function FetchCommitmentRootFromProof(
        IPrivacyPool.GROTH16Proof calldata _proof,
        uint8 _idx
    ) external pure returns (uint256 nullRoot);

    function GetStateRoot() external view returns (uint256);

    function GetStateTreeDepth() external view returns (uint256);

    function GetStateSize() external view returns (uint256);
}
