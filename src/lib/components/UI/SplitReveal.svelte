<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	interface Props {
		text: string;
		tag?: 'h1' | 'h2' | 'p';
		delay?: number;
		duration?: number;
		class?: string;
	}

	let { text, tag = 'h1', delay = 0, duration = 0.9, class: cls = '' }: Props = $props();

	let wrapEl: HTMLElement;

	onMount(() => {
		// Split text into word spans, each word wrapped in a clip container
		const words = text.split(' ');
		wrapEl.innerHTML = words.map(w =>
			`<span class="sr-word"><span class="sr-inner">${w}</span></span>`
		).join(' ');

		const inners = wrapEl.querySelectorAll<HTMLElement>('.sr-inner');
		gsap.fromTo(inners,
			{ yPercent: 105 },
			{
				yPercent: 0,
				duration,
				delay,
				ease: 'cubic-bezier(0.9, 0, 0.1, 1)',
				stagger: 0.06,
			}
		);
	});
</script>

{#if tag === 'h1'}
	<h1 bind:this={wrapEl} class={cls}>{text}</h1>
{:else if tag === 'h2'}
	<h2 bind:this={wrapEl} class={cls}>{text}</h2>
{:else}
	<p bind:this={wrapEl} class={cls}>{text}</p>
{/if}

<style>
	:global(.sr-word) {
		display: inline-block;
		overflow: hidden;
		vertical-align: bottom;
	}
	:global(.sr-inner) {
		display: inline-block;
		will-change: transform;
	}
</style>
