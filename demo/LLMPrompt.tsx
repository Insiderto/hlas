/**
 * LLM Prompt Demo Component
 * Shows how the prompt would look when passed to an LLM
 */

import React, { useState, useEffect } from 'react';

const LLMPrompt: React.FC = () => {
  const [promptData, setPromptData] = useState<string>('');

  // Generate prompt data from the current screen state
  const generatePrompt = () => {
    if (typeof window === 'undefined' || !window.hlas) {
      return 'Error: hlas is not available';
    }

    // Read the current screen state
    const screenState = window.hlas.readScreen();
    
    // Format the system prompt that would be sent to an LLM
    const systemPrompt = `
# System Prompt for LLM UI Interaction

You are an AI assistant that can interact with a user interface. You can see the current state of the 
screen and perform actions on behalf of the user.

## Current Screen State
${JSON.stringify(screenState, null, 2)}

## Available Actions
${screenState.map(component => {
  if (!component.actions || component.actions.length === 0) return '';
  return `
* Component: "${component.name}" (ID: ${component.id})
  - Description: ${component.description || 'No description'}
  - Actions: ${component.actions.map(action => action.id).join(', ')}
`;
}).filter(Boolean).join('')}

## Content Elements
${screenState.map(component => {
  if (!component.content) return '';
  return `
* ${component.name}: ${JSON.stringify(component.content, null, 2)}
`;
}).filter(Boolean).join('')}

## Instructions
- You can execute actions using the syntax: EXECUTE(componentId, actionId, parameters)
- You can focus on elements using: FOCUS(componentId)
- You can highlight elements using: HIGHLIGHT(componentId, durationMs, "Optional tooltip content")
- You can create guided tours using: TOUR([{"id":"componentId1","title":"Step 1","description":"Description for step 1","position":"bottom"},{"id":"componentId2","title":"Step 2","description":"Description for step 2","position":"top","align":"center"}])
- Respond to the user's request based on the current screen state
- If you need more information, you can ask for it

## User Request:
"${window.lastCommand || 'What todos do I have?'}"
`;

    return systemPrompt;
  };

  // Update the prompt regularly to keep it in sync with UI changes
  useEffect(() => {
    // Generate prompt on initial load
    const prompt = generatePrompt();
    setPromptData(prompt);

    // Set up interval to refresh the prompt
    const intervalId = setInterval(() => {
      const prompt = generatePrompt();
      setPromptData(prompt);
    }, 2000); // Refresh every 2 seconds

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Define function to refresh prompt on demand
  const refreshPrompt = () => {
    const prompt = generatePrompt();
    setPromptData(prompt);
  };

  return (
    <div className="llm-prompt-demo">
      <h2>LLM Prompt Visualization</h2>
      <p>
        This shows how the current screen state would be formatted as a prompt for an LLM.
        This is what would be sent to the LLM when processing commands.
      </p>
      
      <button 
        className="prompt-button"
        onClick={refreshPrompt}
      >
        Refresh Prompt
      </button>
      
      <div className="prompt-container">
        <h3>Generated LLM Prompt:</h3>
        <pre className="prompt-data">{promptData}</pre>
      </div>
    </div>
  );
};

export default LLMPrompt;
