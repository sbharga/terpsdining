import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
const palette = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone'
const rules: Array<[RegExp, string]> = [
  [new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|outline|decoration|divide|from|via|to|shadow|accent|caret)-(?:${palette})-\\d{2,3}\\b`, 'g'), 'raw palette color; use a token class or hallTone() (docs/design.md#color)'],
  [/\b(?:bg|text|border|ring|fill)-\[#[0-9a-fA-F]+\]/g, 'arbitrary color; add a token in src/index.css'],
  [/\brounded-(?:sm|md|lg)\b|\brounded(?![-\w])/g, 'off-scale radius; use rounded-full, rounded-3xl, rounded-2xl, or rounded-xl'],
]
const allowed: Record<string, true> = { 'lib/theme.ts': true, 'lib/database.types.ts': true }
const failures: string[] = []
for (const file of await readdir('src', { recursive: true })) {
  const path = file.replaceAll('\\', '/')
  if (!/\.tsx?$/.test(path) || allowed[path]) continue
  const lines = (await readFile(join('src', file), 'utf8')).split('\n')
  lines.forEach((line, index) => {
    for (const [pattern, message] of rules) for (const match of line.matchAll(pattern)) failures.push(`src/${path}:${index + 1}: ${message}: ${match[0]}`)
  })
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('Design check passed.')
