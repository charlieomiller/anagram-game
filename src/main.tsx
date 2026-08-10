import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loadDictionary } from './game/dictionary'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

async function startApp() {
  try {
    root.render(<p>Loading Dictionary...</p>)

    const dictionary = await loadDictionary()

    root.render(
      <StrictMode>
        <App dictionary={dictionary} />
      </StrictMode>,
    )
  } catch (error) {
    root.render(<p>Failed to load game dictionary. Womp.</p>)
    console.error(error)
  }
}

void startApp()
