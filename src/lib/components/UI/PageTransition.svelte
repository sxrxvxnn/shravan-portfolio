<script lang="ts">
	import { onMount } from 'svelte';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import gsap from 'gsap';

	let svgEl: SVGSVGElement;
	let pathEls: SVGPathElement[] = [];
	let inited = false;

	function initPaths() {
		pathEls = Array.from(svgEl.querySelectorAll('path'));
		pathEls.forEach(p => {
			const len = p.getTotalLength();
			gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, attr: { 'stroke-width': 0 } });
		});
		inited = true;
	}

	onMount(() => { initPaths(); });

	// Leave: draw paths across screen (covers viewport)
	onNavigate(() => {
		if (!inited) return;
		return new Promise<void>(resolve => {
			const tl = gsap.timeline({ onComplete: resolve });
			pathEls.forEach((p, i) => {
				const len = p.getTotalLength();
				tl.fromTo(p,
					{ strokeDashoffset: len, attr: { 'stroke-width': 0 } },
					{ strokeDashoffset: 0, attr: { 'stroke-width': 130 }, duration: 0.72, ease: 'power2.inOut' },
					i * 0.06
				);
			});
		});
	});

	// Enter: erase paths (uncovers new page)
	afterNavigate(() => {
		if (!inited) return;
		pathEls.forEach((p, i) => {
			const len = p.getTotalLength();
			gsap.to(p, {
				strokeDashoffset: -len,
				attr: { 'stroke-width': 130 },
				duration: 0.65,
				delay: i * 0.05,
				ease: 'power2.inOut',
				onComplete: () => gsap.set(p, { strokeDashoffset: len, attr: { 'stroke-width': 0 } })
			});
		});
	});
</script>

<!-- Fixed SVG overlay — always present, only visible during nav transition -->
<svg
	bind:this={svgEl}
	class="page-transition-svg"
	viewBox="0 0 100 100"
	preserveAspectRatio="none"
	aria-hidden="true"
>
	<!-- Three horizontal strokes that expand in width to wipe the screen -->
	<path d="M -5 20 L 105 20" stroke="#0d0d1a" fill="none" />
	<path d="M -5 50 L 105 50" stroke="#0d0d1a" fill="none" />
	<path d="M -5 80 L 105 80" stroke="#0d0d1a" fill="none" />
</svg>

<style>
	.page-transition-svg {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 200;
	}
</style>
