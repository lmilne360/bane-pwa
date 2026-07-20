<script lang="ts">
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import TabBar from '$lib/components/TabBar.svelte';
	import RestTimerBar from '$lib/components/RestTimerBar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="icon" type="image/png" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<meta name="theme-color" content="#0b0b0f" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Bane" />
</svelte:head>

<div class="app-shell">
	{@render children()}
</div>

<RestTimerBar />
<TabBar />
