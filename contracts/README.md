
# Privacy Pool V1.0 Smart Contracts (Solidity)

Privacy Pool V1.0 is a private-data storage protocol for the EVM, utilising zero-knowledge techniques for secure preservation of confidential data. You may find the core solidity contracts here.

> [!CAUTION] Privacy Pool V1.0 Contracts has not been audited. Please use with caution.

# Overview

> Users can confidentially commit data to Privacy Pool
> and perform operations over any single/or multiple
> committed data provided that the computation is verifiable and that it involves the cryptographic keys
> which can prove ownership over the data.

For Privacy Pool to confidentially store data the following constraints must be satisfied:

1. A set of elements must exist that can prove sufficient **ownership** of the data.
   1. i.e. a set of **cryptographic keys** which can encrypt / decrypt / sign the data and proves data **ownership** by embedding a shared secret into the data.
2. Data is preserved in some form / representation that enables **confidential computation** over its properties / traits / value.
   1. i.e. Data is encrypted using zero-knowledge friendly cryptographic techniques supporting verifiable & confidential data operations.
3. The Existence of the data in some domain can be confidentially proven:
   1. The domain can be characterized as a structured set, where it's elements hold sufficient membership proofs (i.e. Merkle Tree inclusion proofs).
   2. Consider a **Privacy Pool** instance as a domain.
4. Applying set-filter functions (i.e, predicates) over data sets must be privacy-preserving.
   1. i.e. Ability to iterate through data and generate a subset that satisfy predicates without revealing the data that were excluded or included in the subset through application of zero-knowledge folding scheme's (i.e. Nova).
   2. [!NOTE] With Privacy Pool V1.0 users can generate a "proof of association" **PoA** which confidentially verify that a data set is the latest output of a chain of data operations where all inputs & outputs satisfy predicates defined by an Association Set Provider (**ASP**).

## Data Primitives

Privacy Pool V1.0 is limited to storing 252-bit values.
These values can represent anything (e.g., storage pointer, data hash, or private-key), as long as it's type primitive is linkable on-chain. A privacy pool contract can link to an external contract which represents the data primitive (1 primitive per contract for V1.0, see the privacy pool contract constructor).
By default it will set the chain's native gas token as the primitive.

## What is a Commitment?

Data is bound to a domain and a cryptographic Key-pair, forming a **commitment** tuple: (value, scope, secret)

- **Value**: The 252-bit value to be stored.
- **Scope** is the identifier of the domain.
  - In Privacy Pool V1.0, it is calculated as the Keccak256 Hash of chain ID & pool address & other parameters specific to the pool (i.e. number of elements in a cipher-text).
- Consider that a value bound to one domain/scope cannot exists in another domain.
- **Secret**: A ECDH shared secret key only known to the Key-pair.
  - Borrowing from PSE projects such as MACI, Semaphore, Privacy Pool V1.0 utilises the @zk-kit/eddsa-posiedon library to generate EdDSA keys that are compatible with the BabyJub curve ([@zk-kit/eddsa-posiedon](https://zkkit.pse.dev/modules/_zk_kit_eddsa_poseidon.html) library).
  - The secret within the commitment tuple is an Elliptic-Curve Diffie–Hellman (ECDH) shared key derived from a EdDSA key-pair (scalar multiplication with the public-key as the base)

The hash of the commitment tuple (**cHash**) is the Poseidon Hash of the tuple elements: Hash(value, scope, secret).
A **cipher** is generated from the **commitment** tuple via Poseidon encryption ([@zk-kit/poseidon-cipher](https://github.com/privacy-scaling-explorations/zk-kit/tree/c9656231487e5a3cc86ac1941e79706fada011d4/packages/poseidon-cipher) library):

- A randomly generated **Salt** key is paired with the public-key (**Pk**) of an EdDSA Key-pair to derive the ECDH shared **encryption key** (**eK**) used for encrypting the **commitment** tuple.
- EdDSA public-key of the **Salt** is also created ( **saltPubKey**).
- Both **Salt** & **eK** should be discarded after encryption. As it's possible to recover the  **eK** by pairing the **saltPubKey** with the private-key (**pK**) of the same EdDSA Key-pair.
- By default, the **cipher** should contain 7 elements.

A commitment root **cRoot** is the merkle-root computed from a binary Merkle Tree constructed with the 7 **cipher** elements & **cHash** as the leaf layer (total 8 leaf nodes). The **cRoot** is inserted as a leaf into the sate tree (see next section).

    /** from domain/commitment.circom line 160 **/

    ComputeTreeRoot(3)(
    [
     ciphertext[0], ciphertext[1],
     ciphertext[2], ciphertext[3],
     ciphertext[4], ciphertext[5],
     ciphertext[6], hash
    ]);

A null root (**nullRoot**) is the merkle-root computed from a binary Merkle Tree constructed with the secrets associated with the commitment (**Pk**, **saltPubKey**, **eK**, **Secret**) as the leaf layer (total 8 leaf nodes).

    /** from domain/commitment.circom line 130 **/

    nullRoot <== ComputeTreeRoot(3)(
    [
     publicKey[0], publicKey[1],
     secretKey[0], secretKey[1],
     saltPublicKey[0], saltPublicKey[1],
     encryptionKey[0], encryptionKey[1]
    ]);

The **nullRoot** is also inserted as a leaf in the state tree  as  the **nullRoot** functions as a nullifier for **cRoot**. This prevents data operations to operate on the same data twice (also known as double spending).

## Privacy Pool State

## Making a Commitment

## Prerequisites

### 1.Bun

To install Bun, run the following commands:

```
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### 2.Foundry

To install Foundry, run the following commands:

```
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Deployment

### 1.Fill in the .env file with your own values

Create a .env file in the contracts directory and fill it with the following variables:

- For an example check the .env.example file

```bash
RPC_URL=
PRIVATE_KEY=
ETHERSCAN_API_KEY=
CHAIN=
MAX_UNITS_ALLOWED=
UNIT_REPRESENTATION=
```a
### 2.Run the deployment script
To deploy the smart contracts, run the following command:
```bash
$ bun run deploy
```
