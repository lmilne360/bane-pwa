<script lang="ts">
	import { goto } from '$app/navigation';
	import { workoutsStore, exercisesStore, exerciseMap } from '$lib/db/queries';
	import { newEmptyWorkout, saveWorkout, activeWorkout } from '$lib/db/repository';
	import { settings } from '$lib/stores/settings.svelte';
	import { formatDate, workoutDuration, totalSets, totalVolume, orderedExercises } from '$lib/services/format';
	import { formatVolume } from '$lib/services/weight';

	const map = $derived(exerciseMap($exercisesStore));
	const finished = $derived(
		[...$workoutsStore]
			.filter((w) => w.finishedAt)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);
	const active = $derived($workoutsStore.find((w) => !w.finishedAt));

	async function startEmpty() {
		const existing = await activeWorkout();
		if (existing) {
			goto('/workouts/active');
			return;
		}
		const w = newEmptyWorkout();
		await saveWorkout(w);
		goto('/workouts/active');
	}

	function exerciseNames(w: typeof finished[number]): string {
		const names = orderedExercises(w)
			.map((we) => (we.exerciseId ? map.get(we.exerciseId)?.name : null))
			.filter((n): n is string => !!n);
		return names.length ? names.join(' · ') : 'No exercises';
	}
</script>

<header class="page-header">
	<h1>Workouts</h1>
	<button class="btn btn-accent btn-sm" onclick={startEmpty}>+ Start</button>
</header>

<div class="page stack">
	{#if active}
		<a href="/workouts/active" class="card active-banner">
			<div>
				<div class="row-title">Workout in progress</div>
				<div class="row-sub">Tap to resume · {orderedExercises(active).length} exercises</div>
			</div>
			<span class="badge badge-live">LIVE</span>
		</a>
	{/if}

	<div class="hstack">
		<button class="btn btn-block" onclick={startEmpty}>Empty Workout</button>
		<a href="/routines" class="btn btn-block">From Routine</a>
	</div>

	{#if finished.length === 0}
		<div class="empty">
			<div class="big">🏋️</div>
			<div>No workouts yet.</div>
			<div class="faint">Start an empty session or pick a routine.</div>
		</div>
	{:else}
		<div class="section-title">History</div>
		<div class="list">
			{#each finished as w (w.id)}
				<a href={`/workouts/${w.id}`} class="row">
					<div class="row-main">
						<div class="row-title">{formatDate(w.date)}</div>
						<div class="row-sub">{exerciseNames(w)}</div>
						<div class="row-sub faint">
							{totalSets(w)} sets · {formatVolume(totalVolume(w), settings.weightUnit)}
							{#if workoutDuration(w)}· {workoutDuration(w)}{/if}
						</div>
					</div>
					<span class="chevron">›</span>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.active-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-color: var(--accent-dim);
	}
</style>
