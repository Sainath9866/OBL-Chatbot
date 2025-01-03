import { useState } from 'react'
import ChatInterface from './chat'
import './App.css'
import { ActionProvider } from './ActionContent';

function App() {
  

  return (
    <ActionProvider>
     {<ChatInterface/>}
    </ActionProvider>
  )
}

export default App
