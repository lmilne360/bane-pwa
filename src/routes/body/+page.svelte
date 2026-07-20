<script lang="ts">
	import { goto } from '$app/navigation';
	import { measurementsStore } from '$lib/db/queries';
	import { deleteMeasurement } from '$lib/db/repository';
	import { settings } from '$lib/stores/settings.svelte';
	import { formatWeight } from '$lib/services/weight';
	import { formatDate } from '$lib/services/format';
	import type { BodyMeasurement } from '$lib/types';

	const sorted = $derived(
		[...$measurementsStore].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);

	/** Trims a circumference/body-fat number to at most one decimal. */
	function trim(n: number): string {
		return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
	}

	function summary(m: BodyMeasurement): string {
		const parts: string[] = [];
		if (m.weight != null) parts.push(`Weight ${formatWeight(m.weight, settings.weightUnit)}`);
		if (m.bodyFatPercentage != null) parts.push(`Body Fat ${trim(m.bodyFatPercentage)}%`);
		if (m.neck != null) parts.push(`Neck ${trim(m.neck)}`);
		if (m.shoulders != null) parts.push(`Shoulders ${trim(m.shoulders)}`);
		if (m.chest != null) parts.push(`Chest ${trim(m.chest)}`);
		if (m.waist != null) parts.push(`Waist ${trim(m.waist)}`);
		if (m.hips != null) parts.push(`Hips ${trim(m.hips)}`);
		if (m.leftArm != null) parts.push(`Left Arm ${trim(m.leftArm)}`);
		if (m.rightArm != null) parts.push(`Right Arm ${trim(m.rightArm)}`);
		if (m.leftThigh != null) parts.push(`Left Thigh ${trim(m.leftThigh)}`);
		if (m.rightThigh != null) parts.push(`Right Thigh ${trim(m.rightThigh)}`);
		if (m.leftCalf != null) parts.push(`Left Calf ${trim(m.leftCalf)}`);
		if (m.rightCalf != null) parts.push(`Right Calf ${trim(m.rightCalf)}`);
		return parts.length ? parts.join(' · ') : 'No metrics recorded';
	}

	async function remove(id: string) {
		if (!confirm('Delete this measurement?')) return;
		await deleteMeasurement(id);
	}
</script>

<header class="page-header">
	<h1>Body</h1>
	<button class="btn btn-accent btn-sm" onclick={() => goto('/body/new')}>+ Add</button>
</header>

<div class="page stack">
	{#if sorted.length === 0}
		<div class="empty">
			<div class="big">📏</div>
			<div>No measurements yet.</div>
			<div class="faint">Log your bodyweight and circumferences to track progress over time.</div>
		</div>
	{:else}
		<div class="list">
			{#each sorted as m (m.id)}
				<div class="row">
					<div class="row-main">
						<div class="row-title">{formatDate(m.date)}</div>
						<div class="row-sub">{summary(m)}</div>
					</div>
					<button class="btn btn-sm btn-danger" onclick={() => remove(m.id)} aria-label="Delete measurement">✕</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
