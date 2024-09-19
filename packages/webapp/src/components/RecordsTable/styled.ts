import styled from "@emotion/styled"

export const Container = styled.div`
  padding-left: 10px;
`

export const Key = styled.div`
  width: 100%;
  min-width: 5rem;
  word-break: break-word;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9em;
`

export const Value = styled.div`
  flex: 1;
  word-break: break-word;
  font-size: 0.9em;
`

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 10px;
`

export const ExpandButton = styled.span`
  display: flex;
  justify-self: end;
  margin-left: 10px;
  cursor: pointer;
  float: right;
  font-size: 0.9em;
`

export const StripedTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`

export const StripedRow = styled.tr`
  &:nth-of-type(odd) {
    background-color: #f9f9f9;
  }
  &:nth-of-type(even) {
    background-color: #fff;
  }
`

export const StripedCell = styled.td`
  padding: 10px;
`

export const RowContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

export const BackButton = styled.button`
  margin-bottom: 10px;
  cursor: pointer;
`

export const ExpandedContent = styled.div`
  border: 1px solid #ddd;
  background-color: #f0f0f0;
  padding: 10px;
  margin-top: 10px;
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

export const Th = styled.th`
  border-bottom: solid 3px red;
  background: aliceblue;
  color: black;
  font-weight: bold;
  padding: 10px;
`

export const Td = styled.td`
  padding: 10px;

  &.left-align {
    text-align: left;
  }

  &.center-align {
    text-align: center;
  }
`

export const HashContainer = styled.div<{ index: number }>`
  cursor: pointer;
  padding: 10px;
  background-color: ${(props) => (props.index % 2 === 0 ? "#f9f9f9" : "#fff")};
  //margin-bottom: 5px;
`