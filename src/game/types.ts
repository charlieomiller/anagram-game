export type PlayedWord = {
  id: number
  word: string
}
export type GameState = {
  letterPool: string[]
  playedWords: PlayedWord[]
  nextWordId: number
  score: number
}

export type PlayerMove = {
  word: string
  selectedWordIds: number[]
}

// Makes use of a discriminated union for straightfoward checks later
export type MoveResult =
  | {
      success: true
      gameState: GameState
    }
  | {
      success: false
      reason:
        | 'WORD_TOO_SHORT'
        | 'WORD_NOT_IN_DICTIONARY'
        | 'WORD_DOES_NOT_USE_ALL_LETTERS_IN_SELECTED_WORDS'
        | 'WORD_DOES_NOT_ADD_ANY_LETTERS_FROM_LETTERPOOL'
        | 'NEEDED_LETTERS_NOT_IN_LETTERPOOL'
    }

export type LetterUsageResult =
  | { success: true; remainingLetters: string[] }
  | {
      success: false
      reason:
        | 'WORD_DOES_NOT_USE_ALL_LETTERS_IN_SELECTED_WORDS'
        | 'WORD_DOES_NOT_ADD_ANY_LETTERS_FROM_LETTERPOOL'
        | 'NEEDED_LETTERS_NOT_IN_LETTERPOOL'
    }
