import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'

// One bundle, three windows: ?view=output | stage | (none = operator console).
const view = new URLSearchParams(window.location.search).get('view')

async function root(): Promise<React.ReactNode> {
  if (view === 'output') {
    const { OutputWindow } = await import('./windows/OutputWindow')
    return <OutputWindow />
  }
  if (view === 'stage') {
    const { StageWindow } = await import('./windows/StageWindow')
    return <StageWindow />
  }
  const [{ App }, { setupAutosave }] = await Promise.all([import('./windows/App'), import('./store/persistence')])
  await setupAutosave()
  return <App />
}

root().then((node) =>
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<React.StrictMode>{node}</React.StrictMode>)
)
