// Bane-Lite is a client-only, local-first PWA (all data in IndexedDB via Dexie),
// so there is nothing to server-render. Disable SSR for the whole app; the
// static adapter emits an index.html SPA shell.
export const ssr = false;
export const prerender = false;
