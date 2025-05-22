import React, { forwardRef, useRef, useEffect } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import { action } from "../../src/core/action";
import { ActionSchema } from "../../src/core/types";

describe("action HOC", () => {
  const mockSchema: ActionSchema = {
    id: "testAction",
    name: "Test Action Name",
    description: "This is a test action description.",
    parameters: [
      { name: "param1", type: "string", description: "First parameter" },
      { name: "param2", type: "number", required: true },
    ],
  };

  // A simple functional component
  const SimpleButton = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
  >((props, ref) => <button ref={ref} {...props}>Click Me</button>);
  SimpleButton.displayName = "SimpleButton";


  afterEach(() => {
    cleanup(); // Unmounts components and cleans up DOM
  });

  it("should wrap a component and apply basic HLAS attributes", () => {
    const WrappedComponent = action(mockSchema, SimpleButton);
    render(<WrappedComponent data-testid="action-button" />);

    const button = screen.getByTestId("action-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-hlas-action", mockSchema.id);
    expect(button).toHaveAttribute("data-hlas-name", mockSchema.name);
    expect(button).toHaveAttribute("data-hlas-description", mockSchema.description!);
  });

  it("should correctly stringify and set data-hlas-parameters", () => {
    const WrappedComponent = action(mockSchema, SimpleButton);
    render(<WrappedComponent data-testid="action-button-params" />);

    const button = screen.getByTestId("action-button-params");
    const expectedParams = JSON.stringify(
      mockSchema.parameters!.map((p) => ({
        name: p.name,
        description: p.description || "",
        required: p.required || false,
        type: p.type || "string",
      })),
    );
    expect(button).toHaveAttribute("data-hlas-parameters", expectedParams);
  });

  it("should not set data-hlas-description if not in schema", () => {
    const schemaWithoutDesc: ActionSchema = { ...mockSchema, description: undefined };
    const WrappedComponent = action(schemaWithoutDesc, SimpleButton);
    render(<WrappedComponent data-testid="action-button-no-desc" />);

    const button = screen.getByTestId("action-button-no-desc");
    expect(button).not.toHaveAttribute("data-hlas-description");
  });

  it("should not set data-hlas-parameters if not in schema or empty", () => {
    const schemaWithoutParams: ActionSchema = { ...mockSchema, parameters: undefined };
    const WrappedComponent = action(schemaWithoutParams, SimpleButton);
    render(<WrappedComponent data-testid="action-button-no-params" />);
    const button = screen.getByTestId("action-button-no-params");
    expect(button).not.toHaveAttribute("data-hlas-parameters");

    const schemaWithEmptyParams: ActionSchema = { ...mockSchema, parameters: [] };
    const WrappedComponentEmpty = action(schemaWithEmptyParams, SimpleButton);
    render(<WrappedComponentEmpty data-testid="action-button-empty-params" />);
    const buttonEmpty = screen.getByTestId("action-button-empty-params");
    expect(buttonEmpty).not.toHaveAttribute("data-hlas-parameters");
  });

  it("should forward refs correctly to the wrapped component", () => {
    const WrappedComponent = action(mockSchema, SimpleButton);
    const ref = React.createRef<HTMLButtonElement>();
    render(<WrappedComponent ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute("data-hlas-action", mockSchema.id);
  });
  
  it("should work with a component that doesn't explicitly use forwardRef but is a simple intrinsic element type", () => {
    // Note: `action` HOC itself uses `forwardRef`. The component passed to it *must* be able
    // to accept a ref. Intrinsic elements like 'button' can accept refs.
    // If `SimpleDiv` was a custom functional component not using `forwardRef`, this would warn/error.
    const SimpleDiv = "div" as React.ElementType; // Test with an intrinsic element type
    const WrappedDiv = action(mockSchema, SimpleDiv);
    const ref = React.createRef<HTMLDivElement>();

    render(<WrappedDiv ref={ref} data-testid="action-div">Content</WrappedDiv>);
    const divElement = screen.getByTestId("action-div");
    
    expect(divElement).toBeInTheDocument();
    expect(divElement).toHaveAttribute("data-hlas-action", mockSchema.id);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("should remove attributes on unmount", () => {
    const WrappedComponent = action(mockSchema, SimpleButton);
    const ref = React.createRef<HTMLButtonElement>();
    const { unmount } = render(<WrappedComponent ref={ref} data-testid="action-button-unmount" />);
    
    const button = screen.getByTestId("action-button-unmount");
    expect(button).toHaveAttribute("data-hlas-action", mockSchema.id);

    // Ensure ref is populated before unmount
    expect(ref.current).toBeInTheDocument();
    const element = ref.current; // Store the element reference

    unmount();

    // After unmount, the element itself might still be accessible via the stored ref,
    // but it should no longer be in the document.
    // More importantly, the cleanup effect in `action.ts` should have run.
    // We check the attributes on the stored element reference.
    expect(element).not.toHaveAttribute("data-hlas-action");
    expect(element).not.toHaveAttribute("data-hlas-name");
    expect(element).not.toHaveAttribute("data-hlas-description");
    expect(element).not.toHaveAttribute("data-hlas-parameters");
  });

  // Test with a component that has its own useEffect and state
  interface ComponentWithOwnLogicProps extends React.HTMLAttributes<HTMLDivElement> {
    schema: ActionSchema; // Keep existing prop
    children?: React.ReactNode;
  }

  const ComponentWithOwnLogic = forwardRef<HTMLDivElement, ComponentWithOwnLogicProps>(
    ({ schema, children, ...rest }, ref) => { // Destructure schema, children, and ...rest
      const [internalState, setInternalState] = React.useState(0);
      useEffect(() => {
        setInternalState(1);
      }, []);
      return <div ref={ref} data-state={internalState} {...rest}>{children}</div>; // Spread ...rest
    }
  );
  ComponentWithOwnLogic.displayName = "ComponentWithOwnLogic";

  it("should correctly wrap a component with its own useEffect and state", () => {
    const WrappedComponentWithLogic = action(mockSchema, ComponentWithOwnLogic);
    render(<WrappedComponentWithLogic schema={mockSchema} data-testid="complex-comp">Test</WrappedComponentWithLogic>);
    
    const div = screen.getByTestId("complex-comp");
    expect(div).toHaveAttribute("data-hlas-action", mockSchema.id);
    expect(div).toHaveAttribute("data-state", "1"); // Check component's own logic ran
  });

});
