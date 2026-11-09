export type DirectoryItem = { id: string; name: string }
export type DirectoryGroup = { letter: string; items: DirectoryItem[] }

function initial(name: string): string {
  const letter = name.trim().normalize('NFD').charAt(0).toUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : '#'
}

export function groupByInitial(items: DirectoryItem[]): DirectoryGroup[] {
  const groups = new Map<string, DirectoryItem[]>()
  for (const item of items) {
    const letter = initial(item.name)
    const group = groups.get(letter)
    if (group) group.push(item)
    else groups.set(letter, [item])
  }
  const compare = (a: DirectoryItem, b: DirectoryItem) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id)
  return Array.from(groups, ([letter, list]) => ({ letter, items: list.sort(compare) }))
    .sort((a, b) => (a.letter === '#' ? 1 : b.letter === '#' ? -1 : a.letter.localeCompare(b.letter)))
}
