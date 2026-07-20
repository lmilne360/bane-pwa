import { db } from './db';
import { live } from './live';
import type { BodyMeasurement, Exercise, Routine, Workout } from '$lib/types';

/**
 * Shared reactive queries over the local database. Each is a Svelte-readable
 * store that re-emits whenever the underlying IndexedDB table changes, so any
 * component using `$exercisesStore` (etc.) stays in sync automatically.
 */
export const exercisesStore = live<Exercise[]>(() => db.exercises.toArray(), []);
export const workoutsStore = live<Workout[]>(() => db.workouts.toArray(), []);
export const routinesStore = live<Routine[]>(() => db.routines.toArray(), []);
export const measurementsStore = live<BodyMeasurement[]>(() => db.measurements.toArray(), []);

/** Builds a quick `id → Exercise` lookup from an exercise list. */
export function exerciseMap(exercises: Exercise[]): Map<string, Exercise> {
	return new Map(exercises.map((e) => [e.id, e]));
}
