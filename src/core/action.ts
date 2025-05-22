/**
 * Basic action wrapper for hlas
 */

import React, {
  forwardRef,
  useEffect,
  useRef,
  ElementType,
  ComponentProps,
} from "react";
import { ActionSchema } from "./types";

/**
 * @module core/action
 * @description Provides a Higher Order Component (HOC) for wrapping React components
 * to declaratively associate them with a primary action schema.
 */

import React, {
  forwardRef,
  useEffect,
  useRef,
  ElementType,
  ComponentProps,
} from "react";
import { ActionSchema } from "./types";

/**
 * Higher Order Component (HOC) that wraps a React component to associate it with
 * a primary action defined by an {@link ActionSchema}.
 *
 * This HOC applies `data-hlas-*` attributes to the underlying DOM element,
 * including `data-hlas-action` (from `schema.id`), `data-hlas-name` (from `schema.name`),
 * `data-hlas-description` (if provided in schema), and `data-hlas-parameters` (if provided).
 *
 * The wrapped component must support `ref` forwarding to its underlying DOM element.
 *
 * @template C - The type of the React component being wrapped. Must be an {@link ElementType}.
 * @param {ActionSchema} schema - The action schema defining the component's primary action, name,
 *                                description, and parameters. This information is used to set
 *                                `data-hlas-*` attributes.
 * @param {C} Component - The React component to wrap. It should be capable of forwarding a ref
 *                        to its underlying DOM element (e.g., created with `React.forwardRef` or
 *                        an intrinsic DOM element type like 'button').
 * @returns {React.ForwardRefExoticComponent<React.PropsWithoutRef<ComponentProps<C>> & React.RefAttributes<HTMLElement>>}
 *          A new React component that wraps the input `Component`, applying HLAS data attributes.
 *
 * @remarks
 * - This HOC is primarily for components that have a single, dominant action. For components
 *   with multiple actions or more complex registration needs, use the {@link useHlasActions} hook directly.
 * - The `data-hlas-name` and `data-hlas-description` attributes set by this HOC are based on the
 *   provided `schema`. If the wrapped component is also registered using `useHlasActions`,
 *   the `name` and `description` provided to `useHlasActions` (and subsequently to `registry.register`)
 *   will typically take precedence for the component's entry in the HLAS registry, as they are applied
 *   during the `useEffect` phase of the hook. This HOC sets attributes related to *its specific action schema*.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { action, ActionSchema } from '@hlas/core'; // Assuming paths
 *
 * const myActionSchema: ActionSchema = {
 *   id: 'submitForm',
 *   name: 'Submit Form',
 *   description: 'Submits the current form data.',
 *   parameters: [{ name: 'source', type: 'string' }]
 * };
 *
 * const MyButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
 *   (props, ref) => <button ref={ref} {...props}>Submit</button>
 * );
 *
 * const HlasSubmitButton = action(myActionSchema, MyButton);
 *
 * // Usage:
 * // <HlasSubmitButton onClick={() => console.log('Clicked')} />
 * // This button will have data-hlas-action="submitForm", data-hlas-name="Submit Form", etc.
 * ```
 */
export function action<C extends ElementType>(
  schema: ActionSchema,
  Component: C,
) {
  type ComponentPropsWithRef = ComponentProps<C> & {
    ref?: React.Ref<HTMLElement>;
  };

  // Use forwardRef to ensure we can access the DOM element
  return forwardRef<HTMLElement, ComponentPropsWithRef>(
    function ActionWrapper(props, ref) {
      const innerRef = useRef<HTMLElement | null>(null);

      // Combine the passed ref with our internal ref
      const setRefs = (element: HTMLElement | null) => {
        // Save to our internal ref
        innerRef.current = element;

        // Forward to the passed ref
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      };

      // Apply data attributes when the ref is available
      useEffect(() => {
        const element = innerRef.current;
        if (!element) return;

        // Set data attributes using ref.setAttribute
        element.setAttribute("data-hlas-action", schema.id);
        element.setAttribute("data-hlas-name", schema.name);

        if (schema.description) {
          element.setAttribute("data-hlas-description", schema.description);
        }

        if (schema.parameters && schema.parameters.length > 0) {
          // Serialize parameters with defaults for consistency,
          // ensuring consumers of this attribute receive a predictable structure.
          const parametersJson = JSON.stringify(
            schema.parameters.map((p) => ({
              name: p.name,
              description: p.description || "",
              required: p.required || false,
              type: p.type || "string",
            })),
          );
          element.setAttribute("data-hlas-parameters", parametersJson);
        }

        // Cleanup on unmount
        return () => {
          if (element) {
            element.removeAttribute("data-hlas-action");
            element.removeAttribute("data-hlas-name");
            element.removeAttribute("data-hlas-description");
            element.removeAttribute("data-hlas-parameters");
          }
        };
      }, []);

      // Using React.createElement here.
      // While JSX is often preferred for readability, React.createElement is used
      // to avoid potential JSX transformation complexities or specific environment
      // issues that might arise with generic ElementType components in some build/test setups.
      return React.createElement(Component, { ...props, ref: setRefs });
    },
  );
}
