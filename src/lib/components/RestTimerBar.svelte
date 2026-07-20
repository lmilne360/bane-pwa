<script lang="ts">
	import { restTimer } from '$lib/stores/restTimer.svelte';

	function fmt(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

{#if restTimer.isRunning}
	<div class="rest-bar" role="status">
		<div class="progress" style:width={`${restTimer.progress * 100}%`}></div>
		<div class="rest-content">
			<div class="rest-info">
				<span class="rest-time">{fmt(restTimer.remaining)}</span>
				<span class="rest-label">
					{restTimer.remaining === 0 ? 'Rest complete' : `Rest${restTimer.exerciseName ? ` · ${restTimer.exerciseName}` : ''}`}
				</span>
			</div>
			<div class="rest-actions">
				<button class="btn btn-sm" onclick={() => restTimer.extend(30)}>+30s</button>
				<button class="btn btn-sm btn-accent" onclick={() => restTimer.stop()}>
					{restTimer.remaining === 0 ? 'Done' : 'Skip'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.rest-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
		z-index: 25;
		max-width: var(--maxw);
		margin: 0 auto;
		background: var(--surface-2);
		border-top: 1px solid var(--border);
		overflow: hidden;
	}
	.progress {
		position: absolute;
		inset: 0 auto 0 0;
		background: color-mix(in srgb, var(--accent) 26%, transparent);
		transition: width 0.25s linear;
	}
	.rest-content {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
	}
	.rest-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.rest-time {
		font-size: 20px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.rest-label {
		font-size: 12px;
		color: var(--text-dim);
	}
	.rest-actions {
		display: flex;
		gap: 8px;
	}
</style>
