import styled from "@emotion/styled"
import { keyframes } from "@emotion/react"
import { Loader2 } from "lucide-react"

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
`

export const LoaderIcon = styled(Loader2)`
  width: 2em;
  height: 2em;
  animation: ${spin} 1s linear infinite;
`
