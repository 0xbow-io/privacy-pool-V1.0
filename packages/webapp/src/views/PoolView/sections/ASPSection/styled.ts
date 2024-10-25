import styled from "@emotion/styled"

export const IconWrapper = styled.img`
  width: 100px;
  height: 100px;
`

export const FlexContainer = styled.div<{ dir: string; fullWidth?: boolean }>`
  display: flex;
  flex-direction: ${({ dir }) => dir};
  gap: 1rem;
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
`


export const TreeContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 300px;
  width: 100%;
  justify-content: center;
  padding: 10px;
  overflow: auto;
`

export const CenteredContent = styled.div`
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  word-break: break-all;
  padding: 10px;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
`

export const customTheme = {
  scheme: "default",
  author: "me",
  base00: "transparent", // Set background to transparent
  base01: "#ddd",
  base02: "#ddd",
  base03: "#444",
  base04: "#444",
  base05: "#444",
  base06: "#444",
  base07: "#444",
  base08: "#444",
  base09: "#444",
  base0A: "#444",
  base0B: "#444",
  base0C: "#444",
  base0D: "#444",
  base0E: "#444",
  base0F: "#444"
}


export const BackButton = styled.button`
  //margin-bottom: 10px;
    color: #888;
    font-size: .75rem;
  cursor: pointer;
  display: inline-block;
  width: fit-content;
`