import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

// PWA shortcuts mirror Bane's Siri/App Intents (start workout, log body metric).
const shortcuts = [
	{
		name: 'Start Empty Workout',
		short_name: 'Workout',
		url: '/workouts/active?new=1',
		icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
	},
	{
		name: 'Log Measurement',
		short_name: 'Measure',
		url: '/body/new',
		icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
	}
];

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			scope: '/',
			base: '/',
			manifest: {
				name: 'Bane Lite',
				short_name: 'Bane',
				description:
					'Local-first workout tracker — log workouts, routines, PRs, and body metrics offline.',
				theme_color: '#0b0b0f',
				background_color: '#0b0b0f',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/',
				categories: ['health', 'fitness', 'lifestyle'],
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{
						src: '/icons/icon-512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				],
				shortcuts
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2,json}'],
				navigateFallback: '/',
				cleanupOutdatedCaches: true,
				clientsClaim: true
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	]
});
