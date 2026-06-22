# @cellpysdk/angular

Angular adapter for embedding [Cellpy](https://cellpy.com) blocks. SSR-safe — the Web Component is registered client-side only.

## Installation

```bash
npm install @cellpysdk/angular @cellpysdk/runtime
```

## Usage

Import `CellpyBlockModule` in your standalone component or NgModule:

```ts
import { Component } from '@angular/core';
import { CellpyBlockModule } from '@cellpysdk/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CellpyBlockModule],
  template: `
    <cellpy-component slug="your-block-slug"></cellpy-component>
  `,
})
export class HomeComponent {}
```

## Inputs

| Input      | Type                        | Description                                                  |
|------------|-----------------------------|--------------------------------------------------------------|
| `slug`     | `string`                    | The block slug from your Cellpy workspace                    |
| `fallback` | `"loading"` \| `"empty"` | What to show while loading. Omit to show slotted children.   |

## Outputs

| Output       | Type                    | Description                                                  |
|--------------|-------------------------|--------------------------------------------------------------|
| `navigate`   | `EventEmitter<string>`  | Emits the href when an internal link inside the block is clicked |

## SPA navigation

Use the `(navigate)` output to intercept internal links and hand them to the Angular Router:

```ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CellpyBlockModule } from '@cellpysdk/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CellpyBlockModule],
  template: `
    <cellpy-component
      slug="your-block-slug"
      (navigate)="router.navigate([$event])"
    ></cellpy-component>
  `,
})
export class HomeComponent {
  protected readonly router = inject(Router);
}
```

## Environment configuration

Override the CDN or switch to staging via environment variables (set in `environment.ts` or Angular CLI define config):

```ts
// environment.ts
export const environment = {
  CELLPY_ENV: 'staging',
  CELLPY_CDN: 'https://your-custom-cdn.com',
};
```

Or via `window` globals set before your app boots.

## Requirements

- Angular 14 or later
- `@cellpysdk/runtime` peer dependency

## License

MIT — see [LICENSE](./LICENSE)
