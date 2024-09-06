export interface IPrivacyPool_Contract {
  abi: [
    {
      type: "constructor"
      inputs: [
        {
          name: "_fieldInterpreter"
          type: "address"
          internalType: "address"
        },
        {
          name: "_groth16Verifier"
          type: "address"
          internalType: "address"
        }
      ]
      stateMutability: "nonpayable"
    },
    {
      type: "function"
      name: "AggregatedFieldSum"
      inputs: []
      outputs: [
        {
          name: "sum"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "Context"
      inputs: [
        {
          name: "_r"
          type: "tuple"
          internalType: "struct IPrivacyPool.Request"
          components: [
            {
              name: "src"
              type: "address"
              internalType: "address"
            },
            {
              name: "sink"
              type: "address"
              internalType: "address"
            },
            {
              name: "feeCollector"
              type: "address"
              internalType: "address"
            },
            {
              name: "fee"
              type: "uint256"
              internalType: "uint256"
            }
          ]
        }
      ]
      outputs: [
        {
          name: ""
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "FetchCheckpointAtRoot"
      inputs: [
        {
          name: "_stateRoot"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "found"
          type: "bool"
          internalType: "bool"
        },
        {
          name: "depth"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "FetchCipherComponentsFromProof"
      inputs: [
        {
          name: "_proof"
          type: "tuple"
          internalType: "struct IPrivacyPool.GROTH16Proof"
          components: [
            {
              name: "_pA"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pB"
              type: "uint256[2][2]"
              internalType: "uint256[2][2]"
            },
            {
              name: "_pC"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pubSignals"
              type: "uint256[36]"
              internalType: "uint256[36]"
            }
          ]
        },
        {
          name: "_idx"
          type: "uint8"
          internalType: "uint8"
        }
      ]
      outputs: [
        {
          name: "cipherText"
          type: "uint256[7]"
          internalType: "uint256[7]"
        },
        {
          name: "saltPubkey"
          type: "uint256[2]"
          internalType: "uint256[2]"
        },
        {
          name: "commitmentHash"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "pure"
    },
    {
      type: "function"
      name: "FetchCommitmentRootFromProof"
      inputs: [
        {
          name: "_proof"
          type: "tuple"
          internalType: "struct IPrivacyPool.GROTH16Proof"
          components: [
            {
              name: "_pA"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pB"
              type: "uint256[2][2]"
              internalType: "uint256[2][2]"
            },
            {
              name: "_pC"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pubSignals"
              type: "uint256[36]"
              internalType: "uint256[36]"
            }
          ]
        },
        {
          name: "_idx"
          type: "uint8"
          internalType: "uint8"
        }
      ]
      outputs: [
        {
          name: "nullRoot"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "pure"
    },
    {
      type: "function"
      name: "FetchNullRootFromProof"
      inputs: [
        {
          name: "_proof"
          type: "tuple"
          internalType: "struct IPrivacyPool.GROTH16Proof"
          components: [
            {
              name: "_pA"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pB"
              type: "uint256[2][2]"
              internalType: "uint256[2][2]"
            },
            {
              name: "_pC"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pubSignals"
              type: "uint256[36]"
              internalType: "uint256[36]"
            }
          ]
        },
        {
          name: "_idx"
          type: "uint8"
          internalType: "uint8"
        }
      ]
      outputs: [
        {
          name: "nullRoot"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "pure"
    },
    {
      type: "function"
      name: "FetchRoot"
      inputs: [
        {
          name: "idx"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "root"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "FetchRoots"
      inputs: [
        {
          name: "_from"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "_to"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "roots"
          type: "uint256[]"
          internalType: "uint256[]"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "GetChainId"
      inputs: []
      outputs: [
        {
          name: ""
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "GetLastCheckpoint"
      inputs: []
      outputs: [
        {
          name: "root"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "depth"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "GetStateRoot"
      inputs: []
      outputs: [
        {
          name: ""
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "GetStateSize"
      inputs: []
      outputs: [
        {
          name: ""
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "GetStateTreeDepth"
      inputs: []
      outputs: [
        {
          name: ""
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "IsComplexField"
      inputs: [
        {
          name: "fieldInterpreter"
          type: "address"
          internalType: "address"
        }
      ]
      outputs: [
        {
          name: ""
          type: "bool"
          internalType: "bool"
        }
      ]
      stateMutability: "pure"
    },
    {
      type: "function"
      name: "PackCipher"
      inputs: [
        {
          name: "_cipherText"
          type: "uint256[7]"
          internalType: "uint256[7]"
        },
        {
          name: "_saltPubkey"
          type: "uint256[2]"
          internalType: "uint256[2]"
        },
        {
          name: "_commitmentHash"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "packed"
          type: "uint256[10]"
          internalType: "uint256[10]"
        }
      ]
      stateMutability: "pure"
    },
    {
      type: "function"
      name: "Process"
      inputs: [
        {
          name: "_r"
          type: "tuple"
          internalType: "struct IPrivacyPool.Request"
          components: [
            {
              name: "src"
              type: "address"
              internalType: "address"
            },
            {
              name: "sink"
              type: "address"
              internalType: "address"
            },
            {
              name: "feeCollector"
              type: "address"
              internalType: "address"
            },
            {
              name: "fee"
              type: "uint256"
              internalType: "uint256"
            }
          ]
        },
        {
          name: "_proof"
          type: "tuple"
          internalType: "struct IPrivacyPool.GROTH16Proof"
          components: [
            {
              name: "_pA"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pB"
              type: "uint256[2][2]"
              internalType: "uint256[2][2]"
            },
            {
              name: "_pC"
              type: "uint256[2]"
              internalType: "uint256[2]"
            },
            {
              name: "_pubSignals"
              type: "uint256[36]"
              internalType: "uint256[36]"
            }
          ]
        }
      ]
      outputs: []
      stateMutability: "payable"
    },
    {
      type: "function"
      name: "Scope"
      inputs: []
      outputs: [
        {
          name: ""
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "SeekRootIdx"
      inputs: [
        {
          name: "_root"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "ok"
          type: "bool"
          internalType: "bool"
        },
        {
          name: "idx"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "SeekRootIdxs"
      inputs: [
        {
          name: "_roots"
          type: "uint256[]"
          internalType: "uint256[]"
        }
      ]
      outputs: [
        {
          name: "ok"
          type: "bool[]"
          internalType: "bool[]"
        },
        {
          name: "idx"
          type: "uint256[]"
          internalType: "uint256[]"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "UnpackCipherAtIdx"
      inputs: [
        {
          name: "_index"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "cipherText"
          type: "uint256[7]"
          internalType: "uint256[7]"
        },
        {
          name: "saltPubkey"
          type: "uint256[2]"
          internalType: "uint256[2]"
        },
        {
          name: "commitmentHash"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "UnpackCiphersWithinRange"
      inputs: [
        {
          name: "_from"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "_to"
          type: "uint256"
          internalType: "uint256"
        }
      ]
      outputs: [
        {
          name: "cipherTexts"
          type: "uint256[7][]"
          internalType: "uint256[7][]"
        },
        {
          name: "saltPubkeys"
          type: "uint256[2][]"
          internalType: "uint256[2][]"
        },
        {
          name: "commitmentHashes"
          type: "uint256[]"
          internalType: "uint256[]"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "function"
      name: "fieldInterpreter"
      inputs: []
      outputs: [
        {
          name: ""
          type: "address"
          internalType: "address"
        }
      ]
      stateMutability: "view"
    },
    {
      type: "event"
      name: "Record"
      inputs: [
        {
          name: "_r"
          type: "tuple"
          indexed: false
          internalType: "struct IPrivacyPool.Request"
          components: [
            {
              name: "src"
              type: "address"
              internalType: "address"
            },
            {
              name: "sink"
              type: "address"
              internalType: "address"
            },
            {
              name: "feeCollector"
              type: "address"
              internalType: "address"
            },
            {
              name: "fee"
              type: "uint256"
              internalType: "uint256"
            }
          ]
        },
        {
          name: "stateRoot"
          type: "uint256"
          indexed: false
          internalType: "uint256"
        },
        {
          name: "stateSize"
          type: "uint256"
          indexed: false
          internalType: "uint256"
        }
      ]
      anonymous: false
    },
    {
      type: "error"
      name: "CommitmentRootExists"
      inputs: [
        {
          name: "value"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "FeeCollectorIsZero"
      inputs: []
    },
    {
      type: "error"
      name: "FeeTooHigh"
      inputs: [
        {
          name: "fee"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "units"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "InvalidContext"
      inputs: [
        {
          name: "got"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "InvalidFieldInterpreter"
      inputs: []
    },
    {
      type: "error"
      name: "InvalidProofOutput"
      inputs: []
    },
    {
      type: "error"
      name: "InvalidScope"
      inputs: [
        {
          name: "got"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "expected"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "InvalidStateTreeDepth"
      inputs: [
        {
          name: "root"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "depth"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "actualDepth"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "LeafAlreadyExists"
      inputs: []
    },
    {
      type: "error"
      name: "LeafCannotBeZero"
      inputs: []
    },
    {
      type: "error"
      name: "LeafDoesNotExist"
      inputs: []
    },
    {
      type: "error"
      name: "LeafGreaterThanSnarkScalarField"
      inputs: []
    },
    {
      type: "error"
      name: "MissingExternalInput"
      inputs: [
        {
          name: "got"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "expeted"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "actualSrc"
          type: "address"
          internalType: "address"
        },
        {
          name: "expectedSrc"
          type: "address"
          internalType: "address"
        }
      ]
    },
    {
      type: "error"
      name: "NullRootExists"
      inputs: [
        {
          name: "value"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "OutputWillOverdraw"
      inputs: [
        {
          name: "aggregatedFieldSum"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "output"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "ProofVerificationFailed"
      inputs: []
    },
    {
      type: "error"
      name: "RootSetOutOfSync"
      inputs: [
        {
          name: "dataset_len"
          type: "uint256"
          internalType: "uint256"
        },
        {
          name: "state_len"
          type: "uint256"
          internalType: "uint256"
        }
      ]
    },
    {
      type: "error"
      name: "VerifierIsZero"
      inputs: []
    }
  ]
}

export const PrivacyPoolABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_fieldInterpreter",
        type: "address",
        internalType: "address"
      },
      {
        name: "_groth16Verifier",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "AggregatedFieldSum",
    inputs: [],
    outputs: [
      {
        name: "sum",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "Context",
    inputs: [
      {
        name: "_r",
        type: "tuple",
        internalType: "struct IPrivacyPool.Request",
        components: [
          {
            name: "src",
            type: "address",
            internalType: "address"
          },
          {
            name: "sink",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeCollector",
            type: "address",
            internalType: "address"
          },
          {
            name: "fee",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "FetchCheckpointAtRoot",
    inputs: [
      {
        name: "_stateRoot",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "found",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "depth",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "FetchCipherComponentsFromProof",
    inputs: [
      {
        name: "_proof",
        type: "tuple",
        internalType: "struct IPrivacyPool.GROTH16Proof",
        components: [
          {
            name: "_pA",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pB",
            type: "uint256[2][2]",
            internalType: "uint256[2][2]"
          },
          {
            name: "_pC",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pubSignals",
            type: "uint256[36]",
            internalType: "uint256[36]"
          }
        ]
      },
      {
        name: "_idx",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "cipherText",
        type: "uint256[7]",
        internalType: "uint256[7]"
      },
      {
        name: "saltPubkey",
        type: "uint256[2]",
        internalType: "uint256[2]"
      },
      {
        name: "commitmentHash",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "FetchCommitmentRootFromProof",
    inputs: [
      {
        name: "_proof",
        type: "tuple",
        internalType: "struct IPrivacyPool.GROTH16Proof",
        components: [
          {
            name: "_pA",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pB",
            type: "uint256[2][2]",
            internalType: "uint256[2][2]"
          },
          {
            name: "_pC",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pubSignals",
            type: "uint256[36]",
            internalType: "uint256[36]"
          }
        ]
      },
      {
        name: "_idx",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "nullRoot",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "FetchNullRootFromProof",
    inputs: [
      {
        name: "_proof",
        type: "tuple",
        internalType: "struct IPrivacyPool.GROTH16Proof",
        components: [
          {
            name: "_pA",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pB",
            type: "uint256[2][2]",
            internalType: "uint256[2][2]"
          },
          {
            name: "_pC",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pubSignals",
            type: "uint256[36]",
            internalType: "uint256[36]"
          }
        ]
      },
      {
        name: "_idx",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "nullRoot",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "FetchRoot",
    inputs: [
      {
        name: "idx",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "root",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "FetchRoots",
    inputs: [
      {
        name: "_from",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_to",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "roots",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "GetChainId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "GetLastCheckpoint",
    inputs: [],
    outputs: [
      {
        name: "root",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "depth",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "GetStateRoot",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "GetStateSize",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "GetStateTreeDepth",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "IsComplexField",
    inputs: [
      {
        name: "fieldInterpreter",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "PackCipher",
    inputs: [
      {
        name: "_cipherText",
        type: "uint256[7]",
        internalType: "uint256[7]"
      },
      {
        name: "_saltPubkey",
        type: "uint256[2]",
        internalType: "uint256[2]"
      },
      {
        name: "_commitmentHash",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "packed",
        type: "uint256[10]",
        internalType: "uint256[10]"
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "Process",
    inputs: [
      {
        name: "_r",
        type: "tuple",
        internalType: "struct IPrivacyPool.Request",
        components: [
          {
            name: "src",
            type: "address",
            internalType: "address"
          },
          {
            name: "sink",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeCollector",
            type: "address",
            internalType: "address"
          },
          {
            name: "fee",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      },
      {
        name: "_proof",
        type: "tuple",
        internalType: "struct IPrivacyPool.GROTH16Proof",
        components: [
          {
            name: "_pA",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pB",
            type: "uint256[2][2]",
            internalType: "uint256[2][2]"
          },
          {
            name: "_pC",
            type: "uint256[2]",
            internalType: "uint256[2]"
          },
          {
            name: "_pubSignals",
            type: "uint256[36]",
            internalType: "uint256[36]"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "Scope",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "SeekRootIdx",
    inputs: [
      {
        name: "_root",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "ok",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "idx",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "SeekRootIdxs",
    inputs: [
      {
        name: "_roots",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    outputs: [
      {
        name: "ok",
        type: "bool[]",
        internalType: "bool[]"
      },
      {
        name: "idx",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "UnpackCipherAtIdx",
    inputs: [
      {
        name: "_index",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "cipherText",
        type: "uint256[7]",
        internalType: "uint256[7]"
      },
      {
        name: "saltPubkey",
        type: "uint256[2]",
        internalType: "uint256[2]"
      },
      {
        name: "commitmentHash",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "UnpackCiphersWithinRange",
    inputs: [
      {
        name: "_from",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_to",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "cipherTexts",
        type: "uint256[7][]",
        internalType: "uint256[7][]"
      },
      {
        name: "saltPubkeys",
        type: "uint256[2][]",
        internalType: "uint256[2][]"
      },
      {
        name: "commitmentHashes",
        type: "uint256[]",
        internalType: "uint256[]"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "fieldInterpreter",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "Record",
    inputs: [
      {
        name: "_r",
        type: "tuple",
        indexed: false,
        internalType: "struct IPrivacyPool.Request",
        components: [
          {
            name: "src",
            type: "address",
            internalType: "address"
          },
          {
            name: "sink",
            type: "address",
            internalType: "address"
          },
          {
            name: "feeCollector",
            type: "address",
            internalType: "address"
          },
          {
            name: "fee",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      },
      {
        name: "stateRoot",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      },
      {
        name: "stateSize",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "CommitmentRootExists",
    inputs: [
      {
        name: "value",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FeeCollectorIsZero",
    inputs: []
  },
  {
    type: "error",
    name: "FeeTooHigh",
    inputs: [
      {
        name: "fee",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "units",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "InvalidContext",
    inputs: [
      {
        name: "got",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "InvalidFieldInterpreter",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidProofOutput",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidScope",
    inputs: [
      {
        name: "got",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "InvalidStateTreeDepth",
    inputs: [
      {
        name: "root",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "depth",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "actualDepth",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "LeafAlreadyExists",
    inputs: []
  },
  {
    type: "error",
    name: "LeafCannotBeZero",
    inputs: []
  },
  {
    type: "error",
    name: "LeafDoesNotExist",
    inputs: []
  },
  {
    type: "error",
    name: "LeafGreaterThanSnarkScalarField",
    inputs: []
  },
  {
    type: "error",
    name: "MissingExternalInput",
    inputs: [
      {
        name: "got",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "expeted",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "actualSrc",
        type: "address",
        internalType: "address"
      },
      {
        name: "expectedSrc",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "NullRootExists",
    inputs: [
      {
        name: "value",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "OutputWillOverdraw",
    inputs: [
      {
        name: "aggregatedFieldSum",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "output",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "ProofVerificationFailed",
    inputs: []
  },
  {
    type: "error",
    name: "RootSetOutOfSync",
    inputs: [
      {
        name: "dataset_len",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "state_len",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "VerifierIsZero",
    inputs: []
  }
] as const
