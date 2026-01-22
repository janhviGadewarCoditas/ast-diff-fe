import type { Difference } from "../types/astDiff"

interface BackendDiffViewerProps {
  differences: Difference[]
  fileAContent: string
  fileBContent: string
  fileAName: string
  fileBName: string
}

// Helper component to highlight specific token-level changes in a JavaScript line
function HighlightedLine({ 
  line, 
  keywordChanges,
  isFileA 
}: { 
  line: string
  keywordChanges?: Array<{ old_token: string, new_token: string, old_start: number, old_end: number, new_start: number, new_end: number }>
  isFileA: boolean
}) {
  if (!keywordChanges || keywordChanges.length === 0) {
    return <>{line}</>
  }

  const highlightStyle = { 
    background: '#fef08a', 
    color: '#854d0e', 
    fontWeight: '600' as const, 
    padding: '0 2px', 
    borderRadius: '2px' 
  }

  // Collect all tokens to search for
  const tokensToFind: string[] = []
  for (const change of keywordChanges) {
    const token = isFileA ? change.old_token : change.new_token
    tokensToFind.push(token)
  }

  // Find positions of all tokens in the line
  const highlightPositions: Array<{ start: number, end: number }> = []
  const usedPositions = new Set<string>() // Track "start-end" to avoid duplicates
  
  for (const token of tokensToFind) {
    // Find all occurrences of this token in the line
    let searchStart = 0
    while (searchStart < line.length) {
      const index = line.indexOf(token, searchStart)
      if (index === -1) break
      
      const posKey = `${index}-${index + token.length}`
      if (!usedPositions.has(posKey)) {
        highlightPositions.push({
          start: index,
          end: index + token.length
        })
        usedPositions.add(posKey)
        break // Only highlight first occurrence of each token
      }
      
      searchStart = index + 1
    }
  }

  // Sort and merge overlapping positions
  highlightPositions.sort((a, b) => a.start - b.start)
  const mergedPositions: Array<{ start: number, end: number }> = []
  for (const pos of highlightPositions) {
    if (mergedPositions.length === 0) {
      mergedPositions.push({ start: pos.start, end: pos.end })
    } else {
      const last = mergedPositions[mergedPositions.length - 1]
      if (pos.start <= last.end) {
        last.end = Math.max(last.end, pos.end)
      } else {
        mergedPositions.push({ start: pos.start, end: pos.end })
      }
    }
  }

  // Build segments based on merged positions
  const segments: Array<{ text: string, highlight: boolean }> = []
  let currentPos = 0
  
  for (const pos of mergedPositions) {
    // Add unhighlighted text before this position
    if (pos.start > currentPos) {
      segments.push({
        text: line.substring(currentPos, pos.start),
        highlight: false
      })
    }
    // Add highlighted text
    segments.push({
      text: line.substring(pos.start, pos.end),
      highlight: true
    })
    currentPos = pos.end
  }
  
  // Add any remaining unhighlighted text
  if (currentPos < line.length) {
    segments.push({
      text: line.substring(currentPos),
      highlight: false
    })
  }

  return (
    <>
      {segments.map((segment, idx) => 
        segment.highlight ? (
          <span key={idx} style={highlightStyle}>{segment.text}</span>
        ) : (
          <span key={idx}>{segment.text}</span>
        )
      )}
    </>
  )
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
  const statementChangesA = new Map<number, { type: string, description: string, targetLine?: number, sourceLine?: number, keywordChanges?: any[] }>()
  const statementChangesB = new Map<number, { type: string, description: string, targetLine?: number, sourceLine?: number, keywordChanges?: any[] }>()

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
    
    // Map statement-level diffs to specific lines (parent-first, then children)
    const mapStatementDiffsRecursively = (stmtDiffs: any[]) => {
      stmtDiffs.forEach(stmtDiff => {
        // Process PARENT FIRST - this ensures moved_modified blocks set their blue background
        // Check if this statement diff has line range properties
        const hasLineRange = stmtDiff.file_a_start_line !== undefined || stmtDiff.file_b_start_line !== undefined
        
        if (hasLineRange) {
          // Handle line ranges for moved, added, deleted, modified items
          if (stmtDiff.file_a_start_line && stmtDiff.file_a_end_line) {
            const startLine = stmtDiff.file_a_start_line
            const endLine = stmtDiff.file_a_end_line
            for (let i = startLine; i <= endLine; i++) {
              const existing = statementChangesA.get(i)
              
              if (!existing) {
                // Line not set yet, set it now
                statementChangesA.set(i, {
                  type: stmtDiff.change_type,
                  description: stmtDiff.description,
                  targetLine: i === startLine ? stmtDiff.file_b_start_line : undefined,
                  sourceLine: startLine,
                  keywordChanges: stmtDiff.keyword_changes
                })
              } else if (stmtDiff.change_type === 'modified' && existing.type === 'moved_modified') {
                // Child modified within moved_modified parent: keep parent type, add child keyword_changes
                if (stmtDiff.keyword_changes) {
                  existing.keywordChanges = stmtDiff.keyword_changes
                }
              } else if (stmtDiff.change_type === 'added' || stmtDiff.change_type === 'deleted') {
                // Added/deleted children should override parent styling
                statementChangesA.set(i, {
                  type: stmtDiff.change_type,
                  description: stmtDiff.description,
                  targetLine: i === startLine ? stmtDiff.file_b_start_line : undefined,
                  sourceLine: startLine,
                  keywordChanges: stmtDiff.keyword_changes
                })
              }
            }
          }
          
          if (stmtDiff.file_b_start_line && stmtDiff.file_b_end_line) {
            const startLine = stmtDiff.file_b_start_line
            const endLine = stmtDiff.file_b_end_line
            for (let i = startLine; i <= endLine; i++) {
              const existing = statementChangesB.get(i)
              
              if (!existing) {
                // Line not set yet, set it now
                statementChangesB.set(i, {
                  type: stmtDiff.change_type,
                  description: stmtDiff.description,
                  sourceLine: i === startLine ? stmtDiff.file_a_start_line : undefined,
                  targetLine: startLine,
                  keywordChanges: stmtDiff.keyword_changes
                })
              } else if (stmtDiff.change_type === 'modified' && existing.type === 'moved_modified') {
                // Child modified within moved_modified parent: keep parent type, add child keyword_changes
                if (stmtDiff.keyword_changes) {
                  existing.keywordChanges = stmtDiff.keyword_changes
                }
              } else if (stmtDiff.change_type === 'added' || stmtDiff.change_type === 'deleted') {
                // Added/deleted children should override parent styling
                statementChangesB.set(i, {
                  type: stmtDiff.change_type,
                  description: stmtDiff.description,
                  sourceLine: i === startLine ? stmtDiff.file_a_start_line : undefined,
                  targetLine: startLine,
                  keywordChanges: stmtDiff.keyword_changes
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
              sourceLine: stmtDiff.file_a_line,
              keywordChanges: stmtDiff.keyword_changes
            })
          }
          if (stmtDiff.file_b_line && !statementChangesB.has(stmtDiff.file_b_line)) {
            statementChangesB.set(stmtDiff.file_b_line, {
              type: stmtDiff.change_type,
              description: stmtDiff.description,
              sourceLine: stmtDiff.file_a_line,
              targetLine: stmtDiff.file_b_line,
              keywordChanges: stmtDiff.keyword_changes
            })
          }
        }
        
        // Process child diffs AFTER parent is set
        const hasChildren = stmtDiff.child_diffs && stmtDiff.child_diffs.length > 0
        if (hasChildren) {
          mapStatementDiffsRecursively(stmtDiff.child_diffs)
        }
      })
    }
    
    // ALWAYS process statement_diffs if they exist
    if (diff.statement_diffs && diff.statement_diffs.length > 0) {
      mapStatementDiffsRecursively(diff.statement_diffs)
    }
    
    // Also process keyword_changes from the top-level difference object itself
    // This handles cases where the entire block has keyword changes (e.g., moved_modified blocks)
    if (diff.keyword_changes && diff.keyword_changes.length > 0) {
      // Map keyword changes to File A lines
      if (diff.file_a_start_line && diff.file_a_end_line) {
        for (let i = diff.file_a_start_line; i <= diff.file_a_end_line; i++) {
          const existing = statementChangesA.get(i)
          if (existing) {
            // Add keyword changes to existing entry
            existing.keywordChanges = diff.keyword_changes
          } else {
            // Create new entry with keyword changes
            statementChangesA.set(i, {
              type: diff.change_type,
              description: diff.description,
              targetLine: i === diff.file_a_start_line ? (diff.file_b_start_line ?? undefined) : undefined,
              sourceLine: diff.file_a_start_line,
              keywordChanges: diff.keyword_changes
            })
          }
        }
      }
      
      // Map keyword changes to File B lines
      if (diff.file_b_start_line && diff.file_b_end_line) {
        for (let i = diff.file_b_start_line; i <= diff.file_b_end_line; i++) {
          const existing = statementChangesB.get(i)
          if (existing) {
            // Add keyword changes to existing entry
            existing.keywordChanges = diff.keyword_changes
          } else {
            // Create new entry with keyword changes
            statementChangesB.set(i, {
              type: diff.change_type,
              description: diff.description,
              sourceLine: i === diff.file_b_start_line ? (diff.file_a_start_line ?? undefined) : undefined,
              targetLine: diff.file_b_start_line,
              keywordChanges: diff.keyword_changes
            })
          }
        }
      }
    }
    
    // For added/moved/moved_modified blocks without statement_diffs, show the block-level badge
    const hasStatementDiffs = diff.statement_diffs && diff.statement_diffs.length > 0
    const shouldShowBlockLevelBadge = (diff.change_type === 'added' && !hasStatementDiffs) || 
                                      diff.change_type === 'moved' || 
                                      diff.change_type === 'moved_modified'
    
    if (shouldShowBlockLevelBadge) {
      // Set the block-level change on the start lines (will be overridden if child has more specific change)
      if (diff.file_a_start_line && !statementChangesA.has(diff.file_a_start_line)) {
        statementChangesA.set(diff.file_a_start_line, {
          type: diff.change_type,
          description: diff.description,
          targetLine: diff.file_b_start_line || undefined,
          sourceLine: diff.file_a_start_line,
          keywordChanges: undefined
        })
      }
      if (diff.file_b_start_line && !statementChangesB.has(diff.file_b_start_line)) {
        statementChangesB.set(diff.file_b_start_line, {
          type: diff.change_type,
          description: diff.description,
          sourceLine: diff.file_a_start_line || undefined,
          targetLine: diff.file_b_start_line,
          keywordChanges: undefined
        })
      }
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
          return { background: '#e6ffed', borderLeft: '3px solid #22863a' }
        case 'deleted':
          return { background: '#ffeef0', borderLeft: '3px solid #d73a49' }
        case 'moved':
        case 'moved_modified':
          return { background: '#e0f2fe', borderLeft: '3px solid #0284c7' }
      }
    }
    
    if (!isAffected || !changeType) {
      return { background: 'white', borderLeft: '3px solid transparent' }
    }

    switch (changeType) {
      case 'added':
        return { background: '#e6ffed', borderLeft: '3px solid #22863a' }
      case 'deleted':
        return { background: '#ffeef0', borderLeft: '3px solid #d73a49' }
      case 'moved_modified':
        return { background: '#e0f2fe', borderLeft: '3px solid #0284c7' }
      case 'moved':
        return { background: '#e0f2fe', borderLeft: '3px solid #0284c7' }
      default:
        // For modified and others, no special background - just show keyword highlights
        return { background: 'white', borderLeft: '3px solid transparent' }
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
      </div>
    )
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
                    {stmtChange && (stmtChange.type === 'modified' || stmtChange.type === 'moved_modified') && stmtChange.keywordChanges
                      ? <HighlightedLine 
                          line={line} 
                          keywordChanges={stmtChange.keywordChanges}
                          isFileA={true}
                        />
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
                    {stmtChange && (stmtChange.type === 'modified' || stmtChange.type === 'moved_modified') && stmtChange.keywordChanges
                      ? <HighlightedLine 
                          line={line} 
                          keywordChanges={stmtChange.keywordChanges}
                          isFileA={false}
                        />
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

