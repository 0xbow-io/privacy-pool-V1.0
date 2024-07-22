export interface IGroth16Verifier_Contract {
  abi: [
    {
      type: "function"
      name: "verifyProof"
      inputs: [
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
          type: "uint256[9]"
          internalType: "uint256[9]"
        }
      ]
      outputs: [
        {
          name: ""
          type: "bool"
          internalType: "bool"
        }
      ]
      stateMutability: "view"
    }
  ]
}

export const Groth16VerifierABI = [
  {
    type: "function",
    name: "verifyProof",
    inputs: [
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
        type: "uint256[9]",
        internalType: "uint256[9]"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool"
      }
    ],
    stateMutability: "view"
  }
] as const
