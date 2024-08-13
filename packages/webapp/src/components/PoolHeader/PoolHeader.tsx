import React, { useEffect, useState } from "react"
import {
  Container,
  HeaderText,
  PoolRootContainer
} from "@/components/PoolHeader/styled.ts"
import { ethers } from "ethers"
import provider from "@/providers/websocketProvider.ts"

export const PoolHeader = () => {


  return (
    <Container>
      <div>
        <HeaderText>Privacy Pool</HeaderText>
      </div>

    </Container>
  )
}
