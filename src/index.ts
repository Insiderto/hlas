/**
 * Main entry point for the hlas library
 */

import { action } from "./core/action";
import { useHlasActions } from "./hooks/useHlasActions";
import Describe from "./components/Describe";
import registry from "./core/registry";
import { ComponentEntry, ScreenComponent } from "./core/types";

// Define tour step interface for external use
export interface TourStep {
  id: string; // Component ID
  title?: string; // Title for this step
  description?: string; // Description/content for this step
  position?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

// Export components and hooks
export { action, useHlasActions, Describe };

// Export types
export * from "./core/types";

// Create and define global hlas interface
interface HlasInterface {
  /**
   * Find components by name
   */
  find: (query: string) => ComponentEntry[];

  /**
   * Execute an action on a component
   */
  execute: (
    id: string,
    actionId: string,
    params?: Record<string, any>,
  ) => boolean;

  /**
   *
   * Focus a component by ID
   */
  focus: (id: string) => boolean;

  /**
   * Highlight a component by ID with optional tooltip
   * @param id Component ID to highlight
   * @param duration Duration in milliseconds
   * @param tooltip Optional tooltip content (can be provided by LLM)
   */
  highlight: (id: string, duration?: number, tooltip?: string) => boolean;

  /**
   * Start a guided tour with multiple steps
   * @param steps Array of tour steps with component IDs and descriptions
   * @param autoStart Whether to start the tour automatically (default: true)
   */
  startTour: (steps: TourStep[], autoStart?: boolean) => boolean;

  /**
   * Read the current screen state
   */
  readScreen: () => ScreenComponent[];
}

// Register global hlas object on window
if (typeof window !== "undefined") {
  (window as any).hlas = {
    find: (query: string) => registry.find(query),
    execute: (id: string, actionId: string, params?: Record<string, any>) =>
      registry.execute(id, actionId, params),
    focus: (id: string) => registry.focus(id),
    highlight: (
      id: string,
      duration?: number,
      tooltip?: string,
      description?: string,
    ) => registry.highlight(id, duration, tooltip, description),
    startTour: (steps: TourStep[], autoStart?: boolean) =>
      registry.startTour(steps, autoStart),
    readScreen: () => registry.readScreen(),
  } as HlasInterface;
}

export default {
  action,
  useHlasActions,
  Describe,
};
