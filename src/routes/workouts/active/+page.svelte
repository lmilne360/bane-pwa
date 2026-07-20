<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { exercisesStore, exerciseMap } from '$lib/db/queries';
	import {
		activeWorkout,
		newEmptyWorkout,
		newWorkoutExercise,
		newSet,
		saveWorkout,
		deleteWorkout
	} from '$lib/db/repository';
	import type { Workout, WorkoutExercise, Exercise } from '$lib/types';
	import { settings } from '$lib/stores/settings.svelte';
	import { restTimer } from '$lib/stores/restTimer.svelte';
	import { weightValue, toPounds, UNIT_ABBREVIATION } from '$lib/services/weight';
	import { CATEGORY_LABELS } from '$lib/types';

	let workout = $state<Workout | null>(null);
	let loading = $state(true);
	let showPicker = $state(false);
	let search = $state('');

	const map = $derived(exerciseMap($exercisesStore));
	const unit = $derived(settings.weightUnit);

	$effect(() => {
		let cancelled = false;
		(async () => {
			let w = await activeWorkout();
			if (!w && page.url.searchParams.get('new')) {
				w = newEmptyWorkout();
				await saveWorkout(w);
			}
			if (!cancelled) {
				workout = w ?? null;
				loading = false;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	async function persist() {
		if (workout) await saveWorkout(workout);
	}

	function orderedExercises(w: Workout): WorkoutExercise[] {
		return [...w.exercises].sort((a, b) => a.order - b.order);
	}

	function nameFor(we: WorkoutExercise): string {
		return (we.exerciseId ? map.get(we.exerciseId)?.name : null) ?? 'Deleted exercise';
	}

	function addExercise(ex: Exercise) {
		if (!workout) return;
		const we = newWorkoutExercise(workout.exercises.length, ex.id);
		we.sets.push(newSet(0));
		workout.exercises.push(we);
		showPicker = false;
		search = '';
		persist();
	}

	function removeExercise(we: WorkoutExercise) {
		if (!workout) return;
		workout.exercises = workout.exercises.filter((x) => x.id !== we.id);
		persist();
	}

	function addSet(we: WorkoutExercise) {
		const last = we.sets[we.sets.length - 1];
		we.sets.push(newSet(we.sets.length, last?.reps ?? 0, last?.weight ?? 0));
		persist();
	}

	function removeSet(we: WorkoutExercise, setId: string) {
		we.sets = we.sets.filter((s) => s.id !== setId);
		we.sets.forEach((s, i) => (s.order = i));
		persist();
	}

	function toggleComplete(we: WorkoutExercise, set: { completed: boolean }) {
		set.completed = !set.completed;
		if (set.completed) {
			const ex = we.exerciseId ? map.get(we.exerciseId) : undefined;
			const seconds = ex?.restDuration ?? settings.defaultRestSeconds;
			restTimer.start(seconds, ex?.name ?? null);
		}
		persist();
	}

	function setWeight(set: { weight: number }, displayValue: string) {
		const n = parseFloat(displayValue);
		set.weight = Number.isFinite(n) ? toPounds(n, unit) : 0;
		persist();
	}

	function setReps(set: { reps: number }, value: string) {
		const n = parseInt(value, 10);
		set.reps = Number.isFinite(n) ? Math.max(0, n) : 0;
		persist();
	}

	async function finish() {
		if (!workout) return;
		if (!workout.exercises.length && !confirm('Finish an empty workout?')) return;
		workout.finishedAt = new Date().toISOString();
		await persist();
		restTimer.stop();
		goto('/workouts');
	}

	async function discard() {
		if (!workout) return;
		if (!confirm('Discard this workout? This cannot be undone.')) return;
		await deleteWorkout(workout.id);
		restTimer.stop();
		goto('/workouts');
	}

	const filtered = $derived(
		[...$exercisesStore]
			.filter((e) => e.name.toLowerCase().includes(search.toLowerCase().trim()))
			.sort((a, b) => a.name.localeCompare(b.name))
	);
</script>

<header class="page-header">
	<button class="btn-ghost" onclick={() => goto('/workouts')}>‹ Back</button>
	<h1 style="font-size:20px">Active Workout</h1>
	<button class="btn-ghost" onclick={finish} style="color:var(--green)">Finish</button>
</header>

<div class="page stack">
	{#if loading}
		<div class="empty">Loading…</div>
	{:else if !workout}
		<div class="empty">
			<div class="big">🏋️</div>
			<div>No active workout.</div>
			<a class="btn btn-accent" href="/workouts">Back to Workouts</a>
		</div>
	{:else}
		{#each orderedExercises(workout) as we (we.id)}
			<div class="card exercise">
				<div class="hstack">
					<div class="row-main">
						<div class="row-title">{nameFor(we)}</div>
						{#if we.exerciseId && map.get(we.exerciseId)}
							<div class="row-sub">{CATEGORY_LABELS[map.get(we.exerciseId)!.category]}</div>
						{/if}
					</div>
					<button class="btn-ghost btn-danger" onclick={() => removeExercise(we)}>Remove</button>
				</div>

				<div class="sets">
					<div class="set-head">
						<span>Set</span>
						<span>Weight ({UNIT_ABBREVIATION[unit]})</span>
						<span>Reps</span>
						<span></span>
						<span></span>
					</div>
					{#each we.sets as set, i (set.id)}
						<div class="set-row" class:warmup={set.isWarmup} class:done={set.completed}>
							<button
								class="set-index"
								title={set.isWarmup ? 'Warm-up set' : 'Working set — tap to mark warm-up'}
								onclick={() => {
									set.isWarmup = !set.isWarmup;
									persist();
								}}
							>
								{set.isWarmup ? 'W' : i + 1}
							</button>
							<input
								type="number"
								inputmode="decimal"
								min="0"
								step="any"
								value={set.weight ? weightValue(set.weight, unit) : ''}
								placeholder="0"
								onchange={(e) => setWeight(set, e.currentTarget.value)}
							/>
							<input
								type="number"
								inputmode="numeric"
								min="0"
								value={set.reps || ''}
								placeholder="0"
								onchange={(e) => setReps(set, e.currentTarget.value)}
							/>
							<button
								class="check"
								class:checked={set.completed}
								aria-label="Complete set"
								onclick={() => toggleComplete(we, set)}>✓</button
							>
							<button class="set-del" aria-label="Delete set" onclick={() => removeSet(we, set.id)}>✕</button>
						</div>
					{/each}
				</div>

				<button class="btn btn-sm btn-block" onclick={() => addSet(we)}>+ Add Set</button>
			</div>
		{/each}

		<button class="btn btn-accent btn-block" onclick={() => (showPicker = true)}>+ Add Exercise</button>
		<button class="btn btn-danger btn-block" onclick={discard}>Discard Workout</button>
	{/if}
</div>

{#if showPicker}
	<div
		class="sheet-backdrop"
		onclick={() => (showPicker = false)}
		onkeydown={(e) => e.key === 'Escape' && (showPicker = false)}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="sheet"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="Add exercise"
			tabindex="-1"
		>
			<div class="sheet-header">
				<strong>Add Exercise</strong>
				<button class="btn-ghost" onclick={() => (showPicker = false)}>Close</button>
			</div>
			<input placeholder="Search exercises…" bind:value={search} />
			<div class="picker-list">
				{#each filtered as ex (ex.id)}
					<button class="row" onclick={() => addExercise(ex)}>
						<div class="row-main">
							<div class="row-title">{ex.name}</div>
							<div class="row-sub">{CATEGORY_LABELS[ex.category]}</div>
						</div>
						<span class="chevron">+</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.exercise {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.sets {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.set-head,
	.set-row {
		display: grid;
		grid-template-columns: 44px 1fr 1fr 44px 32px;
		gap: 8px;
		align-items: center;
	}
	.set-head {
		font-size: 11px;
		color: var(--text-faint);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0 2px;
	}
	.set-row input {
		text-align: center;
		padding: 8px 6px;
	}
	.set-row.warmup input {
		opacity: 0.7;
	}
	.set-index {
		height: 38px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--surface-2);
		font-weight: 700;
		color: var(--text-dim);
	}
	.set-row.warmup .set-index {
		color: var(--yellow);
		border-color: var(--yellow);
	}
	.check {
		height: 38px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--surface-2);
		color: var(--text-faint);
		font-weight: 800;
	}
	.check.checked {
		background: var(--green);
		border-color: var(--green);
		color: #06210f;
	}
	.set-del {
		border: none;
		background: none;
		color: var(--text-faint);
		font-size: 14px;
	}
	.set-row.done input {
		border-color: var(--green);
	}
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	.sheet {
		width: 100%;
		max-width: var(--maxw);
		max-height: 82dvh;
		background: var(--surface);
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
		border: 1px solid var(--border);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.picker-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
	}
</style>
