export function pageWindow(current: number, total: number): (number | 'gap')[] {
  const visible = new Set([1, total])
  for (let page = Math.max(1, current - 1); page <= Math.min(total, current + 1); page++) visible.add(page)
  const pages = [...visible].filter(page => page >= 1 && page <= total).sort((a, b) => a - b)
  return pages.flatMap((page, index) => index > 0 && page - pages[index - 1] > 1 ? ['gap', page] : [page])
}
