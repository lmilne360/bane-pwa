/**
 * Barbell-loading math, ported from Bane's `PlateCalculator`/`PlatePreferences`.
 * Unit-agnostic; canonical pounds throughout.
 */

const EPSILON = 0.001;

export interface Placement {
	plate: number;
	/** How many of this plate go on each side. */
	count: number;
}

export interface Loadout {
	target: number;
	barWeight: number;
	/** Plates per side, heaviest first. */
	perSide: Placement[];
	/** Weight actually achievable with the available plates. */
	achieved: number;
}

/** Unmatched weight left after greedy loading (0 when exact). */
export function remainder(l: Loadout): number {
	return Math.max(0, l.target - l.achieved);
}

export function isExact(l: Loadout): boolean {
	return remainder(l) < EPSILON;
}

export function isBelowBar(l: Loadout): boolean {
	return l.target < l.barWeight - EPSILON;
}

export function perSideWeight(l: Loadout): number {
	return l.perSide.reduce((sum, p) => sum + p.plate * p.count, 0);
}

/**
 * Greedily loads `target` onto `barWeight` using the largest plates first.
 * Only whole plates, symmetric sides; an unmatchable target leaves a remainder.
 */
export function solve(target: number, barWeight: number, plates: number[]): Loadout {
	if (target <= barWeight + EPSILON) {
		return { target, barWeight, perSide: [], achieved: Math.min(target, barWeight) };
	}

	let remainingPerSide = (target - barWeight) / 2;
	const placements: Placement[] = [];

	for (const plate of [...plates].sort((a, b) => b - a)) {
		if (plate <= 0) continue;
		const count = Math.floor((remainingPerSide + EPSILON) / plate);
		if (count <= 0) continue;
		placements.push({ plate, count });
		remainingPerSide -= count * plate;
	}

	const loadedPerSide = placements.reduce((sum, p) => sum + p.plate * p.count, 0);
	return { target, barWeight, perSide: placements, achieved: barWeight + loadedPerSide * 2 };
}

// MARK: - Preferences

export const FALLBACK_BAR_WEIGHT = 45;
export const BAR_PRESETS = [45, 35, 15, 0];
export const SELECTABLE_PLATES = [45, 35, 25, 15, 10, 5, 2.5, 1.25];
export const FALLBACK_PLATES = [45, 25, 10, 5, 2.5];

/** A plate/weight value without needless decimals (`45`, `2.5`). */
export function formatPlate(value: number): string {
	return value === Math.round(value) ? String(Math.round(value)) : String(value);
}
