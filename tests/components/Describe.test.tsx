import React, { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import Describe from "../../src/components/Describe";
import registryInstance from "../../src/core/registry";

// Mock the registry instance
jest.mock("../../src/core/registry", () => ({
  register: jest.fn((id) => id),
  unregister: jest.fn(),
  // Keep other methods if Describe components somehow use them, though they primarily use register/unregister
}));

describe("Describe Components", () => {
  beforeEach(() => {
    (registryInstance.register as jest.Mock).mockClear().mockImplementation((id) => id);
    (registryInstance.unregister as jest.Mock).mockClear();
  });

  afterEach(cleanup);

  describe("Describe.Base", () => {
    it("renders a div and registers with default name if not provided", () => {
      render(<Describe.Base data-testid="base-comp" />);
      const el = screen.getByTestId("base-comp");
      expect(el.tagName).toBe("DIV");
      expect(el).toHaveAttribute("data-hlas-component", "Generic"); // Default if name is empty
      expect(el).toHaveAttribute("data-hlas-description", "");

      expect(registryInstance.register).toHaveBeenCalledTimes(1);
      const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
      expect(registerArgs[0]).toMatch(/^:r[a-z0-9]+:$/); // useId format for React 18+
      expect(registerArgs[1]).toBe(el);
      expect(registerArgs[2]).toBe("Unnamed Component"); // Default name for registration
      expect(registerArgs[3]).toEqual([]); // actions
      expect(registerArgs[4]).toBeUndefined(); // description
    });

    it("registers with provided name and description", () => {
      render(
        <Describe.Base
          name="MyBase"
          description="Base description"
          data-testid="base-comp-props"
        />,
      );
      const el = screen.getByTestId("base-comp-props");
      expect(el).toHaveAttribute("data-hlas-component", "MyBase");
      expect(el).toHaveAttribute("data-hlas-description", "Base description");

      const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
      expect(registerArgs[2]).toBe("MyBase");
      expect(registerArgs[4]).toBe("Base description");
    });

    it("unregisters on unmount", () => {
      const { unmount } = render(<Describe.Base name="TestUnmountBase" />);
      const registeredId = (registryInstance.register as jest.Mock).mock.results[0].value;
      unmount();
      expect(registryInstance.unregister).toHaveBeenCalledWith(registeredId);
    });
  });


  describe("Describe.List", () => {
    it("renders a ul and registers with default name/description if not provided", () => {
      render(<Describe.List data-testid="list-comp" />);
      const listElement = screen.getByTestId("list-comp");
      expect(listElement.tagName).toBe("UL");
      expect(listElement).toHaveAttribute("data-hlas-component", "List");
      expect(listElement).toHaveAttribute("data-hlas-description", "A list of items");

      expect(registryInstance.register).toHaveBeenCalledTimes(1);
      const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
      expect(registerArgs[0]).toMatch(/^:r[a-z0-9]+:$/); // useId format for React 18+
      expect(registerArgs[1]).toBe(listElement);
      expect(registerArgs[2]).toBe("List"); // Default name for registration
      expect(registerArgs[3]).toEqual([]); // actions
      expect(registerArgs[4]).toBeUndefined(); // description for registration if not provided
    });

    it("registers with provided name and description", () => {
      render(
        <Describe.List
          name="MyList"
          description="List description"
          data-testid="list-comp-props"
        />,
      );
      const listElement = screen.getByTestId("list-comp-props");
      expect(listElement).toHaveAttribute("data-hlas-description", "List description");

      const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
      expect(registerArgs[2]).toBe("MyList");
      expect(registerArgs[4]).toBe("List description");
    });

    it("sets data-hlas-content from items prop", () => {
      const items = [{ id: 1, text: "Item 1" }, "Item 2"];
      render(<Describe.List items={items} data-testid="list-items-prop" />);
      const listElement = screen.getByTestId("list-items-prop");
      expect(listElement).toHaveAttribute("data-hlas-content", JSON.stringify(items));
    });
    
    it("does not set data-hlas-content if items prop is empty or not provided", () => {
      render(<Describe.List items={[]} data-testid="list-empty-items" />);
      const listElementEmpty = screen.getByTestId("list-empty-items");
      expect(listElementEmpty).not.toHaveAttribute("data-hlas-content");

      render(<Describe.List data-testid="list-no-items" />);
      const listElementNoItems = screen.getByTestId("list-no-items");
      expect(listElementNoItems).not.toHaveAttribute("data-hlas-content");
    });


    it("unregisters on unmount", () => {
      render(<Describe.List name="TestUnmountList" />);
      const registeredId = (registryInstance.register as jest.Mock).mock.results[0].value;
      unmount();
      expect(registryInstance.unregister).toHaveBeenCalledWith(registeredId);
    });

     it("forwards refs correctly", () => {
      const ref = createRef<HTMLUListElement>();
      render(<Describe.List ref={ref} name="RefList" />);
      expect(ref.current).toBeInstanceOf(HTMLUListElement);
      expect(ref.current).toHaveAttribute("data-hlas-component", "List");
    });
  });

  describe("Describe.ListItem", () => {
    it("renders an li and registers with default name/description if not provided", () => {
      render(<Describe.ListItem data-testid="li-comp" />);
      const listItemElement = screen.getByTestId("li-comp");
      expect(listItemElement.tagName).toBe("LI");
      expect(listItemElement).toHaveAttribute("data-hlas-component", "ListItem");
      expect(listItemElement).toHaveAttribute("data-hlas-description", "A list item");

      expect(registryInstance.register).toHaveBeenCalledTimes(1);
      const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
      expect(registerArgs[0]).toMatch(/^:r[a-z0-9]+:$/); // useId format for React 18+
      expect(registerArgs[1]).toBe(listItemElement);
      expect(registerArgs[2]).toBe("ListItem"); // Default name for registration
      expect(registerArgs[3]).toEqual([]); // actions
      expect(registerArgs[4]).toBeUndefined(); // description for registration
    });

    it("registers with provided name and description", () => {
      render(
        <Describe.ListItem
          name="MyListItem"
          description="ListItem description"
          data-testid="li-comp-props"
        />,
      );
      const listItemElement = screen.getByTestId("li-comp-props");
      expect(listItemElement).toHaveAttribute("data-hlas-description", "ListItem description");
      
      const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
      expect(registerArgs[2]).toBe("MyListItem");
      expect(registerArgs[4]).toBe("ListItem description");
    });

    it("sets data-hlas-content from value prop (string, number, object)", () => {
      const { rerender } = render(<Describe.ListItem value="Test Value" data-testid="li-value-str" />);
      const liString = screen.getByTestId("li-value-str");
      expect(liString).toHaveAttribute("data-hlas-content", "Test Value");

      rerender(<Describe.ListItem value={123} data-testid="li-value-num" />);
      const liNum = screen.getByTestId("li-value-num");
      expect(liNum).toHaveAttribute("data-hlas-content", "123");
      
      const objValue = { id: 1, data: "complex" };
      rerender(<Describe.ListItem value={objValue} data-testid="li-value-obj" />);
      const liObj = screen.getByTestId("li-value-obj");
      expect(liObj).toHaveAttribute("data-hlas-content", JSON.stringify(objValue));
    });

    it("does not set data-hlas-content if value prop is undefined", () => {
      render(<Describe.ListItem data-testid="li-no-value" />); // value is undefined
      const liElement = screen.getByTestId("li-no-value");
      expect(liElement).not.toHaveAttribute("data-hlas-content");
    it("unregisters on unmount", () => {
      const { unmount } = render(<Describe.List name="TestUnmountList" data-testid="unmount-list"/>);
      const calls = (registryInstance.register as jest.Mock).mock.calls;
      const registeredId = calls.find(call => call[1] === screen.getByTestId("unmount-list"))?.[0];
      expect(registeredId).toBeDefined(); // Ensure we found the ID
      unmount();
      expect(registryInstance.unregister).toHaveBeenCalledWith(registeredId);
    });

    it("forwards refs correctly", () => {
      const ref = createRef<HTMLLIElement>();
      render(<Describe.ListItem ref={ref} name="RefListItem" />);
      expect(ref.current).toBeInstanceOf(HTMLLIElement);
      expect(ref.current).toHaveAttribute("data-hlas-component", "ListItem");
    });
  });

  describe("Nesting", () => {
    it("should register all nested Describe components", () => {
      render(
        <Describe.List name="OuterList" data-testid="outer-list">
          <Describe.ListItem name="Item1" value="val1" data-testid="item1">
            <Describe.List name="InnerList" items={["inner1"]} data-testid="inner-list">
              <Describe.ListItem name="InnerItem1" value="in_val1" data-testid="inner-item1" />
            </Describe.List>
          </Describe.ListItem>
          <Describe.ListItem name="Item2" value="val2" data-testid="item2" />
        </Describe.List>,
      );

      expect(registryInstance.register).toHaveBeenCalledTimes(5); // OuterList, Item1, InnerList, InnerItem1, Item2
      
      const outerListEl = screen.getByTestId("outer-list");
      const item1El = screen.getByTestId("item1");
      const innerListEl = screen.getByTestId("inner-list");
      const innerItem1El = screen.getByTestId("inner-item1");
      const item2El = screen.getByTestId("item2");

      const calls = (registryInstance.register as jest.Mock).mock.calls;
      expect(calls.some(call => call[1] === outerListEl && call[2] === "OuterList")).toBe(true);
      expect(calls.some(call => call[1] === item1El && call[2] === "Item1")).toBe(true);
      expect(calls.some(call => call[1] === innerListEl && call[2] === "InnerList")).toBe(true);
      expect(calls.some(call => call[1] === innerItem1El && call[2] === "InnerItem1")).toBe(true);
      expect(calls.some(call => call[1] === item2El && call[2] === "Item2")).toBe(true);


      // Test unmounting also unregisters all
      const initialUnregisterCount = (registryInstance.unregister as jest.Mock).mock.calls.length;
      cleanup(); // Unmounts all
      expect((registryInstance.unregister as jest.Mock).mock.calls.length).toBe(initialUnregisterCount + 5);
    });
  });
});
