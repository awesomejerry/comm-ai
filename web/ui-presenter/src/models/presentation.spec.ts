import { describe, it, expect } from 'vitest'
import { validatePresentation } from './presentation'

describe('validatePresentation', () => {
  it('rejects empty or invalid', () => {
    expect(validatePresentation({} as any)).toBe(false)
  })
  it('accepts valid', () => {
    expect(validatePresentation({ id: 'p1', pageCount: 3 })).toBe(true)
  })
})
