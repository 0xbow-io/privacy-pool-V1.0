import { Circomkit, CircomkitConfig, CircuitConfig } from 'circomkit';
import { MAX_DEPTH } from '@core/pool/constants';

const CIRCUIT_NAME = 'PrivacyPool';
const PROTOCOL = 'groth16';

const circuitConf: CircuitConfig = {
  file: CIRCUIT_NAME,
  template: CIRCUIT_NAME,
  dir: 'main',
  pubs: ['publicVal', 'signalHash', 'merkleProofLength', 'inputNullifier', 'outCommitment'],
  params: [MAX_DEPTH, 2, 2],
};

const circomkitConf: CircomkitConfig = {
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

class CircuitBuilder {
  circomkit: Circomkit;
  constructor(
    public circuitName: string,
    public circuitConf: CircuitConfig,
    public circomConf: CircomkitConfig,
  ) {
    this.circomkit = new Circomkit(this.circomConf);
  }

  instantiate() {
    try {
      this.circomkit.instantiate(this.circuitName, this.circuitConf);
    } catch (e) {
      console.log(e);
      throw new Error('Failed to instantiate circuit', { cause: e });
    }
  }

  async compile() {
    try {
      const outPath = await this.circomkit.compile(this.circuitName, this.circuitConf);
      console.log(`Compiled circuit to ${outPath}`);
    } catch (e) {
      console.log(e);
      throw new Error('Failed to compile circuit', { cause: e });
    }
  }

  async setup() {
    try {
      const { proverKeyPath, verifierKeyPath } = await this.circomkit.setup(this.circuitName);
      return { proverKeyPath, verifierKeyPath };
    } catch (e) {
      console.log(e);
      throw new Error('Failed to setup circuit', { cause: e });
    }
  }

  async build() {
    try {
      this.instantiate();
      await this.compile();
      await this.setup();
    } catch (e) {
      console.log(e);
      throw new Error('Failed to build circuit', { cause: e });
    }
  }
}

const builder = new CircuitBuilder(CIRCUIT_NAME, circuitConf, circomkitConf);
await builder.build();
