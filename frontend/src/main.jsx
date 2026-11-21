import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.jsx'

// HashRouter: GitHub Pages neumí přepisovat cesty na index.html, část za # se ale
// na server nikdy neposílá – refresh i přímé odkazy na podstránky tak fungují vždy.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
