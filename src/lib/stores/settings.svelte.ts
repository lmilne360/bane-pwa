import { browser } from '$app/environment';
import type { WeightUnit } from '$lib/types';
import { FALLBACK_SCHEME_ID } from '$lib/services/warmup';
import { FALLBACK_BAR_WEIGHT, FALLBACK_PLATES } from '$lib/services/plates';
import {
	FALLBACK_REMINDER_HOUR,
	FALLBACK_REMINDER_MINUTE,
	FALLBACK_REMINDER_WEEKDAY_MASK
} from '$lib/services/reminders';

/**
 * App preferences, the web equivalent of Bane's `UserDefaults`/`AppStorage`
 * keys. Backed by localStorage and reactive (Svelte 5 runes), so every surface
 * reads a single shared source of truth and re-renders when it changes.
 */
export interface Settings {
	weightUnit: WeightUnit;
	/** App-wide default rest length (seconds) used when an exercise has none. */
	defaultRestSeconds: number;
	warmupSchemeId: string;
	warmupRounding: number;
	plateBarWeight: number;
	plateAvailablePlates: number[];
	/** Earned-achievement ids already shown to the user (for "new" flags). */
	seenAchievements: string[];
	/** Opt-in weekly workout reminder, off by default. */
	reminderEnabled: boolean;
	reminderHour: number;
	reminderMinute: number;
	/** Packed `Weekday` bitmask, see `$lib/services/reminders`. */
	reminderWeekdayMask: number;
	/** `YYYY-MM-DD` the reminder last fired on, so it fires at most once a day. */
	reminderLastFiredOn: string | null;
}

const DEFAULTS: Settings = {
	weightUnit: 'pounds',
	defaultRestSeconds: 120,
	warmupSchemeId: FALLBACK_SCHEME_ID,
	warmupRounding: 5,
	plateBarWeight: FALLBACK_BAR_WEIGHT,
	plateAvailablePlates: FALLBACK_PLATES,
	seenAchievements: [],
	reminderEnabled: false,
	reminderHour: FALLBACK_REMINDER_HOUR,
	reminderMinute: FALLBACK_REMINDER_MINUTE,
	reminderWeekdayMask: FALLBACK_REMINDER_WEEKDAY_MASK,
	reminderLastFiredOn: null
};

const KEY = 'bane-lite.settings';

function load(): Settings {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
	} catch {
		return { ...DEFAULTS };
	}
}

export const settings = $state<Settings>(load());

// Persist on any change. `$effect.root` gives us an app-lifetime effect outside
// component context; JSON.stringify walks every field so all reads are tracked.
if (browser) {
	$effect.root(() => {
		$effect(() => {
			localStorage.setItem(KEY, JSON.stringify(settings));
		});
	});
}

/** Records the given earned ids as seen, returning those that were newly earned. */
export function consumeNewlyEarned(earned: Set<string>): Set<string> {
	const seen = new Set(settings.seenAchievements);
	const fresh = new Set([...earned].filter((id) => !seen.has(id)));
	settings.seenAchievements = [...earned].sort();
	return fresh;
}
