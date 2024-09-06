import styled from "@emotion/styled"

export const CommitmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0.5rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
`

export const CommitmentDetail = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 2rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (min-width: 1024px) {
    margin-bottom: 32px;
  }
`

export const Label = styled.h2`
  font-weight: bold;
  color: #000;
  flex: 0 0 10rem;
`

export const Value = styled.h2`
  font-weight: normal;
  color: #000;
  word-break: break-all;
  flex: 1;
  text-align: end;
`
