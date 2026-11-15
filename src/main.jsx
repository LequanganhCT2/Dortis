import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './app/AppRouter'
import './style.css'
import './cax.css'
import './philosophy.css'
import './values-3d.css'

createRoot(document.getElementById('root')).render(<AppRouter/>)
