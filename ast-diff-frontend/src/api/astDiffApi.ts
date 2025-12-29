export async function compareAst(fileA: File, fileB: File) {
    const formData = new FormData()
    formData.append("file_a", fileA)
    formData.append("file_b", fileB)
  
    const response = await fetch(
      "https://adoptively-loungy-norris.ngrok-free.dev/api/v1/compare/recursive",
      {
        method: "POST",
        body: formData,
      }
    )
  
    if (!response.ok) {
      throw new Error("AST comparison failed")
    }
  
    return response.json()
  }
  