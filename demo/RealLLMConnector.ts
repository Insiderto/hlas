/**
 * RealLLMConnector - connects the hlas library to a real LLM API
 */

// Define the OpenAI API response format
interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Class to connect to real LLM services like OpenAI
 */
class RealLLMConnector {
  private apiKey: string = '';
  private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-4'; // You can change to gpt-3.5-turbo or other models

  /**
   * Set the API key for the LLM service
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Get the current screen state formatted as a prompt
   */
  private getScreenStatePrompt(): string {
    if (typeof window === 'undefined' || !window.hlas) {
      throw new Error('hlas is not available');
    }

    // Read the current screen state
    const screenState = window.hlas.readScreen();
    
    // Format the system prompt that would be sent to an LLM
    return `
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
- You can highlight elements using: HIGHLIGHT(componentId, durationMs)
- Respond to the user's request based on the current screen state
- If you need more information, you can ask for it

Only respond with EXECUTE, FOCUS, or HIGHLIGHT commands or direct answers to questions.
`;
  }

  /**
   * Process a user command with a real LLM
   */
  async processCommand(command: string): Promise<string> {
    if (!this.apiKey) {
      return 'Error: API key not set. Call setApiKey(key) first.';
    }

    try {
      const systemPrompt = this.getScreenStatePrompt();
      
      // Create the API request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: command }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return `API Error: ${response.status} - ${errorText}`;
      }

      const data = await response.json() as OpenAIResponse;
      const llmResponse = data.choices[0].message.content;
      
      // Execute any commands in the response
      await this.executeCommands(llmResponse);
      
      return llmResponse;
    } catch (error) {
      console.error('Error calling LLM API:', error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Execute commands found in LLM response
   */
  private async executeCommands(response: string): Promise<void> {
    if (typeof window === 'undefined' || !window.hlas) {
      return;
    }

    // Look for EXECUTE commands
    const executeMatches = response.matchAll(/EXECUTE\((['"]?)(.*?)\1,\s*(['"]?)(.*?)\3(?:,\s*({.*?}))?\)/g);
    for (const match of executeMatches) {
      const componentId = match[2];
      const actionId = match[4];
      const paramsStr = match[5];
      
      let params = {};
      if (paramsStr) {
        try {
          params = JSON.parse(paramsStr);
        } catch (e) {
          console.error('Error parsing parameters:', e);
        }
      }
      
      window.hlas.execute(componentId, actionId, params);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for effects
    }

    // Look for FOCUS commands
    const focusMatches = response.matchAll(/FOCUS\((['"]?)(.*?)\1\)/g);
    for (const match of focusMatches) {
      const componentId = match[2];
      window.hlas.focus(componentId);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for effects
    }

    // Look for HIGHLIGHT commands
    const highlightMatches = response.matchAll(/HIGHLIGHT\((['"]?)(.*?)\1(?:,\s*(\d+))?\)/g);
    for (const match of highlightMatches) {
      const componentId = match[2];
      const duration = match[3] ? parseInt(match[3]) : undefined;
      window.hlas.highlight(componentId, duration);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for effects
    }
  }
}

export default new RealLLMConnector();
