import { useState } from "react";
import "../../styles/Global.css";
import "./LandingPage.css";

interface LandingPageProps {
  onJoinLobby: (lobbyCode: string, playerName: string) => Promise<void>;
  onCreateLobby: (playerName: string) => Promise<void>;
  error?: string | null;
}

function LandingPage({ onJoinLobby, onCreateLobby, error }: LandingPageProps) {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [lobbyCode, setLobbyCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lobbyCode.trim() && playerName.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await onJoinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await onCreateLobby(playerName.trim());
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <h1 className="landing-title">Chameleon Game</h1>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="landing">
        <div className="landing-item">
          <form 
            className={`join-input-wrapper ${showJoinInput ? "show" : ""}`}
            onSubmit={handleJoinSubmit}
          >
            <input
              type="text"
              placeholder="Enter your name"
              className="join-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <input
              type="text"
              placeholder="Enter lobby code"
              className="join-input"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              maxLength={8}
            />
            <button type="submit" disabled={!lobbyCode.trim() || !playerName.trim() || isLoading}>
              {isLoading ? "Joining..." : "Join"}
            </button>
          </form>
          <button
            id="join-button"
            onClick={() => {
              setShowJoinInput((prev) => !prev);
              if (showJoinInput) {
                setLobbyCode("");
                setPlayerName("");
              }
              setShowCreateInput(false);
            }}
          >
            {showJoinInput ? "Cancel" : "Join"}
          </button>
        </div>
        <div className="landing-item">
          <form 
            className={`create-input-wrapper ${showCreateInput ? "show" : ""}`}
            onSubmit={handleCreateSubmit}
          >
            <input
              type="text"
              placeholder="Enter your name"
              className="create-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button type="submit" disabled={!playerName.trim() || isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </button>
          </form>
          <button
            id="create-button"
            onClick={() => {
              setShowCreateInput((prev) => !prev);
              if (showCreateInput) {
                setPlayerName("");
              }
              setShowJoinInput(false);
            }}
          >
            {showCreateInput ? "Cancel" : "Create"}
          </button>
        </div>
      </div>
    </>
  );
}

export default LandingPage;
