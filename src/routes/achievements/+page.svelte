<script lang="ts">
	import { workoutsStore, exercisesStore } from '$lib/db/queries';
	import { hasAnyRecord } from '$lib/services/personalRecords';
	import {
		allAchievements,
		CATEGORY_TITLE,
		type Achievement,
		type AchievementCategory
	} from '$lib/services/achievements';
	import { consumeNewlyEarned } from '$lib/stores/settings.svelte';

	const CATEGORIES: AchievementCategory[] = ['milestone', 'streak', 'record'];

	const hasPR = $derived(hasAnyRecord($exercisesStore.map((e) => e.id), $workoutsStore));
	const list = $derived(allAchievements($workoutsStore, hasPR));

	function grouped(cat: AchievementCategory): Achievement[] {
		return list.filter((a) => a.category === cat);
	}

	// Captures which badges are freshly earned exactly once — after that the
	// "NEW" flag stays stable for the rest of this visit even as `list` recomputes.
	let newlyEarned = $state<Set<string>>(new Set());
	let consumed = false;
	$effect(() => {
		if (consumed || list.length === 0) return;
		consumed = true;
		newlyEarned = consumeNewlyEarned(new Set(list.filter((a) => a.isEarned).map((a) => a.id)));
	});
</script>

<header class="page-header">
	<h1>Achievements</h1>
</header>

<div class="page stack">
	{#each CATEGORIES as cat (cat)}
		{#if grouped(cat).length > 0}
			<div class="section-title">{CATEGORY_TITLE[cat]}</div>
			<div class="list">
				{#each grouped(cat) as a (a.id)}
					<div class="card hstack">
						<div style="font-size:28px">{a.icon}</div>
						<div class="row-main">
							<div class="row-title">
								{a.title}
								{#if a.isEarned}
									<span class="badge" style="margin-left:8px">✓ Earned</span>
									{#if newlyEarned.has(a.id)}
										<span class="badge badge-live" style="margin-left:6px">NEW</span>
									{/if}
								{/if}
							</div>
							<div class="row-sub">{a.detail}</div>
							{#if !a.isEarned}
								<div class="progress-track">
									<div class="progress-fill" style="width:{a.progress * 100}%"></div>
								</div>
								{#if a.progressText}
									<div class="faint" style="font-size:12px;margin-top:2px">{a.progressText}</div>
								{/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/each}
</div>

<style>
	.progress-track {
		margin-top: 8px;
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
	}
</style>
