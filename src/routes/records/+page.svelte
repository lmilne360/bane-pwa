<script lang="ts">
	import { exercisesStore, workoutsStore, exerciseMap } from '$lib/db/queries';
	import { allRecords } from '$lib/services/personalRecords';
	import { formatWeight } from '$lib/services/weight';
	import { formatDate } from '$lib/services/format';
	import { settings } from '$lib/stores/settings.svelte';
	import { PR_METRIC_LABELS, type Exercise } from '$lib/types';

	const map = $derived(exerciseMap($exercisesStore));
	const recs = $derived(allRecords($exercisesStore.map((e) => e.id), $workoutsStore));

	const exercisesWithRecords = $derived(
		[...recs.keys()]
			.map((id) => map.get(id))
			.filter((e): e is Exercise => !!e)
			.sort((a, b) => a.name.localeCompare(b.name))
	);
</script>

<header class="page-header">
	<h1>Records</h1>
</header>

<div class="page stack">
	{#if exercisesWithRecords.length === 0}
		<div class="empty">
			<div class="big">🏆</div>
			<div>No records yet.</div>
			<div class="faint">Finish a workout to start setting personal records.</div>
		</div>
	{:else}
		<div class="list">
			{#each exercisesWithRecords as ex (ex.id)}
				<div class="card stack">
					<div class="row-title">{ex.name}</div>
					{#each recs.get(ex.id) ?? [] as r (r.metric)}
						<div class="hstack">
							<div class="row-main">
								<div>{PR_METRIC_LABELS[r.metric]}</div>
								<div class="row-sub">
									{r.reps} × {formatWeight(r.weight, settings.weightUnit)} on {formatDate(r.achievedOn)}
								</div>
							</div>
							<div class="row-title">{formatWeight(r.value, settings.weightUnit)}</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
