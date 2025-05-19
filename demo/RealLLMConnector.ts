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
  private apiKey: string = "";
  private apiEndpoint: string = "https://api.openai.com/v1/chat/completions";
  private model: string = "gpt-4"; // You can change to gpt-3.5-turbo or other models

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
    if (typeof window === "undefined" || !window.hlas) {
      throw new Error("hlas is not available");
    }

    // Read the current screen state
    const screenState = window.hlas.readScreen();

    // Format the system prompt that would be sent to an LLM
    return `
You are an AI assistant that can interact with a user interface. You can see the current state of the 
screen and perform actions on behalf of the user.

## Current Screen State
${JSON.stringify(screenState, null, 2)}

You can execute actions using: EXECUTE(componentId, actionId, parameters)
You can focus on elements using: FOCUS(componentId)
- You can highlight elements using: HIGHLIGHT(componentId, durationMs, "Optional tooltip content")
- You can create guided tours using: TOUR([{"id":"componentId1","title":"Step 1","description":"Description for step 1","position":"bottom"},{"id":"componentId2","title":"Step 2","description":"Description for step 2","position":"top","align":"center"}])

The TOUR command takes a JSON array of steps, where each step must have at least an 'id' property, and can optionally include 'title', 'description', 'position', and 'align' properties. Position can be one of: 'top', 'right', 'bottom', 'left'. Align can be: 'start', 'center', or 'end'.

Only respond with EXECUTE, FOCUS, HIGHLIGHT, TOUR commands or direct answers to questions.
Keep your responses concise and focused on helping the user accomplish their task.
`;
  }

  /**
   * Process a user command with a real LLM
   */
  async processCommand(command: string): Promise<string> {
    if (!this.apiKey) {
      return "Error: API key not set. Call setApiKey(key) first.";
    }

    try {
      const systemPrompt = this.getScreenStatePrompt();

      // Create the API request
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: command },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return `API Error: ${response.status} - ${errorText}`;
      }

      const data = (await response.json()) as OpenAIResponse;
      const llmResponse = data.choices[0].message.content;

      // Execute any commands in the response
      await this.executeCommands(llmResponse);

      return llmResponse;
    } catch (error) {
      console.error("Error calling LLM API:", error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Execute commands found in LLM response
   */
  private async executeCommands(response: string): Promise<void> {
    if (typeof window === "undefined" || !window.hlas) {
      return;
    }

    // Look for EXECUTE commands
    const executeMatches = response.matchAll(
      /EXECUTE\((['"\s]?)(.*?)\1,\s*(['"\s]?)(.*?)\3(?:,\s*([^)]*))?\)/g,
    );
    for (const match of executeMatches) {
      const componentId = match[2];
      const actionId = match[4];
      let params = {};

      if (match[5]) {
        try {
          params = JSON.parse(match[5]);
        } catch (e) {
          // If not valid JSON, try parsing as a simple string
          // This is for convenience in simple cases like EXECUTE(component, action, "simple string")
          params = { value: match[5].trim().replace(/^['"]|['"]$/g, "") };
        }
      }

      window.hlas.execute(componentId, actionId, params);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for effects
    }

    // Look for FOCUS commands
    const focusMatches = response.matchAll(/FOCUS\((['"\s]?)(.*?)\1\)/g);
    for (const match of focusMatches) {
      const componentId = match[2];
      window.hlas.focus(componentId);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for effects
    }

    // Look for HIGHLIGHT commands
    // Format: HIGHLIGHT(componentId, duration?, "tooltip content?")
    const highlightMatches = response.matchAll(
      /HIGHLIGHT\((['"\s]?)(.*?)\1(?:,\s*(\d+))?(?:,\s*(['"\s])(.*?)\4)?\)/g,
    );
    for (const match of highlightMatches) {
      const componentId = match[2];
      const duration = match[3] ? parseInt(match[3]) : undefined;
      const tooltip = match[5] || undefined;
      window.hlas.highlight(componentId, duration, tooltip);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for effects
    }

    // Look for TOUR commands
    // Format: TOUR([{"id":"componentId1","title":"Step 1","description":"Description"}, ...])
    const tourRegex = /TOUR\(\s*(\[.*?\])\s*\)/s;
    const tourMatch = response.match(tourRegex);
    if (tourMatch && tourMatch[1]) {
      try {
        const stepsJson = tourMatch[1];
        const steps = JSON.parse(stepsJson);
        if (Array.isArray(steps) && steps.length > 0) {
          window.hlas.startTour(steps);
          // No need to wait after starting a tour as it's interactive
        } else {
          console.error("TOUR command requires a non-empty array of steps");
        }
      } catch (e) {
        console.error("Failed to parse TOUR command:", e);
      }
    }
  }
}

export default new RealLLMConnector();
