import styled from "@emotion/styled"

export const ListContainer = styled.div`
  max-height: 300px;
  width: 200px;
  overflow-y: auto;
  //border: 1px solid #ccc;
  //border-radius: 4px;
  padding-right: 8px;
`

export const ListItem = styled.div<{ isSelected: boolean }>`
  padding: 8px;
  margin: 4px 0;
  cursor: pointer;
  background-color: ${({ isSelected }) =>
    isSelected ? "rgba(255, 96, 55, 1)" : "#eee"};
  border-radius: 4px;

  &:hover {
    background-color: ${({ isSelected }) =>
      isSelected ? "rgba(255, 96, 55, .7)" : "rgba(255, 96, 55, .3)"};
  }
`
