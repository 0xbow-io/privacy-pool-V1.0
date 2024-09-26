import styled from "@emotion/styled"

export const TextContainer = styled.div`
    display: inline-block;
    cursor: pointer;
    position: relative;
`

export const PopoverContent = styled.div`
    padding: 10px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
`

export const FullText = styled.span`
    word-break: break-all;
    margin-right: 10px;
    cursor: pointer;
`

export const CopyButton = styled.button`
    background: #007bff;
    color: white;
    border: none;
    width: 100%;
    padding: 5px 10px;
    cursor: pointer;
    &:hover {
        background: #0056b3;
    }
`