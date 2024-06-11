import { randomBytes } from 'crypto';

import { getBigInt, AbiCoder, keccak256 } from 'ethers';
import { numbers, FIELD_SIZE } from '@/store/variables';
import { BaseUtxo } from '@core/utxo/types';

const BYTES_31 = 31;
const BYTES_32 = 32;
const ADDRESS_BYTES_LENGTH = 20;

function poseidonHash(items: any[]): bigint {
  return getBigInt(poseidon(items));
}

function poseidonHash2(a: string, b: string): bigint {
  return getBigInt(poseidon([a, b]));
}

function randomBN(nbytes = BYTES_31): bigint {
  const buffer = randomBytes(nbytes);
  const bufferAsHexString = buffer.toString('hex');
  return getBigInt(`0x${bufferAsHexString}`);
}

interface Params {
  recipient: string;
  relayer: string;
  encryptedOutput1: string;
  extAmount: string;
  fee: string;
  encryptedOutput2: string;
  membershipProofURI: string;
}

function getExtDataHash({
  recipient,
  extAmount,
  relayer,
  fee,
  encryptedOutput1,
  encryptedOutput2,
  membershipProofURI,
}: Params) {
  const abi = AbiCoder.defaultAbiCoder();

  const encodedData = abi.encode(
    [
      'tuple(address recipient,int256 extAmount,address relayer,uint256 fee,bytes encryptedOutput1,bytes encryptedOutput2,string membershipProofURI)',
    ],
    [
      {
        recipient: toFixedHex(recipient, ADDRESS_BYTES_LENGTH),
        extAmount: toFixedHex(extAmount),
        relayer: toFixedHex(relayer, ADDRESS_BYTES_LENGTH),
        fee: toFixedHex(fee),
        encryptedOutput1: encryptedOutput1,
        encryptedOutput2: encryptedOutput2,
        membershipProofURI: membershipProofURI,
      },
    ],
  );
  const hash = keccak256(encodedData);
  const hashAsBigInt = getBigInt(hash);

  return getBigInt(hash) % FIELD_SIZE;
}

function toFixedHex(value: number | Buffer | bigint | string, length = BYTES_32) {
  let result =
    '0x' +
    (value instanceof Buffer
      ? value.toString('hex')
      : getBigInt(value).toString(16).replace('0x', '')
    ).padStart(length * numbers.TWO, '0');
  if (result.includes('-')) {
    result = '-' + result.replace('-', '');
  }
  return result;
}

function toBuffer(value: string | number | bigint, length: number) {
  const number = getBigInt(value)
    .toString(16)
    .slice(numbers.TWO)
    .padStart(length * numbers.TWO, '0');

  return Buffer.from(number, 'hex');
}

function shuffle(array: BaseUtxo[]) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== numbers.ZERO) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function calculateBitLength(n: number): number {
  if (n === 0) return 1; // Special case for zero
  return Math.floor(Math.log2(n) + 1);
}

export function getBitArray(n: number, maxSize?: number): number[] {
  // Convert the number to its binary string representation without the '0b' prefix.
  const binaryString = n.toString(2);

  // Create an array of 0s and 1s from the binary string.
  const bitArray = binaryString.split('').map((bit) => parseInt(bit));

  // If maxSize is defined and greater than the length of the binary representation,
  // pad the array with 0s at the beginning to match the maxSize.
  if (maxSize && maxSize > bitArray.length) {
    const padding = new Array(maxSize - bitArray.length).fill(0);
    return padding.concat(bitArray);
  }

  return bitArray;
}

export { randomBN, toFixedHex, toBuffer, poseidonHash, poseidonHash2, getExtDataHash, shuffle };
