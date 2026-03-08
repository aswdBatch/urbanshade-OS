import type { ReactNode } from "react";

export interface App {
  id: string;
  name: string;
  icon: ReactNode;
  run: () => void;
  minimalInclude?: boolean;
  standardInclude?: boolean;
  downloadable?: boolean;
  searchAliases?: string[];
}

export interface WindowData {
  id: string;
  app: App;
  zIndex: number;
  minimized?: boolean;
}
