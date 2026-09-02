import { useEffect, useState } from 'react'
import { type GameEngine } from './game/gameEngine'
import type { GameRules, PlayerMove } from './game/types'
import './App.css'

const NORMAL_RULES: GameRules = {
  tileFlipIntervalMs: 12000,
  maxLetterPoolCapacity: 8,
  minWordLength: 3,
  wordStealIntervalFlips: 15,
  maxWordStealCapacity: 2,
}

type AppProps = {
  gameEngine: GameEngine
}

function App(props: AppProps) {
  const gameEngine = props.gameEngine

  const [gameState, setGameState] = useState(() =>
    gameEngine.createGame(NORMAL_RULES, 12346),
  )

  const [hasStarted, setHasStarted] = useState(false)
  const [word, setWord] = useState('')
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([])
  const [flipTimerCycle, setFlipTimerCycle] = useState(0)
  const [timeUntilFlipMs, setTimeUntilFlipMs] = useState(
    gameState.gameRules.tileFlipIntervalMs,
  )

  function startGame() {
    // Get seed from date and time
    const seed = Date.now() >>> 0

    setGameState(gameEngine.createGame(NORMAL_RULES, seed))
    setWord('')
    setSelectedWordIds([])
    setTimeUntilFlipMs(NORMAL_RULES.tileFlipIntervalMs)
    setFlipTimerCycle((currentCycle) => currentCycle + 1)

    setHasStarted(true)
  }

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
    if (!hasStarted || gameState.status === 'finished') {
      return
    }

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
  }, [
    gameEngine,
    gameState.gameRules.tileFlipIntervalMs,
    gameState.status,
    flipTimerCycle,
    hasStarted,
  ])

  function handleFlipEarly() {
    setGameState((currentGameState) => gameEngine.flipTile(currentGameState))

    setFlipTimerCycle((currentCycle) => currentCycle + 1)
  }

  const secondsUntilFlip = Math.ceil(timeUntilFlipMs / 1000)

  if (!hasStarted) {
    return (
      <main className="start-screen">
        <h1>Anagram Game</h1>

        <p>Create words and modify existing ones from the available tiles.</p>

        <h2>How to Play</h2>

        <ul>
          <li>Words must be at least 3 letters long.</li>
          <li>Tiles expire after max capacity is reached</li>
          <li>
            Select an existing word to reuse its letters in a larger word.
          </li>
          <li>Each new word must use at least one letter from the pool.</li>
          <li>
            Multiple words can be selected and combined when making a larger
            word.
          </li>
          <li>Your rightmost word will be stolen periodically.</li>
          <li>Stolen words can be used to make new words</li>
          <li>Stolen words expire after max capacity is reached</li>
          <li>
            Longer words are worth more points. Each additional letter adds X +
            1 points.
          </li>
        </ul>

        <button type="button" onClick={startGame}>
          Start Game
        </button>
      </main>
    )
  }

  if (gameState.status === 'finished') {
    const longestWord = gameState.history
      .filter((event) => event.type === 'WORD_PLAYED')
      .reduce((longest, event) => {
        return event.playedWord.word.length > longest.length
          ? event.playedWord.word
          : longest
      }, '')
    return (
      <main className="end-screen">
        <h1>Game Over</h1>

        <p>Final Score</p>
        <strong>{gameState.score.toFixed(0)}</strong>

        <p>Words Remaining: {gameState.playedWords.length}</p>

        <p>Longest Word: {longestWord || 'No words played!'}</p>

        <p>Seed: {gameState.seed}</p>

        <button type="button" onClick={startGame}>
          Play Again
        </button>
      </main>
    )
  }

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
