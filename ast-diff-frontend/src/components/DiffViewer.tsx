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

  const renderStatementDiffs = (statements: any[], level: number): React.ReactNode => {
    return statements.map((stmt, idx) => {
      const stmtColor = 
        stmt.change_type === "added" ? "#4ade80" :
        stmt.change_type === "deleted" ? "#f87171" :
        stmt.change_type === "modified" ? "#fbbf24" : 
        stmt.change_type === "moved" ? "#818cf8" :
        stmt.change_type === "moved_modified" ? "#60a5fa" : "#9ca3af"
      
      const indentLeft = level * 16
      
      return (
        <div key={idx} style={{ marginLeft: `${indentLeft}px` }}>
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "8px",
              background: "white",
              borderLeft: `4px solid ${stmtColor}`,
              borderRadius: "4px",
              fontSize: "13px"
            }}
          >
            {/* Branch label with line movement if present */}
            {stmt.branch_label && (
              <div style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#6366f1",
                marginBottom: "4px",
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
              }}>
                🌿 {stmt.branch_label}
                {stmt.file_a_line && stmt.file_b_line && stmt.file_a_line !== stmt.file_b_line && (
                  <span style={{ marginLeft: "8px", color: "#8b5cf6", fontSize: "10px" }}>
                    (line {stmt.file_a_line} → {stmt.file_b_line})
                  </span>
                )}
              </div>
            )}
            
            {/* Description with line info if no branch label */}
            <div style={{ color: "#6b7280", marginBottom: "4px" }}>
              {stmt.description}
              {!stmt.branch_label && stmt.file_a_line && stmt.file_b_line && stmt.file_a_line !== stmt.file_b_line && (
                <span style={{ 
                  marginLeft: "8px", 
                  color: "#8b5cf6", 
                  fontSize: "11px",
                  fontWeight: "600",
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
                }}>
                  (line {stmt.file_a_line} → {stmt.file_b_line})
                </span>
              )}
            </div>
            
            {/* Old code vs New code */}
            {stmt.old_code && stmt.code && stmt.old_code !== stmt.code && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "11px", color: "#f87171", marginBottom: "2px" }}>
                  ❌ Old:
                </div>
                <code style={{
                  display: "block",
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  fontSize: "12px",
                  background: "#fee2e2",
                  padding: "4px 8px",
                  borderRadius: "3px",
                  marginBottom: "4px",
                  color: "#991b1b"
                }}>
                  {stmt.old_code}
                </code>
                <div style={{ fontSize: "11px", color: "#22863a", marginBottom: "2px" }}>
                  ✅ New:
                </div>
                <code style={{
                  display: "block",
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  fontSize: "12px",
                  background: "#dcfce7",
                  padding: "4px 8px",
                  borderRadius: "3px",
                  color: "#166534"
                }}>
                  {stmt.code}
                </code>
              </div>
            )}
            
            {/* Regular code display if no old_code comparison */}
            {(!stmt.old_code || stmt.old_code === stmt.code) && stmt.code && (
              <code style={{
                display: "block",
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                color: "#1f2937",
                fontSize: "12px",
                marginTop: "4px"
              }}>
                {stmt.code}
              </code>
            )}
            
            {/* Similarity score if present */}
            {stmt.similarity_score !== null && stmt.similarity_score !== undefined && (
              <div style={{
                fontSize: "11px",
                color: "#6b7280",
                marginTop: "4px"
              }}>
                📊 Similarity: {(stmt.similarity_score * 100).toFixed(1)}%
              </div>
            )}
          </div>
          
          {/* Render child diffs recursively */}
          {stmt.child_diffs && stmt.child_diffs.length > 0 && (
            <div style={{
              marginLeft: "8px",
              borderLeft: "2px dashed #d1d5db",
              paddingLeft: "8px"
            }}>
              <div style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#6b7280",
                marginBottom: "8px"
              }}>
                ↳ Nested Changes:
              </div>
              {renderStatementDiffs(stmt.child_diffs, level + 1)}
            </div>
          )}
        </div>
      )
    })
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
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  overflow: "hidden",
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
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  overflow: "hidden",
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
                {renderStatementDiffs(diff.statement_diffs, 0)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

