import React, { createRef, ElementType } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import Describe from "../../src/components/Describe";
import registryInstance from "../../src/core/registry";
import { DescribeProps, ListProps, ListItemProps } from "../../src/core/types"; // Original props for defaults

// Mock the registry instance
jest.mock("../../src/core/registry", () => ({
  register: jest.fn((id) => id), // Return the id for componentIdRef.current
  unregister: jest.fn(),
}));

// Helper to get the registered ID for a component by its testId
const getRegisteredId = (testId: string) => {
  const calls = (registryInstance.register as jest.Mock).mock.calls;
  const call = calls.find(c => c[1] === screen.getByTestId(testId));
  return call ? call[0] : undefined;
};


describe("Describe Components", () => {
  beforeEach(() => {
    (registryInstance.register as jest.Mock).mockClear().mockImplementation((id) => id);
    (registryInstance.unregister as jest.Mock).mockClear();
  });

  afterEach(cleanup);

  // --- Generic Test Function for Describe Components ---
  interface TestDescribeComponentOptions<P> {
    Component: React.FC<P & { "data-testid": string }>; // Component to test
    defaultProps: P & { "data-testid": string };
    defaultTagName: string;
    hlasComponentName: string; // e.g., "Text", "List"
    asPropTestTag?: keyof JSX.IntrinsicElements; // e.g., "div"
    expectedDefaultRole?: string; // Expected role for default tag
    expectedRoleWithAs?: string; // Expected role when 'as' is used with a generic div
    specificAttributes?: Record<string, string | null | undefined>; // For data-hlas-* specific attributes
  }

  function testDescribeComponent<P extends {name?: string, description?: string}>(
    componentName: string, // e.g., "Describe.Text"
    options: TestDescribeComponentOptions<P>
  ) {
    const { Component, defaultProps, defaultTagName, hlasComponentName, asPropTestTag = "div", expectedDefaultRole, expectedRoleWithAs, specificAttributes } = options;

    describe(componentName, () => {
      describe("Default Rendering", () => {
        it(`renders as <${defaultTagName}> by default and registers correctly`, () => {
          const { unmount } = render(<Component {...defaultProps} />);
          const element = screen.getByTestId(defaultProps["data-testid"]);

          expect(element.tagName).toBe(defaultTagName.toUpperCase());
          expect(element).toHaveAttribute("data-hlas-component", hlasComponentName);
          expect(element).toHaveAttribute("data-hlas-name", defaultProps.name || hlasComponentName);
          expect(element).toHaveAttribute("data-hlas-description", defaultProps.description || "");
          if (expectedDefaultRole) {
            expect(element).toHaveAttribute("role", expectedDefaultRole);
          } else if (defaultTagName !== "div" && defaultTagName !== "span") { // Generic elements shouldn't have implicit roles usually
             // Check if it *doesn't* have a role if no default is expected and not generic
            const implicitRole = element.getAttribute("role");
            if (implicitRole) { // Only check if an implicit role is being set by the browser
                // This is tricky as browsers might assign implicit roles not set by us.
                // For now, we'll just check for roles explicitly set by our components.
            }
          }


          if (specificAttributes) {
            Object.entries(specificAttributes).forEach(([key, value]) => {
              if (value === null || value === undefined) {
                expect(element).not.toHaveAttribute(key);
              } else {
                expect(element).toHaveAttribute(key, value);
              }
            });
          }

          expect(registryInstance.register).toHaveBeenCalledTimes(1);
          const registerArgs = (registryInstance.register as jest.Mock).mock.calls[0];
          expect(registerArgs[0]).toMatch(/^:r[a-z0-9]+:$/);
          expect(registerArgs[1]).toBe(element);
          expect(registerArgs[2]).toBe(defaultProps.name || hlasComponentName);

          const registeredId = getRegisteredId(defaultProps["data-testid"]);
          unmount();
          expect(registryInstance.unregister).toHaveBeenCalledWith(registeredId);
        });
      });

      describe("`as` Prop Functionality", () => {
        it(`renders as <${asPropTestTag}> when 'as="${asPropTestTag}"' is used`, () => {
          const testId = `${defaultProps["data-testid"]}-as-${asPropTestTag}`;
          const { unmount } = render(
            <Component {...defaultProps} as={asPropTestTag as ElementType} data-testid={testId} />
          );
          const element = screen.getByTestId(testId);
          expect(element.tagName).toBe(asPropTestTag.toUpperCase());
          expect(element).toHaveAttribute("data-hlas-component", hlasComponentName);

          if (expectedRoleWithAs) {
            expect(element).toHaveAttribute("role", expectedRoleWithAs);
          }

          expect(registryInstance.register).toHaveBeenCalledTimes(1);
          const registeredId = getRegisteredId(testId);
          unmount();
          expect(registryInstance.unregister).toHaveBeenCalledWith(registeredId);
        });

        it(`forwards refs correctly when using 'as="${asPropTestTag}"'`, () => {
          const ref = createRef<HTMLElement>(); // Use generic HTMLElement for polymorphic ref
          render(<Component {...defaultProps} as={asPropTestTag as ElementType} ref={ref} />);
          expect(ref.current).toBeInstanceOf(window[asPropTestTag.charAt(0).toUpperCase() + asPropTestTag.slice(1) + 'Element' as keyof Window]);
          expect(ref.current).toHaveAttribute("data-hlas-component", hlasComponentName);
        });
      });

      describe("ARIA and HTML Attribute Pass-through", () => {
        it("passes through standard HTML and ARIA attributes", () => {
          render(
            <Component
              {...defaultProps}
              id="custom-id"
              className="custom-class"
              tabIndex={0}
              aria-label="custom-aria-label"
              aria-hidden="true"
            />
          );
          const element = screen.getByTestId(defaultProps["data-testid"]);
          expect(element).toHaveAttribute("id", "custom-id");
          expect(element).toHaveClass("custom-class");
          expect(element).toHaveAttribute("tabindex", "0");
          expect(element).toHaveAttribute("aria-label", "custom-aria-label");
          expect(element).toHaveAttribute("aria-hidden", "true");
        });
      });
    });
  }

  // --- Test Describe.Base ---
  testDescribeComponent<Parameters<typeof Describe.Base>[0] & { "data-testid": string } >(
    "Describe.Base",
    {
      Component: Describe.Base as any, // Cast due to polymorphic type complexity with FC
      defaultProps: { name: "Test Base", description: "Base Desc", "data-testid": "base-test" },
      defaultTagName: "DIV",
      hlasComponentName: "Test Base", // Uses name prop if provided, else "Generic" for data-hlas-component
      asPropTestTag: "section",
      // No specific default role for div, no specific role when 'as' is generic like section
    }
  );
  // Override data-hlas-component for default name test
  it("Describe.Base sets data-hlas-component to 'Generic' if name is not provided", () => {
    render(<Describe.Base data-testid="base-generic-name" />);
    expect(screen.getByTestId("base-generic-name")).toHaveAttribute("data-hlas-component", "Generic");
  });


  // --- Test Describe.Text ---
  testDescribeComponent<Parameters<typeof Describe.Text>[0] & { "data-testid": string } >(
    "Describe.Text",
    {
      Component: Describe.Text as any,
      defaultProps: { name: "Test Text", description: "Text Desc", "data-testid": "text-test" },
      defaultTagName: "SPAN",
      hlasComponentName: "Text",
      asPropTestTag: "p",
      // No specific default role for span, no specific role when 'as' is generic like p
    }
  );

  // --- Test Describe.Heading ---
  describe("Describe.Heading", () => {
    testDescribeComponent<Parameters<typeof Describe.Heading>[0] & { "data-testid": string } >(
      "Describe.Heading",
      {
        Component: Describe.Heading as any,
        defaultProps: { name: "Test Heading", description: "Heading Desc", level: 2, "data-testid": "heading-test" },
        defaultTagName: "H2",
        hlasComponentName: "Heading",
        asPropTestTag: "div",
        expectedRoleWithAs: "heading", // Explicit role when 'as' is not h1-h6
        specificAttributes: { "data-hlas-level": "2" }
      }
    );
    it("renders as H1 by default if no level is provided", () => {
      render(<Describe.Heading name="Default Level Heading" data-testid="heading-default-level" />);
      const element = screen.getByTestId("heading-default-level");
      expect(element.tagName).toBe("H1");
      expect(element).toHaveAttribute("data-hlas-level", "1");
      expect(element).toHaveAttribute("aria-level", "1");
    });
    it("applies aria-level correctly", () => {
      render(<Describe.Heading level={3} data-testid="heading-aria-level" />);
      expect(screen.getByTestId("heading-aria-level")).toHaveAttribute("aria-level", "3");
    });
     it("applies role='heading' and aria-level when rendered as div", () => {
      render(<Describe.Heading as="div" level={4} data-testid="heading-as-div-aria" />);
      const element = screen.getByTestId("heading-as-div-aria");
      expect(element).toHaveAttribute("role", "heading");
      expect(element).toHaveAttribute("aria-level", "4");
    });
  });

  // --- Test Describe.Container ---
  testDescribeComponent<Parameters<typeof Describe.Container>[0] & { "data-testid": string } >(
    "Describe.Container",
    {
      Component: Describe.Container as any,
      defaultProps: { name: "Test Container", description: "Container Desc", "data-testid": "container-test" },
      defaultTagName: "DIV",
      hlasComponentName: "Container",
      asPropTestTag: "section",
    }
  );

  // --- Test Describe.Image ---
  describe("Describe.Image", () => {
     testDescribeComponent<Parameters<typeof Describe.Image>[0] & { "data-testid": string } >(
      "Describe.Image",
      {
        Component: Describe.Image as any,
        defaultProps: { name: "Test Image", description: "Image Desc", src: "test.jpg", alt: "Test Alt Text", "data-testid": "image-test" },
        defaultTagName: "IMG",
        hlasComponentName: "Image",
        asPropTestTag: "div",
        expectedDefaultRole: undefined, // Native <img> has implicit role
        expectedRoleWithAs: "img",
        specificAttributes: { "data-hlas-src": "test.jpg", "data-hlas-alt": "Test Alt Text" }
      }
    );
    it("applies src and alt to <img> tag, and role='img' with aria-label when 'as' is not 'img'", () => {
      render(<Describe.Image src="test.png" alt="Accessible Text" data-testid="img-attrs" />);
      const imgElement = screen.getByTestId("img-attrs");
      expect(imgElement).toHaveAttribute("src", "test.png");
      expect(imgElement).toHaveAttribute("alt", "Accessible Text");

      render(<Describe.Image as="div" src="test.png" alt="Accessible Text Div" data-testid="img-as-div-attrs" />);
      const divElement = screen.getByTestId("img-as-div-attrs");
      expect(divElement).not.toHaveAttribute("src");
      expect(divElement).not.toHaveAttribute("alt");
      expect(divElement).toHaveAttribute("role", "img");
      expect(divElement).toHaveAttribute("aria-label", "Accessible Text Div");
    });
  });

  // --- Test Describe.Link ---
  describe("Describe.Link", () => {
    testDescribeComponent<Parameters<typeof Describe.Link>[0] & { "data-testid": string } >(
      "Describe.Link",
      {
        Component: Describe.Link as any,
        defaultProps: { name: "Test Link", description: "Link Desc", href: "https://example.com", "data-testid": "link-test" },
        defaultTagName: "A",
        hlasComponentName: "Link",
        asPropTestTag: "span",
        expectedRoleWithAs: "link",
        specificAttributes: { "data-hlas-href": "https://example.com" }
      }
    );
     it("applies href to <a> tag, and role='link' when 'as' is not 'a'", () => {
      render(<Describe.Link href="https://example.com/page" data-testid="link-attrs" />);
      const linkElement = screen.getByTestId("link-attrs");
      expect(linkElement).toHaveAttribute("href", "https://example.com/page");

      render(<Describe.Link as="span" href="https://example.com/page" data-testid="link-as-span-attrs" />);
      const spanElement = screen.getByTestId("link-as-span-attrs");
      expect(spanElement).not.toHaveAttribute("href"); // href is not a valid attribute for span
      expect(spanElement).toHaveAttribute("role", "link");
    });
  });

  // --- Test Describe.Button ---
  describe("Describe.Button", () => {
    testDescribeComponent<Parameters<typeof Describe.Button>[0] & { "data-testid": string } >(
      "Describe.Button",
      {
        Component: Describe.Button as any,
        defaultProps: { name: "Test Button", description: "Button Desc", "data-testid": "button-test" },
        defaultTagName: "BUTTON",
        hlasComponentName: "Button",
        asPropTestTag: "div",
        expectedRoleWithAs: "button",
      }
    );
    it("defaults to type='button' for <button> element and sets role='button' for other elements", () => {
      render(<Describe.Button data-testid="btn-type" />);
      expect(screen.getByTestId("btn-type")).toHaveAttribute("type", "button");

      render(<Describe.Button type="submit" data-testid="btn-submit-type" />);
      expect(screen.getByTestId("btn-submit-type")).toHaveAttribute("type", "submit");
      
      render(<Describe.Button as="div" data-testid="btn-as-div-role" />);
      expect(screen.getByTestId("btn-as-div-role")).toHaveAttribute("role", "button");
    });
  });

  // --- Test Describe.List (Existing but needs as/ARIA tests) ---
  describe("Describe.List (Extended Tests)", () => {
    testDescribeComponent<Parameters<typeof Describe.List>[0] & { "data-testid": string } >(
      "Describe.List",
      {
        Component: Describe.List as any,
        defaultProps: { name: "Extended List", description: "Extended List Desc", "data-testid": "extended-list-test", items: [{id:1}] },
        defaultTagName: "UL",
        hlasComponentName: "List",
        asPropTestTag: "div",
        expectedDefaultRole: undefined, // Native <ul> has implicit role
        expectedRoleWithAs: "list",
        specificAttributes: { "data-hlas-content": JSON.stringify([{id:1}]) }
      }
    );
     it("does not set data-hlas-content if items prop is empty or not provided", () => {
      render(<Describe.List items={[]} data-testid="list-empty-items" />);
      expect(screen.getByTestId("list-empty-items")).not.toHaveAttribute("data-hlas-content");

      render(<Describe.List data-testid="list-no-items" />);
      expect(screen.getByTestId("list-no-items")).not.toHaveAttribute("data-hlas-content");
    });
  });

  // --- Test Describe.ListItem (Existing but needs as/ARIA tests) ---
  describe("Describe.ListItem (Extended Tests)", () => {
     testDescribeComponent<Parameters<typeof Describe.ListItem>[0] & { "data-testid": string } >(
      "Describe.ListItem",
      {
        Component: Describe.ListItem as any,
        defaultProps: { name: "Extended ListItem", description: "Extended ListItem Desc", "data-testid": "extended-listitem-test", value: "itemValue" },
        defaultTagName: "LI",
        hlasComponentName: "ListItem",
        asPropTestTag: "div",
        expectedDefaultRole: undefined, // Native <li> has implicit role under a list parent
        expectedRoleWithAs: "listitem",
        specificAttributes: { "data-hlas-content": "itemValue" }
      }
    );
    it("does not set data-hlas-content if value prop is undefined", () => {
      render(<Describe.ListItem data-testid="li-no-value" />);
      expect(screen.getByTestId("li-no-value")).not.toHaveAttribute("data-hlas-content");
    });
  });
  
  // --- Test Nesting (from original file, ensuring it still passes) ---
   describe("Nesting", () => {
    it("should register all nested Describe components", () => {
      const { unmount } = render(
        <Describe.List name="OuterList" data-testid="outer-list">
          <Describe.ListItem name="Item1" value="val1" data-testid="item1">
            <Describe.List name="InnerList" items={["inner1"]} data-testid="inner-list">
              <Describe.ListItem name="InnerItem1" value="in_val1" data-testid="inner-item1" />
            </Describe.List>
          </Describe.ListItem>
          <Describe.ListItem name="Item2" value="val2" data-testid="item2" />
        </Describe.List>,
      );

      expect(registryInstance.register).toHaveBeenCalledTimes(5);
      
      const initialUnregisterCount = (registryInstance.unregister as jest.Mock).mock.calls.length;
      unmount(); 
      expect((registryInstance.unregister as jest.Mock).mock.calls.length).toBe(initialUnregisterCount + 5);
    });
  });

});
