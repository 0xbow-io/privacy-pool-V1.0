// SPDX-License-Identifier: MITs
pragma solidity ^0.8.4;

import {IState} from "../interfaces/IState.sol";
import {PrivacyPoolState} from "./lib/PrivacyPoolState.sol";

contract State is IState {
    using PrivacyPoolState for PrivacyPoolState.PrivacyPoolStateData;

    PrivacyPoolState.PrivacyPoolStateData private _state;

    function validStateRoot(uint256 nullifier) external view returns (bool, uint256) {}
    function hasNullRoot(uint256 nullifier) external view returns (bool, uint256) {}
    function hasCommitRoot(uint256 nullifier) external view returns (bool, uint256) {}
}
