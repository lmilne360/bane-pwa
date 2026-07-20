import type { Workout } from '$lib/types';
import { streaks } from './streaks';

/**
 * Achievement badges derived live from workout history, ported from Bane's
 * `Achievements`. Pure — badges reflect current history with no persisted state
 * beyond which earned badges the user has already *seen* (see the settings
 * store's `seenAchievements`, mirroring Bane's `AchievementsSeenStore`).
 */

export type AchievementCategory = 'milestone' | 'streak' | 'record';

export const CATEGORY_TITLE: Record<AchievementCategory, string> = {
	milestone: 'Milestones',
	streak: 'Streaks',
	record: 'Records'
};

export interface Achievement {
	id: string;
	category: AchievementCategory;
	title: string;
	detail: string;
	/** Emoji/icon glyph (web stand-in for the native SF Symbol). */
	icon: string;
	isEarned: boolean;
	/** 0…1, always 1 once earned. */
	progress: number;
	/** e.g. "7 / 10" while unearned, else null. */
	progressText: string | null;
}

interface Milestone {
	target: number;
	title: string;
	icon: string;
}

const WORKOUT_MILESTONES: Milestone[] = [
	{ target: 1, title: 'First Workout', icon: '🏋️' },
	{ target: 10, title: '10 Workouts', icon: '🔟' },
	{ target: 25, title: '25 Workouts', icon: '💪' },
	{ target: 50, title: '50 Workouts', icon: '🏅' },
	{ target: 100, title: 'Century', icon: '👑' }
];

const STREAK_MILESTONES: Milestone[] = [
	{ target: 7, title: '7-Day Streak', icon: '🔥' },
	{ target: 30, title: '30-Day Streak', icon: '🔥' }
];

function countAchievement(
	id: string,
	category: AchievementCategory,
	title: string,
	unit: string,
	icon: string,
	count: number,
	target: number
): Achievement {
	const isEarned = count >= target;
	const plural = target === 1 ? unit : `${unit}s`;
	return {
		id,
		category,
		title,
		detail: `Log ${target} ${plural}.`,
		icon,
		isEarned,
		progress: target > 0 ? Math.min(1, count / target) : 1,
		progressText: isEarned ? null : `${Math.min(count, target)} / ${target}`
	};
}

/** All badges in display order, grouped by category. */
export function allAchievements(
	workouts: Workout[],
	hasPersonalRecord: boolean,
	today: Date = new Date()
): Achievement[] {
	const finishedCount = workouts.filter((w) => w.finishedAt).length;
	const bestStreak = streaks(workouts, today).best;

	const milestones = WORKOUT_MILESTONES.map((m) =>
		countAchievement(`workouts_${m.target}`, 'milestone', m.title, 'workout', m.icon, finishedCount, m.target)
	);

	const streakBadges = STREAK_MILESTONES.map((m) =>
		countAchievement(`streak_${m.target}`, 'streak', m.title, 'day', m.icon, bestStreak, m.target)
	);

	const record: Achievement = {
		id: 'record_first',
		category: 'record',
		title: 'Personal Record',
		detail: 'Set your first personal record.',
		icon: '🏆',
		isEarned: hasPersonalRecord,
		progress: hasPersonalRecord ? 1 : 0,
		progressText: null
	};

	return [...milestones, ...streakBadges, record];
}

export function earnedIds(
	workouts: Workout[],
	hasPersonalRecord: boolean,
	today: Date = new Date()
): Set<string> {
	return new Set(
		allAchievements(workouts, hasPersonalRecord, today)
			.filter((a) => a.isEarned)
			.map((a) => a.id)
	);
}
