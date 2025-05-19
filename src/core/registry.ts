/**
 * Global registry implementation for hlas
 */

import { ActionSchema, ComponentEntry, ScreenComponent } from './types';

/**
 * Registry class for managing components and their actions
 */
class Registry {
  private components: Map<string, ComponentEntry> = new Map();

  /**
   * Register a component in the registry
   * @param id Optional custom ID for the component (if not provided, a unique ID will be generated)
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
      description
    });

    // Add data attributes to the DOM element
    element.setAttribute('data-hlas-id', componentId);
    element.setAttribute('data-hlas-name', name);
    
    if (description) {
      element.setAttribute('data-hlas-description', description);
    }

    // Add action data
    if (actions.length > 0) {
      element.setAttribute('data-hlas-actions', actions.map(a => a.id).join(','));
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
   * Get a component by ID
   */
  getComponent(id: string): ComponentEntry | undefined {
    return this.components.get(id);
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

    const event = new CustomEvent('hlas:execute', {
      detail: {
        id,
        actionId,
        params: params || {}
      }
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
   * Highlight a component by ID (for visual indication)
   */
  highlight(id: string, duration: number = 2000): boolean {
    const component = this.components.get(id);
    
    if (!component) {
      console.error(`Component with ID ${id} not found`);
      return false;
    }

    if (component.element instanceof HTMLElement) {
      // First check if there's another highlighted element and remove its highlight
      const highlighted = document.querySelector('.hlas-highlight');
      if (highlighted) {
        highlighted.classList.remove('hlas-highlight');
      }
      
      // Add highlight class to the component
      component.element.classList.add('hlas-highlight');
      
      // Scroll the element into view if needed
      component.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
      
      // Remove the highlight after the specified duration
      if (duration > 0) {
        setTimeout(() => {
          component.element.classList.remove('hlas-highlight');
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
      const rect = component.element.getBoundingClientRect();
      const visible = true; // Set all components as visible
      
      // Extract content from data attributes if available
      let content: any = undefined;
      const contentAttr = component.element.getAttribute('data-hlas-content');
      
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
        content
      });
    }

    return results;
  }
}

// Create global registry instance
const registry = new Registry();

export default registry;
