<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { exercisesStore, workoutsStore } from '$lib/db/queries';
	import { saveExercise, deleteExercise } from '$lib/db/repository';
	import { settings } from '$lib/stores/settings.svelte';
	import { recordsFor } from '$lib/services/personalRecords';
	import { formatWeight } from '$lib/services/weight';
	import { formatDate } from '$lib/services/format';
	import { CATEGORY_LABELS, EQUIPMENT_LABELS, MUSCLE_LABELS, PR_METRIC_LABELS } from '$lib/types';

	const id = $derived(page.params.id);
	const exercise = $derived($exercisesStore.find((e) => e.id === id));
	const records = $derived(exercise ? recordsFor(exercise.id, $workoutsStore) : []);

	// Editable per-exercise rest override (seconds).
	let restInput = $state('');
	$effect(() => {
		restInput = exercise?.restDuration != null ? String(exercise.restDuration) : '';
	});

	async function saveRest() {
		if (!exercise) return;
		const n = parseInt(restInput, 10);
		await saveExercise({ ...exercise, restDuration: Number.isFinite(n) && n > 0 ? n : null });
	}

	async function remove() {
		if (!exercise) return;
		if (!confirm(`Delete "${exercise.name}"? Workout history is kept but will show it as deleted.`)) return;
		await deleteExercise(exercise.id);
		goto('/exercises');
	}
</script>

<header class="page-header">
	<button class="btn-ghost" onclick={() => goto('/exercises')}>‹ Exercises</button>
	<h1 style="font-size:20px">Detail</h1>
	<span style="width:60px"></span>
</header>

<div class="page stack">
	{#if !exercise}
		<div class="empty">Exercise not found.</div>
	{:else}
		<div class="card stack">
			<h2>{exercise.name}</h2>
			<div class="muted">
				{CATEGORY_LABELS[exercise.category]} · {MUSCLE_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
			</div>
		</div>

		<div class="section-title">Personal Records</div>
		{#if records.length === 0}
			<div class="card muted">No records yet — log some working sets with this exercise.</div>
		{:else}
			<div class="list">
				{#each records as r (r.metric)}
					<div class="row">
						<div class="row-main">
							<div class="row-title">{PR_METRIC_LABELS[r.metric]}</div>
							<div class="row-sub">{r.reps} reps × {formatWeight(r.weight, settings.weightUnit)} · {formatDate(r.achievedOn)}</div>
						</div>
						<strong>
							{r.metric === 'bestSetVolume'
								? formatWeight(r.value, settings.weightUnit)
								: formatWeight(r.value, settings.weightUnit)}
						</strong>
					</div>
				{/each}
			</div>
		{/if}

		<div class="section-title">Rest Timer</div>
		<div class="card stack">
			<div class="field">
				<label for="rest">Override rest (seconds) — blank uses app default ({settings.defaultRestSeconds}s)</label>
				<input id="rest" type="number" inputmode="numeric" min="0" bind:value={restInput} onchange={saveRest} placeholder={String(settings.defaultRestSeconds)} />
			</div>
		</div>

		{#if exercise.isCustom}
			<button class="btn btn-danger btn-block" onclick={remove}>Delete Exercise</button>
		{/if}
	{/if}
</div>
