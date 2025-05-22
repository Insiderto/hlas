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
import { action } from "hlas";

// Create a button with an action
const ActionButton = action(
  {
    id: "click",
    name: "Click Button",
    description: "Performs a click on the button",
  },
  React.forwardRef((props, ref) => <button ref={ref} {...props} />),
);
```

### Using the `useHlasActions` hook

```tsx
import { useHlasActions } from "hlas";

// Define actions
const actions = {
  save: () => console.log("Saving data..."),
  delete: (params) => console.log(`Deleting item ${params.id}`),
};

// In your component
const buttonRef = useHlasActions(
  actions,
  "Save Button",
  "Saves the current form data",
);

return <ActionButton ref={buttonRef}>Save</ActionButton>;
```

### Using Describe components

```tsx
import { Describe } from "hlas";

// Create a readable list
return (
  <Describe.List name="User List" description="A list of active users">
    {users.map((user) => (
      <Describe.ListItem key={user.id} name={`User: ${user.name}`} value={user}>
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
window.hlas.execute("component-id", "actionId", { param1: "value" });
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

The `Describe` components are used to add semantic information to your UI elements, making them understandable to the HLAS system. They automatically register themselves with the HLAS registry. All `Describe` components support an `as` prop for polymorphic rendering and pass through standard HTML and ARIA attributes for enhanced accessibility.

- **`Describe.Base`**: A fundamental component to wrap any UI section, providing it with a name and description. Renders as a `div` by default.
  ```jsx
  <Describe.Base name="User Profile Section" description="Contains user avatar and details.">
    <UserProfile />
  </Describe.Base>
  ```

- **`Describe.Container`**: For semantically describing a generic container (e.g., for layout). Renders as a `div` by default.
  ```jsx
  <Describe.Container name="PageHeader" description="Top section of the page including logo and navigation.">
    {/* ...header content... */}
  </Describe.Container>
  ```

- **`Describe.Text`**: For describing a piece of text. Renders as a `span` by default.
  ```jsx
  <Describe.Text name="welcome-message" description="A welcome message for the user.">
    Hello, {userName}!
  </Describe.Text>
  ```

- **`Describe.Heading`**: For describing heading elements. Renders as `h1`-`h6` based on the `level` prop (defaults to `h1`). Sets `aria-level` and `role="heading"` if rendered as a non-heading element via the `as` prop.
  ```jsx
  <Describe.Heading name="main-title" description="The main title of the page" level={1}>
    Welcome to Our Site
  </Describe.Heading>
  <Describe.Heading name="sub-section-title" as="div" level={2}>
    Sub-section
  </Describe.Heading>
  ```

- **`Describe.Image`**: For describing images. Renders as an `img` by default. Requires `src` and `alt` props. Sets `data-hlas-src`, `data-hlas-alt`. If rendered as a non-`img` element, `alt` is used for `aria-label` and `role="img"` is applied.
  ```jsx
  <Describe.Image name="logo" description="The company logo" src="/logo.png" alt="Company Logo" />
  <Describe.Image name="avatar" as="div" src="/user.jpg" alt="User Avatar" />
  ```

- **`Describe.Link`**: For describing hyperlinks. Renders as an `a` by default. Requires `href` prop. Sets `data-hlas-href`. If rendered as a non-`a` element, `role="link"` is applied.
  ```jsx
  <Describe.Link name="home-navigation" description="Link to the homepage" href="/">
    Home
  </Describe.Link>
  ```

- **`Describe.Button`**: For describing button elements. Renders as a `button` by default (with `type="button"` if no type is specified). If rendered as a non-`button` element, `role="button"` is applied.
  ```jsx
  <Describe.Button name="submit-form" description="Submits the contact form">
    Send Message
  </Describe.Button>
  <Describe.Button name="action-trigger" as="span" role="button" tabIndex={0}>
    Perform Action
  </Describe.Button>
  ```

- **`Describe.List`**: Renders a list (default `<ul>`). Can take an `items` prop for `data-hlas-content`. If rendered as a non-list element, `role="list"` is applied.
  ```jsx
  <Describe.List name="User List" description="A list of active users">
    {users.map((user) => ( /* ... */ ))}
  </Describe.List>
  ```

- **`Describe.ListItem`**: Renders a list item (default `<li>`). Can take a `value` prop for `data-hlas-content`. If rendered as a non-listitem element, `role="listitem"` is applied.
  ```jsx
  <Describe.ListItem name={`User: ${user.name}`} value={user}>
    {user.name}
  </Describe.ListItem>
  ```

#### Polymorphic Rendering with the `as` Prop

All `Describe` components support an `as` prop, allowing you to change the underlying HTML element they render. This provides flexibility while maintaining semantic meaning through HLAS attributes and appropriate ARIA roles.

For example, you can render a list as a `<nav>` element or a list item as a `<div>`:
```jsx
<Describe.List name="navigation-links" description="Main navigation" as="nav">
  <Describe.ListItem name="home-link" value={{ path: "/" }} as="div">
    <a href="/">Home</a>
  </Describe.ListItem>
  {/* ...other items */}
</Describe.List>
```

#### ARIA Support

`Describe` components automatically apply relevant ARIA roles when the `as` prop is used to render a semantically different HTML element (e.g., `Describe.Button as="div"` will have `role="button"`). Standard ARIA attributes like `aria-label`, `aria-describedby`, etc., can be passed directly as props and will be applied to the rendered element.

Example:
```jsx
<Describe.Button name="submit-form" description="Submits the form" as="div" role="button" tabIndex={0} aria-label="Submit User Data">
  Submit
</Describe.Button>
```

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
