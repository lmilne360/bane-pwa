import type { Workout } from '$lib/types';

/**
 * Training-day and streak aggregation, ported from Bane's `WorkoutStreaks`.
 * Pure over already-fetched workouts.
 *
 * A "training day" is any calendar day with at least one *finished* workout;
 * in-progress sessions don't count. Multiple sessions on a day collapse to one.
 */

export interface Streaks {
	/** Consecutive days ending on the most recent training day, kept "live" only
	 *  while that day is today or yesterday; otherwise 0. */
	current: number;
	/** Longest run of consecutive training days ever recorded. */
	best: number;
}

/** Local start-of-day epoch (ms) for an ISO date string. */
function startOfDay(iso: string): number {
	const d = new Date(iso);
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DAY_MS = 86_400_000;

/** Distinct start-of-day timestamps with at least one finished workout. */
export function trainingDays(workouts: Workout[]): Set<number> {
	const days = new Set<number>();
	for (const w of workouts) {
		if (w.finishedAt) days.add(startOfDay(w.date));
	}
	return days;
}

export function streaks(workouts: Workout[], today: Date = new Date()): Streaks {
	const days = trainingDays(workouts);
	if (days.size === 0) return { current: 0, best: 0 };

	const sorted = [...days].sort((a, b) => a - b);

	// Longest run of consecutive days anywhere in history.
	let best = 1;
	let run = 1;
	for (let i = 1; i < sorted.length; i++) {
		run = Math.round((sorted[i] - sorted[i - 1]) / DAY_MS) === 1 ? run + 1 : 1;
		best = Math.max(best, run);
	}

	// Current streak: only live if the last training day was today or yesterday.
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
	const mostRecent = sorted[sorted.length - 1];
	const daysSinceLast = Math.round((startOfToday - mostRecent) / DAY_MS);

	let current = 0;
	if (daysSinceLast <= 1) {
		current = 1;
		let i = sorted.length - 1;
		while (i > 0 && Math.round((sorted[i] - sorted[i - 1]) / DAY_MS) === 1) {
			current++;
			i--;
		}
	}

	return { current, best };
}
