# @cellpysdk/react

React adapter for embedding [Cellpy](https://cellpy.com) blocks. SSR-safe — the Web Component is registered client-side only.

## Installation

```bash
npm install @cellpysdk/react @cellpysdk/runtime
```

## Usage

```tsx
import { CellpyBlock } from '@cellpysdk/react';

export default function Page() {
  return <CellpyBlock slug="your-block-slug" />;
}
```

## Props

| Prop         | Type                          | Description                                                  |
|--------------|-------------------------------|--------------------------------------------------------------|
| `slug`       | `string`                      | The block slug from your Cellpy workspace                    |
| `fallback`   | `"loading"` \| `"empty"`    | What to show while loading. Omit to show children.           |
| `onNavigate` | `(href: string) => void`      | Called when an internal link inside the block is clicked     |
| `className`  | `string`                      | CSS class passed to the Web Component element                |
| `style`      | `React.CSSProperties`         | Inline styles passed to the Web Component element            |
| `children`   | `React.ReactNode`             | Shown as fallback slot when block is not rendered            |
| `ref`        | `React.Ref<HTMLElement>`      | Forwarded ref to the underlying `<cellpy-block>` element     |

## SPA navigation

Use `onNavigate` to intercept internal links inside a block and hand them to your router:

```tsx
import { useRouter } from 'next/navigation';
import { CellpyBlock } from '@cellpysdk/react';

export default function Page() {
  const router = useRouter();

  return (
    <CellpyBlock
      slug="your-block-slug"
      onNavigate={(href) => router.push(href)}
    />
  );
}
```

## Environment configuration

Override the CDN or switch to staging via environment variables:

```env
NEXT_PUBLIC_CELLPY_ENV=staging
NEXT_PUBLIC_CELLPY_CDN=https://your-custom-cdn.com
```

Or via `window` globals set before your app boots.

## Requirements

- React 18 or 19
- `@cellpysdk/runtime` peer dependency

## License

MIT — see [LICENSE](./LICENSE)
