import type { Exercise, Routine, RoutineItem, RoutineSet } from '$lib/types';

/**
 * Ready-made training programs, ported from Bane's `ProgramLibrary`.
 *
 * Programs are plain data — instantiating one materializes its workouts into
 * ordinary `Routine`s referencing the already-seeded library exercises (matched
 * by name, case-insensitively). An unmatched name is skipped, never fabricated.
 * Weights start at 0 lb; the user fills in working loads.
 */
export interface ExercisePlan {
	exerciseName: string;
	setCount: number;
	targetReps: number;
}

export interface WorkoutPlan {
	name: string;
	exercises: ExercisePlan[];
}

export interface Program {
	id: string;
	name: string;
	tagline: string;
	overview: string;
	workouts: WorkoutPlan[];
}

export const PROGRAMS: Program[] = [
	{
		id: 'stronglifts-5x5',
		name: 'StrongLifts 5×5',
		tagline: 'Two alternating full-body barbell days · 5 sets of 5',
		overview:
			'A simple, proven strength program built on five compound barbell lifts. Run Workout A and Workout B on alternating training days (three sessions a week), and add a little weight to the bar every session.\n\nSquats appear in both workouts; the deadlift is a single heavy set of five. Fill in your starting weights when you begin.',
		workouts: [
			{
				name: 'StrongLifts 5×5 · Workout A',
				exercises: [
					{ exerciseName: 'Back Squat', setCount: 5, targetReps: 5 },
					{ exerciseName: 'Barbell Bench Press', setCount: 5, targetReps: 5 },
					{ exerciseName: 'Barbell Row', setCount: 5, targetReps: 5 }
				]
			},
			{
				name: 'StrongLifts 5×5 · Workout B',
				exercises: [
					{ exerciseName: 'Back Squat', setCount: 5, targetReps: 5 },
					{ exerciseName: 'Overhead Press', setCount: 5, targetReps: 5 },
					{ exerciseName: 'Conventional Deadlift', setCount: 1, targetReps: 5 }
				]
			}
		]
	},
	{
		id: 'push-pull-legs',
		name: 'Push / Pull / Legs',
		tagline: 'Three-day hypertrophy split · chest & shoulders, back & arms, legs',
		overview:
			'A balanced three-day split that groups the body by movement pattern: pushing muscles (chest, shoulders, triceps), pulling muscles (back, biceps), and the legs. Run it three or six days a week depending on your recovery, aiming for moderate reps and steady weekly progression.',
		workouts: [
			{
				name: 'PPL · Push',
				exercises: [
					{ exerciseName: 'Barbell Bench Press', setCount: 4, targetReps: 8 },
					{ exerciseName: 'Overhead Press', setCount: 3, targetReps: 10 },
					{ exerciseName: 'Incline Dumbbell Press', setCount: 3, targetReps: 10 },
					{ exerciseName: 'Lateral Raise', setCount: 3, targetReps: 15 },
					{ exerciseName: 'Triceps Pushdown', setCount: 3, targetReps: 12 }
				]
			},
			{
				name: 'PPL · Pull',
				exercises: [
					{ exerciseName: 'Barbell Row', setCount: 4, targetReps: 8 },
					{ exerciseName: 'Pull-Up', setCount: 3, targetReps: 8 },
					{ exerciseName: 'Lat Pulldown', setCount: 3, targetReps: 12 },
					{ exerciseName: 'Face Pull', setCount: 3, targetReps: 15 },
					{ exerciseName: 'Barbell Curl', setCount: 3, targetReps: 12 }
				]
			},
			{
				name: 'PPL · Legs',
				exercises: [
					{ exerciseName: 'Back Squat', setCount: 4, targetReps: 8 },
					{ exerciseName: 'Romanian Deadlift', setCount: 3, targetReps: 10 },
					{ exerciseName: 'Leg Press', setCount: 3, targetReps: 12 },
					{ exerciseName: 'Lying Leg Curl', setCount: 3, targetReps: 12 },
					{ exerciseName: 'Standing Calf Raise', setCount: 4, targetReps: 15 }
				]
			}
		]
	},
	{
		id: 'full-body-beginner',
		name: 'Full-Body Beginner',
		tagline: 'One session hitting every major muscle · 3× per week',
		overview:
			'A single full-body workout that trains every major muscle group in one session. Perfect for getting started: run it three non-consecutive days a week and add weight or reps as the movements start to feel easy.',
		workouts: [
			{
				name: 'Full-Body Beginner',
				exercises: [
					{ exerciseName: 'Back Squat', setCount: 3, targetReps: 8 },
					{ exerciseName: 'Barbell Bench Press', setCount: 3, targetReps: 8 },
					{ exerciseName: 'Barbell Row', setCount: 3, targetReps: 8 },
					{ exerciseName: 'Overhead Press', setCount: 3, targetReps: 10 },
					{ exerciseName: 'Romanian Deadlift', setCount: 3, targetReps: 10 },
					{ exerciseName: 'Hanging Leg Raise', setCount: 3, targetReps: 12 }
				]
			}
		]
	}
];

/** How many routines instantiating a program will create. */
export function routineCount(program: Program): number {
	return program.workouts.length;
}

/**
 * Builds `Routine` documents from a program, resolving exercise names against
 * the given library (first case-insensitive match wins). Unknown names are
 * skipped so `order` stays gap-free. Returned routines are not yet persisted.
 */
export function instantiateProgram(program: Program, library: Exercise[]): Routine[] {
	const byName = new Map<string, Exercise>();
	for (const ex of library) {
		const key = ex.name.toLowerCase();
		if (!byName.has(key)) byName.set(key, ex);
	}

	const now = new Date().toISOString();
	return program.workouts.map((workout) => {
		const items: RoutineItem[] = [];
		let order = 0;
		for (const plan of workout.exercises) {
			const exercise = byName.get(plan.exerciseName.toLowerCase());
			if (!exercise) continue;
			const sets: RoutineSet[] = [];
			for (let i = 0; i < Math.max(0, plan.setCount); i++) {
				sets.push({ id: crypto.randomUUID(), order: i, targetReps: plan.targetReps, targetWeight: 0 });
			}
			items.push({
				id: crypto.randomUUID(),
				order,
				exerciseId: exercise.id,
				repRangeMin: null,
				repRangeMax: null,
				weightIncrement: null,
				sets
			});
			order++;
		}
		return {
			id: crypto.randomUUID(),
			name: workout.name,
			createdAt: now,
			progressiveOverloadEnabled: false,
			items
		};
	});
}
