import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createGameEngine } from './game/gameEngine.ts'
import { loadDictionary } from './game/dictionary'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

async function startApp() {
  try {
    root.render(<p>Loading Dictionary...</p>)

    const dictionary = await loadDictionary()
    const gameEngine = createGameEngine(dictionary)
    root.render(
      <StrictMode>
        <App gameEngine={gameEngine} />
      </StrictMode>,
    )
  } catch (error) {
    root.render(<p>Failed to load game engine.</p>)
    console.error(error)
  }
}

void startApp()
