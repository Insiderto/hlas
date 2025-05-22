/**
 * @module hlas
 * @description Main entry point for the hlas (Human-Like Autonomous System) library.
 * This module exports the core functionalities, types, and the global `window.hlas` API
 * for interacting with UI elements programmatically.
 */

import { action } from "./core/action";
import { useHlasActions } from "./hooks/useHlasActions";
import Describe from "./components/Describe";
import registry from "./core/registry";
import { ComponentEntry, ScreenComponent } from "./core/types";

/**
 * @interface TourStep
 * @description Defines the structure for a single step in a guided tour.
 * Used by `window.hlas.startTour`.
 * @property {string} id - The ID of the component to highlight in this step.
 * @property {string} [title] - An optional title for the tour step popover.
 * @property {string} [description] - An optional description or content for the tour step popover.
 * @property {"top" | "right" | "bottom" | "left"} [position] - The preferred position of the popover relative to the element.
 * @property {"start" | "center" | "end"} [align] - The alignment of the popover.
 */
export interface TourStep {
  id: string;
  title?: string;
  description?: string;
  position?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

// Export components and hooks
export { action, useHlasActions, Describe };

// Export types
export * from "./core/types";

/**
 * @interface HlasInterface
 * @description Defines the global API exposed on `window.hlas` for interacting with registered UI components.
 * This API allows external systems (e.g., LLMs, test automation) to discover, understand, and interact
 * with the application's UI elements in a semantic way.
 */
interface HlasInterface {
  /**
   * Finds registered UI components based on a query string.
   * The query is typically matched against component names and descriptions.
   * @param {string} query - The search string to find components.
   * @returns {ComponentEntry[]} An array of components that match the query.
   */
  find: (query: string) => ComponentEntry[];

  /**
   * Executes a specified action on a component.
   * The component must be registered and the action must be defined in its schema or action map.
   * @param {string} id - The ID of the component to act upon.
   * @param {string} actionId - The ID of the action to execute (e.g., "click", "setValue").
   * @param {Record<string, unknown>} [params] - Optional parameters for the action.
   * @returns {boolean} `true` if the action was dispatched, `false` if the component was not found.
   * @remarks The actual execution of the action is handled by the component itself, typically via the `useHlasActions` hook.
   */
  execute: (
    id: string,
    actionId: string,
    params?: Record<string, unknown>,
  ) => boolean;

  /**
   * Sets focus to a specified component's underlying DOM element.
   * The component must be registered and its element must be focusable.
   * @param {string} id - The ID of the component to focus.
   * @returns {boolean} `true` if focus was attempted, `false` if the component was not found or not focusable.
   */
  focus: (id: string) => boolean;

  /**
   * Highlights a component on the screen, typically using a visual overlay.
   * Useful for drawing attention to specific UI elements.
   * @param {string} id - The ID of the component to highlight.
   * @param {number} [duration=2000] - The duration in milliseconds for how long the highlight should remain visible. A duration of 0 or less might keep it visible until explicitly closed or another highlight is triggered.
   * @param {string} [title] - An optional title for a popover accompanying the highlight.
   * @param {string} [description] - An optional description for a popover accompanying the highlight.
   * @returns {boolean} `true` if the highlight was applied, `false` if the component was not found.
   */
  highlight: (id: string, duration?: number, title?: string, description?: string) => boolean;
  // Note: The actual signature in registry.highlight has title then description. This matches the registry.
  // The original HlasInterface had 'tooltip' as the third param. Changed to match implementation.

  /**
   * Starts a guided tour, highlighting a sequence of components with popovers.
   * @param {TourStep[]} steps - An array of `TourStep` objects defining the tour.
   * @param {boolean} [autoStart=true] - Whether to start the tour immediately.
   * @returns {boolean} `true` if the tour was successfully initiated, `false` otherwise (e.g., no valid steps).
   */
  startTour: (steps: TourStep[], autoStart?: boolean) => boolean;

  /**
   * Reads and returns a representation of the current screen state, including all registered components.
   * This is used to provide context to an LLM or other systems.
   * @returns {ScreenComponent[]} An array of objects representing the state of registered UI components.
   */
  readScreen: () => ScreenComponent[];
}

// Register global hlas object on window
if (typeof window !== "undefined") {
  // Assuming src/types/global.d.ts correctly extends Window for 'hlas'
  // If not, a more specific cast than 'any' might be needed here,
  // but the global declaration is preferred.
  /**
   * @global
   * @name window.hlas
   * @type {HlasInterface}
   * @description The global API instance for interacting with the hlas system.
   * Available on the `window` object in browser environments.
   *
   * @example
   * ```typescript
   * // Find a button by its name
   * const buttons = window.hlas.find("Submit Button");
   * if (buttons.length > 0) {
   *   // Execute its default action (if 'click' is defined for it)
   *   window.hlas.execute(buttons[0].id, "click");
   * }
   *
   * // Add a new todo item by interacting with an input field and an add button
   * const todoInputs = window.hlas.find("New todo input");
   * const addButtons = window.hlas.find("Add todo button");
   * if (todoInputs.length > 0 && addButtons.length > 0) {
   *   window.hlas.execute(todoInputs[0].id, "setValue", { value: "Buy groceries" });
   *   window.hlas.execute(addButtons[0].id, "addTodo");
   * }
   *
   * // Start a tour
   * window.hlas.startTour([
   *   { id: "profile-icon", description: "Click here to view your profile." },
   *   { id: "settings-menu", description: "Then, open settings." }
   * ]);
   * ```
   */
  (window as Window & typeof globalThis & { hlas?: HlasInterface }).hlas = {
    find: registry.find,
    execute: registry.execute,
    focus: registry.focus,
    highlight: registry.highlight,
    startTour: registry.startTour,
    readScreen: registry.readScreen,
  };
}


/**
 * @namespace HlasExports
 * @description Default export containing the primary building blocks of the hlas library.
 */
export default {
  /** {@link action} HOC for wrapping components with a primary action. */
  action,
  /** {@link useHlasActions} hook for registering components and their actions. */
  useHlasActions,
  /** {@link Describe} components for adding semantic information to UI elements. */
  Describe,
};
