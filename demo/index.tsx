/**
 * Demo application entry point
 */

import React, { useState } from "react";

// Using inline import with any type to avoid TS import issues for the PoC
import { createRoot } from "react-dom/client";
import TodoApp from "./TodoApp";
import LLMInterface from "./LLMInterface";
import LLMPrompt from "./LLMPrompt";
import RealLLMPanel from "./RealLLMPanel";
import "./styles.css";

const App = () => {
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");
  const [showRealLLM, setShowRealLLM] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Save the command to window for the prompt visualization
    window.lastCommand = command;

    const result = LLMInterface.processCommand(command);
    setResponse(result);
    setCommand("");
  };

  const toggleRealLLM = () => {
    setShowRealLLM(!showRealLLM);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>hlas Library PoC Demo</h1>
        <p className="app-description">
          This demo shows how the hlas library enables LLM-UI integration
          through semantic markup. Try the commands in the LLM simulator or view
          how the prompt would look for an actual LLM.
        </p>
      </header>

      <div className="app-grid">
        {/* Left column - Todo App and LLM Interface */}
        <div className="app-column">
          <div className="app-main">
            <TodoApp />
          </div>

          <div className="llm-interface">
            <h2>LLM Interface</h2>

            <div className="llm-mode-controls">
              <button
                className={`llm-mode-button ${!showRealLLM ? "active" : ""}`}
                onClick={() => setShowRealLLM(false)}
              >
                Simulation
              </button>
              <button
                className={`llm-mode-button ${showRealLLM ? "active" : ""}`}
                onClick={() => setShowRealLLM(true)}
              >
                Real API
              </button>
            </div>

            {!showRealLLM ? (
              <div className="sim-interface">
                <div className="response-area">
                  {response || "Try asking about your todos!"}
                </div>
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter a natural language command..."
                    className="command-input"
                  />
                  <button type="submit" className="submit-button">
                    Send Command
                  </button>
                </form>

                <div className="command-examples">
                  <h3>Example Commands:</h3>
                  <ul>
                    <li onClick={() => setCommand("What todos do I have?")}>
                      &quot;What todos do I have?"
                    </li>
                    <li onClick={() => setCommand("Add a todo: Buy groceries")}>
                      "Add a todo: Buy groceries"
                    </li>
                    <li
                      onClick={() =>
                        setCommand("Mark 'Learn about hlas' as completed")
                      }
                    >
                      "Mark 'Learn about hlas' as completed"
                    </li>
                    <li onClick={() => setCommand("Clear all completed todos")}>
                      "Clear all completed todos"
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <RealLLMPanel onClose={() => setShowRealLLM(false)} />
            )}
          </div>
        </div>

        {/* Right column - LLM Prompt View */}
        <div className="app-column">
          <LLMPrompt />
        </div>
      </div>
    </div>
  );
};

// Mount the app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
