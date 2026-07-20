<script lang="ts">
	import { goto } from '$app/navigation';
	import { saveMeasurement } from '$lib/db/repository';
	import { settings } from '$lib/stores/settings.svelte';
	import { toPounds, UNIT_ABBREVIATION } from '$lib/services/weight';
	import { toDateInput } from '$lib/services/format';
	import type { BodyMeasurement } from '$lib/types';

	type NumericField =
		| 'weight'
		| 'bodyFatPercentage'
		| 'neck'
		| 'shoulders'
		| 'chest'
		| 'waist'
		| 'hips'
		| 'leftArm'
		| 'rightArm'
		| 'leftThigh'
		| 'rightThigh'
		| 'leftCalf'
		| 'rightCalf';

	const CIRCUMFERENCE_FIELDS: { key: NumericField; label: string }[] = [
		{ key: 'neck', label: 'Neck' },
		{ key: 'shoulders', label: 'Shoulders' },
		{ key: 'chest', label: 'Chest' },
		{ key: 'waist', label: 'Waist' },
		{ key: 'hips', label: 'Hips' },
		{ key: 'leftArm', label: 'Left Arm' },
		{ key: 'rightArm', label: 'Right Arm' },
		{ key: 'leftThigh', label: 'Left Thigh' },
		{ key: 'rightThigh', label: 'Right Thigh' },
		{ key: 'leftCalf', label: 'Left Calf' },
		{ key: 'rightCalf', label: 'Right Calf' }
	];

	let dateInput = $state(toDateInput(new Date().toISOString()));
	let form = $state<Record<NumericField, string>>({
		weight: '',
		bodyFatPercentage: '',
		neck: '',
		shoulders: '',
		chest: '',
		waist: '',
		hips: '',
		leftArm: '',
		rightArm: '',
		leftThigh: '',
		rightThigh: '',
		leftCalf: '',
		rightCalf: ''
	});
	let notes = $state('');

	/** Parses a free-text field into a number, treating blank/garbage as `null`. */
	function parseNum(raw: string): number | null {
		const t = raw.trim();
		if (!t) return null;
		const n = parseFloat(t);
		return Number.isFinite(n) ? n : null;
	}

	async function save() {
		const weight = parseNum(form.weight);
		const measurement: BodyMeasurement = {
			id: crypto.randomUUID(),
			date: new Date(dateInput).toISOString(),
			weight: weight != null ? toPounds(weight, settings.weightUnit) : null,
			bodyFatPercentage: parseNum(form.bodyFatPercentage),
			neck: parseNum(form.neck),
			shoulders: parseNum(form.shoulders),
			chest: parseNum(form.chest),
			waist: parseNum(form.waist),
			hips: parseNum(form.hips),
			leftArm: parseNum(form.leftArm),
			rightArm: parseNum(form.rightArm),
			leftThigh: parseNum(form.leftThigh),
			rightThigh: parseNum(form.rightThigh),
			leftCalf: parseNum(form.leftCalf),
			rightCalf: parseNum(form.rightCalf),
			notes: notes.trim()
		};

		const hasAnyValue = (
			[
				measurement.weight,
				measurement.bodyFatPercentage,
				measurement.neck,
				measurement.shoulders,
				measurement.chest,
				measurement.waist,
				measurement.hips,
				measurement.leftArm,
				measurement.rightArm,
				measurement.leftThigh,
				measurement.rightThigh,
				measurement.leftCalf,
				measurement.rightCalf
			] as (number | null)[]
		).some((v) => v != null);

		if (!hasAnyValue) {
			alert('Enter at least one measurement before saving.');
			return;
		}

		await saveMeasurement(measurement);
		goto('/body');
	}
</script>

<header class="page-header">
	<button class="btn-ghost" onclick={() => goto('/body')}>‹ Body</button>
	<h1 style="font-size:20px">New Measurement</h1>
	<button class="btn-ghost" onclick={save} style="color:var(--green)">Save</button>
</header>

<div class="page stack">
	<div class="card stack">
		<div class="field">
			<label for="m-date">Date</label>
			<input id="m-date" type="date" bind:value={dateInput} />
		</div>
	</div>

	<div class="card stack">
		<div class="section-title" style="margin:0 0 4px">Body</div>
		<div class="field">
			<label for="m-weight">Weight ({UNIT_ABBREVIATION[settings.weightUnit]})</label>
			<input
				id="m-weight"
				type="number"
				inputmode="decimal"
				step="any"
				min="0"
				placeholder="—"
				bind:value={form.weight}
			/>
		</div>
		<div class="field">
			<label for="m-bodyfat">Body Fat %</label>
			<input
				id="m-bodyfat"
				type="number"
				inputmode="decimal"
				step="any"
				min="0"
				placeholder="—"
				bind:value={form.bodyFatPercentage}
			/>
		</div>
	</div>

	<div class="card stack">
		<div class="section-title" style="margin:0 0 4px">Circumferences</div>
		{#each CIRCUMFERENCE_FIELDS as f (f.key)}
			<div class="field">
				<label for={`m-${f.key}`}>{f.label}</label>
				<input
					id={`m-${f.key}`}
					type="number"
					inputmode="decimal"
					step="any"
					min="0"
					placeholder="—"
					bind:value={form[f.key]}
				/>
			</div>
		{/each}
	</div>

	<div class="card stack">
		<div class="field">
			<label for="m-notes">Notes</label>
			<textarea id="m-notes" rows="3" placeholder="Optional notes" bind:value={notes}></textarea>
		</div>
	</div>
</div>
