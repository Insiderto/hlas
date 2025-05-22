/**
 * Real LLM Integration Panel component
 */

import React, { useState } from "react";
import RealLLMConnector from "./RealLLMConnector";

interface RealLLMPanelProps {
  onClose: () => void;
}

const RealLLMPanel: React.FC<RealLLMPanelProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiSaved, setApiSaved] = useState(false);
  const [model, setModel] = useState("gpt-4");

  const saveApiKey = () => {
    if (apiKey) {
      RealLLMConnector.setApiKey(apiKey);
      setApiSaved(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !apiKey) return;

    setIsLoading(true);
    try {
      const result = await RealLLMConnector.processCommand(command);
      setResponse(result);
    } catch (error) {
      setResponse(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="real-llm-panel">
      <div className="real-llm-header">
        <h2>Test with Real LLM API</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="api-key-section">
        <label htmlFor="api-key">OpenAI API Key:</label>
        <div className="api-key-input">
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="api-key-field"
          />
          <button
            onClick={saveApiKey}
            className="save-api-button"
            disabled={!apiKey || apiSaved}
          >
            {apiSaved ? "Saved" : "Save Key"}
          </button>
        </div>
        <p className="api-note">
          Your API key is only stored in memory and never saved or transmitted
          anywhere except to OpenAI.
        </p>
      </div>

      <div className="model-selection">
        <label htmlFor="model-select">Model:</label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="model-select"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="command-form">
        <label htmlFor="real-command">Enter command for the LLM:</label>
        <input
          id="real-command"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., Add a todo: Buy milk"
          className="command-input"
          disabled={!apiSaved || isLoading}
        />
        <button
          type="submit"
          className="submit-button"
          disabled={!apiSaved || isLoading || !command.trim()}
        >
          {isLoading ? "Processing..." : "Send to LLM"}
        </button>
      </form>

      {response && (
        <div className="response-container">
          <h3>LLM Response:</h3>
          <div className="response-content">{response}</div>
        </div>
      )}

      <div className="example-commands">
        <h3>Example Commands:</h3>
        <ul>
          <li onClick={() => setCommand("What todos do I have?")}>
            &quot;What todos do I have?&quot;
          </li>
          <li onClick={() => setCommand("Add a todo: Buy groceries")}>
            &quot;Add a todo: Buy groceries&quot;
          </li>
          <li
            onClick={() => setCommand("Mark 'Learn about hlas' as completed")}
          >
            &quot;Mark &apos;Learn about hlas&apos; as completed&quot;
          </li>
          <li onClick={() => setCommand("Clear all completed todos")}>
            &quot;Clear all completed todos&quot;
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RealLLMPanel;
