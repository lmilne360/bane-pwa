import type { Muscle } from '$lib/types';

/**
 * A paintable muscle region on a body diagram, positioned in a unit
 * coordinate space (0...1 on both axes, origin top-left) so the layout
 * scales to any frame. Several regions may map to the same muscle (e.g.
 * left/right sides) — they simply share that muscle's intensity.
 *
 * Ported from Bane's `BodyDiagram.BodyRegion` (Views/BodyDiagram.swift).
 */
export interface BodyRegion {
	muscle: Muscle;
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Muscle regions visible from the front, laid out over the silhouette. */
export const FRONT_REGIONS: BodyRegion[] = [
	// Shoulders (deltoids)
	{ muscle: 'shoulders', x: 0.24, y: 0.2, w: 0.16, h: 0.08 },
	{ muscle: 'shoulders', x: 0.6, y: 0.2, w: 0.16, h: 0.08 },
	// Chest
	{ muscle: 'chest', x: 0.31, y: 0.25, w: 0.17, h: 0.09 },
	{ muscle: 'chest', x: 0.52, y: 0.25, w: 0.17, h: 0.09 },
	// Biceps
	{ muscle: 'biceps', x: 0.18, y: 0.31, w: 0.1, h: 0.13 },
	{ muscle: 'biceps', x: 0.72, y: 0.31, w: 0.1, h: 0.13 },
	// Forearms
	{ muscle: 'forearms', x: 0.15, y: 0.46, w: 0.09, h: 0.15 },
	{ muscle: 'forearms', x: 0.76, y: 0.46, w: 0.09, h: 0.15 },
	// Obliques
	{ muscle: 'obliques', x: 0.34, y: 0.38, w: 0.07, h: 0.14 },
	{ muscle: 'obliques', x: 0.59, y: 0.38, w: 0.07, h: 0.14 },
	// Abs
	{ muscle: 'abs', x: 0.43, y: 0.37, w: 0.14, h: 0.16 },
	// Quads
	{ muscle: 'quads', x: 0.35, y: 0.58, w: 0.13, h: 0.2 },
	{ muscle: 'quads', x: 0.52, y: 0.58, w: 0.13, h: 0.2 }
];

/** Muscle regions visible from the back. */
export const BACK_REGIONS: BodyRegion[] = [
	// Traps
	{ muscle: 'traps', x: 0.4, y: 0.17, w: 0.2, h: 0.08 },
	// Shoulders (rear delts)
	{ muscle: 'shoulders', x: 0.24, y: 0.22, w: 0.14, h: 0.07 },
	{ muscle: 'shoulders', x: 0.62, y: 0.22, w: 0.14, h: 0.07 },
	// Upper back
	{ muscle: 'upperBack', x: 0.35, y: 0.25, w: 0.3, h: 0.08 },
	// Lats
	{ muscle: 'lats', x: 0.31, y: 0.33, w: 0.13, h: 0.12 },
	{ muscle: 'lats', x: 0.56, y: 0.33, w: 0.13, h: 0.12 },
	// Triceps
	{ muscle: 'triceps', x: 0.18, y: 0.31, w: 0.1, h: 0.13 },
	{ muscle: 'triceps', x: 0.72, y: 0.31, w: 0.1, h: 0.13 },
	// Forearms
	{ muscle: 'forearms', x: 0.15, y: 0.46, w: 0.09, h: 0.15 },
	{ muscle: 'forearms', x: 0.76, y: 0.46, w: 0.09, h: 0.15 },
	// Glutes
	{ muscle: 'glutes', x: 0.37, y: 0.52, w: 0.12, h: 0.09 },
	{ muscle: 'glutes', x: 0.51, y: 0.52, w: 0.12, h: 0.09 },
	// Hamstrings
	{ muscle: 'hamstrings', x: 0.36, y: 0.62, w: 0.12, h: 0.16 },
	{ muscle: 'hamstrings', x: 0.52, y: 0.62, w: 0.12, h: 0.16 },
	// Calves
	{ muscle: 'calves', x: 0.37, y: 0.8, w: 0.11, h: 0.14 },
	{ muscle: 'calves', x: 0.52, y: 0.8, w: 0.11, h: 0.14 }
];

/**
 * Maps a normalized intensity (0...1) to a heat color: cool green (low)
 * sweeping through amber to hot red (the most trained muscle in the
 * window). Zero (untrained) reads as a neutral surface tone.
 *
 * Ported from Bane's `MuscleHeatMap.heatColor` (Services/MuscleHeatMap.swift),
 * converted from HSB to the equivalent HSL for CSS.
 */
export function heatColor(intensity: number): string {
	if (intensity <= 0) return 'var(--surface-2)';
	const clamped = Math.min(Math.max(intensity, 0), 1);
	const hue = 0.33 * (1 - clamped) * 360;
	return `hsl(${hue.toFixed(1)}deg 79% 52%)`;
}
