import React, { useEffect, useState } from "react"
import {
  Container,
  HeaderText,
  PoolRootContainer
} from "@/components/PoolHeader/styled.ts"
import { ethers } from "ethers"
import provider from "@/providers/websocketProvider.ts"

export const PoolHeader = () => {
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
      setStateRoot(root);
    });

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
    <Container>
      <div>
        <HeaderText>Privacy Pool</HeaderText>
      </div>
      <PoolRootContainer>
        Current pool root: {stateRoot ? `${stateRoot.slice(0, 10)}...${stateRoot.slice(54)}` : "loading..."}
      </PoolRootContainer>
    </Container>
  )
}
