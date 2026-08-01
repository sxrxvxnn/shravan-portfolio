// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResumeLink {
	label: string;
	url: string;
	type: 'primary' | 'secondary';
}

export interface ResumeAbout {
	name: string;
	role: string;
	bio: string;
	facts: string[];
	links: ResumeLink[];
}

export interface ResumeProject {
	name: string;
	desc: string;
	tech: string[];
	url?: string;
}

export interface ResumeSkills {
	frontend: string[];
	backend: string[];
	tools: string[];
}

export interface ResumeContact {
	email: string;
	github: string;
	linkedin: string;
	twitter: string;
	location: string;
	available: boolean;
}

export interface ResumeData {
	about: ResumeAbout;
	projects: ResumeProject[];
	skills: ResumeSkills;
	contact: ResumeContact;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Edit this file to update your portfolio content.
// The 3D scene reads from this same source, so changes here update both the
// interactive room labels AND the SEO-friendly HTML fallback pages.

export const resume: ResumeData = {
	about: {
		name: 'Shravan Omanakuttan',
		role: 'SWE Intern · Beagle Security',
		bio: "I write Python until 2am and push to prod at 9am. Currently at Beagle Security building Sonar — a lead intelligence platform I designed from scratch, solo, in 3 months. 10+ working modules, used daily by the sales team. I don't do toy projects.",
		facts: [
			'B.Tech CS & AI — SRM University, Chennai',
			'SWE Intern @ Beagle Security (security SaaS)',
			'Built and shipped Sonar solo in 90 days',
			'Trivandrum, India · Open to relocate'
		],
		links: [
			{ label: 'GitHub', url: 'https://github.com/sxrxvxnn', type: 'primary' },
			{ label: 'LinkedIn', url: 'https://linkedin.com/in/shravanomanakuttan', type: 'secondary' },
			{ label: 'Email', url: 'mailto:shravanomanakuttan@gmail.com', type: 'secondary' }
		]
	},

	projects: [
		{
			name: 'Sonar',
			desc: 'Apollo.io-style lead intelligence platform I built from the ground up at Beagle Security. Replaces a $800/mo tool. FastAPI + Supabase backend, React dashboard with 10+ modules, used daily by the sales team. 90-day solo build.',
			tech: ['FastAPI', 'React', 'Supabase', 'Vercel', 'Chrome MV3'],
			url: 'https://github.com/sxrxvxnn'
		},
		{
			name: 'Lookalike Search Engine',
			desc: 'Feed it any company, get ranked B2B lookalikes in under 2 seconds. Single structured Groq inference scores similarity across industry, business model, tech signals, and market segment. No vector DB — just smart prompting.',
			tech: ['Groq', 'Python', 'FastAPI', 'PostgreSQL'],
			url: 'https://github.com/sxrxvxnn/leadgen-platform'
		},
		{
			name: 'LinkedIn DM Pipeline',
			desc: 'Playwright scraper that survives LinkedIn\'s SPA rendering, hash-obfuscated class names, and rate limiting. Verifies 1,200+ decision-maker profiles, cross-validates job titles against company records. Actually works in production.',
			tech: ['Python', 'Playwright', 'PostgreSQL'],
			url: 'https://github.com/sxrxvxnn/leadgen-platform'
		},
		{
			name: 'Sonar Chrome Extension',
			desc: 'MV3 extension that turns any LinkedIn profile page into a one-click lead capture. Service worker + content script architecture, real-time Supabase sync via authenticated REST, works on both profile and company pages.',
			tech: ['Chrome MV3', 'TypeScript', 'REST API'],
			url: 'https://github.com/sxrxvxnn'
		}
	],

	skills: {
		frontend: ['React.js / Next.js', 'TypeScript', 'Vite', 'Chrome Extensions (MV3)', 'SvelteKit'],
		backend: ['Python / FastAPI', 'PostgreSQL / Supabase', 'REST APIs', 'Playwright', 'PDL API'],
		tools: ['Groq / Gemini / OpenRouter', 'Git / GitHub', 'Vercel', 'PostHog', 'Firecrawl', 'Hunter.io']
	},

	contact: {
		email: 'shravanomanakuttan@gmail.com',
		github: 'github.com/sxrxvxnn',
		linkedin: 'linkedin.com/in/shravanomanakuttan',
		twitter: '@sxrxvxnn',
		location: 'Trivandrum, India',
		available: true
	}
};
