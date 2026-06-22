// ESM/CJS entry point — exports only, no side effects.
// Does NOT call customElements.define so adapters can defer registration
// until the browser environment is confirmed (SSR safety).
export { CellpyBlock } from './element.js';
export { resolveUrl, resolveCdnBase, resolveApiBase } from './config.js';
