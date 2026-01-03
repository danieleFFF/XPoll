import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <SessionProvider>
            <App />
        </SessionProvider>
    </React.StrictMode>,
)

