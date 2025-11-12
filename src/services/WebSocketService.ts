export interface Player {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  type: 'player' | 'system';
  playerId?: string;
  playerName: string;
  message: string;
  timestamp: string;
  lobbyCode: string;
}

export interface LobbyData {
  code: string;
  players: Player[];
  messages: ChatMessage[];
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event handlers
  private onLobbyUpdate: ((lobbyData: LobbyData) => void) | null = null;
  private onChatMessage: ((message: ChatMessage) => void) | null = null;
  private onPlayerJoined: ((player: Player) => void) | null = null;
  private onPlayerLeft: ((playerId: string, playerName: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;

  connect(serverUrl?: string): Promise<void> {
    // Auto-detect server URL based on environment
    if (!serverUrl) {
      const host = window.location.hostname;
      const port = host === 'localhost' || host === '127.0.0.1' ? '8080' : '8080';
      serverUrl = `ws://${host}:${port}`;
    }
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log('🔌 Connected to WebSocket server');
          this.reconnectAttempts = 0;
          this.onConnectionChange?.(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket connection closed');
          this.onConnectionChange?.(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.onConnectionChange?.(false);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(() => {
          // Will try again up to maxReconnectAttempts
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    console.log('📨 Received message:', data);

    switch (data.type) {
      case 'CREATE_LOBBY':
        if (data.success) {
          this.playerId = data.data.playerId;
        } else {
          this.onError?.(data.message || 'Failed to create lobby');
        }
        break;

      case 'JOIN_LOBBY':
        if (data.success) {
          this.playerId = data.data.playerId;
        } else {
          this.onError?.(data.message || 'Failed to join lobby');
        }
        break;

      case 'LOBBY_UPDATED':
        this.onLobbyUpdate?.(data.data);
        break;

      case 'CHAT_MESSAGE':
        this.onChatMessage?.(data.data);
        break;

      case 'PLAYER_JOINED':
        this.onPlayerJoined?.(data.data.player);
        break;

      case 'PLAYER_LEFT':
        this.onPlayerLeft?.(data.data.playerId, data.data.playerName);
        break;

      case 'ERROR':
        this.onError?.(data.message);
        break;
    }
  }

  createLobby(playerName: string): Promise<{ lobbyCode: string; playerId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const handleResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CREATE_LOBBY') {
            this.ws?.removeEventListener('message', handleResponse);
            if (data.success) {
              resolve({
                lobbyCode: data.data.lobbyCode,
                playerId: data.data.playerId
              });
            } else {
              reject(new Error(data.message || 'Failed to create lobby'));
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      this.ws.addEventListener('message', handleResponse);

      this.ws.send(JSON.stringify({
        type: 'CREATE_LOBBY',
        playerName
      }));

      // Timeout after 10 seconds
      setTimeout(() => {
        this.ws?.removeEventListener('message', handleResponse);
        reject(new Error('Create lobby timeout'));
      }, 10000);
    });
  }

  joinLobby(lobbyCode: string, playerName: string): Promise<{ playerId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const handleResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'JOIN_LOBBY') {
            this.ws?.removeEventListener('message', handleResponse);
            if (data.success) {
              resolve({ playerId: data.data.playerId });
            } else {
              reject(new Error(data.message || 'Failed to join lobby'));
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      this.ws.addEventListener('message', handleResponse);

      this.ws.send(JSON.stringify({
        type: 'JOIN_LOBBY',
        lobbyCode,
        playerName
      }));

      // Timeout after 10 seconds
      setTimeout(() => {
        this.ws?.removeEventListener('message', handleResponse);
        reject(new Error('Join lobby timeout'));
      }, 10000);
    });
  }

  sendMessage(lobbyCode: string, message: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId) {
      console.error('❌ Cannot send message: WebSocket not connected or no player ID');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'SEND_MESSAGE',
      lobbyCode,
      playerId: this.playerId,
      message
    }));
  }

  leaveLobby() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'LEAVE_LOBBY',
      playerId: this.playerId
    }));

    this.playerId = null;
  }

  disconnect() {
    if (this.playerId) {
      this.leaveLobby();
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event listener setters
  setOnLobbyUpdate(handler: (lobbyData: LobbyData) => void) {
    this.onLobbyUpdate = handler;
  }

  setOnChatMessage(handler: (message: ChatMessage) => void) {
    this.onChatMessage = handler;
  }

  setOnPlayerJoined(handler: (player: Player) => void) {
    this.onPlayerJoined = handler;
  }

  setOnPlayerLeft(handler: (playerId: string, playerName: string) => void) {
    this.onPlayerLeft = handler;
  }

  setOnError(handler: (error: string) => void) {
    this.onError = handler;
  }

  setOnConnectionChange(handler: (connected: boolean) => void) {
    this.onConnectionChange = handler;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
