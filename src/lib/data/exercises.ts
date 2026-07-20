import type { Exercise, ExerciseCategory, Muscle, Equipment } from '$lib/types';

/**
 * The built-in starter catalog (~75 exercises), ported verbatim from Bane's
 * `ExerciseLibrary`. Kept as plain tuples so the catalog is allocation-free
 * data until `EXERCISE_SEED()` materializes it into full `Exercise` rows.
 */
type Seed = [name: string, category: ExerciseCategory, primaryMuscle: Muscle, equipment: Equipment];

const CATALOG: Seed[] = [
	// Chest
	['Barbell Bench Press', 'chest', 'chest', 'barbell'],
	['Incline Barbell Bench Press', 'chest', 'chest', 'barbell'],
	['Dumbbell Bench Press', 'chest', 'chest', 'dumbbell'],
	['Incline Dumbbell Press', 'chest', 'chest', 'dumbbell'],
	['Dumbbell Fly', 'chest', 'chest', 'dumbbell'],
	['Cable Crossover', 'chest', 'chest', 'cable'],
	['Machine Chest Press', 'chest', 'chest', 'machine'],
	['Pec Deck', 'chest', 'chest', 'machine'],
	['Push-Up', 'chest', 'chest', 'bodyweight'],
	['Chest Dip', 'chest', 'chest', 'bodyweight'],

	// Back
	['Barbell Row', 'back', 'lats', 'barbell'],
	['Pendlay Row', 'back', 'upperBack', 'barbell'],
	['Bent-Over Dumbbell Row', 'back', 'lats', 'dumbbell'],
	['Single-Arm Dumbbell Row', 'back', 'lats', 'dumbbell'],
	['Pull-Up', 'back', 'lats', 'bodyweight'],
	['Chin-Up', 'back', 'lats', 'bodyweight'],
	['Lat Pulldown', 'back', 'lats', 'cable'],
	['Seated Cable Row', 'back', 'upperBack', 'cable'],
	['T-Bar Row', 'back', 'upperBack', 'machine'],
	['Machine Row', 'back', 'upperBack', 'machine'],
	['Face Pull', 'back', 'traps', 'cable'],
	['Back Extension', 'back', 'glutes', 'bodyweight'],

	// Legs
	['Back Squat', 'legs', 'quads', 'barbell'],
	['Front Squat', 'legs', 'quads', 'barbell'],
	['Conventional Deadlift', 'legs', 'hamstrings', 'barbell'],
	['Romanian Deadlift', 'legs', 'hamstrings', 'barbell'],
	['Leg Press', 'legs', 'quads', 'machine'],
	['Leg Extension', 'legs', 'quads', 'machine'],
	['Lying Leg Curl', 'legs', 'hamstrings', 'machine'],
	['Walking Lunge', 'legs', 'quads', 'dumbbell'],
	['Bulgarian Split Squat', 'legs', 'quads', 'dumbbell'],
	['Goblet Squat', 'legs', 'quads', 'dumbbell'],
	['Barbell Hip Thrust', 'legs', 'glutes', 'barbell'],
	['Standing Calf Raise', 'legs', 'calves', 'machine'],
	['Seated Calf Raise', 'legs', 'calves', 'machine'],
	['Bodyweight Squat', 'legs', 'quads', 'bodyweight'],

	// Shoulders
	['Overhead Press', 'shoulders', 'shoulders', 'barbell'],
	['Seated Dumbbell Shoulder Press', 'shoulders', 'shoulders', 'dumbbell'],
	['Arnold Press', 'shoulders', 'shoulders', 'dumbbell'],
	['Lateral Raise', 'shoulders', 'shoulders', 'dumbbell'],
	['Front Raise', 'shoulders', 'shoulders', 'dumbbell'],
	['Rear Delt Fly', 'shoulders', 'shoulders', 'dumbbell'],
	['Cable Lateral Raise', 'shoulders', 'shoulders', 'cable'],
	['Machine Shoulder Press', 'shoulders', 'shoulders', 'machine'],
	['Upright Row', 'shoulders', 'traps', 'barbell'],
	['Barbell Shrug', 'shoulders', 'traps', 'barbell'],
	['Dumbbell Shrug', 'shoulders', 'traps', 'dumbbell'],

	// Arms
	['Barbell Curl', 'arms', 'biceps', 'barbell'],
	['Dumbbell Curl', 'arms', 'biceps', 'dumbbell'],
	['Hammer Curl', 'arms', 'biceps', 'dumbbell'],
	['Preacher Curl', 'arms', 'biceps', 'barbell'],
	['Cable Curl', 'arms', 'biceps', 'cable'],
	['Concentration Curl', 'arms', 'biceps', 'dumbbell'],
	['Close-Grip Bench Press', 'arms', 'triceps', 'barbell'],
	['Triceps Pushdown', 'arms', 'triceps', 'cable'],
	['Overhead Triceps Extension', 'arms', 'triceps', 'dumbbell'],
	['Skull Crusher', 'arms', 'triceps', 'barbell'],
	['Triceps Dip', 'arms', 'triceps', 'bodyweight'],
	['Wrist Curl', 'arms', 'forearms', 'dumbbell'],

	// Core
	['Plank', 'core', 'abs', 'bodyweight'],
	['Crunch', 'core', 'abs', 'bodyweight'],
	['Hanging Leg Raise', 'core', 'abs', 'bodyweight'],
	['Cable Crunch', 'core', 'abs', 'cable'],
	['Russian Twist', 'core', 'obliques', 'bodyweight'],
	['Ab Wheel Rollout', 'core', 'abs', 'bodyweight'],
	['Sit-Up', 'core', 'abs', 'bodyweight'],

	// Cardio
	['Treadmill Run', 'cardio', 'fullBody', 'machine'],
	['Stationary Bike', 'cardio', 'quads', 'machine'],
	['Rowing Machine', 'cardio', 'fullBody', 'machine'],
	['Elliptical', 'cardio', 'fullBody', 'machine'],
	['Jump Rope', 'cardio', 'calves', 'bodyweight'],

	// Full Body
	['Kettlebell Swing', 'fullBody', 'glutes', 'kettlebell'],
	['Clean and Press', 'fullBody', 'shoulders', 'barbell'],
	['Thruster', 'fullBody', 'quads', 'barbell'],
	['Burpee', 'fullBody', 'fullBody', 'bodyweight']
];

/** Materializes the catalog into fresh `Exercise` rows with stable ids. */
export function EXERCISE_SEED(): Exercise[] {
	return CATALOG.map(([name, category, primaryMuscle, equipment]) => ({
		id: crypto.randomUUID(),
		name,
		category,
		primaryMuscle,
		equipment,
		isCustom: false,
		restDuration: null
	}));
}
