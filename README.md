# hlas Library (Proof of Concept)

A minimal viable implementation of the hlas library to validate core concepts and demonstrate feasibility of LLM-UI integration.

## What is hlas?

hlas is a lightweight library that enables semantic UI markup for LLM integration. It allows:

- Wrapping UI components with the `action()` function to make them accessible to LLMs
- Using `Describe` components to provide readable content for LLMs
- Reading the current screen state with `window.hlas.readScreen()`
- Executing actions via natural language using `window.hlas.execute()`

## Installation and Running the Demo

```bash
# Clone the repository
git clone [repository-url]
cd hlas

# Install dependencies
npm install

# Start the demo application
npm start
```

This will launch the Todo app demo in your browser. Try these commands in the LLM simulator panel:

1. "What todos do I have?"
2. "Add a todo: Buy groceries"
3. "Mark 'Learn about hlas' as completed"
4. "Clear all completed todos"

## Development

```bash
# Run TypeScript in watch mode
npm run dev

# Build the library
npm run build

# Build the demo
npm run build:demo

# Run tests
npm test
```

## Basic Usage

### Wrapping a component with `action()`

```tsx
import { action } from 'hlas';

// Create a button with an action
const ActionButton = action(
  {
    id: 'click',
    name: 'Click Button',
    description: 'Performs a click on the button'
  },
  React.forwardRef((props, ref) => (
    <button ref={ref} {...props} />
  ))
);
```

### Using the `useHlasActions` hook

```tsx
import { useHlasActions } from 'hlas';

// Define actions
const actions = {
  save: () => console.log('Saving data...'),
  delete: (params) => console.log(`Deleting item ${params.id}`)
};

// In your component
const buttonRef = useHlasActions(
  actions,
  'Save Button',
  'Saves the current form data'
);

return <ActionButton ref={buttonRef}>Save</ActionButton>;
```

### Using Describe components

```tsx
import { Describe } from 'hlas';

// Create a readable list
return (
  <Describe.List name="User List" description="A list of active users">
    {users.map(user => (
      <Describe.ListItem 
        key={user.id} 
        name={`User: ${user.name}`}
        value={user}
      >
        {user.name}
      </Describe.ListItem>
    ))}
  </Describe.List>
);
```

### Reading the screen

```js
// In your LLM integration code
const screenState = window.hlas.readScreen();
console.log(screenState);
// Returns an array of visible components with their properties
```

### Executing actions

```js
// In your LLM integration code
window.hlas.execute('component-id', 'actionId', { param1: 'value' });
```

## Demo Application

The included demo is a simple Todo application that demonstrates how to:

1. Create actionable components
2. Register and manage actions
3. Implement screen reading
4. Process natural language commands

Try these commands in the LLM simulator:
- "What todos do I have?"
- "Add a todo: Buy groceries"
- "Mark 'Learn about hlas' as completed"
- "Clear all completed todos"

## API Reference

### Core Functions

- `action(schema, Component)`: Wraps a React component with hlas capabilities
- `useHlasActions(actions, name, description)`: Registers actions for a component

### Describe Components

- `Describe.List`: Renders a list with semantic markup
- `Describe.ListItem`: Renders a list item with semantic markup

### Global API

Available on `window.hlas`:

- `find(query)`: Finds components by name or description
- `execute(id, actionId, params)`: Executes an action on a component
- `readScreen()`: Returns the current screen state
- `focus(id)`: Focuses a component by ID

## Project Structure

```
hlas/
├── src/                  # Library source code
│   ├── core/             # Core functionality
│   ├── hooks/            # React hooks
│   ├── components/       # UI components
│   └── index.ts          # Main exports
├── demo/                 # Demo application
│   ├── TodoApp.tsx       # Todo application
│   ├── LLMInterface.ts   # LLM integration
│   └── index.tsx         # Demo entry point
└── tests/                # Basic tests
```

## Technical Constraints

- React 18+
- TypeScript 4.5+
- Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+)

## License

MIT
