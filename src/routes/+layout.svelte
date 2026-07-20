<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import TabBar from '$lib/components/TabBar.svelte';
	import RestTimerBar from '$lib/components/RestTimerBar.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { syncReminders } from '$lib/services/reminders';

	let { children } = $props();

	// Web has no calendar-trigger notifications, so the reminder fires here —
	// on app open and whenever the tab regains focus — instead of in the
	// background. See `$lib/services/reminders` for the due-check.
	function checkReminder() {
		const firedOn = syncReminders(settings);
		if (firedOn) settings.reminderLastFiredOn = firedOn;
	}

	onMount(() => {
		checkReminder();
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') checkReminder();
		});
	});
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
