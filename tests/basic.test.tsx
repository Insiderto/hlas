/**
 * Basic tests for hlas library
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { action, useHlasActions, Describe } from "../src";

// Create a simple button with action
const ForwardedButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function InnerActionButton(props, ref) {
  return <button ref={ref} {...props} />;
});
ForwardedButton.displayName = "ForwardedButton";

const ActionButton = action(
  {
    id: "test-action",
    name: "Test Action",
    description: "A test action for unit tests",
  },
  ForwardedButton,
);

// Create a test component
const TestComponent = () => {
  const [clicked, setClicked] = React.useState(false);

  const actions = {
    click: () => setClicked(true),
  };

  const buttonRef = useHlasActions(
    actions,
    "Test Button",
    "A button for testing",
  );

  return (
    <div>
      <ActionButton
        ref={buttonRef}
        onClick={() => setClicked(true)}
        data-testid="action-button"
      >
        Click Me
      </ActionButton>
      {clicked && <div data-testid="result">Clicked!</div>}

      <Describe.List
        name="Test List"
        description="A list for testing"
        items={["Item 1", "Item 2", "Item 3"]}
      >
        <Describe.ListItem name="Item 1" value="Item 1">
          Item 1
        </Describe.ListItem>
        <Describe.ListItem name="Item 2" value="Item 2">
          Item 2
        </Describe.ListItem>
        <Describe.ListItem name="Item 3" value="Item 3">
          Item 3
        </Describe.ListItem>
      </Describe.List>
    </div>
  );
};

// Mock the window.hlas object
beforeAll(() => {
  Object.defineProperty(window, "hlas", {
    value: {
      find: jest.fn(),
      execute: jest.fn(),
      readScreen: jest.fn(),
      focus: jest.fn(),
    },
    writable: true,
  });
});

describe("hlas library", () => {
  test("renders component with data attributes", () => {
    render(<TestComponent />);
    const button = screen.getByTestId("action-button");

    expect(button).toHaveAttribute("data-hlas-action", "test-action");
    // Attributes set by useHlasActions (via registry.register) take precedence
    expect(button).toHaveAttribute("data-hlas-name", "Test Button");
    expect(button).toHaveAttribute(
      "data-hlas-description",
      "A button for testing", // This is from useHlasActions
    );
  });

  test("executes action when clicked directly", async () => {
    render(<TestComponent />);
    const button = screen.getByTestId("action-button");

    // Wrap state-updating event in act
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByTestId("result")).toBeInTheDocument();
  });

  test("renders Describe.List with correct attributes", () => {
    render(<TestComponent />);
    const list = screen.getByRole("list");

    expect(list).toHaveAttribute("data-hlas-component", "List");
    expect(list).toHaveAttribute("data-hlas-description", "A list for testing");
    expect(list).toHaveAttribute("data-hlas-content");

    // Verify content is properly stored
    const content = list.getAttribute("data-hlas-content");
    expect(content).toBeTruthy();
    if (content) {
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(["Item 1", "Item 2", "Item 3"]);
    }
  });
});

// Test window.hlas API
describe("window.hlas API", () => {
  test("executes action via window.hlas.execute", () => {
    render(<TestComponent />);

    // Find the component ID
    const button = screen.getByTestId("action-button");
    const id = button.getAttribute("data-hlas-id");

    expect(id).toBeTruthy();

    if (id) {
      // Simulate LLM executing the action
      // Wrap event dispatch and subsequent check in act for state updates
      await act(async () => {
        const event = new CustomEvent("hlas:execute", {
          detail: {
            id,
            actionId: "click",
            params: {},
          },
        });
        button.dispatchEvent(event);
      });

      expect(screen.getByTestId("result")).toBeInTheDocument();
    }
  });
});
