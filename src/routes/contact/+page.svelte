<script lang="ts">
	import { resume } from '$lib/data/resume.js';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!name || !email || !message) return;
		status = 'sending';
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, message })
			});
			status = res.ok ? 'sent' : 'error';
		} catch {
			status = 'error';
		}
	}

	const socials = [
		{ label: 'GitHub', href: `https://${resume.contact.github}`, handle: `@${resume.contact.github.split('/')[1]}` },
		{ label: 'LinkedIn', href: `https://${resume.contact.linkedin}`, handle: 'Shravan Omanakuttan' },
		{ label: 'Email', href: `mailto:${resume.contact.email}`, handle: resume.contact.email },
		{ label: 'Twitter', href: `https://twitter.com/${resume.contact.twitter.replace('@', '')}`, handle: resume.contact.twitter },
	];
</script>

<svelte:head>
	<title>Contact — {resume.about.name}</title>
</svelte:head>

<div class="contact-page">
	<!-- Header -->
	<div class="page-header">
		<span class="eyebrow">Queue</span>
		<h1 class="page-title">Let's Work Together</h1>
		<p class="page-sub">
			{resume.contact.available ? 'Available for internships and collabs.' : 'Not currently available.'}&nbsp;
			<span class="location">Based in {resume.contact.location}.</span>
		</p>
		{#if resume.contact.available}
			<div class="available-badge">
				<span class="pulse" aria-hidden="true"></span>
				Open to opportunities
			</div>
		{/if}
	</div>

	<div class="content-grid">
		<!-- Form -->
		<div class="form-section">
			<h2 class="section-title">Send a Message</h2>

			{#if status === 'sent'}
				<div class="success-card">
					<div class="success-icon">
						<svg viewBox="0 0 24 24" fill="#1DB954" width="32" height="32"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
					</div>
					<h3>Message sent.</h3>
					<p>Will get back to you soon.</p>
					<button class="btn-ghost" onclick={() => { status = 'idle'; name = ''; email = ''; message = ''; }}>
						Send another
					</button>
				</div>
			{:else}
				<form class="form" onsubmit={submit}>
					<div class="field-group">
						<label for="name" class="label">Name</label>
						<input
							id="name"
							type="text"
							class="input"
							placeholder="Your name"
							bind:value={name}
							required
							disabled={status === 'sending'}
						/>
					</div>

					<div class="field-group">
						<label for="email" class="label">Email</label>
						<input
							id="email"
							type="email"
							class="input"
							placeholder="your@email.com"
							bind:value={email}
							required
							disabled={status === 'sending'}
						/>
					</div>

					<div class="field-group">
						<label for="message" class="label">Message</label>
						<textarea
							id="message"
							class="input textarea"
							placeholder="What's on your mind?"
							rows="5"
							bind:value={message}
							required
							disabled={status === 'sending'}
						></textarea>
					</div>

					{#if status === 'error'}
						<p class="error-text">Failed to send. Try emailing directly.</p>
					{/if}

					<button type="submit" class="btn-submit" disabled={status === 'sending'}>
						{#if status === 'sending'}
							<span class="dots"><span></span><span></span><span></span></span>
							Sending...
						{:else}
							<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
							Send Message
						{/if}
					</button>
				</form>
			{/if}
		</div>

		<!-- Socials panel -->
		<div class="socials-section">
			<h2 class="section-title">Find Me On</h2>

			<div class="social-list">
				{#each socials as s}
					<a href={s.href} target={s.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener" class="social-card">
						<div class="social-label">{s.label}</div>
						<div class="social-handle">{s.handle}</div>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="arrow"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
					</a>
				{/each}
			</div>

			<div class="quick-email">
				<p class="qe-label">Or just email directly</p>
				<a href="mailto:{resume.contact.email}" class="email-link">{resume.contact.email}</a>
			</div>
		</div>
	</div>

	<div style="height: 40px"></div>
</div>

<style>
	.contact-page { min-height: 100%; }

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 80px 32px 40px;
		background: linear-gradient(180deg, #1a1a2e 0%, #121212 100%);
	}

	.eyebrow {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #1DB954;
	}

	.page-title {
		font-size: clamp(32px, 5vw, 64px);
		font-weight: 900;
		color: #fff;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.page-sub {
		font-size: 16px;
		color: rgba(255,255,255,0.7);
	}
	.location { color: #B3B3B3; }

	.available-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgba(29,185,84,0.1);
		border: 1px solid rgba(29,185,84,0.3);
		border-radius: 50px;
		padding: 6px 16px;
		font-size: 12px;
		font-weight: 700;
		color: #1DB954;
		width: fit-content;
	}

	.pulse {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #1DB954;
		animation: pulse 2s ease-in-out infinite;
		flex-shrink: 0;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 32px;
		padding: 32px;
	}

	.section-title {
		font-size: 18px;
		font-weight: 800;
		color: #fff;
		margin-bottom: 20px;
		letter-spacing: -0.01em;
	}

	/* Form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #B3B3B3;
	}

	.input {
		background: #181818;
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 6px;
		padding: 14px 16px;
		color: #fff;
		font-size: 14px;
		font-family: inherit;
		transition: border-color 0.15s;
		outline: none;
		width: 100%;
	}
	.input:focus { border-color: #1DB954; }
	.input::placeholder { color: rgba(255,255,255,0.35); }
	.input:disabled { opacity: 0.6; cursor: not-allowed; }
	.textarea { resize: vertical; min-height: 120px; }

	.error-text {
		font-size: 13px;
		color: #E91429;
	}

	.btn-submit {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 32px;
		background: #1DB954;
		border: none;
		border-radius: 50px;
		color: #000;
		font-size: 14px;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s, transform 0.1s;
		width: fit-content;
	}
	.btn-submit:hover:not(:disabled) { background: #1ed760; transform: scale(1.02); }
	.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

	/* Dots animation */
	.dots { display: flex; gap: 3px; }
	.dots span {
		width: 4px;
		height: 4px;
		background: currentColor;
		border-radius: 50%;
		animation: dot 0.8s ease-in-out infinite;
	}
	.dots span:nth-child(2) { animation-delay: 0.15s; }
	.dots span:nth-child(3) { animation-delay: 0.3s; }
	@keyframes dot { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }

	/* Success */
	.success-card {
		background: #181818;
		border: 1px solid rgba(29,185,84,0.3);
		border-radius: 12px;
		padding: 40px 32px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.success-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(29,185,84,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.success-card h3 { font-size: 20px; font-weight: 700; color: #fff; }
	.success-card p { color: #B3B3B3; font-size: 14px; }
	.btn-ghost {
		padding: 10px 24px;
		border: 1px solid rgba(255,255,255,0.2);
		border-radius: 50px;
		background: none;
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		margin-top: 8px;
		transition: border-color 0.15s;
	}
	.btn-ghost:hover { border-color: #1DB954; color: #1DB954; }

	/* Socials */
	.social-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 32px; }

	.social-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: #181818;
		border-radius: 8px;
		text-decoration: none;
		transition: background 0.15s;
		position: relative;
	}
	.social-card:hover { background: #282828; }
	.social-card:hover .arrow { opacity: 1; }

	.social-label {
		font-size: 13px;
		font-weight: 700;
		color: #B3B3B3;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		min-width: 72px;
	}
	.social-handle {
		font-size: 14px;
		color: #fff;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.arrow {
		color: #B3B3B3;
		opacity: 0;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}

	.quick-email { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; }
	.qe-label { font-size: 12px; color: #B3B3B3; margin-bottom: 8px; }
	.email-link {
		font-size: 15px;
		font-weight: 600;
		color: #1DB954;
		text-decoration: none;
		word-break: break-all;
	}
	.email-link:hover { text-decoration: underline; }

	@media (max-width: 900px) {
		.content-grid { grid-template-columns: 1fr; }
	}

	@media (max-width: 768px) {
		.page-header { padding: 32px 16px 24px; }
		.content-grid { padding: 16px; gap: 24px; }
	}
</style>
