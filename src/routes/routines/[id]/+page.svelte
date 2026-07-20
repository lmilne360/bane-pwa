<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { routinesStore, exercisesStore, exerciseMap } from '$lib/db/queries';
	import { saveRoutine } from '$lib/db/repository';
	import type { Routine, RoutineItem, RoutineSet, Exercise } from '$lib/types';
	import { settings } from '$lib/stores/settings.svelte';
	import { weightValue, toPounds, UNIT_ABBREVIATION } from '$lib/services/weight';
	import { DEFAULT_MIN_REPS, DEFAULT_MAX_REPS, DEFAULT_INCREMENT_POUNDS } from '$lib/services/progressiveOverload';
	import { CATEGORY_LABELS } from '$lib/types';

	const id = $derived(page.params.id);
	const map = $derived(exerciseMap($exercisesStore));
	const unit = $derived(settings.weightUnit);

	let routine = $state<Routine | null>(null);
	let showPicker = $state(false);
	let search = $state('');

	// Load once from the store when it first resolves for this id.
	let loadedId = $state<string | undefined>(undefined);
	$effect(() => {
		if (loadedId === id) return;
		const found = $routinesStore.find((r) => r.id === id);
		if (found) {
			routine = structuredClone($state.snapshot(found)) as Routine;
			loadedId = id;
		}
	});

	async function persist() {
		if (routine) await saveRoutine(routine);
	}

	function ordered(r: Routine): RoutineItem[] {
		return [...r.items].sort((a, b) => a.order - b.order);
	}

	function nameFor(item: RoutineItem): string {
		return (item.exerciseId ? map.get(item.exerciseId)?.name : null) ?? 'Deleted exercise';
	}

	function addExercise(ex: Exercise) {
		if (!routine) return;
		routine.items.push({
			id: crypto.randomUUID(),
			order: routine.items.length,
			exerciseId: ex.id,
			repRangeMin: null,
			repRangeMax: null,
			weightIncrement: null,
			sets: [{ id: crypto.randomUUID(), order: 0, targetReps: 8, targetWeight: 0 }]
		});
		showPicker = false;
		search = '';
		persist();
	}

	function removeItem(item: RoutineItem) {
		if (!routine) return;
		routine.items = routine.items.filter((x) => x.id !== item.id);
		ordered(routine).forEach((it, i) => (it.order = i));
		persist();
	}

	function moveItem(item: RoutineItem, direction: -1 | 1) {
		if (!routine) return;
		const items = ordered(routine);
		const index = items.findIndex((x) => x.id === item.id);
		const target = index + direction;
		if (index === -1 || target < 0 || target >= items.length) return;
		const a = items[index];
		const b = items[target];
		[a.order, b.order] = [b.order, a.order];
		persist();
	}

	function moveSet(item: RoutineItem, set: RoutineSet, direction: -1 | 1) {
		const index = item.sets.findIndex((s) => s.id === set.id);
		const target = index + direction;
		if (index === -1 || target < 0 || target >= item.sets.length) return;
		const [moved] = item.sets.splice(index, 1);
		item.sets.splice(target, 0, moved);
		item.sets.forEach((s, i) => (s.order = i));
		persist();
	}

	function addSet(item: RoutineItem) {
		const last = item.sets[item.sets.length - 1];
		item.sets.push({
			id: crypto.randomUUID(),
			order: item.sets.length,
			targetReps: last?.targetReps ?? 8,
			targetWeight: last?.targetWeight ?? 0
		});
		persist();
	}

	function removeSet(item: RoutineItem, setId: string) {
		item.sets = item.sets.filter((s) => s.id !== setId);
		item.sets.forEach((s, i) => (s.order = i));
		persist();
	}

	function setTargetWeight(set: { targetWeight: number }, value: string) {
		const n = parseFloat(value);
		set.targetWeight = Number.isFinite(n) ? toPounds(n, unit) : 0;
		persist();
	}

	function setTargetReps(set: { targetReps: number }, value: string) {
		const n = parseInt(value, 10);
		set.targetReps = Number.isFinite(n) ? Math.max(0, n) : 0;
		persist();
	}

	const filtered = $derived(
		[...$exercisesStore]
			.filter((e) => e.name.toLowerCase().includes(search.toLowerCase().trim()))
			.sort((a, b) => a.name.localeCompare(b.name))
	);
</script>

<header class="page-header">
	<button class="btn-ghost" onclick={() => goto('/routines')}>‹ Routines</button>
	<h1 style="font-size:20px">Edit Routine</h1>
	<button class="btn-ghost" onclick={() => goto('/routines')} style="color:var(--green)">Done</button>
</header>

<div class="page stack">
	{#if !routine}
		<div class="empty">Routine not found.</div>
	{:else}
		<div class="card stack">
			<div class="field">
				<label for="rname">Name</label>
				<input id="rname" bind:value={routine.name} onchange={persist} />
			</div>
			<label class="hstack" style="justify-content:space-between">
				<span>Progressive overload</span>
				<input
					type="checkbox"
					style="width:auto"
					bind:checked={routine.progressiveOverloadEnabled}
					onchange={persist}
				/>
			</label>
			<div class="faint" style="font-size:12px">
				When on, starting this routine auto-computes each exercise's next targets via double
				progression from your last session.
			</div>
		</div>

		{#each ordered(routine) as item, itemIndex (item.id)}
			<div class="card stack">
				<div class="hstack">
					<div class="move-btns">
						<button class="move-btn" disabled={itemIndex === 0} aria-label="Move exercise up"
							onclick={() => moveItem(item, -1)}>▲</button>
						<button class="move-btn" disabled={itemIndex === routine.items.length - 1} aria-label="Move exercise down"
							onclick={() => moveItem(item, 1)}>▼</button>
					</div>
					<div class="row-main">
						<div class="row-title">{nameFor(item)}</div>
						{#if item.exerciseId && map.get(item.exerciseId)}
							<div class="row-sub">{CATEGORY_LABELS[map.get(item.exerciseId)!.category]}</div>
						{/if}
					</div>
					<button class="btn-ghost btn-danger" onclick={() => removeItem(item)}>Remove</button>
				</div>

				<div class="set-head"><span>Set</span><span>Weight ({UNIT_ABBREVIATION[unit]})</span><span>Reps</span><span></span><span></span></div>
				{#each item.sets as set, i (set.id)}
					<div class="set-row">
						<span class="set-index">{i + 1}</span>
						<input type="number" inputmode="decimal" min="0" step="any" placeholder="0"
							value={set.targetWeight ? weightValue(set.targetWeight, unit) : ''}
							onchange={(e) => setTargetWeight(set, e.currentTarget.value)} />
						<input type="number" inputmode="numeric" min="0" placeholder="0"
							value={set.targetReps || ''}
							onchange={(e) => setTargetReps(set, e.currentTarget.value)} />
						<div class="move-btns">
							<button class="move-btn" disabled={i === 0} aria-label="Move set up"
								onclick={() => moveSet(item, set, -1)}>▲</button>
							<button class="move-btn" disabled={i === item.sets.length - 1} aria-label="Move set down"
								onclick={() => moveSet(item, set, 1)}>▼</button>
						</div>
						<button class="set-del" aria-label="Delete set" onclick={() => removeSet(item, set.id)}>✕</button>
					</div>
				{/each}
				<button class="btn btn-sm btn-block" onclick={() => addSet(item)}>+ Add Set</button>

				{#if routine.progressiveOverloadEnabled}
					<div class="po-grid">
						<div class="field">
							<label for={`min-${item.id}`}>Min reps</label>
							<input id={`min-${item.id}`} type="number" inputmode="numeric" placeholder={String(DEFAULT_MIN_REPS)}
								bind:value={item.repRangeMin} onchange={persist} />
						</div>
						<div class="field">
							<label for={`max-${item.id}`}>Max reps</label>
							<input id={`max-${item.id}`} type="number" inputmode="numeric" placeholder={String(DEFAULT_MAX_REPS)}
								bind:value={item.repRangeMax} onchange={persist} />
						</div>
						<div class="field">
							<label for={`inc-${item.id}`}>+lb / clear</label>
							<input id={`inc-${item.id}`} type="number" inputmode="decimal" step="any" placeholder={String(DEFAULT_INCREMENT_POUNDS)}
								bind:value={item.weightIncrement} onchange={persist} />
						</div>
					</div>
				{/if}
			</div>
		{/each}

		<button class="btn btn-accent btn-block" onclick={() => (showPicker = true)}>+ Add Exercise</button>
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
			<div class="sheet-header"><strong>Add Exercise</strong><button class="btn-ghost" onclick={() => (showPicker = false)}>Close</button></div>
			<input placeholder="Search exercises…" bind:value={search} />
			<div class="picker-list">
				{#each filtered as ex (ex.id)}
					<button class="row" onclick={() => addExercise(ex)}>
						<div class="row-main"><div class="row-title">{ex.name}</div><div class="row-sub">{CATEGORY_LABELS[ex.category]}</div></div>
						<span class="chevron">+</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.set-head,
	.set-row {
		display: grid;
		grid-template-columns: 40px 1fr 1fr 28px 32px;
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
	.set-index {
		text-align: center;
		font-weight: 700;
		color: var(--text-dim);
	}
	.set-del {
		border: none;
		background: none;
		color: var(--text-faint);
	}
	.po-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
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
		border-radius: 20px 20px 0 0;
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
