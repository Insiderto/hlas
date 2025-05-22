/**
 * @module components/Describe
 * @description Provides React components (`Describe.Base`, `Describe.List`, `Describe.ListItem`)
 * for adding semantic information to UI elements, making them understandable and
 * readable by the HLAS system. These components register themselves with the HLAS registry.
 */

import React, { forwardRef, useRef, useEffect, useId, ElementType, ReactNode } from "react";
import { DescribeProps as OriginalDescribeProps, ListProps as OriginalListProps, ListItemProps as OriginalListItemProps } from "../core/types";
import registry from "../core/registry";

// --- Polymorphic Prop Types ---

/**
 * @internal
 * @type AsProp
 * @description Type for the 'as' prop, allowing specification of the rendered HTML element.
 * @template E - The React.ElementType to be rendered.
 */
type AsProp<E extends ElementType> = {
  as?: E;
};

/**
 * @internal
 * @type PolymorphicRef
 * @description Type for the ref in a polymorphic component.
 * @template E - The React.ElementType.
 */
type PolymorphicRef<E extends ElementType> = React.ComponentPropsWithRef<E>["ref"];

/**
 * @internal
 * @type PolymorphicProps
 * @description Generic type for props of a polymorphic component, combining base props,
 * HTML attributes of the rendered element, and the 'as' prop.
 * @template P - The base props interface for the component.
 * @template E - The React.ElementType to be rendered. Defaults to `ElementType` if not specified.
 */
type PolymorphicProps<P, E extends ElementType = ElementType> = P &
  AsProp<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof P | "as">;


// --- Redefine specific props using PolymorphicProps ---

type DescribeBaseProps<E extends ElementType = "div"> = PolymorphicProps<OriginalDescribeProps, E>;
type TextProps<E extends ElementType = "span"> = PolymorphicProps<OriginalDescribeProps, E>;
type HeadingSpecificProps = { level?: 1 | 2 | 3 | 4 | 5 | 6 };
type HeadingProps<E extends ElementType = "h1"> = PolymorphicProps<OriginalDescribeProps & HeadingSpecificProps, E>;
type ContainerProps<E extends ElementType = "div"> = PolymorphicProps<OriginalDescribeProps, E>;
type ImageSpecificProps = { src: string; alt: string };
type ImageProps<E extends ElementType = "img"> = PolymorphicProps<Omit<OriginalDescribeProps, "children"> & ImageSpecificProps, E>;
type LinkSpecificProps = { href: string };
type LinkProps<E extends ElementType = "a"> = PolymorphicProps<OriginalDescribeProps & LinkSpecificProps, E>;
type ButtonProps<E extends ElementType = "button"> = PolymorphicProps<OriginalDescribeProps, E>;
type ListProps<E extends ElementType = "ul"> = PolymorphicProps<OriginalListProps, E>;
type ListItemProps<E extends ElementType = "li"> = PolymorphicProps<OriginalListItemProps, E>;


/**
 * @component Describe.Base
 * @description A fundamental component used to wrap any UI element or section to provide
 * it with a name and description for the HLAS system. It registers the wrapped content
 * with the HLAS registry.
 *
 * @param {DescribeBaseProps<E>} props - Props for the component, including `as` prop.
 * @param {string} [props.name="Unnamed Component"] - A human-readable name.
 * @param {string} [props.description] - A detailed description.
 * @param {React.ReactNode} [props.children] - Content to be wrapped.
 * @param {PolymorphicRef<E>} ref - Forwarded ref to the underlying element.
 * @returns {React.ReactElement} The rendered element with HLAS data attributes.
 */
const DescribeBase = forwardRef(
  <E extends ElementType = "div">(
    { name, description, children, as, ...rest }: DescribeBaseProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null); // Generic HTMLElement for internal ref
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "div";

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      registry.register(id, element, name || "Unnamed Component", [], description);
      return () => registry.unregister(id);
    }, [id, name, description, resolvedRef]); // resolvedRef added to deps

    return (
      <Component
        ref={resolvedRef}
        data-hlas-component={name || "Generic"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
DescribeBase.displayName = "Describe.Base";

/**
 * @component Describe.List
 * @description A component for semantically describing a list of items. It renders a `<ul>` element
 * and registers it with the HLAS registry. It can also store a representation of its items
 * in the `data-hlas-content` attribute if the `items` prop is provided.
 *
 * @param {ListProps<E>} props - Props for the component, including `as` prop.
 * @param {string} [props.name="List"] - A human-readable name for the list.
 * @param {string} [props.description="A list of items"] - A description of the list.
 * @param {unknown[]} [props.items] - Optional data items for `data-hlas-content`.
 * @param {React.ReactNode} [props.children] - List items.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered list element with HLAS data attributes.
 */
const List = forwardRef(
  <E extends ElementType = "ul">(
    { name, description, children, items, as, ...rest }: ListProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "ul";
    const role = (Component !== "ul" && Component !== "ol") ? "list" : undefined;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      registry.register(id, element, name || "List", [], description);
      if (items && items.length > 0) {
        element.setAttribute("data-hlas-content", JSON.stringify(items));
      } else {
        element.removeAttribute("data-hlas-content");
      }
      return () => registry.unregister(id);
    }, [id, name, description, items, resolvedRef]);

    return (
      <Component
        ref={resolvedRef}
        role={role}
        data-hlas-component="List"
        data-hlas-name={name || "List"} // data-hlas-name is set by registry
        data-hlas-description={description || "A list of items"}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
List.displayName = "Describe.List";

/**
 * @component Describe.ListItem
 * @description A component for semantically describing an individual item within a list.
 * It renders an `<li>` element and registers it with the HLAS registry. The `value` prop
 * is typically stored in the `data-hlas-content` attribute for the HLAS system.
 *
 * @param {ListItemProps<E>} props - Props for the component, including `as` prop.
 * @param {string} [props.name="ListItem"] - A human-readable name for the list item.
 * @param {string} [props.description="A list item"] - A description of the list item.
 * @param {unknown} [props.value] - The value associated with this list item for `data-hlas-content`.
 * @param {React.ReactNode} [props.children] - The visible content of the list item.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered list item element with HLAS data attributes.
 */
const ListItem = forwardRef(
  <E extends ElementType = "li">(
    { name, description, children, value, as, ...rest }: ListItemProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "li";
    const role = Component !== "li" ? "listitem" : undefined;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      registry.register(id, element, name || "ListItem", [], description);
      if (value !== undefined) {
        element.setAttribute("data-hlas-content", typeof value === "object" ? JSON.stringify(value) : String(value));
      } else {
        element.removeAttribute("data-hlas-content");
      }
      return () => registry.unregister(id);
    }, [id, name, description, value, resolvedRef]);

    return (
      <Component
        ref={resolvedRef}
        role={role}
        data-hlas-component="ListItem"
        data-hlas-name={name || "ListItem"} // data-hlas-name is set by registry
        data-hlas-description={description || "A list item"}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
ListItem.displayName = "Describe.ListItem";

// --- Describe.Text ---
/**
 * @component Describe.Text
 * @description A component for semantically describing a piece of text.
 * It renders a `<span>` element by default and registers it with the HLAS registry.
 *
 * @param {TextProps<E>} props - Props for the component, including `as` prop.
 * @param {string} [props.name="Text"] - A human-readable name.
 * @param {string} [props.description] - A description of the text.
 * @param {React.ReactNode} [props.children] - The text content.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered text element with HLAS data attributes.
 */
const Text = forwardRef(
  <E extends ElementType = "span">(
    { name, description, children, as, ...rest }: TextProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "span";
    // Text typically doesn't need an explicit role unless it's used for a specific non-text semantic.

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;
      registry.register(id, element, name || "Text", [], description);
      return () => registry.unregister(id);
    }, [id, name, description, resolvedRef]);

    return (
      <Component
        ref={resolvedRef}
        data-hlas-component="Text"
        data-hlas-name={name || "Text"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
Text.displayName = "Describe.Text";

// --- Describe.Heading ---
/**
 * @component Describe.Heading
 * @description A component for semantically describing a heading element (h1-h6).
 * It registers the heading with the HLAS registry and sets a `data-hlas-level` attribute.
 *
 * @param {HeadingProps<E>} props - Props for the component, including `as` and `level`.
 * @param {string} [props.name="Heading"] - A human-readable name.
 * @param {string} [props.description] - A description of the heading.
 * @param {1 | 2 | 3 | 4 | 5 | 6} [props.level=1] - The heading level.
 * @param {React.ReactNode} [props.children] - The text content.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered heading element with HLAS data attributes.
 */
const Heading = forwardRef(
  <E extends ElementType = "h1">( // Default to h1, but level prop dictates the actual default tag
    { name, description, children, level = 1, as, ...rest }: HeadingProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || (`h${level}` as ElementType); // Default to h[level] if 'as' is not provided
    const role = (typeof Component !== 'string' || !Component.match(/^h[1-6]$/i)) ? "heading" : undefined;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      registry.register(id, element, name || "Heading", [], description);
      element.setAttribute("data-hlas-level", String(level));

      return () => {
        registry.unregister(id);
        // No need to remove data-hlas-level as element will be removed
      };
    }, [id, name, description, level, resolvedRef]);

    return (
      <Component
        ref={resolvedRef}
        role={role}
        aria-level={level} // Always set aria-level based on the semantic level
        data-hlas-component="Heading"
        data-hlas-name={name || "Heading"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
Heading.displayName = "Describe.Heading";

// --- Describe.Container ---
/**
 * @component Describe.Container
 * @description A component for semantically describing a generic container element (e.g., a div used for layout or grouping).
 * It renders a `<div>` element and registers it with the HLAS registry.
 *
 * @param {ContainerProps<E>} props - Props for the component, including `as` prop.
 * @param {string} [props.name="Container"] - A human-readable name.
 * @param {string} [props.description] - A description of the container.
 * @param {React.ReactNode} [props.children] - The content.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered container element with HLAS data attributes.
 */
const Container = forwardRef(
  <E extends ElementType = "div">(
    { name, description, children, as, ...rest }: ContainerProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "div";
    // Container is generic, so usually no default role unless specified by usage pattern or 'as' prop.

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;
      registry.register(id, element, name || "Container", [], description);
      return () => registry.unregister(id);
    }, [id, name, description, resolvedRef]);

    return (
      <Component
        ref={resolvedRef}
        data-hlas-component="Container"
        data-hlas-name={name || "Container"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
Container.displayName = "Describe.Container";

// --- Describe.Image ---
/**
 * @component Describe.Image
 * @description A component for semantically describing an image.
 * It renders an `<img>` element and registers it with the HLAS registry,
 * storing `src` and `alt` text in data attributes.
 *
 * @param {ImageProps<E>} props - Props for the component, including `as`, `src`, and `alt`.
 * @param {string} [props.name="Image"] - A human-readable name.
 * @param {string} [props.description] - A description of the image.
 * @param {string} props.src - The source URL of the image.
 * @param {string} props.alt - The alternative text for the image.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered image element with HLAS data attributes.
 */
const Image = forwardRef(
  <E extends ElementType = "img">(
    { name, description, src, alt, as, ...rest }: ImageProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "img";
    const isImgTag = Component === "img";
    const role = !isImgTag ? "img" : undefined; // Add role="img" if not a native <img>

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      registry.register(id, element, name || "Image", [], description);
      element.setAttribute("data-hlas-src", src);
      element.setAttribute("data-hlas-alt", alt);
      // if (!isImgTag && alt) { // For non-img tags, alt might be conveyed via aria-label
      //   element.setAttribute("aria-label", alt);
      // }

      return () => registry.unregister(id);
    }, [id, name, description, src, alt, resolvedRef]);

    const componentSpecificProps: any = {
      src: isImgTag ? src : undefined, // Only pass src if it's an img tag
      alt: isImgTag ? alt : undefined,  // Only pass alt if it's an img tag
    };
    // If not an img tag, aria-label might be preferred over alt attribute
    if (!isImgTag && alt) {
        componentSpecificProps['aria-label'] = alt;
    }


    return (
      <Component
        ref={resolvedRef}
        role={role}
        data-hlas-component="Image"
        data-hlas-name={name || "Image"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...componentSpecificProps}
        {...rest}
      />
    );
  },
);
Image.displayName = "Describe.Image";

// --- Describe.Link ---
/**
 * @component Describe.Link
 * @description A component for semantically describing a hyperlink.
 * It renders an `<a>` element and registers it with the HLAS registry,
 * storing the `href` in a data attribute.
 *
 * @param {LinkProps<E>} props - Props for the component, including `as` and `href`.
 * @param {string} [props.name="Link"] - A human-readable name.
 * @param {string} [props.description] - A description of the link.
 * @param {string} props.href - The URL the hyperlink points to.
 * @param {React.ReactNode} [props.children] - The visible content.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered link element with HLAS data attributes.
 */
const Link = forwardRef(
  <E extends ElementType = "a">(
    { name, description, children, href, as, ...rest }: LinkProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "a";
    const role = Component !== "a" ? "link" : undefined;

    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;

      registry.register(id, element, name || "Link", [], description);
      element.setAttribute("data-hlas-href", href);

      return () => registry.unregister(id);
    }, [id, name, description, href, resolvedRef]);

    const componentSpecificProps: any = {
      href: Component === "a" ? href : undefined, // Only pass href if it's an anchor tag
    };

    return (
      <Component
        ref={resolvedRef}
        role={role}
        data-hlas-component="Link"
        data-hlas-name={name || "Link"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...componentSpecificProps}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
Link.displayName = "Describe.Link";

// --- Describe.Button ---
/**
 * @component Describe.Button
 * @description A component for semantically describing a button element.
 * It renders a `<button>` element and registers it with the HLAS registry.
 *
 * @param {ButtonProps<E>} props - Props for the component, including `as` prop.
 * @param {string} [props.name="Button"] - A human-readable name.
 * @param {string} [props.description] - A description of the button.
 * @param {React.ReactNode} [props.children] - The content.
 * @param {PolymorphicRef<E>} ref - Forwarded ref.
 * @returns {React.ReactElement} The rendered button element with HLAS data attributes.
 */
const Button = forwardRef(
  <E extends ElementType = "button">(
    { name, description, children, as, ...rest }: ButtonProps<E>,
    ref: PolymorphicRef<E>,
  ) => {
    const id = useId();
    const innerRef = useRef<HTMLElement>(null);
    const resolvedRef = (ref || innerRef) as React.RefObject<HTMLElement>;
    const Component = as || "button";
    const role = Component !== "button" ? "button" : undefined;
    // For native buttons, type="button" is often good practice if not submitting a form.
    // If 'as' is used to make a div a button, tabindex might be needed.
    const typeProp = (Component === "button" && !(rest as any).type) ? { type: "button" } : {};


    useEffect(() => {
      const element = resolvedRef.current;
      if (!element) return;
      registry.register(id, element, name || "Button", [], description);
      return () => registry.unregister(id);
    }, [id, name, description, resolvedRef]);

    return (
      <Component
        ref={resolvedRef}
        role={role}
        {...typeProp}
        data-hlas-component="Button"
        data-hlas-name={name || "Button"} // data-hlas-name is set by registry
        data-hlas-description={description || ""}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);
Button.displayName = "Describe.Button";


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
