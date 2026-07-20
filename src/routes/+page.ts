import { redirect } from '@sveltejs/kit';

// Workouts is the home tab.
export function load() {
	redirect(307, '/workouts');
}
