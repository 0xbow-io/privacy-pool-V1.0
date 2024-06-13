# @privacy-pool-v1/contracts

## 1. Install Bun: 
To install Bun, run the following commands:
```bash
$ curl -fsSL https://bun.sh/install | bash 
```
```bash
$ export BUN_INSTALL="$HOME/.bun" 
```
```bash
$ export PATH="$BUN_INSTALL/bin:$PATH"
```
## 2. Install Foundry:
To install Foundry, run the following commands:
```bash
$ curl -L https://foundry.paradigm.xyz | bash
```
```bash
$ foundryup
```
## 3. Fill in the .env file with your own values:
Create a .env file in the contracts directory and fill it with the following variables:
- For an example check the .env.example file
```bash
RPC_URL=
PRIVATE_KEY=
ETHERSCAN_API_KEY=
CHAIN=
MAX_COMMIT_VAL=
VALUE_UNIT_REPRESENTATIVE=
MAX_MERKLETREE_DEPTH=
```
## 4. Run the deployment script: 
To deploy the smart contracts, run the following command:
```bash
$ bun run deploy
```