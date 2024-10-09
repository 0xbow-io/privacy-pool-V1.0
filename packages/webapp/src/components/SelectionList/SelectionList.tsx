import React, { useState } from "react"
import { ListContainer, ListItem } from "./styled"

type SelectionListProps = {
  data: { id: string, label: string }[]
  multiple?: boolean
  onSelect: (selectedIds: string[]) => void
}



export const SelectionList = ({ data, multiple = false, onSelect }: SelectionListProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelect = (id: string) => {
    let newSelectedIds: string[]
    if (multiple) {
      if (selectedIds.includes(id)) {
        newSelectedIds = selectedIds.filter(selectedId => selectedId !== id)
      } else {
        newSelectedIds = [...selectedIds, id]
      }
    } else {
      newSelectedIds = selectedIds.includes(id) ? [] : [id]
    }
    setSelectedIds(newSelectedIds)
    onSelect(newSelectedIds)
  }

  return (
    <ListContainer>
      {data.map(item => (
        <ListItem
          key={item.id}
          isSelected={selectedIds.includes(item.id)}
          onClick={() => handleSelect(item.id)}
        >
          {item.label}
        </ListItem>
      ))}
    </ListContainer>
  )
}