<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	interface Props {
		strength?: number;
		children?: import('svelte').Snippet;
	}
	let { strength = 0.45, children }: Props = $props();

	let el: HTMLElement;

	onMount(() => {
		const move = (e: MouseEvent) => {
			const r = el.getBoundingClientRect();
			const dx = e.clientX - (r.left + r.width / 2);
			const dy = e.clientY - (r.top + r.height / 2);
			gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.25, ease: 'power2.out' });
		};
		const leave = () => {
			gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
		};
		el.addEventListener('mousemove', move);
		el.addEventListener('mouseleave', leave);
		return () => {
			el.removeEventListener('mousemove', move);
			el.removeEventListener('mouseleave', leave);
		};
	});
</script>

<div class="mag" bind:this={el}>
	{@render children?.()}
</div>

<style>
	.mag { display: inline-block; will-change: transform; }
</style>
