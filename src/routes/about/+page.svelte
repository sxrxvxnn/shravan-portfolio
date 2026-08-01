<script lang="ts">
	import { resume } from '$lib/data/resume.js';
	import { reveal } from '$lib/actions/reveal.js';
</script>

<svelte:head>
	<title>About — {resume.about.name}</title>
	<meta name="description" content={resume.about.bio} />
</svelte:head>

<div class="about">
	<!-- Hero -->
	<div class="about-hero" use:reveal={0}>
		<span class="eyebrow">01 / About</span>
		<h1 class="about-name">{resume.about.name}</h1>
		<p class="about-role">{resume.about.role}</p>
	</div>

	<!-- Bio + facts two-column -->
	<div class="two-col" use:reveal={100}>
		<div class="bio-col">
			<p class="bio">{resume.about.bio}</p>
		</div>
		<ul class="facts">
			{#each resume.about.facts as fact}
				<li class="fact-item">
					<span class="fact-bullet">—</span>
					{fact}
				</li>
			{/each}
		</ul>
	</div>

	<!-- Skills as numbered list -->
	<section class="section" use:reveal={0}>
		<div class="section-meta">
			<span class="section-index">02</span>
			<span class="section-label">Core Skills</span>
		</div>
		<div class="skills-table">
			{#each [...resume.skills.frontend, ...resume.skills.backend].slice(0, 8) as skill, i}
				<div class="skill-row">
					<span class="skill-num">{String(i + 1).padStart(2, '0')}</span>
					<span class="skill-name">{skill}</span>
					<span class="skill-type">{i < 5 ? 'Frontend' : 'Backend'}</span>
					<div class="skill-bar">
						<div class="skill-fill" style="width: {90 - i * 6}%"></div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Tools -->
	<section class="section" use:reveal={0}>
		<div class="section-meta">
			<span class="section-index">03</span>
			<span class="section-label">Tools & Platforms</span>
		</div>
		<div class="tools-grid">
			{#each resume.skills.tools as tool}
				<div class="tool-chip">
					<span class="tool-initial">{tool[0]}</span>
					<span>{tool}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Links -->
	<section class="section" use:reveal={0}>
		<div class="section-meta">
			<span class="section-index">04</span>
			<span class="section-label">Find me</span>
		</div>
		<div class="links-row">
			{#each resume.about.links as link}
				<a href={link.url} target="_blank" rel="noopener" class="link-pill">
					{link.label} ↗
				</a>
			{/each}
		</div>
	</section>

	<div style="height: 80px"></div>
</div>

<style>
	.about { min-height: 100%; }

	.about-hero {
		padding: 140px 60px 60px;
	}

	.eyebrow {
		display: block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #00e5ff;
		margin-bottom: 20px;
	}

	.about-name {
		font-size: clamp(3rem, 8vw, 8rem);
		font-weight: 900;
		color: #fff;
		letter-spacing: -0.04em;
		line-height: 0.88;
		margin-bottom: 16px;
	}

	.about-role {
		font-size: clamp(14px, 1.5vw, 18px);
		color: rgba(255,255,255,0.4);
		font-weight: 500;
	}

	.two-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 60px;
		padding: 0 60px 80px;
	}

	.bio {
		font-size: 16px;
		line-height: 1.8;
		color: rgba(255,255,255,0.6);
		font-weight: 400;
	}

	.facts {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.fact-item {
		display: flex;
		gap: 12px;
		font-size: 14px;
		color: rgba(255,255,255,0.45);
		line-height: 1.5;
	}

	.fact-bullet {
		color: #00e5ff;
		font-weight: 700;
		flex-shrink: 0;
	}

	.section { padding: 0 60px 80px; }

	.section-meta {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 32px;
	}

	.section-index {
		font-size: 11px;
		font-weight: 700;
		color: #00e5ff;
		letter-spacing: 0.1em;
	}

	.section-label {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.25);
	}

	/* Skills table */
	.skills-table { display: flex; flex-direction: column; gap: 4px; }

	.skill-row {
		display: grid;
		grid-template-columns: 36px 1fr 80px 200px;
		align-items: center;
		gap: 20px;
		padding: 12px 16px;
		border-radius: 8px;
		transition: background 0.15s;
	}
	.skill-row:hover { background: rgba(0, 229, 255, 0.04); }

	.skill-num {
		font-size: 12px;
		font-weight: 700;
		color: rgba(255,255,255,0.2);
		font-variant-numeric: tabular-nums;
	}

	.skill-name {
		font-size: 15px;
		font-weight: 600;
		color: #fff;
	}

	.skill-type {
		font-size: 11px;
		font-weight: 600;
		color: rgba(255,255,255,0.3);
		letter-spacing: 0.04em;
	}

	.skill-bar {
		height: 2px;
		background: rgba(255,255,255,0.08);
		border-radius: 1px;
		overflow: hidden;
	}

	.skill-fill {
		height: 100%;
		background: #00e5ff;
		border-radius: 1px;
	}

	/* Tools */
	.tools-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.tool-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid rgba(0, 229, 255, 0.1);
		background: rgba(0, 229, 255, 0.04);
		font-size: 13px;
		font-weight: 500;
		color: rgba(255,255,255,0.55);
		transition: border-color 0.15s, color 0.15s;
	}
	.tool-chip:hover { border-color: rgba(0, 229, 255, 0.3); color: #fff; }

	.tool-initial {
		font-weight: 800;
		color: #00e5ff;
	}

	/* Links */
	.links-row { display: flex; gap: 12px; flex-wrap: wrap; }

	.link-pill {
		padding: 10px 24px;
		border: 1px solid rgba(255,255,255,0.12);
		border-radius: 100px;
		color: rgba(255,255,255,0.6);
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s;
	}
	.link-pill:hover { border-color: #00e5ff; color: #00e5ff; }

	@media (max-width: 768px) {
		.about-hero { padding: 100px 24px 40px; }
		.two-col { grid-template-columns: 1fr; padding: 0 24px 48px; gap: 32px; }
		.section { padding: 0 24px 48px; }
		.skill-row { grid-template-columns: 36px 1fr 60px; }
		.skill-bar { display: none; }
	}
</style>
