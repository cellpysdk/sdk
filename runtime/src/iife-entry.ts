// IIFE entry point — used only for the CDN bundle (runtime.iife.js).
// Auto-registers the custom element immediately on load.
// document.currentScript in config.ts is captured when this module executes,
// which is synchronous as the browser parses the <script> tag.
import { CellpyBlock } from './element.js';

if (typeof customElements !== 'undefined' && !customElements.get('cellpy-block')) {
  customElements.define('cellpy-block', CellpyBlock);
}
