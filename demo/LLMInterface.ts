/**
 * Simple LLM integration example for the hlas library
 */

// For PoC purposes, we'll use a simple approach with minimal typing
// In a real implementation, we would use proper type imports

// Add basic window.hlas declaration for TypeScript
declare global {
  interface Window {
    hlas: any;
    lastCommand?: string; // Track the last command for the prompt visualization
  }
}

/**
 * Interface for handling LLM commands on the Todo app
 */
class LLMInterface {
  /**
   * Process a natural language command
   *
   * @param command The natural language command to process
   * @returns A response from the system
   */
  processCommand(command: string): string {
    const normalizedCommand = command.toLowerCase().trim();

    // Check for command types
    if (this.isReadCommand(normalizedCommand)) {
      return this.readTodos();
    } else if (this.isAddCommand(normalizedCommand)) {
      const todoText = this.extractTodoText(normalizedCommand);
      if (todoText) {
        return this.addTodo(todoText);
      }
    } else if (this.isMarkCommand(normalizedCommand)) {
      const todoText = this.extractTodoToMark(normalizedCommand);
      if (todoText) {
        return this.markTodo(todoText);
      }
    } else if (this.isClearCommand(normalizedCommand)) {
      return this.clearCompletedTodos();
    }

    return "Sorry, I don't understand that command. Try asking about your todos, adding a todo, marking a todo as completed, or clearing completed todos.";
  }

  /**
   * Check if the command is asking to read todos
   */
  private isReadCommand(command: string): boolean {
    return (
      command.includes("what") &&
      command.includes("todo") &&
      (command.includes("have") || command.includes("are"))
    );
  }

  /**
   * Check if the command is asking to add a todo
   */
  private isAddCommand(command: string): boolean {
    return command.includes("add") && command.includes("todo");
  }

  /**
   * Check if the command is asking to mark a todo as completed
   */
  private isMarkCommand(command: string): boolean {
    return (
      (command.includes("mark") || command.includes("complete")) &&
      command.includes("todo")
    );
  }

  /**
   * Check if the command is asking to clear completed todos
   */
  private isClearCommand(command: string): boolean {
    return command.includes("clear") && command.includes("completed");
  }

  /**
   * Extract todo text from an add command
   */
  private extractTodoText(command: string): string | null {
    // Look for patterns like "add a todo: buy milk" or "add todo buy milk"
    const colonPattern = /add.*todo.*:\s*(.+)/i;
    const spacePattern = /add.*todo\s+(.+)/i;

    const colonMatch = command.match(colonPattern);
    if (colonMatch && colonMatch[1]) {
      return colonMatch[1].trim();
    }

    const spaceMatch = command.match(spacePattern);
    if (spaceMatch && spaceMatch[1]) {
      return spaceMatch[1].trim();
    }

    return null;
  }

  /**
   * Extract todo text from a mark command
   */
  private extractTodoToMark(command: string): string | null {
    // Look for patterns with quotes like 'mark "buy milk" as completed'
    const quotePattern =
      /mark.*['"](.+)['"].*(?:as completed|as done|complete)/i;
    const match = command.match(quotePattern);

    if (match && match[1]) {
      return match[1].trim();
    }

    // Fallback to looking for anything after "mark" and before "as completed"
    const fallbackPattern = /mark\s+(.+?)\s+(?:as completed|as done|complete)/i;
    const fallbackMatch = command.match(fallbackPattern);

    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].trim();
    }

    return null;
  }

  /**
   * Read all todos using window.hlas
   */
  private readTodos(): string {
    if (typeof window === "undefined" || !window.hlas) {
      return "Error: hlas is not available";
    }

    const screen = window.hlas.readScreen();

    // Find the todo list component
    const todoList = screen.find(
      (comp) =>
        comp.name === "Todo List" ||
        (comp.description && comp.description.includes("todo")),
    );

    if (!todoList || !todoList.content) {
      return "No todos found";
    }

    // Highlight the todo list component to show it's being read
    window.hlas.highlight(todoList.id, 3000);

    // Format and return todos
    const todos = Array.isArray(todoList.content) ? todoList.content : [];

    if (todos.length === 0) {
      return "You have no todos";
    }

    const todoStrings = todos.map(
      (todo: any) => `- ${todo.text} ${todo.completed ? "(completed)" : ""}`,
    );

    return `You have the following todos:\n${todoStrings.join("\n")}`;
  }

  /**
   * Add a new todo using window.hlas
   */
  private addTodo(todoText: string): string {
    if (typeof window === "undefined" || !window.hlas) {
      return "Error: hlas is not available";
    }

    const screen = window.hlas.readScreen();

    // Find the todo input field
    const todoInput = screen.find(
      (comp) =>
        comp.name === "Todo Input Field" ||
        (comp.description && comp.description.includes("input")),
    );

    if (!todoInput) {
      return "Could not find the todo input field";
    }

    // Find the add todo button
    const addButton = screen.find(
      (comp) =>
        comp.name === "Add Todo Button" ||
        (comp.description && comp.description.includes("add")),
    );

    if (!addButton) {
      return "Could not find the add todo button";
    }

    // Highlight the input field
    window.hlas.highlight(todoInput.id, 2000);

    // Use the setValue action to set the input value directly
    window.hlas.execute(todoInput.id, "setValue", { value: todoText });

    // Highlight the add button after a short delay
    setTimeout(() => {
      window.hlas.highlight(addButton.id, 2000);

      // Execute the addTodo action
      setTimeout(() => {
        window.hlas.execute(addButton.id, "addTodo");
      }, 800);
    }, 1200);

    return `Added todo: "${todoText}"`;
  }

  /**
   * Mark a todo as completed using window.hlas
   */
  private markTodo(todoText: string): string {
    if (typeof window === "undefined" || !window.hlas) {
      return "Error: hlas is not available";
    }

    const screen = window.hlas.readScreen();

    // Find the todo item that matches the text
    const todoItem = screen.find(
      (comp) =>
        comp.name?.includes(todoText) ||
        (comp.description && comp.description.includes(todoText)),
    );

    if (!todoItem) {
      return `Could not find a todo with text "${todoText}"`;
    }

    // Highlight the todo item that will be marked
    window.hlas.highlight(todoItem.id, 3000);

    // Execute the toggle action after a short delay
    setTimeout(() => {
      window.hlas.execute(todoItem.id, "toggle");
    }, 800);

    return `Marked "${todoText}" as completed`;
  }

  /**
   * Clear completed todos using window.hlas
   */
  private clearCompletedTodos(): string {
    if (typeof window === "undefined" || !window.hlas) {
      return "Error: hlas is not available";
    }

    const screen = window.hlas.readScreen();

    // Find the clear completed button
    const clearButton = screen.find(
      (comp) =>
        comp.name === "Clear Completed Button" ||
        (comp.description && comp.description.includes("clear")),
    );

    if (!clearButton) {
      return "No completed todos to clear";
    }

    // Highlight the clear completed button
    window.hlas.highlight(clearButton.id, 2500);

    // Execute the clearCompleted action after a short delay
    setTimeout(() => {
      window.hlas.execute(clearButton.id, "clearCompleted");
    }, 1000);

    return "Cleared all completed todos";
  }
}

export default new LLMInterface();
