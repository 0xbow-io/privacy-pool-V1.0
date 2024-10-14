import React, { useEffect, useMemo, useState } from "react"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import Select from "@/components/Select/Select.tsx"
import {
  numberToHex,
  type Hex,
  createWalletClient,
  http,
  publicActions
} from "viem"
import { useBoundStore } from "@/stores"
import { DEFAULT_CHAIN } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { formatValue } from "@/utils"

export const SignerSelectionStep = ({ setPrimaryButtonProps }: CommonProps) => {
  const { setSigner, signerKey, privKeys, privacyKeys, src, currPoolFe } =
    useBoundStore(
      ({ setSigner, src, signerKey, privKeys, privacyKeys, currPoolFe }) => ({
        setSigner,
        signerKey,
        privKeys,
        privacyKeys,
        src,
        currPoolFe
      })
    )

  const [currentWalletBalance, setCurrentWalletBalance] = useState<
    bigint | null
  >(null)

  useEffect(() => {
    if (src && signerKey === numberToHex(0)) {
      setSigner(src)
    }
  }, [src, signerKey, setSigner])

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: signerKey == numberToHex(0),
        text: "Continue"
      })
  }, [setPrimaryButtonProps, signerKey])

  useEffect(() => {
    const updateBalance = async () => {
      const publicAddr = privacyKeys.find(
        (k) => k.pKey === signerKey
      )?.publicAddr

      if (!publicAddr) {
        return
      }

      const walletClient = createWalletClient({
        account: publicAddr,
        chain: DEFAULT_CHAIN, //todo: change for dynamic chain
        transport: http()
      }).extend(publicActions)

      const balance = await walletClient.getBalance({ address: publicAddr })
      return balance
    }

    const fetchBalance = async () => {
      const balance = await updateBalance()
      balance && setCurrentWalletBalance(balance)
    }

    if (signerKey !== numberToHex(0)) {
      fetchBalance()
    }
  }, [signerKey])

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">Select the Signing Key</h1>
        <p className="text-sm">
          The chosen Key will be used to sign onchain transactions. Ensure that
          there is enough gas for the key.
        </p>
      </div>
      <div className="w-full flex justify-center mt-4">
        <Select value={signerKey} onChange={(value) => setSigner(value as Hex)}>
          <option value="">Select Signer</option>
          {privKeys.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>
      <div>
        {signerKey && (
          <div>
            Wallet balance:{" "}
            {(currentWalletBalance &&
              `${parseFloat(Number(formatValue(currentWalletBalance, currPoolFe?.precision)).toFixed(8))} ${currPoolFe?.ticker}`) ||
              `0 ${currPoolFe?.ticker}`}
          </div>
        )}
      </div>
    </div>
  )
}

export default SignerSelectionStep
