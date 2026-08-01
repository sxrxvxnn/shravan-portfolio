<script lang="ts">
	import { onMount } from 'svelte';

	interface Props { target: string; duration?: number; }
	let { target, duration = 1200 }: Props = $props();

	let el: HTMLElement;

	onMount(() => {
		const num = parseFloat(target.replace(/[^0-9.]/g, ''));
		const suffix = target.replace(/[0-9.]/g, '');
		if (isNaN(num)) { el.textContent = target; return; }

		const obs = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			obs.disconnect();
			const start = performance.now();
			const tick = (now: number) => {
				const t = Math.min(1, (now - start) / duration);
				const ease = 1 - Math.pow(1 - t, 3);
				el.textContent = Math.floor(ease * num) + suffix;
				if (t < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		}, { threshold: 0.5 });
		obs.observe(el);
	});
</script>

<span bind:this={el}>{target}</span>
