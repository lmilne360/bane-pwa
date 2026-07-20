import type { WeightUnit } from '$lib/types';

/**
 * Warm-up ramp math, ported from Bane's `WarmupCalculator`/`WarmupPreferences`.
 * Unit-agnostic — operates on the same numeric scale as stored weights; callers
 * decide the unit.
 */

export interface WarmupStep {
	/** Fraction of the working weight, 0…1. */
	percentage: number;
	reps: number;
}

export interface WarmupSet {
	percentage: number;
	/** Rounded to the caller's increment and floored at the bar. */
	weight: number;
	reps: number;
}

/** Rounds to the nearest positive `increment`, else to a whole number. */
export function roundToIncrement(value: number, increment: number): number {
	if (increment <= 0) return Math.round(value);
	return Math.round(value / increment) * increment;
}

/**
 * Builds the strictly-ascending warm-up ladder leading up to `workingWeight`.
 * Rungs that round to/above the working weight — or don't clear the previous
 * kept rung — are dropped. Empty when the working weight is at/below the bar.
 */
export function warmupSets(
	workingWeight: number,
	scheme: WarmupStep[],
	rounding = 5,
	barWeight = 0
): WarmupSet[] {
	if (workingWeight <= barWeight) return [];

	const ladder: WarmupSet[] = [];
	for (const step of scheme) {
		const raw = workingWeight * step.percentage;
		const weight = Math.max(barWeight, roundToIncrement(raw, rounding));
		if (weight >= workingWeight) continue;
		const last = ladder[ladder.length - 1];
		if (last && weight <= last.weight) continue;
		ladder.push({ percentage: step.percentage, weight, reps: step.reps });
	}
	return ladder;
}

// MARK: - Preferences

export interface WarmupScheme {
	id: string;
	name: string;
	steps: WarmupStep[];
}

export const WARMUP_SCHEMES: WarmupScheme[] = [
	{
		id: 'gradual',
		name: 'Gradual',
		steps: [
			{ percentage: 0.4, reps: 8 },
			{ percentage: 0.55, reps: 5 },
			{ percentage: 0.7, reps: 3 },
			{ percentage: 0.85, reps: 2 }
		]
	},
	{
		id: 'standard',
		name: 'Standard',
		steps: [
			{ percentage: 0.4, reps: 8 },
			{ percentage: 0.6, reps: 5 },
			{ percentage: 0.8, reps: 3 }
		]
	},
	{
		id: 'minimal',
		name: 'Minimal',
		steps: [
			{ percentage: 0.5, reps: 5 },
			{ percentage: 0.75, reps: 3 }
		]
	}
];

export const FALLBACK_SCHEME_ID = 'standard';

export function schemeById(id: string): WarmupScheme {
	return (
		WARMUP_SCHEMES.find((s) => s.id === id) ??
		WARMUP_SCHEMES.find((s) => s.id === FALLBACK_SCHEME_ID) ??
		WARMUP_SCHEMES[0]
	);
}

/** Rounding presets offered per display unit (native-unit steps). */
export function roundingPresets(unit: WeightUnit): number[] {
	return unit === 'kilograms' ? [5, 2.5, 1.25, 1] : [10, 5, 2.5, 1];
}

export function fallbackRounding(unit: WeightUnit): number {
	return unit === 'kilograms' ? 2.5 : 5;
}
