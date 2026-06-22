# @cellpysdk/vue

Vue 3 adapter for embedding [Cellpy](https://cellpy.com) blocks. SSR-safe — the Web Component is registered client-side only.

## Installation

```bash
npm install @cellpysdk/vue @cellpysdk/runtime
```

## Usage

```vue
<script setup lang="ts">
import { CellpyBlock } from '@cellpysdk/vue';
</script>

<template>
  <CellpyBlock slug="your-block-slug" />
</template>
```

## Props

| Prop         | Type                          | Description                                                  |
|--------------|-------------------------------|--------------------------------------------------------------|
| `slug`       | `string`                      | The block slug from your Cellpy workspace                    |
| `fallback`   | `"loading"` \| `"empty"`    | What to show while loading. Omit to show slotted children.   |
| `onNavigate` | `(href: string) => void`      | Called when an internal link inside the block is clicked     |

## Exposed

The component exposes `el` — a `Ref<HTMLElement | null>` to the underlying `<cellpy-block>` element:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CellpyBlock, type CellpyBlockExposed } from '@cellpysdk/vue';

const blockRef = ref<CellpyBlockExposed | null>(null);
</script>

<template>
  <CellpyBlock ref="blockRef" slug="your-block-slug" />
</template>
```

## SPA navigation

Use `onNavigate` to intercept internal links inside a block and hand them to Vue Router:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { CellpyBlock } from '@cellpysdk/vue';

const router = useRouter();
</script>

<template>
  <CellpyBlock
    slug="your-block-slug"
    :on-navigate="(href) => router.push(href)"
  />
</template>
```

## Environment configuration

Override the CDN or switch to staging via environment variables:

```env
VITE_CELLPY_ENV=staging
VITE_CELLPY_CDN=https://your-custom-cdn.com
```

Or via `window` globals set before your app boots.

## Requirements

- Vue 3
- `@cellpysdk/runtime` peer dependency

## License

MIT — see [LICENSE](./LICENSE)
