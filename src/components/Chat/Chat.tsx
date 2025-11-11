import { useState, useEffect, useRef } from "react";
import "./Chat.css";

export interface ChatMessage {
  id: string;
  memberId: string;
  memberName: string;
  message: string;
  timestamp: Date;
  type?: 'player' | 'system';
}

interface ChatProps {
  messages: ChatMessage[];
  currentPlayerName: string;
  onSendMessage: (message: string) => void;
  placeholder?: string;
  maxHeight?: string;
}

function Chat({ 
  messages, 
  currentPlayerName, 
  onSendMessage, 
  placeholder = "Type a message...",
  maxHeight = "400px"
}: ChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div 
        className="chat-messages" 
        style={{ maxHeight }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${
              message.memberName === currentPlayerName ? "own-message" : ""
            } ${message.type === "system" ? "system-message" : ""}`}
          >
            <div className="message-header">
              <span className="message-author">{message.memberName}</span>
              <span className="message-time">
                {formatTime(message.timestamp)}
              </span>
            </div>
            <div className="message-content">{message.message}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={placeholder}
          className="chat-input"
          maxLength={500}
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
