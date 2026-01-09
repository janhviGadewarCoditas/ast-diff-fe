import type { JsonDifference } from "../types/json/jsonDiff"

interface JsonBackendDiffViewerProps {
  differences: JsonDifference[]
  fileAContent: string
  fileBContent: string
  fileAName: string
  fileBName: string
}

// Helper component to highlight the value portion of a JSON line
function HighlightedLine({ line, highlightType }: { line: string, highlightType: 'value_changed' | 'type_changed' | null }) {
  if (!highlightType) {
    return <>{line}</>
  }

  // Find the colon that separates key from value
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) {
    return <>{line}</>
  }

  const keyPart = line.substring(0, colonIndex + 1) // Include the colon
  const valuePart = line.substring(colonIndex + 1)

  const highlightStyle = highlightType === 'value_changed' 
    ? { background: '#fef08a', color: '#854d0e', fontWeight: '600' as const, padding: '0 2px', borderRadius: '2px' }
    : { background: '#e9d5ff', color: '#581c87', fontWeight: '600' as const, padding: '0 2px', borderRadius: '2px' }

  return (
    <>
      {keyPart}
      <span style={highlightStyle}>{valuePart}</span>
    </>
  )
}

export default function JsonBackendDiffViewer({ 
  differences, 
  fileAContent, 
  fileBContent, 
  fileAName, 
  fileBName 
}: JsonBackendDiffViewerProps) {
  const linesA = fileAContent.split('\n')
  const linesB = fileBContent.split('\n')

  const affectedLinesA = new Set<number>()
  const affectedLinesB = new Set<number>()
  const lineChanges = new Map<number, JsonDifference>()
  const lineChangesB = new Map<number, JsonDifference>()
  
  const statementChangesA = new Map<number, { type: string, description: string, targetLine?: number, sourceLine?: number }>()
  const statementChangesB = new Map<number, { type: string, description: string, targetLine?: number, sourceLine?: number }>()

  differences.forEach(diff => {
    if (diff.file_a_start_line && diff.file_a_end_line) {
      for (let i = diff.file_a_start_line; i <= diff.file_a_end_line; i++) {
        affectedLinesA.add(i)
        lineChanges.set(i, diff)
      }
    }
    if (diff.file_b_start_line && diff.file_b_end_line) {
      for (let i = diff.file_b_start_line; i <= diff.file_b_end_line; i++) {
        affectedLinesB.add(i)
        lineChangesB.set(i, diff)
      }
    }

    // Process statement-level diffs recursively (depth-first) so children take precedence
    const mapStatementDiffsRecursively = (stmtDiffs: any[]) => {
      stmtDiffs.forEach(stmtDiff => {
        // Process child diffs FIRST (depth-first traversal)
        const hasChildren = stmtDiff.child_diffs && stmtDiff.child_diffs.length > 0
        if (hasChildren) {
          mapStatementDiffsRecursively(stmtDiff.child_diffs)
        }
        
        // Check if this statement diff has line range properties
        const hasLineRange = stmtDiff.file_a_start_line !== undefined || stmtDiff.file_b_start_line !== undefined
        
        if (hasLineRange) {
          // Handle line ranges for moved, added, deleted, modified items
          if (stmtDiff.file_a_start_line && stmtDiff.file_a_end_line) {
            // Highlight all lines in the range for file A
            const startLine = stmtDiff.file_a_start_line
            const endLine = stmtDiff.file_a_end_line
            for (let i = startLine; i <= endLine; i++) {
              // Only set if not already set by a more specific child diff
              if (!statementChangesA.has(i)) {
                statementChangesA.set(i, {
                  type: stmtDiff.change_type,
                  description: stmtDiff.description,
                  targetLine: i === startLine ? stmtDiff.file_b_start_line : undefined,
                  sourceLine: startLine
                })
              }
            }
          }
          
          if (stmtDiff.file_b_start_line && stmtDiff.file_b_end_line) {
            // Highlight all lines in the range for file B
            const startLine = stmtDiff.file_b_start_line
            const endLine = stmtDiff.file_b_end_line
            for (let i = startLine; i <= endLine; i++) {
              // Only set if not already set by a more specific child diff
              if (!statementChangesB.has(i)) {
                statementChangesB.set(i, {
                  type: stmtDiff.change_type,
                  description: stmtDiff.description,
                  sourceLine: i === startLine ? stmtDiff.file_a_start_line : undefined,
                  targetLine: startLine
                })
              }
            }
          }
        } else {
          // Handle single line properties (legacy support)
          if (stmtDiff.file_a_line && !statementChangesA.has(stmtDiff.file_a_line)) {
            statementChangesA.set(stmtDiff.file_a_line, {
              type: stmtDiff.change_type,
              description: stmtDiff.description,
              targetLine: stmtDiff.file_b_line,
              sourceLine: stmtDiff.file_a_line
            })
          }
          if (stmtDiff.file_b_line && !statementChangesB.has(stmtDiff.file_b_line)) {
            statementChangesB.set(stmtDiff.file_b_line, {
              type: stmtDiff.change_type,
              description: stmtDiff.description,
              sourceLine: stmtDiff.file_a_line,
              targetLine: stmtDiff.file_b_line
            })
          }
        }
      })
    }

    // ALWAYS process statement_diffs if they exist (even for moved/moved_modified blocks)
    if (diff.statement_diffs && diff.statement_diffs.length > 0) {
      mapStatementDiffsRecursively(diff.statement_diffs)
    }
    
    // For moved/moved_modified blocks, ALWAYS show the block-level badge on the first line
    if (diff.change_type === 'moved' || diff.change_type === 'moved_modified') {
      // Set the block-level change on the start lines (will be overridden if child has more specific change)
      if (diff.file_a_start_line && !statementChangesA.has(diff.file_a_start_line)) {
        statementChangesA.set(diff.file_a_start_line, {
          type: diff.change_type,
          description: diff.description,
          targetLine: diff.file_b_start_line || undefined,
          sourceLine: diff.file_a_start_line
        })
      }
      if (diff.file_b_start_line && !statementChangesB.has(diff.file_b_start_line)) {
        statementChangesB.set(diff.file_b_start_line, {
          type: diff.change_type,
          description: diff.description,
          sourceLine: diff.file_a_start_line || undefined,
          targetLine: diff.file_b_start_line
        })
      }
    }
  })

  const getChangeInfo = (lineNum: number, isFileA: boolean) => {
    const changes = isFileA ? lineChanges : lineChangesB
    const diff = changes.get(lineNum)
    const isFirst = diff && (isFileA ? diff.file_a_start_line === lineNum : diff.file_b_start_line === lineNum)
    return { diff, isFirst }
  }

  const getLineStyle = (changeType: string | undefined, isAffected: boolean, stmtChangeType?: string) => {
    if (stmtChangeType === 'added') {
      return { background: '#e6ffed', borderLeft: '3px solid #22863a' }
    }
    if (stmtChangeType === 'deleted') {
      return { background: '#ffeef0', borderLeft: '3px solid #d73a49' }
    }
    if (stmtChangeType === 'value_changed') {
      return { background: '#fefce8', borderLeft: '3px solid #eab308' }
    }
    if (stmtChangeType === 'type_changed') {
      return { background: '#faf5ff', borderLeft: '3px solid #a855f7' }
    }
    if (stmtChangeType === 'moved' || stmtChangeType === 'moved_modified') {
      return { background: '#e0f2fe', borderLeft: '3px solid #0284c7' }
    }
    if (stmtChangeType === 'modified') {
      return { background: 'white', borderLeft: '3px solid transparent' }
    }

    if (!isAffected || !changeType) {
      return { background: 'white', borderLeft: '3px solid transparent' }
    }

    switch (changeType) {
      case 'added':
        return { background: '#e6ffed', borderLeft: '3px solid #22863a' }
      case 'deleted':
        return { background: '#ffeef0', borderLeft: '3px solid #d73a49' }
      case 'modified':
        return { background: 'white', borderLeft: '3px solid transparent' }
      case 'moved_modified':
        return { background: '#e0f2fe', borderLeft: '3px solid #0284c7' }
      case 'moved':
        return { background: '#e0e7ff', borderLeft: '3px solid #6366f1' }
      default:
        return { background: '#f6f8fa', borderLeft: '3px solid #d0d7de' }
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: '#24292e',
        color: 'white'
      }}>
        <div style={{ 
          padding: '12px 16px',
          borderRight: '1px solid #444'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>📄 {fileAName} (Original)</span>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>📄 {fileBName} (Modified)</span>
        </div>
      </div>

      {/* Split View Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        maxHeight: '600px',
        overflow: 'auto',
        width: '100%'
      }}>
        {/* File A (Left) */}
        <div style={{ borderRight: '2px solid #d0d7de', minWidth: 0, overflow: 'hidden' }}>
          {linesA.map((line, index) => {
            const lineNum = index + 1
            const isAffected = affectedLinesA.has(lineNum)
            const { diff } = getChangeInfo(lineNum, true)
            const stmtChange = statementChangesA.get(lineNum)

            return (
              <div
                key={lineNum}
                style={{
                  display: 'flex',
                  ...getLineStyle(diff?.change_type, isAffected, stmtChange?.type),
                  position: 'relative',
                  minWidth: 0
                }}>
                  <div style={{
                    padding: '2px 8px',
                    minWidth: '50px',
                    textAlign: 'right',
                    color: stmtChange ? '#1f2937' : (isAffected ? '#374151' : '#6e7781'),
                    background: stmtChange ? '#e5e7eb' : (isAffected ? '#f3f4f6' : '#f6f8fa'),
                    borderRight: '1px solid #d0d7de',
                    userSelect: 'none',
                    fontSize: '13px',
                    fontWeight: stmtChange ? '700' : (isAffected ? '600' : '400')
                  }}>
                    {lineNum}
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '2px 8px',
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    fontSize: '13px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    overflow: 'hidden',
                    flex: 1,
                    color: '#24292e',
                    lineHeight: '1.5',
                    fontWeight: stmtChange ? '600' : '400'
                  }}>
                    {stmtChange && (stmtChange.type === 'value_changed' || stmtChange.type === 'type_changed') 
                      ? <HighlightedLine line={line} highlightType={stmtChange.type} />
                      : (line || ' ')
                    }
                  </pre>
                  {stmtChange && stmtChange.type !== 'modified' && (
                    // For moved/moved_modified, only show badge on the start line (when targetLine is defined)
                    // For other types, always show the badge
                    ((stmtChange.type === 'moved' || stmtChange.type === 'moved_modified') && stmtChange.targetLine) || 
                    (stmtChange.type !== 'moved' && stmtChange.type !== 'moved_modified')
                  ) && (
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: 
                        stmtChange.type === 'added' ? '#22863a' :
                        stmtChange.type === 'deleted' ? '#d73a49' :
                        stmtChange.type === 'value_changed' ? '#eab308' :
                        stmtChange.type === 'type_changed' ? '#a855f7' :
                        stmtChange.type === 'moved' || stmtChange.type === 'moved_modified' ? '#0284c7' : '#6366f1',
                      color: 'white',
                      opacity: 0.9,
                      whiteSpace: 'nowrap'
                    }}>
                      {stmtChange.type === 'added' && '➕ ADDED'}
                      {stmtChange.type === 'deleted' && (
                        <>
                          ➖ DELETED
                          {stmtChange.targetLine && ` → ${stmtChange.targetLine}`}
                        </>
                      )}
                      {stmtChange.type === 'value_changed' && '🔄 VALUE CHANGED'}
                      {stmtChange.type === 'type_changed' && '🔀 TYPE CHANGED'}
                      {stmtChange.type === 'moved' && (
                        <>
                          ↔️ MOVED
                          {stmtChange.targetLine && ` → ${stmtChange.targetLine}`}
                        </>
                      )}
                      {stmtChange.type === 'moved_modified' && (
                        <>
                          ↔️ MOVED+MODIFIED
                          {stmtChange.targetLine && ` → ${stmtChange.targetLine}`}
                        </>
                      )}
                    </div>
                  )}
                </div>
            )
          })}
        </div>

        {/* File B (Right) */}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          {linesB.map((line, index) => {
            const lineNum = index + 1
            const isAffected = affectedLinesB.has(lineNum)
            const { diff } = getChangeInfo(lineNum, false)
            const stmtChange = statementChangesB.get(lineNum)

            return (
              <div
                key={lineNum}
                style={{
                  display: 'flex',
                  ...getLineStyle(diff?.change_type, isAffected, stmtChange?.type),
                  position: 'relative',
                  minWidth: 0
                }}>
                  <div style={{
                    padding: '2px 8px',
                    minWidth: '50px',
                    textAlign: 'right',
                    color: stmtChange ? '#1f2937' : (isAffected ? '#374151' : '#6e7781'),
                    background: stmtChange ? '#e5e7eb' : (isAffected ? '#f3f4f6' : '#f6f8fa'),
                    borderRight: '1px solid #d0d7de',
                    userSelect: 'none',
                    fontSize: '13px',
                    fontWeight: stmtChange ? '700' : (isAffected ? '600' : '400')
                  }}>
                    {lineNum}
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '2px 8px',
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    fontSize: '13px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    overflow: 'hidden',
                    flex: 1,
                    color: '#24292e',
                    lineHeight: '1.5',
                    fontWeight: stmtChange ? '600' : '400'
                  }}>
                    {stmtChange && (stmtChange.type === 'value_changed' || stmtChange.type === 'type_changed') 
                      ? <HighlightedLine line={line} highlightType={stmtChange.type} />
                      : (line || ' ')
                    }
                  </pre>
                  {stmtChange && stmtChange.type !== 'modified' && (
                    // For moved/moved_modified, only show badge on the start line (when sourceLine is defined)
                    // For other types, always show the badge
                    ((stmtChange.type === 'moved' || stmtChange.type === 'moved_modified') && stmtChange.sourceLine) || 
                    (stmtChange.type !== 'moved' && stmtChange.type !== 'moved_modified')
                  ) && (
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: 
                        stmtChange.type === 'added' ? '#22863a' :
                        stmtChange.type === 'deleted' ? '#d73a49' :
                        stmtChange.type === 'value_changed' ? '#eab308' :
                        stmtChange.type === 'type_changed' ? '#a855f7' :
                        stmtChange.type === 'moved' || stmtChange.type === 'moved_modified' ? '#0284c7' : '#6366f1',
                      color: 'white',
                      opacity: 0.9,
                      whiteSpace: 'nowrap'
                    }}>
                      {stmtChange.type === 'added' && (
                        <>
                          ➕ ADDED
                          {stmtChange.sourceLine && ` ← ${stmtChange.sourceLine}`}
                        </>
                      )}
                      {stmtChange.type === 'deleted' && '➖ DELETED'}
                      {stmtChange.type === 'value_changed' && '🔄 VALUE CHANGED'}
                      {stmtChange.type === 'type_changed' && '🔀 TYPE CHANGED'}
                      {stmtChange.type === 'moved' && (
                        <>
                          ↔️ MOVED
                          {stmtChange.sourceLine && ` ← ${stmtChange.sourceLine}`}
                        </>
                      )}
                      {stmtChange.type === 'moved_modified' && (
                        <>
                          ↔️ MOVED+MODIFIED
                          {stmtChange.sourceLine && ` ← ${stmtChange.sourceLine}`}
                        </>
                      )}
                    </div>
                  )}
                </div>
            )
          })}
        </div>
      </div>

      {/* Stats Footer */}
      <div style={{
        padding: '12px 16px',
        background: '#f6f8fa',
        borderTop: '1px solid #d0d7de',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: '#22863a', fontWeight: '600' }}>
            +{differences.filter(d => d.change_type === 'added').length} additions
          </span>
          <span style={{ color: '#d73a49', fontWeight: '600' }}>
            -{differences.filter(d => d.change_type === 'deleted').length} deletions
          </span>
          <span style={{ color: '#f59e0b', fontWeight: '600' }}>
            ~{differences.filter(d => d.change_type === 'modified').length} modifications
          </span>
          <span style={{ color: '#3b82f6', fontWeight: '600' }}>
            ↔️ {differences.filter(d => d.change_type === 'moved' || d.change_type === 'moved_modified').length} moved
          </span>
        </div>
      </div>
    </div>
  )
}

