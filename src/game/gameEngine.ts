import type {
  PlayedWord,
  GameState,
  PlayerMove,
  MoveResult,
  LetterUsageResult,
} from './types'
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
  ): MoveResult {
    const word = move.word.trim().toUpperCase() // Incase React fails in cleaning the input

    if (!(word.length >= 3)) return { success: false, reason: 'WORD_TOO_SHORT' } // Temporarily hard coded. Game modifiers/difficulty options will later determine this

    const selectedWords = state.playedWords.filter((playedWord) =>
      move.selectedWordIds.includes(playedWord.id),
    )

    const remainingLetters = getRemainingLettersForMove(
      state,
      word,
      selectedWords,
    )
    const isDictionaryWord = dictionary.has(word)
    console.log(remainingLetters, isDictionaryWord, word.length >= 3)

    // Determine it is not of type string[], then ensure it is false. must include the else so typescript knows that remainingLetters is a string[]
    if (remainingLetters.success === false) {
      return remainingLetters
    }

    if (!isDictionaryWord)
      return { success: false, reason: 'WORD_NOT_IN_DICTIONARY' }

    const remainingPlayedWords = state.playedWords.filter(
      (playedWord) => !move.selectedWordIds.includes(playedWord.id),
    )

    remainingPlayedWords.push({ id: state.nextWordId, word: word })

    return {
      success: true,
      gameState: {
        ...state,
        letterPool: remainingLetters.remainingLetters,
        playedWords: remainingPlayedWords,
        nextWordId: state.nextWordId + 1,
      },
    }
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

export function getRemainingLettersForMove(
  state: Readonly<GameState>,
  word: string,
  selectedWords: readonly PlayedWord[],
): LetterUsageResult {
  const remainingLetters = [...state.letterPool] // Makes a copy of letterPool
  const selectedWordLetterPool: string[] = []

  if (selectedWords.length > 0) {
    for (const selectedWord of selectedWords) {
      for (const letter of selectedWord.word) {
        selectedWordLetterPool.push(letter)
      }
    }
  }

  console.log(selectedWordLetterPool)

  const remainingInputLetters = [...word]
  console.log(remainingInputLetters)

  // the move.word must contain ALL LETTERS in selectedwordletterpool, and 1 or more in letterpool
  for (const letter of word) {
    if (selectedWordLetterPool.includes(letter)) {
      selectedWordLetterPool.splice(selectedWordLetterPool.indexOf(letter), 1)
      remainingInputLetters.splice(remainingInputLetters.indexOf(letter), 1)
    }
  }

  console.log(remainingInputLetters)

  if (selectedWordLetterPool.length > 0)
    return {
      success: false,
      reason: 'WORD_DOES_NOT_USE_ALL_LETTERS_IN_SELECTED_WORDS',
    } // Remaining unused letters in the selected words
  if (remainingInputLetters.length <= 0)
    return {
      success: false,
      reason: 'WORD_DOES_NOT_ADD_ANY_LETTERS_FROM_LETTERPOOL',
    } // Input word does not contain any letters from the central letter pool

  for (const letter of remainingInputLetters) {
    if (remainingLetters.includes(letter)) {
      remainingLetters.splice(remainingLetters.indexOf(letter), 1)
    } else {
      return { success: false, reason: 'NEEDED_LETTERS_NOT_IN_LETTERPOOL' } // Central letter pool does not contain necessary letter for word
    }
  }
  return {
    success: true,
    remainingLetters: remainingLetters,
  }
}
