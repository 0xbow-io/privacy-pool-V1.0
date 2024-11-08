import React from "react"
import {
  StyledSwitchRoot,
  SwitchThumb,
  Label,
  RightLabel,
  SwitchWrapper
} from "./Switch.styles"

interface SwitchProps {
  labelLeft?: string
  labelRight?: string
  id: string
  checked?: boolean
  onChange?: (checked: boolean) => void
}

const Switch: React.FC<SwitchProps> = ({
  labelLeft,
  labelRight,
  id,
  checked,
  onChange
}) => {
  const handleChange = (checked: boolean) => {
    if (onChange) {
      onChange(checked)
    }
  }

  return (
    <form>
      <SwitchWrapper>
        {labelLeft && <Label htmlFor={id}>{labelLeft}</Label>}
        <StyledSwitchRoot
          id={id}
          checked={checked}
          onCheckedChange={handleChange}
        >
          <SwitchThumb />
        </StyledSwitchRoot>
        {labelRight && <RightLabel htmlFor={id}>{labelRight}</RightLabel>}
      </SwitchWrapper>
    </form>
  )
}

export default Switch
