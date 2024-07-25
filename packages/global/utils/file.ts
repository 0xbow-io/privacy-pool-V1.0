import path from "node:path"
import fs from "node:fs"

export function moveFileIfExists(
  sourceFilePath: string,
  destinationDir: string
): void {
  const destinationFilePath = path.join(
    destinationDir,
    path.basename(sourceFilePath)
  )

  fs.access(sourceFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File ${sourceFilePath} does not exist.`)
      return
    }

    fs.rename(sourceFilePath, destinationFilePath, (renameErr) => {
      if (renameErr) {
        console.error(`Error moving file: ${renameErr}`)
      } else {
        console.log(
          `File moved from ${sourceFilePath} to ${destinationFilePath}`
        )
      }
    })

  })
}
