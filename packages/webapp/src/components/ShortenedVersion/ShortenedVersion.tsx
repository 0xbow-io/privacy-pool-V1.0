import React, { useState, useRef } from "react"
import { Popover } from "react-tiny-popover"
import { shortForm } from "@/utils"
import { TextContainer, PopoverContent, FullText, CopyButton } from "./styled"
import type { Hex } from "viem"

export const ShortenedVersion = ({ children }: { children: string }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [copyButtonText, setCopyButtonText] = useState("Copy")
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopyButtonText("Copied")
    setTimeout(() => setCopyButtonText("Copy"), 2000)
  }

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsPopoverOpen(true)
    }, 500)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    setIsPopoverOpen(false)
  }

  const fullText = children as string

  return (
    <Popover
      isOpen={isPopoverOpen}
      containerStyle={{ zIndex: "15", maxWidth: "250px" }}
      positions={["top", "bottom"]}
      content={
        <PopoverContent
          onMouseEnter={() => {
            if (hoverTimeout.current) {
              clearTimeout(hoverTimeout.current)
              hoverTimeout.current = null
            }
            setIsPopoverOpen(true)
          }}
          onMouseLeave={handleMouseLeave}
        >
          <FullText onClick={() => handleCopy(fullText)}>{fullText}</FullText>
          <CopyButton onClick={() => handleCopy(fullText)}>
            {copyButtonText}
          </CopyButton>
        </PopoverContent>
      }
      onClickOutside={() => setIsPopoverOpen(false)}
    >
      <TextContainer
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleCopy(fullText)}
      >
        {shortForm(fullText as Hex)}
      </TextContainer>
    </Popover>
  )
}
