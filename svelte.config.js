import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Bane-Lite is a local-first PWA: all data lives in IndexedDB (Dexie) in the
 * browser, so there is no server to render on. We ship a single-page app via
 * the static adapter with an `index.html` fallback, and disable SSR globally
 * in the root layout.
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Svelte 5 runes mode across the project (matches the scaffold default).
		runes: true
	},
	kit: {
		adapter: adapter({
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		alias: {
			$lib: 'src/lib'
		}
	}
};

export default config;
