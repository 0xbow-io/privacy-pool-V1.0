import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

/*
    Parse the output JSON from a foundry build and generate a TypeScript file with the ABI.
*/

// Function to generate the TypeScript file
export function generateAbiFile(
  jsonFileName: string,
  outputPath: string
): void {
  // Read the JSON file
  const jsonFilePath = `${jsonFileName}.json`
  const jsonContent = readFileSync(jsonFilePath, "utf-8")
  const jsonData = JSON.parse(jsonContent)

  // Extract the ABI from the JSON data
  const abi = jsonData.abi

  if (!abi) {
    console.error("Error: ABI not found in the JSON file.")
    return
  }

  // extract just the filename form the jsonFileName
  const fileName = jsonFileName.split("/").pop() || jsonFileName

  // Generate the TypeScript content
  const tsContent = `
export interface I${fileName.charAt(0).toUpperCase() + fileName.slice(1)}_Contract {
  "abi": ${JSON.stringify(abi, null, 2)}
}

export const ${fileName}ABI = ${JSON.stringify(abi, null, 2)} as const;
`

  // Write the TypeScript file
  const tsFilePath = resolve(outputPath, `${fileName}.abi.ts`)
  writeFileSync(tsFilePath, tsContent)

  console.log(`Generated ${fileName}.abi.ts successfully.`)
}
