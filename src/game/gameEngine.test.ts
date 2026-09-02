import { describe, expect, test } from 'vitest'
import { createGameEngine } from './gameEngine'
import { LETTER_BAG } from './letterBag'
import type { GameRules, GameState, PlayerMove } from './types'

const TEST_RULES: GameRules = {
  tileFlipIntervalMs: 12000,
  maxLetterPoolCapacity: 8,
  minWordLength: 3,
  wordStealIntervalFlips: 15,
  maxWordStealCapacity: 2,
}

const TEST_DICTIONARY = new Set([
  'AM',
  'TO',
  'GUY',
  'GUYS',
  'TEST',
  'BUDDY',
  'FUNNY',
  'CAR',
  'CARE',
  'TRACE',
  'CRATES',
  'CRATERS',
  'CHARTERS',
  'ORCHESTRA',
  'CON',
  'ACT',
  'CONTACT',
])

const gameEngine = createGameEngine(TEST_DICTIONARY)

describe('createGame', () => {
  test('same seed produces same letter bag', () => {
    const gameA = gameEngine.createGame(TEST_RULES, 12345)
    const gameB = gameEngine.createGame(TEST_RULES, 12345)

    expect(gameA.letterBag).toEqual(gameB.letterBag)
  })

  test('same letters in shuffled and original letter bag', () => {
    const game = gameEngine.createGame(TEST_RULES, 12345)

    const originalLetterBag = [...LETTER_BAG].sort()
    const shuffledLetterBag = [...game.letterBag].sort()

    expect(shuffledLetterBag).toEqual(originalLetterBag)
  })

  test('new game has empty gameplay state', () => {
    const game = gameEngine.createGame(TEST_RULES, 12345)

    expect(game.letterPool).toEqual([])
    expect(game.playedWords).toEqual([])
    expect(game.stolenWords).toEqual([])
    expect(game.tileFlipCount).toBe(0)
    expect(game.nextWordId).toBe(0)
    expect(game.score).toBe(0)
    expect(game.history).toEqual([])
    expect(game.seed).toBe(12345)
  })
})

describe('submitWord', () => {
  test('plays a valid word using letters in letter pool', () => {
    const startingGameState = gameEngine.createGame(TEST_RULES, 12345)
    const gameState: GameState = {
      ...startingGameState,
      letterPool: ['C', 'R', 'A', 'T'],
    }

    const testMove: PlayerMove = { word: 'CAR', selectedWordIds: [] }

    const result = gameEngine.submitWord(gameState, testMove)

    if (result.success === false) {
      throw new Error(`Expected successful move, got ${result.reason}`)
    }

    expect(result.gameState.letterPool).toEqual(['T'])
    expect(result.gameState.playedWords).toEqual([{ id: 0, word: 'CAR' }])
    expect(result.gameState.nextWordId).toBe(1)
    expect(result.gameState.score).toBeGreaterThan(0)
    expect(result.gameState.history.at(-1)).toMatchObject({
      type: 'WORD_PLAYED',
      playedWord: { id: 0, word: 'CAR' },
    })
  })

  test('rejects an invalid word when letter pool does not contain necessary letters', () => {
    const startingGameState = gameEngine.createGame(TEST_RULES, 12345)
    const gameState: GameState = {
      ...startingGameState,
      letterPool: ['C', 'X', 'A', 'R'],
    }
    const testMove: PlayerMove = { word: 'CARE', selectedWordIds: [] }

    const result = gameEngine.submitWord(gameState, testMove)

    expect(result).toEqual({
      success: false,
      reason: 'NEEDED_LETTERS_NOT_IN_LETTERPOOL',
    })
  })

  test('transforms a selected word from player pool using letter from letter pool', () => {
    const startingGameState = gameEngine.createGame(TEST_RULES, 12345)
    const gameState: GameState = {
      ...startingGameState,
      playedWords: [{ word: 'CAR', id: 0 }],
      letterPool: ['E', 'X'],
      nextWordId: 1,
    }

    const testMove: PlayerMove = { word: 'CARE', selectedWordIds: [0] }
    const result = gameEngine.submitWord(gameState, testMove)

    if (result.success === false) {
      throw new Error(`Expected successful move, got ${result.reason}`)
    }

    expect(result.gameState.letterPool).toEqual(['X'])
    // ID of new word should be next int
    expect(result.gameState.playedWords).toEqual([{ id: 1, word: 'CARE' }])
    expect(result.gameState.nextWordId).toBe(2)
    expect(result.gameState.score).toBeGreaterThan(0)
    expect(result.gameState.history.at(-1)).toMatchObject({
      type: 'WORD_PLAYED',
      playedWord: { id: 1, word: 'CARE' },
      fromWords: [{ id: 0, word: 'CAR' }],
    })
  })

  test('does not mutate the input game state when a move fails', () => {
    const gameBeforeSubmit = gameEngine.createGame(TEST_RULES, 12345)
    const snapshotBeforeSubmit = structuredClone(gameBeforeSubmit)
    const testMove: PlayerMove = { word: 'TEST', selectedWordIds: [] }

    gameEngine.submitWord(gameBeforeSubmit, testMove)

    expect(gameBeforeSubmit).toEqual(snapshotBeforeSubmit)
  })

  test('does not mutate the input game state when a move succeeds', () => {
    const gameBeforeSubmit: GameState = {
      ...gameEngine.createGame(TEST_RULES, 12345),
      letterPool: ['T', 'E', 'S', 'T'],
    }
    const snapshotBeforeSubmit = structuredClone(gameBeforeSubmit)
    const testMove: PlayerMove = { word: 'TEST', selectedWordIds: [] }

    const result = gameEngine.submitWord(gameBeforeSubmit, testMove)

    expect(result.success).toBe(true)
    expect(gameBeforeSubmit).toEqual(snapshotBeforeSubmit)
  })
})

describe('flipTile', () => {
  test('first flip moves one letter from letter bag into letter pool', () => {
    const gameBeforeFlip = gameEngine.createGame(TEST_RULES, 12345)

    // at(-1) is the last element of an array
    const expectedLetter = gameBeforeFlip.letterBag.at(-1)

    if (expectedLetter === undefined) {
      throw new Error('Test requires a non-empty letter bag')
    }

    const gameAfterFlip = gameEngine.flipTile(gameBeforeFlip)

    expect(gameAfterFlip.letterPool).toEqual([expectedLetter])
    expect(gameAfterFlip.letterBag).toHaveLength(
      gameBeforeFlip.letterBag.length - 1,
    )
    expect(gameAfterFlip.tileFlipCount).toBe(1)
  })

  test('expires oldest tile when letter pool exceeds capacity', () => {
    const smallPoolModifiedRules: GameRules = {
      ...TEST_RULES,
      maxLetterPoolCapacity: 2,
    }
    const startingGameState = gameEngine.createGame(
      smallPoolModifiedRules,
      12345,
    )
    const gameState: GameState = {
      ...startingGameState,
      letterBag: ['G'],
      // B is the oldest tile
      letterPool: ['A', 'R'],
    }

    const result = gameEngine.flipTile(gameState)

    expect(result.letterPool).toEqual(['G', 'A'])
    expect(result.letterBag).toEqual([])
    expect(result.tileFlipCount).toEqual(1)

    expect(result.history).toEqual([
      { type: 'TILE_FLIPPED', letter: 'G' },
      { type: 'TILE_EXPIRED', letter: 'R' },
    ])
  })

  test('moves word from player word pool to stolen pool on steal interval reached', () => {
    const shortStealIntervalModifiedRules: GameRules = {
      ...TEST_RULES,
      wordStealIntervalFlips: 2,
    }
    const startingGameState = gameEngine.createGame(
      shortStealIntervalModifiedRules,
      12345,
    )
    const gameState: GameState = {
      ...startingGameState,
      // ORCHESTRA is the oldest word
      playedWords: [
        { word: 'TEST', id: 0 },
        { word: 'ORCHESTRA', id: 1 },
      ],
      // For testing that removing a word removes score (score is only added when words are added via submitWord function)
      score: 1,
    }

    const firResult = gameEngine.flipTile(gameState)
    const secResult = gameEngine.flipTile(firResult)

    expect(secResult.tileFlipCount).toBe(2)
    expect(firResult.stolenWords).toEqual([])
    expect(secResult.stolenWords).toEqual([{ word: 'ORCHESTRA', id: 1 }])
    expect(firResult.playedWords).toEqual([
      { word: 'TEST', id: 0 },
      { word: 'ORCHESTRA', id: 1 },
    ])
    expect(secResult.playedWords).toEqual([{ word: 'TEST', id: 0 }])
    expect(firResult.score).toBe(1)
    expect(secResult.score).toBeLessThan(1)
    expect(secResult.history.at(-1)).toMatchObject({
      type: 'WORD_STOLEN',
      stolenWord: { word: 'ORCHESTRA', id: 1 },
    })
  })

  test('does not mutate the input game state', () => {
    const gameBeforeFlip = gameEngine.createGame(TEST_RULES, 12345)
    const snapshotBeforeFlip = structuredClone(gameBeforeFlip)

    gameEngine.flipTile(gameBeforeFlip)

    expect(gameBeforeFlip).toEqual(snapshotBeforeFlip)
  })
})

describe('game lifecycle', () => {
  test('new game starts in playing status', () => {
    const game = gameEngine.createGame(TEST_RULES, 12345)

    expect(game.status).toBe('playing')
  })

  test('game stays in playing status while 1 tile remains in the letter pool', () => {
    const game = gameEngine.createGame(TEST_RULES, 12345)

    const stateBeforeFlip: GameState = {
      ...game,
      letterBag: [],
      letterPool: ['C', 'M'],
      status: 'playing',
    }

    const result = gameEngine.flipTile(stateBeforeFlip)

    expect(result.status).toBe('playing')
    expect(result.letterPool).toHaveLength(1)
  })

  test('game finishes when the final letter pool tile expires', () => {
    const game = gameEngine.createGame(TEST_RULES, 12345)

    const stateBeforeFlip: GameState = {
      ...game,
      letterBag: [],
      letterPool: ['C'],
      status: 'playing',
    }

    const result = gameEngine.flipTile(stateBeforeFlip)

    expect(result.status).toBe('finished')
    expect(result.letterPool).toEqual([])
    expect(result.letterBag).toEqual([])
  })
})
