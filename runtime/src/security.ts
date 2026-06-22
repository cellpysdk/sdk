// Strip all <script> elements from block HTML before Shadow DOM injection.
// Uses DOMParser so the browser handles nested/encoded edge cases correctly.
// Unconditional — no option or attribute can bypass this (BR-02, BR-04).
export function stripScripts(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script').forEach((el) => el.remove());
  return doc.body.innerHTML;
}
