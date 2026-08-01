<script lang="ts">
	import { player, togglePlay, PROJECT_COLORS } from '$lib/stores/player.svelte.js';
	import { resume } from '$lib/data/resume.js';

	let trackNameEl: HTMLElement;
	let scrambleTimer: ReturnType<typeof setInterval>;

	// text scramble on track change
	$effect(() => {
		const target = player.trackName;
		if (!trackNameEl) return;
		clearInterval(scrambleTimer);
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
		let frame = 0;
		const total = 18;
		scrambleTimer = setInterval(() => {
			trackNameEl.textContent = target.split('').map((ch, i) =>
				i < (frame / total) * target.length ? ch : chars[Math.floor(Math.random() * chars.length)]
			).join('');
			frame++;
			if (frame > total) {
				trackNameEl.textContent = target;
				clearInterval(scrambleTimer);
			}
		}, 35);
	});

	// auto-advance progress
	$effect(() => {
		if (!player.playing) return;
		const timer = setInterval(() => {
			if (player.progress >= 1) {
				nextTrack();
			} else {
				player.progress = Math.min(1, player.progress + 0.0005);
			}
		}, 100);
		return () => clearInterval(timer);
	});

	function setProgress(e: MouseEvent) {
		const bar = (e.currentTarget as HTMLElement).getBoundingClientRect();
		player.progress = Math.max(0, Math.min(1, (e.clientX - bar.left) / bar.width));
	}

	function setVolume(e: MouseEvent) {
		const bar = (e.currentTarget as HTMLElement).getBoundingClientRect();
		player.volume = Math.max(0, Math.min(1, (e.clientX - bar.left) / bar.width));
	}

	const projects = resume.projects;
	function nextTrack() {
		const idx = projects.findIndex(p => p.name === player.trackName);
		const next = projects[(idx + 1) % projects.length];
		player.trackName = next.name;
		player.artist = next.tech.slice(0, 2).join(' · ');
		player.color = PROJECT_COLORS[next.name] ?? '#1DB954';
		player.progress = 0;
	}
	function prevTrack() {
		const idx = projects.findIndex(p => p.name === player.trackName);
		const prev = projects[(idx - 1 + projects.length) % projects.length];
		player.trackName = prev.name;
		player.artist = prev.tech.slice(0, 2).join(' · ');
		player.color = PROJECT_COLORS[prev.name] ?? '#1DB954';
		player.progress = 0;
	}
</script>

<footer class="now-playing-bar">
	<!-- Left: Track info -->
	<div class="track-info">
		<!-- Spinning vinyl -->
		<div class="vinyl-wrap" class:spinning={player.playing}>
			<svg viewBox="0 0 100 100" width="56" height="56" class="vinyl-svg">
				<circle cx="50" cy="50" r="49" fill="#111"/>
				<circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>
				<circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>
				<circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5"/>
				<circle cx="50" cy="50" r="27" fill={player.color} opacity="0.9"/>
				<circle cx="50" cy="50" r="27" fill="url(#vshine)"/>
				<circle cx="50" cy="50" r="5" fill="#111"/>
				<defs>
					<radialGradient id="vshine" cx="38%" cy="32%">
						<stop offset="0%" stop-color="white" stop-opacity="0.25"/>
						<stop offset="100%" stop-color="white" stop-opacity="0"/>
					</radialGradient>
				</defs>
			</svg>
		</div>
		<div class="track-text">
			<span class="track-name" bind:this={trackNameEl}>{player.trackName}</span>
			<span class="track-artist">{player.artist}</span>
		</div>
		<button class="icon-btn heart" aria-label="Save" title="Save">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
		</button>
	</div>

	<!-- Center: Controls -->
	<div class="controls">
		<div class="control-buttons">
			<button class="icon-btn" onclick={prevTrack} aria-label="Previous">
				<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 20L9 12l10-8v16z M5 19V5h2v14H5z"/></svg>
			</button>

			<button class="play-btn" onclick={togglePlay} aria-label={player.playing ? 'Pause' : 'Play'}>
				{#if player.playing}
					<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><polygon points="5 3 19 12 5 21 5 3"/></svg>
				{/if}
			</button>

			<button class="icon-btn" onclick={nextTrack} aria-label="Next">
				<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M5 4l10 8-10 8V4z M19 5v14h-2V5h2z"/></svg>
			</button>
		</div>

		<div class="progress-row">
			<span class="time">{player.elapsed}</span>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="progress-bar" onclick={setProgress} role="slider" aria-label="Playback progress" aria-valuenow={Math.round(player.progress * 100)} tabindex="0">
				<div class="progress-track">
					<div class="progress-fill" style="width: {player.progress * 100}%; background: {player.color};"></div>
					<div class="progress-thumb" style="left: {player.progress * 100}%; background: {player.color};"></div>
				</div>
			</div>
			<span class="time">{player.duration}</span>
		</div>

		<!-- Waveform bars (animated when playing) -->
		{#if player.playing}
			<div class="waveform" aria-hidden="true" style="--c: {player.color}">
				{#each Array(5) as _, i}
					<div class="wave-bar" style="animation-delay: {i * 0.12}s"></div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Right: Volume -->
	<div class="volume-area">
		<button class="icon-btn" aria-label="Queue">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
		</button>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="progress-bar vol" onclick={setVolume} role="slider" aria-label="Volume" aria-valuenow={Math.round(player.volume * 100)} tabindex="0">
			<div class="progress-track">
				<div class="progress-fill" style="width: {player.volume * 100}%"></div>
				<div class="progress-thumb" style="left: {player.volume * 100}%"></div>
			</div>
		</div>
	</div>
</footer>

<style>
	.now-playing-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 90px;
		background: #181818;
		border-top: 1px solid rgba(255,255,255,0.1);
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		align-items: center;
		padding: 0 16px;
		z-index: 100;
		gap: 16px;
	}

	/* Track info */
	.track-info {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.vinyl-wrap {
		width: 56px;
		height: 56px;
		flex-shrink: 0;
		border-radius: 50%;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0,0,0,0.5);
	}

	.vinyl-svg {
		animation: vinyl-spin 3s linear infinite;
		animation-play-state: paused;
		display: block;
	}

	.vinyl-wrap.spinning .vinyl-svg {
		animation-play-state: running;
	}

	@keyframes vinyl-spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.track-text {
		min-width: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.track-name {
		font-size: 13px;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-artist {
		font-size: 11px;
		color: #B3B3B3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Controls */
	.controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.control-buttons {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.icon-btn {
		background: none;
		border: none;
		color: #B3B3B3;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: color 0.15s;
		display: flex;
		align-items: center;
	}
	.icon-btn:hover { color: #fff; }
	.icon-btn.heart:hover { color: #1DB954; }

	.play-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #fff;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #000;
		transition: transform 0.1s, background 0.15s;
	}
	.play-btn:hover { transform: scale(1.06); background: #f0f0f0; }

	.progress-row {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		max-width: 480px;
	}

	.time {
		font-size: 11px;
		color: #B3B3B3;
		font-variant-numeric: tabular-nums;
		min-width: 32px;
	}
	.time:last-child { text-align: right; }

	.progress-bar {
		flex: 1;
		height: 16px;
		display: flex;
		align-items: center;
		cursor: pointer;
	}
	.progress-bar.vol { max-width: 94px; }

	.progress-track {
		width: 100%;
		height: 4px;
		background: rgba(255,255,255,0.2);
		border-radius: 2px;
		position: relative;
	}

	.progress-bar:hover .progress-track { background: rgba(255,255,255,0.3); }

	.progress-fill {
		height: 100%;
		border-radius: 2px;
		background: #fff;
		transition: width 0.1s;
	}
	.progress-bar:hover .progress-fill { background: #1DB954 !important; }

	.progress-thumb {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #fff;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.progress-bar:hover .progress-thumb { opacity: 1; }

	/* Waveform */
	.waveform {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 12px;
		position: absolute;
		right: 0;
		bottom: 50%;
		transform: translateY(50%);
		pointer-events: none;
	}

	.wave-bar {
		width: 3px;
		border-radius: 2px;
		background: var(--c, #1DB954);
		animation: wave 0.8s ease-in-out infinite alternate;
		height: 4px;
	}

	@keyframes wave {
		to { height: 14px; }
	}

	/* Volume area */
	.volume-area {
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: flex-end;
		color: #B3B3B3;
	}

	@media (max-width: 768px) {
		.now-playing-bar {
			grid-template-columns: 1fr auto;
			padding: 0 12px;
		}
		.controls { display: none; }
		.volume-area { display: none; }
	}
</style>
