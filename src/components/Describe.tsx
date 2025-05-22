/**
 * @module components/Describe
 * @description Provides React components (`Describe.Base`, `Describe.List`, `Describe.ListItem`)
 * for adding semantic information to UI elements, making them understandable and
 * readable by the HLAS system. These components register themselves with the HLAS registry.
 */

import React, { forwardRef, useRef, useEffect, useId } from "react";
import { DescribeProps, ListProps, ListItemProps } from "../core/types";
import registry from "../core/registry";

/**
 * @component Describe.Base
 * @description A fundamental component used to wrap any UI element or section to provide
 * it with a name and description for the HLAS system. It registers the wrapped content
 * with the HLAS registry.
 *
 * @param {DescribeProps & React.HTMLAttributes<HTMLDivElement>} props - Props for the component.
 * @param {string} [props.name="Unnamed Component"] - A human-readable name for the described element.
 *                                                  Defaults to "Unnamed Component" for registry,
 *                                                  and "Generic" for `data-hlas-component` if not set.
 * @param {string} [props.description] - A detailed description of the element's purpose or content.
 * @param {React.ReactNode} [props.children] - The content to be wrapped and described.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the underlying `div` element.
 * @returns {React.ReactElement} A `div` element wrapping the children, with HLAS data attributes.
 *
 * @example
 * ```tsx
 * <Describe.Base name="User Profile Section" description="Contains user avatar and details.">
 *   <UserProfile />
 * </Describe.Base>
 * ```
 */
const DescribeBase = forwardRef<HTMLDivElement, DescribeProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ name, description, children, ...rest }, ref) => {
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
        {...rest} // Spread other props like data-testid
      >
        {children}
      </div>
    );
  },
);

DescribeBase.displayName = "DescribeBase";

/**
 * @component Describe.List
 * @description A component for semantically describing a list of items. It renders a `<ul>` element
 * and registers it with the HLAS registry. It can also store a representation of its items
 * in the `data-hlas-content` attribute if the `items` prop is provided.
 *
 * @param {ListProps & React.HTMLAttributes<HTMLUListElement>} props - Props for the component.
 * @param {string} [props.name="List"] - A human-readable name for the list. Defaults to "List".
 * @param {string} [props.description="A list of items"] - A description of the list's content or purpose.
 *                                                        Defaults to "A list of items".
 * @param {unknown[]} [props.items] - An optional array of data items. If provided, these items are
 *                                   JSON.stringify-ed and set to the `data-hlas-content` attribute
 *                                   of the `<ul>` element for the HLAS system to read.
 * @param {React.ReactNode} [props.children] - Typically `Describe.ListItem` components that form the content of the list.
 * @param {React.Ref<HTMLUListElement>} ref - Forwarded ref to the underlying `<ul>` element.
 * @returns {React.ReactElement} A `<ul>` element with HLAS data attributes.
 *
 * @example
 * ```tsx
 * const products = [{id:1, name:"Laptop"}, {id:2, name:"Mouse"}];
 * <Describe.List name="Product List" description="List of available products" items={products}>
 *   {products.map(p => <Describe.ListItem key={p.id} value={p}>{p.name}</Describe.ListItem>)}
 * </Describe.List>
 * ```
 */
const List = forwardRef<HTMLUListElement, ListProps & React.HTMLAttributes<HTMLUListElement>>(
  ({ name, description, children, items, ...rest }, ref) => {
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
        {...rest} // Spread other props like data-testid
      >
        {children}
      </ul>
    );
  },
);

List.displayName = "List";

/**
 * @component Describe.ListItem
 * @description A component for semantically describing an individual item within a list.
 * It renders an `<li>` element and registers it with the HLAS registry. The `value` prop
 * is typically stored in the `data-hlas-content` attribute for the HLAS system.
 *
 * @param {ListItemProps & React.HTMLAttributes<HTMLLIElement>} props - Props for the component.
 * @param {string} [props.name="ListItem"] - A human-readable name for the list item. Defaults to "ListItem".
 * @param {string} [props.description="A list item"] - A description of the list item. Defaults to "A list item".
 * @param {unknown} [props.value] - The value associated with this list item. This value is stringified
 *                                (or JSON.stringify-ed for objects) and set to the `data-hlas-content`
 *                                attribute of the `<li>` element.
 * @param {React.ReactNode} [props.children] - The visible content of the list item.
 * @param {React.Ref<HTMLLIElement>} ref - Forwarded ref to the underlying `<li>` element.
 * @returns {React.ReactElement} An `<li>` element with HLAS data attributes.
 *
 * @example
 * ```tsx
 * <Describe.ListItem name="Product: Laptop" value={{id:1, name:"Laptop", price:1200}}>
 *   Laptop - $1200
 * </Describe.ListItem>
 * ```
 */
const ListItem = forwardRef<HTMLLIElement, ListItemProps & React.HTMLAttributes<HTMLLIElement>>(
  ({ name, description, children, value, ...rest }, ref) => {
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
        {...rest} // Spread other props like data-testid
      >
        {children}
      </li>
    );
  },
);

ListItem.displayName = "ListItem";

/**
 * @namespace Describe
 * @description A collection of components (`Describe.Base`, `Describe.List`, `Describe.ListItem`)
 * used to add semantic meaning and metadata to parts of the UI for the HLAS system.
 * These components handle their own registration with the HLAS registry.
 *
 * @example
 * ```tsx
 * import { Describe } from '@hlas'; // Assuming paths
 *
 * function MyProductList({ products }) {
 *   return (
 *     <Describe.List name="Available Products" items={products.map(p => p.name)}>
 *       {products.map(product => (
 *         <Describe.ListItem key={product.id} name={product.name} value={product}>
 *           {product.name} - {product.price}
 *         </Describe.ListItem>
 *       ))}
 *     </Describe.List>
 *   );
 * }
 * ```
 */
const Describe = {
  /** {@link DescribeBase} A basic component for describing any UI section. */
  Base: DescribeBase,
  /** {@link List} A component for describing lists of items. */
  List,
  /** {@link ListItem} A component for describing individual items within a list. */
  ListItem,
};

export default Describe;
