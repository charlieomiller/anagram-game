import { useState } from 'react'
import { generateInitialMeld, type GameEngine } from './game/gameEngine'
import type { PlayedWord, GameState, PlayerMove } from './game/types'
import './App.css'

type AppProps = {
  gameEngine: GameEngine
}

function App(props: AppProps) {
  const gameEngine = props.gameEngine
  const [gameState, setGameState] = useState<GameState>(() => ({
    letterPool: generateInitialMeld(),
    playedWords: [],
    selectedWords: [],
    nextWordId: 0,
    score: 0,
  }))
  const [word, setWord] = useState('')
  const [selectedWords, setSelectedWords] = useState<PlayedWord[]>([])

  function handleSubmit() {
    const move: PlayerMove = {
      word: word,
      selectedWords: selectedWords,
    }

    const newState = gameEngine.submitWord(gameState, move)

    if (newState === null) return

    setGameState(newState)
    setWord('')
  }

  function toggleWordSelection(selectedWord: PlayedWord) {
    setSelectedWords((currentSelectedWords) => {
      if (currentSelectedWords.includes(selectedWord)) {
        return currentSelectedWords.filter((word) => word !== selectedWord)
      }

      return [...currentSelectedWords, selectedWord]
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
      </section>
      <section>
        <h2>Played Words</h2>

        {gameState.playedWords.map((playedWord) => {
          const isSelected = selectedWords.includes(playedWord)
          return (
            <button
              key={playedWord.id}
              type="button"
              className={isSelected ? 'played-word selected' : 'played-word'}
              aria-pressed={isSelected}
              onClick={() => {
                toggleWordSelection(playedWord)
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
