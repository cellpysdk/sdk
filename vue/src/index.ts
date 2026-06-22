import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  h,
  type PropType,
  type Ref,
} from 'vue';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CellpyBlockProps {
  slug?: string;
  /** Controls what renders while the block is loading or unassigned.
   *  - `"loading"` — built-in spinner during fetch, empty on error
   *  - `"empty"`   — invisible in all non-rendered states
   *  - omit        — light DOM children shown in all non-rendered states */
  fallback?: 'loading' | 'empty';
  onNavigate?: (href: string) => void;
}

/** Shape exposed to parent refs: `blockRef.value.el` is the underlying HTMLElement. */
export interface CellpyBlockExposed {
  el: Ref<HTMLElement | null>;
}

// ── Runtime registration ───────────────────────────────────────────────────────

let _registered = false;

async function ensureRegistered(): Promise<void> {
  if (_registered) return;
  // Dynamic import keeps @cellpy/runtime out of the server bundle —
  // onMounted never runs on the server so this is never executed SSR.
  const { CellpyBlock: Block } = await import('@cellpysdk/runtime');
  if (!customElements.get('cellpy-block')) {
    customElements.define('cellpy-block', Block);
  }
  _registered = true;
}

// ── Env config (US-ENV-02) ────────────────────────────────────────────────────
// Read process.env.* (replaced at build time by Vite / webpack / etc.).
// window.* set by inline <script> always wins — we only fill gaps (BR-ENV-04).
//
// Each getter is wrapped in try-catch: in Vite browser bundles process is not
// polyfilled, so accessing it throws ReferenceError unless the consumer's
// vite.config.ts adds define entries for these keys (see docs).

function e(getter: () => string | undefined): string | undefined {
  try { return getter(); } catch { return undefined; }
}

function applyEnvConfig(): void {
  const candidates: Record<string, string | undefined> = {
    CELLPY_ENV:
      e(() => process.env.NEXT_PUBLIC_CELLPY_ENV) ??
      e(() => process.env.VITE_CELLPY_ENV) ??
      e(() => process.env.CELLPY_ENV),
    CELLPY_CDN:
      e(() => process.env.NEXT_PUBLIC_CELLPY_CDN) ??
      e(() => process.env.VITE_CELLPY_CDN) ??
      e(() => process.env.CELLPY_CDN),
    CELLPY_CDN_STAGING:
      e(() => process.env.NEXT_PUBLIC_CELLPY_CDN_STAGING) ??
      e(() => process.env.VITE_CELLPY_CDN_STAGING) ??
      e(() => process.env.CELLPY_CDN_STAGING),
    CELLPY_CDN_PRODUCTION:
      e(() => process.env.NEXT_PUBLIC_CELLPY_CDN_PRODUCTION) ??
      e(() => process.env.VITE_CELLPY_CDN_PRODUCTION) ??
      e(() => process.env.CELLPY_CDN_PRODUCTION),
  };

  const w = window as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(candidates)) {
    if (value != null && w[key] == null) {
      w[key] = value;
    }
  }
}

// ── Link interception helpers (US-27) ────────────────────────────────────────
// e.target is retargeted at the shadow boundary — composedPath() is required
// to find the actual <a> element inside the Shadow DOM.

function findAnchor(ev: MouseEvent): HTMLAnchorElement | null {
  return (
    ev.composedPath().find(
      (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement
    ) ?? null
  );
}

function isInternal(href: string): boolean {
  try {
    return new URL(href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CellpyBlock = defineComponent({
  name: 'CellpyBlock',

  // Let class/style/other attrs fall through to the rendered <cellpy-block> element
  // via the ...attrs spread in the render function.
  inheritAttrs: false,

  props: {
    slug:       { type: String,   default: undefined },
    fallback:   { type: String as PropType<'loading' | 'empty'>, default: undefined },
    onNavigate: { type: Function as PropType<(href: string) => void>, default: undefined },
  },

  setup(props, { expose, attrs }) {
    const elRef = ref<HTMLElement | null>(null);

    // Register the custom element and apply .env config — client-side only
    onMounted(() => {
      applyEnvConfig();
      ensureRegistered();
      setupClick();
    });

    onUnmounted(() => { removeClick?.(); });

    // Wire link interception — re-runs only when onNavigate identity changes
    let removeClick: (() => void) | null = null;

    function setupClick() {
      removeClick?.();
      removeClick = null;
      const el = elRef.value;
      if (!el || !props.onNavigate) return;

      function handleClick(ev: MouseEvent) {
        const anchor = findAnchor(ev);
        if (!anchor || anchor.target === '_blank') return;
        if (!isInternal(anchor.href)) return;
        ev.preventDefault();
        const url = new URL(anchor.href, window.location.href);
        props.onNavigate!(url.pathname + url.search + url.hash);
      }

      el.addEventListener('click', handleClick as EventListener);
      removeClick = () => el.removeEventListener('click', handleClick as EventListener);
    }

    watch(() => props.onNavigate, setupClick);

    expose({ el: elRef } satisfies CellpyBlockExposed);

    return () =>
      h('cellpy-block', {
        ...attrs,       // class, style, data-*, aria-*, etc. pass through
        ref: elRef,
        slug:     props.slug,
        fallback: props.fallback,
      });
  },
});
