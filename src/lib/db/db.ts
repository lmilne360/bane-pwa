import Dexie, { type Table } from 'dexie';
import type { Workout, Routine, Exercise, BodyMeasurement } from '$lib/types';
import { EXERCISE_SEED } from '$lib/data/exercises';

/**
 * Bane-Lite's local database. Mirrors the native Bane store, adapted to
 * IndexedDB via Dexie:
 *
 * - `exercises` is a flat, indexed table (browsed/filtered independently and
 *   referenced by id from workouts/routines).
 * - `workouts` and `routines` are stored as documents with their children
 *   (exercises → sets, items → sets) embedded, matching how the UI loads and
 *   saves an entire session/template at once.
 * - Personal records are derived live from workout history (see
 *   `$lib/services/personalRecords`), not persisted — the source of truth is
 *   always the workout log.
 *
 * The built-in exercise library is seeded once, idempotently, on the version-1
 * upgrade (equivalent to Bane's `ExerciseLibrary.seedIfNeeded`).
 */
export class BaneDB extends Dexie {
	exercises!: Table<Exercise, string>;
	workouts!: Table<Workout, string>;
	routines!: Table<Routine, string>;
	measurements!: Table<BodyMeasurement, string>;

	constructor() {
		super('bane-lite');

		this.version(1).stores({
			exercises: '&id, name, category, primaryMuscle, equipment, isCustom',
			workouts: '&id, date, startedAt, finishedAt',
			routines: '&id, name, createdAt',
			measurements: '&id, date'
		});

		// Seed the built-in exercise library on first creation of the table.
		this.on('populate', (tx) => {
			tx.table<Exercise, string>('exercises').bulkAdd(EXERCISE_SEED());
		});
	}
}

export const db = new BaneDB();
