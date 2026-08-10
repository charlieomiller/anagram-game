import { useState } from 'react'
import { generateInitialMeld, validateWord } from './game/gameEngine'
import './App.css'

type AppProps = {
  dictionary: ReadonlySet<string>
}

function App(props: AppProps) {
  const dictionary = props.dictionary

  const [letters, setLetters] = useState(() => generateInitialMeld())
  const [word, setWord] = useState('')

  function handleSubmit() {
    const isValid = validateWord(word, letters, dictionary)
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
    </main>
  )
}

export default App
