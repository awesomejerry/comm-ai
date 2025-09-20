export type Presentation = {
  id: string
  title?: string
  pageCount: number
  thumbnailCache?: Record<number, string>
}

export function validatePresentation(p: Presentation) {
  if (!p || typeof p.pageCount !== 'number') return false
  return p.pageCount >= 1
}
