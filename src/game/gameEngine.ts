import type {
  PlayedWord,
  GameState,
  PlayerMove,
  MoveResult,
  LetterUsageResult,
  GameEvent,
  GameRules,
} from './types'
import { generateNextLetter } from './letterGenerator'
// pass in letter pool
// pass in played word (cleaned before submitted)
// check if word can be made from letters

// this will eventually need to be seeded
// alphabet should be an array of string weight pairs

export type GameEngine = ReturnType<typeof createGameEngine>

export function createGameEngine(dictionary: ReadonlySet<string>) {
  function createGame(gameRules: GameRules, seed: number): GameState {
    return {
      gameRules,
      letterPool: [],
      playedWords: [],
      stolenWords: [],
      tileFlipCount: 0,
      nextWordId: 0,
      score: 0,
      history: [],
      seed: seed,
      rngState: seed,
    }
  }
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

    const selectedWordIds = new Set(move.selectedWordIds)

    const remainingPlayedWords = state.playedWords.filter(
      (playedWord) => !selectedWordIds.has(playedWord.id),
    )
    const removedPlayedWords = state.playedWords.filter((playedWord) =>
      selectedWordIds.has(playedWord.id),
    )

    const remainingStolenWords = state.stolenWords.filter(
      (playedWord) => !selectedWordIds.has(playedWord.id),
    )
    const removedStolenWords = state.stolenWords.filter((playedWord) =>
      selectedWordIds.has(playedWord.id),
    )

    let scoreDelta = 0
    // Remove the score value of any active words that were used in the new word
    if (removedPlayedWords) {
      scoreDelta -= calculateWordValues(
        removedPlayedWords.map((playedWord) => playedWord.word),
      )
    }

    // Add the score value of the new word
    scoreDelta += calculateWordValues([word])

    scoreDelta = applyScoringBonuses(
      scoreDelta,
      word,
      state,
      move.selectedWordIds,
      removedStolenWords,
    )

    const newPlayedWord = { id: state.nextWordId, word: word }

    return {
      success: true,
      gameState: {
        ...state,
        letterPool: remainingLetters.remainingLetters,
        playedWords: [newPlayedWord, ...remainingPlayedWords],
        stolenWords: remainingStolenWords,
        nextWordId: state.nextWordId + 1,
        score: state.score + scoreDelta,
        history: [
          ...state.history,
          {
            type: 'WORD_PLAYED',
            playedWord: newPlayedWord,
            fromWords: selectedWords,
            scoreDelta: scoreDelta,
          },
        ],
      },
    }
  }

  function flipTile(state: Readonly<GameState>): GameState {
    const letters = [...state.letterPool]
    const newTileFlipCount = state.tileFlipCount + 1

    // No more tiles to flip, start expiring remaining tiles
    if (newTileFlipCount > state.gameRules.totalTileFlipCount) {
      const expiredTile = letters.pop()
      if (expiredTile !== undefined) {
        return {
          ...state,
          letterPool: letters,
          tileFlipCount: newTileFlipCount,
          history: [
            ...state.history,
            {
              type: 'TILE_EXPIRED',
              letter: expiredTile,
            },
          ],
        }
      }
      // If all letters have expired and this is called just return the current state
      return { ...state }
    }

    // Add new letter and remove oldest if letter pool is at max capacity
    const nextLetterResult = generateNextLetter(letters, state.rngState)
    const newLetter = nextLetterResult.letter

    letters.unshift(newLetter)

    const appendHistory: GameEvent[] = []
    appendHistory.push({ type: 'TILE_FLIPPED', letter: newLetter })

    // Letterpool is full, push out oldest letter for new letter
    if (letters.length > state.gameRules.maxLetterPoolCapacity) {
      const expiredTile = letters.pop()
      // Will always be the case.
      if (expiredTile !== undefined)
        appendHistory.push({ type: 'TILE_EXPIRED', letter: expiredTile })
    }

    // Take a word from the player and put it in holding every X tile flips
    if (newTileFlipCount % state.gameRules.wordStealIntervalFlips === 0) {
      const newPlayedWords = [...state.playedWords]
      const newStolenWords = [...state.stolenWords]

      const stolenWord = newPlayedWords.pop()

      let scoreDelta = 0

      // If there were any played words to steal
      if (stolenWord) {
        newStolenWords.unshift(stolenWord)
        appendHistory.push({
          type: 'WORD_STOLEN',
          stolenWord: stolenWord,
          scoreDelta: scoreDelta,
        })
        // If stolen words is full
        if (newStolenWords.length > state.gameRules.maxWordStealCapacity) {
          const expiredWord = newStolenWords.pop()
          // Will always be the case.
          if (expiredWord !== undefined)
            appendHistory.push({
              type: 'STOLEN_WORD_EXPIRED',
              expiredWord: expiredWord,
            })
        }
        console.log('WORD STEAL')
        scoreDelta = -calculateWordValues([stolenWord.word])
      } else {
        console.log('NO PLAYED WORDS TO STEAL')
      }

      return {
        ...state,
        letterPool: letters,
        playedWords: newPlayedWords,
        stolenWords: newStolenWords,
        tileFlipCount: newTileFlipCount,
        score: state.score + scoreDelta,
        history: [...state.history, ...appendHistory],
        rngState: nextLetterResult.nextRngState,
      }
    }

    return {
      ...state,
      letterPool: letters,
      tileFlipCount: newTileFlipCount,
      history: [...state.history, ...appendHistory],
      rngState: nextLetterResult.nextRngState,
    }
  }

  return {
    createGame,
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

function calculateWordValues(words: string[]) {
  let score = 0
  for (const word of words) {
    // "GUMMY" should be scored as 1 + 2 + 3 + 4 + 5
    for (let index = 1; index <= word.length; index++) {
      score = score + index
    }
  }
  return score
}

function applyScoringBonuses(
  scoreDelta: number,
  word: string,
  gameState: Readonly<GameState>,
  selectedWordIds: readonly number[],
  removedStolenWords: readonly PlayedWord[],
): number {
  const bonuses = gameState.gameRules.scoringBonuses
  let newScoreDelta = scoreDelta
  // Bonuses first
  // New word contains 4 or more of the same letter
  const counts: { [key: string]: number } = {}
  let maxCount = 0
  for (const char of word) {
    counts[char] = (counts[char] || 0) + 1
    if (counts[char] > maxCount) {
      maxCount = counts[char]
    }
  }
  if (maxCount > 3) {
    newScoreDelta += (maxCount - 3) * bonuses.dupeLetterBonusPer
  }

  // New word matches existing words in current word pool
  const duplicateWordCount = gameState.playedWords.filter(
    (playedWord) => playedWord.word === word,
  ).length
  newScoreDelta += duplicateWordCount * bonuses.dupeWordBonusPer

  // Word was in stolen and has been taken back
  newScoreDelta += removedStolenWords.length * bonuses.reclaimStolenBonus

  // Word is long (8 letters or longer)
  if (word.length >= 8) {
    newScoreDelta += bonuses.eightOrLongerBonus
  }

  // Then multipliers
  // 2 or more words selected to make new word
  if (selectedWordIds.length > 1) {
    newScoreDelta *= selectedWordIds.length * bonuses.wordsCombinedMult
  }

  // First word of the game played
  if (
    gameState.playedWords.length === 0 &&
    gameState.stolenWords.length === 0
  ) {
    newScoreDelta *= bonuses.firstWordMult
  }

  return newScoreDelta
}
