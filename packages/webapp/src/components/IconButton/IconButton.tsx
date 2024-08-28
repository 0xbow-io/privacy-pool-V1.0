import styled from "@emotion/styled"
import React, { type MouseEventHandler } from "react"
import { Button } from "@/components/ui/button.tsx"

interface IconButtonProps {
  icon: React.ReactNode
  disabled: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  children: React.ReactNode
}

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: #220066;

  &:hover {
    background: rgba(255, 96, 55, 1);
  }
`

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  disabled,
  children
}) => {
  return (
    <StyledButton onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </StyledButton>
  )
}

export default IconButton
