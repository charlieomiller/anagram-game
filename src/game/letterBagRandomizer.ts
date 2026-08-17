import { nextRandom } from './random'

export type letterResult = {
  letter: string
  nextRngState: number
  newLetterBag: readonly string[]
}

// Fisher-Yates shuffle
export function shuffleLetterBag(
  startLetterBag: readonly string[],
  seed: number,
): readonly string[] {
  const shuffledLetterBag = [...startLetterBag]
  let rngState = seed
  console.log(shuffledLetterBag)
  for (let index = shuffledLetterBag.length - 1; index > 0; index--) {
    const randomResult = nextRandom(rngState)
    rngState = randomResult.nextState

    const randomIndex = Math.floor(randomResult.value * (index + 1))

    const temp = shuffledLetterBag[index]
    shuffledLetterBag[index] = shuffledLetterBag[randomIndex]
    shuffledLetterBag[randomIndex] = temp
  }

  return shuffledLetterBag
}
