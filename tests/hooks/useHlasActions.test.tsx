import React, { useEffect, useRef } from "react";
import { render, act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom";
// renderHook is now part of @testing-library/react

import { useHlasActions } from "../../src/hooks/useHlasActions";
import registryInstance from "../../src/core/registry";
import { ActionMap } from "../../src/core/types";

// Mock the registry instance
jest.mock("../../src/core/registry", () => ({
  register: jest.fn((id) => id), // Return the id for componentIdRef.current
  unregister: jest.fn(),
}));

// Mock console.error
let consoleErrorSpy: jest.SpyInstance;

describe("useHlasActions Hook", () => {
  const mockActions: ActionMap = {
    action1: jest.fn(),
    action2: jest.fn((params) => {
      // For testing params
    }),
  };
  const mockName = "TestComponent";
  const mockDescription = "A component for testing useHlasActions";

  // A simple test component that uses the hook
  interface TestComponentProps {
    actions: ActionMap;
    name: string;
    description?: string;
    onMount?: (id: string | null) => void;
  }

  const TestComponent: React.FC<TestComponentProps> = ({
    actions,
    name,
    description,
    onMount,
  }) => {
    const ref = useHlasActions(actions, name, description);
    // Expose the ref's current element for testing event dispatch
    // And the componentId if possible (though it's internal to the hook)
    useEffect(() => {
      if (ref.current && onMount) {
        // To get the actual ID used by the hook, we'd need to spy on registry.register
        // or expose it, which is not ideal. We'll rely on the mock of registry.register.
        // For now, we pass null or a placeholder if we can't get the real ID easily.
        onMount(null); 
      }
    }, [ref, onMount]);
    return <div ref={ref} data-testid="test-div" />;
  };

  beforeEach(() => {
    // Clear mock call counts and implementations
    (registryInstance.register as jest.Mock).mockClear().mockImplementation((id) => id);
    (registryInstance.unregister as jest.Mock).mockClear();
    mockActions.action1.mockClear();
    mockActions.action2.mockClear();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
  });

  it("should return a ref object", () => {
    const { result } = renderHook(() =>
      useHlasActions(mockActions, mockName, mockDescription),
    );
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty("current");
  });

  it("should register the component with the registry on mount", () => {
    render(
      <TestComponent
        actions={mockActions}
        name={mockName}
        description={mockDescription}
      />,
    );

    expect(registryInstance.register).toHaveBeenCalledTimes(1);
    const registerCallArgs = (registryInstance.register as jest.Mock).mock.calls[0];
    
    // React useId usually generates an ID like ":r0:", ":r1:", etc.
    expect(registerCallArgs[0]).toMatch(/^:r\d+:$/); // Check ID format from useId
    expect(registerCallArgs[1]).toBeInstanceOf(HTMLDivElement); // The element
    expect(registerCallArgs[2]).toBe(mockName); // Name
    expect(registerCallArgs[3]).toEqual([ // Action schemas
      { id: "action1", name: "action1" },
      { id: "action2", name: "action2" },
    ]);
    expect(registerCallArgs[4]).toBe(mockDescription); // Description
  });

  it("should unregister the component from the registry on unmount", () => {
    const { unmount } = render(
      <TestComponent
        actions={mockActions}
        name={mockName}
        description={mockDescription}
      />,
    );

    const registeredId = (registryInstance.register as jest.Mock).mock.results[0].value;
    unmount();

    expect(registryInstance.unregister).toHaveBeenCalledTimes(1);
    expect(registryInstance.unregister).toHaveBeenCalledWith(registeredId);
  });

  it("should handle 'hlas:execute' events and call the correct action", () => {
    render(
      <TestComponent
        actions={mockActions}
        name={mockName}
        description={mockDescription}
      />,
    );
    const divElement = screen.getByTestId("test-div");
    const params = { value: "testParam" };

    act(() => {
      fireEvent(
        divElement,
        new CustomEvent("hlas:execute", {
          detail: { actionId: "action1", params: {} },
        }),
      );
      fireEvent(
        divElement,
        new CustomEvent("hlas:execute", {
          detail: { actionId: "action2", params },
        }),
      );
    });

    expect(mockActions.action1).toHaveBeenCalledTimes(1);
    expect(mockActions.action1).toHaveBeenCalledWith({});
    expect(mockActions.action2).toHaveBeenCalledTimes(1);
    expect(mockActions.action2).toHaveBeenCalledWith(params);
  });

  it("should log an error if an unknown actionId is executed", () => {
    render(
      <TestComponent
        actions={mockActions}
        name={mockName}
        description={mockDescription}
      />,
    );
    const divElement = screen.getByTestId("test-div");
    const registeredId = (registryInstance.register as jest.Mock).mock.results[0].value;


    act(() => {
      fireEvent(
        divElement,
        new CustomEvent("hlas:execute", {
          detail: { actionId: "unknownAction", params: {} },
        }),
      );
    });

    expect(mockActions.action1).not.toHaveBeenCalled();
    expect(mockActions.action2).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Action unknownAction not found on component ${registeredId}`,
    );
  });
  
  it("should use updated actions if the actions prop changes", () => {
    const initialActions: ActionMap = {
      initialAction: jest.fn(),
    };
    const updatedActions: ActionMap = {
      updatedAction: jest.fn(),
    };

    const { rerender } = render(
      <TestComponent
        actions={initialActions}
        name={mockName}
      />,
    );
    const divElement = screen.getByTestId("test-div");

    // Dispatch event for initial action
    act(() => {
      fireEvent(
        divElement,
        new CustomEvent("hlas:execute", {
          detail: { actionId: "initialAction", params: {} },
        }),
      );
    });
    expect(initialActions.initialAction).toHaveBeenCalledTimes(1);

    // Rerender with updated actions
    rerender(
      <TestComponent
        actions={updatedActions}
        name={mockName}
      />,
    );

    // Dispatch event for updated action
    act(() => {
      fireEvent(
        divElement,
        new CustomEvent("hlas:execute", {
          detail: { actionId: "updatedAction", params: { data: 123 } },
        }),
      );
    });
    expect(updatedActions.updatedAction).toHaveBeenCalledTimes(1);
    expect(updatedActions.updatedAction).toHaveBeenCalledWith({ data: 123 });
    
    // Ensure old action is not called again / new action is not called with old config
    expect(initialActions.initialAction).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it("should register with minimal info if description is not provided", () => {
    render(
      <TestComponent
        actions={mockActions}
        name={mockName}
        // description is omitted
      />,
    );
    expect(registryInstance.register).toHaveBeenCalledTimes(1);
    const registerCallArgs = (registryInstance.register as jest.Mock).mock.calls[0];
    expect(registerCallArgs[4]).toBeUndefined(); // Description
  });

});
