/**
 * Basic Describe components for hlas
 */

import React, { forwardRef, useRef, useEffect, useId } from "react";
import { DescribeProps, ListProps, ListItemProps } from "../core/types";
import registry from "../core/registry";

/**
 * Basic component to describe content to LLMs
 */
const DescribeBase = forwardRef<HTMLDivElement, DescribeProps>(
  ({ name, description, children }, ref) => {
    const id = useId();
    const innerRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLDivElement>;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      // Register with registry
      registry.register(
        id,

        element,
        name || "Unnamed Component",
        [],
        description,
      );

      // Clean up on unmount
      return () => {
        registry.unregister(id);
      };
    }, [name, description]);

    return (
      <div
        ref={resolvedRef}
        data-hlas-component={name || "Generic"}
        data-hlas-description={description || ""}
      >
        {children}
      </div>
    );
  },
);

DescribeBase.displayName = "DescribeBase";

/**
 *
 * Describe.List component for describing lists of items
 */
const List = forwardRef<HTMLUListElement, ListProps>(
  ({ name, description, children, items }, ref) => {
    const id = useId();
    const innerRef = useRef<HTMLUListElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLUListElement>;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      // Register with registry
      registry.register(id, element, name || "List", [], description);

      // If we have items data, store it for LLM reading
      if (items && items.length > 0) {
        element.setAttribute("data-hlas-content", JSON.stringify(items));
      }

      // Clean up on unmount
      return () => {
        registry.unregister(id);
      };
    }, [name, description, items]);

    return (
      <ul
        ref={resolvedRef}
        data-hlas-component="List"
        data-hlas-description={description || "A list of items"}
      >
        {children}
      </ul>
    );
  },
);

List.displayName = "List";

/**
 * Describe.ListItem component for list items
 */
const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ name, description, children, value }, ref) => {
    const id = useId();
    const innerRef = useRef<HTMLLIElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLLIElement>;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      // Register with registry

      registry.register(id, element, name || "ListItem", [], description);

      // If we have value data, store it for LLM reading
      if (value !== undefined) {
        element.setAttribute(
          "data-hlas-content",
          typeof value === "object" ? JSON.stringify(value) : String(value),
        );
      }

      // Clean up on unmount
      return () => {
        registry.unregister(id);
      };
    }, [name, description, value]);

    return (
      <li
        ref={resolvedRef}
        data-hlas-component="ListItem"
        data-hlas-description={description || "A list item"}
      >
        {children}
      </li>
    );
  },
);

ListItem.displayName = "ListItem";

// Composite Describe object
const Describe = {
  Base: DescribeBase,
  List,
  ListItem,
};

export default Describe;
