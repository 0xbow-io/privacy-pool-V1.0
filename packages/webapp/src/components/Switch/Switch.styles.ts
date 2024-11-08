import styled from "@emotion/styled"
import * as SwitchPrimitive from "@radix-ui/react-switch"

export const StyledSwitchRoot = styled(SwitchPrimitive.Root)`
  width: 42px;
  height: 25px;
  background-color: #333;
  border-radius: 9999px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  &[data-state="checked"] {
    background-color: black;
  }
`

export const SwitchThumb = styled(SwitchPrimitive.Thumb)`
  display: block;
  width: 21px;
  height: 21px;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  transition: transform 100ms;
  transform: translateX(2px);
  will-change: transform;
  &[data-state="checked"] {
    transform: translateX(19px);
  }
`

export const Label = styled("label")`
  color: black;
  font-size: 15px;
  line-height: 1;
  user-select: none;
  padding-right: 15px;
`

export const RightLabel = styled(Label)`
  margin-left: 10px;
`

export const SwitchWrapper = styled("div")`
  display: flex;
  align-items: center;
`
