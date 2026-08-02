<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { focus } from '$lib/stores/scene.svelte.js';

	let ringEl: HTMLDivElement;
	let dotEl: HTMLDivElement;
	let visible    = $state(false);
	let isTouch    = $state(true);
	let isHovering = $state(false);

	// Trail dots
	const TRAIL_COUNT = 6;
	let trailEls: HTMLDivElement[] = $state([]);

	const LABELS: Record<string, string> = {
		laptop: 'VIEW',
		bookshelf: 'EXPLORE',
		frame: 'READ',
		character: 'TALK',
	};

	let label = $derived(focus.key ? LABELS[focus.key] ?? '' : '');

	const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, .chip, .mob-send, .mob-nav, .proj-item, .sb-sound, .sb-music, [data-magnetic]';

	let mouseX = 0;
	let mouseY = 0;

	onMount(() => {
		isTouch = 'ontouchstart' in window;
		if (isTouch) return;

		const xRing = gsap.quickTo(ringEl, 'x', { duration: 0.45, ease: 'power3.out' });
		const yRing = gsap.quickTo(ringEl, 'y', { duration: 0.45, ease: 'power3.out' });
		const xDot  = gsap.quickTo(dotEl,  'x', { duration: 0.1,  ease: 'power3.out' });
		const yDot  = gsap.quickTo(dotEl,  'y', { duration: 0.1,  ease: 'power3.out' });

		// Trail quickTos — each subsequent one is slower, creating the trail
		const trailX = trailEls.map((el, i) => gsap.quickTo(el, 'x', { duration: 0.18 + i * 0.07, ease: 'power3.out' }));
		const trailY = trailEls.map((el, i) => gsap.quickTo(el, 'y', { duration: 0.18 + i * 0.07, ease: 'power3.out' }));

		const move = (e: MouseEvent) => {
			mouseX = e.clientX;
			mouseY = e.clientY;
			if (!visible) visible = true;
			xRing(e.clientX); yRing(e.clientY);
			xDot(e.clientX);  yDot(e.clientY);
			trailX.forEach((fn, i) => fn(e.clientX));
			trailY.forEach((fn, i) => fn(e.clientY));
		};

		const enter = () => { visible = true; };
		const leave = () => { visible = false; };

		const onOver = (e: MouseEvent) => {
			isHovering = !!(e.target as Element)?.closest(INTERACTIVE);
		};

		// Magnetic effect on [data-magnetic] elements
		const magneticCleanups: (() => void)[] = [];

		function setupMagnetic() {
			document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el => {
				const onEnter = () => {
					const rect = el.getBoundingClientRect();
					const cx   = rect.left + rect.width  / 2;
					const cy   = rect.top  + rect.height / 2;
					const pull = Math.min(rect.width, rect.height) * 0.28;

					const onMove = (ev: MouseEvent) => {
						const dx = (ev.clientX - cx) / (rect.width  / 2);
						const dy = (ev.clientY - cy) / (rect.height / 2);
						gsap.to(el, { x: dx * pull, y: dy * pull, duration: 0.35, ease: 'power2.out' });
					};
					window.addEventListener('mousemove', onMove);
					const cleanup = () => {
						window.removeEventListener('mousemove', onMove);
						gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
					};
					el.addEventListener('mouseleave', cleanup, { once: true });
				};
				el.addEventListener('mouseenter', onEnter);
				magneticCleanups.push(() => el.removeEventListener('mouseenter', onEnter));
			});
		}

		setupMagnetic();

		// Re-run magnetic setup when overlay opens (DOM changes)
		const observer = new MutationObserver(() => {
			magneticCleanups.forEach(fn => fn());
			magneticCleanups.length = 0;
			setupMagnetic();
		});
		observer.observe(document.body, { childList: true, subtree: false });

		window.addEventListener('mousemove', move);
		window.addEventListener('mouseover', onOver);
		document.addEventListener('mouseenter', enter);
		document.addEventListener('mouseleave', leave);

		return () => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseover', onOver);
			document.removeEventListener('mouseenter', enter);
			document.removeEventListener('mouseleave', leave);
			magneticCleanups.forEach(fn => fn());
			observer.disconnect();
		};
	});
</script>

{#if !isTouch}
	<!-- Trail dots (rendered first, below ring/dot) -->
	{#each { length: TRAIL_COUNT } as _, i}
		<div
			class="cursor-trail"
			bind:this={trailEls[i]}
			class:visible
			style="opacity:{visible ? Math.max(0, 1 - (i + 1) / (TRAIL_COUNT + 1)) * 0.45 : 0}; width:{Math.max(2, 5 - i)}px; height:{Math.max(2, 5 - i)}px;"
		></div>
	{/each}
	<div class="cursor-ring" bind:this={ringEl} class:visible class:labeled={!!label} class:hovering={isHovering}></div>
	<div class="cursor-dot"  bind:this={dotEl}  class:visible class:hovering={isHovering}>
		{#if label}<span class="cursor-label">{label}</span>{/if}
	</div>
{/if}

<style>
	:global(body) { cursor: none; }
	:global(a, button, [role="button"]) { cursor: none; }

	.cursor-ring {
		position: fixed; top: 0; left: 0;
		width: 34px; height: 34px;
		border: 1.5px solid rgba(200, 216, 255, 0.5);
		border-radius: 50%;
		pointer-events: none; z-index: 9999;
		transform: translate(-50%, -50%);
		transition:
			width 0.28s cubic-bezier(0.16,1,0.3,1),
			height 0.28s cubic-bezier(0.16,1,0.3,1),
			border-color 0.28s ease,
			background 0.28s ease,
			opacity 0.2s;
		display: flex; align-items: center; justify-content: center;
		opacity: 0;
	}
	.cursor-ring.visible  { opacity: 1; }
	.cursor-ring.hovering {
		width: 52px; height: 52px;
		border-color: var(--cursor-accent, rgba(250,189,47,0.85));
		background: color-mix(in srgb, var(--cursor-accent, #fabd2f) 8%, transparent);
		box-shadow: 0 0 14px var(--cursor-glow, rgba(250,189,47,0.3));
	}
	.cursor-ring.labeled {
		width: 72px; height: 72px;
		background: rgba(124, 106, 247, 0.12);
		border-color: rgba(124, 106, 247, 0.7);
	}

	.cursor-dot {
		position: fixed; top: 0; left: 0;
		width: 5px; height: 5px;
		background: var(--cursor-accent, #c8d8ff);
		border-radius: 50%;
		pointer-events: none; z-index: 10000;
		transform: translate(-50%, -50%);
		opacity: 0;
		transition: opacity 0.2s, width 0.2s, height 0.2s, background 0.2s;
	}
	.cursor-dot.visible   { opacity: 1; }
	.cursor-dot.hovering  {
		width: 7px; height: 7px;
		background: var(--cursor-accent, #fabd2f);
		box-shadow: 0 0 6px var(--cursor-glow, rgba(250,189,47,0.5));
	}

	.cursor-label {
		position: absolute;
		font-size: 10px; font-weight: 700;
		letter-spacing: 0.12em;
		color: #b0a0ff;
		pointer-events: none; user-select: none;
		white-space: nowrap;
	}

	.cursor-trail {
		position: fixed; top: 0; left: 0;
		border-radius: 50%;
		background: var(--cursor-accent, #c8d8ff);
		pointer-events: none; z-index: 9998;
		transform: translate(-50%, -50%);
		transition: opacity 0.2s;
	}

	@media (prefers-reduced-motion: reduce) {
		.cursor-ring, .cursor-dot, .cursor-trail { transition: none; }
	}
</style>
