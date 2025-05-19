declare module 'react-dom' {
  import * as React from 'react';
  
  function render(
    element: React.ReactElement,
    container: HTMLElement | null,
    callback?: () => void
  ): void;
  
  export default {
    render
  };
}
