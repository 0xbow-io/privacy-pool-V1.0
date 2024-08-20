import styled from "@emotion/styled"

export const StepsIndContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  position: relative;
`

export const Step = styled.div<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  z-index: 1;
  position: relative;
  cursor: pointer;
`

export const StepCircle = styled.div<{ isActive: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ isActive }) => (isActive ? "#220066" : "#eee")};
  border: 2px solid ${({ isActive }) => (isActive ? "#220066" : "#ccc")};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
`

export const StepLabel = styled.span<{ isActive: boolean }>`
  margin-top: 10px;
  font-size: 14px;
  color: ${({ isActive }) => (isActive ? "#220066" : "#6c757d")};
  z-index: 3;
  @media screen and (max-width: 768px) {
    font-size: 10px;
    text-align: center;
    padding: 0 4px;
  }
`

export const Line = styled.div<{ isActive: boolean }>`
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  height: 4px;
  background-color: ${({ isActive }) => (isActive ? "#220066" : "#e9ecef")};
  transform: translateY(-50%);
  z-index: 0;
`
