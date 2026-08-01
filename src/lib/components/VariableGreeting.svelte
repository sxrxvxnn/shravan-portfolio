<script lang="ts">
	import { onMount } from 'svelte';

	interface Props { text: string; }
	let { text }: Props = $props();

	let containerEl: HTMLElement;

	onMount(() => {
		const chars = containerEl.querySelectorAll<HTMLElement>('.vf-char');

		const onMove = (e: MouseEvent) => {
			chars.forEach((char) => {
				const rect = char.getBoundingClientRect();
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
				const maxDist = 300;
				const t = Math.max(0, 1 - dist / maxDist);
				const weight = Math.round(200 + t * 700); // 200 → 900
				const width = Math.round(75 + t * 50);    // 75 → 125 (if wdth axis)
				char.style.fontVariationSettings = `'wght' ${weight}`;
				char.style.letterSpacing = `${-0.02 + t * -0.02}em`;
				char.style.color = dist < 80 ? '#1DB954' : '#fff';
			});
		};

		window.addEventListener('mousemove', onMove);
		return () => window.removeEventListener('mousemove', onMove);
	});
</script>

<span class="vf-text" bind:this={containerEl} aria-label={text}>
	{#each text.split('') as ch}
		{#if ch === ' '}
			<span class="vf-space"> </span>
		{:else}
			<span class="vf-char">{ch}</span>
		{/if}
	{/each}
</span>

<style>
	.vf-text { display: inline; }

	.vf-char {
		display: inline-block;
		font-variation-settings: 'wght' 900;
		transition: font-variation-settings 0.12s ease, color 0.1s, letter-spacing 0.1s;
		will-change: font-variation-settings;
	}

	.vf-space { display: inline-block; width: 0.28em; }
</style>
