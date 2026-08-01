<script lang="ts">
	let name = $state('');
	let email = $state('');
	let message = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !message.trim()) return;
		status = 'sending';
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, message }),
			});
			status = res.ok ? 'sent' : 'error';
		} catch {
			status = 'error';
		}
	}
</script>

{#if status === 'sent'}
	<div class="sent">
		<div class="sent-icon">✓</div>
		<p>Message sent! I'll get back to you soon.</p>
	</div>
{:else}
	<form onsubmit={handleSubmit} class="contact-form">
		<div class="available-badge">Open to opportunities</div>

		<div class="links">
			<a href="mailto:shravanomanakuttan@gmail.com">shravanomanakuttan@gmail.com</a>
			<a href="https://github.com/sxrxvxnn" target="_blank" rel="noopener">github.com/sxrxvxnn</a>
			<a href="https://linkedin.com/in/shravanomanakuttan" target="_blank" rel="noopener">linkedin.com/in/shravanomanakuttan</a>
		</div>

		<div class="divider">or send a message</div>

		<div class="field">
			<label for="cf-name">Name</label>
			<input id="cf-name" type="text" bind:value={name} placeholder="Your name" required autocomplete="name" />
		</div>
		<div class="field">
			<label for="cf-email">Email</label>
			<input id="cf-email" type="email" bind:value={email} placeholder="you@example.com" required autocomplete="email" />
		</div>
		<div class="field">
			<label for="cf-msg">Message</label>
			<textarea id="cf-msg" bind:value={message} placeholder="What's on your mind?" required rows="4"></textarea>
		</div>

		{#if status === 'error'}
			<p class="err">Something went wrong. Email me directly instead.</p>
		{/if}

		<button type="submit" disabled={status === 'sending'} class="submit-btn">
			{status === 'sending' ? 'Sending…' : 'Send message'}
		</button>
	</form>
{/if}

<style>
	.contact-form { display: flex; flex-direction: column; gap: 14px; }

	.available-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 20px;
		background: rgba(80,200,120,0.15);
		color: #80e8a0;
		border: 1px solid rgba(80,200,120,0.3);
		font-size: 12px;
		font-weight: 600;
		width: fit-content;
	}

	.links {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.links a {
		color: #88aaff;
		font-size: 13px;
		text-decoration: none;
	}
	.links a:hover { text-decoration: underline; }

	.divider {
		font-size: 11px;
		color: rgba(255,255,255,0.3);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		position: relative;
		text-align: center;
	}
	.divider::before, .divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 30%;
		height: 1px;
		background: rgba(255,255,255,0.1);
	}
	.divider::before { left: 0; }
	.divider::after { right: 0; }

	.field { display: flex; flex-direction: column; gap: 5px; }
	label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }

	input, textarea {
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 8px;
		color: #e8eeff;
		font-size: 13px;
		padding: 9px 12px;
		outline: none;
		resize: none;
		font-family: inherit;
		transition: border-color 0.2s;
	}
	input:focus, textarea:focus { border-color: rgba(124,106,247,0.5); }
	input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }

	.err { font-size: 12px; color: #ff8888; margin: 0; }

	.submit-btn {
		padding: 10px 20px;
		background: linear-gradient(135deg, #7c6af7, #5af778);
		border: none;
		border-radius: 10px;
		color: #0d0d1a;
		font-size: 13px;
		font-weight: 700;
		cursor: none;
		transition: opacity 0.2s, transform 0.15s;
	}
	.submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
	.submit-btn:disabled { opacity: 0.5; transform: none; }

	.sent {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 32px 0;
		text-align: center;
	}
	.sent-icon {
		width: 48px; height: 48px;
		border-radius: 50%;
		background: rgba(90,247,120,0.15);
		border: 2px solid #5af778;
		display: flex; align-items: center; justify-content: center;
		font-size: 20px; color: #5af778;
	}
	.sent p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 0; }
</style>
