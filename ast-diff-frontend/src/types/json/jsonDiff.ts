export interface JsonDiffResponse {
  message: string
  file_a: JsonFileInfo
  file_b: JsonFileInfo
  summary: JsonSummary
  differences: JsonDifference[]
}

export interface JsonFileInfo {
  file_uuid: string
  original_filename: string
  total_lines: number
  element_count: number
  formatted_content: string
}

export interface JsonSummary {
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

export interface JsonDifference {
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
  statement_diffs: JsonStatementDiff[]
}

export interface JsonStatementDiff {
  change_type: string
  code: string
  node_type: string
  file_a_line?: number | null
  file_a_index?: number | null
  file_a_start_line?: number | null
  file_a_end_line?: number | null
  file_b_line?: number | null
  file_b_index?: number | null
  file_b_start_line?: number | null
  file_b_end_line?: number | null
  description: string
  old_code: string | null
  similarity_score: number | null
  child_diffs: JsonStatementDiff[]
  is_container: boolean
  branch_label: string | null
  old_index?: number | null
  new_index?: number | null
}


