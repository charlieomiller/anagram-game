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
    state: Readonly<GameState>,
    move: Readonly<PlayerMove>,
  ): MoveResult {
    const word = move.word.trim().toUpperCase() // Incase React fails in cleaning the input

    if (word.length === 0) return { success: false, reason: 'NO_WORD_ENTERED' }

    if (word.length < state.gameRules.minWordLength)
      return { success: false, reason: 'WORD_TOO_SHORT' }

    // All words across Played Words and Stolen Words are selectable
    const selectedWords = [...state.playedWords, ...state.stolenWords].filter(
      (playedWord) => move.selectedWordIds.includes(playedWord.id),
    )

    if (selectedWords.length !== move.selectedWordIds.length) {
      return {
        success: false,
        reason: 'INVALID_SELECTED_WORD',
      }
    }

    const remainingLetters = getRemainingLettersForMove(
      state,
      word,
      selectedWords,
    )
    const isDictionaryWord = dictionary.has(word)

    // Determine it is not of type string[], then ensure it is false. must include the else so typescript knows that remainingLetters is a string[]
    if (remainingLetters.success === false) {
      return remainingLetters
    }

    if (!isDictionaryWord)
      return { success: false, reason: 'WORD_NOT_IN_DICTIONARY' }

    const remainingPlayedWords = state.playedWords.filter(
      (playedWord) => !move.selectedWordIds.includes(playedWord.id),
    )

    const remainingStolenWords = state.stolenWords.filter(
      (playedWord) => !move.selectedWordIds.includes(playedWord.id),
    )

    remainingPlayedWords.unshift({ id: state.nextWordId, word: word })

    return {
      success: true,
      gameState: {
        ...state,
        letterPool: remainingLetters.remainingLetters,
        playedWords: remainingPlayedWords,
        stolenWords: remainingStolenWords,
        nextWordId: state.nextWordId + 1,
      },
    }
  }

  function flipTile(state: Readonly<GameState>): GameState {
    const letters = [...state.letterPool]
    const newTileFlipCount = state.tileFlipCount + 1

    if (newTileFlipCount > state.gameRules.totalTileFlipCount) {
      letters.pop()
      return {
        ...state,
        letterPool: letters,
        tileFlipCount: newTileFlipCount,
      }
    }

    // Add new letter and remove oldest if letter pool is at max capacity
    const newLetter = getRandomLetter()
    letters.unshift(newLetter)
    if (letters.length > state.gameRules.maxLetterPoolCapacity) {
      letters.pop()
    }

    // Take a word from the player and put it in holding every X tile flips
    if (newTileFlipCount % state.gameRules.wordStealIntervalFlips === 0) {
      const newPlayedWords = [...state.playedWords]
      const newStolenWords = [...state.stolenWords]

      const stolenWord = newPlayedWords.pop()
      // If there were any played words to steal
      if (stolenWord) {
        newStolenWords.unshift(stolenWord)
        if (newStolenWords.length > state.gameRules.maxWordStealCapacity) {
          newStolenWords.pop()
        }
        console.log('WORD STEAL')
      } else {
        console.log('NO PLAYED WORDS TO STEAL')
      }

      return {
        ...state,
        letterPool: letters,
        playedWords: newPlayedWords,
        stolenWords: newStolenWords,
        tileFlipCount: newTileFlipCount,
      }
    }

    return {
      ...state,
      letterPool: letters,
      tileFlipCount: newTileFlipCount,
    }
  }

  return {
    submitWord,
    flipTile,
  }
}

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

// Eventually this will be seeded for testing and weighted for gameplay
export function getRandomLetter(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomIndex = Math.floor(Math.random() * alphabet.length)
  const letter = alphabet[randomIndex]
  return letter
}
