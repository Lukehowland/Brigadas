import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FormularioBrigadas from './FormularioBrigadas.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    < FormularioBrigadas/>
  </StrictMode>,
)
