/**
 * Generate code-index.yaml from JSDoc comments and Python docstrings
 *
 * Scans all TypeScript (.ts/.tsx) and Python (.py) files, extracts
 * function/type/class documentation, and builds code-index.yaml.
 *
 * Usage: ts-node scripts/generate-code-index.ts
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface CodeEntry {
  description: string
  file: string
  line: number
  type: 'function' | 'type' | 'component' | 'class'
  signature?: string
  tags?: string[]
  [key: string]: unknown
}

const rootDir = path.resolve(__dirname, '../../../..')

/**
 * Extract JSDoc comments from TypeScript files
 */
function extractTypeScriptDocs(filePath: string): CodeEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const entries: CodeEntry[] = []

  // Match JSDoc blocks followed by export statements
  const jsdocPattern = /\/\*\*\s*([\s\S]*?)\*\/\s*export\s+((?:type|function|const|default function|interface)\s+(\w+))/g

  let match
  while ((match = jsdocPattern.exec(content)) !== null) {
    const jsdocText = match[1]
    const declaration = match[2]
    const name = match[3]

    // Get line number
    const lineNum = content.substring(0, match.index).split('\n').length

    // Extract description (first line after /** that isn't a tag)
    const descMatch = jsdocText.match(/^\s*\*\s*(.+?)(?=\n|$)/m)
    const description = descMatch ? descMatch[1].trim() : ''

    // Detect type
    let type: 'function' | 'type' | 'component' = 'function'
    if (declaration.includes('type ')) type = 'type'
    if (declaration.includes('function') && filePath.includes('app/')) type = 'component'

    entries.push({
      name,
      description,
      file: path.relative(rootDir, filePath),
      line: lineNum,
      type,
      signature: declaration.split('\n')[0],
    })
  }

  return entries
}

/**
 * Extract docstrings from Python files
 */
function extractPythonDocs(filePath: string): CodeEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const entries: CodeEntry[] = []

  // Match function/class definitions followed by docstrings
  const pythonPattern = /^(async\s+)?def\s+(\w+)\s*\([^)]*\)\s*->\s*[^:]*:\s*"""([\s\S]*?)"""/gm

  let match
  while ((match = pythonPattern.exec(content)) !== null) {
    const isAsync = match[1]
    const name = match[2]
    const docstring = match[3]

    // Get line number
    const lineNum = content.substring(0, match.index).split('\n').length

    // Extract first line as description
    const descMatch = docstring.match(/^(.*?)(?:\n|$)/)
    const description = descMatch ? descMatch[1].trim() : ''

    entries.push({
      name,
      description,
      file: path.relative(rootDir, filePath),
      line: lineNum,
      type: 'function',
      signature: `${isAsync ? 'async ' : ''}def ${name}(...)`,
    })
  }

  return entries
}

/**
 * Recursively find all TypeScript and Python files
 */
function findSourceFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []

  function walk(current: string) {
    if (!fs.existsSync(current)) return

    const entries = fs.readdirSync(current, { withFileTypes: true })

    for (const entry of entries) {
      // Skip common ignored directories
      if (['node_modules', '.git', 'dist', 'build', '__pycache__', '.pytest_cache'].includes(entry.name)) {
        continue
      }

      const fullPath = path.join(current, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

/**
 * Build YAML string from entries
 */
function buildYaml(entries: CodeEntry[]): string {
  const lines: string[] = [
    '# Eagle Education Code Index v2.2',
    '# Auto-generated from JSDoc and docstrings',
    '# Generated: ' + new Date().toISOString(),
    '',
    'functions:',
  ]

  const functions = entries.filter(e => e.type === 'function')
  const types = entries.filter(e => e.type === 'type')
  const components = entries.filter(e => e.type === 'component')

  // Functions section
  for (const entry of functions) {
    lines.push(`  ${entry.name}:`)
    lines.push(`    description: "${entry.description || 'No description available'}"`)
    lines.push(`    file: "${entry.file}"`)
    lines.push(`    line: ${entry.line}`)
    lines.push(`    type: "${entry.type}"`)
    if (entry.signature) {
      lines.push(`    signature: "${entry.signature}"`)
    }
  }

  // Types section
  if (types.length > 0) {
    lines.push('')
    lines.push('types:')
    for (const entry of types) {
      lines.push(`  ${entry.name}:`)
      lines.push(`    description: "${entry.description || 'No description available'}"`)
      lines.push(`    file: "${entry.file}"`)
      lines.push(`    line: ${entry.line}`)
      lines.push(`    type: "${entry.type}"`)
      if (entry.signature) {
        lines.push(`    signature: "${entry.signature}"`)
      }
    }
  }

  // Components section
  if (components.length > 0) {
    lines.push('')
    lines.push('components:')
    for (const entry of components) {
      lines.push(`  ${entry.name}:`)
      lines.push(`    description: "${entry.description || 'No description available'}"`)
      lines.push(`    file: "${entry.file}"`)
      lines.push(`    line: ${entry.line}`)
      lines.push(`    type: "${entry.type}"`)
      if (entry.signature) {
        lines.push(`    signature: "${entry.signature}"`)
      }
    }
  }

  lines.push('')
  lines.push('metadata:')
  lines.push(`  version: "2.2"`)
  lines.push(`  generated: "${new Date().toISOString()}"`)
  lines.push(`  total_entries: ${entries.length}`)
  lines.push(`  functions: ${functions.length}`)
  lines.push(`  types: ${types.length}`)
  lines.push(`  components: ${components.length}`)

  return lines.join('\n')
}

/**
 * Main entry point
 */
function main() {
  console.log('🔍 Scanning source files for JSDoc/docstrings...')

  const tsFiles = findSourceFiles(path.join(rootDir, 'packages'), ['.ts', '.tsx'])
  const webFiles = findSourceFiles(path.join(rootDir, 'apps/web'), ['.tsx'])
  const pyFiles = findSourceFiles(path.join(rootDir, 'apps/api'), ['.py'])

  console.log(`Found ${tsFiles.length} TypeScript files`)
  console.log(`Found ${webFiles.length} React files`)
  console.log(`Found ${pyFiles.length} Python files`)

  const allFiles = [...tsFiles, ...webFiles, ...pyFiles]
  const entries: CodeEntry[] = []

  // Extract from TypeScript/React files
  for (const file of [...tsFiles, ...webFiles]) {
    try {
      const docs = extractTypeScriptDocs(file)
      entries.push(...docs)
    } catch (e) {
      console.warn(`⚠️ Error parsing ${file}:`, (e as Error).message)
    }
  }

  // Extract from Python files
  for (const file of pyFiles) {
    try {
      const docs = extractPythonDocs(file)
      entries.push(...docs)
    } catch (e) {
      console.warn(`⚠️ Error parsing ${file}:`, (e as Error).message)
    }
  }

  console.log(`✅ Found ${entries.length} documented entries`)

  // Build YAML
  const yaml = buildYaml(entries)

  // Write to code-index.yaml
  const outputPath = path.join(__dirname, '../code-index.yaml')
  fs.writeFileSync(outputPath, yaml, 'utf-8')

  console.log(`✅ Generated code-index.yaml (${outputPath})`)
  console.log(`📊 Summary:`)
  console.log(`   - Functions: ${entries.filter(e => e.type === 'function').length}`)
  console.log(`   - Types: ${entries.filter(e => e.type === 'type').length}`)
  console.log(`   - Components: ${entries.filter(e => e.type === 'component').length}`)
}

main()
