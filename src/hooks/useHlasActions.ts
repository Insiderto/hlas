/**
 * @module hooks/useHlasActions
 * @description Provides a React hook for registering a component with the HLAS system,
 * enabling it to expose actions and be controlled programmatically.
 */

import { useRef, useEffect, RefObject, useId } from "react";
import { ActionMap, ActionSchema } from "../core/types";
import registry from "../core/registry";

/**
 * A React hook that registers a component with the HLAS (Human-Like Autonomous System) registry,
 * allowing it to be discovered and interacted with programmatically. It also sets up event listeners
 * for executing actions defined by the component.
 *
 * This hook should be used by components that need to expose functionality (actions) to the HLAS system.
 * It handles the component's lifecycle with the registry (registration on mount, unregistration on unmount)
 * and listens for `hlas:execute` custom events dispatched on the component's DOM element to trigger actions.
 *
 * @param {ActionMap} actions - An object where keys are action identifiers (e.g., "click", "setValue")
 *                              and values are the corresponding functions to execute. These functions
 *                              will receive a `params` object if provided during action execution.
 * @param {string} name - A human-readable name for the component (e.g., "Submit Button", "Username Input").
 *                        This name is used for discovery via `window.hlas.find()`.
 * @param {string} [description] - An optional detailed description of the component's purpose or behavior.
 *                                 This is also used for discovery.
 * @returns {RefObject<HTMLElement>} A React ref object that must be attached to the main interactive
 *                                   HTML element of the component. This allows the hook to access the
 *                                   DOM element for registration and event listening.
 *
 * @example
 * ```tsx
 * import React, { useRef } from 'react';
 * import { useHlasActions, ActionMap } from '@hlas'; // Assuming paths
 *
 * const MyInteractiveComponent: React.FC = () => {
 *   const divRef = useRef<HTMLDivElement>(null);
 *
 *   const myActions: ActionMap = {
 *     highlight: () => {
 *       if (divRef.current) {
 *         divRef.current.style.border = '2px solid red';
 *         setTimeout(() => {
 *           if (divRef.current) divRef.current.style.border = '';
 *         }, 1000);
 *       }
 *     },
 *     setValue: (params) => {
 *       console.log(`Value set to: ${params?.text}`);
 *       // In a real component, this might update state or an input field's value
 *     }
 *   };
 *
 *   // Register the component with its actions
 *   useHlasActions(myActions, "My Highlightable Box", "A box that can be highlighted or receive a value.", divRef);
 *   // Note: In the example above, useHlasActions expects the ref as its return, not as a param.
 *   // The correct usage is: const hlasRef = useHlasActions(...); and then <div ref={hlasRef} />
 *   // Corrected example structure:
 *   // const hlasRef = useHlasActions(myActions, "My Highlightable Box", "A box that can be highlighted.");
 *   // return <div ref={hlasRef}>I am a box!</div>;
 *
 *   // Corrected example usage:
 *   const hlasRef = useHlasActions(myActions, "Interactive Box", "A box supporting highlight and setValue.");
 *
 *   return (
 *     <div ref={hlasRef} data-testid="interactive-box" style={{ padding: '10px', border: '1px solid black' }}>
 *       Interact with me!
 *     </div>
 *   );
 * };
 * ```
 * @remarks
 * - The hook uses `React.useId()` to generate a stable, unique ID for the component's registration.
 * - Action schemas for registration are derived from the keys of the `actions` map. The `name` for each
 *   registered `ActionSchema` will be the action's key (e.g., "highlight", "setValue").
 * - When an action is triggered via `window.hlas.execute(componentId, actionId, params)`, the
 *   `handleExecute` function within this hook will look up `actionId` in the `actions` map and call it.
 */
export function useHlasActions(
  actions: ActionMap,
  name: string,
  description?: string,
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
      ([id]) => ({
        // Removed the unused second parameter
        id,
        name: id, // For simplicity in PoC, just use ID as name
      }),
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
        console.error(
          `Action ${actionId} not found on component ${componentId}`,
        );
      }
    };

    element.addEventListener("hlas:execute", handleExecute);

    // Cleanup on unmount
    return () => {
      element.removeEventListener("hlas:execute", handleExecute);
      if (componentIdRef.current) {
        registry.unregister(componentIdRef.current);
        componentIdRef.current = null;
      }
    };
  }, [name, description]);

  return elementRef;
}
