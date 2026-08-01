<script lang="ts">
	import { resume } from '$lib/data/resume.js';
	import StickyCards from '$lib/components/StickyCards.svelte';
	import { reveal } from '$lib/actions/reveal.js';
</script>

<svelte:head>
	<title>Projects — {resume.about.name}</title>
</svelte:head>

<div class="projects-page">
	<!-- Header -->
	<div class="page-header" use:reveal={0}>
		<span class="eyebrow">All Work</span>
		<h1 class="page-title">Projects</h1>
		<p class="page-desc">
			{resume.projects.length} projects. Scroll to explore.
		</p>
	</div>

	<!-- 3D sticky card stack — the main event -->
	<StickyCards projects={resume.projects} />

	<div style="height:60px"></div>
</div>

<style>
	.projects-page { min-height: 100%; }

	.page-header {
		padding: 140px 60px 60px;
	}

	.eyebrow {
		display: block;
		font-size: 11px; font-weight: 700;
		letter-spacing: 0.2em; text-transform: uppercase;
		color: #00e5ff; margin-bottom: 16px;
	}

	.page-title {
		font-size: clamp(3rem, 8vw, 8rem);
		font-weight: 900; color: #fff;
		letter-spacing: -0.04em; line-height: 0.88;
		margin-bottom: 20px;
	}

	.page-desc {
		font-size: 15px; color: rgba(255,255,255,0.35);
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.page-header { padding: 100px 24px 40px; }
	}
</style>
