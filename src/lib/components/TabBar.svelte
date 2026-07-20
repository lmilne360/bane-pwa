<script lang="ts">
	import { page } from '$app/state';

	interface Tab {
		href: string;
		label: string;
		icon: string;
		/** Extra path prefixes that should also light this tab. */
		match?: string[];
	}

	const tabs: Tab[] = [
		{ href: '/workouts', label: 'Workouts', icon: '🏋️' },
		{ href: '/exercises', label: 'Exercises', icon: '📋' },
		{ href: '/routines', label: 'Routines', icon: '🗒️', match: ['/programs'] },
		{ href: '/records', label: 'Records', icon: '🏆' },
		{ href: '/more', label: 'More', icon: '•••', match: ['/charts', '/muscles', '/calendar', '/achievements', '/body', '/tools', '/settings'] }
	];

	function isActive(tab: Tab): boolean {
		const path = page.url.pathname;
		if (path === tab.href || path.startsWith(tab.href + '/')) return true;
		return (tab.match ?? []).some((m) => path === m || path.startsWith(m + '/'));
	}
</script>

<nav class="tabbar" aria-label="Primary">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} class="tab" class:active={isActive(tab)} aria-current={isActive(tab) ? 'page' : undefined}>
			<span class="tab-icon">{tab.icon}</span>
			<span class="tab-label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		display: flex;
		max-width: var(--maxw);
		margin: 0 auto;
		height: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
		padding-bottom: env(safe-area-inset-bottom, 0px);
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		backdrop-filter: blur(14px);
		border-top: 1px solid var(--border);
	}
	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		color: var(--text-faint);
		font-size: 11px;
		font-weight: 600;
	}
	.tab.active {
		color: var(--accent);
	}
	.tab-icon {
		font-size: 20px;
		line-height: 1;
	}
</style>
