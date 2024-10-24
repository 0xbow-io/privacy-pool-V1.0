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
import {
  ChainIDToPoolIDs,
  PrivacyPools
} from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"
import { useBoundStore } from "@/stores"
export const PoolHeader = () => {
  const { setTargetPool, currPoolID } = useBoundStore(
    ({ setTargetPool, currPoolID }) => ({ setTargetPool, currPoolID })
  )

  return (
    <Container>
      <HeaderText>Privacy Pool</HeaderText>
      <Select
        value={currPoolID}
        onValueChange={(value) => setTargetPool(value)}
      >
        <SelectTrigger
          id="input_commitment_1"
          className="bg-royal-nightfall text-ghost-white border-0 w-auto underline decoration-1 underline-offset-4 text-xs laptop:text-base "
        >
          <SelectValue placeholder="Select">{currPoolID}</SelectValue>
        </SelectTrigger>

        <SelectContent
          position="popper"
          className="bg-royal-nightfall text-ghost-white"
        >
          {Array.from(ChainIDToPoolIDs.entries()).map((entry) => {
            return (
              <SelectGroup key={entry[0]}>
                <SelectLabel>{entry[0]}</SelectLabel>
                {entry[1].map((poolId) => {
                  const pool = PrivacyPools.get(poolId)
                  return (
                    <SelectItem key={`${poolId}`} value={`${poolId}`}>
                      {pool?.name}
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
