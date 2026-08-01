<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import type { ResumeProject } from '$lib/data/resume.js';
	import { PROJECT_COLORS, setTrack, player } from '$lib/stores/player.svelte.js';

	interface Props { projects: ResumeProject[]; }
	let { projects }: Props = $props();

	const slugMap: Record<string, string> = {
		'Sonar': 'sonar',
		'Lookalike Search Engine': 'lookalike',
		'LinkedIn DM Pipeline': 'linkedin-pipeline',
		'Sonar Chrome Extension': 'chrome-extension',
	};

	let wrapperEl: HTMLElement;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const cards = wrapperEl.querySelectorAll<HTMLElement>('.sc-card');
		const total = cards.length;
		const seg = 1 / total;
		const yOff = 5;
		const scaleStep = 0.065;

		cards.forEach((card, i) => {
			gsap.set(card, {
				yPercent: -50 + i * yOff,
				scale: 1 - i * scaleStep,
				transformOrigin: 'top center',
			});
		});

		ScrollTrigger.create({
			trigger: wrapperEl,
			start: 'top top',
			end: `+=${window.innerHeight * (total + 1.5)}px`,
			pin: true,
			pinSpacing: true,
			scrub: 1,
			onUpdate: (self) => {
				const p = self.progress;
				const ai = Math.min(Math.floor(p / seg), total - 1);
				const sp = (p - ai * seg) / seg;

				cards.forEach((card, i) => {
					if (i < ai) {
						gsap.set(card, { yPercent: -260, rotationX: 40, scale: 1 });
					} else if (i === ai) {
						gsap.set(card, {
							yPercent: gsap.utils.interpolate(-50, -230, sp),
							rotationX: gsap.utils.interpolate(0, 40, sp),
							scale: 1,
						});
					} else {
						const behind = i - ai;
						gsap.set(card, {
							yPercent: -50 + (behind - sp) * yOff,
							scale: 1 - (behind - sp) * scaleStep,
							rotationX: 0,
						});
					}
				});
			}
		});

		return () => ScrollTrigger.getAll().forEach(t => t.kill());
	});
</script>

<div class="sc-wrapper" bind:this={wrapperEl}>
	<div class="sc-inner">
		{#each projects as project, i}
			{@const color = PROJECT_COLORS[project.name] ?? '#1DB954'}
			{@const slug = slugMap[project.name]}
			{@const isActive = player.trackName === project.name}
			<div class="sc-card" style="--c:{color}">
				<div class="sc-art" style="background:linear-gradient(145deg,{color}44 0%,{color}11 100%);border:1px solid {color}33">
					<div class="sc-circle" style="background:{color}" class:pulse={isActive}>
						<span class="sc-letter">{project.name[0]}</span>
					</div>
					<span class="sc-num">{i + 1 < 10 ? '0' + (i + 1) : i + 1}</span>
				</div>
				<div class="sc-body">
					<div class="sc-tag" style="color:{color}; border-color:{color}44">
						Project {i + 1} / {projects.length}
					</div>
					<h2 class="sc-title">{project.name}</h2>
					<p class="sc-desc">{project.desc}</p>
					<div class="sc-tech">
						{#each project.tech as t}
							<span class="sc-chip">{t}</span>
						{/each}
					</div>
					<div class="sc-actions">
						<button class="sc-play" style="background:{color};color:{color === '#1DB954' ? '#000' : '#fff'}"
							onclick={() => setTrack(project.name, project.tech.slice(0,2).join(' · '))}>
							<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><polygon points="5 3 19 12 5 21 5 3"/></svg>
							Play
						</button>
						{#if slug}
							<a class="sc-link" href="/work/{slug}">View Case Study →</a>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.sc-wrapper { position: relative; width: 100%; }

	.sc-inner {
		position: relative;
		height: 100vh;
		display: flex; align-items: center; justify-content: center;
		perspective: 1400px;
		overflow: visible;
	}

	.sc-card {
		position: absolute;
		width: min(840px, calc(100vw - 60px));
		background: #191919;
		border-radius: 20px;
		display: grid;
		grid-template-columns: 240px 1fr;
		overflow: hidden;
		box-shadow: 0 40px 100px rgba(0,0,0,0.6);
		transform-origin: top center;
		will-change: transform;
		border: 1px solid rgba(255,255,255,0.07);
	}

	.sc-art {
		display: flex; flex-direction: column;
		align-items: center; justify-content: center;
		gap: 20px; padding: 40px 28px;
	}

	.sc-circle {
		width: 110px; height: 110px;
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		box-shadow: 0 8px 32px rgba(0,0,0,0.4);
		transition: box-shadow 0.4s;
	}
	.sc-circle.pulse {
		animation: cPulse 2s ease-in-out infinite;
	}
	@keyframes cPulse {
		0%,100% { box-shadow: 0 0 0 0 var(--c); }
		50% { box-shadow: 0 0 0 12px color-mix(in srgb, var(--c) 20%, transparent); }
	}

	.sc-letter { font-size: 48px; font-weight: 900; color: #000; }

	.sc-num {
		font-size: 52px; font-weight: 900;
		color: rgba(255,255,255,0.06);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.sc-body {
		padding: 40px 44px;
		display: flex; flex-direction: column;
		justify-content: center; gap: 14px;
	}

	.sc-tag {
		display: inline-flex; align-items: center;
		font-size: 11px; font-weight: 700;
		letter-spacing: 0.12em; text-transform: uppercase;
		border: 1px solid; border-radius: 20px;
		padding: 4px 12px; width: fit-content;
	}

	.sc-title {
		font-size: clamp(1.5rem, 2.8vw, 2.4rem);
		font-weight: 900; color: #fff;
		letter-spacing: -0.03em; line-height: 1;
	}

	.sc-desc {
		font-size: 14px; color: rgba(255,255,255,0.55);
		line-height: 1.7; max-width: 400px;
	}

	.sc-tech { display: flex; flex-wrap: wrap; gap: 6px; }
	.sc-chip {
		font-size: 11px; padding: 3px 10px;
		border-radius: 20px; background: rgba(255,255,255,0.07);
		color: rgba(255,255,255,0.5); font-weight: 500;
	}

	.sc-actions { display: flex; align-items: center; gap: 16px; margin-top: 6px; }

	.sc-play {
		display: flex; align-items: center; gap: 8px;
		padding: 10px 24px; border: none; border-radius: 50px;
		font-size: 13px; font-weight: 700; font-family: inherit;
		cursor: none; transition: transform 0.15s, filter 0.15s;
	}
	.sc-play:hover { transform: scale(1.04); filter: brightness(1.1); }

	.sc-link {
		font-size: 13px; font-weight: 600;
		color: rgba(255,255,255,0.4); text-decoration: none;
		transition: color 0.2s;
	}
	.sc-link:hover { color: #fff; }

	@media (max-width: 768px) {
		.sc-card { grid-template-columns: 1fr; width: calc(100vw - 24px); }
		.sc-art { flex-direction: row; padding: 24px; justify-content: flex-start; }
		.sc-body { padding: 24px; }
	}
</style>
