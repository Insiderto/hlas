/**
 * Main entry point for the hlas library
 */

import { action } from './core/action';
import { useHlasActions } from './hooks/useHlasActions';
import Describe from './components/Describe';
import registry from './core/registry';
import { ComponentEntry, ScreenComponent } from './core/types';

// Export components and hooks
export { action, useHlasActions, Describe };

// Export types
export * from './core/types';

// Create and define global hlas interface
interface HlasInterface {
  /**
   * Find components by name
   */
  find: (query: string) => ComponentEntry[];
  
  /**
   * Execute an action on a component
   */
  execute: (id: string, actionId: string, params?: Record<string, any>) => boolean;
  
  /**
   * Focus a component by ID
   */
  focus: (id: string) => boolean;
  
  /**
   * Highlight a component by ID
   */
  highlight: (id: string, duration?: number) => boolean;
  
  /**
   * Read the current screen state
   */
  readScreen: () => ScreenComponent[];
}

// Register global hlas object on window
if (typeof window !== 'undefined') {
  (window as any).hlas = {
    find: (query: string) => registry.find(query),
    execute: (id: string, actionId: string, params?: Record<string, any>) => 
      registry.execute(id, actionId, params),
    focus: (id: string) => registry.focus(id),
    highlight: (id: string, duration?: number) => registry.highlight(id, duration),
    readScreen: () => registry.readScreen()
  } as HlasInterface;
}

export default {
  action,
  useHlasActions,
  Describe
};
