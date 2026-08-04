// pass in letter pool
// pass in played word (cleaned before submitted)
// check if word can be made from letters

// this will eventually need to be seeded
// alphabet should be an array of string weight pairs
export function generateInitialMeld(): string[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letters: string[] = []

  for (let index = 0; index < 5; index++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    letters.push(alphabet[randomIndex])
  }

  return letters
}

// also seeded, we'll eventually want the passive generation on a timer. it should have a few rules
// if a letter has been flipped it should be weighted less. just not totally random i juess

export function canBuildWordFromLetters(
  word: string,
  letterPool: readonly string[],
): boolean {
  if (word.length === 0) {
    return false
  }

  const remainingLetters = [...letterPool] // Makes a copy of letterPool

  for (const letter of word) {
    if (remainingLetters.includes(letter)) {
      remainingLetters.splice(remainingLetters.indexOf(letter), 1)
    } else {
      return false
    }
  }
  return true
}
