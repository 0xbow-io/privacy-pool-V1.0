import React, { useEffect, useState } from "react"
import { StyledFooter } from "@/components/Footer/styled.ts"
import { PoolRootContainer } from "@/components/PoolHeader/styled.ts"
import { ethers } from "ethers"
import provider from "@/providers/websocketProvider.ts"

const Footer: React.FC = () => {
  const [stateRoot, setStateRoot] = useState<string>("")

  const contractABI = [
    // Minimal ABI required to call getStateRoot
    "function GetStateRoot() view returns (bytes32)"
  ]

  const fetchStateRoot = async (): Promise<string> => {
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
        contractABI,
        provider
      )
      const stateRoot = await contract.GetStateRoot()
      console.log("Fetched state root:", stateRoot)
      return stateRoot
    } catch (error) {
      console.error("Failed to fetch state root:", error)
      return ""
    }
  }

  useEffect(() => {
    // Manual request to fetch state root
    fetchStateRoot().then((root) => {
      setStateRoot(root)
    })

    const intervalId = setInterval(() => {
      fetchStateRoot().then((root) => {
        setStateRoot(root)
      })
    }, 40 * 1000) // TODO: block subscription on WS?

    return () => {
      // Clear the interval when the component unmounts
      clearInterval(intervalId)
    }
  }, [])

  return (
    <StyledFooter>
      <div className="w-full h-full grid grid-cols-2 items-center justify-end tablet:px-6 tablet:grid-cols-6 laptop:grid-cols-6 2xl:grid-cols-12">
        <div className="flex h-full flex-col justify-around gap-y-5 col-span-2 phone:col-start-1 tablet:col-start-2 tablet:col-span-5 laptop:col-span-3 laptop:col-start-3 2xl:col-span-4 2xl:col-start-6">
          <PoolRootContainer>
            Current pool root:{" "}
            {stateRoot
              ? `${stateRoot.slice(0, 10)}...${stateRoot.slice(54)}`
              : "loading..."}
          </PoolRootContainer>
        </div>
      </div>
    </StyledFooter>
  )
}

export default Footer
