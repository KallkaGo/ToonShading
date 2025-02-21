import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// const vConsole = new VConsole();

const root = document.getElementById('root') as HTMLDivElement
ReactDOM.createRoot(root).render(<App />)

console.info(
  '%cAuthor:KallkaGo',
  'color: orange;background: ivory;font-size:26px;border: 2px solid black;padding:10px;text-shadow: 1px 1px grey;border-radius:11px;',
)
