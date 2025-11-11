import { useState, useEffect } from "react";
import "./Lobby.css";
import { wsService } from "../../services/WebSocketService";
import type { Player, ChatMessage as WSChatMessage, LobbyData } from "../../services/WebSocketService";
import Chat from "../../components/Chat";
import type { ChatMessage } from "../../components/Chat";

interface LobbyProps {
  lobbyCode: string;
  playerName: string;
  onLeaveLobby: () => void;
}

function Lobby({ lobbyCode, playerName, onLeaveLobby }: LobbyProps) {
  const [members, setMembers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Convert WebSocket message to local format
  const convertWSMessage = (wsMessage: WSChatMessage): ChatMessage => {
    return {
      id: wsMessage.id,
      memberId: wsMessage.playerId || "system",
      memberName: wsMessage.playerName,
      message: wsMessage.message,
      timestamp: new Date(wsMessage.timestamp),
      type: wsMessage.type
    };
  };

  useEffect(() => {
    // Set up WebSocket event handlers
    wsService.setOnLobbyUpdate((lobbyData: LobbyData) => {
      setMembers(lobbyData.players);
      setChatMessages(lobbyData.messages.map(convertWSMessage));
    });

    wsService.setOnChatMessage((message: WSChatMessage) => {
      setChatMessages(prev => [...prev, convertWSMessage(message)]);
    });

    wsService.setOnPlayerJoined((player: Player) => {
      setMembers(prev => [...prev, player]);
    });

    wsService.setOnPlayerLeft((playerId: string, playerName: string) => {
      setMembers(prev => prev.filter(member => member.id !== playerId));
    });

    // Cleanup on unmount
    return () => {
      wsService.setOnLobbyUpdate(null);
      wsService.setOnChatMessage(null);
      wsService.setOnPlayerJoined(null);
      wsService.setOnPlayerLeft(null);
    };
  }, []);

  const handleSendChatMessage = (message: string) => {
    wsService.sendMessage(lobbyCode, message);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Lobby: {lobbyCode}</h1>
        <button className="leave-button" onClick={onLeaveLobby}>
          Leave Lobby
        </button>
      </div>

      <div className="lobby-content">
        <div className="members-section">
          <h2>Members ({members.length})</h2>
          <div className="members-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-avatar">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-joined">
                    Joined {formatTime(new Date(member.joinedAt))}
                  </span>
                </div>
                {member.name === playerName && (
                  <span className="you-indicator">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="chat-section">
          <h2>Chat</h2>
          <Chat 
            messages={chatMessages}
            currentPlayerName={playerName}
            onSendMessage={handleSendChatMessage}
            placeholder="Type a message..."
          />
        </div>
      </div>

      <div className="lobby-actions">
        <button className="start-game-button">Start Game</button>
      </div>
    </div>
  );
}

export default Lobby;
