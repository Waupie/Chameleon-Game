import { useEffect, useState } from "react";
import "../../styles/Global.css";
import "./LandingPage.css";

function LandingPage() {
  const [showJoinInput, setShowJoinInput] = useState(false);

  useEffect(() => {});

  return (
    <>
      <h1 className="landing-title">Chameleon Game</h1>
      <div className="landing">
        <div className="landing-item">
          <div className={`join-input-wrapper ${showJoinInput ? "show" : ""}`}>
            <input
              type="text"
              placeholder="Enter lobby code"
              className="join-input"
            />
            <button>Join</button>
          </div>
          <button
            id="join-button"
            onClick={() => setShowJoinInput((prev) => !prev)}
          >
            {showJoinInput ? "Cancel" : "Join"}
          </button>
        </div>
        <div className="landing-item">
          <button>Create</button>
        </div>
      </div>
    </>
  );
}

export default LandingPage;
