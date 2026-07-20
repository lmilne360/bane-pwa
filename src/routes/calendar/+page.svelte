<script lang="ts">
	import { workoutsStore } from '$lib/db/queries';
	import { streaks, trainingDays } from '$lib/services/streaks';

	const streakStats = $derived(streaks($workoutsStore));
	const days = $derived(trainingDays($workoutsStore));

	const now = new Date();
	let currentMonth = $state({ year: now.getFullYear(), month: now.getMonth() });

	const monthLabel = $derived(
		new Date(currentMonth.year, currentMonth.month, 1).toLocaleDateString(undefined, {
			month: 'long',
			year: 'numeric'
		})
	);

	const isCurrentMonth = $derived(
		currentMonth.year === now.getFullYear() && currentMonth.month === now.getMonth()
	);

	const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	interface Cell {
		day: number;
		ms: number;
	}

	// Leading `null`s pad to the first weekday, then one cell per day of the month.
	const cells = $derived.by((): (Cell | null)[] => {
		const { year, month } = currentMonth;
		const firstWeekday = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const result: (Cell | null)[] = Array.from({ length: firstWeekday }, () => null);
		for (let day = 1; day <= daysInMonth; day++) {
			result.push({ day, ms: new Date(year, month, day).getTime() });
		}
		return result;
	});

	function isToday(ms: number): boolean {
		const d = new Date(ms);
		return (
			d.getFullYear() === now.getFullYear() &&
			d.getMonth() === now.getMonth() &&
			d.getDate() === now.getDate()
		);
	}

	function shiftMonth(delta: number) {
		let { year, month } = currentMonth;
		month += delta;
		if (month < 0) {
			month = 11;
			year -= 1;
		} else if (month > 11) {
			month = 0;
			year += 1;
		}
		currentMonth = { year, month };
	}
</script>

<header class="page-header">
	<h1>Calendar</h1>
</header>

<div class="page stack">
	<div class="hstack">
		<div class="card" style="flex:1;text-align:center">
			<div style="font-size:28px;font-weight:700">{streakStats.current}</div>
			<div class="row-sub">{streakStats.current === 1 ? 'day' : 'days'}</div>
			<div class="section-title" style="margin:4px 0 0">Current Streak</div>
		</div>
		<div class="card" style="flex:1;text-align:center">
			<div style="font-size:28px;font-weight:700">{streakStats.best}</div>
			<div class="row-sub">{streakStats.best === 1 ? 'day' : 'days'}</div>
			<div class="section-title" style="margin:4px 0 0">Best Streak</div>
		</div>
	</div>

	<div class="card stack">
		<div class="hstack" style="justify-content:space-between">
			<button class="btn-ghost" onclick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
			<strong>{monthLabel}</strong>
			<button
				class="btn-ghost"
				onclick={() => shiftMonth(1)}
				aria-label="Next month"
				disabled={isCurrentMonth}
			>
				›
			</button>
		</div>

		<div class="cal-grid cal-head">
			{#each WEEKDAY_LABELS as w (w)}<div>{w}</div>{/each}
		</div>
		<div class="cal-grid">
			{#each cells as cell, i (i)}
				{#if cell}
					<div class="cal-day" class:trained={days.has(cell.ms)} class:today={isToday(cell.ms)}>
						{cell.day}
					</div>
				{:else}
					<div class="cal-day cal-blank"></div>
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}
	.cal-head {
		font-size: 11px;
		color: var(--text-faint);
		text-transform: uppercase;
		text-align: center;
	}
	.cal-day {
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		font-size: 14px;
	}
	.cal-day.trained {
		background: var(--accent);
		color: #fff;
		font-weight: 700;
	}
	.cal-day.today {
		box-shadow: inset 0 0 0 1.5px var(--blue);
	}
</style>
