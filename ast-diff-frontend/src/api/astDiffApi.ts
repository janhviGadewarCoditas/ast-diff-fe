export async function compareAst(fileA: File, fileB: File, fileType: "javascript" | "json" = "javascript") {
    const formData = new FormData()
    formData.append("file_a", fileA)
    formData.append("file_b", fileB)
  
    const endpoint = `https://adoptively-loungy-norris.ngrok-free.dev/api/v1/compare/${fileType}`
  
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    })
  
    if (!response.ok) {
      throw new Error("AST comparison failed")
    }
  
    return response.json()
  }
  