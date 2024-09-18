import styled from "@emotion/styled"

export const Container = styled.div`
    padding-left: 10px;
`

export const KeyValueContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
`

export const Key = styled.div`
    width: 100%;
    word-break: break-word;
    font-weight: bold;
    margin-bottom: 5px;
`

export const Value = styled.div`
    flex: 1;
    word-break: break-word;
`

export const Table = styled.table`
    border: solid 1px blue;
`

export const Th = styled.th`
    border-bottom: solid 3px red;
    background: aliceblue;
    color: black;
    font-weight: bold;
`

export const Td = styled.td`
    padding: 10px;
    border: solid 1px gray;
    background: papayawhip;
`
export const CellWrapper = styled.div`
    margin: 2rem 0;
`

export const BorderlessTable = styled.table`
    width: 100%;
    border-collapse: collapse;
`

export const BorderlessTh = styled.th`
    text-align: left;
    font-weight: bold;
    padding: 0 0.5rem;
`

export const BorderlessTd = styled.td`
    vertical-align: baseline;
    width: auto;
    word-break: break-word;
    padding: 0 0.5rem;
`

export const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 10px;
`

export const GridItem = styled.div`
    display: flex;
    flex-direction: column;
`