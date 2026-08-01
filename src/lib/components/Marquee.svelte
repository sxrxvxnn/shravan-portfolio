<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	interface Props {
		items: string[];
		speed?: number;
		reverse?: boolean;
	}
	let { items, speed = 30, reverse = false }: Props = $props();

	let track: HTMLElement;

	onMount(() => {
		const totalWidth = track.scrollWidth / 2;
		gsap.to(track, {
			x: reverse ? totalWidth : -totalWidth,
			duration: totalWidth / speed,
			ease: 'none',
			repeat: -1,
		});
	});
</script>

<div class="marquee-wrap" aria-hidden="true">
	<div class="marquee-track" bind:this={track}>
		{#each [...items, ...items] as item}
			<span class="marquee-item">
				{item}
				<span class="marquee-dot">·</span>
			</span>
		{/each}
	</div>
</div>

<style>
	.marquee-wrap {
		overflow: hidden;
		width: 100%;
		padding: 20px 0;
		border-top: 1px solid rgba(0, 229, 255, 0.07);
		border-bottom: 1px solid rgba(0, 229, 255, 0.07);
	}

	.marquee-track {
		display: flex;
		align-items: center;
		white-space: nowrap;
		will-change: transform;
	}

	.marquee-item {
		display: inline-flex;
		align-items: center;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.22);
		padding: 0 24px;
		transition: color 0.2s;
		cursor: default;
	}

	.marquee-item:hover { color: #00e5ff; }

	.marquee-dot {
		margin-left: 24px;
		color: rgba(0, 229, 255, 0.3);
	}
</style>
