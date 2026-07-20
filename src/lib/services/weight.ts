import type { WeightUnit } from '$lib/types';

/**
 * Weight unit handling, ported from Bane's `WeightUnit`/`WeightFormat`.
 *
 * The data model stores **every** weight in canonical pounds; this module
 * converts and formats at the UI boundary only. Stored values are never
 * migrated when the display unit changes.
 */

export const WEIGHT_UNITS: WeightUnit[] = ['pounds', 'kilograms'];

export const UNIT_ABBREVIATION: Record<WeightUnit, string> = {
	pounds: 'lb',
	kilograms: 'kg'
};

export const UNIT_DISPLAY_NAME: Record<WeightUnit, string> = {
	pounds: 'Pounds',
	kilograms: 'Kilograms'
};

/** Exact pounds in one kilogram; every conversion routes through this. */
export const POUNDS_PER_KILOGRAM = 2.2046226218;

/** Converts a canonical-pounds value into `unit` for display. */
export function fromPounds(pounds: number, unit: WeightUnit): number {
	return unit === 'kilograms' ? pounds / POUNDS_PER_KILOGRAM : pounds;
}

/** Converts a value entered in `unit` back into canonical pounds. */
export function toPounds(value: number, unit: WeightUnit): number {
	return unit === 'kilograms' ? value * POUNDS_PER_KILOGRAM : value;
}

/** Trims a number to at most `maxFraction` decimals, dropping trailing zeros. */
function trim(n: number, maxFraction: number): string {
	return n.toLocaleString(undefined, { maximumFractionDigits: maxFraction });
}

/** Bare converted number, up to one decimal (`100`, `45.4`). */
export function weightValue(pounds: number, unit: WeightUnit): string {
	return trim(fromPounds(pounds, unit), 1);
}

/** A single weight with its unit label (`100 lb`, `45.4 kg`). */
export function formatWeight(pounds: number, unit: WeightUnit): string {
	return `${weightValue(pounds, unit)} ${UNIT_ABBREVIATION[unit]}`;
}

/** A grouped aggregate volume with its unit label (`12,340 lb`), whole numbers. */
export function formatVolume(pounds: number, unit: WeightUnit): string {
	return `${trim(fromPounds(pounds, unit), 0)} ${UNIT_ABBREVIATION[unit]}`;
}
