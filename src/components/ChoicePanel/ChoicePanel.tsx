import React from "react";
import "./ChoicePanel.css";

interface ChoicePanelProps {
  count?: number;
}

const ChoicePanel: React.FC<ChoicePanelProps> = ({ count = 6 }) => {
  const items = Array.from({ length: count });
  return (
    <div className="choice-panel">
      {items.map((_, i) => (
        <div key={i} className="choice-card" />
      ))}
    </div>
  );
};

export default ChoicePanel;