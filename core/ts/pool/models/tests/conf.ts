import { CircuitConfig, CircomkitConfig } from 'circomkit';
import { MAX_DEPTH } from '@core/pool/constants';

export const CIRCUIT_NAME = 'PrivacyPool';
export const PROTOCOL = 'groth16';

export const circuitConf: CircuitConfig = {
  file: CIRCUIT_NAME,
  template: CIRCUIT_NAME,
  dir: 'main',
  pubs: ['publicVal', 'signalHash', 'merkleProofLength', 'inputNullifier', 'outCommitment'],
  params: [MAX_DEPTH, 2, 2],
};

export const circomkitConf: CircomkitConfig = {
  // general settings
  protocol: PROTOCOL,
  prime: 'bn128',
  version: '2.1.9',
  // directories & paths
  circuits: './circuits.json',
  dirPtau: './ptau',
  dirCircuits: './circuits',
  dirInputs: './inputs',
  dirBuild: './build',
  circomPath: 'circom',
  // compiler-specific
  optimization: 1,
  inspect: true,
  include: ['./node_modules'],
  cWitness: false,
  // groth16 phase-2 settings
  groth16numContributions: 1,
  groth16askForEntropy: false,
  // solidity & calldata
  prettyCalldata: false,
  // logger
  logLevel: 'debug',
  verbose: true,
};
