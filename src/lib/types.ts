/**
 * Core domain types for Bane-Lite, ported from the native Bane SwiftData model.
 *
 * Conventions carried over verbatim:
 * - **Every weight is stored in canonical pounds.** Unit conversion/formatting
 *   happens only at the UI boundary (see `$lib/services/weight`).
 * - IDs are stable UUID strings (`crypto.randomUUID()`), used for idempotent
 *   seeding and reference semantics.
 * - Workouts and routines are stored as documents with embedded children;
 *   exercises are referenced by id (deleting an exercise leaves history intact
 *   but unresolved, mirroring Bane's `.nullify` delete rule).
 */

// MARK: - Enums (string unions + display metadata)

export const EXERCISE_CATEGORIES = [
	'chest',
	'back',
	'legs',
	'shoulders',
	'arms',
	'core',
	'cardio',
	'fullBody',
	'other'
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
	chest: 'Chest',
	back: 'Back',
	legs: 'Legs',
	shoulders: 'Shoulders',
	arms: 'Arms',
	core: 'Core',
	cardio: 'Cardio',
	fullBody: 'Full Body',
	other: 'Other'
};

export const MUSCLES = [
	'chest',
	'upperBack',
	'lats',
	'traps',
	'shoulders',
	'biceps',
	'triceps',
	'forearms',
	'quads',
	'hamstrings',
	'glutes',
	'calves',
	'abs',
	'obliques',
	'fullBody',
	'other'
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_LABELS: Record<Muscle, string> = {
	chest: 'Chest',
	upperBack: 'Upper Back',
	lats: 'Lats',
	traps: 'Traps',
	shoulders: 'Shoulders',
	biceps: 'Biceps',
	triceps: 'Triceps',
	forearms: 'Forearms',
	quads: 'Quads',
	hamstrings: 'Hamstrings',
	glutes: 'Glutes',
	calves: 'Calves',
	abs: 'Abs',
	obliques: 'Obliques',
	fullBody: 'Full Body',
	other: 'Other'
};

export const EQUIPMENT = [
	'barbell',
	'dumbbell',
	'machine',
	'cable',
	'kettlebell',
	'band',
	'bodyweight',
	'other'
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
	barbell: 'Barbell',
	dumbbell: 'Dumbbell',
	machine: 'Machine',
	cable: 'Cable',
	kettlebell: 'Kettlebell',
	band: 'Band',
	bodyweight: 'Bodyweight',
	other: 'Other'
};

export const PR_METRICS = ['heaviestWeight', 'estimatedOneRepMax', 'bestSetVolume'] as const;
export type PRMetric = (typeof PR_METRICS)[number];

export const PR_METRIC_LABELS: Record<PRMetric, string> = {
	heaviestWeight: 'Heaviest Weight',
	estimatedOneRepMax: 'Est. 1RM',
	bestSetVolume: 'Best Set Volume'
};

export type WeightUnit = 'pounds' | 'kilograms';

// MARK: - Domain models

export interface Exercise {
	id: string;
	name: string;
	category: ExerciseCategory;
	primaryMuscle: Muscle;
	equipment: Equipment;
	/** `true` for user-created exercises, `false` for the seeded library. */
	isCustom: boolean;
	/** Per-exercise rest-timer override (seconds); `null` uses the app default. */
	restDuration: number | null;
}

/** A single performed set. Warm-ups are excluded from working-set totals & PRs. */
export interface SetEntry {
	id: string;
	order: number;
	reps: number;
	/** Canonical pounds. */
	weight: number;
	completed: boolean;
	isWarmup: boolean;
	/** Rate of Perceived Exertion (typically 6–10 in 0.5 steps), or null. */
	rpe: number | null;
}

/** An exercise performed within a workout, with its ordered sets. */
export interface WorkoutExercise {
	id: string;
	order: number;
	notes: string;
	/** Reference to `Exercise.id`; may dangle if the exercise was deleted. */
	exerciseId: string | null;
	/** Shared non-null id groups consecutive exercises into a superset. */
	supersetGroup: string | null;
	sets: SetEntry[];
}

/** A logged (or in-progress) training session. Active while `finishedAt` is null. */
export interface Workout {
	id: string;
	/** Calendar day used for grouping in history (ISO string). */
	date: string;
	startedAt: string | null;
	finishedAt: string | null;
	exercises: WorkoutExercise[];
}

export interface RoutineSet {
	id: string;
	order: number;
	targetReps: number;
	/** Canonical pounds. */
	targetWeight: number;
}

export interface RoutineItem {
	id: string;
	order: number;
	exerciseId: string | null;
	/** Double-progression rep-range floor; null → ProgressiveOverload default. */
	repRangeMin: number | null;
	repRangeMax: number | null;
	/** Canonical-pounds load added when the whole range is cleared; null → default. */
	weightIncrement: number | null;
	sets: RoutineSet[];
}

/** A reusable workout template. */
export interface Routine {
	id: string;
	name: string;
	createdAt: string;
	/** When true, starting a workout auto-computes double-progression targets. */
	progressiveOverloadEnabled: boolean;
	items: RoutineItem[];
}

/** A dated body snapshot. Every metric except `date` is optional. */
export interface BodyMeasurement {
	id: string;
	date: string;
	weight: number | null;
	bodyFatPercentage: number | null;
	neck: number | null;
	shoulders: number | null;
	chest: number | null;
	waist: number | null;
	hips: number | null;
	leftArm: number | null;
	rightArm: number | null;
	leftThigh: number | null;
	rightThigh: number | null;
	leftCalf: number | null;
	rightCalf: number | null;
	notes: string;
}

/** A computed personal record for one exercise and metric (derived, not stored). */
export interface PersonalRecord {
	metric: PRMetric;
	value: number;
	reps: number;
	weight: number;
	achievedOn: string;
	exerciseId: string;
}
