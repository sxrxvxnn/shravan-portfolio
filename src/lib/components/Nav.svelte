<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let scrolled = $state(false);
	let el: HTMLElement;

	onMount(() => {
		const onScroll = () => { scrolled = window.scrollY > 40; };
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const links = [
		{ href: '/projects', label: 'Work' },
		{ href: '/about',    label: 'About' },
		{ href: '/contact',  label: 'Contact' },
	];
</script>

<nav class="top-nav" class:scrolled bind:this={el}>
	<a href="/" class="nav-name">
		<span class="nav-name-text">SHRAVAN OMANAKUTTAN</span>
	</a>

	<div class="nav-links">
		{#each links as link}
			<a
				href={link.href}
				class="nav-link"
				class:active={$page.url.pathname.startsWith(link.href)}
			>{link.label}</a>
		{/each}
		<a href="/contact" class="nav-hire">Hire me</a>
	</div>
</nav>

<style>
	.top-nav {
		position: fixed;
		top: 0; left: 0; right: 0;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 40px;
		z-index: 200;
		transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
	}

	.top-nav.scrolled {
		background: rgba(8, 12, 16, 0.8);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(0, 229, 255, 0.08);
	}

	.nav-name {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-decoration: none;
		color: #fff;
		transition: color 0.15s;
	}
	.nav-name:hover { color: #00e5ff; }

	.nav-name-text { display: block; }

	.nav-links {
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.nav-link {
		font-size: 13px;
		font-weight: 600;
		color: rgba(255,255,255,0.45);
		text-decoration: none;
		letter-spacing: 0.04em;
		transition: color 0.15s;
	}
	.nav-link:hover, .nav-link.active { color: #fff; }

	.nav-hire {
		padding: 8px 20px;
		border-radius: 100px;
		background: transparent;
		border: 1px solid rgba(0, 229, 255, 0.4);
		color: #00e5ff;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-decoration: none;
		transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
	}
	.nav-hire:hover {
		background: rgba(0, 229, 255, 0.1);
		border-color: #00e5ff;
		box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
	}

	@media (max-width: 768px) {
		.top-nav { padding: 0 20px; }
		.nav-hire { display: none; }
		.nav-links { gap: 20px; }
	}
</style>
