# @cellpysdk/runtime

Web Component runtime for embedding [Cellpy](https://cellpy.com) blocks into any website or framework.

## Installation

```bash
npm install @cellpysdk/runtime
```

Or via CDN (no build step required):

```html
<script src="https://cdn.cellpy.com/runtime.iife.js"></script>
```

## Usage

### Via npm (ESM / framework)

```js
import { CellpyBlock } from '@cellpysdk/runtime';

if (!customElements.get('cellpy-block')) {
  customElements.define('cellpy-block', CellpyBlock);
}
```

```html
<cellpy-block slug="your-block-slug"></cellpy-block>
```

### Via CDN (plain HTML)

```html
<script src="https://cdn.cellpy.com/runtime.iife.js"></script>

<cellpy-block slug="your-block-slug"></cellpy-block>
```

## Attributes

| Attribute  | Type                        | Description                                                  |
|------------|-----------------------------|--------------------------------------------------------------|
| `slug`     | `string`                    | The block slug from your Cellpy workspace                    |
| `fallback` | `"loading"` \| `"empty"` | What to show while loading. Omit to show slotted children.   |

## Events

| Event               | Detail                        | Description                              |
|---------------------|-------------------------------|------------------------------------------|
| `cellpy:ready`      | —                             | Fires when the block renders successfully |
| `cellpy:error`      | `{ status, url }`             | Fires when the block fails to load        |
| `cellpy:form-submit`| `{ ok, error?, message? }`    | Fires after a form inside a block submits |

```js
document.addEventListener('cellpy:ready', (e) => {
  console.log('Block ready:', e.target.getAttribute('slug'));
});

document.addEventListener('cellpy:error', (e) => {
  console.error('Block error:', e.detail.status, e.detail.url);
});
```

## Environment configuration

By default the runtime loads blocks from `https://cdn.cellpy.com`. Override via `window` globals before the script loads:

```html
<script>
  window.CELLPY_CDN = 'https://your-custom-cdn.com';
  window.CELLPY_ENV = 'staging'; // use staging CDN
</script>
```

## Framework adapters

For React, Vue, or Angular use the dedicated adapters:

- [`@cellpysdk/react`](https://npmjs.com/package/@cellpysdk/react)
- [`@cellpysdk/vue`](https://npmjs.com/package/@cellpysdk/vue)
- [`@cellpysdk/angular`](https://npmjs.com/package/@cellpysdk/angular)

## License

MIT — see [LICENSE](./LICENSE)
