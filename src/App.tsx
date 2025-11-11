import { useState, useEffect } from 'react'
import './styles/Global.css'
import LandingPage from './pages/LandingPage/LandingPages'
import Lobby from './pages/Lobby/Lobby'
import { wsService } from './services/WebSocketService'
import { config } from './config'

type AppState = 'landing' | 'lobby' | 'connecting'

interface LobbyData {
  code: string
  playerName: string
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppState>('connecting')
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    // Connect to WebSocket server on app start
    const serverUrl = config.getWebSocketUrl()
    console.log('Connecting to WebSocket server at:', serverUrl)
    
    wsService.connect(serverUrl)
      .then(() => {
        setCurrentPage('landing')
        setConnectionError(null)
      })
      .catch((error) => {
        console.error('Failed to connect to server:', error)
        setConnectionError('Failed to connect to server. Please make sure the server is running.')
        setCurrentPage('landing') // Show landing page anyway
      })

    // Set up error handler
    wsService.setOnError((error) => {
      console.error('WebSocket error:', error)
      setConnectionError(error)
    })

    // Cleanup on unmount
    return () => {
      wsService.disconnect()
    }
  }, [])

  const handleJoinLobby = async (lobbyCode: string, playerName: string) => {
    try {
      setConnectionError(null)
      await wsService.joinLobby(lobbyCode, playerName)
      setLobbyData({ code: lobbyCode, playerName })
      setCurrentPage('lobby')
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to join lobby')
    }
  }

  const handleCreateLobby = async (playerName: string) => {
    try {
      setConnectionError(null)
      const result = await wsService.createLobby(playerName)
      setLobbyData({ code: result.lobbyCode, playerName })
      setCurrentPage('lobby')
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to create lobby')
    }
  }

  const handleLeaveLobby = () => {
    wsService.leaveLobby()
    setLobbyData(null)
    setCurrentPage('landing')
  }

  return (
    <>
      {currentPage === 'connecting' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Connecting to server...</h2>
        </div>
      )}
      {currentPage === 'landing' && (
        <LandingPage 
          onJoinLobby={handleJoinLobby}
          onCreateLobby={handleCreateLobby}
          error={connectionError}
        />
      )}
      {currentPage === 'lobby' && lobbyData && (
        <Lobby 
          lobbyCode={lobbyData.code}
          playerName={lobbyData.playerName}
          onLeaveLobby={handleLeaveLobby}
        />
      )}
    </>
  )
}

export default App
