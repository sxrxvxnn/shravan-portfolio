<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	interface Props {
		class?: string;
		children: any;
	}

	let { class: cls = '', children }: Props = $props();
	let cardEl: HTMLDivElement;
	let glowEl: HTMLDivElement;

	onMount(() => {
		const card = cardEl;

		function onMove(e: MouseEvent) {
			const rect = card.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = (e.clientX - cx) / (rect.width / 2);
			const dy = (e.clientY - cy) / (rect.height / 2);
			gsap.to(card, {
				rotateY: dx * 12,
				rotateX: -dy * 8,
				scale: 1.025,
				duration: 0.4,
				ease: 'power2.out',
				transformPerspective: 800,
			});
			// Move glow spot
			gsap.to(glowEl, {
				x: (dx + 1) / 2 * 100 + '%',
				y: (dy + 1) / 2 * 100 + '%',
				opacity: 0.18,
				duration: 0.3,
				ease: 'power2.out',
			});
		}

		function onLeave() {
			gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.5)', transformPerspective: 800 });
			gsap.to(glowEl, { opacity: 0, duration: 0.4 });
		}

		card.addEventListener('mousemove', onMove);
		card.addEventListener('mouseleave', onLeave);

		return () => {
			card.removeEventListener('mousemove', onMove);
			card.removeEventListener('mouseleave', onLeave);
		};
	});
</script>

<div bind:this={cardEl} class="hover-card {cls}">
	<div bind:this={glowEl} class="card-glow" aria-hidden="true"></div>
	{@render children()}
</div>

<style>
	.hover-card {
		position: relative;
		transform-style: preserve-3d;
		will-change: transform;
		overflow: hidden;
	}

	.card-glow {
		position: absolute;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(124,106,247,0.6) 0%, transparent 70%);
		transform: translate(-50%, -50%);
		pointer-events: none;
		opacity: 0;
		transition: none;
		z-index: 1;
	}
</style>
