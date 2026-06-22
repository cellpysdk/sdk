import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ── Runtime registration ───────────────────────────────────────────────────────

let _registered = false;

async function ensureRegistered(): Promise<void> {
  if (_registered) return;
  // Dynamic import keeps @cellpy/runtime out of the server bundle —
  // ngAfterViewInit never runs on the server so this is never executed SSR.
  const { CellpyBlock: Block } = await import('@cellpysdk/runtime');
  if (!customElements.get('cellpy-block')) {
    customElements.define('cellpy-block', Block);
  }
  _registered = true;
}

// ── Env config (US-ENV-02) ────────────────────────────────────────────────────
// Read process.env.* (replaced at build time by the consumer's Angular CLI /
// webpack / esbuild). window.* set by inline <script> always wins (BR-ENV-04).
//
// Each getter is wrapped in try-catch: accessing process throws ReferenceError
// in environments that do not polyfill it.

function e(getter: () => string | undefined): string | undefined {
  try { return getter(); } catch { return undefined; }
}

function applyEnvConfig(): void {
  const candidates: Record<string, string | undefined> = {
    CELLPY_ENV:
      e(() => process.env['CELLPY_ENV']),
    CELLPY_CDN:
      e(() => process.env['CELLPY_CDN']),
    CELLPY_CDN_STAGING:
      e(() => process.env['CELLPY_CDN_STAGING']),
    CELLPY_CDN_PRODUCTION:
      e(() => process.env['CELLPY_CDN_PRODUCTION']),
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

@Component({
  selector: 'cellpy-component',
  // Bind slug as HTML attribute — the web component reads observedAttributes,
  // so [attr.x] (setAttribute) is correct; null removes the attribute entirely.
  template: `<cellpy-block #blockEl
    [attr.slug]="slug ?? null"
    [attr.fallback]="fallback ?? null"
  ></cellpy-block>`,
})
export class CellpyBlockComponent implements AfterViewInit, OnDestroy {
  @Input() slug?: string;
  @Input() fallback?: 'loading' | 'empty';

  /** Emits the href string when an internal link inside the block is clicked. */
  @Output() navigate = new EventEmitter<string>();

  @ViewChild('blockEl') private blockElRef?: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private removeClick?: () => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    applyEnvConfig();
    ensureRegistered();
    this.setupClick();
  }

  ngOnDestroy(): void {
    this.removeClick?.();
  }

  private setupClick(): void {
    const el = this.blockElRef?.nativeElement;
    if (!el) return;

    const handleClick = (ev: MouseEvent) => {
      // Check at click time — avoids re-wiring the listener when (navigate) binding changes
      if (!this.navigate.observed) return;
      const anchor = findAnchor(ev);
      if (!anchor || anchor.target === '_blank') return;
      if (!isInternal(anchor.href)) return;
      ev.preventDefault();
      const url = new URL(anchor.href, window.location.href);
      this.navigate.emit(url.pathname + url.search + url.hash);
    };

    el.addEventListener('click', handleClick);
    this.removeClick = () => el.removeEventListener('click', handleClick);
  }
}
