import { resolveUrl, resolveApiBase } from './config.js';
import { stripScripts } from './security.js';

interface TrackingConfig {
  experiment_id: string;
  variant_id: string;
}

interface FormConfig {
  successMessage?: string;
  submitLabel?: string;
}

interface BlockJson {
  html: string;
  css?: string;
  tracking?: TrackingConfig;
  formConfig?: FormConfig;
}

const SPINNER_HTML = `<style>
  :host { display: block; }
  .cp-spinner {
    width: 1.5rem; height: 1.5rem;
    border: 2px solid rgba(0,0,0,.1);
    border-top-color: rgba(0,0,0,.45);
    border-radius: 50%;
    animation: cp-spin .7s linear infinite;
    margin: 1.25rem auto;
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }
</style>
<div class="cp-spinner" aria-label="Loading" role="status"></div>`;

// How often to silently re-fetch container JSON to pick up assignment changes.
const POLL_INTERVAL_MS = 30_000;

export class CellpyBlock extends HTMLElement {
  static observedAttributes = ['slug'];

  private shadow: ShadowRoot;
  private abortController: AbortController | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private renderedKey: string | null = null; // tracks last rendered content key
  private _trackingCleanup: (() => void) | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this._load(false);
    this._startPolling();
  }

  disconnectedCallback(): void {
    this.abortController?.abort();
    this.abortController = null;
    this._stopPolling();
    this._detachTracking();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.renderedKey = null;
      this._load(false);
    }
  }

  private _startPolling(): void {
    this._stopPolling();
    this.pollTimer = setInterval(() => this._load(true), POLL_INTERVAL_MS);
  }

  private _stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async _load(silent: boolean): Promise<void> {
    this.abortController?.abort();
    this.abortController = new AbortController();

    const url = this._resolveUrl();
    if (!url) {
      this._showNonRenderedState(false);
      return;
    }

    if (!silent) this._showNonRenderedState(true);

    try {
      // silent polls bypass the browser cache so we always see fresh CDN content
      const cache: RequestCache = silent ? 'no-cache' : 'default';
      const response = await fetch(url, { signal: this.abortController.signal, cache });

      if (!response.ok) {
        if (!silent) {
          this._dispatchError(response.status, url);
          this._showNonRenderedState(false);
        }
        return;
      }

      const block: BlockJson = await response.json();
      const contentKey = `${block.html}|${block.css ?? ''}`;

      // skip re-render if content hasn't changed since last render
      if (contentKey === this.renderedKey) return;
      this.renderedKey = contentKey;
      this._render(block);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (!silent) {
        this._dispatchError(null, url);
        this._showNonRenderedState(false);
      }
    }
  }

  private _resolveUrl(): string | null {
    const slug = this.getAttribute('slug');
    if (slug) return resolveUrl(slug);

    return null;
  }

  private _fallbackMode(): 'loading' | 'empty' | 'slot' {
    const f = this.getAttribute('fallback');
    if (f === 'loading') return 'loading';
    if (f === 'empty') return 'empty';
    return 'slot';
  }

  private _showNonRenderedState(isLoading: boolean): void {
    const mode = this._fallbackMode();
    if (mode === 'slot') {
      this.shadow.innerHTML = '<slot></slot>';
    } else if (mode === 'loading' && isLoading) {
      this.shadow.innerHTML = SPINNER_HTML;
    } else {
      this.shadow.innerHTML = '';
    }
  }

  private _render(block: BlockJson): void {
    const style = document.createElement('style');
    style.textContent = block.css ?? '';

    const content = document.createElement('div');
    content.innerHTML = stripScripts(block.html ?? '');

    this.shadow.innerHTML = '';
    this.shadow.appendChild(style);
    this.shadow.appendChild(content);

    this._attachFormHandlers(block.formConfig);

    this.dispatchEvent(
      new CustomEvent('cellpy:ready', { bubbles: true, composed: true })
    );

    if (block.tracking) {
      this._attachTracking(block.tracking);
    } else {
      this._detachTracking();
    }
  }

  private _dispatchError(status: number | null, url: string): void {
    this.dispatchEvent(
      new CustomEvent('cellpy:error', {
        bubbles: true,
        composed: true,
        detail: { status, url },
      })
    );
  }

  private _resolveSlug(): string | null {
    return this.getAttribute('slug');
  }

  private _showFormSuccess(form: HTMLFormElement, message: string): void {
    const success = document.createElement('div');
    success.setAttribute('role', 'status');
    success.style.cssText = 'padding:1.5rem;text-align:center;font-size:1rem;';
    success.textContent = message;
    form.replaceWith(success);
  }

  private _attachFormHandlers(formConfig?: FormConfig): void {
    const slug = this._resolveSlug();
    if (!slug) return;

    const storageKey = `cellpy_submitted_${slug}`;
    const successMsg = formConfig?.successMessage ?? 'Thank you! Your submission was received.';

    this.shadow.querySelectorAll('form').forEach((form) => {
      // Already submitted in a previous session — show success state immediately
      try {
        if (localStorage.getItem(storageKey)) {
          this._showFormSuccess(form as HTMLFormElement, successMsg);
          return;
        }
      } catch { /* localStorage unavailable (private browsing with strict settings) */ }

      form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();

        const fd = new FormData(form as HTMLFormElement);
        const body: Record<string, string> = {};
        fd.forEach((value, key) => { body[key] = String(value); });

        const url = `${resolveApiBase()}/api/forms/submit/${encodeURIComponent(slug)}`;

        let detail: { ok: boolean; error?: string; message?: string };
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          detail = await res.json();
        } catch {
          detail = { ok: false, error: 'NETWORK_ERROR' };
        }

        if (detail.ok) {
          try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
          this._showFormSuccess(form as HTMLFormElement, successMsg);
        }

        this.dispatchEvent(
          new CustomEvent('cellpy:form-submit', {
            bubbles: true,
            composed: true,
            detail,
          })
        );
      });
    });
  }

  private _detachTracking(): void {
    if (this._trackingCleanup) {
      this._trackingCleanup();
      this._trackingCleanup = null;
    }
  }

  private _sendEvent(
    event: 'impression' | 'click',
    tracking: TrackingConfig,
    ctaLabel?: string
  ): void {
    const payload = JSON.stringify({
      event,
      experiment_id: tracking.experiment_id,
      variant_id: tracking.variant_id,
      cta_label: ctaLabel,
      ts: Date.now(),
    });
    const url = 'https://cdn.cellpy.com/e';
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', body: payload, keepalive: true }).catch(() => {});
      }
    } catch (_) { /* never block render */ }
  }

  private _attachTracking(tracking: TrackingConfig): void {
    this._detachTracking();

    this._sendEvent('impression', tracking);

    const handler = (e: Event) => {
      const target = (e.target as Element).closest('[data-cta], a, button');
      if (!target) return;
      const ctaLabel =
        (target as HTMLElement).dataset?.['cta'] ?? target.tagName.toLowerCase();
      this._sendEvent('click', tracking, ctaLabel);
    };

    this.shadow.addEventListener('click', handler);
    this._trackingCleanup = () => this.shadow.removeEventListener('click', handler);
  }
}
