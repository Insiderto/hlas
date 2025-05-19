/**
 * Basic action wrapper for hlas
 */

import React, { forwardRef } from 'react';
import { ActionSchema } from './types';

/**
 * Wraps a React component with hlas action capabilities
 * 
 * @param schema Action schema that defines the component's capabilities
 * @param Component The React component to wrap
 * @returns A wrapped component with hlas capabilities
 */
export function action<P>(
  schema: ActionSchema,
  Component: React.ComponentType<any>
): any {
  // Use forwardRef to ensure we can access the DOM element
  return forwardRef<HTMLElement, any>((props, ref) => {
    // Add data attributes for the component
    const componentProps: any = {
      ...props,
      ref,
      'data-hlas-action': schema.id,
      'data-hlas-name': schema.name,
    };
    
    if (schema.description) {
      componentProps['data-hlas-description'] = schema.description;
    }

    if (schema.parameters && schema.parameters.length > 0) {
      componentProps['data-hlas-parameters'] = JSON.stringify(
        schema.parameters.map(p => ({ 
          name: p.name,
          description: p.description || '',
          required: p.required || false,
          type: p.type || 'string',
        }))
      );
    }

    // Use createElement to avoid JSX transformation issues
    return React.createElement(Component, componentProps);
  });
}
