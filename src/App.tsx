import { useState } from 'react'
import { generateInitialMeld } from './game/gameEngine'
import { canBuildWordFromLetters } from './game/gameEngine'
import './App.css'

function App() {
  const [letters, setLetters] = useState(() => generateInitialMeld())
  const [word, setWord] = useState('')

  function handleSubmit() {
    const isValid = canBuildWordFromLetters(word, letters)
    console.log(isValid)
  }

  function regenerateInitialMeld() {
    setLetters(generateInitialMeld())
  }

  return (
    <main>
      <h1>Anagram Game</h1>

      <section>
        <h2>letter pool:</h2>
        <p>{letters.join(' ')}</p>

        <button type="button" onClick={regenerateInitialMeld}>
          Restart Jame
        </button>
      </section>

      <section>
        <h2>Play a Word</h2>

        <input
          type="text"
          value={word}
          onChange={(event) => {
            const lettersOnly = event.target.value
              .replace(/[^a-z]/gi, '') // Only allows for letters to be typed in the
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
    </main>
  )
}

export default App
