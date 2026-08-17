export type PlayedWord = {
  readonly id: number
  readonly word: string
}

export type GameRules = {
  totalTileFlipCount: number
  tileFlipIntervalMs: number
  maxLetterPoolCapacity: number
  minWordLength: number
  wordStealIntervalFlips: number
  maxWordStealCapacity: number
  scoringBonuses: ScoringBonuses
}

export type ScoringBonuses = {
  wordsCombinedMult: number
  dupeLetterBonusPer: number
  dupeWordBonusPer: number
  reclaimStolenBonus: number
  eightOrLongerBonus: number
  firstWordMult: number
}

export type GameState = {
  gameRules: GameRules
  letterPool: readonly string[]
  playedWords: readonly PlayedWord[]
  stolenWords: readonly PlayedWord[]
  tileFlipCount: number
  nextWordId: number
  score: number
  history: readonly GameEvent[]
  seed: number
  rngState: number
}

export type PlayerMove = {
  word: string
  selectedWordIds: readonly number[]
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
        | 'NO_WORD_ENTERED'
        | 'WORD_TOO_SHORT'
        | 'INVALID_SELECTED_WORD'
        | 'WORD_NOT_IN_DICTIONARY'
        | 'WORD_DOES_NOT_USE_ALL_LETTERS_IN_SELECTED_WORDS'
        | 'WORD_DOES_NOT_ADD_ANY_LETTERS_FROM_LETTERPOOL'
        | 'NEEDED_LETTERS_NOT_IN_LETTERPOOL'
    }

export type LetterUsageResult =
  | { success: true; remainingLetters: readonly string[] }
  | {
      success: false
      reason:
        | 'WORD_DOES_NOT_USE_ALL_LETTERS_IN_SELECTED_WORDS'
        | 'WORD_DOES_NOT_ADD_ANY_LETTERS_FROM_LETTERPOOL'
        | 'NEEDED_LETTERS_NOT_IN_LETTERPOOL'
    }

export type GameEvent =
  | {
      type: 'WORD_PLAYED'
      playedWord: PlayedWord
      fromWords: PlayedWord[]
      scoreDelta: number
    }
  | {
      type: 'TILE_FLIPPED'
      letter: string
    }
  | {
      type: 'TILE_EXPIRED'
      letter: string
    }
  | {
      type: 'WORD_STOLEN'
      stolenWord: PlayedWord
      scoreDelta: number
    }
  | {
      type: 'STOLEN_WORD_EXPIRED'
      expiredWord: PlayedWord
    }
