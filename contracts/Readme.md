Install foundry using

```shell
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Follow the instructions of foundryup to completely setup foundry

### Install dependencies

```shell
forge install
```

### Build

```shell
forge build
```

### Test

```shell
forge test
```

To generate typescript ABI Bindings:

```shell
bun typechain --target ethers-v6 --out-dir ../web/contracts './out/PrivacyPool.sol/PrivacyPool.json'
```

safeTransfer
safeTransferFrom

M-02 Replay attack vulnearbilty in Privacy Pool
M-04 Actual token received amount isn't checked in ERC20 PrivacyPool

Have UTXO include pool address

We recommend considering the amount received for the transfer rather than relying on the amount specified in the transferFrom call.

M

escapeWithdraw ??

In the constructor of contract PrivacyPool , there is no limitation on the minimal value for withdrawal, which exposes risks of the DDoS attack, since any user can create a lot of withdrawal requests to the relayer.

C-10 Fees may exceed the amount being sent in PrivacyPool

C-10 Done.
M-02 Done
M-03 Done
M-04 Done
M-05 ??

C-10 Fees may exceed the amount being sent in PrivacyPool: - Ensure that Fee == 0 during a commit - Ensure that Fee < released value during release

M-02 Replay attack vulnerability in PrivacyPool: -
