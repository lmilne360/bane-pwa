import type { PRMetric, PersonalRecord, Workout } from '$lib/types';
import { PR_METRICS } from '$lib/types';

/**
 * Personal-record computation from workout history, ported from Bane's
 * `PersonalRecordsService`. Pure over plain values; records are derived live
 * (not cached), the workout log being the single source of truth.
 *
 * Only finished sessions count, warm-ups are excluded, and a set needs positive
 * reps and weight to qualify. Ties break toward the earliest date.
 */

export interface Candidate {
	reps: number;
	weight: number;
	date: string;
}

/** Epley estimated 1RM: `weight × (1 + reps / 30)`. */
export function estimatedOneRepMax(reps: number, weight: number): number {
	return weight * (1 + reps / 30);
}

function metricValue(c: Candidate, metric: PRMetric): number {
	switch (metric) {
		case 'heaviestWeight':
			return c.weight;
		case 'estimatedOneRepMax':
			return estimatedOneRepMax(c.reps, c.weight);
		case 'bestSetVolume':
			return c.reps * c.weight;
	}
}

/** Every record-eligible set for `exerciseId` across finished workouts. */
export function candidates(exerciseId: string, workouts: Workout[]): Candidate[] {
	const result: Candidate[] = [];
	for (const workout of workouts) {
		if (!workout.finishedAt) continue;
		for (const we of workout.exercises) {
			if (we.exerciseId !== exerciseId) continue;
			for (const set of we.sets) {
				if (!set.isWarmup && set.reps > 0 && set.weight > 0) {
					result.push({ reps: set.reps, weight: set.weight, date: workout.date });
				}
			}
		}
	}
	return result;
}

/** Picks the best candidate for each metric (earliest date wins ties). */
export function bestRecords(list: Candidate[], exerciseId: string): PersonalRecord[] {
	if (list.length === 0) return [];
	const records: PersonalRecord[] = [];
	for (const metric of PR_METRICS) {
		let best: Candidate | null = null;
		let bestValue = -Infinity;
		for (const c of list) {
			const v = metricValue(c, metric);
			if (v > bestValue || (v === bestValue && best !== null && c.date < best.date)) {
				best = c;
				bestValue = v;
			}
		}
		if (best) {
			records.push({
				metric,
				value: metricValue(best, metric),
				reps: best.reps,
				weight: best.weight,
				achievedOn: best.date,
				exerciseId
			});
		}
	}
	return records;
}

/** Current records for one exercise, computed live from history. */
export function recordsFor(exerciseId: string, workouts: Workout[]): PersonalRecord[] {
	return bestRecords(candidates(exerciseId, workouts), exerciseId);
}

/** Records for every exercise that has any, keyed by exerciseId. */
export function allRecords(exerciseIds: string[], workouts: Workout[]): Map<string, PersonalRecord[]> {
	const map = new Map<string, PersonalRecord[]>();
	for (const id of exerciseIds) {
		const recs = recordsFor(id, workouts);
		if (recs.length > 0) map.set(id, recs);
	}
	return map;
}

/** Whether the history contains any personal record at all. */
export function hasAnyRecord(exerciseIds: string[], workouts: Workout[]): boolean {
	return exerciseIds.some((id) => candidates(id, workouts).length > 0);
}
