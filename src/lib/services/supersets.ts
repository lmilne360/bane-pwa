/**
 * Superset grouping for the active workout, ported from Bane's
 * `Workout.exerciseGroups` and `ActiveWorkoutView`'s superset editing.
 *
 * Exercises sharing the same non-`null` `supersetGroup` are performed as a
 * superset — the lifter alternates between them. The only invariant that
 * matters is contiguity: a group must be two or more *consecutive* exercises,
 * enforced by `normalizeSupersets` after every edit.
 */

import type { WorkoutExercise } from '$lib/types';

/**
 * Collapses `ordered` (already sorted by `order`) into display blocks.
 * Consecutive exercises sharing the same non-null `supersetGroup` come back
 * together as one block; every other exercise is a single-element block.
 */
export function exerciseGroups(ordered: WorkoutExercise[]): WorkoutExercise[][] {
	const groups: WorkoutExercise[][] = [];
	for (const exercise of ordered) {
		const last = groups[groups.length - 1];
		if (exercise.supersetGroup && last?.[0].supersetGroup === exercise.supersetGroup) {
			last.push(exercise);
		} else {
			groups.push([exercise]);
		}
	}
	return groups;
}

/** Stable A, B, C… labels for each multi-member group, in display order. */
export function supersetLetters(groups: WorkoutExercise[][]): Map<string, string> {
	const letters = new Map<string, string>();
	let index = 0;
	for (const group of groups) {
		const id = group[0].supersetGroup;
		if (group.length < 2 || !id) continue;
		letters.set(id, String.fromCharCode(65 + Math.min(index, 25)));
		index++;
	}
	return letters;
}

/**
 * Links `exercise` with the one directly below it in `ordered` into a
 * superset — extending its existing group, or creating a fresh one. No-op if
 * `exercise` is already last.
 */
export function supersetWithNext(ordered: WorkoutExercise[], exercise: WorkoutExercise): void {
	const index = ordered.findIndex((e) => e.id === exercise.id);
	if (index === -1 || index + 1 >= ordered.length) return;
	const group = exercise.supersetGroup ?? crypto.randomUUID();
	exercise.supersetGroup = group;
	ordered[index + 1].supersetGroup = group;
	normalizeSupersets(ordered);
}

/** Detaches `exercise` from its superset, dissolving the group if only one member would remain. */
export function leaveSuperset(ordered: WorkoutExercise[], exercise: WorkoutExercise): void {
	exercise.supersetGroup = null;
	normalizeSupersets(ordered);
}

/**
 * Enforces the superset invariant: every group must have two or more
 * contiguous members. Any run shorter than two is dissolved back to solo
 * exercises. Run after any grouping edit or exercise removal.
 */
export function normalizeSupersets(ordered: WorkoutExercise[]): void {
	let start = 0;
	while (start < ordered.length) {
		const group = ordered[start].supersetGroup;
		if (!group) {
			start++;
			continue;
		}
		let end = start + 1;
		while (end < ordered.length && ordered[end].supersetGroup === group) end++;
		if (end - start < 2) {
			for (let i = start; i < end; i++) ordered[i].supersetGroup = null;
		}
		start = end;
	}
}
