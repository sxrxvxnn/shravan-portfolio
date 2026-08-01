<script lang="ts">
	import { onMount } from 'svelte';
	import { loading } from '$lib/stores/scene.svelte.js';

	let exiting = $state(false);
	let hidden = $state(false);

	// Tab title typing animation
	onMount(() => {
		const name = 'Shravan Omanakuttan';
		let i = 0;
		const t = setInterval(() => {
			document.title = name.slice(0, i) + (i <= name.length ? '▌' : '');
			i++;
			if (i > name.length + 2) {
				clearInterval(t);
				document.title = 'Shravan Omanakuttan — Portfolio';
			}
		}, 75);
		return () => clearInterval(t);
	});

	// Trigger curtain exit when loading finishes
	$effect(() => {
		if (loading.done && !exiting) {
			exiting = true;
			setTimeout(() => { hidden = true; }, 900);
		}
	});

	function digits(n: number): [number, number, number] {
		const c = Math.min(100, Math.max(0, Math.round(n)));
		return [Math.floor(c / 100), Math.floor((c % 100) / 10), c % 10];
	}
	function offset(d: number) { return `translateY(${-d}em)`; }
</script>

{#if !hidden}
	<div class="preloader" class:exiting role="status" aria-live="polite" aria-label="Loading">
		<div class="counter-wrap">
			{#each digits(loading.progress) as d}
				<div class="digit-col">
					<div class="digit-strip" style="transform: {offset(d)}">
						{#each [0,1,2,3,4,5,6,7,8,9] as n}
							<div class="digit-cell">{n}</div>
						{/each}
					</div>
				</div>
			{/each}
			<div class="pct-label">%</div>
		</div>
		<div class="hint">{loading.hint}</div>
		<div class="bar-wrap"><div class="bar" style="transform: scaleX({loading.progress / 100})"></div></div>
	</div>
{/if}

<style>
	.preloader {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 28px;
		background: #0d0d1a;
		color: #fff;
	}

	/* Curtain wipe upward on exit */
	.preloader.exiting {
		animation: curtainUp 0.85s cubic-bezier(0.76, 0, 0.24, 1) forwards;
	}
	@keyframes curtainUp {
		0%   { clip-path: inset(0 0 0% 0); }
		100% { clip-path: inset(0 0 100% 0); }
	}

	.counter-wrap {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		font-family: 'Courier New', monospace;
		font-size: clamp(64px, 14vw, 120px);
		font-weight: 700;
		line-height: 1;
		height: 1em;
		overflow: hidden;
		letter-spacing: -0.04em;
		color: #c8d8ff;
	}

	.digit-col {
		height: 1em;
		overflow: hidden;
	}

	.digit-strip {
		display: flex;
		flex-direction: column;
		transition: transform 0.35s cubic-bezier(0.34, 1.14, 0.64, 1);
		will-change: transform;
	}

	.digit-cell {
		height: 1em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pct-label {
		font-size: clamp(24px, 5vw, 44px);
		font-weight: 400;
		color: rgba(200, 216, 255, 0.5);
		padding-bottom: 0.1em;
		margin-left: 4px;
	}

	.hint {
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.35);
	}

	.bar-wrap {
		width: min(280px, 60vw);
		height: 2px;
		background: rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}

	.bar {
		height: 100%;
		background: linear-gradient(90deg, #6699ff, #aa88ff);
		transform-origin: left;
		transition: transform 0.4s ease;
	}
</style>
