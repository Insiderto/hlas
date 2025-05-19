/**
 * Global registry implementation for hlas
 */

import { ActionSchema, ComponentEntry, ScreenComponent } from "./types";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/**
 * Registry class for managing components and their actions
 */
// Define a tour step interface
interface TourStep {
  id: string; // Component ID
  title?: string; // Title for this step
  description?: string; // Description/content for this step
  position?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

class Registry {
  private components: Map<string, ComponentEntry> = new Map();
  private tourDriverInstance: ReturnType<typeof driver> | undefined;
  private highlightDriverInstance: ReturnType<typeof driver> | undefined;
  private activeTour: boolean = false;

  constructor() {
    // Initialize driver instance when DOM is available
    if (typeof window !== "undefined") {
      // Delay initialization to ensure DOM is fully loaded
      setTimeout(() => {
        this.highlightDriverInstance = driver({
          animate: true,
          smoothScroll: true,
          allowClose: true,
          showProgress: true,
          stagePadding: 10,
          // @ts-ignore - opacity is supported by driver.js but not in their types
          opacity: 0.5,
          onDestroyStarted: () => {
            this.highlightDriverInstance?.destroy(); // For highlight driver only
          },
          onDestroyed: () => {
            this.highlightDriverInstance?.destroy(); // For highlight driver only
          },
        });
      }, 0);
    }
  }

  /**
   * Register a component in the registry
   * @param id Optional custom ID for the component (if not provided, a unique ID will be generated)
   * @param element
   * @param name
   * @param actions
   * @param description
   */
  register(
    id: string,
    element: HTMLElement,
    name: string,
    actions: ActionSchema[] = [],
    description?: string,
  ): string {
    const componentId = id;

    this.components.set(componentId, {
      id: componentId,
      element,
      actions,
      name,
      description,
    });

    // Add data attributes to the DOM element
    element.setAttribute("data-hlas-id", componentId);
    element.setAttribute("data-hlas-name", name);

    if (description) {
      element.setAttribute("data-hlas-description", description);
    }

    // Add action data
    if (actions.length > 0) {
      element.setAttribute(
        "data-hlas-actions",
        actions.map((a) => a.id).join(","),
      );
    }

    return componentId;
  }

  /**
   * Unregister a component from the registry
   */
  unregister(id: string): boolean {
    return this.components.delete(id);
  }
  /**
   * Find components by name
   */
  find(query: string): ComponentEntry[] {
    const results: ComponentEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const component of this.components.values()) {
      if (
        component.name.toLowerCase().includes(lowerQuery) ||
        (component.description &&
          component.description.toLowerCase().includes(lowerQuery))
      ) {
        results.push(component);
      }
    }

    return results;
  }

  /**
   * Execute an action on a component
   */
  execute(id: string, actionId: string, params?: Record<string, any>): boolean {
    // This is a stub - the actual execution is handled by the useHlasActions hook
    // This method just dispatches a custom event that the hook listens for
    const component = this.components.get(id);

    if (!component) {
      console.error(`Component with ID ${id} not found`);
      return false;
    }

    const event = new CustomEvent("hlas:execute", {
      detail: {
        id,
        actionId,
        params: params || {},
      },
    });

    component.element.dispatchEvent(event);
    return true;
  }

  /**
   * Focus a component by ID
   */
  focus(id: string): boolean {
    const component = this.components.get(id);

    if (!component) {
      console.error(`Component with ID ${id} not found`);
      return false;
    }

    if (component.element instanceof HTMLElement) {
      component.element.focus();
      return true;
    }

    return false;
  }

  /**
   * Highlight a component by ID using Driver.js
   * @param id Component ID to highlight
   * @param duration Duration in milliseconds (defaults to 2000ms)
   * @param tooltip Optional tooltip content to show (can be provided by LLM)
   */
  /**
   * Start a guided tour with multiple steps
   * @param steps Array of tour steps with component IDs and descriptions
   * @param autoStart Whether to start the tour automatically (default: true)
   * @returns boolean indicating if tour was successfully started
   */
  startTour(steps: TourStep[], autoStart: boolean = true): boolean {
    try {
      // If there's already an active tour, destroy it first
      if (this.tourDriverInstance) {
        this.tourDriverInstance.destroy();
        this.activeTour = false;
      }

      // Validate and collect elements for the tour
      const driverSteps = [];

      for (const step of steps) {
        const component = this.components.get(step.id);
        if (!component || !(component.element instanceof HTMLElement)) {
          console.warn(
            `Component with ID ${step.id} not found or not an HTML element`,
          );
          continue;
        }

        driverSteps.push({
          element: component.element,
          popover: {
            title: step.title || component.name,
            description: step.description || component.description || "",
            side: step.position || "bottom",
            align: step.align || "center",
          },
        });
      }

      if (driverSteps.length === 0) {
        console.error("No valid steps found for tour");
        return false;
      }

      // Create a new Tour Driver instance with the steps
      this.tourDriverInstance = driver({
        animate: true,
        smoothScroll: true,
        allowClose: true,
        showProgress: true,
        steps: driverSteps,
        // @ts-ignore - opacity is supported by driver.js but not in their types
        opacity: 0.5,
        onDestroyStarted: () => {
          this.tourDriverInstance?.destroy();
          this.activeTour = false;
        },
        onDestroyed: () => {
          this.activeTour = false;
        },
      });

      // Start the tour if requested
      if (autoStart) {
        this.tourDriverInstance.drive();
        this.activeTour = true;
      }

      return true;
    } catch (error) {
      console.error("Error starting tour:", error);
      return false;
    }
  }

  /**
   * Highlight a component by ID using Driver.js
   * @param id Component ID to highlight
   * @param duration Duration in milliseconds (defaults to 2000ms)
   * @param title Optional title to show (can be provided by LLM)
   * @param description Optional description to show (can be provided by LLM)
   */
  highlight(
    id: string,
    duration: number = 2000,
    title?: string,
    description?: string,
  ): boolean {
    // We don't need to destroy an active tour as we now have separate instances
    // for tour and highlight functionality

    const component = this.components.get(id);

    if (!component) {
      console.error(`Component with ID ${id} not found`);
      return false;
    }

    if (!this.highlightDriverInstance && typeof window !== "undefined") {
      this.highlightDriverInstance = driver({
        animate: true,
        smoothScroll: true,
        allowClose: true,
        showProgress: false,
        stagePadding: 10,
      });
    }

    if (
      component.element instanceof HTMLElement &&
      this.highlightDriverInstance
    ) {
      // Ensure highlight driver is stopped before starting a new highlight
      this.highlightDriverInstance.destroy();

      //  Configure driver for this element
      this.highlightDriverInstance.highlight({
        element: component.element,
        popover: {
          title: title,
          description: description,
        },
      });

      // Automatically close highlight after duration
      if (duration > 0) {
        setTimeout(() => {
          this.highlightDriverInstance?.destroy();
        }, duration);
      }

      return true;
    }

    return false;
  }

  /**
   * Read the current screen state (all components regardless of visibility)
   */
  readScreen(): ScreenComponent[] {
    const results: ScreenComponent[] = [];

    for (const component of this.components.values()) {
      // No visibility check - include all components
      // We still calculate the rect for metadata purposes
      const visible = true; // Set all components as visible

      // Extract content from data attributes if available
      let content: any = undefined;
      const contentAttr = component.element.getAttribute("data-hlas-content");

      if (contentAttr) {
        try {
          content = JSON.parse(contentAttr);
        } catch (e) {
          content = contentAttr;
        }
      }

      results.push({
        id: component.id,
        name: component.name,
        description: component.description,
        visible,
        actions: component.actions,
        content,
      });
    }

    return results;
  }
}

// Create global registry instance
const registry = new Registry();

export default registry;
