import path from "node:path"

import { project_base_url } from "./constants"

export function getPath(
  project_name: string,
  project_component?: string,
  sub: string[] = []
): string {
  return path.resolve(
    project_name,
    project_component || "",
    ...sub
  )
}

function removeSpecificPrefix(
  fullPath: string,
  prefixToRemove: string
): string {
  const fullParts = fullPath.split(path.sep)
  const prefixParts = prefixToRemove.split(path.sep)
  return fullParts.slice(prefixParts.length).join(path.sep)
}

export function DeriveURLPath(fullPath: string): string {
  const retracted = removeSpecificPrefix(fullPath, ' /Users/attemka/dev/privacy-pool-V1.0')
  return `${project_base_url}/${retracted}`
}
