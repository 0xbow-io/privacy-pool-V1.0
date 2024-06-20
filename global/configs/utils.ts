import path from "path"

const project_root_path = path.resolve(__dirname, "../../")

export function getPath(
  project_name: string,
  project_component?: string,
  sub: string[] = []
): string {
  return path.resolve(
    project_root_path,
    project_name,
    project_component || "",
    ...sub
  )
}
