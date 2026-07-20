/**
 * Double-progression logic for routines in Progressive Overload mode, ported
 * from Bane's `ProgressiveOverload`.
 *
 * Given the previous session's **working** sets (warm-ups excluded) and a rep
 * range [min, max] with a weight `increment`:
 * - All working sets reached `max` → add `increment` to each set's weight and
 *   reset reps to `min`.
 * - Any working set fell below `min` → hold weight, target `min` reps.
 * - Otherwise → keep weight, add one rep toward the top (`min(prev + 1, max)`).
 * - No prior history → return the caller's `fallback` (routine's configured
 *   targets) unchanged.
 */

export const DEFAULT_MIN_REPS = 8;
export const DEFAULT_MAX_REPS = 12;
export const DEFAULT_INCREMENT_POUNDS = 5;

export interface SetTarget {
	reps: number;
	/** Canonical pounds. */
	weight: number;
}

export interface PreviousSet {
	reps: number;
	weight: number;
}

export function nextTargets(
	previousWorkingSets: PreviousSet[],
	minReps: number,
	maxReps: number,
	increment: number,
	fallback: SetTarget[]
): SetTarget[] {
	if (previousWorkingSets.length === 0) return fallback;

	// Guard against an inverted/degenerate range.
	const low = Math.min(minReps, maxReps);
	const high = Math.max(minReps, maxReps);

	const allReachedMax = previousWorkingSets.every((s) => s.reps >= high);
	const anyBelowMin = previousWorkingSets.some((s) => s.reps < low);

	return previousWorkingSets.map((set) => {
		if (allReachedMax) return { reps: low, weight: set.weight + increment };
		if (anyBelowMin) return { reps: low, weight: set.weight };
		return { reps: Math.min(set.reps + 1, high), weight: set.weight };
	});
}
