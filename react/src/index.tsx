'use client';

import React, { useEffect, useRef, forwardRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CellpyBlockProps {
  slug?: string;
  /** Controls what renders while the block is loading or unassigned.
   *  - `"loading"` — built-in spinner during fetch, empty on error
   *  - `"empty"`   — invisible in all non-rendered states
   *  - omit        — light DOM children shown in all non-rendered states */
  fallback?: 'loading' | 'empty';
  /** Called with the href when an internal link inside the block is clicked. */
  onNavigate?: (href: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Teach TypeScript/JSX about the custom element.
// React 19 uses React.JSX.IntrinsicElements; this declaration covers both old and new.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'cellpy-block': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { slug?: string; fallback?: string };
    }
  }
}

// ── Runtime registration ───────────────────────────────────────────────────────

let _registered = false;

async function ensureRegistered(): Promise<void> {
  if (_registered) return;
  // Dynamic import keeps @cellpysdk/runtime out of the server bundle —
  // useEffect never runs on the server so this is never executed SSR.
  const { CellpyBlock: Block } = await import('@cellpysdk/runtime');
  if (!customElements.get('cellpy-block')) {
    customElements.define('cellpy-block', Block);
  }
  _registered = true;
}

// ── Env config (US-ENV-02) ────────────────────────────────────────────────────
// Read process.env.* (replaced at build time by Next.js / Vite / webpack).
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

function findAnchor(e: MouseEvent): HTMLAnchorElement | null {
  return (
    e.composedPath().find(
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

export const CellpyBlock = forwardRef<HTMLElement, CellpyBlockProps>(
  function CellpyBlock({ slug, fallback, onNavigate, className, style, children }, ref) {
    const elRef = useRef<HTMLElement | null>(null);

    // Register the custom element and apply .env config — client-side only
    useEffect(() => {
      applyEnvConfig();
      ensureRegistered();
    }, []);

    // Wire link interception — re-runs only when onNavigate identity changes
    useEffect(() => {
      const el = elRef.current;
      if (!el || !onNavigate) return;

      function handleClick(e: MouseEvent) {
        const anchor = findAnchor(e);
        if (!anchor) return;
        if (anchor.target === '_blank') return;
        if (!isInternal(anchor.href)) return;
        e.preventDefault();
        const url = new URL(anchor.href, window.location.href);
        onNavigate!(url.pathname + url.search + url.hash);
      }

      el.addEventListener('click', handleClick as EventListener);
      return () => el.removeEventListener('click', handleClick as EventListener);
    }, [onNavigate]);

    // Merge the forwarded ref with our local ref
    function setRef(el: HTMLElement | null) {
      elRef.current = el;
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        (ref as { current: HTMLElement | null }).current = el;
      }
    }

    return (
      <cellpy-block
        ref={setRef}
        slug={slug}
        fallback={fallback}
        className={className}
        style={style}
      >
        {children}
      </cellpy-block>
    );
  }
);

CellpyBlock.displayName = 'CellpyBlock';
