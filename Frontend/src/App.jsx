import { useState } from 'react'
import ChatInterface from './chat'
import './App.css'
import { ActionProvider } from './ActionContent';
import Home from './Home';

function App() {
  

  return (
    // <ActionProvider>
    //  {<ChatInterface/>}
    // </ActionProvider>
    <Home/>
  )
}

export default App
