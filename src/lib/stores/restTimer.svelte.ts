/**
 * Between-sets rest countdown, ported from Bane's `RestTimerController`.
 *
 * Tracks an absolute `endsAt` so the countdown stays accurate across ticks. On
 * the web the "background/locked" notification uses the Notifications API where
 * granted; the in-app cue is a short vibration (where supported).
 *
 * A single controller instance is shared app-wide — only one rest runs at once.
 */
class RestTimer {
	exerciseName = $state<string | null>(null);
	totalSeconds = $state(0);
	endsAt = $state<number | null>(null);
	/** Re-derived every tick so `remaining`/`progress` stay reactive. */
	now = $state(Date.now());

	#interval: ReturnType<typeof setInterval> | null = null;
	#signalled = false;

	get isRunning(): boolean {
		return this.endsAt !== null;
	}

	get remaining(): number {
		if (this.endsAt === null) return 0;
		return Math.max(0, Math.ceil((this.endsAt - this.now) / 1000));
	}

	get progress(): number {
		if (this.totalSeconds <= 0) return 1;
		const done = this.totalSeconds - (this.endsAt !== null ? (this.endsAt - this.now) / 1000 : 0);
		return Math.min(1, Math.max(0, done / this.totalSeconds));
	}

	start(seconds: number, exerciseName: string | null) {
		if (seconds <= 0) return;
		this.totalSeconds = seconds;
		this.exerciseName = exerciseName;
		this.endsAt = Date.now() + seconds * 1000;
		this.#signalled = false;
		this.#ensureTicking();
		this.#requestNotificationPermission();
	}

	extend(seconds: number) {
		if (this.endsAt === null) return;
		const base = Math.max(Date.now(), this.endsAt);
		this.endsAt = base + seconds * 1000;
		this.totalSeconds += seconds;
		this.#signalled = false;
		this.#ensureTicking();
	}

	stop() {
		this.endsAt = null;
		this.exerciseName = null;
		this.totalSeconds = 0;
		this.#signalled = false;
		if (this.#interval) {
			clearInterval(this.#interval);
			this.#interval = null;
		}
	}

	#ensureTicking() {
		if (this.#interval) return;
		this.#interval = setInterval(() => {
			this.now = Date.now();
			if (!this.#signalled && this.remaining === 0 && this.endsAt !== null) {
				this.#signalled = true;
				this.#signalComplete();
			}
		}, 250);
	}

	#signalComplete() {
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate?.([120, 60, 120]);
		}
		if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
			const body = this.exerciseName
				? `Time for your next set of ${this.exerciseName}.`
				: 'Time for your next set.';
			new Notification('Rest complete', { body });
		}
	}

	#requestNotificationPermission() {
		if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
			Notification.requestPermission().catch(() => {});
		}
	}
}

export const restTimer = new RestTimer();
