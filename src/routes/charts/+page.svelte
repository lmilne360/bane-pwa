<script lang="ts">
	import { workoutsStore, exercisesStore, exerciseMap } from '$lib/db/queries';
	import { totalVolume, formatDate } from '$lib/services/format';
	import { estimatedOneRepMax } from '$lib/services/personalRecords';
	import { formatVolume, formatWeight } from '$lib/services/weight';
	import { settings } from '$lib/stores/settings.svelte';
	import type { Exercise } from '$lib/types';

	interface ChartData {
		xs: number[];
		ys: number[];
		linePath: string;
		areaPath: string;
		min: number;
		max: number;
	}

	const CHART_W = 320;
	const CHART_H = 140;
	const PAD_Y = 8;

	/** Scales a series of raw (pounds) values into SVG-space line/area paths. */
	function buildChart(values: number[]): ChartData {
		const n = values.length;
		if (n === 0) return { xs: [], ys: [], linePath: '', areaPath: '', min: 0, max: 0 };
		const max = Math.max(...values);
		const min = Math.min(0, ...values);
		const range = max - min || 1;
		const xs = values.map((_, i) => (n === 1 ? CHART_W / 2 : (i * CHART_W) / (n - 1)));
		const ys = values.map((v) => CHART_H - PAD_Y - ((v - min) / range) * (CHART_H - 2 * PAD_Y));
		const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
		const baseline = CHART_H - PAD_Y;
		const areaPath = n === 1 ? '' : `${linePath} L${xs[n - 1]},${baseline} L${xs[0]},${baseline} Z`;
		return { xs, ys, linePath, areaPath, min, max };
	}

	const finished = $derived(
		[...$workoutsStore].filter((w) => w.finishedAt).sort((a, b) => a.date.localeCompare(b.date))
	);

	// MARK: Chart A — volume per workout

	const volumeSeries = $derived(finished.map((w) => ({ date: w.date, pounds: totalVolume(w) })));
	const volumeChart = $derived(buildChart(volumeSeries.map((p) => p.pounds)));

	// MARK: Chart B — estimated 1RM per exercise

	const exMap = $derived(exerciseMap($exercisesStore));

	const availableExercises = $derived.by(() => {
		const ids = new Set<string>();
		for (const w of finished) {
			for (const we of w.exercises) {
				if (we.exerciseId) ids.add(we.exerciseId);
			}
		}
		const list: Exercise[] = [];
		for (const id of ids) {
			const ex = exMap.get(id);
			if (ex) list.push(ex);
		}
		return list.sort((a, b) => a.name.localeCompare(b.name));
	});

	let selectedExerciseId = $state('');

	$effect(() => {
		if (!selectedExerciseId && availableExercises.length > 0) {
			selectedExerciseId = availableExercises[0].id;
		}
	});

	const oneRepMaxSeries = $derived.by(() => {
		if (!selectedExerciseId) return [];
		const points: { date: string; pounds: number }[] = [];
		for (const w of finished) {
			let best = 0;
			for (const we of w.exercises) {
				if (we.exerciseId !== selectedExerciseId) continue;
				for (const s of we.sets) {
					if (s.isWarmup || s.reps <= 0 || s.weight <= 0) continue;
					const est = estimatedOneRepMax(s.reps, s.weight);
					if (est > best) best = est;
				}
			}
			if (best > 0) points.push({ date: w.date, pounds: best });
		}
		return points;
	});

	const oneRepChart = $derived(buildChart(oneRepMaxSeries.map((p) => p.pounds)));
</script>

<header class="page-header">
	<h1>Charts</h1>
</header>

<div class="page stack">
	{#if finished.length === 0}
		<div class="empty"><div class="big">📈</div><div>No finished workouts yet.</div></div>
	{:else}
		<div class="section-title">Volume per workout</div>
		<div class="card stack">
			{#if volumeSeries.length === 0}
				<div class="muted">Not enough data yet.</div>
			{:else}
				<div class="hstack" style="justify-content:space-between">
					<span class="faint">{formatVolume(volumeChart.min, settings.weightUnit)}</span>
					<span class="faint">{formatVolume(volumeChart.max, settings.weightUnit)}</span>
				</div>
				<svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style="width:100%;height:140px" preserveAspectRatio="none">
					<line x1="0" y1={CHART_H - 1} x2={CHART_W} y2={CHART_H - 1} stroke="var(--border)" stroke-width="1" />
					{#if volumeChart.areaPath}
						<path d={volumeChart.areaPath} fill="var(--accent)" opacity="0.15" />
					{/if}
					<path d={volumeChart.linePath} fill="none" stroke="var(--accent)" stroke-width="2" />
				</svg>
				<div class="hstack" style="justify-content:space-between">
					<span class="faint">{formatDate(volumeSeries[0].date)}</span>
					<span class="faint">{formatDate(volumeSeries[volumeSeries.length - 1].date)}</span>
				</div>
			{/if}
		</div>

		<div class="section-title">Estimated 1RM</div>
		<div class="card stack">
			{#if availableExercises.length === 0}
				<div class="muted">No exercise history yet.</div>
			{:else}
				<select bind:value={selectedExerciseId}>
					{#each availableExercises as ex (ex.id)}
						<option value={ex.id}>{ex.name}</option>
					{/each}
				</select>

				{#if oneRepMaxSeries.length === 0}
					<div class="muted">No working sets logged for this exercise yet.</div>
				{:else}
					<div class="hstack" style="justify-content:space-between">
						<span class="faint">{formatWeight(oneRepChart.min, settings.weightUnit)}</span>
						<span class="faint">{formatWeight(oneRepChart.max, settings.weightUnit)}</span>
					</div>
					<svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style="width:100%;height:140px" preserveAspectRatio="none">
						<line x1="0" y1={CHART_H - 1} x2={CHART_W} y2={CHART_H - 1} stroke="var(--border)" stroke-width="1" />
						<path d={oneRepChart.linePath} fill="none" stroke="var(--accent)" stroke-width="2" />
						{#each oneRepChart.xs as x, i (i)}
							<circle cx={x} cy={oneRepChart.ys[i]} r="3" fill="var(--accent)" />
						{/each}
					</svg>
					<div class="hstack" style="justify-content:space-between">
						<span class="faint">{formatDate(oneRepMaxSeries[0].date)}</span>
						<span class="faint">{formatDate(oneRepMaxSeries[oneRepMaxSeries.length - 1].date)}</span>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>
