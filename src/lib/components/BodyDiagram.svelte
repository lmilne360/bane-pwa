<script lang="ts">
	import { MUSCLE_LABELS, type Muscle } from '$lib/types';
	import { heatColor, type BodyRegion } from '$lib/services/muscleHeatMap';

	let {
		regions,
		intensity,
		label
	}: {
		regions: BodyRegion[];
		/** Normalized training intensity for a muscle, 0 (untrained)...1 (top). */
		intensity: (muscle: Muscle) => number;
		label: string;
	} = $props();

	// Unit coordinate space scaled onto a fixed viewBox; aspect ratio 1:2
	// mirrors Bane's `BodyDiagram` (`aspectRatio(0.5, contentMode: .fit)`).
	const VW = 100;
	const VH = 200;
</script>

<figure class="body-diagram">
	<svg viewBox="0 0 {VW} {VH}" role="img" aria-label="{label} muscle heat map">
		<g class="silhouette">
			<circle cx={0.5 * VW} cy={0.07 * VH} r={0.08 * VW} />
			<rect x={(0.5 - 0.22) * VW} y={(0.36 - 0.2) * VH} width={0.44 * VW} height={0.4 * VH} rx={0.1 * VW} />
			<rect x={(0.2 - 0.06) * VW} y={(0.36 - 0.17) * VH} width={0.12 * VW} height={0.34 * VH} rx={0.06 * VW} />
			<rect x={(0.8 - 0.06) * VW} y={(0.36 - 0.17) * VH} width={0.12 * VW} height={0.34 * VH} rx={0.06 * VW} />
			<rect x={(0.4 - 0.075) * VW} y={(0.74 - 0.22) * VH} width={0.15 * VW} height={0.44 * VH} rx={0.075 * VW} />
			<rect x={(0.6 - 0.075) * VW} y={(0.74 - 0.22) * VH} width={0.15 * VW} height={0.44 * VH} rx={0.075 * VW} />
		</g>
		{#each regions as region, i (i)}
			{@const w = region.w * VW}
			{@const h = region.h * VH}
			<rect
				x={region.x * VW}
				y={region.y * VH}
				width={w}
				height={h}
				rx={Math.min(w, h) / 2}
				fill={heatColor(intensity(region.muscle))}
			>
				<title>{MUSCLE_LABELS[region.muscle]}</title>
			</rect>
		{/each}
	</svg>
	<figcaption>{label}</figcaption>
</figure>

<style>
	.body-diagram {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
	.body-diagram svg {
		width: 100%;
		max-width: 220px;
		height: auto;
	}
	.silhouette {
		fill: var(--surface-2);
		opacity: 0.6;
	}
	.body-diagram figcaption {
		font-size: 13px;
		color: var(--text-dim);
		font-weight: 600;
	}
</style>
