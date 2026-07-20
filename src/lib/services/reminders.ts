/**
 * Weekly workout reminders, ported from Bane's `ReminderScheduler`/`Weekday`.
 *
 * The web has no equivalent of `UNCalendarNotificationTrigger` — there is no
 * way to schedule a repeating OS-level notification for a future date/time
 * from a page. Instead we persist the preference (see `$lib/stores/settings`)
 * and, on every app open/foreground, check whether today's scheduled slot has
 * passed and hasn't fired yet; if so we show a `Notification` immediately.
 * This mirrors the "otherwise fire on app open if due" fallback the native
 * scheduler doesn't need but the web port does.
 */

export interface Weekday {
	/** 0=Sunday…6=Saturday, matching `Date#getDay()`. */
	value: number;
	shortSymbol: string;
	label: string;
}

export const WEEKDAYS: Weekday[] = [
	{ value: 0, shortSymbol: 'S', label: 'Sunday' },
	{ value: 1, shortSymbol: 'M', label: 'Monday' },
	{ value: 2, shortSymbol: 'T', label: 'Tuesday' },
	{ value: 3, shortSymbol: 'W', label: 'Wednesday' },
	{ value: 4, shortSymbol: 'T', label: 'Thursday' },
	{ value: 5, shortSymbol: 'F', label: 'Friday' },
	{ value: 6, shortSymbol: 'S', label: 'Saturday' }
];

/** Default nudge time: 6:00 PM, a common post-work training slot. */
export const FALLBACK_REMINDER_HOUR = 18;
export const FALLBACK_REMINDER_MINUTE = 0;

const NOTIFICATION_TAG = 'bane-workout-reminder';

/** Packs a set of weekday values into a single bitmask, for storage. */
export function weekdayMask(days: Iterable<number>): number {
	let mask = 0;
	for (const d of days) mask |= 1 << d;
	return mask;
}

/** Mon / Wed / Fri out of the box, mirroring Bane's default cadence. */
export const FALLBACK_REMINDER_WEEKDAY_MASK = weekdayMask([1, 3, 5]);

export function notificationsSupported(): boolean {
	return typeof window !== 'undefined' && 'Notification' in window;
}

/** Requests notification permission if not already decided. Safe to call repeatedly. */
export async function requestReminderPermission(): Promise<NotificationPermission> {
	if (!notificationsSupported()) return 'denied';
	if (Notification.permission !== 'default') return Notification.permission;
	return Notification.requestPermission();
}

function dateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Pure due-check: true when today is a selected weekday, the scheduled
 * hour/minute has passed, and it hasn't already fired today. Unit-testable
 * without the Notification API, mirroring the native scheduler's split
 * between pure request-building and the `sync` side effect.
 */
export function isReminderDue(params: {
	hour: number;
	minute: number;
	weekdayMask: number;
	lastFiredOn: string | null;
	now: Date;
}): boolean {
	const { hour, minute, weekdayMask: mask, lastFiredOn, now } = params;
	if ((mask & (1 << now.getDay())) === 0) return false;
	if (lastFiredOn === dateKey(now)) return false;
	const scheduled = new Date(now);
	scheduled.setHours(hour, minute, 0, 0);
	return now >= scheduled;
}

function showReminderNotification(): void {
	if (!notificationsSupported() || Notification.permission !== 'granted') return;
	new Notification('Time to train', {
		body: "Your workout is waiting — let's move.",
		tag: NOTIFICATION_TAG
	});
}

/**
 * Reconciles the reminder with "now": shows the notification if due, and
 * returns the date it fired on so the caller can persist it (preventing a
 * repeat later in the same day). Returns `null` when nothing fired.
 */
export function syncReminders(
	settings: {
		reminderEnabled: boolean;
		reminderHour: number;
		reminderMinute: number;
		reminderWeekdayMask: number;
		reminderLastFiredOn: string | null;
	},
	now = new Date()
): string | null {
	if (!settings.reminderEnabled) return null;
	const due = isReminderDue({
		hour: settings.reminderHour,
		minute: settings.reminderMinute,
		weekdayMask: settings.reminderWeekdayMask,
		lastFiredOn: settings.reminderLastFiredOn,
		now
	});
	if (!due) return null;
	showReminderNotification();
	return dateKey(now);
}
