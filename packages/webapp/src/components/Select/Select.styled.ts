import styled from "@emotion/styled"
import { ChevronDown } from "lucide-react"

export const StyledSelect = styled.select`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: none;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  padding: 0.5rem 2rem 0.5rem 1rem;
  width: 100%;
  position: relative;

  &:focus {
    outline: none;
    border-color: #999;
  }
`

export const Arrow = styled(ChevronDown)`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  height: 1rem;
  width: 1rem;
`
