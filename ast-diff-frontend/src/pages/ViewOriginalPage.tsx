import { useState } from "react"
import { compareAst } from "../api/astDiffApi"
import type { AstDiffResponse } from "../types/astDiff"
import type { JsonDiffResponse } from "../types/json/jsonDiff"
import BackendDiffViewer from "../components/BackendDiffViewer"
import JsonBackendDiffViewer from "../components/JsonBackendDiffViewer"

export default function ViewOriginalPage() {
    const [fileA, setFileA] = useState<File | null>(null)
    const [fileB, setFileB] = useState<File | null>(null)
    const [data, setData] = useState<AstDiffResponse | JsonDiffResponse | null>(null)
    const [fileAContent, setFileAContent] = useState<string>("")
    const [fileBContent, setFileBContent] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resetKey, setResetKey] = useState(0)
    const [fileType, setFileType] = useState<"javascript" | "json">("javascript")

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = (e) => reject(e)
            reader.readAsText(file)
        })
    }

    const handleCompare = async () => {
        if (!fileA || !fileB) {
            setError("Please select both files")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Call backend API for AST diff analysis
            const result = await compareAst(fileA, fileB, fileType)

            // Also read file contents for display
            const [contentA, contentB] = await Promise.all([
                readFileContent(fileA),
                readFileContent(fileB)
            ])

            setData(result)
            setFileAContent(contentA)
            setFileBContent(contentB)
        } catch (err) {
            setError("Failed to compare files. Please try again.")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setFileA(null)
        setFileB(null)
        setData(null)
        setFileAContent("")
        setFileBContent("")
        setError(null)
        setResetKey(prev => prev + 1) // Force re-render of file inputs
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(to bottom, #f3f4f6, #e5e7eb)",
            padding: "40px 20px"
        }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{
                    textAlign: "center",
                    marginBottom: "40px"
                }}>
                    <h1 style={{
                        fontSize: "42px",
                        fontWeight: "800",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginBottom: "8px"
                    }}>
                        AST Diff Analyzer
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: "16px" }}>
                        Compare JavaScript and JSON files with line-by-line semantic analysis
                    </p>
                </div>

                {/* Tab Selector */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "center" }}>
                    <button
                        onClick={() => setFileType("javascript")}
                        style={{
                            padding: "8px 16px",
                            background: fileType === "javascript" ? "#667eea" : "#e5e7eb",
                            color: fileType === "javascript" ? "white" : "#374151",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        JavaScript
                    </button>
                    <button
                        onClick={() => setFileType("json")}
                        style={{
                            padding: "8px 16px",
                            background: fileType === "json" ? "#667eea" : "#e5e7eb",
                            color: fileType === "json" ? "white" : "#374151",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        JSON
                    </button>
                </div>

                {/* File Upload Section */}
                <div style={{
                    background: "white",
                    padding: "32px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    marginBottom: "32px"
                }}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px",
                        marginBottom: "24px"
                    }}>
                        {/* File A Input */}
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: "8px"
                            }}>
                                File A (Original)
                            </label>
                            <div style={{
                                position: "relative",
                                border: "2px dashed #d1d5db",
                                borderRadius: "8px",
                                padding: "20px",
                                textAlign: "center",
                                background: fileA ? "#f0fdf4" : "#fafafa",
                                borderColor: fileA ? "#4ade80" : "#d1d5db",
                                transition: "all 0.3s"
                            }}>
                                <input
                                    key={`fileA-${resetKey}`}
                                    type="file"
                                    onChange={e => setFileA(e.target.files?.[0] || null)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        opacity: 0,
                                        cursor: "pointer"
                                    }}
                                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.txt,.md,.json"
                                />
                                <div style={{ pointerEvents: "none" }}>
                                    {fileA ? (
                                        <>
                                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                                            <div style={{ fontWeight: "600", color: "#059669" }}>{fileA.name}</div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                                {(fileA.size / 1024).toFixed(2)} KB
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
                                            <div style={{ color: "#6b7280" }}>Click to select file</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* File B Input */}
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: "8px"
                            }}>
                                File B (Modified)
                            </label>
                            <div style={{
                                position: "relative",
                                border: "2px dashed #d1d5db",
                                borderRadius: "8px",
                                padding: "20px",
                                textAlign: "center",
                                background: fileB ? "#f0fdf4" : "#fafafa",
                                borderColor: fileB ? "#4ade80" : "#d1d5db",
                                transition: "all 0.3s"
                            }}>
                                <input
                                    key={`fileB-${resetKey}`}
                                    type="file"
                                    onChange={e => setFileB(e.target.files?.[0] || null)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        opacity: 0,
                                        cursor: "pointer"
                                    }}
                                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.txt,.md"
                                />
                                <div style={{ pointerEvents: "none" }}>
                                    {fileB ? (
                                        <>
                                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                                            <div style={{ fontWeight: "600", color: "#059669" }}>{fileB.name}</div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                                {(fileB.size / 1024).toFixed(2)} KB
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
                                            <div style={{ color: "#6b7280" }}>Click to select file</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center" }}>
                        <button
                            onClick={handleCompare}
                            disabled={loading || !fileA || !fileB}
                            style={{
                                padding: "12px 32px",
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "white",
                                background: loading || !fileA || !fileB
                                    ? "#9ca3af"
                                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                border: "none",
                                borderRadius: "8px",
                                cursor: loading || !fileA || !fileB ? "not-allowed" : "pointer",
                                boxShadow: loading || !fileA || !fileB ? "none" : "0 4px 6px rgba(102, 126, 234, 0.3)",
                                transition: "all 0.3s"
                            }}
                        >
                            {loading ? "⏳ Analyzing..." : "🔍 Compare Files"}
                        </button>

                        {data && (
                            <button
                                onClick={handleReset}
                                style={{
                                    padding: "12px 32px",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#374151",
                                    background: "white",
                                    border: "2px solid #d1d5db",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.3s"
                                }}
                            >
                                🔄 Reset
                            </button> 
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            marginTop: "16px",
                            padding: "12px 16px",
                            background: "#fee2e2",
                            border: "1px solid #f87171",
                            borderRadius: "8px",
                            color: "#991b1b",
                            textAlign: "center",
                            fontWeight: "600"
                        }}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Diff Viewer */}
                {data && fileA && fileB && (
                    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                        {fileType === "javascript" && (
                            <BackendDiffViewer
                                differences={(data as AstDiffResponse).differences}
                                fileAContent={fileAContent}
                                fileBContent={fileBContent}
                                fileAName={fileA.name}
                                fileBName={fileB.name}
                            />
                        )}
                        {fileType === "json" && (
                            <JsonBackendDiffViewer
                                differences={(data as JsonDiffResponse).differences}
                                fileAContent={fileAContent}
                                fileBContent={fileBContent}
                                fileAName={fileA.name}
                                fileBName={fileB.name}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

