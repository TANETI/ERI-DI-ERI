import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { registerPwa } from './lib/pwa'
import {
  configurePlatformManifest,
  ensurePlatformRoute,
} from './lib/platform'

const platform =
  ensurePlatformRoute()

configurePlatformManifest(
  platform,
)

registerPwa()

createRoot(document.getElementById('root')!).render(<App />)
