<script lang="ts">
	import { page } from '$app/stores';
	import { resume } from '$lib/data/resume.js';

	const navLinks = [
		{ href: '/', label: 'Home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
		{ href: '/about', label: 'About', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
		{ href: '/projects', label: 'Projects', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
		{ href: '/contact', label: 'Contact', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
	];

	const allSkills = [...resume.skills.frontend, ...resume.skills.backend, ...resume.skills.tools];
</script>

<aside class="sidebar">
	<!-- Logo -->
	<a href="/" class="logo" aria-label="Home">
		<svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
			<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
		</svg>
		<span>Portfolio</span>
	</a>

	<!-- Main nav -->
	<nav class="main-nav" aria-label="Main navigation">
		<ul>
			{#each navLinks as link}
				<li>
					<a
						href={link.href}
						class="nav-link"
						class:active={$page.url.pathname === link.href}
						aria-current={$page.url.pathname === link.href ? 'page' : undefined}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">
							<path d={link.icon} />
						</svg>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="divider"></div>

	<!-- Your Library -->
	<div class="library">
		<div class="library-header">
			<span class="library-icon">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
			</span>
			<span>Your Library</span>
		</div>
		<ul class="library-list">
			{#each allSkills.slice(0, 12) as skill}
				<li class="library-item">
					<div class="skill-dot" aria-hidden="true"></div>
					<span>{skill}</span>
				</li>
			{/each}
		</ul>
	</div>

	<!-- Available badge -->
	<div class="available">
		<span class="pulse" aria-hidden="true"></span>
		Open to opportunities
	</div>
</aside>

<style>
	.sidebar {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 90px;
		width: 240px;
		background: #000;
		display: flex;
		flex-direction: column;
		padding: 24px 12px 16px;
		overflow-y: auto;
		z-index: 50;
		scrollbar-width: none;
	}
	.sidebar::-webkit-scrollbar { display: none; }

	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		font-size: 15px;
		padding: 4px 12px 20px;
	}
	.logo svg { color: #1DB954; flex-shrink: 0; }

	.main-nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 12px;
		border-radius: 6px;
		color: #B3B3B3;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		transition: color 0.15s, background 0.15s;
	}
	.nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
	.nav-link.active { color: #fff; }
	.nav-link.active svg { color: #1DB954; }

	.divider {
		height: 1px;
		background: rgba(255,255,255,0.1);
		margin: 16px 12px;
	}

	.library-header {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #B3B3B3;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0 12px 12px;
	}

	.library-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.library-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 12px;
		border-radius: 4px;
		cursor: default;
		color: #B3B3B3;
		font-size: 13px;
		transition: color 0.15s;
	}
	.library-item:hover { color: #fff; }

	.skill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #1DB954;
		flex-shrink: 0;
		opacity: 0.5;
	}
	.library-item:hover .skill-dot { opacity: 1; }

	.available {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		font-size: 11px;
		font-weight: 600;
		color: #1DB954;
		letter-spacing: 0.04em;
		margin-top: auto;
	}

	.pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #1DB954;
		animation: pulse 2s ease-in-out infinite;
		flex-shrink: 0;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	@media (max-width: 768px) {
		.sidebar { display: none; }
	}
</style>
