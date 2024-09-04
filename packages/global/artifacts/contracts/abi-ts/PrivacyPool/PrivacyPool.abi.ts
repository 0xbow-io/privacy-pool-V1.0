
export interface IPrivacyPool_Contract {
  "abi": [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_maxUnitsAllowed",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_unitRepresentation",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_verifier",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "IsNative",
    "inputs": [
      {
        "name": "unitRepresentation",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_computePublicVal",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_computeScope",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "_getChainId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "_requireValidAccount",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_requireValidFeeCollector",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_requireValidFees",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_requireValidUnits",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "computePublicVal",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "computeScope",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "depth",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasCommitment",
    "inputs": [
      {
        "name": "commitment",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isMerkleRootKnown",
    "inputs": [
      {
        "name": "root",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isNullifierKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "knownNullifiers",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "knownRoots",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "latestMerkleRoot",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxUnitsAllowed",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "merkleTreeDepth",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "merkleTreeSize",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "process",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "name": "_s",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Supplement",
        "components": [
          {
            "name": "ciphertexts",
            "type": "uint256[4][2]",
            "internalType": "uint256[4][2]"
          },
          {
            "name": "associationProofURI",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "_pA",
        "type": "uint256[2]",
        "internalType": "uint256[2]"
      },
      {
        "name": "_pB",
        "type": "uint256[2][2]",
        "internalType": "uint256[2][2]"
      },
      {
        "name": "_pC",
        "type": "uint256[2]",
        "internalType": "uint256[2]"
      },
      {
        "name": "_pubSignals",
        "type": "uint256[9]",
        "internalType": "uint256[9]"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "root",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "size",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "unitRepresentation",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Record",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "name": "_s",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct IPrivacyPool.Supplement",
        "components": [
          {
            "name": "ciphertexts",
            "type": "uint256[4][2]",
            "internalType": "uint256[4][2]"
          },
          {
            "name": "associationProofURI",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "_pubSignals",
        "type": "uint256[9]",
        "indexed": false,
        "internalType": "uint256[9]"
      },
      {
        "name": "MerkleTreeRoot",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "MerkleTreeDepth",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "MerkleTreeSize",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AccountZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CommitFlagMismatch",
    "inputs": [
      {
        "name": "got",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "CommitmentIsNotKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "FeeCollectorZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FeeTooHigh",
    "inputs": [
      {
        "name": "fee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "units",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidCommitAmnt",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidMerkleRoot",
    "inputs": [
      {
        "name": "root",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidMerkleTreeDepth",
    "inputs": [
      {
        "name": "depth",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidPublicValue",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidReleaseAmnt",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidRepresentation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidScope",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "LeafAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LeafCannotBeZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LeafGreaterThanSnarkScalarField",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MaxUnitsAllowedZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotCommit",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRelease",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NullifierIsKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "NullifierIsNotKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "PoolIsNative",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PoolIsNonNative",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProofVerificationFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnitsTooHigh",
    "inputs": [
      {
        "name": "units",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "MaxAllowed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnitsZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VerifierZero",
    "inputs": []
  }
]
}

export const PrivacyPoolABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_maxUnitsAllowed",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_unitRepresentation",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_verifier",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "IsNative",
    "inputs": [
      {
        "name": "unitRepresentation",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_computePublicVal",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_computeScope",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "_getChainId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "_requireValidAccount",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_requireValidFeeCollector",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_requireValidFees",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "_requireValidUnits",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "computePublicVal",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "computeScope",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "depth",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasCommitment",
    "inputs": [
      {
        "name": "commitment",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isMerkleRootKnown",
    "inputs": [
      {
        "name": "root",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isNullifierKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "knownNullifiers",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "knownRoots",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "latestMerkleRoot",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxUnitsAllowed",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "merkleTreeDepth",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "merkleTreeSize",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "process",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "name": "_s",
        "type": "tuple",
        "internalType": "struct IPrivacyPool.Supplement",
        "components": [
          {
            "name": "ciphertexts",
            "type": "uint256[4][2]",
            "internalType": "uint256[4][2]"
          },
          {
            "name": "associationProofURI",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "_pA",
        "type": "uint256[2]",
        "internalType": "uint256[2]"
      },
      {
        "name": "_pB",
        "type": "uint256[2][2]",
        "internalType": "uint256[2][2]"
      },
      {
        "name": "_pC",
        "type": "uint256[2]",
        "internalType": "uint256[2]"
      },
      {
        "name": "_pubSignals",
        "type": "uint256[9]",
        "internalType": "uint256[9]"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "root",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "size",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "unitRepresentation",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Record",
    "inputs": [
      {
        "name": "_r",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct IPrivacyPool.Request",
        "components": [
          {
            "name": "isCommitFlag",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "units",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "account",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "feeCollector",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "name": "_s",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct IPrivacyPool.Supplement",
        "components": [
          {
            "name": "ciphertexts",
            "type": "uint256[4][2]",
            "internalType": "uint256[4][2]"
          },
          {
            "name": "associationProofURI",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "_pubSignals",
        "type": "uint256[9]",
        "indexed": false,
        "internalType": "uint256[9]"
      },
      {
        "name": "MerkleTreeRoot",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "MerkleTreeDepth",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "MerkleTreeSize",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AccountZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CommitFlagMismatch",
    "inputs": [
      {
        "name": "got",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "CommitmentIsNotKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "FeeCollectorZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FeeTooHigh",
    "inputs": [
      {
        "name": "fee",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "units",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidCommitAmnt",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidMerkleRoot",
    "inputs": [
      {
        "name": "root",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidMerkleTreeDepth",
    "inputs": [
      {
        "name": "depth",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidPublicValue",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidReleaseAmnt",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidRepresentation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidScope",
    "inputs": [
      {
        "name": "got",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expected",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "LeafAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LeafCannotBeZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LeafGreaterThanSnarkScalarField",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MaxUnitsAllowedZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotCommit",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRelease",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NullifierIsKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "NullifierIsNotKnown",
    "inputs": [
      {
        "name": "nullifier",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "PoolIsNative",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PoolIsNonNative",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProofVerificationFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnitsTooHigh",
    "inputs": [
      {
        "name": "units",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "MaxAllowed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "UnitsZero",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VerifierZero",
    "inputs": []
  }
] as const;
