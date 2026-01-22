export interface AstDiffResponse {
    message: string
    file_a: FileInfo
    file_b: FileInfo
    summary: Summary
    differences: Difference[]
  }
  
  export interface FileInfo {
    file_uuid: string
    original_filename: string
    total_lines: number
    function_count: number
    formatted_content: string
  }
  
  export interface Summary {
    is_identical: boolean
    structural_similarity: number
    total_blocks_a: number
    total_blocks_b: number
    blocks_added: number
    blocks_deleted: number
    blocks_modified: number
    blocks_moved: number
    blocks_unchanged: number
  }
  
  export interface Difference {
    change_type: string
    block_type: string
    identifier: string
    file_a_start_line: number | null
    file_a_end_line: number | null
    file_a_code: string | null
    file_b_start_line: number | null
    file_b_end_line: number | null
    file_b_code: string | null
    similarity_score: number
    description: string
    statement_diffs: StatementDiff[]
    keyword_changes?: Array<{
      old_token: string
      new_token: string
      old_start: number
      old_end: number
      new_start: number
      new_end: number
    }>
  }
  
export interface StatementDiff {
  change_type: string
  code: string
  node_type: string
  file_a_line?: number | null
  file_a_start_line?: number | null
  file_a_end_line?: number | null
  file_a_index: number | null
  file_b_line?: number | null
  file_b_start_line?: number | null
  file_b_end_line?: number | null
  file_b_index: number | null
  description: string
  old_code: string | null
  similarity_score: number | null
  child_diffs: StatementDiff[]
  is_container: boolean
  branch_label: string | null
  keyword_changes?: Array<{
    old_token: string
    new_token: string
    old_start: number
    old_end: number
    new_start: number
    new_end: number
  }>
}
  