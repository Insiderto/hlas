/**
 * Core type definitions for the hlas library
 */

import { ReactNode, ForwardRefExoticComponent, RefAttributes } from 'react';

/**
 * Action schema defining the shape of an action in hlas
 */
export interface ActionSchema {
  /** Unique identifier for the action */
  id: string;
  /** Human-readable name of the action */
  name: string;
  /** Optional description of what the action does */
  description?: string;
  /** Parameters the action accepts */
  parameters?: ActionParameter[];
}

/**
 * Definition for a parameter an action accepts
 */
export interface ActionParameter {
  /** Name of the parameter */
  name: string;
  /** Human-readable description of the parameter */
  description?: string;
  /** Whether the parameter is required */
  required?: boolean;
  /** Type of the parameter */
  type?: 'string' | 'number' | 'boolean' | 'object';
  /** Default value if not provided */
  defaultValue?: any;
}

/**
 * Action function to be executed
 */
export type ActionFunction = (params?: Record<string, any>) => void;

/**
 * Map of action ID to action function
 */
export type ActionMap = Record<string, ActionFunction>;

/**
 * Component wrapped with hlas action
 */
export type WrappedComponent<P = any> = any; // Simplified for PoC

/**
 * Registry component entry
 */
export interface ComponentEntry {
  /** Component ID */
  id: string;
  /** Component element reference */
  element: HTMLElement;
  /** Actions available on this component */
  actions: ActionSchema[];
  /** Component name */
  name: string;
  /** Component description */
  description?: string;
}

/**
 * Screen reading result
 */
export interface ScreenComponent {
  /** Component ID */
  id: string;
  /** Component name */
  name: string;
  /** Component description */
  description?: string;
  /** Whether the component is visible */
  visible: boolean;
  /** Available actions */
  actions: ActionSchema[];
  /** Content if available (for descriptive components) */
  content?: any;
}

/**
 * Props for describe components
 */
export interface DescribeProps {
  /** Name of the component */
  name?: string;
  /** Description of the component */
  description?: string;
  /** Children nodes */
  children?: ReactNode;
}

/**
 * Props for list components
 */
export interface ListProps extends DescribeProps {
  /** Items in the list */
  items?: any[];
}

/**
 * Props for list item components
 */
export interface ListItemProps extends DescribeProps {
  /** Value of the list item */
  value?: any;
}
