// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {D_CIPHERTEXT_SIZE, D_KEY_SIZE} from "../Constants.sol";
import {IPrivacyPool} from "../interfaces/IPrivacyPool.sol";

/// @title State contract interface.
interface IState {
    error ElementExistsInDataSet(uint256 element);
    error DataSetOutOfSync(uint256 dataset_len, uint256 state_len);

    function SeekDataSetPointer(uint256 data) external view returns (bool ok, uint256 idx);
    function SeekDataSetPointers(uint256[] memory data)
        external
        view
        returns (bool[] memory ok, uint256[] memory idx);

    function GrabDataAtPointer(uint256 idx) external view returns (uint256 element);
    function GrabDataWithinRange(uint256 from, uint256 to) external view returns (uint256[] memory elements);

    function PackCipher(
        uint256[D_CIPHERTEXT_SIZE] memory cipherText,
        uint256[D_KEY_SIZE] memory saltPubkey,
        uint256 commitmentHash
    ) external pure returns (uint256[D_CIPHERTEXT_SIZE + D_KEY_SIZE + 1] memory cipher);

    function UnpackCipherAtPtr(uint256 index)
        external
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        );
    function UnpackCiphersWithinRange(uint256 from, uint256 to)
        external
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE][] memory cipherTexts,
            uint256[D_KEY_SIZE][] memory saltPubkeys,
            uint256[] memory commitmentHashes
        );
    function FetchCipherComponentsFromProof(IPrivacyPool.GROTH16Proof calldata _proof, uint256 idx)
        external
        pure
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        );
    function FetchTreeDepthForRoot(uint256 stateRoot) external view returns (uint256 depth);
}
