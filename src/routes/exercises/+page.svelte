<script lang="ts">
	import { exercisesStore } from '$lib/db/queries';
	import { saveExercise } from '$lib/db/repository';
	import {
		CATEGORY_LABELS,
		EQUIPMENT_LABELS,
		MUSCLE_LABELS,
		EXERCISE_CATEGORIES,
		EQUIPMENT,
		MUSCLES,
		type Exercise,
		type ExerciseCategory
	} from '$lib/types';

	let search = $state('');
	let category = $state<ExerciseCategory | 'all'>('all');
	let showAdd = $state(false);

	// New-exercise form state
	let form = $state({
		name: '',
		category: 'chest' as Exercise['category'],
		primaryMuscle: 'chest' as Exercise['primaryMuscle'],
		equipment: 'barbell' as Exercise['equipment']
	});

	const filtered = $derived(
		[...$exercisesStore]
			.filter((e) => category === 'all' || e.category === category)
			.filter((e) => e.name.toLowerCase().includes(search.toLowerCase().trim()))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	async function add() {
		if (!form.name.trim()) return;
		await saveExercise({
			id: crypto.randomUUID(),
			name: form.name.trim(),
			category: form.category,
			primaryMuscle: form.primaryMuscle,
			equipment: form.equipment,
			isCustom: true,
			restDuration: null
		});
		form.name = '';
		showAdd = false;
	}
</script>

<header class="page-header">
	<h1>Exercises</h1>
	<button class="btn btn-accent btn-sm" onclick={() => (showAdd = !showAdd)}>+ New</button>
</header>

<div class="page stack">
	{#if showAdd}
		<div class="card stack">
			<div class="field">
				<label for="ex-name">Name</label>
				<input id="ex-name" bind:value={form.name} placeholder="e.g. Incline Cable Fly" />
			</div>
			<div class="field">
				<label for="ex-cat">Category</label>
				<select id="ex-cat" bind:value={form.category}>
					{#each EXERCISE_CATEGORIES as c (c)}<option value={c}>{CATEGORY_LABELS[c]}</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="ex-mus">Primary muscle</label>
				<select id="ex-mus" bind:value={form.primaryMuscle}>
					{#each MUSCLES as m (m)}<option value={m}>{MUSCLE_LABELS[m]}</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="ex-eq">Equipment</label>
				<select id="ex-eq" bind:value={form.equipment}>
					{#each EQUIPMENT as eq (eq)}<option value={eq}>{EQUIPMENT_LABELS[eq]}</option>{/each}
				</select>
			</div>
			<button class="btn btn-accent btn-block" onclick={add}>Add Exercise</button>
		</div>
	{/if}

	<input placeholder="Search…" bind:value={search} />

	<div class="pills">
		<button class="pill" aria-pressed={category === 'all'} onclick={() => (category = 'all')}>All</button>
		{#each EXERCISE_CATEGORIES as c (c)}
			<button class="pill" aria-pressed={category === c} onclick={() => (category = c)}>{CATEGORY_LABELS[c]}</button>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="empty"><div class="big">📋</div><div>No exercises match.</div></div>
	{:else}
		<div class="list">
			{#each filtered as ex (ex.id)}
				<a href={`/exercises/${ex.id}`} class="row">
					<div class="row-main">
						<div class="row-title">{ex.name}{#if ex.isCustom}<span class="badge" style="margin-left:8px">Custom</span>{/if}</div>
						<div class="row-sub">{CATEGORY_LABELS[ex.category]} · {MUSCLE_LABELS[ex.primaryMuscle]} · {EQUIPMENT_LABELS[ex.equipment]}</div>
					</div>
					<span class="chevron">›</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
