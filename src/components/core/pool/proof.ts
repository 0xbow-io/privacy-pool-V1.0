import path from 'path';
import { LeanIMT } from '@zk-kit/lean-imt';
import { GetCommitment, GetNullifier, CTX, caclSignalHash } from '@core/account';
import { Hex, hexToBigInt} from 'viem';

import { stringifyBigInts } from 'maci-crypto';

const maxDepth = 32;


export type ProofInputs = {
  publicVal: bigint;
  signalHash: bigint;
  merkleProofLength: bigint;

  inputNullifier: bigint[];
  inUnits: bigint[];
  inPk: bigint[][];

  inSigR8: bigint[][];
  inSigS: bigint[];

  inBlinding: bigint[];
  inLeafIndices: bigint[];
  merkleProofIndices: bigint[][];
  merkleProofSiblings: bigint[][];

  outCommitment: bigint[];
  outUnits: bigint[];
  outPk: bigint[][];
  outBlinding: bigint[];
};


