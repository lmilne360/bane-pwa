<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { solve, remainder, isExact, isBelowBar, formatPlate } from '$lib/services/plates';
	import { warmupSets, schemeById } from '$lib/services/warmup';
	import { formatWeight, toPounds, UNIT_ABBREVIATION } from '$lib/services/weight';

	// MARK: Plate calculator

	let plateTargetInput = $state<number>(135);

	const plateTargetPounds = $derived(toPounds(plateTargetInput || 0, settings.weightUnit));
	const loadout = $derived(solve(plateTargetPounds, settings.plateBarWeight, settings.plateAvailablePlates));

	// MARK: Warm-up calculator

	let workingInput = $state<number>(185);

	const workingPounds = $derived(toPounds(workingInput || 0, settings.weightUnit));
	const scheme = $derived(schemeById(settings.warmupSchemeId));
	const ramp = $derived(
		warmupSets(workingPounds, scheme.steps, settings.warmupRounding, settings.plateBarWeight)
	);
</script>

<header class="page-header">
	<h1>Calculators</h1>
</header>

<div class="page stack">
	<div class="section-title">Plate Calculator</div>
	<div class="card stack">
		<div class="field">
			<label for="plate-target">Target weight ({UNIT_ABBREVIATION[settings.weightUnit]})</label>
			<input
				id="plate-target"
				type="number"
				inputmode="decimal"
				min="0"
				step="0.5"
				bind:value={plateTargetInput}
			/>
		</div>

		<div class="muted">Bar: {formatWeight(settings.plateBarWeight, settings.weightUnit)}</div>

		{#if isBelowBar(loadout)}
			<div class="muted">Target is below the bar.</div>
		{:else if loadout.perSide.length === 0}
			<div class="muted">Just the bar — no plates needed.</div>
		{:else}
			<div class="list">
				{#each loadout.perSide as p (p.plate)}
					<div class="row">
						<div class="row-main row-title">{p.count} × {formatPlate(p.plate)}</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="hstack" style="justify-content:space-between">
			<span>Achieved: <strong>{formatWeight(loadout.achieved, settings.weightUnit)}</strong></span>
			{#if !isExact(loadout) && !isBelowBar(loadout)}
				<span class="faint">{formatWeight(remainder(loadout), settings.weightUnit)} short</span>
			{/if}
		</div>
	</div>

	<div class="section-title">Warm-up Calculator</div>
	<div class="card stack">
		<div class="field">
			<label for="warmup-working">Working weight ({UNIT_ABBREVIATION[settings.weightUnit]})</label>
			<input
				id="warmup-working"
				type="number"
				inputmode="decimal"
				min="0"
				step="0.5"
				bind:value={workingInput}
			/>
		</div>

		<div class="muted">Ramp: {scheme.name}</div>

		{#if ramp.length === 0}
			<div class="muted">Enter a working weight above the bar to build a ramp.</div>
		{:else}
			<div class="list">
				{#each ramp as s, i (i)}
					<div class="row">
						<div class="row-main">
							<div class="row-title">
								{Math.round(s.percentage * 100)}% · {formatWeight(s.weight, settings.weightUnit)} × {s.reps}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
