import { db } from './db';
import type {
	BodyMeasurement,
	Exercise,
	Routine,
	RoutineItem,
	SetEntry,
	Workout,
	WorkoutExercise
} from '$lib/types';
import {
	DEFAULT_INCREMENT_POUNDS,
	DEFAULT_MAX_REPS,
	DEFAULT_MIN_REPS,
	nextTargets,
	type PreviousSet,
	type SetTarget
} from '$lib/services/progressiveOverload';

// MARK: - Factories

export function newSet(order: number, reps = 0, weight = 0): SetEntry {
	return { id: crypto.randomUUID(), order, reps, weight, completed: false, isWarmup: false, rpe: null };
}

export function newWorkoutExercise(order: number, exerciseId: string | null): WorkoutExercise {
	return { id: crypto.randomUUID(), order, notes: '', exerciseId, supersetGroup: null, sets: [] };
}

export function newEmptyWorkout(): Workout {
	const now = new Date().toISOString();
	return { id: crypto.randomUUID(), date: now, startedAt: now, finishedAt: null, exercises: [] };
}

// MARK: - Exercises

export async function saveExercise(exercise: Exercise): Promise<void> {
	await db.exercises.put(structuredClone(exercise));
}

export async function deleteExercise(id: string): Promise<void> {
	await db.exercises.delete(id);
}

// MARK: - Workouts

export async function saveWorkout(workout: Workout): Promise<void> {
	await db.workouts.put(structuredClone(workout));
}

export async function deleteWorkout(id: string): Promise<void> {
	await db.workouts.delete(id);
}

/** The single in-progress workout (no `finishedAt`), if any. */
export async function activeWorkout(): Promise<Workout | undefined> {
	const all = await db.workouts.toArray();
	return all.find((w) => !w.finishedAt);
}

// MARK: - Routines

export async function saveRoutine(routine: Routine): Promise<void> {
	await db.routines.put(structuredClone(routine));
}

export async function deleteRoutine(id: string): Promise<void> {
	await db.routines.delete(id);
}

// MARK: - Measurements

export async function saveMeasurement(m: BodyMeasurement): Promise<void> {
	await db.measurements.put(structuredClone(m));
}

export async function deleteMeasurement(id: string): Promise<void> {
	await db.measurements.delete(id);
}

// MARK: - Starting a workout from a routine

function orderedItems(routine: Routine): RoutineItem[] {
	return [...routine.items].sort((a, b) => a.order - b.order);
}

/** Working sets (warm-ups excluded) of the exercise's most recent finished session. */
function latestWorkingSets(exerciseId: string, workouts: Workout[]): PreviousSet[] | null {
	const finished = workouts
		.filter(
			(w) =>
				w.finishedAt &&
				w.exercises.some(
					(we) => we.exerciseId === exerciseId && we.sets.some((s) => !s.isWarmup)
				)
		)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const mostRecent = finished[0];
	if (!mostRecent) return null;

	const sets = mostRecent.exercises
		.filter((we) => we.exerciseId === exerciseId)
		.flatMap((we) => [...we.sets].sort((a, b) => a.order - b.order))
		.filter((s) => !s.isWarmup)
		.map((s) => ({ reps: s.reps, weight: s.weight }));

	return sets.length > 0 ? sets : null;
}

/** Assembles an in-progress workout from a routine using per-item set targets. */
function build(routine: Routine, targetsFor: (item: RoutineItem) => SetTarget[]): Workout {
	const workout = newEmptyWorkout();
	let order = 0;
	for (const item of orderedItems(routine)) {
		if (!item.exerciseId) continue;
		const we = newWorkoutExercise(order, item.exerciseId);
		targetsFor(item).forEach((t, i) => we.sets.push(newSet(i, t.reps, t.weight)));
		workout.exercises.push(we);
		order++;
	}
	return workout;
}

/** Builds a workout pre-filled from a routine's configured targets. */
export function workoutFromRoutine(routine: Routine): Workout {
	return build(routine, (item) =>
		[...item.sets]
			.sort((a, b) => a.order - b.order)
			.map((s) => ({ reps: s.targetReps, weight: s.targetWeight }))
	);
}

/**
 * Builds a workout from a routine, applying double-progression targets when the
 * routine has it enabled (falls back to configured targets otherwise or when an
 * exercise has no finished history).
 */
export async function workoutFromRoutineProgressive(routine: Routine): Promise<Workout> {
	if (!routine.progressiveOverloadEnabled) return workoutFromRoutine(routine);
	const history = await db.workouts.toArray();

	return build(routine, (item) => {
		const fallback = [...item.sets]
			.sort((a, b) => a.order - b.order)
			.map((s) => ({ reps: s.targetReps, weight: s.targetWeight }));
		if (!item.exerciseId) return fallback;
		const previous = latestWorkingSets(item.exerciseId, history);
		if (!previous) return fallback;
		return nextTargets(
			previous,
			item.repRangeMin ?? DEFAULT_MIN_REPS,
			item.repRangeMax ?? DEFAULT_MAX_REPS,
			item.weightIncrement ?? DEFAULT_INCREMENT_POUNDS,
			fallback
		);
	});
}
