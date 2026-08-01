<script lang="ts">
	import { resume } from '$lib/data/resume.js';
	import Cursor from '$lib/components/Cursor.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Lenis from 'lenis';

	let { children } = $props();
	let siteReady = $state(false);
	let noiseUrl  = $state('');

	const SITE_URL = 'https://shravanomanakuttan.vercel.app';
	const OG_IMAGE = `${SITE_URL}/og.svg`;

	onMount(() => {
		const c = document.createElement('canvas');
		c.width = c.height = 256;
		const ctx = c.getContext('2d')!;
		const img = ctx.createImageData(256, 256);
		for (let i = 0; i < img.data.length; i += 4) {
			const v = Math.random() * 255;
			img.data[i] = img.data[i+1] = img.data[i+2] = v;
			img.data[i+3] = 14;
		}
		ctx.putImageData(img, 0, 0);
		noiseUrl = c.toDataURL();

		const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
		function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
		requestAnimationFrame(raf);
		return () => lenis.destroy();
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => { resolve(); await navigation.complete; });
		});
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=IBM+Plex+Mono:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<title>{resume.about.name} — Portfolio</title>
	<meta name="description" content={resume.about.bio} />
	<meta name="author" content={resume.about.name} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={SITE_URL} />
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#080c10" />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:title" content="{resume.about.name} — Portfolio" />
	<meta property="og:description" content={resume.about.bio} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{resume.about.name} — Portfolio" />
	<meta name="twitter:description" content={resume.about.bio} />
	<meta name="twitter:image" content={OG_IMAGE} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Person",
		"name": resume.about.name,
		"jobTitle": "Software Engineer",
		"url": SITE_URL,
		"email": "shravanomanakuttan@gmail.com",
		"alumniOf": { "@type": "CollegeOrUniversity", "name": "SRM University Delhi-NCR" },
		"sameAs": ["https://github.com/sxrxvxnn", "https://linkedin.com/in/shravanomanakuttan"]
	})}<\/script>`}
</svelte:head>

<Cursor />

{#if browser}
	<Preloader onDone={() => (siteReady = true)} />
{/if}

{#if noiseUrl}
	<div class="noise-overlay" style="background-image: url({noiseUrl})"></div>
{/if}

<div class="site-wrap" class:ready={siteReady || !browser}>
	{@render children()}
</div>

<style>
	:global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

	:global(html) {
		background: #282828;
		color: #fff;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		-webkit-font-smoothing: antialiased;
		overflow-x: hidden;
		cursor: none;
	}

	:global(body) {
		background: #282828;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: none;
		-webkit-overflow-scrolling: touch;
	}

	:global(a) { color: inherit; }
	:global(button) { font-family: inherit; }
	:global(a, button, [role="button"]) { cursor: none; }

	:global(::view-transition-old(root)) {
		animation: 160ms ease-in vt-out;
	}
	:global(::view-transition-new(root)) {
		animation: 260ms cubic-bezier(0.16, 1, 0.3, 1) vt-in;
	}
	@keyframes vt-out { to { opacity: 0; transform: translateY(-8px); } }
	@keyframes vt-in { from { opacity: 0; transform: translateY(16px); } }

	:global(::-webkit-scrollbar) { width: 4px; }
	:global(::-webkit-scrollbar-track) { background: transparent; }
	:global(::-webkit-scrollbar-thumb) { background: rgba(250,189,47,0.2); border-radius: 2px; }
	:global(::-webkit-scrollbar-thumb:hover) { background: rgba(250,189,47,0.4); }

	.noise-overlay {
		position: fixed; inset: 0;
		pointer-events: none;
		z-index: 1;
		mix-blend-mode: overlay;
		opacity: 0.7;
	}

	.site-wrap {
		position: relative;
		z-index: 2;
		opacity: 0;
		transition: opacity 0.5s ease;
	}

	.site-wrap.ready { opacity: 1; }
</style>
