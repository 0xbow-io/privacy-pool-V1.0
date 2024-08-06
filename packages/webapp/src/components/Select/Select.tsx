import React from "react"
import { Arrow, StyledSelect } from "@/components/Select/Select.styled.ts"

type SelectProps = {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onChange, children }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className="relative w-full">
      <StyledSelect value={value} onChange={handleChange}>
        {children}
      </StyledSelect>
      <Arrow />
    </div>
  )
}

export default Select
