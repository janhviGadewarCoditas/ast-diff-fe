export async function compareAst(fileA: File, fileB: File) {
    const formData = new FormData()
    formData.append("file_a", fileA)
    formData.append("file_b", fileB)
  
    const response = await fetch(
      "https://cd9a393de755.ngrok-free.app/api/v1/compare",
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
  