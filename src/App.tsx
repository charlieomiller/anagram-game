import { useState } from 'react'
import { generateInitialMeld, type GameEngine } from './game/gameEngine'
import type { GameState, PlayerMove } from './game/types'
import './App.css'

type AppProps = {
  gameEngine: GameEngine
}

function App(props: AppProps) {
  const gameEngine = props.gameEngine
  const [gameState, setGameState] = useState<GameState>(() => ({
    letterPool: generateInitialMeld(),
    playedWords: [],
    nextWordId: 0,
    score: 0,
  }))
  const [word, setWord] = useState('')
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([])

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

  function handleFlip() {
    const newState = gameEngine.flipTile(gameState)
    setGameState(newState)
  }

  function toggleWordSelection(selectedWordId: number) {
    setSelectedWordIds((currentSelectedWordIds) => {
      if (currentSelectedWordIds.includes(selectedWordId)) {
        return currentSelectedWordIds.filter((word) => word !== selectedWordId)
      }

      return [...currentSelectedWordIds, selectedWordId]
    })
  }

  return (
    <main>
      <h1>Anagram Game</h1>

      <section>
        <h2>letter pool:</h2>
        <p>{gameState.letterPool.join(' ')}</p>
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
        <button type="button" onClick={handleFlip}>
          Flip
        </button>
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
    </main>
  )
}

export default App
