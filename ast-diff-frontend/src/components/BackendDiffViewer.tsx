import type { Difference } from "../types/astDiff"

interface BackendDiffViewerProps {
  differences: Difference[]
  fileAContent: string
  fileBContent: string
  fileAName: string
  fileBName: string
}

export default function BackendDiffViewer({ 
  differences, 
  fileAContent, 
  fileBContent, 
  fileAName, 
  fileBName 
}: BackendDiffViewerProps) {
  const linesA = fileAContent.split('\n')
  const linesB = fileBContent.split('\n')

  // Create a map of which lines are affected by changes
  const affectedLinesA = new Set<number>()
  const affectedLinesB = new Set<number>()
  const lineChanges = new Map<number, Difference>()
  const lineChangesB = new Map<number, Difference>()
  
  // Track statement-level changes within blocks
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
    
    // Map statement-level diffs to specific lines (recursively)
    if (diff.statement_diffs && diff.statement_diffs.length > 0) {
      const mapStatementDiffsRecursively = (stmtDiffs: any[]) => {
        stmtDiffs.forEach(stmtDiff => {
          if (stmtDiff.file_a_line) {
            statementChangesA.set(stmtDiff.file_a_line, {
              type: stmtDiff.change_type,
              description: stmtDiff.description,
              targetLine: stmtDiff.file_b_line, // Where it moved TO
              sourceLine: stmtDiff.file_a_line
            })
          }
          if (stmtDiff.file_b_line) {
            statementChangesB.set(stmtDiff.file_b_line, {
              type: stmtDiff.change_type,
              description: stmtDiff.description,
              sourceLine: stmtDiff.file_a_line, // Where it came FROM
              targetLine: stmtDiff.file_b_line
            })
          }
          
          // Recursively process child_diffs
          if (stmtDiff.child_diffs && stmtDiff.child_diffs.length > 0) {
            mapStatementDiffsRecursively(stmtDiff.child_diffs)
          }
        })
      }
      
      mapStatementDiffsRecursively(diff.statement_diffs)
    }
  })

  const getChangeInfo = (lineNum: number, isFileA: boolean): { diff: Difference | undefined, isFirst: boolean } => {
    const change = isFileA ? lineChanges.get(lineNum) : lineChangesB.get(lineNum)
    if (!change) return { diff: undefined, isFirst: false }
    
    const startLine = isFileA ? change.file_a_start_line : change.file_b_start_line
    const isFirst = startLine === lineNum
    
    return { diff: change, isFirst }
  }

  const getLineStyle = (
    changeType: string | undefined, 
    isAffected: boolean, 
    statementChangeType?: string
  ) => {
    // If there's a statement-level change, use that for more specific styling
    if (statementChangeType) {
      switch (statementChangeType) {
        case 'added':
          return { background: '#ccffd8', borderLeft: '4px solid #22863a' }
        case 'deleted':
          return { background: '#ffd7dc', borderLeft: '4px solid #d73a49' }
        case 'modified':
          return { background: '#ffe58f', borderLeft: '4px solid #f59e0b' }
        case 'moved':
          return { background: '#c7d2fe', borderLeft: '4px solid #6366f1' }
        default:
          break
      }
    }
    
    if (!isAffected || !changeType) {
      return { background: 'transparent', borderLeft: '3px solid transparent' }
    }

    switch (changeType) {
      case 'added':
        return { background: '#e6ffec', borderLeft: '3px solid #22863a' }
      case 'deleted':
        return { background: '#ffeef0', borderLeft: '3px solid #d73a49' }
      case 'modified':
        return { background: '#fff5b1', borderLeft: '3px solid #fbbf24' }
      case 'moved_modified':
        return { background: '#dbeafe', borderLeft: '3px solid #60a5fa' }
      case 'moved':
        return { background: '#e0e7ff', borderLeft: '3px solid #818cf8' }
      default:
        return { background: 'transparent', borderLeft: '3px solid transparent' }
    }
  }

  const getChangeBadge = (diff: Difference) => {
    const badges = {
      'added': { text: 'ADDED', color: '#22863a', bg: '#e6ffec' },
      'deleted': { text: 'DELETED', color: '#d73a49', bg: '#ffeef0' },
      'modified': { text: 'MODIFIED', color: '#f59e0b', bg: '#fff5b1' },
      'moved_modified': { text: 'MOVED & MODIFIED', color: '#3b82f6', bg: '#dbeafe' },
      'moved': { text: 'MOVED', color: '#6366f1', bg: '#e0e7ff' }
    }

    const badge = badges[diff.change_type as keyof typeof badges] || badges.modified

    let locationText = ''
    if (diff.change_type === 'moved' || diff.change_type === 'moved_modified') {
      locationText = ` (${diff.file_a_start_line}-${diff.file_a_end_line} → ${diff.file_b_start_line}-${diff.file_b_end_line})`
    } else if (diff.change_type === 'added') {
      locationText = ` at line ${diff.file_b_start_line}-${diff.file_b_end_line}`
    } else if (diff.change_type === 'deleted') {
      locationText = ` at line ${diff.file_a_start_line}-${diff.file_a_end_line}`
    } else {
      locationText = ` at lines ${diff.file_a_start_line}-${diff.file_a_end_line}`
    }

    return (
      <div style={{
        background: badge.bg,
        borderLeft: `4px solid ${badge.color}`,
        marginBottom: '4px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: '600',
          color: badge.color,
        }}>
          <span style={{
            background: badge.color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            marginRight: '8px',
            fontSize: '11px'
          }}>
            {badge.text}
          </span>
          <span style={{ fontWeight: '500' }}>
            {diff.block_type}: {diff.identifier}
          </span>
          <span style={{ fontWeight: '400', opacity: 0.8 }}>
            {locationText}
          </span>
          {diff.similarity_score > 0 && diff.similarity_score < 100 && (
            <span style={{ 
              marginLeft: '8px',
              background: 'rgba(0,0,0,0.1)',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '11px'
            }}>
              {diff.similarity_score.toFixed(1)}% similar
            </span>
          )}
        </div>
        
        {/* Show statement-level changes for modified/moved_modified blocks */}
        {diff.statement_diffs && diff.statement_diffs.length > 0 && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.03)',
            borderTop: `1px solid ${badge.color}`,
            fontSize: '11px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
              📝 Statement-level changes:
            </div>
            {renderRecursiveStatementDiffs(diff.statement_diffs, 0)}
          </div>
        )}
      </div>
    )
  }

  const renderRecursiveStatementDiffs = (statements: any[], level: number): React.ReactNode => {
    return statements.map((stmt, idx) => {
      const stmtIcon = 
        stmt.change_type === 'added' ? '➕' :
        stmt.change_type === 'deleted' ? '➖' :
        stmt.change_type === 'modified' ? '🔄' :
        stmt.change_type === 'moved' ? '↔️' :
        stmt.change_type === 'moved_modified' ? '🔄↔️' : '•'
      
      const stmtColor = 
        stmt.change_type === 'added' ? '#22863a' :
        stmt.change_type === 'deleted' ? '#d73a49' :
        stmt.change_type === 'modified' ? '#f59e0b' :
        stmt.change_type === 'moved' ? '#6366f1' :
        stmt.change_type === 'moved_modified' ? '#3b82f6' : '#9ca3af'
      
      const indentLeft = level * 12
      
      return (
        <div key={idx} style={{ marginLeft: `${indentLeft}px` }}>
          <div
            style={{
              padding: '4px 8px',
              marginBottom: '4px',
              background: 'white',
              borderLeft: `3px solid ${stmtColor}`,
              borderRadius: '3px',
              fontSize: '11px',
              color: '#1f2937',
              lineHeight: '1.4'
            }}
          >
            {/* Branch label with line movement */}
            {stmt.branch_label && (
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#6366f1',
                marginBottom: '2px',
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
              }}>
                🌿 {stmt.branch_label}
                {stmt.file_a_line && stmt.file_b_line && stmt.file_a_line !== stmt.file_b_line && (
                  <span style={{ marginLeft: '6px', color: '#8b5cf6', fontSize: '9px' }}>
                    (line {stmt.file_a_line} → {stmt.file_b_line})
                  </span>
                )}
              </div>
            )}
            
            {/* Icon and description with line info */}
            <div>
              <span style={{ marginRight: '4px' }}>{stmtIcon}</span>
              <span style={{ color: '#6b7280' }}>{stmt.description}</span>
              {!stmt.branch_label && stmt.file_a_line && stmt.file_b_line && stmt.file_a_line !== stmt.file_b_line && (
                <span style={{ 
                  marginLeft: '6px', 
                  color: '#8b5cf6', 
                  fontSize: '9px',
                  fontWeight: '600',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
                }}>
                  (line {stmt.file_a_line} → {stmt.file_b_line})
                </span>
              )}
            </div>
            
            {/* Old code vs new code comparison */}
            {stmt.old_code && stmt.code && stmt.old_code !== stmt.code && (
              <div style={{ marginTop: '4px', fontSize: '10px' }}>
                <div style={{ color: '#f87171', marginBottom: '2px' }}>
                  ❌ Old: <code style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", background: '#fee2e2', padding: '2px 4px', borderRadius: '2px' }}>{stmt.old_code.substring(0, 50)}{stmt.old_code.length > 50 ? '...' : ''}</code>
                </div>
                <div style={{ color: '#22863a' }}>
                  ✅ New: <code style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", background: '#dcfce7', padding: '2px 4px', borderRadius: '2px' }}>{stmt.code.substring(0, 50)}{stmt.code.length > 50 ? '...' : ''}</code>
                </div>
              </div>
            )}
            
            {/* Similarity score */}
            {stmt.similarity_score !== null && stmt.similarity_score !== undefined && (
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                📊 {(stmt.similarity_score * 100).toFixed(1)}% similar
              </div>
            )}
            
            {/* Is container indicator */}
            {stmt.is_container && (
              <div style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '2px' }}>
                📦 Container node
              </div>
            )}
          </div>
          
          {/* Render child diffs recursively */}
          {stmt.child_diffs && stmt.child_diffs.length > 0 && (
            <div style={{
              marginLeft: '8px',
              borderLeft: '2px dashed #d1d5db',
              paddingLeft: '6px',
              marginBottom: '4px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                ↳ Nested changes ({stmt.child_diffs.length}):
              </div>
              {renderRecursiveStatementDiffs(stmt.child_diffs, level + 1)}
            </div>
          )}
        </div>
      )
    })
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
            const { diff, isFirst } = getChangeInfo(lineNum, true)
            const stmtChange = statementChangesA.get(lineNum)
            
            return (
              <div key={index}>
                {isFirst && diff && (
                  <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    {getChangeBadge(diff)}
                  </div>
                )}
                <div style={{
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
                    {line || ' '}
                  </pre>
                  {stmtChange && (
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
                        stmtChange.type === 'modified' ? '#f59e0b' : '#6366f1',
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
                      {stmtChange.type === 'modified' && '🔄 MODIFIED'}
                      {(stmtChange.type === 'moved' || stmtChange.type === 'moved_modified') && (
                        <>
                          ↔️ MOVED
                          {stmtChange.targetLine && ` → ${stmtChange.targetLine}`}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* File B (Right) */}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          {linesB.map((line, index) => {
            const lineNum = index + 1
            const isAffected = affectedLinesB.has(lineNum)
            const { diff, isFirst } = getChangeInfo(lineNum, false)
            const stmtChange = statementChangesB.get(lineNum)
            
            return (
              <div key={index}>
                {isFirst && diff && (
                  <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    {getChangeBadge(diff)}
                  </div>
                )}
                <div style={{
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
                    {line || ' '}
                  </pre>
                  {stmtChange && (
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
                        stmtChange.type === 'modified' ? '#f59e0b' : '#6366f1',
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
                      {stmtChange.type === 'modified' && '🔄 MODIFIED'}
                      {(stmtChange.type === 'moved' || stmtChange.type === 'moved_modified') && (
                        <>
                          ↔️ MOVED
                          {stmtChange.sourceLine && ` ← ${stmtChange.sourceLine}`}
                        </>
                      )}
                    </div>
                  )}
                </div>
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

