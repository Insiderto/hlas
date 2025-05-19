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
 * Wraps a React component with hlas action capabilities
 *
 * @param schema Action schema that defines the component's capabilities
 * @param Component The React component to wrap (must support ref forwarding)
 * @returns A wrapped component with hlas capabilities
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

      // Use createElement to avoid JSX transformation issues
      return React.createElement(Component, { ...props, ref: setRefs });
    },
  );
}
