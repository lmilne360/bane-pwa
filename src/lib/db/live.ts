import { liveQuery } from 'dexie';
import { readable, type Readable } from 'svelte/store';

/**
 * Wraps a Dexie `liveQuery` as a Svelte-readable store, so components can use
 * `$store` auto-subscription and re-render whenever the underlying IndexedDB
 * data changes. Dexie's observable isn't a plain Svelte store (its `subscribe`
 * returns a `Subscription`, not a function), so we adapt it here.
 */
export function live<T>(querier: () => T | Promise<T>, initial: T): Readable<T> {
	return readable<T>(initial, (set) => {
		const subscription = liveQuery(querier).subscribe({
			next: (value) => set(value as T),
			error: (err) => console.error('liveQuery error', err)
		});
		return () => subscription.unsubscribe();
	});
}
