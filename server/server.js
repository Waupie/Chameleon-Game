import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 8080;

// In-memory storage for lobbies and players
const lobbies = new Map();
const players = new Map();

// WebSocket server
const wss = new WebSocketServer({ 
  port: PORT,
  cors: {
    origin: "*"
  }
});

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

// Message types
const MESSAGE_TYPES = {
  CREATE_LOBBY: 'CREATE_LOBBY',
  JOIN_LOBBY: 'JOIN_LOBBY',
  LEAVE_LOBBY: 'LEAVE_LOBBY',
  SEND_MESSAGE: 'SEND_MESSAGE',
  LOBBY_UPDATED: 'LOBBY_UPDATED',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  ERROR: 'ERROR',
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT'
};

function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createSystemMessage(message, lobbyCode) {
  return {
    id: uuidv4(),
    type: 'system',
    playerName: 'System',
    message: message,
    timestamp: new Date().toISOString(),
    lobbyCode
  };
}

function broadcastToLobby(lobbyCode, message, excludePlayerId = null) {
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) return;

  lobby.players.forEach(playerId => {
    if (playerId === excludePlayerId) return;
    
    const player = players.get(playerId);
    if (player && player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

function sendLobbyUpdate(lobbyCode) {
  const lobby = lobbies.get(lobbyCode);
  if (!lobby) return;

  const lobbyData = {
    code: lobbyCode,
    players: lobby.players.map(playerId => {
      const player = players.get(playerId);
      return {
        id: player.id,
        name: player.name,
        joinedAt: player.joinedAt
      };
    }),
    messages: lobby.messages
  };

  broadcastToLobby(lobbyCode, {
    type: MESSAGE_TYPES.LOBBY_UPDATED,
    data: lobbyData
  });
}

wss.on('connection', (ws) => {
  console.log('👤 New client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message);

      switch (message.type) {
        case MESSAGE_TYPES.CREATE_LOBBY: {
          const playerId = uuidv4();
          const lobbyCode = generateLobbyCode();
          
          // Create player
          const player = {
            id: playerId,
            name: message.playerName,
            ws: ws,
            lobbyCode: lobbyCode,
            joinedAt: new Date().toISOString()
          };
          
          players.set(playerId, player);

          // Create lobby
          const lobby = {
            code: lobbyCode,
            creator: playerId,
            players: [playerId],
            messages: [createSystemMessage(`Welcome to lobby ${lobbyCode}!`, lobbyCode)],
            createdAt: new Date().toISOString()
          };
          
          lobbies.set(lobbyCode, lobby);

          // Send success response
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.CREATE_LOBBY,
            success: true,
            data: {
              lobbyCode,
              playerId,
              player: {
                id: playerId,
                name: player.name,
                joinedAt: player.joinedAt
              }
            }
          }));

          sendLobbyUpdate(lobbyCode);
          break;
        }

        case MESSAGE_TYPES.JOIN_LOBBY: {
          const { lobbyCode, playerName } = message;
          const lobby = lobbies.get(lobbyCode);

          if (!lobby) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              message: 'Lobby not found'
            }));
            break;
          }

          const playerId = uuidv4();
          
          // Create player
          const player = {
            id: playerId,
            name: playerName,
            ws: ws,
            lobbyCode: lobbyCode,
            joinedAt: new Date().toISOString()
          };
          
          players.set(playerId, player);
          lobby.players.push(playerId);

          // Add join message
          lobby.messages.push(createSystemMessage(`${playerName} joined the lobby`, lobbyCode));

          // Send success response
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.JOIN_LOBBY,
            success: true,
            data: {
              lobbyCode,
              playerId,
              player: {
                id: playerId,
                name: player.name,
                joinedAt: player.joinedAt
              }
            }
          }));

          // Notify others about new player
          broadcastToLobby(lobbyCode, {
            type: MESSAGE_TYPES.PLAYER_JOINED,
            data: {
              player: {
                id: playerId,
                name: playerName,
                joinedAt: player.joinedAt
              }
            }
          }, playerId);

          sendLobbyUpdate(lobbyCode);
          break;
        }

        case MESSAGE_TYPES.SEND_MESSAGE: {
          const { lobbyCode, playerId, message: chatMessage } = message;
          const lobby = lobbies.get(lobbyCode);
          const player = players.get(playerId);

          if (!lobby || !player) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              message: 'Invalid lobby or player'
            }));
            break;
          }

          const newMessage = {
            id: uuidv4(),
            type: 'player',
            playerId: playerId,
            playerName: player.name,
            message: chatMessage,
            timestamp: new Date().toISOString(),
            lobbyCode
          };

          lobby.messages.push(newMessage);

          // Broadcast message to all players in lobby
          broadcastToLobby(lobbyCode, {
            type: MESSAGE_TYPES.CHAT_MESSAGE,
            data: newMessage
          });

          break;
        }

        case MESSAGE_TYPES.LEAVE_LOBBY: {
          const { playerId } = message;
          const player = players.get(playerId);
          
          if (!player) break;

          const lobbyCode = player.lobbyCode;
          const lobby = lobbies.get(lobbyCode);
          
          if (lobby) {
            // Remove player from lobby
            lobby.players = lobby.players.filter(id => id !== playerId);
            
            // Add leave message
            lobby.messages.push(createSystemMessage(`${player.name} left the lobby`, lobbyCode));
            
            // Notify others
            broadcastToLobby(lobbyCode, {
              type: MESSAGE_TYPES.PLAYER_LEFT,
              data: {
                playerId: playerId,
                playerName: player.name
              }
            });

            // Delete lobby if empty
            if (lobby.players.length === 0) {
              lobbies.delete(lobbyCode);
              console.log(`🗑️ Deleted empty lobby: ${lobbyCode}`);
            } else {
              sendLobbyUpdate(lobbyCode);
            }
          }

          // Remove player
          players.delete(playerId);
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: MESSAGE_TYPES.ERROR,
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected');
    
    // Find and remove player
    for (const [playerId, player] of players.entries()) {
      if (player.ws === ws) {
        // Trigger leave lobby logic
        const lobbyCode = player.lobbyCode;
        const lobby = lobbies.get(lobbyCode);
        
        if (lobby) {
          lobby.players = lobby.players.filter(id => id !== playerId);
          lobby.messages.push(createSystemMessage(`${player.name} disconnected`, lobbyCode));
          
          broadcastToLobby(lobbyCode, {
            type: MESSAGE_TYPES.PLAYER_LEFT,
            data: {
              playerId: playerId,
              playerName: player.name
            }
          });

          if (lobby.players.length === 0) {
            lobbies.delete(lobbyCode);
          } else {
            sendLobbyUpdate(lobbyCode);
          }
        }
        
        players.delete(playerId);
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Health check endpoint for debugging
console.log(`📊 Active lobbies: ${lobbies.size}, Active players: ${players.size}`);

// Periodic cleanup of disconnected players
setInterval(() => {
  let cleanedCount = 0;
  for (const [playerId, player] of players.entries()) {
    if (player.ws.readyState !== player.ws.OPEN) {
      players.delete(playerId);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} disconnected players`);
  }
}, 30000); // Every 30 seconds
