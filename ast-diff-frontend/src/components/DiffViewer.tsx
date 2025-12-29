import type { Difference } from "../types/astDiff"

interface DiffViewerProps {
  differences: Difference[]
}

export default function DiffViewer({ differences }: DiffViewerProps) {
  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "added":
        return { bg: "#dcfce7", border: "#4ade80", label: "Added", labelBg: "#4ade80" }
      case "deleted":
        return { bg: "#fee2e2", border: "#f87171", label: "Deleted", labelBg: "#f87171" }
      case "modified":
        return { bg: "#fef3c7", border: "#fbbf24", label: "Modified", labelBg: "#fbbf24" }
      case "moved_modified":
        return { bg: "#dbeafe", border: "#60a5fa", label: "Moved & Modified", labelBg: "#60a5fa" }
      case "moved":
        return { bg: "#e0e7ff", border: "#818cf8", label: "Moved", labelBg: "#818cf8" }
      default:
        return { bg: "#f3f4f6", border: "#9ca3af", label: "Unknown", labelBg: "#9ca3af" }
    }
  }

  const formatCode = (code: string | null) => {
    if (!code) return <span style={{ color: "#9ca3af", fontStyle: "italic" }}>(no code)</span>
    return code
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#1f2937" }}>Detailed Differences</h2>
      
      {differences.map((diff, index) => {
        const colors = getChangeColor(diff.change_type)
        
        return (
          <div
            key={index}
            style={{
              marginBottom: "20px",
              border: `2px solid ${colors.border}`,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            {/* Header */}
            <div style={{
              background: colors.labelBg,
              color: "white",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginRight: "8px"
                }}>
                  {colors.label}
                </span>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>
                  {diff.block_type}: {diff.identifier}
                </span>
              </div>
              {diff.similarity_score > 0 && (
                <span style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  {diff.similarity_score.toFixed(1)}% similar
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{
              padding: "12px 16px",
              background: "#f9fafb",
              borderBottom: `1px solid ${colors.border}`,
              fontSize: "14px",
              color: "#4b5563"
            }}>
              {diff.description}
            </div>

            {/* Side by side code view */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100px" }}>
              {/* File A */}
              <div style={{
                borderRight: `1px solid ${colors.border}`,
                background: diff.change_type === "added" ? "#f9fafb" : colors.bg
              }}>
                <div style={{
                  padding: "8px 16px",
                  background: "#1f2937",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  File A {diff.file_a_start_line && `(Lines ${diff.file_a_start_line}-${diff.file_a_end_line})`}
                </div>
                <pre style={{
                  margin: 0,
                  padding: "16px",
                  fontSize: "13px",
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  overflow: "auto",
                  background: "transparent",
                  color: diff.change_type === "added" ? "#9ca3af" : "#1f2937",
                  lineHeight: "1.5"
                }}>
                  {formatCode(diff.file_a_code)}
                </pre>
              </div>

              {/* File B */}
              <div style={{
                background: diff.change_type === "deleted" ? "#f9fafb" : colors.bg
              }}>
                <div style={{
                  padding: "8px 16px",
                  background: "#1f2937",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  File B {diff.file_b_start_line && `(Lines ${diff.file_b_start_line}-${diff.file_b_end_line})`}
                </div>
                <pre style={{
                  margin: 0,
                  padding: "16px",
                  fontSize: "13px",
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  overflow: "auto",
                  background: "transparent",
                  color: diff.change_type === "deleted" ? "#9ca3af" : "#1f2937",
                  lineHeight: "1.5"
                }}>
                  {formatCode(diff.file_b_code)}
                </pre>
              </div>
            </div>

            {/* Statement diffs */}
            {diff.statement_diffs && diff.statement_diffs.length > 0 && (
              <div style={{
                padding: "16px",
                background: "#f9fafb",
                borderTop: `1px solid ${colors.border}`
              }}>
                <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>
                  Statement-level Changes:
                </div>
                {diff.statement_diffs.map((stmt, idx) => {
                  const stmtColor = 
                    stmt.change_type === "added" ? "#4ade80" :
                    stmt.change_type === "deleted" ? "#f87171" :
                    stmt.change_type === "modified" ? "#fbbf24" : "#60a5fa"
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        marginBottom: "8px",
                        background: "white",
                        borderLeft: `4px solid ${stmtColor}`,
                        borderRadius: "4px",
                        fontSize: "13px"
                      }}
                    >
                      <div style={{ color: "#6b7280", marginBottom: "4px" }}>
                        {stmt.description}
                      </div>
                      <code style={{
                        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                        color: "#1f2937"
                      }}>
                        {stmt.code}
                      </code>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

