# Global Directories

Tp avoid project clutter, certain files that are needed across multiple project components will be stored in a central locatio, aka the global directory.
Small objects that such as build artifacts (i.e. circom circuit wasm files), config files, global constants and test-data for tests are stored in the global directory.

## Artifacts Directory

Contains build artifacts such as circom circuit wasm files that are needed across multiple project components (i.e. core/ts/zk-cricuits)
