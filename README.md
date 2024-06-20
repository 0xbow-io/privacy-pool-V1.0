# privacy-pool-v1

To install dependencies:

```bash
bun install
```

To generate Privacy Pool circom artifacts:

```bash
bun run build:privacypool:circom
```

Privacy Pool circom artifacts are located in:
global/artifacts/circom/privacy-pool/PrivacyPool_V1

To test Privacy Pool circom circuits:

```bash
bun run test:privacypool:circom
```

To generate test data for Privacy Pool verifier contract:

```bash
bun run gen:verifier:testdata
```

To compile contracts:

```bash
bun run hardhat:compile
```

To test contracts:

```bash
bun run hardhat:test
```

To run the webapp locally in dev mode:

```bash
bun run webapp:dev
```
