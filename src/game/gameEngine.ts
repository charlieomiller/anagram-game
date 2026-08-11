import type { GameState, PlayerMove } from './types'
// pass in letter pool
// pass in played word (cleaned before submitted)
// check if word can be made from letters

// this will eventually need to be seeded
// alphabet should be an array of string weight pairs

export type GameEngine = ReturnType<typeof createGameEngine>

export function createGameEngine(dictionary: ReadonlySet<string>) {
  function submitWord(
    state: GameState,
    move: Readonly<PlayerMove>,
  ): GameState | null {
    const remainingLetters = canBuildWordFromLetters(state, move)
    const isDictionaryWord = dictionary.has(move.word)
    console.log(remainingLetters, isDictionaryWord, move.word.length >= 3)

    if (!remainingLetters) return null
    if (!isDictionaryWord) return null
    if (!(move.word.length >= 3)) return null // Temporarily hard coded. Game modifiers/difficulty options will later determine this

    state.letterPool = remainingLetters
    state.playedWords = state.playedWords.filter(
      (word) => !move.selectedWords.includes(word),
    )
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

  for (let index = 0; index < 500; index++) {
    // Temporarily hard coded. Game modifiers/difficulty options will later determine this
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    letters.push(alphabet[randomIndex])
  }

  return letters
}

// also seeded, we'll eventually want the passive generation on a timer. it should have a few rules
// if a letter has been flipped it should be weighted less. just not totally random i juess

export function canBuildWordFromLetters(
  state: Readonly<GameState>,
  move: Readonly<PlayerMove>,
): string[] | null {
  if (move.word.length === 0) {
    return null
  }

  const remainingLetters = [...state.letterPool] // Makes a copy of letterPool
  const selectedWordLetterPool = []

  if (move.selectedWords.length > 0) {
    for (const selectedWord of move.selectedWords) {
      for (const letter of selectedWord.word) {
        selectedWordLetterPool.push(letter)
      }
    }
  }

  console.log(selectedWordLetterPool)

  const inputLetters = [...move.word]
  console.log(inputLetters)

  // the move.word must contain ALL LETTERS in selectedwordletterpool, and 1 or more in letterpool
  for (const letter of move.word) {
    if (selectedWordLetterPool.includes(letter)) {
      selectedWordLetterPool.splice(selectedWordLetterPool.indexOf(letter), 1)
      inputLetters.splice(inputLetters.indexOf(letter), 1)
    }
  }

  console.log(inputLetters)

  if (selectedWordLetterPool.length > 0) return null // Remaining unused letters in the selected words
  if (inputLetters.length <= 0) return null // Input word does not contain any letters from the central letter pool

  for (const letter of inputLetters) {
    if (remainingLetters.includes(letter)) {
      remainingLetters.splice(remainingLetters.indexOf(letter), 1)
    } else {
      return null // Central letter pool does not contain necessary letter for word
    }
  }
  return remainingLetters
}
