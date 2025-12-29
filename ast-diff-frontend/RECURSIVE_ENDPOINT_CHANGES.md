# Frontend Updates for `/compare/recursive` Endpoint

## ✅ Changes Completed

### 1. **API Endpoint Updated** (`astDiffApi.ts`)
```typescript
// OLD: "https://...ngrok.../api/v1/compare"
// NEW: "https://...ngrok.../api/v1/compare/recursive"
```

### 2. **DiffViewer Component** (Route `/`)
Added recursive rendering function to handle nested statement diffs:

#### New Features:
- ✅ **Recursive child_diffs rendering** - Shows nested changes in tree structure
- ✅ **Branch labels display** - Shows if-else branch labels (e.g., `else_if((age <= 55))`)
- ✅ **Old code vs New code comparison** - Side-by-side before/after view
- ✅ **Similarity scores** - Shows percentage for modified statements
- ✅ **Indented tree structure** - Visual hierarchy for nested changes
- ✅ **Dashed lines** - Connects parent to child changes

#### Visual Example:
```
🌿 else_if((age <= 55))
Statement modified at index 0 (69% similar)
  ↳ Nested changes:
    ➕ expression_statement added
    ↔️ return statement moved from index 0 to 1
```

### 3. **BackendDiffViewer Component** (Route `/view-original`)
Added recursive rendering with compact inline display:

#### New Features:
- ✅ **Recursive child_diffs rendering** - Nested tree visualization
- ✅ **Branch labels** - Shows which if-else branch changed
- ✅ **Old/New code snippets** - Truncated inline comparison
- ✅ **Similarity scores** - Percentage display
- ✅ **Container indicators** - Shows if node contains children
- ✅ **Nested count badges** - Shows how many nested changes

#### Visual Example:
```
🔄 Statement modified at index 0 (69% similar)
📦 Container node
  ↳ Nested changes (4):
    🌿 else_if((age <= 55))
    🔄↔️ else_if moved and modified
      ↳ Nested changes (2):
        ➕ expression_statement added
        ↔️ return statement moved
```

## 🎨 New Visual Elements

### Icons:
- ➕ - Added
- ➖ - Deleted
- 🔄 - Modified
- ↔️ - Moved
- 🔄↔️ - Moved & Modified
- 🌿 - Branch label
- 📦 - Container node
- 📊 - Similarity score
- ↳ - Nested children indicator

### Color Coding:
| Change Type | Color | Usage |
|------------|-------|-------|
| Added | Green `#22863a` | New statements |
| Deleted | Red `#d73a49` | Removed statements |
| Modified | Yellow `#f59e0b` | Changed statements |
| Moved | Indigo `#6366f1` | Repositioned code |
| Moved & Modified | Blue `#3b82f6` | Moved + changed |

## 📊 Data Structure Handled

### Statement Diff Object (Recursive Format):
```typescript
{
  change_type: "moved_modified",
  code: "...",
  old_code: "...",                    // ✅ NEW - Shows original code
  node_type: "if_statement",
  description: "...",
  similarity_score: 0.69,             // ✅ NEW - Decimal format
  branch_label: "else_if((age <= 55))", // ✅ NEW - Branch identifier
  is_container: true,                 // ✅ NEW - Has children
  child_diffs: [                      // ✅ NEW - Recursive nested changes
    {
      change_type: "added",
      code: "...",
      child_diffs: []                 // ✅ Can nest infinitely
    }
  ]
}
```

## 🎯 Benefits of Recursive Format

### More Accurate Analysis:
- ✅ **23.5% similarity** vs 85.4% (more strict, more accurate)
- ✅ **Detects branch-level changes** in if-else structures
- ✅ **Tracks nested modifications** within containers
- ✅ **Shows exact position changes** (index 3 → 5)

### Better Visualization:
- ✅ **Tree structure** shows parent-child relationships
- ✅ **Branch labels** identify which condition changed
- ✅ **Nested indentation** clarifies hierarchy
- ✅ **Old vs New** comparison for modified code

### Example Difference:

**Simple Format:**
```
MODIFIED: 'if (age < 0) {...' (69% similar)
```

**Recursive Format:**
```
MODIFIED: if statement (69% similar)
  ↳ Nested changes (4):
    🌿 else_if((age <= 55))
    MOVED & MODIFIED: moved from position 5 to 3
      ↳ Nested changes (2):
        ADDED: console.log('Middle-aged Adult');
        MOVED: return statement from index 0 to 1
    🌿 else_if((age <= 19))
    MOVED: from position 3 to 5
```

## 🚀 Usage

Both routes now automatically use the recursive endpoint:

1. **Route `/`** - Shows block-level view with recursive statement details
2. **Route `/view-original`** - Shows line-by-line view with nested change tree

No additional configuration needed - just upload files and compare!

## 🔍 Testing

To verify it's working:
1. Upload two files with complex if-else structures
2. Look for:
   - Branch labels (🌿 else_if...)
   - Nested changes with indentation
   - Old vs New code comparisons
   - Similarity scores as percentages
   - "↳ Nested changes (N):" indicators

## 📝 Notes

- Tree depth is unlimited - handles infinite nesting
- Code snippets truncated to 50 chars in inline view
- Full code shown in main DiffViewer cards
- Indentation increases 12px per level (BackendDiffViewer)
- Indentation increases 16px per level (DiffViewer)

