import { ComponentEntry, ScreenComponent } from "../core/types";
import { TourStep } from "../core/registry";

declare global {
  interface Window {
    hlas: {
      find: (query: string) => ComponentEntry[];
      execute: (
        id: string,
        actionId: string,
        params?: Record<string, unknown>,
      ) => boolean;
      focus: (id: string) => boolean;
      readScreen: () => ScreenComponent[];
      highlight: (
        id: string,
        duration: number = 2000,
        title?: string,
        description?: string,
      ) => boolean;
      startTour: (steps: TourStep[], autoStart: boolean = true) => boolean;
    };
  }
}

export {};
