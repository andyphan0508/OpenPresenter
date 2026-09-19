/// <reference types="vite/client" />

import type { OpenPresenterApi } from "../../preload";

declare global {
  interface Window {
    api: OpenPresenterApi;
  }
}
