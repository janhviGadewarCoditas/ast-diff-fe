import type { Summary, FileInfo } from "../types/astDiff"

interface SummaryCardProps {
  summary: Summary
  fileA: FileInfo
  fileB: FileInfo
}

export default function SummaryCard({ summary, fileA, fileB }: SummaryCardProps) {
  const similarityPercent = (summary.structural_similarity * 100).toFixed(2)

  return (
    <div style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px",
      borderRadius: "12px",
      color: "white",
      marginBottom: "24px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>Comparison Summary</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>File A</div>
          <div style={{ fontSize: "16px", fontWeight: "600" }}>{fileA.original_filename}</div>
          <div style={{ fontSize: "14px", marginTop: "4px" }}>{fileA.total_lines} lines</div>
        </div>
        
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>File B</div>
          <div style={{ fontSize: "16px", fontWeight: "600" }}>{fileB.original_filename}</div>
          <div style={{ fontSize: "14px", marginTop: "4px" }}>{fileB.total_lines} lines</div>
        </div>
        
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>Structural Similarity</div>
          <div style={{ fontSize: "28px", fontWeight: "700" }}>{similarityPercent}%</div>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#4ade80" }}>{summary.blocks_added}</div>
          <div style={{ fontSize: "12px" }}>Added</div>
        </div>
        
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#f87171" }}>{summary.blocks_deleted}</div>
          <div style={{ fontSize: "12px" }}>Deleted</div>
        </div>
        
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#fbbf24" }}>{summary.blocks_modified}</div>
          <div style={{ fontSize: "12px" }}>Modified</div>
        </div>
        
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#60a5fa" }}>{summary.blocks_moved}</div>
          <div style={{ fontSize: "12px" }}>Moved</div>
        </div>
        
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#9ca3af" }}>{summary.blocks_unchanged}</div>
          <div style={{ fontSize: "12px" }}>Unchanged</div>
        </div>
      </div>
    </div>
  )
}

