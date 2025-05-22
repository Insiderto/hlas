/**
 * Demo Todo Application
 */

import React, { useState } from "react";
import { action, useHlasActions, Describe } from "../src";

// Define the Todo interface
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface SetValueParams {
  value?: string;
}

// Create a wrapped Button component with action
const ActionButton = action(
  {
    id: "click",
    name: "Click",
    description: "Trigger a button click",
  },
  // Using React.forwardRef to properly handle the ref
  React.forwardRef<HTMLElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    function Button(props, ref) {
      return (
        <button ref={ref as React.RefObject<HTMLButtonElement>} {...props} />
      );
    },
  ),
);

ActionButton.displayName = "ActionButton";

// Create a wrapped Input component with setValue action
const ForwardedInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function InnerActionInput(props, ref) {
  return <input ref={ref} {...props} />;
});
ForwardedInput.displayName = "ForwardedActionInput";

const ActionInput = action(
  {
    id: "setValue", // This ID is also used by the LLMInterface, consider if it should be more specific like "todo-input-setValue"
    name: "Set Value", // Name for the action, not the component
    description: "Set the input value",
    parameters: [{ name: "value", description: "The value to set" }],
  },
  ForwardedInput,
);
// It might be beneficial to also set a displayName on ActionInput itself if the `action` HOC doesn't.
// e.g., ActionInput.displayName = "ActionInputComponent";

const TodoApp: React.FC = () => {
  // State for todos
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn about hlas", completed: false },
    { id: 2, text: "Build a demo", completed: false },
  ]);

  // State for new todo input
  const [newTodo, setNewTodo] = useState("");

  // Next ID for new todos
  const [nextId, setNextId] = useState(3);

  // Actions for the Todo Input field
  const todoInputActions = {
    setValue: (params: SetValueParams = {}) => {
      if (params.value && typeof params.value === "string") {
        setNewTodo(params.value);
      }
    },
  };

  // Hook up the Todo Input field
  const todoInputRef = useHlasActions(
    todoInputActions,
    "Todo Input Field",
    "Input field for adding new todos",
  );

  // Actions for the Add Todo button
  const addTodoActions = {
    addTodo: () => {
      if (newTodo.trim()) {
        setTodos([...todos, { id: nextId, text: newTodo, completed: false }]);
        setNextId(nextId + 1);
        setNewTodo("");
      }
    },
  };

  // Hook up the Add Todo button
  const addTodoRef = useHlasActions(
    addTodoActions,
    "Add Todo Button",
    "Adds a new todo item to the list",
  );

  // Actions for Clear Completed button
  const clearCompletedActions = {
    clearCompleted: () => {
      setTodos(todos.filter((todo) => !todo.completed));
    },
  };

  // Hook up the Clear Completed button
  const clearCompletedRef = useHlasActions(
    clearCompletedActions,
    "Clear Completed Button",
    "Removes all completed todos from the list",
  );

  // Handle toggle todo completion
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  // Create toggle actions for each todo
  const createToggleActions = (id: number) => ({
    toggle: () => toggleTodo(id),
  });

  return (
    <div className="todo-app">
      <h1>Todo App with hlas</h1>

      <div className="add-todo">
        <ActionInput
          ref={todoInputRef}
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
        />
        <ActionButton ref={addTodoRef} onClick={addTodoActions.addTodo}>
          Add Todo
        </ActionButton>
      </div>

      <div className="todo-list">
        <Describe.List
          name="Todo List"
          description="A list of todo items"
          items={todos.map((todo) => ({
            id: todo.id,
            text: todo.text,
            completed: todo.completed,
          }))}
        >
          {todos.map((todo) => {
            // Create a ref and actions for this specific todo
            const todoActions = createToggleActions(todo.id);
            const todoRef = useHlasActions(
              todoActions,
              `Todo Item: ${todo.text}`,
              `A todo item: ${todo.text} (${todo.completed ? "completed" : "incomplete"})`,
            );

            return (
              <Describe.ListItem
                key={todo.id}
                value={{
                  id: todo.id,
                  text: todo.text,
                  completed: todo.completed,
                }}
                name={`Todo: ${todo.text}`}
                description={`Todo item: ${todo.text} (${todo.completed ? "completed" : "incomplete"})`}
              >
                <div className="todo-item">
                  <ActionButton
                    ref={todoRef}
                    onClick={() => toggleTodo(todo.id)}
                    className={todo.completed ? "completed" : ""}
                  >
                    {todo.completed ? "✓" : "○"} {todo.text}
                  </ActionButton>
                </div>
              </Describe.ListItem>
            );
          })}
        </Describe.List>
      </div>

      {todos.some((todo) => todo.completed) && (
        <div className="clear-completed">
          <ActionButton
            ref={clearCompletedRef}
            onClick={clearCompletedActions.clearCompleted}
          >
            Clear Completed
          </ActionButton>
        </div>
      )}

      <div className="footer">
        <p>Try asking the LLM:</p>
        <ul>
          <li>&quot;What todos do I have?&quot;</li>
          <li>&quot;Add a todo: Buy groceries&quot;</li>
          <li>&quot;Mark &apos;Learn about hlas&apos; as completed&quot;</li>
          <li>&quot;Clear all completed todos&quot;</li>
        </ul>
      </div>
    </div>
  );
};
TodoApp.displayName = "TodoApp";

export default TodoApp;
