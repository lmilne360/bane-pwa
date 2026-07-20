<script lang="ts">
	import { workoutsStore, exercisesStore, exerciseMap } from '$lib/db/queries';
	import { MUSCLES, MUSCLE_LABELS, type Muscle } from '$lib/types';
	import BodyDiagram from '$lib/components/BodyDiagram.svelte';
	import { FRONT_REGIONS, BACK_REGIONS, heatColor } from '$lib/services/muscleHeatMap';

	type WindowOption = '30' | '90' | 'all';

	let windowOption = $state<WindowOption>('30');

	const cutoff = $derived.by(() => {
		if (windowOption === 'all') return null;
		const days = windowOption === '30' ? 30 : 90;
		return Date.now() - days * 24 * 60 * 60 * 1000;
	});

	const finishedInWindow = $derived(
		$workoutsStore.filter((w) => w.finishedAt && (cutoff === null || new Date(w.date).getTime() >= cutoff))
	);

	const counts = $derived.by(() => {
		const map = new Map<Muscle, number>();
		const exMap = exerciseMap($exercisesStore);
		for (const w of finishedInWindow) {
			for (const we of w.exercises) {
				if (!we.exerciseId) continue;
				const ex = exMap.get(we.exerciseId);
				if (!ex) continue;
				for (const s of we.sets) {
					if (s.isWarmup) continue;
					map.set(ex.primaryMuscle, (map.get(ex.primaryMuscle) ?? 0) + 1);
				}
			}
		}
		return map;
	});

	const rows = $derived(
		MUSCLES.map((m) => ({ muscle: m, count: counts.get(m) ?? 0 }))
			.filter((r) => r.count > 0)
			.sort((a, b) => b.count - a.count)
	);

	const maxCount = $derived(Math.max(1, ...rows.map((r) => r.count)));

	function intensity(muscle: Muscle): number {
		return (counts.get(muscle) ?? 0) / maxCount;
	}

	const untrainedNames = $derived.by(() => {
		const mapped = new Set([...FRONT_REGIONS, ...BACK_REGIONS].map((r) => r.muscle));
		const trained = new Set(rows.map((r) => r.muscle));
		return MUSCLES.filter((m) => mapped.has(m) && !trained.has(m)).map((m) => MUSCLE_LABELS[m]);
	});

	const legendGradient = Array.from({ length: 11 }, (_, i) => heatColor(i / 10)).join(', ');
</script>

<header class="page-header">
	<h1>Muscle Heat Map</h1>
</header>

<div class="page stack">
	<div class="pills">
		<button class="pill" aria-pressed={windowOption === '30'} onclick={() => (windowOption = '30')}>30 days</button>
		<button class="pill" aria-pressed={windowOption === '90'} onclick={() => (windowOption = '90')}>90 days</button>
		<button class="pill" aria-pressed={windowOption === 'all'} onclick={() => (windowOption = 'all')}>All</button>
	</div>

	{#if rows.length === 0}
		<div class="empty"><div class="big">🔥</div><div>No finished working sets in this window.</div></div>
	{:else}
		<div class="bodies">
			<BodyDiagram regions={FRONT_REGIONS} {intensity} label="Front" />
			<BodyDiagram regions={BACK_REGIONS} {intensity} label="Back" />
		</div>

		<div class="legend">
			<span class="faint">Less</span>
			<div class="legend-bar" style={`background:linear-gradient(to right, ${legendGradient})`}></div>
			<span class="faint">More</span>
		</div>

		<div class="list">
			{#each rows as row (row.muscle)}
				{@const pct = Math.round((row.count / maxCount) * 100)}
				<div class="row">
					<div class="row-main">
						<div class="row-title">{MUSCLE_LABELS[row.muscle]}</div>
						<div class="bar-track">
							<div class="bar-fill" style={`width:${pct}%;background:${heatColor(row.count / maxCount)}`}></div>
						</div>
					</div>
					<span class="badge">{row.count}</span>
				</div>
			{/each}
		</div>

		{#if untrainedNames.length > 0}
			<div class="card untrained">
				<div class="row-title">Not trained this window</div>
				<div class="row-sub">{untrainedNames.join(', ')}</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.bodies {
		display: flex;
		gap: 12px;
	}
	.bodies > :global(.body-diagram) {
		flex: 1;
		min-width: 0;
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.legend-bar {
		flex: 1;
		height: 8px;
		border-radius: 999px;
	}
	.bar-track {
		margin-top: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		border-radius: 999px;
	}
	.untrained .row-sub {
		margin-top: 4px;
	}
</style>
