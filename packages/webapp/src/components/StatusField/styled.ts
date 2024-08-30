import styled from "@emotion/styled"

export const StatusFieldContainer = styled.div<{ statusIsValid: boolean }>`
  border-right: ${({ statusIsValid }) =>
    statusIsValid ? "2px solid #00FF00" : "2px solid #FF0000"};
  color: ${({ statusIsValid }) => (statusIsValid ? "#00FF00" : "#FF0000")};
  text-align: end;
  width: fit-content;
    margin-top: 16px;
  padding-right: 1rem;  
  min-height: 4rem;
  display: flex;
  align-items: center;
`
