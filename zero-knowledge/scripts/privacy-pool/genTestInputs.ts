import fs from "fs"
import path from "path"

import {PrivacyPool} from "@privacy-pool-v1/zero-knowledge"
import { genTestCircuitInputsFn } from "@privacy-pool-v1/zero-knowledge"



function exportToJSON(data: any, filePath: string): void {
  try {
    const jsonData = JSON.stringify(data, null, 2) // Convert the object to JSON with pretty formatting
    fs.writeFileSync(filePath, jsonData) // Write the JSON data to the file
    console.log(`Data exported successfully to ${filePath}`)
  } catch (err) {
    console.error("Error exporting data:", err)
  }
}


/*
   // export it as a json file
    

    // need to convert circuitInput values as string
    const inputs = stringifyBigInts(circuitInputs)


//   let i = 0
//     
// 

//     console.log(`Generating test inputs for ${filePath}`)


  

*/

function removeDirectoryContents(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory ${dirPath} does not exist.`)
    return
  }

  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      removeDirectoryContents(filePath)
      fs.rmdirSync(filePath)
    } else {
      fs.unlinkSync(filePath)
    }
  }
}

function dumpTestData(
  testData: any,
  outputDir?: string,
  filePrefix: string = "testcase_") 
{
  exportToJSON(
    {
      inputs: inputs,
      expectedValues: {
        inCommitments: input_commitments.map((c) =>
          stringifyBigInts(c.asStringValues())
        ),
        outCommitments: output_comitments.map((c) =>
          stringifyBigInts(c.asStringValues())
        ),
        computedMerkleRoot: mt.root.toString()
      },
      ouptuts: [mt.root.toString()]
    },
    path.join(outputDir || "", filePrefix + `${i++}.json`)
  )

}

 // to remove previous test artifacts
removeDirectoryContents(PrivacyPool.circomkitConf.dirInputs)

// generate new test artifacts
dumpTestData(
    generateCircuitInputsFn(PrivacyPool.test_data_size), 
    PrivacyPool.circomkitConf.dirInputs
  )