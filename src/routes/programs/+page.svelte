<script lang="ts">
	import { goto } from '$app/navigation';
	import { exercisesStore } from '$lib/db/queries';
	import { saveRoutine } from '$lib/db/repository';
	import { PROGRAMS, instantiateProgram, routineCount, type Program } from '$lib/data/programs';

	async function add(program: Program) {
		const count = routineCount(program);
		if (!confirm(`Add "${program.name}" to your routines? This creates ${count} routine${count === 1 ? '' : 's'}.`)) {
			return;
		}
		const created = instantiateProgram(program, $exercisesStore);
		for (const r of created) await saveRoutine(r);
		goto('/routines');
	}
</script>

<header class="page-header">
	<h1>Programs</h1>
	<a class="btn btn-ghost" href="/routines">‹ Routines</a>
</header>

<div class="page stack">
	<div class="list">
		{#each PROGRAMS as p (p.id)}
			<div class="card stack">
				<div>
					<div class="row-title">{p.name}</div>
					<div class="row-sub">{p.tagline}</div>
				</div>
				<div class="muted" style="white-space: pre-line">{p.overview}</div>
				<div class="hstack">
					<span class="faint">{routineCount(p)} routine{routineCount(p) === 1 ? '' : 's'}</span>
					<span class="spacer"></span>
					<button class="btn btn-accent btn-sm" onclick={() => add(p)}>Add to Routines</button>
				</div>
			</div>
		{/each}
	</div>
</div>
