/**
 * @module core/types
 * @description Defines core TypeScript types and interfaces used throughout the HLAS library.
 * These types ensure consistency for data structures related to actions, components,
 * and their registration within the HLAS system.
 */

import { ReactNode, ElementType } from "react";

/**
 * @interface ActionSchema
 * @description Defines the structure for an action that a component can expose.
 * This schema is used by the {@link action} HOC and the {@link useHlasActions} hook
 * to understand and register component capabilities.
 * @property {string} id - A unique identifier for the action (e.g., "click", "setValue", "openMenu").
 *                         This ID is used when dispatching actions via `window.hlas.execute()`.
 * @property {string} name - A human-readable name for the action (e.g., "Click Button", "Set Text Value").
 *                           This name is used for display purposes and can be part of the `data-hlas-name` attribute
 *                           if the {@link action} HOC is used.
 * @property {string} [description] - An optional detailed description of what the action does.
 * @property {ActionParameter[]} [parameters] - An optional array defining the parameters this action accepts.
 * @see action
 * @see useHlasActions
 * @see ActionParameter
 */
export interface ActionSchema {
  id: string;
  name: string;
  description?: string;
  parameters?: ActionParameter[];
}

/**
 * @interface ActionParameter
 * @description Defines the structure for a single parameter that an {@link ActionSchema} can accept.
 * @property {string} name - The name of the parameter.
 * @property {string} [description] - A human-readable description of the parameter.
 * @property {boolean} [required=false] - Whether the parameter is required for the action. Defaults to `false`.
 * @property {"string" | "number" | "boolean" | "object"} [type="string"] - The expected data type of the parameter.
 *                                                                      Defaults to "string".
 * @property {unknown} [defaultValue] - An optional default value for the parameter if not provided during action execution.
 */
export interface ActionParameter {
  name: string;
  description?: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "object";
  defaultValue?: unknown;
}

/**
 * @type ActionFunction
 * @description Defines the signature for a function that implements an action.
 * Such functions are provided in the `actions` map to the {@link useHlasActions} hook.
 * @param {Record<string, unknown>} [params] - An optional object containing parameters passed during action execution.
 *                                             The structure of `params` should align with the `parameters`
 *                                             defined in the corresponding {@link ActionSchema}.
 * @returns {void}
 * @see useHlasActions
 * @see ActionMap
 */
export type ActionFunction = (params?: Record<string, unknown>) => void;

/**
 * @type ActionMap
 * @description A map where keys are action identifiers (strings, corresponding to `ActionSchema.id`)
 * and values are the {@link ActionFunction} implementations for those actions.
 * This is the primary way actions are defined when using the {@link useHlasActions} hook.
 *
 * @example
 * ```typescript
 * const myActions: ActionMap = {
 *   click: () => console.log('Clicked!'),
 *   setValue: (params) => {
 *     if (params && typeof params.text === 'string') {
 *       // setText(params.text);
 *     }
 *   }
 * };
 * ```
 * @see useHlasActions
 * @see ActionFunction
 */
export type ActionMap = Record<string, ActionFunction>;

/**
 * @type WrappedComponent
 * @description Represents a generic React component type.
 * Used by the {@link action} HOC to type the component it wraps.
 * It leverages React's {@link ElementType} for flexibility.
 * @see action
 */
export type WrappedComponent = ElementType; // Simplified for PoC, but ElementType is quite broad and suitable.

/**
 * @interface ComponentEntry
 * @description Represents the data structure stored in the {@link Registry} for each registered component.
 * It contains the component's ID, its DOM element, defined actions, name, and description.
 * This information is returned by `window.hlas.find()`.
 * @property {string} id - The unique ID of the component.
 * @property {HTMLElement} element - A direct reference to the component's underlying HTML DOM element.
 * @property {ActionSchema[]} actions - An array of action schemas representing the actions
 *                                      supported by this component. Derived from the `actions` map
 *                                      passed to {@link useHlasActions}.
 * @property {string} name - The human-readable name of the component.
 * @property {string} [description] - An optional description of the component.
 * @see Registry
 * @see window.hlas.find
 */
export interface ComponentEntry {
  id: string;
  element: HTMLElement;
  actions: ActionSchema[];
  name: string;
  description?: string;
}

/**
 * @interface ScreenComponent
 * @description Represents the information about a single component as returned by `window.hlas.readScreen()`.
 * This provides a snapshot of a component's state and capabilities.
 * @property {string} id - The unique ID of the component.
 * @property {string} name - The human-readable name of the component.
 * @property {string} [description] - An optional description of the component.
 * @property {boolean} [visible] - Indicates whether the component is currently considered visible on the screen.
 *                                 Note: The core `registry.readScreen()` method does not populate this by default.
 *                                 Visibility determination might be added as a future enhancement or be context-dependent.
 * @property {ActionSchema[]} actions - An array of action schemas representing the actions supported by this component.
 * @property {unknown} [content] - If the component is descriptive (e.g., `Describe.List`, `Describe.ListItem`),
 *                                 this field may contain its content (e.g., list items, item value).
 *                                 The structure of `content` can vary.
 * @see window.hlas.readScreen
 * @see Registry.readScreen
 */
export interface ScreenComponent {
  id: string;
  name: string;
  description?: string;
  visible?: boolean; // Made optional as per refinement
  actions: ActionSchema[];
  content?: unknown;
}

/**
 * @interface DescribeProps
 * @description Base props for the `Describe` family of components (`Describe.Base`, `Describe.List`, `Describe.ListItem`).
 * @property {string} [name] - A human-readable name for the described UI element or section.
 * @property {string} [description] - A more detailed description of the element's purpose or content.
 * @property {ReactNode} [children] - The child elements to be wrapped and described.
 * @see Describe.Base
 * @see Describe.List
 * @see Describe.ListItem
 */
export interface DescribeProps {
  name?: string;
  description?: string;
  children?: ReactNode;
}

/**
 * @interface ListProps
 * @description Props for the {@link Describe.List} component. Extends {@link DescribeProps}.
 * @property {unknown[]} [items] - An optional array of data items. If provided, these items are
 *                                 JSON.stringify-ed and set to the `data-hlas-content` attribute
 *                                 of the rendered `<ul>` element for the HLAS system to read.
 *                                 This is useful for lists where the items themselves are not complex
 *                                 React components but simple data.
 * @see Describe.List
 */
export interface ListProps extends DescribeProps {
  items?: unknown[];
}

/**
 * @interface ListItemProps
 * @description Props for the {@link Describe.ListItem} component. Extends {@link DescribeProps}.
 * @property {unknown} [value] - The semantic value associated with this list item. This value is
 *                               stringified (or JSON.stringify-ed for objects) and set to the
 *                               `data-hlas-content` attribute of the rendered `<li>` element.
 *                               It represents the data this list item holds.
 * @see Describe.ListItem
 */
export interface ListItemProps extends DescribeProps {
  value?: unknown;
}
