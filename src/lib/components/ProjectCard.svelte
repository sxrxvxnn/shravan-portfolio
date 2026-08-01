<script lang="ts">
	import { setTrack, PROJECT_COLORS } from '$lib/stores/player.svelte.js';
	import type { ResumeProject } from '$lib/data/resume.js';

	interface Props {
		project: ResumeProject;
		index?: number;
	}

	let { project, index = 0 }: Props = $props();

	let hovered = $state(false);
	let cardEl: HTMLElement;

	const color = PROJECT_COLORS[project.name] ?? '#1DB954';

	function onMouseMove(e: MouseEvent) {
		const rect = cardEl.getBoundingClientRect();
		const x = ((e.clientY - rect.top - rect.height / 2) / rect.height) * -14;
		const y = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 14;
		cardEl.style.transform = `perspective(700px) rotateX(${x}deg) rotateY(${y}deg) scale(1.02)`;
	}
	function onMouseLeave() {
		cardEl.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
	}

	const slugMap: Record<string, string> = {
		'Sonar': 'sonar',
		'Lookalike Search Engine': 'lookalike',
		'LinkedIn DM Pipeline': 'linkedin-pipeline',
		'Sonar Chrome Extension': 'chrome-extension',
	};
	const slug = slugMap[project.name];

	function handlePlay(e: MouseEvent) {
		e.preventDefault();
		setTrack(project.name, project.tech.slice(0, 2).join(' · '));
	}
</script>

<div
	class="card"
	bind:this={cardEl}
	onmouseenter={() => hovered = true}
	onmouseleave={() => { hovered = false; onMouseLeave(); }}
	onmousemove={onMouseMove}
	role="article"
>
	<!-- Album art -->
	<div class="art" style="background: linear-gradient(135deg, {color}33 0%, {color}11 100%); border: 1px solid {color}33;">
		<div class="art-center" style="background: {color}; opacity: {0.7 + index * 0.05};">
			<span class="art-letter">{project.name[0]}</span>
		</div>

		<!-- Play button overlay -->
		<button
			class="play-overlay"
			class:visible={hovered}
			onclick={handlePlay}
			aria-label="Play {project.name}"
		>
			<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
				<polygon points="5 3 19 12 5 21 5 3"/>
			</svg>
		</button>
	</div>

	<!-- Info -->
	<div class="info">
		<a href={slug ? `/work/${slug}` : project.url} class="project-name" target={slug ? undefined : '_blank'} rel="noopener">
			{project.name}
		</a>
		<p class="project-desc">{project.desc.split('.')[0]}.</p>
		<div class="tags">
			{#each project.tech.slice(0, 3) as t}
				<span class="tag">{t}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.card {
		background: #181818;
		border-radius: 8px;
		padding: 16px;
		cursor: none;
		transition: background 0.2s, transform 0.15s cubic-bezier(0.16,1,0.3,1);
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 14px;
		transform-style: preserve-3d;
		will-change: transform;
	}
	.card:hover { background: #282828; }

	.art {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 6px;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.art-center {
		width: 60%;
		height: 60%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.2s;
	}

	.art-letter {
		font-size: 2.2em;
		font-weight: 900;
		color: #fff;
		line-height: 1;
	}

	.play-overlay {
		position: absolute;
		bottom: 12px;
		right: 12px;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #1DB954;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #000;
		box-shadow: 0 8px 24px rgba(0,0,0,0.5);
		opacity: 0;
		transform: translateY(8px);
		transition: opacity 0.2s, transform 0.2s;
	}
	.play-overlay.visible { opacity: 1; transform: translateY(0); }
	.play-overlay:hover { background: #1ed760; transform: scale(1.06) translateY(0); }

	.info { display: flex; flex-direction: column; gap: 6px; }

	.project-name {
		font-size: 15px;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
		line-height: 1.2;
		transition: text-decoration 0.15s;
	}
	.project-name:hover { text-decoration: underline; }

	.project-desc {
		font-size: 13px;
		color: #B3B3B3;
		line-height: 1.5;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}

	.tag {
		font-size: 10px;
		padding: 2px 8px;
		border-radius: 20px;
		background: rgba(255,255,255,0.08);
		color: #B3B3B3;
		font-weight: 500;
		letter-spacing: 0.03em;
	}
</style>
