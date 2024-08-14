import React from "react"
import { Container, HeaderText } from "@/components/PoolHeader/styled.ts"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx"
import { useKeyStore } from "@/providers/global-store-provider.tsx"

export const PoolHeader = () => {
  const { getCurrentPool, updateTargetPoolChain, availChains, avilPools } =
    useKeyStore((state) => state)

  return (
    <Container>
        <HeaderText>Privacy Pool</HeaderText>
        <Select
          value={getCurrentPool().id}
          onValueChange={(value) => updateTargetPoolChain(value)}
        >
          <SelectTrigger
            id="input_commitment_1"
            className="bg-royal-nightfall text-ghost-white border-0 w-auto underline decoration-1 underline-offset-4 text-xs laptop:text-base "
          >
            <SelectValue placeholder="Select">
              {getCurrentPool().id}
            </SelectValue>
          </SelectTrigger>

          <SelectContent
            position="popper"
            className="bg-royal-nightfall text-ghost-white"
          >
            {availChains.map((chain) => {
              return (
                <SelectGroup key={chain.name}>
                  <SelectLabel>{chain.name}</SelectLabel>
                  {avilPools.get(chain)?.map((pool) => {
                    return (
                      <SelectItem
                        key={`${pool.chain.name}:${pool.id}`}
                        value={`${pool.chain.name}:${pool.id}`}
                      >
                        {pool.id}
                      </SelectItem>
                    )
                  })}
                  <SelectSeparator />
                </SelectGroup>
              )
            })}
          </SelectContent>
        </Select>
    </Container>
  )
}
