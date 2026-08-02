<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { workOpen } from '$lib/stores/work';

	gsap.registerPlugin(ScrollTrigger);

	let overlayEl: HTMLElement;
	let scrollEl:  HTMLElement;
	let isOpen     = $state(false);
	let triggerCtx: gsap.Context | null = null;

	const PROJECTS = [
		{
			key:    'sonar',
			name:   'Sonar',
			year:   '2026',
			tag:    'Lead Intelligence Platform',
			story:  'My team was paying $800/month for Apollo.io. I said I could build a replacement. 90 days later it was in production with 10+ modules. It handles company intel, prospect search, ICP scoring, and email enrichment. Nobody asked me to build the Chrome extension — I added it anyway.',
			tech:   ['FastAPI', 'React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Groq', 'Vercel'],
			metric: '$800/mo saved · 10 modules · 90 days solo',
			url:    'https://github.com/sxrxvxnn',
			accent: '#7aa2f7',
			mock:   'crm',
		},
		{
			key:    'lookalike',
			name:   'Lookalike Search',
			year:   '2025',
			tag:    'B2B Discovery Engine',
			story:  'Feed it any company URL. Get back ranked B2B lookalikes in under 2 seconds. One structured Groq call, no vector database, no embeddings. Just a well-constructed prompt and a clear schema. Sometimes simple is fast.',
			tech:   ['Python', 'FastAPI', 'Groq', 'PostgreSQL'],
			metric: '<2s end-to-end · single LLM call · no vector DB',
			url:    'https://github.com/sxrxvxnn/leadgen-platform',
			accent: '#9ece6a',
			mock:   'search',
		},
		{
			key:    'linkedin',
			name:   'LinkedIn Pipeline',
			year:   '2025',
			tag:    'Decision-Maker Scraper',
			story:  'LinkedIn randomises its class names every deploy to break scrapers. I reverse-engineered the SPA rendering pattern instead of chasing class names. Verified 1,200+ decision-maker profiles. Still running.',
			tech:   ['Python', 'Playwright', 'PostgreSQL'],
			metric: '1,200+ profiles · SPA-aware · production',
			url:    'https://github.com/sxrxvxnn/leadgen-platform',
			accent: '#e0af68',
			mock:   'table',
		},
	];

	$effect(() => {
		const unsub = workOpen.subscribe(v => {
			if (v && !isOpen)  openOverlay();
			if (!v && isOpen)  closeOverlay();
		});
		return unsub;
	});

	function openOverlay() {
		isOpen = true;
		document.body.style.overflow = 'hidden';

		requestAnimationFrame(() => {
			gsap.fromTo(overlayEl,
				{ y: '100%' },
				{ y: 0, duration: 0.72, ease: 'power4.out' }
			);

			setTimeout(() => setupScrollTriggers(), 100);
		});
	}

	function closeOverlay() {
		gsap.to(overlayEl, {
			y: '100%',
			duration: 0.48,
			ease: 'power4.in',
			onComplete: () => {
				isOpen = false;
				document.body.style.overflow = '';
				triggerCtx?.revert();
				triggerCtx = null;
				workOpen.set(false);
			},
		});
	}

	function setupScrollTriggers() {
		triggerCtx?.revert();
		triggerCtx = gsap.context(() => {
			// Project cards
			document.querySelectorAll('.wk-card').forEach((el, i) => {
				gsap.fromTo(el,
					{ opacity: 0, y: 64, filter: 'blur(4px)' },
					{
						opacity: 1, y: 0, filter: 'blur(0px)',
						duration: 0.9, ease: 'power3.out', delay: i * 0.05,
						scrollTrigger: { trigger: el, scroller: scrollEl, start: 'top 88%' },
					}
				);
			});

			// About section
			['wk-photo', 'wk-bio'].forEach((cls, i) => {
				const el = document.querySelector(`.${cls}`);
				if (!el) return;
				gsap.fromTo(el,
					{ opacity: 0, x: i === 0 ? -40 : 40 },
					{
						opacity: 1, x: 0,
						duration: 0.9, ease: 'power3.out', delay: i * 0.12,
						scrollTrigger: { trigger: el, scroller: scrollEl, start: 'top 82%' },
					}
				);
			});

			// Contact
			const contact = document.querySelector('.wk-contact-inner');
			if (contact) {
				gsap.fromTo(contact,
					{ opacity: 0, y: 30 },
					{
						opacity: 1, y: 0,
						duration: 0.8, ease: 'power3.out',
						scrollTrigger: { trigger: contact, scroller: scrollEl, start: 'top 85%' },
					}
				);
			}
		});
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) closeOverlay();
	}

	onMount(() => {
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="wk-overlay"
	class:wk-open={isOpen}
	bind:this={overlayEl}
	role="dialog"
	aria-label="Work and about"
	aria-hidden={!isOpen}
>
	<!-- header -->
	<header class="wk-header">
		<span class="wk-logo">shravan omanakuttan</span>
		<nav class="wk-nav">
			<a href="#work"    class="wk-navlink">work</a>
			<a href="#about"   class="wk-navlink">about</a>
			<a href="#contact" class="wk-navlink">contact</a>
		</nav>
		<button class="wk-close" onclick={closeOverlay} aria-label="Close" data-magnetic>
			<span>close</span>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
				<line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				<line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>
	</header>

	<!-- scroll body -->
	<div class="wk-scroll" bind:this={scrollEl}>

		<!-- ── WORK ── -->
		<section class="wk-section" id="work">
			<div class="wk-section-label">Selected Work</div>
			<h2 class="wk-section-title">Things I actually shipped.</h2>

			<div class="wk-cards">
				{#each PROJECTS as p}
					<article class="wk-card" style="--pk:{p.accent}">
						<div class="wk-card-mockup">
							{#if p.mock === 'crm'}
								<div class="mock-chrome">
									<span class="mc-dot"></span><span class="mc-dot"></span><span class="mc-dot"></span>
									<span class="mc-url">sonar.app / prospects</span>
								</div>
								<div class="mock-body crm">
									<div class="mock-sidebar">
										<div class="mock-si active"></div>
										<div class="mock-si"></div>
										<div class="mock-si"></div>
										<div class="mock-si"></div>
										<div class="mock-si"></div>
									</div>
									<div class="mock-main">
										<div class="mock-stats-row">
											<div class="mock-stat"><div class="mock-num" style="color:var(--pk)">1,247</div><div class="mock-slabel">prospects</div></div>
											<div class="mock-stat"><div class="mock-num">38</div><div class="mock-slabel">ICP match</div></div>
											<div class="mock-stat"><div class="mock-num" style="color:#9ece6a">$0</div><div class="mock-slabel">SaaS cost</div></div>
										</div>
										<div class="mock-table">
											{#each [1,2,3,4,5] as _, i}
												<div class="mock-row" style="opacity:{1 - i*0.12}">
													<div class="mock-cell wide"></div>
													<div class="mock-cell"></div>
													<div class="mock-cell short"></div>
													<div class="mock-chip" style="background:color-mix(in srgb,var(--pk) 20%,transparent);color:var(--pk)">verified</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{:else if p.mock === 'search'}
								<div class="mock-chrome">
									<span class="mc-dot"></span><span class="mc-dot"></span><span class="mc-dot"></span>
									<span class="mc-url">lookalike.api / search</span>
								</div>
								<div class="mock-body search">
									<div class="mock-searchbar">
										<span class="mock-search-icon">⌕</span>
										<span class="mock-search-text">stripe.com</span>
										<div class="mock-search-btn" style="background:var(--pk)">Find</div>
									</div>
									<div class="mock-results">
										{#each ['Paddle', 'Chargebee', 'Recurly', 'Braintree', 'Adyen'] as name, i}
											<div class="mock-result-row" style="opacity:{1 - i*0.14}">
												<div class="mock-result-dot" style="background:var(--pk);opacity:{1-i*0.18}"></div>
												<div class="mock-result-name">{name}</div>
												<div class="mock-result-score" style="color:var(--pk)">{98 - i*7}%</div>
											</div>
										{/each}
									</div>
									<div class="mock-timing">⚡ 1.4s</div>
								</div>
							{:else}
								<div class="mock-chrome">
									<span class="mc-dot"></span><span class="mc-dot"></span><span class="mc-dot"></span>
									<span class="mc-url">pipeline / decision-makers</span>
								</div>
								<div class="mock-body table">
									<div class="mock-table-hdr">
										<div class="mock-th">Name</div>
										<div class="mock-th">Title</div>
										<div class="mock-th">Company</div>
										<div class="mock-th">Status</div>
									</div>
									{#each [1,2,3,4,5] as _, i}
										<div class="mock-row" style="opacity:{1-i*0.12}">
											<div class="mock-cell wide"></div>
											<div class="mock-cell mid"></div>
											<div class="mock-cell mid"></div>
											<div class="mock-chip" style="background:color-mix(in srgb,var(--pk) 18%,transparent);color:var(--pk)">✓</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<div class="wk-card-info">
							<div class="wk-card-top">
								<span class="wk-tag">{p.tag}</span>
								<span class="wk-year">{p.year}</span>
							</div>
							<h3 class="wk-card-name" style="color:var(--pk)">{p.name}</h3>
							<p class="wk-card-story">{p.story}</p>
							<div class="wk-card-metric">{p.metric}</div>
							<div class="wk-card-tech">
								{#each p.tech as t}
									<span class="wk-tech-chip">{t}</span>
								{/each}
							</div>
							<a href={p.url} target="_blank" rel="noopener" class="wk-card-link" data-magnetic>
								view source →
							</a>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<!-- ── ABOUT ── -->
		<section class="wk-section wk-section-about" id="about">
			<div class="wk-section-label">About</div>
			<div class="wk-about-grid">
				<div class="wk-photo">
					<!--
						SHRAVAN: swap this div with your actual photo.
						<img src="/shravan.jpg" alt="Shravan Omanakuttan" class="wk-photo-img" />
					-->
					<div class="wk-photo-placeholder" aria-label="Photo of Shravan Omanakuttan">
						<div class="wk-photo-initials">SO</div>
						<div class="wk-photo-caption">Shravan Omanakuttan<br/>Trivandrum, 2026</div>
					</div>
				</div>

				<div class="wk-bio">
					<h2 class="wk-bio-title">21. From Trivandrum.<br/>Building things that ship.</h2>
					<p class="wk-bio-p">
						I'm a CS + AI undergrad at SRM Delhi-NCR, finishing in 2026.
						Currently interning at Beagle Security, where I built Sonar —
						a lead intelligence platform that replaced my team's $800/month SaaS subscription.
						I built it in 90 days. Alone. While still going to class.
					</p>
					<p class="wk-bio-p">
						I care about shipping things that actually get used by real people at real companies.
						Not polished side projects that live in a private repo forever. Actual production tools.
					</p>
					<p class="wk-bio-p">
						Python until 2am is a personality trait at this point. FastAPI, React, PostgreSQL, Groq.
						Open to relocate. Ready in 2026.
					</p>
					<div class="wk-bio-links">
						<a href="https://github.com/sxrxvxnn"                      target="_blank" rel="noopener" class="wk-link" data-magnetic>github</a>
						<a href="https://linkedin.com/in/shravanomanakuttan"        target="_blank" rel="noopener" class="wk-link" data-magnetic>linkedin</a>
						<a href="mailto:shravanomanakuttan@gmail.com"               class="wk-link" data-magnetic>email</a>
					</div>
				</div>
			</div>
		</section>

		<!-- ── CONTACT ── -->
		<section class="wk-section wk-section-contact" id="contact">
			<div class="wk-contact-inner">
				<div class="wk-section-label">Contact</div>
				<h2 class="wk-contact-title">Let's talk.</h2>
				<a href="mailto:shravanomanakuttan@gmail.com" class="wk-email" data-magnetic>
					shravanomanakuttan@gmail.com
				</a>
				<p class="wk-contact-sub">
					IST (UTC+5:30) · Responds within 12 hours · Open to internships & full-time from 2026
				</p>
				<div class="wk-contact-links">
					<a href="https://github.com/sxrxvxnn"                   target="_blank" rel="noopener" class="wk-clink" data-magnetic>GitHub</a>
					<a href="https://linkedin.com/in/shravanomanakuttan"     target="_blank" rel="noopener" class="wk-clink" data-magnetic>LinkedIn</a>
					<a href="/resume.html"                                   target="_blank" class="wk-clink" data-magnetic>Résumé</a>
				</div>
			</div>
		</section>

	</div><!-- /wk-scroll -->
</div>

<style>
	/* ── overlay shell ─────────────────────────── */
	.wk-overlay {
		position: fixed; inset: 0; z-index: 500;
		background: #09090b;
		color: #e4e4e7;
		font-family: 'Inter', system-ui, sans-serif;
		display: flex; flex-direction: column;
		transform: translateY(100%);
		visibility: hidden;
		pointer-events: none;
		will-change: transform;
	}
	.wk-overlay.wk-open {
		visibility: visible;
		pointer-events: auto;
	}

	/* ── header ────────────────────────────────── */
	.wk-header {
		display: flex; align-items: center; gap: 24px;
		padding: 0 48px;
		height: 60px;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		flex-shrink: 0;
		position: relative; z-index: 10;
	}
	.wk-logo {
		font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
		color: rgba(255,255,255,0.5);
		margin-right: auto;
	}
	.wk-nav { display: flex; gap: 28px; }
	.wk-navlink {
		font-size: 12px; font-weight: 500; letter-spacing: 0.06em;
		color: rgba(255,255,255,0.4);
		text-decoration: none;
		text-transform: lowercase;
		transition: color 0.2s;
	}
	.wk-navlink:hover { color: #fff; }
	.wk-close {
		display: flex; align-items: center; gap: 8px;
		background: none; border: 1px solid rgba(255,255,255,0.12);
		color: rgba(255,255,255,0.5); cursor: pointer;
		font-family: inherit; font-size: 12px; font-weight: 500;
		padding: 6px 14px;
		border-radius: 4px;
		transition: color 0.2s, border-color 0.2s;
		letter-spacing: 0.04em;
	}
	.wk-close:hover { color: #fff; border-color: rgba(255,255,255,0.35); }

	/* ── scroll container ───────────────────────── */
	.wk-scroll {
		flex: 1; overflow-y: auto; overflow-x: hidden;
		scroll-behavior: smooth;
	}
	.wk-scroll::-webkit-scrollbar { width: 3px; }
	.wk-scroll::-webkit-scrollbar-track { background: transparent; }
	.wk-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

	/* ── sections ───────────────────────────────── */
	.wk-section { padding: 80px 48px 100px; max-width: 1100px; margin: 0 auto; }
	.wk-section-label {
		font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
		text-transform: uppercase; color: rgba(255,255,255,0.3);
		margin-bottom: 16px;
	}
	.wk-section-title {
		font-size: clamp(28px, 4vw, 52px); font-weight: 700;
		line-height: 1.15; letter-spacing: -0.02em;
		color: #fff; margin-bottom: 64px;
	}

	/* ── project cards ──────────────────────────── */
	.wk-cards { display: flex; flex-direction: column; gap: 80px; }
	.wk-card {
		display: grid; grid-template-columns: 1fr 1fr; gap: 56px;
		align-items: center;
		opacity: 0; /* animated in by GSAP */
	}
	.wk-card:nth-child(even) { direction: rtl; }
	.wk-card:nth-child(even) > * { direction: ltr; }

	/* mockup shell */
	.wk-card-mockup {
		background: #111113;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 10px;
		overflow: hidden;
		aspect-ratio: 16/10;
		transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s;
	}
	.wk-card:hover .wk-card-mockup {
		transform: scale(1.02) translateY(-4px);
		box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
	}

	/* browser chrome */
	.mock-chrome {
		background: #1a1a1f; height: 28px;
		display: flex; align-items: center; gap: 6px;
		padding: 0 12px; border-bottom: 1px solid rgba(255,255,255,0.05);
		flex-shrink: 0;
	}
	.mc-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.12); flex-shrink: 0; }
	.mc-dot:first-child { background: #ff5f57; }
	.mc-dot:nth-child(2){ background: #febc2e; }
	.mc-dot:nth-child(3){ background: #28c840; }
	.mc-url { font-size: 10px; color: rgba(255,255,255,0.25); margin-left: 10px; font-family: 'JetBrains Mono', monospace; }

	/* mock body */
	.mock-body { display: flex; height: calc(100% - 28px); overflow: hidden; }

	/* CRM mockup */
	.mock-sidebar {
		width: 44px; background: #111; border-right: 1px solid rgba(255,255,255,0.05);
		padding: 12px 8px; display: flex; flex-direction: column; gap: 8px;
		flex-shrink: 0;
	}
	.mock-si { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); }
	.mock-si.active { background: var(--pk); width: 70%; }

	.mock-main { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
	.mock-stats-row { display: flex; gap: 8px; flex-shrink: 0; }
	.mock-stat { flex: 1; background: rgba(255,255,255,0.04); border-radius: 4px; padding: 8px; }
	.mock-num { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); font-family: 'JetBrains Mono', monospace; }
	.mock-slabel { font-size: 9px; color: rgba(255,255,255,0.3); margin-top: 2px; }

	.mock-table { display: flex; flex-direction: column; gap: 4px; }
	.mock-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
	.mock-cell { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); flex: 1; }
	.mock-cell.wide  { flex: 2; }
	.mock-cell.mid   { flex: 1.5; }
	.mock-cell.short { flex: 0.7; }
	.mock-chip { font-size: 8px; padding: 2px 6px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; font-weight: 600; letter-spacing: 0.06em; }

	/* Search mockup */
	.mock-body.search { flex-direction: column; padding: 14px; gap: 10px; }
	.mock-searchbar {
		display: flex; align-items: center; gap: 8px;
		background: rgba(255,255,255,0.05); border-radius: 6px;
		padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1);
	}
	.mock-search-icon { color: rgba(255,255,255,0.3); font-size: 13px; }
	.mock-search-text { flex: 1; font-size: 11px; color: rgba(255,255,255,0.7); font-family: 'JetBrains Mono', monospace; }
	.mock-search-btn { font-size: 9px; padding: 3px 10px; border-radius: 4px; color: #09090b; font-weight: 700; flex-shrink: 0; }
	.mock-results { display: flex; flex-direction: column; gap: 4px; }
	.mock-result-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
	.mock-result-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
	.mock-result-name { flex: 1; font-size: 10px; color: rgba(255,255,255,0.6); }
	.mock-result-score { font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
	.mock-timing { font-size: 9px; color: rgba(255,255,255,0.3); align-self: flex-end; }

	/* Table mockup */
	.mock-body.table { flex-direction: column; padding: 10px; }
	.mock-table-hdr { display: flex; gap: 8px; padding: 4px 0; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); }
	.mock-th { flex: 1; font-size: 8px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

	/* card info */
	.wk-card-info { display: flex; flex-direction: column; gap: 14px; }
	.wk-card-top { display: flex; align-items: center; justify-content: space-between; }
	.wk-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); }
	.wk-year { font-size: 11px; color: rgba(255,255,255,0.2); }
	.wk-card-name { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; margin: 0; }
	.wk-card-story { font-size: 14px; line-height: 1.75; color: rgba(255,255,255,0.6); margin: 0; }
	.wk-card-metric { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); font-family: 'JetBrains Mono', monospace; }
	.wk-card-tech { display: flex; flex-wrap: wrap; gap: 6px; }
	.wk-tech-chip {
		font-size: 10px; padding: 3px 9px;
		border: 1px solid rgba(255,255,255,0.1); border-radius: 100px;
		color: rgba(255,255,255,0.45);
		letter-spacing: 0.04em;
	}
	.wk-card-link {
		font-size: 13px; font-weight: 600; color: var(--pk);
		text-decoration: none; display: inline-block;
		transition: letter-spacing 0.3s;
	}
	.wk-card-link:hover { letter-spacing: 0.06em; }

	/* ── about ──────────────────────────────────── */
	.wk-section-about { padding-top: 100px; border-top: 1px solid rgba(255,255,255,0.06); }
	.wk-about-grid { display: grid; grid-template-columns: 340px 1fr; gap: 80px; align-items: start; }

	.wk-photo { opacity: 0; }
	.wk-photo-placeholder {
		aspect-ratio: 3/4; border-radius: 8px;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		display: flex; flex-direction: column;
		align-items: center; justify-content: center; gap: 16px;
		border: 1px solid rgba(255,255,255,0.07);
		position: relative; overflow: hidden;
	}
	.wk-photo-placeholder::before {
		content: '';
		position: absolute; inset: 0;
		background: radial-gradient(ellipse at 50% 30%, rgba(122,162,247,0.15), transparent 70%);
	}
	.wk-photo-initials {
		font-size: 72px; font-weight: 900; color: rgba(255,255,255,0.06);
		letter-spacing: -0.04em; line-height: 1;
		position: relative; z-index: 1;
	}
	.wk-photo-caption {
		font-size: 11px; color: rgba(255,255,255,0.25);
		text-align: center; line-height: 1.6;
		position: relative; z-index: 1;
	}

	.wk-bio { opacity: 0; }
	.wk-bio-title {
		font-size: clamp(24px, 3vw, 40px); font-weight: 700;
		line-height: 1.25; letter-spacing: -0.02em;
		color: #fff; margin-bottom: 28px;
	}
	.wk-bio-p { font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.55); margin-bottom: 16px; }
	.wk-bio-links { display: flex; gap: 20px; margin-top: 28px; flex-wrap: wrap; }
	.wk-link {
		font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
		color: rgba(255,255,255,0.5); text-decoration: none;
		border-bottom: 1px solid rgba(255,255,255,0.15);
		padding-bottom: 2px;
		transition: color 0.2s, border-color 0.2s;
	}
	.wk-link:hover { color: #fff; border-color: rgba(255,255,255,0.5); }

	/* ── contact ────────────────────────────────── */
	.wk-section-contact {
		min-height: 50vh;
		display: flex; align-items: center; justify-content: center;
		border-top: 1px solid rgba(255,255,255,0.06);
		text-align: center;
	}
	.wk-contact-inner { opacity: 0; display: flex; flex-direction: column; align-items: center; gap: 20px; }
	.wk-contact-title {
		font-size: clamp(36px, 6vw, 80px); font-weight: 800;
		letter-spacing: -0.04em; color: #fff; line-height: 1;
	}
	.wk-email {
		font-size: clamp(14px, 2vw, 22px); font-weight: 500;
		color: rgba(255,255,255,0.5); text-decoration: none;
		border-bottom: 1px solid rgba(255,255,255,0.15);
		padding-bottom: 3px;
		transition: color 0.25s, border-color 0.25s;
		letter-spacing: -0.01em;
	}
	.wk-email:hover { color: #fff; border-color: rgba(255,255,255,0.5); }
	.wk-contact-sub { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.6; max-width: 480px; }
	.wk-contact-links { display: flex; gap: 24px; margin-top: 8px; }
	.wk-clink {
		font-size: 13px; font-weight: 600; letter-spacing: 0.06em;
		color: rgba(255,255,255,0.4); text-decoration: none;
		text-transform: uppercase;
		transition: color 0.2s;
	}
	.wk-clink:hover { color: #fff; }

	/* ── responsive ─────────────────────────────── */
	@media (max-width: 768px) {
		.wk-header { padding: 0 20px; }
		.wk-nav { display: none; }
		.wk-section { padding: 48px 20px 64px; }
		.wk-card { grid-template-columns: 1fr; gap: 28px; direction: ltr !important; }
		.wk-card:nth-child(even) { direction: ltr; }
		.wk-about-grid { grid-template-columns: 1fr; gap: 40px; }
		.wk-photo-placeholder { aspect-ratio: 1; max-width: 200px; }
		.wk-contact-title { font-size: 36px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.wk-overlay    { transition: none; }
		.wk-card-mockup{ transition: none; }
		.wk-card, .wk-photo, .wk-bio, .wk-contact-inner { opacity: 1; }
	}
</style>
