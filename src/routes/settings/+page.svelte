<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { WEIGHT_UNITS, UNIT_DISPLAY_NAME } from '$lib/services/weight';
	import { WARMUP_SCHEMES } from '$lib/services/warmup';
	import { SELECTABLE_PLATES, BAR_PRESETS, formatPlate } from '$lib/services/plates';
	import { WEEKDAYS, notificationsSupported, requestReminderPermission } from '$lib/services/reminders';
	import { db } from '$lib/db/db';

	let fileInput: HTMLInputElement | undefined = $state();

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	function toggleReminderDay(value: number) {
		settings.reminderWeekdayMask ^= 1 << value;
	}

	function onReminderTimeChange(e: Event) {
		const [h, m] = (e.currentTarget as HTMLInputElement).value.split(':').map(Number);
		settings.reminderHour = h;
		settings.reminderMinute = m;
	}

	async function onReminderToggle(e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		if (checked) {
			const permission = await requestReminderPermission();
			if (permission !== 'granted') {
				alert('Enable notifications for this site in your browser settings to get workout reminders.');
				(e.currentTarget as HTMLInputElement).checked = false;
				return;
			}
		}
		settings.reminderEnabled = checked;
	}

	function togglePlate(p: number) {
		const set = new Set(settings.plateAvailablePlates);
		if (set.has(p)) set.delete(p);
		else set.add(p);
		settings.plateAvailablePlates = [...set].sort((a, b) => b - a);
	}

	async function exportData() {
		const [exercises, workouts, routines, measurements] = await Promise.all([
			db.exercises.toArray(),
			db.workouts.toArray(),
			db.routines.toArray(),
			db.measurements.toArray()
		]);
		const payload = {
			version: 1,
			exportedAt: new Date().toISOString(),
			exercises,
			workouts,
			routines,
			measurements
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'bane-lite-backup.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function importFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			if (Array.isArray(data.exercises)) await db.exercises.bulkPut(data.exercises);
			if (Array.isArray(data.workouts)) await db.workouts.bulkPut(data.workouts);
			if (Array.isArray(data.routines)) await db.routines.bulkPut(data.routines);
			if (Array.isArray(data.measurements)) await db.measurements.bulkPut(data.measurements);
			alert('Import complete.');
		} catch {
			alert("Could not import that file.");
		} finally {
			input.value = '';
		}
	}

	async function eraseAll() {
		if (!confirm('Erase all data? This cannot be undone.')) return;
		await Promise.all([
			db.exercises.clear(),
			db.workouts.clear(),
			db.routines.clear(),
			db.measurements.clear()
		]);
	}
</script>

<header class="page-header">
	<h1>Settings</h1>
</header>

<div class="page stack">
	<div>
		<div class="section-title">Units</div>
		<div class="card">
			<div class="pills">
				{#each WEIGHT_UNITS as u (u)}
					<button
						class="pill"
						aria-pressed={settings.weightUnit === u}
						onclick={() => (settings.weightUnit = u)}
					>
						{UNIT_DISPLAY_NAME[u]}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div>
		<div class="section-title">Rest Timer</div>
		<div class="card field">
			<label for="rest-sec">Default rest (seconds)</label>
			<input id="rest-sec" type="number" min="0" step="5" bind:value={settings.defaultRestSeconds} />
		</div>
	</div>

	<div>
		<div class="section-title">Warm-up</div>
		<div class="card stack">
			<div class="field">
				<label for="warmup-scheme">Scheme</label>
				<select id="warmup-scheme" bind:value={settings.warmupSchemeId}>
					{#each WARMUP_SCHEMES as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="warmup-round">Rounding</label>
				<input id="warmup-round" type="number" min="0" step="0.5" bind:value={settings.warmupRounding} />
			</div>
		</div>
	</div>

	<div>
		<div class="section-title">Plate Calculator</div>
		<div class="card stack">
			<div class="field">
				<label for="bar-weight">Bar weight</label>
				<select id="bar-weight" bind:value={settings.plateBarWeight}>
					{#each BAR_PRESETS as b (b)}<option value={b}>{formatPlate(b)}</option>{/each}
				</select>
			</div>
			<div class="field">
				<span id="plates-label">Available plates</span>
				<div class="pills" aria-labelledby="plates-label">
					{#each SELECTABLE_PLATES as p (p)}
						<button
							class="pill"
							aria-pressed={settings.plateAvailablePlates.includes(p)}
							onclick={() => togglePlate(p)}
						>
							{formatPlate(p)}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div>
		<div class="section-title">Reminders</div>
		<div class="card stack">
			<label class="hstack" style="justify-content:space-between">
				<span>Weekly workout reminders</span>
				<input
					type="checkbox"
					style="width:auto"
					checked={settings.reminderEnabled}
					onchange={onReminderToggle}
				/>
			</label>
			{#if !notificationsSupported()}
				<div class="faint" style="font-size:12px">
					Notifications aren't supported in this browser.
				</div>
			{:else}
				<div class="field">
					<label for="reminder-time">Time</label>
					<input
						id="reminder-time"
						type="time"
						value={`${pad(settings.reminderHour)}:${pad(settings.reminderMinute)}`}
						onchange={onReminderTimeChange}
					/>
				</div>
				<div>
					<span id="reminder-days-label">Days</span>
					<div class="pills" aria-labelledby="reminder-days-label">
						{#each WEEKDAYS as d (d.value)}
							<button
								class="pill"
								aria-pressed={(settings.reminderWeekdayMask & (1 << d.value)) !== 0}
								aria-label={d.label}
								onclick={() => toggleReminderDay(d.value)}
							>
								{d.shortSymbol}
							</button>
						{/each}
					</div>
				</div>
				<div class="faint" style="font-size:12px">
					Fires when you open the app at or after the scheduled time on a selected day.
				</div>
			{/if}
		</div>
	</div>

	<div>
		<div class="section-title">Data</div>
		<div class="card stack">
			<button class="btn btn-block" onclick={exportData}>Export data</button>
			<button class="btn btn-block" onclick={() => fileInput?.click()}>Import data</button>
			<input
				bind:this={fileInput}
				type="file"
				accept=".json"
				style="display:none"
				onchange={importFile}
			/>
			<button class="btn btn-block btn-danger" onclick={eraseAll}>Erase all data</button>
		</div>
	</div>
</div>
