import { ActionSchema, ComponentEntry, ScreenComponent } from "../../src/core/types";
// Import the Registry class directly, not the global instance
// This allows us to create fresh instances for tests.
// We need to use a relative path to access the actual class definition.
// The default export 'registry' is a singleton instance.
// For testing, we'll need to import the class itself if it's exported,
// or test the singleton's behavior if the class is not exported.

// Assuming Registry class is not directly exported, we test the singleton.
// If it were: import Registry from '../../src/core/RegistryClass'; (hypothetical)
import registryInstance from "../../src/core/registry"; // This is the global singleton
import { driver } from "driver.js";

// Mock driver.js
jest.mock("driver.js", () => {
  const mockDriverInstance = {
    drive: jest.fn(),
    highlight: jest.fn(),
    destroy: jest.fn(),
  };
  return {
    driver: jest.fn(() => mockDriverInstance),
  };
});

// Helper to get the mock driver instance used by the registry
// (since the registry initializes its own driver instances)
const getMockDriverInstance = () => driver({} as any); // Type assertion for mock

describe("Registry", () => {
  let registry: typeof registryInstance;
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Reset the components map for the singleton instance for each test
    // This is a common way to handle testing singletons: reset their state.
    // Accessing private members for testing is generally discouraged,
    // but for a singleton, it can be a pragmatic approach if no reset method is provided.
    // A better way would be if the Registry class itself was exported and we could make new instances.
    (registryInstance as any).components.clear();
    (registryInstance as any).tourDriverInstance = undefined;
    (registryInstance as any).highlightDriverInstance = undefined; // Reset this as it's initialized in constructor
    (registryInstance as any).activeTour = false;


    // Re-initialize the highlightDriverInstance by calling constructor logic again (or parts of it)
    // This is tricky because the constructor has a setTimeout.
    // We will use jest.runAllTimers() in tests that rely on this.
    // For now, we let the global singleton's constructor run, which it does when imported.
    registry = registryInstance; // Use the singleton for tests

    mockElement = document.createElement("div");
    // Spy on console.error and console.warn to check for error logging
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // Restore real timers
  });

  describe("Constructor", () => {
    it("should initialize highlightDriverInstance after a timeout", () => {
      jest.useFakeTimers();
      // The global registryInstance is already created when imported.
      // To test its constructor behavior regarding setTimeout for highlightDriverInstance,
      // we'd ideally need to re-instantiate or spy on driver before import.
      // For simplicity, we'll assume the initial `driver` call in the constructor
      // for `highlightDriverInstance` is what we're interested in.

      // Manually clear the instance to simulate it not being set yet by constructor's setTimeout
      (registry as any).highlightDriverInstance = undefined;

      // Re-trigger the part of the constructor logic that sets up highlightDriverInstance
      // This is a bit of a workaround because we can't easily re-run the singleton's constructor.
      // A better approach would be to export the Registry class.
      // Test that a new instance's constructor logic for highlightDriverInstance works.
      // The global registryInstance's constructor has already run.
      (driver as jest.Mock).mockClear(); // Clear previous calls to driver from global instance
      const newRegistry = new (registryInstance as any).constructor();
      expect(driver).not.toHaveBeenCalled(); // Not called immediately
      jest.advanceTimersByTime(0); // Execute the setTimeout
      expect(driver).toHaveBeenCalledTimes(1); // Called for the new instance's highlightDriver
      expect((newRegistry as any).highlightDriverInstance).toBeDefined();
      jest.useRealTimers(); // restore real timers
    });
  });

  describe("register", () => {
    it("should register a component and set data attributes", () => {
      const componentId = "test-comp-1";
      const actions: ActionSchema[] = [{ id: "act1", name: "Action 1" }];
      registry.register(componentId, mockElement, "Test Component", actions, "A test description");

      const component = (registry as any).components.get(componentId);
      expect(component).toBeDefined();
      expect(component.element).toBe(mockElement);
      expect(component.name).toBe("Test Component");
      expect(component.actions).toEqual(actions);
      expect(component.description).toBe("A test description");

      expect(mockElement.getAttribute("data-hlas-id")).toBe(componentId);
      expect(mockElement.getAttribute("data-hlas-name")).toBe("Test Component");
      expect(mockElement.getAttribute("data-hlas-description")).toBe("A test description");
      expect(mockElement.getAttribute("data-hlas-actions")).toBe("act1");
    });

    it("should overwrite an existing component if registered with the same ID", () => {
      const componentId = "test-comp-dup";
      registry.register(componentId, mockElement, "First Component");
      const newElement = document.createElement("button");
      registry.register(componentId, newElement, "Second Component");

      const component = (registry as any).components.get(componentId);
      expect(component.element).toBe(newElement);
      expect(component.name).toBe("Second Component");
      expect((registry as any).components.size).toBe(1);
    });

     it("should register a component without optional actions and description", () => {
      const componentId = "test-comp-simple";
      registry.register(componentId, mockElement, "Simple Component");

      const component = (registry as any).components.get(componentId);
      expect(component).toBeDefined();
      expect(component.actions).toEqual([]);
      expect(component.description).toBeUndefined();
      expect(mockElement.getAttribute("data-hlas-actions")).toBeNull(); // Or not set
      expect(mockElement.getAttribute("data-hlas-description")).toBeNull(); // Or not set
    });
  });

  describe("unregister", () => {
    it("should unregister a component", () => {
      const componentId = "test-comp-unreg";
      registry.register(componentId, mockElement, "To Unregister");
      expect(registry.unregister(componentId)).toBe(true);
      expect((registry as any).components.has(componentId)).toBe(false);
    });

    it("should return false when unregistering a non-existent component", () => {
      expect(registry.unregister("non-existent-id")).toBe(false);
    });
  });

  describe("find", () => {
    beforeEach(() => {
      registry.register("comp1", document.createElement("div"), "Button Alpha", [], "First component");
      registry.register("comp2", document.createElement("div"), "Input Alpha", [], "Second one");
      registry.register("comp3", document.createElement("div"), "Button Beta", [], "Third component");
    });

    it("should find components by name (case-insensitive)", () => {
      const results = registry.find("button");
      expect(results.length).toBe(2);
      expect(results.find(c => c.id === "comp1")).toBeDefined();
      expect(results.find(c => c.id === "comp3")).toBeDefined();
    });

    it("should find components by description (case-insensitive)", () => {
      const results = registry.find("second one");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("comp2");
    });

    it("should return an empty array if no components match", () => {
      const results = registry.find("nonexistentquery");
      expect(results.length).toBe(0);
    });
  });

  describe("execute", () => {
    const componentId = "exec-comp";
    let targetElement: HTMLElement;
    let dispatchEventSpy: jest.SpyInstance;

    beforeEach(() => {
      targetElement = document.createElement("div");
      dispatchEventSpy = jest.spyOn(targetElement, "dispatchEvent");
      registry.register(componentId, targetElement, "Executable Component");
    });

    it("should dispatch 'hlas:execute' event on the component element", () => {
      const actionId = "click";
      const params = { value: 42 };
      expect(registry.execute(componentId, actionId, params)).toBe(true);

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe("hlas:execute");
      expect(event.detail).toEqual({ id: componentId, actionId, params });
    });

    it("should dispatch event with empty params if none provided", () => {
      registry.execute(componentId, "submit");
      const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.params).toEqual({});
    });

    it("should return false and log error if component not found", () => {
      expect(registry.execute("non-id", "action")).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Component with ID non-id not found");
    });
  });

  describe("readScreen", () => {
    it("should return an array of ScreenComponent objects", () => {
      registry.register("compA", document.createElement("div"), "Component A", [], "Description A");
      const elB = document.createElement("button");
      elB.setAttribute("data-hlas-content", JSON.stringify({ key: "value" }));
      registry.register("compB", elB, "Component B");

      const screenData = registry.readScreen();
      expect(screenData.length).toBe(2);

      const compAData = screenData.find(c => c.id === "compA");
      expect(compAData).toEqual(expect.objectContaining({
        id: "compA",
        name: "Component A",
        description: "Description A",
        // visible property is no longer set
        actions: [],
        content: undefined,
      }));

      const compBData = screenData.find(c => c.id === "compB");
      expect(compBData).toEqual(expect.objectContaining({
        id: "compB",
        name: "Component B",
        // visible property is no longer set
        content: { key: "value" },
      }));
    });

    it("should correctly parse string content from data-hlas-content", () => {
      const elC = document.createElement("span");
      elC.setAttribute("data-hlas-content", "Simple text content");
      registry.register("compC", elC, "Component C");

      const screenData = registry.readScreen();
      const compCData = screenData.find(c => c.id === "compC");
      expect(compCData?.content).toBe("Simple text content");
    });
  });

  describe("focus", () => {
    let focusableElement: HTMLElement;
    let focusSpy: jest.SpyInstance;
    const focusableId = "focusable-comp";

    beforeEach(() => {
      focusableElement = document.createElement("button"); // Buttons are focusable
      focusSpy = jest.spyOn(focusableElement, "focus");
      registry.register(focusableId, focusableElement, "Focusable");
    });

    it("should call focus on the element if it exists and is focusable", () => {
      expect(registry.focus(focusableId)).toBe(true);
      expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it("should return false and log error if component not found", () => {
      expect(registry.focus("non-id")).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Component with ID non-id not found");
    });

    it("should return false if element is not an HTMLElement (though type system should prevent this)", () => {
      // This case is hard to test perfectly without deep manipulation,
      // as register expects HTMLElement. We'll simulate the component entry having a non-focusable element.
      (registry as any).components.set("non-focusable", { element: {} }); // Not an HTMLElement
      expect(registry.focus("non-focusable")).toBe(false);
    });
  });

  describe("highlight", () => {
    const highlightId = "highlight-comp";
    let mockHighlightDriver: any;

    beforeEach(() => {
      jest.useFakeTimers();
      // Ensure highlightDriverInstance is set up by advancing timers from constructor
      // Re-initialize registry to get a fresh constructor run for highlightDriverInstance
      (registry as any).highlightDriverInstance = undefined; // Clear it first
      const tempRegistry = new (registryInstance as any).constructor(); // Triggers driver init in setTimeout
      registry = tempRegistry; // Use this instance for the test
      jest.advanceTimersByTime(0); // Run setTimeout for highlightDriverInstance

      mockHighlightDriver = (registry as any).highlightDriverInstance;
      if (!mockHighlightDriver) {
          // Fallback if the above new constructor trick doesn't work as expected in all test runner contexts
          mockHighlightDriver = getMockDriverInstance();
          (registry as any).highlightDriverInstance = mockHighlightDriver;
      }
      registry.register(highlightId, document.createElement("div"), "Highlightable");
    });

    it("should call driver.highlight with correct options and destroy after duration", () => {
      expect(registry.highlight(highlightId, 1000, "Test Title", "Test Desc")).toBe(true);
      expect(mockHighlightDriver.destroy).toHaveBeenCalledTimes(1); // Called to stop any previous highlight
      expect(mockHighlightDriver.highlight).toHaveBeenCalledWith({
        element: (registry as any).components.get(highlightId).element,
        popover: { title: "Test Title", description: "Test Desc" },
      });
      // expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000); // setTimeout is a global timer
      jest.advanceTimersByTime(1000); // Trigger timeout for destroy
      expect(mockHighlightDriver.destroy).toHaveBeenCalledTimes(2); // Called again by setTimeout
    });

    it("should highlight without duration if duration is 0 or negative", () => {
      registry.highlight(highlightId, 0, "Test Title");
      // setTimeout would not be called for the destroy timer if duration <= 0
      // Ensure destroy was called once for initial cleanup, but not a second time for timeout.
      expect(mockHighlightDriver.destroy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1000); // Advance time, no new destroy should be called
      expect(mockHighlightDriver.destroy).toHaveBeenCalledTimes(1);
    });


    it("should return false and log error if component not found", () => {
      expect(registry.highlight("non-id")).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Component with ID non-id not found");
    });

    it("should initialize highlightDriverInstance if not already initialized (e.g. window undefined initially)", () => {
        (registry as any).highlightDriverInstance = undefined; // Simulate it's not there
        // This test assumes 'window' is defined, which it is in Jest's JSDOM environment.
        registry.highlight(highlightId);
        expect((registry as any).highlightDriverInstance).toBeDefined();
    });
  });

  describe("startTour", () => {
    let mockTourDriver: any;
    const compId1 = "tour-comp1";
    const compId2 = "tour-comp2";

    beforeEach(() => {
      jest.useFakeTimers(); // driver.js might use timeouts
      registry.register(compId1, document.createElement("div"), "Tour Step 1");
      registry.register(compId2, document.createElement("button"), "Tour Step 2");

      // Tour driver is initialized on first call to startTour if not already
      // Ensure it's clean for this test block if other tests might have set it
      (registry as any).tourDriverInstance = undefined;
    });

    const validSteps: TourStep[] = [
      { id: compId1, title: "Step 1", description: "Desc 1" },
      { id: compId2, title: "Step 2", description: "Desc 2", position: "top" },
    ];

    it("should initialize tour driver, configure steps, and start the tour", () => {
      expect(registry.startTour(validSteps)).toBe(true);
      
      mockTourDriver = (registry as any).tourDriverInstance; // Get after it's initialized
      expect(mockTourDriver).toBeDefined();
      expect(driver).toHaveBeenCalledWith(expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({
            element: (registry as any).components.get(compId1).element,
            popover: expect.objectContaining({ title: "Step 1", description: "Desc 1" }),
          }),
          expect.objectContaining({
            element: (registry as any).components.get(compId2).element,
            popover: expect.objectContaining({ title: "Step 2", description: "Desc 2", side: "top" }),
          }),
        ]),
      }));
      expect(mockTourDriver.drive).toHaveBeenCalledTimes(1);
      expect((registry as any).activeTour).toBe(true);
    });

    it("should destroy previous tour if one is active", () => {
      registry.startTour(validSteps); // First tour
      const firstTourDriver = (registry as any).tourDriverInstance;
      expect(firstTourDriver.drive).toHaveBeenCalledTimes(1); // From the first tour
      
      (driver as jest.Mock).mockClear(); // Clear calls to driver factory for next assertion
      const newMockDriverInstance = { drive: jest.fn(), highlight: jest.fn(), destroy: jest.fn() };
      (driver as jest.Mock).mockImplementationOnce(() => newMockDriverInstance);


      registry.startTour([{ id: compId1, description: "New tour" }]); // Second tour
      
      expect(firstTourDriver.destroy).toHaveBeenCalledTimes(1); // Previous driver destroyed
      expect(driver).toHaveBeenCalledTimes(1); // driver factory called again for the new tour
      expect((registry as any).tourDriverInstance).toBe(newMockDriverInstance); // It's the new instance
      expect(newMockDriverInstance.drive).toHaveBeenCalledTimes(1); // New tour started
    });

    it("should not start tour and return false if no valid steps are found", () => {
      expect(registry.startTour([{ id: "non-existent-step", title: "Invalid" }])).toBe(false);
      expect(console.error).toHaveBeenCalledWith("No valid steps found for tour");
      expect((registry as any).activeTour).toBe(false);
    });
    
    it("should use component name/description if step title/description not provided", () => {
        registry.startTour([{ id: compId1 }]);
        mockTourDriver = (registry as any).tourDriverInstance;
        expect(driver).toHaveBeenCalledWith(expect.objectContaining({
            steps: [expect.objectContaining({
                popover: expect.objectContaining({ title: "Tour Step 1", description: "" })
            })]
        }));
    });

    it("should not start tour if autoStart is false", () => {
        registry.startTour(validSteps, false);
        mockTourDriver = (registry as any).tourDriverInstance;
        expect(mockTourDriver.drive).not.toHaveBeenCalled();
        expect((registry as any).activeTour).toBe(false);
    });
  });
});
