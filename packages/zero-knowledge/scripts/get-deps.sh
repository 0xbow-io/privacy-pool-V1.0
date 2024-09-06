#!/bin/bash

## Install circomkit, whcih is used for compiling & testing circom circuits.
bun i circomkit --save

## Install snarkjs, which is used for generating proofs & generating solidity verifier for circom circuits
bun i snarkjs --save

## install latest circomlib package, ensures core circom circuits aare using the latest version of circomlib
bun i circomlib --save

## fetch maci circuits, which contains components used in the core circom circuits
bun i maci-circuits --save

bun i @zk-kit/circuits --save
