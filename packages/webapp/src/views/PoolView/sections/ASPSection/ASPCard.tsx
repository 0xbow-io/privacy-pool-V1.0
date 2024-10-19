import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card.tsx"
import {
  CenteredContent,
  FlexContainer,
  IconWrapper,
  TreeContainer,
  BackButton
} from "@/views/PoolView/sections/ASPSection/styled.ts"
import { Button } from "@/components/ui/button.tsx"
import { useBoundStore } from "@/stores"
import { formatValue } from "@/utils"
import { type RecordDTO, recordsMock } from "./recordsMock.ts"
import { SelectionList } from "@/components/SelectionList/SelectionList.tsx"
import Select from "@/components/Select/Select.tsx"
import { numberToHex } from "viem"
import type { Commitment } from "@privacy-pool-v1/domainobjs/ts"
import mermaid from "mermaid"
import { cn } from "@/lib/utils.ts"
import { Label } from "@/components/ui/label.tsx"

type ASPCardProps = {
  name: string
  description: string
  icon: string
  fee: bigint
  isSelected: boolean
  handleSelect: (name: string) => void
  handleBack: () => void
}

type TreeNode = { commit: Commitment; parents: TreeNode[] }
type ErrorTreeNode = { error: string }

const categories = [
  "uncategorized",
  "terrorism",
  "scam",
  "money_laundering",
  "exploit",
  "indirect_ofac",
  "direct_ofac",
  "indirect_kyc",
  "direct_kyc",
  "cex"
]

export const ASPCard = ({
  name,
  description,
  fee,
  icon,
  isSelected,
  handleSelect,
  handleBack
}: ASPCardProps) => {
  const { currPoolFe, commitments, currPoolID } = useBoundStore(
    ({ currPoolFe, commitments, currPoolID }) => ({
      currPoolFe,
      commitments,
      currPoolID
    })
  )

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCommitment, setSelectedCommitment] = useState<string | null>(
    null
  )
  const [error, setError] = useState<{ message: string } | null>(null)
  const [treeString, setTreeString] = useState("")
  const mermaidRef = useRef<HTMLDivElement>(null)

  const userCommits = commitments.get(currPoolID)?.flat()

  const findRecordByCRoot = useCallback(
    (cRoot: string, records: RecordDTO[]): RecordDTO | null => {
      return (
        records
          .filter((r) => selectedCategories.every((sC) => r.cats[sC] === 1))
          .find((record) => record.blame.cRoots.includes(cRoot)) || null
      )
    },
    [selectedCategories]
  )

  const findCommitByCRoot = useCallback(
    (cRoot: string, commits: Commitment[]) => {
      return commits.find(
        (commit) => commit.commitmentRoot.toString() === cRoot
      )
    },
    []
  )

  const findCommitByNRoot = useCallback(
    (nRoot: string, commits: Commitment[]) => {
      return commits.find((commit) => commit.nullRoot.toString() === nRoot)
    },
    []
  )

  const buildCommitTree = useCallback(
    (
      commitmentRoot: string,
      commits: Commitment[],
      records: RecordDTO[]
    ): TreeNode | ErrorTreeNode => {
      const commit = findCommitByCRoot(commitmentRoot, commits)
      if (!commit) {
        console.log(
          `Commit with cRoot ${numberToHex(BigInt(commitmentRoot))} not found.`
        )
        return {
          error: `Commit with cRoot ${numberToHex(BigInt(commitmentRoot))} not found.`
        }
      }

      if (commit.isVoid()) {
        return { commit, parents: [] }
      }

      const relatedRecord = findRecordByCRoot(commitmentRoot, records)
      if (!relatedRecord) {
        console.log(`No related record found for cRoot ${commitmentRoot}.`)
        return {
          error: `No related record found for cRoot ${commitmentRoot}.`
        }
      }

      const [nRoot1, nRoot2] = relatedRecord.blame.nRoot
      const parentCommit1 = findCommitByNRoot(nRoot1, commits)
      const parentCommit2 = findCommitByNRoot(nRoot2, commits)

      if (!parentCommit1 && !parentCommit2) {
        console.log(
          `Both parent commits not found for nRoots ${nRoot1}, ${nRoot2}.`
        )
        return {
          error: `Both parent commits not found for nRoots ${nRoot1}, ${nRoot2}.`
        }
      }

      const parentTree1 = parentCommit1
        ? buildCommitTree(
            parentCommit1.commitmentRoot.toString(),
            commits,
            records
          )
        : null
      const parentTree2 = parentCommit2
        ? buildCommitTree(
            parentCommit2.commitmentRoot.toString(),
            commits,
            records
          )
        : null

      if (parentTree1 && "error" in parentTree1) return parentTree1
      if (parentTree2 && "error" in parentTree2) return parentTree2

      return {
        commit,
        parents: [parentTree1, parentTree2].filter(Boolean) as TreeNode[]
      }
    },
    [findCommitByCRoot, findCommitByNRoot, findRecordByCRoot]
  )

  const convertToMermaidGraph = useCallback(
    (tree: TreeNode | ErrorTreeNode): string => {
      if ("error" in tree) {
        return `graph TD\nError["${tree.error}"]`
      }

      const lines: string[] = ["graph LR"]
      const visited = new Set<string>()

      const traverse = (node: TreeNode) => {
        const nodeId = node.commit.commitmentRoot.toString().slice(-4)
        if (visited.has(nodeId)) return
        visited.add(nodeId)

        const nodeLabel = node.commit.isVoid() ? `${nodeId}(void)` : nodeId
        lines.push(`${nodeId}["${nodeLabel}"]`)

        node.parents.forEach((parent) => {
          const parentId = parent.commit.commitmentRoot.toString().slice(-4)
          lines.push(`${parentId} --> ${nodeId}`)
          traverse(parent)
        })
      }

      traverse(tree)
      return lines.join("\n")
    },
    []
  )

  const buildAllCommitsTree = useCallback(
    (commits: Commitment[], records: RecordDTO[]): string => {
      const nodeMap = new Map<string, TreeNode>()

      commits.forEach((commit) => {
        const result = buildCommitTree(
          commit.commitmentRoot.toString(),
          commits,
          records
        )
        if (!("error" in result)) {
          nodeMap.set(commit.commitmentRoot.toString(), result)
        }
      })

      const lines: string[] = ["graph LR"]
      const visited = new Set<string>()

      const traverse = (node: TreeNode) => {
        const nodeId = node.commit.commitmentRoot.toString().slice(-4)
        if (visited.has(nodeId)) return
        visited.add(nodeId)

        const nodeLabel = node.commit.isVoid() ? `${nodeId}(void)` : nodeId
        lines.push(`${nodeId}["${nodeLabel}"]`)

        node.parents.forEach((parent) => {
          const parentId = parent.commit.commitmentRoot.toString().slice(-4)
          lines.push(`${parentId} --> ${nodeId}`)
          traverse(parent)
        })
      }

      nodeMap.forEach((node) => traverse(node))

      const res = lines.join("\n")
      console.log(res)

      return res
    },
    [buildCommitTree]
  )

  useEffect(() => {
    if (selectedCommitment && userCommits) {
      setError(null)
      const res = buildCommitTree(
        selectedCommitment,
        userCommits,
        recordsMock.records
      )

      const graph = convertToMermaidGraph(res)
      console.log("local graph", graph)
    }
  }, [selectedCommitment, userCommits, buildCommitTree, convertToMermaidGraph])

  useEffect(() => {
    const renderElem = async () => {
      console.log(!!treeString, !!mermaidRef.current)
      if (treeString && mermaidRef.current) {
        console.log("need to render", treeString)
        const { svg } = await mermaid.render("mermaidChart", treeString)
        mermaidRef.current.innerHTML = svg
      }
    }

    renderElem()
  }, [treeString])

  useEffect(() => {
    const processedCommits = userCommits?.map((commit) => {
      return {
        commitmentRoot: commit.commitmentRoot.toString().slice(-4),
        nullRoot: commit.nullRoot.toString().slice(-4)
      }
    })
    console.log("processedCommits", processedCommits)
    if (!userCommits) return
    const newTree = buildAllCommitsTree(userCommits, recordsMock.records)
    setTreeString(newTree)
  }, [userCommits, buildAllCommitsTree])

  return isSelected ? (
    <Card className="w-full">
      <CardHeader className="">
        <BackButton onClick={() => handleBack()}>← BACK</BackButton>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <FlexContainer dir="column">
          <FlexContainer dir="row">
            <FlexContainer dir="column">
              <Label
                htmlFor=""
                className={cn("block text-sm font-semibold text-blackmail")}
              >
                Category filter:
              </Label>
              <SelectionList
                data={categories.map((c) => ({
                  id: c,
                  label: c.replaceAll("_", " ")
                }))}
                onSelect={(categories) => setSelectedCategories(categories)}
              />
            </FlexContainer>
            <FlexContainer dir="column" fullWidth>
              <Label
                htmlFor=""
                className={cn("block text-sm font-semibold text-blackmail")}
              >
                Commitment POA:
              </Label>
              {!selectedCommitment ? (
                <CenteredContent>Select commitment</CenteredContent>
              ) : (
                <TreeContainer>
                  {treeString && (
                    <div>
                      {error ? (
                        <CenteredContent>{error.message}</CenteredContent>
                      ) : (
                        <div className="mermaid" ref={mermaidRef}>
                          {treeString}
                        </div>
                      )}
                    </div>
                  )}
                </TreeContainer>
              )}
            </FlexContainer>
          </FlexContainer>
          <Label
            htmlFor=""
            className={cn("block text-sm font-semibold text-blackmail")}
          >
            User Commitments:
          </Label>
          <Select
            value={selectedCommitment || ""}
            onChange={(value) => setSelectedCommitment(value)}
          >
            <option value="">Select commitment</option>
            {userCommits?.map((commit) => (
              <option
                key={commit.commitmentRoot}
                value={commit.commitmentRoot.toString()}
              >
                {commit.commitmentRoot.toString()}
              </option>
            ))}
          </Select>
        </FlexContainer>
      </CardContent>
    </Card>
  ) : (
    <Card className="w-full flex flex-row">
      <CardHeader className="space-y-6">
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <span>
          <b>Fee: </b>
          {formatValue(fee, currPoolFe?.precision)} {currPoolFe?.ticker}
        </span>
      </CardHeader>
      <CardContent className="space-y-2 pt-6">
        <IconWrapper src={icon} />
        <Button onClick={() => handleSelect(name)}>Select</Button>
      </CardContent>
    </Card>
  )
}
