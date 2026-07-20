<script lang="ts">
	import { goto } from '$app/navigation';
	import { routinesStore, exercisesStore, exerciseMap } from '$lib/db/queries';
	import {
		saveRoutine,
		deleteRoutine,
		saveWorkout,
		activeWorkout,
		workoutFromRoutineProgressive
	} from '$lib/db/repository';
	import type { Routine } from '$lib/types';

	const map = $derived(exerciseMap($exercisesStore));
	const routines = $derived(
		[...$routinesStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
	);

	async function createRoutine() {
		const r: Routine = {
			id: crypto.randomUUID(),
			name: 'New Routine',
			createdAt: new Date().toISOString(),
			progressiveOverloadEnabled: false,
			items: []
		};
		await saveRoutine(r);
		goto(`/routines/${r.id}`);
	}

	async function start(r: Routine) {
		const existing = await activeWorkout();
		if (existing && !confirm('A workout is already in progress. Discard it and start this routine?')) {
			goto('/workouts/active');
			return;
		}
		if (existing) await (await import('$lib/db/repository')).deleteWorkout(existing.id);
		const w = await workoutFromRoutineProgressive(r);
		await saveWorkout(w);
		goto('/workouts/active');
	}

	async function remove(r: Routine) {
		if (!confirm(`Delete routine "${r.name}"?`)) return;
		await deleteRoutine(r.id);
	}

	function summary(r: Routine): string {
		const names = [...r.items]
			.sort((a, b) => a.order - b.order)
			.map((it) => (it.exerciseId ? map.get(it.exerciseId)?.name : null))
			.filter((n): n is string => !!n);
		return names.length ? names.join(' · ') : 'No exercises yet';
	}
</script>

<header class="page-header">
	<h1>Routines</h1>
	<button class="btn btn-accent btn-sm" onclick={createRoutine}>+ New</button>
</header>

<div class="page stack">
	<a href="/programs" class="row">
		<div class="row-main">
			<div class="row-title">📚 Browse Programs</div>
			<div class="row-sub">Create routines from ready-made training plans</div>
		</div>
		<span class="chevron">›</span>
	</a>

	{#if routines.length === 0}
		<div class="empty">
			<div class="big">🗒️</div>
			<div>No routines yet.</div>
			<div class="faint">Create one or start from a program.</div>
		</div>
	{:else}
		<div class="list">
			{#each routines as r (r.id)}
				<div class="card stack">
					<div class="hstack">
						<div class="row-main">
							<div class="row-title">
								{r.name}
								{#if r.progressiveOverloadEnabled}<span class="badge" style="margin-left:8px">Progressive</span>{/if}
							</div>
							<div class="row-sub">{summary(r)}</div>
						</div>
					</div>
					<div class="hstack">
						<button class="btn btn-accent btn-sm" onclick={() => start(r)}>Start</button>
						<a class="btn btn-sm" href={`/routines/${r.id}`}>Edit</a>
						<span class="spacer"></span>
						<button class="btn btn-sm btn-danger" onclick={() => remove(r)}>Delete</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
