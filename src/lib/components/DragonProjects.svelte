<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import type { ResumeProject } from '$lib/data/resume.js';
	import { PROJECT_COLORS, setTrack } from '$lib/stores/player.svelte.js';

	interface Props { projects: ResumeProject[]; }
	let { projects }: Props = $props();

	const slugMap: Record<string, string> = {
		'Sonar': 'sonar',
		'Lookalike Search Engine': 'lookalike',
		'LinkedIn DM Pipeline': 'linkedin-pipeline',
		'Sonar Chrome Extension': 'chrome-extension',
	};

	let sectionEl: HTMLElement;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const items = sectionEl.querySelectorAll<HTMLElement>('.dragon-item');

		items.forEach((item) => {
			const artInner = item.querySelector<HTMLElement>('.dragon-art-inner');
			const nameEl = item.querySelector<HTMLElement>('.dragon-name');
			const infoEl = item.querySelector<HTMLElement>('.dragon-info');
			if (!artInner || !nameEl || !infoEl) return;

			// manual char split with mask (no SplitText dependency)
			const text = nameEl.textContent ?? '';
			nameEl.innerHTML = text.split('').map(ch =>
				ch === ' ' ? '<span class="char-space"> </span>' :
				`<span class="char-wrap"><span class="char">${ch}</span></span>`
			).join('');

			const chars = nameEl.querySelectorAll<HTMLElement>('.char');
			chars.forEach((char, idx) => {
				ScrollTrigger.create({
					trigger: item,
					start: `top+=${idx * 22 - 220} center`,
					end: `top+=${idx * 22 - 80} center`,
					scrub: 1,
					animation: gsap.fromTo(char, { y: '115%' }, { y: '0%', ease: 'none' })
				});
			});

			// clip-path morph enter
			ScrollTrigger.create({
				trigger: item,
				start: 'top bottom',
				end: 'top 15%',
				scrub: 0.6,
				animation: gsap.fromTo(artInner,
					{ clipPath: 'polygon(20% 30%, 80% 35%, 100% 100%, 0% 100%)' },
					{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none' }
				)
			});

			// clip-path morph exit
			ScrollTrigger.create({
				trigger: item,
				start: 'bottom bottom',
				end: 'bottom top',
				scrub: 0.6,
				animation: gsap.fromTo(artInner,
					{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
					{ clipPath: 'polygon(0% 0%, 100% 0%, 80% 65%, 20% 70%)', ease: 'none' }
				)
			});

			// info parallax
			ScrollTrigger.create({
				trigger: item,
				start: 'top bottom',
				end: 'bottom top',
				scrub: 1,
				animation: gsap.fromTo(infoEl, { y: 60 }, { y: -60, ease: 'none' })
			});
		});

		return () => ScrollTrigger.getAll().forEach(t => t.kill());
	});
</script>

<section class="dragon-section" bind:this={sectionEl}>
	{#each projects as project, i}
		{@const color = PROJECT_COLORS[project.name] ?? '#1DB954'}
		{@const slug = slugMap[project.name]}
		<div class="dragon-item">
			<div class="dragon-art">
				<div class="dragon-art-inner" style="background: linear-gradient(135deg, {color}dd 0%, {color}55 100%)">
					<span class="dragon-bg-letter">{project.name[0]}</span>
				</div>
			</div>
			<div class="dragon-info">
				<span class="dragon-idx">0{i + 1}</span>
				<h2 class="dragon-name" aria-label={project.name}>{project.name}</h2>
				<p class="dragon-desc">{project.desc.split('.')[0]}.</p>
				<div class="dragon-tech">
					{#each project.tech.slice(0, 4) as t}
						<span class="d-chip">{t}</span>
					{/each}
				</div>
				<div class="dragon-actions">
					<button class="d-play" style="background:{color}; color:{color === '#1DB954' ? '#000' : '#fff'}" onclick={() => setTrack(project.name, project.tech.slice(0,2).join(' · '))}>
						<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="5 3 19 12 5 21 5 3"/></svg>
						Play
					</button>
					{#if slug}
						<a class="d-case" href="/work/{slug}">Case Study ↗</a>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</section>

<style>
	.dragon-section { width: 100%; }

	.dragon-item {
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: 85vh;
		overflow: hidden;
		border-bottom: 1px solid rgba(255,255,255,0.05);
	}
	.dragon-item:nth-child(even) { direction: rtl; }
	.dragon-item:nth-child(even) > * { direction: ltr; }

	.dragon-art {
		position: relative;
		overflow: hidden;
	}

	.dragon-art-inner {
		width: 100%; height: 100%;
		min-height: 400px;
		display: flex; align-items: center; justify-content: center;
		will-change: clip-path;
		clip-path: polygon(20% 30%, 80% 35%, 100% 100%, 0% 100%);
	}

	.dragon-bg-letter {
		font-size: clamp(8rem, 18vw, 18rem);
		font-weight: 900;
		color: rgba(0,0,0,0.2);
		line-height: 1;
		user-select: none;
		letter-spacing: -0.05em;
	}

	.dragon-info {
		display: flex; flex-direction: column;
		justify-content: center; gap: 20px;
		padding: clamp(32px, 5vw, 72px) clamp(24px, 5vw, 64px);
		will-change: transform;
	}

	.dragon-idx {
		font-size: 11px; font-weight: 700;
		letter-spacing: 0.2em; text-transform: uppercase;
		color: rgba(255,255,255,0.25);
	}

	:global(.dragon-name) {
		font-size: clamp(2.2rem, 4vw, 4.5rem);
		font-weight: 900; color: #fff;
		letter-spacing: -0.04em; line-height: 0.92;
		overflow: visible;
	}

	:global(.char-wrap) {
		display: inline-block;
		overflow: hidden;
		vertical-align: top;
		line-height: 1;
	}

	:global(.char) {
		display: inline-block;
	}

	:global(.char-space) {
		display: inline-block;
		width: 0.3em;
	}

	.dragon-desc {
		font-size: 15px; line-height: 1.7;
		color: rgba(255,255,255,0.55); max-width: 380px;
	}

	.dragon-tech { display: flex; flex-wrap: wrap; gap: 6px; }
	.d-chip {
		font-size: 11px; padding: 4px 12px;
		border-radius: 20px; border: 1px solid rgba(255,255,255,0.12);
		color: rgba(255,255,255,0.5); font-weight: 600;
		letter-spacing: 0.02em;
	}

	.dragon-actions { display: flex; align-items: center; gap: 20px; margin-top: 8px; }

	.d-play {
		display: flex; align-items: center; gap: 8px;
		padding: 12px 28px; border: none; border-radius: 50px;
		font-size: 13px; font-weight: 700;
		cursor: none; transition: transform 0.15s, filter 0.15s;
		font-family: inherit;
	}
	.d-play:hover { transform: scale(1.05); filter: brightness(1.1); }

	.d-case {
		font-size: 13px; font-weight: 600;
		color: rgba(255,255,255,0.4); text-decoration: none;
		transition: color 0.2s;
		letter-spacing: 0.01em;
	}
	.d-case:hover { color: #fff; }

	@media (max-width: 768px) {
		.dragon-item { grid-template-columns: 1fr; direction: ltr; }
		.dragon-item:nth-child(even) { direction: ltr; }
		.dragon-art-inner { min-height: 55vw; }
		.dragon-info { gap: 14px; }
	}
</style>
