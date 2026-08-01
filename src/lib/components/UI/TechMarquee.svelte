<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	interface Props {
		items?: string[];
		speed?: number;
		direction?: 1 | -1;
	}

	let {
		items = ['SvelteKit', 'Three.js', 'FastAPI', 'Supabase', 'Groq', 'Playwright', 'TypeScript', 'React', 'Python', 'Vercel', 'GSAP', 'PostgreSQL', 'Chrome MV3', 'Firecrawl', 'PostHog'],
		speed = 28,
		direction = 1
	}: Props = $props();

	let trackEl: HTMLDivElement;
	let hovering = false;
	let tween: gsap.core.Tween;

	onMount(() => {
		const track = trackEl;
		const singleWidth = track.scrollWidth / 2;

		tween = gsap.to(track, {
			x: direction > 0 ? -singleWidth : singleWidth,
			duration: speed,
			ease: 'none',
			repeat: -1,
			modifiers: {
				x(x) {
					const val = parseFloat(x);
					return direction > 0
						? ((val % singleWidth) - singleWidth) + 'px'
						: (((val % singleWidth) + singleWidth) % singleWidth) + 'px';
				}
			}
		});

		return () => tween?.kill();
	});

	function onEnter(e: MouseEvent) {
		hovering = true;
		const el = (e.currentTarget as HTMLElement);
		const edge = e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2 ? -1 : 1;
		gsap.to(tween, { timeScale: 0, duration: 0.4, ease: 'power2.out',
			onUpdate() {
				if (!hovering) gsap.to(tween, { timeScale: direction, duration: 0.6, ease: 'power2.out' });
			}
		});
		void edge; // reserved for future directional reveal
	}

	function onLeave() {
		hovering = false;
		gsap.to(tween, { timeScale: direction, duration: 0.6, ease: 'power2.out' });
	}
</script>

<div
	class="marquee-wrap"
	role="marquee"
	aria-label="Tech stack"
	onmouseenter={onEnter}
	onmouseleave={onLeave}
>
	<div bind:this={trackEl} class="marquee-track">
		{#each [...items, ...items] as item}
			<span class="marquee-item">
				<span class="dot" aria-hidden="true"></span>
				{item}
			</span>
		{/each}
	</div>
</div>

<style>
	.marquee-wrap {
		overflow: hidden;
		width: 100%;
		padding: 18px 0;
		border-top: 1px solid rgba(255,255,255,0.07);
		border-bottom: 1px solid rgba(255,255,255,0.07);
		cursor: default;
		user-select: none;
	}

	.marquee-track {
		display: flex;
		align-items: center;
		gap: 0;
		width: max-content;
		will-change: transform;
	}

	.marquee-item {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 0 32px;
		font-size: 13px;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(200, 216, 255, 0.5);
		white-space: nowrap;
		transition: color 0.2s;
	}

	.marquee-wrap:hover .marquee-item { color: rgba(200, 216, 255, 0.8); }

	.dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(124, 106, 247, 0.6);
		flex-shrink: 0;
	}
</style>
