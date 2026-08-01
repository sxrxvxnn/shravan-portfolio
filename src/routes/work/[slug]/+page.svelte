<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import SplitReveal from '$lib/components/UI/SplitReveal.svelte';
	import TechMarquee from '$lib/components/UI/TechMarquee.svelte';

	let { data }: { data: PageData } = $props();
	const { project } = data;

	onMount(() => {
		document.body.classList.add('scrollable');
		return () => document.body.classList.remove('scrollable');
	});

	const details: Record<string, { headline: string; challenge: string; solution: string; outcome: string; bullets: string[] }> = {
		sonar: {
			headline: 'Apollo-like lead intelligence, built from scratch at Beagle Security.',
			challenge: "Beagle Security's sales team was manually researching leads in spreadsheets. No enrichment, no deduplication, no qualification pipeline — just copy-paste from LinkedIn.",
			solution: "Built Sonar: a full-stack internal platform with a FastAPI backend on Vercel, Supabase PostgreSQL, and a React dashboard with 10+ modules. Integrated Apollo, PDL, Hunter.io, Firecrawl, and Groq for enrichment and qualification.",
			outcome: 'Handles hundreds of companies. Runs lookalike search in under 2 seconds. One Chrome Extension click extracts any LinkedIn profile into the pipeline.',
			bullets: [
				'FastAPI backend deployed to Vercel Serverless (Python runtime)',
				'Supabase PostgreSQL with Row-Level Security for multi-user access',
				'React dashboard: search, filter, enrich, export CSV — 10+ feature modules',
				'Groq-powered industry & business model classification',
				'Playwright worker for LinkedIn profile verification',
				'PDL SQL-mode bulk enrichment for email/phone/social data',
				'Hunter.io email discovery with domain fallback',
				'Chrome Extension (Manifest V3) for one-click LinkedIn extraction',
			]
		},
		lookalike: {
			headline: 'Find your next customer in under 2 seconds.',
			challenge: "Traditional lookalike search systems require vector embeddings, similarity indexes, and complex ML pipelines. For internal use, the setup cost wasn't worth it.",
			solution: "Single structured Groq call with a carefully engineered prompt. The LLM receives the target company's profile and a batch of candidates, then returns a ranked JSON list with reasoning. No vectors, no index.",
			outcome: 'Consistently produces high-quality matches. Runs in under 2 seconds end-to-end. Engineers can tune the prompt without touching ML infrastructure.',
			bullets: [
				'Groq llama-3.1-70b with structured JSON output',
				'Ranks by industry, business model, tech signals, and company stage',
				'Single API call — no embedding store, no similarity index',
				'FastAPI endpoint with caching layer for repeated queries',
				'Integrated into Sonar dashboard as "Find Similar Companies"',
			]
		},
		'linkedin-pipeline': {
			headline: 'Playwright pipeline that actually survives LinkedIn.',
			challenge: 'LinkedIn is a heavily obfuscated SPA. Hash-based class names change weekly. Most scrapers break on login walls, lazy-loaded content, or redirect loops.',
			solution: 'Built a Playwright pipeline with session persistence, smart waiting strategies, and cross-validation against company website records. Detects when a profile has no associated website and rejects mismatches.',
			outcome: 'Stable across LinkedIn updates. Handles redirect URLs (lnkd.in), double-space name formats, and SPA rendering delays.',
			bullets: [
				'Playwright with persistent browser context (no re-login)',
				'Handles lnkd.in redirect URLs + double-space name normalization',
				'Cross-validates profile website against target company domain',
				'Rejects LinkedIn Pages with no website when target has one',
				'Integrated with Supabase to update decision_maker records',
				'Run as background job triggered from Sonar dashboard',
			]
		},
		'chrome-extension': {
			headline: 'One click. LinkedIn → Sonar.',
			challenge: 'Sales team was manually entering leads from LinkedIn into Sonar. Copy-pasting name, title, company, and URL was slow and error-prone.',
			solution: 'Chrome Extension (Manifest V3) that reads the current LinkedIn page, extracts structured data, and sends it to the Sonar API — all with one click from the toolbar.',
			outcome: 'Cuts lead entry from ~3 minutes to 2 seconds. Works on both individual profiles and company pages.',
			bullets: [
				'Manifest V3 with content script + service worker',
				'Extracts name, title, company, URL, connections, about section',
				'Authenticated requests to Sonar REST API (JWT via chrome.storage)',
				'Works on /in/ profiles and /company/ pages',
				'Popup shows last 5 extracted leads with status badges',
				'TypeScript throughout, minimal permissions',
			]
		}
	};

	const d = details[data.slug] ?? {
		headline: project.desc,
		challenge: '', solution: '', outcome: '', bullets: project.tech.map(t => t)
	};
</script>

<svelte:head>
	<title>{project.name} — Shravan Omanakuttan</title>
	<meta name="description" content={project.desc} />
	<link rel="canonical" href="https://shravanomanakuttan.vercel.app/work/{data.slug}" />
</svelte:head>

<div class="case-study">
	<nav class="breadcrumb">
		<a href="/" class="back">← Back to portfolio</a>
		<span class="sep">/</span>
		<span class="current">{project.name}</span>
	</nav>

	<header>
		<p class="eyebrow">Case Study</p>
		<SplitReveal text={project.name} tag="h1" delay={0.1} duration={1.0} />
		<p class="headline">{d.headline}</p>
		<div class="tags">
			{#each project.tech as t}
				<span class="tag">{t}</span>
			{/each}
		</div>
		{#if project.url}
			<a href={project.url} target="_blank" rel="noopener" class="repo-link">View on GitHub →</a>
		{/if}
	</header>

	<div class="sections">
		{#if d.challenge}
			<section>
				<h2>The Problem</h2>
				<p>{d.challenge}</p>
			</section>
		{/if}
		{#if d.solution}
			<section>
				<h2>The Solution</h2>
				<p>{d.solution}</p>
			</section>
		{/if}
		{#if d.outcome}
			<section>
				<h2>Outcome</h2>
				<p>{d.outcome}</p>
			</section>
		{/if}
		{#if d.bullets.length}
			<section>
				<h2>Technical Details</h2>
				<ul>
					{#each d.bullets as b}
						<li>{b}</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>

	<footer class="cs-footer">
		<TechMarquee items={project.tech.length > 4 ? project.tech : [...project.tech, 'SvelteKit', 'Vercel', 'GSAP', 'Three.js', 'TypeScript']} speed={22} />
		<div class="footer-nav">
			<a href="/" class="back-home">← Back to 3D Portfolio</a>
			<a href="/" class="back-home" style="color:#7c6af7">View all projects →</a>
		</div>
	</footer>
</div>

<style>
	:global(body) { background: #0d0d1a; color: #e8eeff; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; overflow: auto; }

	.case-study {
		max-width: 780px;
		margin: 0 auto;
		padding: 48px 24px 96px;
		min-height: 100vh;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
		color: rgba(255,255,255,0.4);
		margin-bottom: 48px;
	}
	.back {
		color: #88aaff;
		text-decoration: none;
		transition: color 0.15s;
	}
	.back:hover { color: #c8d8ff; }
	.sep { opacity: 0.3; }
	.current { color: rgba(255,255,255,0.55); }

	header { margin-bottom: 56px; }

	.eyebrow {
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #7c6af7;
		margin: 0 0 12px;
	}

	h1 {
		font-size: clamp(36px, 6vw, 60px);
		font-weight: 800;
		margin: 0 0 16px;
		background: linear-gradient(135deg, #c8d8ff 0%, #a090f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1.1;
	}

	.headline {
		font-size: 18px;
		line-height: 1.65;
		color: rgba(255,255,255,0.72);
		margin: 0 0 24px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 24px;
	}

	.tag {
		font-size: 12px;
		padding: 4px 12px;
		border-radius: 20px;
		background: rgba(100,130,255,0.15);
		color: #99bbff;
		border: 1px solid rgba(100,130,255,0.3);
	}

	.repo-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #7c6af7;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		border: 1px solid rgba(124,106,247,0.35);
		padding: 8px 18px;
		border-radius: 10px;
		transition: background 0.15s, border-color 0.15s;
	}
	.repo-link:hover { background: rgba(124,106,247,0.12); border-color: rgba(124,106,247,0.6); }

	.sections { display: flex; flex-direction: column; gap: 48px; }

	section {
		border-left: 2px solid rgba(124,106,247,0.3);
		padding-left: 24px;
	}

	h2 {
		font-size: 13px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.38);
		margin: 0 0 14px;
		font-weight: 600;
	}

	p {
		font-size: 15px;
		line-height: 1.75;
		color: rgba(255,255,255,0.75);
		margin: 0;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	li {
		font-size: 14px;
		line-height: 1.6;
		color: rgba(255,255,255,0.7);
		padding-left: 18px;
		position: relative;
	}
	li::before {
		content: '▸';
		position: absolute;
		left: 0;
		color: #7c6af7;
		font-size: 11px;
		top: 3px;
	}

	.cs-footer {
		margin-top: 80px;
	}

	.footer-nav {
		display: flex;
		justify-content: space-between;
		padding: 24px 0 0;
		font-size: 13px;
	}

	.back-home {
		color: rgba(255,255,255,0.45);
		text-decoration: none;
		transition: color 0.15s;
	}
	.back-home:hover { color: #c8d8ff; }

	@media (max-width: 600px) {
		.case-study { padding: 32px 16px 80px; }
	}
</style>
