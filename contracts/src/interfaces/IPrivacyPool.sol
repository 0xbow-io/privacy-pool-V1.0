/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title PrivacyPool contract interface.
interface IPrivacyPool {
    error InvalidFieldInterpreter();
    error MissingExternalInput(uint256 got, uint256 expeted, address actualSrc, address expectedSrc);
    error OutputWillOverdraw(uint256 aggregatedFieldSum, uint256 output);

    /// @dev struct to hold the
    /// information for a data
    /// commitment request
    struct Request {
        address src; // Source address for the external data input
        address sink; // Sink address for the external data ouptut
        address feeCollector; // address at which fee is collected
        uint256 fee; // Fee amount
    }

    /// @dev  GROTH16Proof is the struct that contains the zk proof
    /// _pubSignals contains the public input & output signals:
    ///
    /// *** Public Input signals to the circuit ***
    /// "scope" --> to be matched with pool's scope
    /// "actualTreeDepth" --> to be verified with pool's state
    /// "context" --> to be computed and verified against
    /// "externIO" --> specifies the amount required to be comitted or sinked
    /// "existingStateRoot" --> to be verified against pool's state
    /// "newSaltPublicKey" --> to be stored into pool's state
    /// "newCiphertext" --> to be stored into the pool's state
    ///
    /// *** Public Outputs of the circuit ***
    /// "newNullRoot", --> to be verified and stored into the pool's state
    /// "newCommitmentRoot", --> to be verified and stored into the pool's state
    /// "newCommitmentHash" --> to be verified and stored into the pool's state
    ///
    /// Refer to the default index mapping in constants.sol
    /// to fetch the values from the _pubSignals array
    ///
    struct GROTH16Proof {
        uint256[2] _pA;
        uint256[2][2] _pB;
        uint256[2] _pC;
        uint256[36] _pubSignals;
    }

    /// @dev This event is emitted at the end of the process function execution.
    /// _r is carried into the record in case the Pool proces() function
    /// was invoked as an internal call, in which
    /// then indexers would have to do a all trace to
    /// get the relevant request details
    event Record(Request _r, uint256 stateRoot, uint256 dataSetSize);
}
