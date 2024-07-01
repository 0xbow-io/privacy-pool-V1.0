// SPDX-License-Identifier: MITs
pragma solidity ^0.8.4;

import {IState} from "../interfaces/IState.sol";
import {PrivacyPoolState} from "./lib/PrivacyPoolState.sol";

contract State is IState {
    using PrivacyPoolState for PrivacyPoolState.PrivacyPoolStateData;

    PrivacyPoolState.PrivacyPoolStateData private _state;

    function hasNullifier(uint256 nullifier) external view returns (bool, uint256) {}
    function hasCommitment(uint256 nullifier) external view returns (bool, uint256) {}
}
