import React from "react"
import { cn } from "@/lib/utils.ts"

interface LoaderProps {
  loading: boolean
}

export const Loader: React.FC<LoaderProps> = ({ loading }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.8)]",
        { hidden: !loading }
      )}
    >
      <button className="loader-button bg-doctor text-lg font-bold text-blackmail border-2 border-blackmail rounded-none px-4 py-2 cursor-default">
        Loading...
      </button>
    </div>
  )
}
