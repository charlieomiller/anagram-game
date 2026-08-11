import type { GameState, PlayerMove } from './types'
// pass in letter pool
// pass in played word (cleaned before submitted)
// check if word can be made from letters

// this will eventually need to be seeded
// alphabet should be an array of string weight pairs

export type GameEngine = ReturnType<typeof createGameEngine>

export function createGameEngine(dictionary: ReadonlySet<string>) {
  function submitWord(state: GameState, move: PlayerMove): GameState | null {
    state.selectedWords = move.selectedWords
    const remainingLetters = canBuildWordFromLetters(move.word, state)
    const isDictionaryWord = dictionary.has(move.word)
    console.log(remainingLetters, isDictionaryWord, move.word.length >= 3)

    if (!remainingLetters) return null
    if (!isDictionaryWord) return null
    if (!(move.word.length >= 3)) return null // Temporarily hard coded. Game modifiers/difficulty options will later determine this

    state.letterPool = remainingLetters
    state.playedWords.push({ id: state.nextWordId, word: move.word })

    state.nextWordId++
    console.log(state)

    return state
  }

  return {
    submitWord,
  }
}

export function generateInitialMeld(): string[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letters: string[] = []

  for (let index = 0; index < 100; index++) {
    // Temporarily hard coded. Game modifiers/difficulty options will later determine this
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    letters.push(alphabet[randomIndex])
  }

  return letters
}

// also seeded, we'll eventually want the passive generation on a timer. it should have a few rules
// if a letter has been flipped it should be weighted less. just not totally random i juess

export function canBuildWordFromLetters(
  word: string,
  state: Readonly<GameState>,
): string[] | null {
  if (word.length === 0) {
    return null
  }

  const remainingLetters = [...state.letterPool] // Makes a copy of letterPool

  for (const letter of word) {
    if (remainingLetters.includes(letter)) {
      remainingLetters.splice(remainingLetters.indexOf(letter), 1)
    } else {
      return null
    }
  }
  return remainingLetters
}
