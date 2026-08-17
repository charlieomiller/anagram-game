import { nextRandom } from './random'

export type letterResult = {
  letter: string
  nextRngState: number
}

export function generateNextLetter(
  letterPool: string[],
  rngState: number,
): letterResult {
  const randomResult = nextRandom(rngState)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomIndex = Math.floor(randomResult.value * alphabet.length)
  const letter = alphabet[randomIndex]
  return { letter: letter, nextRngState: randomResult.nextState }
}
