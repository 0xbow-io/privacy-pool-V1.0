### Dependencies:

- circom: using 2.1.9
- circomkit: https://github.com/erhant/circomkit
  - used for circuit build & test
- bun: https://github.com/oven-sh/bun
  - javascript runtime
- hardhat
- foundry forge
- snarkjs

### Building & Testing:

Make sure first to set permission on these files (chmod a+x):

- core/script/compile_artifacts.sh
- core/script/test_pool.sh
- core/script/test_circuit.sh

* make artifacts

  - compile circuit, generate proving key, verification key, and solidity contract

* make test-pool

  - run test for pool contract integrations

* make test-circuit

- Core ts packages are located in he core/ts/\*\* directory
- Circuit files are located in the circuits/\*\* directory
- Contracts are located in the contracts/\*\* directory

Run: bun dev
To start up webapp.
