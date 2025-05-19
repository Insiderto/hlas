import { ComponentEntry, ScreenComponent } from '../core/types';

declare global {
  interface Window {
    hlas: {
      find: (query: string) => ComponentEntry[];
      execute: (id: string, actionId: string, params?: Record<string, any>) => boolean;
      focus: (id: string) => boolean;
      readScreen: () => ScreenComponent[];
    };
  }
}

export {};
