import styled from "@emotion/styled"
import React from "react"
import { Button } from "@/components/ui/button.tsx"

interface IconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  children: React.ReactNode
}

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: #220066;

  &:hover {
    background: rgba(255, 96, 55,1);
  }
`

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, children }) => {
  return (
    <StyledButton onClick={onClick}>
      {icon}
      {children}
    </StyledButton>
  )
}

export default IconButton
