import styled from "@emotion/styled"

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  border: 2px solid;
  border-radius: 1.5rem;
  background-color: #000;
  color: #f8f8ff;
  padding: 0.75rem 1rem;
  position: relative;
`

export const HeaderText = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;

  @media (min-width: 640px) {
    font-size: 1.5rem;
  }
`

export const PoolRootContainer = styled.div`
  margin-left: auto;
  border: 2px solid;
  padding: 0.5rem;
  background-color: #333;
  color: #f8f8ff;
`