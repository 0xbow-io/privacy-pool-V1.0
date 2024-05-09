
import {Keypair} from '@core/account'
import {CommitmentEvents, TxRecordEvents} from '../txRecord/types/events'
import {BaseUtxo, UTXO} from '@core/utxo'
import {TxRecord}   from '@core/txRecord'
import {toFixedHex} from '@/utils/hash'
import {getBigInt, keccak256, concat, toQuantity, getBytes} from 'ethers'
import {ZERO_LEAF, FIELD_SIZE} from '@/store/variables'

async function buildTxRecords(keypair: Keypair, commitmentEvents: CommitmentEvents, txRecordEvents: TxRecordEvents) {

    const commitmentToUTXO = new Map<string, BaseUtxo>() 
    const nulliferToCommitment = new Map<string, string>()
    const unspentNullifiers = new Set<string>()
  
    commitmentEvents.forEach((event) => {
      let decryptedUtxo = undefined
      try {
        decryptedUtxo = UTXO.decrypt(keypair, event.encryptedOutput, event.index)
      } catch (e) { 
        // do nothing
      }
      if (decryptedUtxo !== undefined) {
        let nullifier = toFixedHex(decryptedUtxo.getNullifier())
        commitmentToUTXO.set(toFixedHex(event.commitment), decryptedUtxo)
          if (decryptedUtxo.amount > 0) {
            nulliferToCommitment.set(toFixedHex(nullifier), toFixedHex(event.commitment))
            if (unspentNullifiers.has(nullifier)) {
              throw new Error('Invalid txRecordEvent, nullifier already spent')
            }
            unspentNullifiers.add(nullifier)
          }
        }
      })
  
      
    console.log("building TxRecords for keypair")
    
    // build txRecords from TxRecord Events that are owned by the account
    // this means that the account was able to decrypt the output associated with the commitments
    let txRecords = txRecordEvents.filter((event) => 
      (
        commitmentToUTXO.has(toFixedHex(event.outputCommitment1)) &&
        commitmentToUTXO.has(toFixedHex(event.outputCommitment2))
      )
    )
    .sort((a, b) => a.index - b.index) // sort ascending by index
    .map(function (event) {
      let utxoPairs = [
          {
            inNullifer: event.inputNullifier1,
            outCommitment: event.outputCommitment1,
          },
          {
            inNullifer: event.inputNullifier2,
            outCommitment: event.outputCommitment2,
          }
        ].map(function ({inNullifer, outCommitment}) {
          let outUTXO = commitmentToUTXO.get(toFixedHex(outCommitment))
          if (outUTXO === undefined) {
            throw new Error('Invalid txRecordEvent outUTXO not found')
          }

          const newBlinding = getBigInt(
            '0x' +
            keccak256(concat([getBytes(toQuantity(ZERO_LEAF)), getBytes(toQuantity(outUTXO.blinding))])).slice(2, 64)
          ) % (FIELD_SIZE)
  
          let inCommitment = nulliferToCommitment.get(toFixedHex(inNullifer)) ?? ''
  
          let inUTXO = commitmentToUTXO.get(inCommitment) ?? new UTXO({ amount: 0, keypair, blinding: newBlinding, index: 0 })
          if (toFixedHex(inUTXO.getNullifier()) != inNullifer) {
            throw new Error('newNullifier != trivialNullifier')
          }
         return {inUTXO, outUTXO}
      })
      if (utxoPairs.length == 0) {
        throw new Error('Invalid txRecordEvent')
      }
  
      // mark the nullifiers as spent
      if (utxoPairs[0].inUTXO.amount > (0) && unspentNullifiers.has(toFixedHex(event.inputNullifier1))) {
        unspentNullifiers.delete(toFixedHex(event.inputNullifier1))
      }
  
      if (utxoPairs[1].inUTXO.amount > (0) && unspentNullifiers.has(toFixedHex(event.inputNullifier2))) {
        unspentNullifiers.delete(toFixedHex(event.inputNullifier2))
      }
  
     return TxRecord.fromEvent(
        event, 
        [utxoPairs[0].inUTXO, utxoPairs[1].inUTXO],
        [utxoPairs[0].outUTXO, utxoPairs[1].outUTXO]
      )  
    })
    return {txRecords, unspentNullifiers}
  }