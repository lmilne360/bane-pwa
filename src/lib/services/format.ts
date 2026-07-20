import type { Workout, WorkoutExercise } from '$lib/types';

/** Locale date like "Mon, Jul 20". */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

/** Locale date with year, for detail headers. */
export function formatDateLong(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

/** `YYYY-MM-DD` for date inputs. */
export function toDateInput(iso: string): string {
	const d = new Date(iso);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Duration between start/finish as "45 min" / "1 h 12 min". */
export function workoutDuration(w: Workout): string | null {
	if (!w.startedAt || !w.finishedAt) return null;
	const ms = new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime();
	const min = Math.max(0, Math.round(ms / 60000));
	if (min < 60) return `${min} min`;
	return `${Math.floor(min / 60)} h ${min % 60} min`;
}

/** Working sets only (warm-ups excluded). */
export function workingSets(we: WorkoutExercise) {
	return we.sets.filter((s) => !s.isWarmup);
}

/** Total working-set volume (reps × weight) across the whole workout, in pounds. */
export function totalVolume(w: Workout): number {
	let total = 0;
	for (const we of w.exercises) {
		for (const s of we.sets) {
			if (!s.isWarmup) total += s.reps * s.weight;
		}
	}
	return total;
}

/** Count of working sets across the whole workout. */
export function totalSets(w: Workout): number {
	return w.exercises.reduce((n, we) => n + workingSets(we).length, 0);
}

export function orderedExercises(w: Workout): WorkoutExercise[] {
	return [...w.exercises].sort((a, b) => a.order - b.order);
}
