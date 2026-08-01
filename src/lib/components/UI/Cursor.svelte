<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { focus } from '$lib/stores/scene.svelte.js';

	let ringEl: HTMLDivElement;
	let dotEl: HTMLDivElement;
	let visible = $state(false);
	let isTouch = $state(true);

	const LABELS: Record<string, string> = {
		laptop: 'VIEW',
		bookshelf: 'EXPLORE',
		frame: 'READ',
		character: 'TALK',
	};

	let label = $derived(focus.key ? LABELS[focus.key] ?? '' : '');

	onMount(() => {
		isTouch = 'ontouchstart' in window;
		if (isTouch) return;

		const xRing = gsap.quickTo(ringEl, 'x', { duration: 0.45, ease: 'power3.out' });
		const yRing = gsap.quickTo(ringEl, 'y', { duration: 0.45, ease: 'power3.out' });
		const xDot  = gsap.quickTo(dotEl,  'x', { duration: 0.1,  ease: 'power3.out' });
		const yDot  = gsap.quickTo(dotEl,  'y', { duration: 0.1,  ease: 'power3.out' });

		const move = (e: MouseEvent) => {
			if (!visible) visible = true;
			xRing(e.clientX); yRing(e.clientY);
			xDot(e.clientX);  yDot(e.clientY);
		};

		const enter = () => { visible = true; };
		const leave = () => { visible = false; };

		window.addEventListener('mousemove', move);
		document.addEventListener('mouseenter', enter);
		document.addEventListener('mouseleave', leave);

		return () => {
			window.removeEventListener('mousemove', move);
			document.removeEventListener('mouseenter', enter);
			document.removeEventListener('mouseleave', leave);
		};
	});
</script>

{#if !isTouch}
	<div class="cursor-ring" bind:this={ringEl} class:visible class:labeled={!!label}>
		{#if label}<span class="cursor-label">{label}</span>{/if}
	</div>
	<div class="cursor-dot" bind:this={dotEl} class:visible></div>
{/if}

<style>
	:global(body) { cursor: none; }
	:global(a, button, [role="button"]) { cursor: none; }

	.cursor-ring {
		position: fixed;
		top: 0; left: 0;
		width: 36px; height: 36px;
		border: 1.5px solid rgba(200, 216, 255, 0.6);
		border-radius: 50%;
		pointer-events: none;
		z-index: 9999;
		transform: translate(-50%, -50%);
		transition: width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background 0.2s ease;
		display: flex; align-items: center; justify-content: center;
		opacity: 0;
	}
	.cursor-ring.visible { opacity: 1; }
	.cursor-ring.labeled {
		width: 72px; height: 72px;
		background: rgba(124, 106, 247, 0.12);
		border-color: rgba(124, 106, 247, 0.7);
	}

	.cursor-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #b0a0ff;
		pointer-events: none;
		user-select: none;
		white-space: nowrap;
	}

	.cursor-dot {
		position: fixed;
		top: 0; left: 0;
		width: 6px; height: 6px;
		background: #c8d8ff;
		border-radius: 50%;
		pointer-events: none;
		z-index: 10000;
		transform: translate(-50%, -50%);
		opacity: 0;
		transition: opacity 0.2s;
	}
	.cursor-dot.visible { opacity: 1; }
</style>
