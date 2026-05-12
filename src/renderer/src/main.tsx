import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import { setupAutosave } from './store/persistence'

// Detect if this is the output window
const isOutput = new URLSearchParams(window.location.search).get('output') === 'true'

async function init() {
  if (isOutput) {
    const { OutputWindow } = await import('./OutputWindow')
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <OutputWindow />
      </React.StrictMode>
    )
  } else {
    const { App } = await import('./App')
    setupAutosave()
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
}

init()
