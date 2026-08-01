<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	let dot: HTMLDivElement;
	let label: HTMLDivElement;
	let labelText = $state('');

	onMount(() => {
		gsap.set(dot,   { xPercent: -50, yPercent: -50 });
		gsap.set(label, { xPercent: 0,   yPercent: -50 });

		const move = (e: MouseEvent) => {
			gsap.to(dot,   { x: e.clientX, y: e.clientY, duration: 0.06, ease: 'none' });
			gsap.to(label, { x: e.clientX + 14, y: e.clientY, duration: 0.12, ease: 'power2.out' });
		};

		const over = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a');
			const btn  = target.closest('button');
			if (link) {
				labelText = link.getAttribute('href')?.startsWith('mailto') ? 'mail' : 'open';
				gsap.to(dot, { scale: 1.6, duration: 0.2 });
			} else if (btn) {
				labelText = 'click';
				gsap.to(dot, { scale: 1.6, duration: 0.2 });
			} else {
				labelText = '';
				gsap.to(dot, { scale: 1, duration: 0.2 });
			}
		};

		window.addEventListener('mousemove', move);
		window.addEventListener('mouseover', over);
		return () => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseover', over);
		};
	});
</script>

<div class="cursor-dot"   bind:this={dot}></div>
<div class="cursor-label" bind:this={label}>{labelText}</div>

<style>
	.cursor-dot {
		position: fixed; top: 0; left: 0;
		width: 6px; height: 6px;
		background: #fabd2f;
		border-radius: 50%;
		pointer-events: none;
		z-index: 99999;
		box-shadow: 0 0 8px rgba(250,189,47,0.9), 0 0 20px rgba(250,189,47,0.4);
		mix-blend-mode: screen;
	}
	.cursor-label {
		position: fixed; top: 0; left: 0;
		font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
		font-size: 9px; font-weight: 700;
		letter-spacing: 0.12em; text-transform: uppercase;
		color: #fabd2f;
		pointer-events: none;
		z-index: 99998;
		opacity: 0.8;
		white-space: nowrap;
	}
	@media (hover: none) {
		.cursor-dot, .cursor-label { display: none; }
	}
</style>
