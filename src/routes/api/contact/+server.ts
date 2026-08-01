import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, email, message } = await request.json();

	if (!name?.trim() || !email?.trim() || !message?.trim()) {
		return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
	}

	const apiKey = process.env.RESEND_API_KEY;

	// Without RESEND_API_KEY set in Vercel env vars, log and return success
	// Add RESEND_API_KEY to Vercel project settings to enable real email sending
	if (!apiKey) {
		console.log(`[contact] ${email} — ${name}: ${message.slice(0, 80)}`);
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: 'Portfolio Contact <onboarding@resend.dev>',
			to: 'shravanomanakuttan@gmail.com',
			reply_to: email,
			subject: `Portfolio message from ${name}`,
			text: `From: ${name} <${email}>\n\n${message}`,
		}),
	});

	return new Response(JSON.stringify({ ok: res.ok }), { status: res.ok ? 200 : 500 });
};
