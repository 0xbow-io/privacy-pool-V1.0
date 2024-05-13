import { poseidonHash, poseidonHash2, randomBN, toFixedHex } from '../hash';



describe('poseidon', () => {
    const testHashes: any[] = [  
            '0x038d7ea4c68000', 
            '0x08ead4d71bb33c38d5936b4c8181d5b6f828c11d54dc5a2e464b2c546c83e9cb',
            '0xcea504e37d04c956d3ddbb36da302ab8a91cbbd68167303eee2ac9843210ef'
    ]
    it('hash should match', () => {
        const compare = poseidon(testHashes)
        const result = poseidonHash(testHashes);
        expect(typeof result).toBe('bigint');
        expect(result).toBe(compare);
        console.log('got', result, 'expected', compare)

        const resultHex = toFixedHex(result)
        const compareHex = toFixedHex(compare)

        expect(resultHex).toBe(compareHex);
        console.log('got', resultHex, 'expected', compareHex)
    });
  });
  

describe('randomBN', () => {
    it('should return a bigint', () => {
      const result = randomBN();
      expect(typeof result).toBe('bigint');

      const resultHex = toFixedHex(result)
      console.log('got', resultHex)
    });
});


