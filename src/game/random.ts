export type RandomResult = {
  value: number
  nextState: number
}

// Mulberry32 PRNG
export function nextRandom(state: number): RandomResult {
  const nextState = (state + 0x6d2b79f5) >>> 0

  let value = nextState
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  value = ((value ^ (value >>> 14)) >>> 0) / 4294967296

  return { value, nextState }
}
