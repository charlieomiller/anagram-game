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
  scoringBonuses: {
    wordsCombinedMult: 1.5,
    dupeLetterBonusPer: 1,
    dupeWordBonusPer: 1,
    reclaimStolenBonus: 1,
    eightOrLongerBonus: 5,
    firstWordMult: 1.5,
  },
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

  test('does not mutate the input game state', () => {
    const gameBeforeFlip = gameEngine.createGame(TEST_RULES, 12345)
    const snapshotBeforeFlip = structuredClone(gameBeforeFlip)

    gameEngine.flipTile(gameBeforeFlip)

    expect(gameBeforeFlip).toEqual(snapshotBeforeFlip)
  })

  describe('submitWord', () => {
    test('does not mutate the input game state when a move fails', () => {
      const gameBeforeSubmit = gameEngine.createGame(TEST_RULES, 12345)
      const snapshotBeforeSubmit = structuredClone(gameBeforeSubmit)
      const testMove: PlayerMove = { word: 'TEST', selectedWordIds: [] }

      gameEngine.submitWord(gameBeforeSubmit, testMove)

      expect(gameBeforeSubmit).toEqual(snapshotBeforeSubmit)
    })
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
