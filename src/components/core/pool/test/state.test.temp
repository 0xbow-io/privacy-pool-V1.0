import { initPoolChains } from '../index';
import { sepolia, Chain } from 'viem/chains';


describe('initPoolChains', () => {
    test('fetch commitments', async () => {
        const privacypools = await initPoolChains()
        privacypools.forEach((pools, chain) => {
            pools.forEach(async (pool) => {
                const index = pool.state.CurrentOnChainIndex()
                console.log("got index: ", index)
                
                const root = pool.state.CurrentOnChainRoot()
                const rootHex = '0x' + root.toString(16)
                console.log("got root: ", rootHex)

                expect(index > 0n).toBe(true);
                expect(root > 0n).toBe(true);

                //get tree
                const tree = await pool.state.GetCommitmentTree()
                console.log("got treeroot: ", tree.root)
                expect(rootHex == tree.root).toBe(true);
            })
        })
    });
  });
  


