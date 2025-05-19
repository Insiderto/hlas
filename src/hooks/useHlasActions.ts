/**
 * Hook for managing actions on a component
 */

import { useRef, useEffect, RefObject, useId } from 'react';
import { ActionMap, ActionSchema } from '../core/types';
import registry from '../core/registry';

/**
 * Hook to register and manage actions for a component
 * 
 * @param actions Map of action IDs to action functions
 * @param name Component name
 * @param description Optional component description
 * @returns Ref to be attached to the component
 */
export function useHlasActions(
  actions: ActionMap,
  name: string,
  description?: string
): RefObject<HTMLElement> {
  // Generate stable component ID using React's useId
  const reactId = useId();
  const elementRef = useRef<HTMLElement>(null);
  const actionsRef = useRef(actions);
  const componentIdRef = useRef<string | null>(null);

  // Update actions ref if actions change
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // Register component and set up action execution
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create action schemas from the actions map
    const actionSchemas: ActionSchema[] = Object.entries(actions).map(
      ([id, _]) => ({
        id,
        name: id, // For simplicity in PoC, just use ID as name
      })
    );

    // Register the component with the registry using the stable React ID
    const componentId = registry.register(
      reactId,
      element,
      name,
      actionSchemas,
      description,
    );
    
    componentIdRef.current = componentId;

    // Set up event listener for action execution
    const handleExecute = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { actionId, params } = customEvent.detail;
      
      if (actionsRef.current[actionId]) {
        actionsRef.current[actionId](params);
      } else {
        console.error(`Action ${actionId} not found on component ${componentId}`);
      }
    };

    element.addEventListener('hlas:execute', handleExecute);

    // Cleanup on unmount
    return () => {
      element.removeEventListener('hlas:execute', handleExecute);
      if (componentIdRef.current) {
        registry.unregister(componentIdRef.current);
        componentIdRef.current = null;
      }
    };
  }, [name, description]);

  return elementRef;
}
