import { useEffect, useState } from 'react'
import { type GameEngine } from './game/gameEngine'
import type { PlayerMove } from './game/types'
import './App.css'

const NORMAL_RULES = {
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

type AppProps = {
  gameEngine: GameEngine
}

function App(props: AppProps) {
  const gameEngine = props.gameEngine

  const [gameState, setGameState] = useState(() =>
    gameEngine.createGame(NORMAL_RULES, 12346),
  )

  const [word, setWord] = useState('')
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([])
  const [flipTimerCycle, setFlipTimerCycle] = useState(0)
  const [timeUntilFlipMs, setTimeUntilFlipMs] = useState(
    gameState.gameRules.tileFlipIntervalMs,
  )

  function handleSubmit() {
    const move: PlayerMove = {
      word: word,
      selectedWordIds: selectedWordIds,
    }

    const result = gameEngine.submitWord(gameState, move)

    setSelectedWordIds([])

    if (result.success === false) {
      console.log(result.reason)
      return
    }

    setGameState(result.gameState)
    console.log(result)
    setWord('')
  }

  function toggleWordSelection(selectedWordId: number) {
    setSelectedWordIds((currentSelectedWordIds) => {
      if (currentSelectedWordIds.includes(selectedWordId)) {
        return currentSelectedWordIds.filter((word) => word !== selectedWordId)
      }

      return [...currentSelectedWordIds, selectedWordId]
    })
  }

  // Tile flip timer logic
  useEffect(() => {
    const intervalMs = gameState.gameRules.tileFlipIntervalMs
    const flipTime = Date.now() + intervalMs

    const countdownId = window.setInterval(() => {
      const remainingMs = Math.max(0, flipTime - Date.now())
      setTimeUntilFlipMs(remainingMs)
    }, 100)

    const flipId = window.setTimeout(() => {
      setGameState((currentGameState) => gameEngine.flipTile(currentGameState))

      setTimeUntilFlipMs(intervalMs)
      setFlipTimerCycle((currentCycle) => currentCycle + 1)
    }, intervalMs)

    return () => {
      window.clearInterval(countdownId)
      window.clearTimeout(flipId)
    }
  }, [gameEngine, gameState.gameRules.tileFlipIntervalMs, flipTimerCycle])

  function handleFlipEarly() {
    setGameState((currentGameState) => gameEngine.flipTile(currentGameState))

    setFlipTimerCycle((currentCycle) => currentCycle + 1)
  }

  const secondsUntilFlip = Math.ceil(timeUntilFlipMs / 1000)

  return (
    <main>
      <h1>Anagram Game</h1>

      <section>
        <h2>remaining letter pool: {gameState.letterBag.length}</h2>
        <p>{gameState.letterPool.join(' ')}</p>
      </section>
      <section>
        <h2>Next Tile</h2>
        <p>{secondsUntilFlip}</p>
      </section>
      <section>
        <h2>Play a Word</h2>

        <input
          type="text"
          value={word}
          onChange={(event) => {
            const lettersOnly = event.target.value
              .replace(/[^a-z]/gi, '') // Only allows for letters to be typed in the field
              .toUpperCase()
            setWord(lettersOnly)
          }}
          autoComplete="off"
          spellCheck={false}
        />

        <button type="button" onClick={handleSubmit}>
          Submit
        </button>
        <button type="button" onClick={handleFlipEarly}>
          Flip Early
        </button>
      </section>
      <section>
        <h2>SCORE</h2>
        {gameState.score.toFixed(0)}
      </section>
      <section>
        <h2>Played Words</h2>

        {gameState.playedWords.map((playedWord) => {
          const isSelected = selectedWordIds.includes(playedWord.id)
          return (
            <button
              key={playedWord.id}
              type="button"
              className={isSelected ? 'played-word selected' : 'played-word'}
              aria-pressed={isSelected}
              onClick={() => {
                toggleWordSelection(playedWord.id)
              }}
            >
              {playedWord.word}
            </button>
          )
        })}
      </section>
      <section>
        <h2>Stolen Words</h2>

        {gameState.stolenWords.map((stolenWord) => {
          const isSelected = selectedWordIds.includes(stolenWord.id)
          return (
            <button
              key={stolenWord.id}
              type="button"
              className={isSelected ? 'played-word selected' : 'played-word'}
              aria-pressed={isSelected}
              onClick={() => {
                toggleWordSelection(stolenWord.id)
              }}
            >
              {stolenWord.word}
            </button>
          )
        })}
      </section>
    </main>
  )
}

export default App
