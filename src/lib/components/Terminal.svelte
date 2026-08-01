<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { resume } from '$lib/data/resume.js';

	type Line =
		| { t: 'prompt'; cmd: string }
		| { t: 'out'; text: string; dim?: boolean; accent?: boolean; green?: boolean; yellow?: boolean }
		| { t: 'blank' };

	let lines        = $state<Line[]>([]);
	let inputValue   = $state('');
	let busy         = $state(true);
	let isMobile     = $state(false);
	let clockTime    = $state('');
	let matrixActive = $state(false);
	let matrixCanvas = $state<HTMLCanvasElement | null>(null);

	let inputEl:  HTMLInputElement;
	let outputEl: HTMLElement;
	let cmdHistory: string[] = [];
	let histIdx = -1;

	const PROMPT     = 'shravan@portfolio:~$';
	const THEME_KEY  = 'shravan-theme';
	const VISITED_KEY = 'shravan-visited';

	type Theme = { accent: string; glow: string; green: string; greenGlow: string; name: string };
	const THEMES: Record<string, Theme> = {
		gruvbox: { accent: '#fabd2f', glow: 'rgba(250,189,47,0.45)',  green: '#b8bb26', greenGlow: 'rgba(184,187,38,0.4)',  name: 'gruvbox' },
		tokyo:   { accent: '#7aa2f7', glow: 'rgba(122,162,247,0.45)', green: '#9ece6a', greenGlow: 'rgba(158,206,106,0.4)', name: 'tokyo'   },
		dracula: { accent: '#ff79c6', glow: 'rgba(255,121,198,0.45)', green: '#50fa7b', greenGlow: 'rgba(80,250,123,0.4)',  name: 'dracula' },
	};
	let currentTheme = $state(THEMES.gruvbox);

	// Konami code tracker
	const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
	let konamiIdx = 0;

	// ── Matrix rain ───────────────────────────────────────────────────────────
	$effect(() => {
		if (matrixActive && matrixCanvas) {
			const canvas = matrixCanvas;
			canvas.width  = window.innerWidth;
			canvas.height = window.innerHeight;
			const ctx  = canvas.getContext('2d')!;
			const cols  = Math.floor(canvas.width / 14);
			const drops = Array<number>(cols).fill(1);
			const chars = 'アイウエオカキクケコ0123456789ABCDEF<>{}[]()';
			let frame: number;

			function draw() {
				ctx.fillStyle = 'rgba(40,40,40,0.05)';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.font = '13px "JetBrains Mono", monospace';
				drops.forEach((y, x) => {
					const bright = Math.random() > 0.9;
					ctx.fillStyle   = bright ? '#d9d7a8' : '#b8bb26';
					ctx.globalAlpha = bright ? 1 : 0.7;
					ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x * 14, y * 14);
					ctx.globalAlpha = 1;
					if (y * 14 > canvas.height && Math.random() > 0.975) drops[x] = 0;
					drops[x]++;
				});
				frame = requestAnimationFrame(draw);
			}

			draw();
			const timer = setTimeout(() => {
				cancelAnimationFrame(frame);
				matrixActive = false;
			}, 4000);
			return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
		}
	});

	// ── Helpers ───────────────────────────────────────────────────────────────
	function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

	async function scrollBottom() {
		await tick();
		if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
	}

	async function push(...ls: Line[]) {
		lines = [...lines, ...ls];
		await scrollBottom();
	}

	async function typeCommand(cmd: string, speed = 40) {
		const line: Line = { t: 'prompt', cmd: '' };
		lines = [...lines, line];
		await scrollBottom();
		for (const ch of cmd) {
			(line as Extract<Line, { t: 'prompt' }>).cmd += ch;
			lines = [...lines];
			await scrollBottom();
			await sleep(speed);
		}
		await sleep(230);
	}

	async function bootLines(ls: Line[], delayMs = 48) {
		for (const l of ls) {
			lines = [...lines, l];
			await scrollBottom();
			await sleep(delayMs);
		}
	}

	// ── Projects ──────────────────────────────────────────────────────────────
	const PROJECTS: Record<string, { name: string; desc: string; tech: string[]; url: string; metric: string }> = {
		sonar: {
			name: 'Sonar',
			desc: 'Apollo.io-style lead intelligence platform built solo in 90 days.\nReplaced an $800/mo SaaS. 10+ modules, used daily by the sales team.',
			tech: ['fastapi', 'react', 'supabase', 'vercel', 'chrome-mv3'],
			url: 'https://github.com/sxrxvxnn',
			metric: '90-day solo build · 10+ modules in production'
		},
		'lookalike-search': {
			name: 'Lookalike Search Engine',
			desc: 'Feed it any company, get ranked B2B lookalikes in under 2 seconds.\nSingle structured Groq inference — no vector DB, just smart prompting.',
			tech: ['groq', 'python', 'fastapi', 'postgresql'],
			url: 'https://github.com/sxrxvxnn/leadgen-platform',
			metric: '<2s end-to-end · single LLM call'
		},
		'linkedin-pipeline': {
			name: 'LinkedIn DM Pipeline',
			desc: 'Playwright scraper surviving SPA rendering and hash-obfuscated\nclass names. Verifies 1,200+ decision-maker profiles in production.',
			tech: ['python', 'playwright', 'postgresql'],
			url: 'https://github.com/sxrxvxnn/leadgen-platform',
			metric: '1,200+ profiles verified · handles SPA rendering'
		},
		'chrome-ext': {
			name: 'Sonar Chrome Extension',
			desc: 'MV3 extension — one click to capture any LinkedIn profile into Sonar.\nService worker + content script, real-time Supabase sync.',
			tech: ['chrome-mv3', 'typescript', 'rest-api'],
			url: 'https://github.com/sxrxvxnn',
			metric: 'MV3 · real-time sync · profile + company pages'
		}
	};
	const PROJECT_KEYS = Object.keys(PROJECTS);

	// ── Tab completion ─────────────────────────────────────────────────────────
	const COMPLETIONS = [
		'help', 'help --recruiter', 'whoami', 'ls', 'ls projects', 'ls -la',
		'skills', 'status', 'contact', 'neofetch', 'matrix', 'clear', 'cls',
		'exit', 'history', 'date', 'uname -a', 'experience', 'tree', 'schedule',
		'git log', 'vim', 'cowsay hire me',
		'ssh root@google.com', 'ping faang.com', 'ping google.com',
		'curl wttr.in/trivandrum', 'cat resume', 'open resume', 'download resume',
		'sudo hire shravan',
		'theme gruvbox', 'theme tokyo', 'theme dracula',
		'open github', 'open linkedin', 'open email',
		'man shravan', 'man help', 'man ls', 'man cat', 'man git',
		...PROJECT_KEYS.map(k => `cat ${k}`),
		...PROJECT_KEYS.map(k => `open ${k}`),
	];

	function tabComplete() {
		const val = inputValue.toLowerCase().trim();
		if (!val) return;
		const matches = COMPLETIONS.filter(c => c.startsWith(val) && c !== val);
		if (matches.length === 1) {
			inputValue = matches[0];
		} else if (matches.length > 1) {
			push({ t: 'blank' }, ...matches.map(m => ({ t: 'out' as const, text: '  ' + m, dim: true })), { t: 'blank' });
		}
	}

	// ── Commands ──────────────────────────────────────────────────────────────
	function runCommand(raw: string): Line[] {
		const cmd   = raw.trim().toLowerCase();
		const parts = cmd.split(/\s+/);
		const verb  = parts[0];
		const arg   = parts.slice(1).join(' ');
		if (!cmd) return [];

		// ── help ──
		if (cmd === 'help') return [
			{ t: 'blank' },
			{ t: 'out', text: 'COMMANDS', accent: true },
			{ t: 'out', text: '  whoami                about me', dim: true },
			{ t: 'out', text: '  experience            work history', dim: true },
			{ t: 'out', text: '  ls projects           list projects', dim: true },
			{ t: 'out', text: '  ls -la                all files (including hidden)', dim: true },
			{ t: 'out', text: '  cat <project>         project details', dim: true },
			{ t: 'out', text: '  open <project|link>   open in browser', dim: true },
			{ t: 'out', text: '  skills                tech stack', dim: true },
			{ t: 'out', text: '  status                availability', dim: true },
			{ t: 'out', text: '  neofetch              system info', dim: true },
			{ t: 'out', text: '  tree                  project directory', dim: true },
			{ t: 'out', text: '  git log               commit history', dim: true },
			{ t: 'out', text: '  matrix                ???', dim: true },
			{ t: 'out', text: '  contact               get in touch', dim: true },
			{ t: 'out', text: '  schedule              book a call', dim: true },
			{ t: 'out', text: '  cat resume            view CV', dim: true },
			{ t: 'out', text: '  download resume       save PDF', dim: true },
			{ t: 'out', text: '  theme <gruvbox|tokyo|dracula>', dim: true },
			{ t: 'out', text: '  man <cmd>             manual pages', dim: true },
			{ t: 'out', text: '  date · history · clear · uname -a', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '  help --recruiter      not a dev? start here ↓', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  tab autocomplete  ·  ↑↓ history  ·  ctrl+l clear', dim: true },
			{ t: 'blank' },
		];

		if (cmd === 'help --recruiter') return [
			{ t: 'blank' },
			{ t: 'out', text: '━━  RECRUITER GUIDE  ━━━━━━━━━━━━━━━━━━━━━━━━', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  Not a developer? Here\'s what you need to know.' },
			{ t: 'blank' },
			{ t: 'out', text: '  WHO', accent: true },
			{ t: 'out', text: '    Shravan Omanakuttan' },
			{ t: 'out', text: '    SWE Intern @ Beagle Security (security SaaS)' },
			{ t: 'out', text: '    B.Tech CS & AI — SRM University, Delhi-NCR' },
			{ t: 'blank' },
			{ t: 'out', text: '  WHAT HE BUILT', accent: true },
			{ t: 'out', text: '    Sonar — replaced an $800/mo enterprise tool, solo, in 90 days.' },
			{ t: 'out', text: '    AI-powered lead intelligence. 10+ modules. Ships daily.' },
			{ t: 'blank' },
			{ t: 'out', text: '  STACK', accent: true },
			{ t: 'out', text: '    Python · FastAPI · React · TypeScript · Supabase', dim: true },
			{ t: 'out', text: '    Groq AI · Playwright · PostgreSQL · Chrome MV3', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '  AVAILABILITY', accent: true },
			{ t: 'out', text: '    Available from 2026 · Open to relocate', green: true },
			{ t: 'blank' },
			{ t: 'out', text: '  NEXT STEP  →  open email  or  schedule', accent: true },
			{ t: 'blank' },
		];

		// ── whoami ──
		if (cmd === 'whoami') return [
			{ t: 'blank' },
			{ t: 'out', text: 'Shravan Omanakuttan', accent: true },
			{ t: 'out', text: 'SWE Intern — Beagle Security' },
			{ t: 'out', text: 'B.Tech CS & AI — SRM University, Delhi-NCR' },
			{ t: 'out', text: 'Trivandrum, India  ·  open to relocate' },
			{ t: 'blank' },
			{ t: 'out', text: resume.about.bio },
			{ t: 'blank' },
		];

		// ── experience ──
		if (cmd === 'experience') return [
			{ t: 'blank' },
			{ t: 'out', text: 'EXPERIENCE', accent: true },
			{ t: 'out', text: '──────────────────────────────────────────', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: 'Beagle Security                     Apr 2026 – Present', accent: true },
			{ t: 'out', text: 'SWE Intern · Remote' },
			{ t: 'blank' },
			{ t: 'out', text: '  ▸ Built Sonar — replaced $800/mo Apollo.io sub, solo, 90 days', green: true },
			{ t: 'out', text: '  ▸ 10+ modules shipped: Company Intel · Prospect Search · ICP Scoring' },
			{ t: 'out', text: '  ▸ Multi-stage email enrichment: Hunter.io · Apollo · PDL · Groq' },
			{ t: 'out', text: '  ▸ Chrome MV3 extension — one-click LinkedIn → Sonar sync' },
			{ t: 'out', text: '  ▸ PostHog analytics for product usage + funnel tracking' },
			{ t: 'blank' },
			{ t: 'out', text: '  stack: FastAPI · React · Supabase · PostgreSQL · Vercel', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '──────────────────────────────────────────', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: 'SRM University Delhi-NCR             2022 – Present', accent: true },
			{ t: 'out', text: 'B.Tech Computer Science & Engineering (AI & Data Science)' },
			{ t: 'out', text: 'SGPA: 7.0 / 10.0', dim: true },
			{ t: 'blank' },
		];

		// ── ls ──
		if (cmd === 'ls' || cmd === 'ls projects' || (verb === 'ls' && arg === 'projects')) return [
			{ t: 'blank' },
			{ t: 'out', text: 'drwxr-xr-x  sonar/', green: true },
			{ t: 'out', text: 'drwxr-xr-x  lookalike-search/', green: true },
			{ t: 'out', text: 'drwxr-xr-x  linkedin-pipeline/', green: true },
			{ t: 'out', text: 'drwxr-xr-x  chrome-ext/', green: true },
			{ t: 'blank' },
			{ t: 'out', text: 'cat <name>  for details  ·  open <name>  to view source', dim: true },
			{ t: 'blank' },
		];

		if (cmd === 'ls -la' || cmd === 'ls -al') return [
			{ t: 'blank' },
			{ t: 'out', text: 'total 42', dim: true },
			{ t: 'out', text: 'drwxr-xr-x  shravan  staff   512B  ./', dim: true },
			{ t: 'out', text: 'drwxr-xr-x  shravan  staff   864B  ../', dim: true },
			{ t: 'out', text: 'drwxr-xr-x  shravan  staff   416B  sonar/', green: true },
			{ t: 'out', text: 'drwxr-xr-x  shravan  staff   256B  lookalike-search/', green: true },
			{ t: 'out', text: 'drwxr-xr-x  shravan  staff   128B  linkedin-pipeline/', green: true },
			{ t: 'out', text: 'drwxr-xr-x  shravan  staff    96B  chrome-ext/', green: true },
			{ t: 'out', text: '-rw-r--r--  shravan  staff   2.1K  .biography' },
			{ t: 'out', text: '-rw-r--r--  shravan  staff   847B  .coffee-count', yellow: true },
			{ t: 'out', text: '-rw-r--r--  shravan  staff   1.4K  .bugs-fixed', yellow: true },
			{ t: 'out', text: '-rw-r--r--  shravan  staff     0B  .sleep-schedule          [DEPRECATED]', dim: true },
			{ t: 'out', text: '-r--------  shravan  staff   ???   .salary-expectations     [cat: permission denied]', dim: true },
			{ t: 'out', text: '-rw-r--r--  shravan  staff    64B  .ambitions               [recursive reference]', dim: true },
			{ t: 'out', text: '-r--------  shravan  staff    12K  .secrets                 [cat: permission denied]', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '  .coffee-count    → 847 cups (and counting)', yellow: true },
			{ t: 'out', text: '  .bugs-fixed      → 1,247 (closed PRs disagree)', yellow: true },
			{ t: 'out', text: '  .sleep-schedule  → [file empty since 2026]', dim: true },
			{ t: 'blank' },
		];

		// ── tree ──
		if (cmd === 'tree') return [
			{ t: 'blank' },
			{ t: 'out', text: 'shravan-portfolio/', accent: true },
			{ t: 'out', text: '├── sonar/', green: true },
			{ t: 'out', text: '│   ├── backend/        (FastAPI · Supabase · 8 API modules)' },
			{ t: 'out', text: '│   ├── frontend/       (React · 10+ dashboard modules)' },
			{ t: 'out', text: '│   └── chrome-ext/     (MV3 · TypeScript · real-time sync)' },
			{ t: 'out', text: '├── lookalike-search/', green: true },
			{ t: 'out', text: '│   ├── api/            (FastAPI · structured Groq inference)' },
			{ t: 'out', text: '│   └── scorer/         (<2s end-to-end · no vector DB)' },
			{ t: 'out', text: '├── linkedin-pipeline/', green: true },
			{ t: 'out', text: '│   └── scraper/        (Playwright · SPA-aware · 1,200+ profiles)' },
			{ t: 'out', text: '└── shravan-os/', accent: true },
			{ t: 'out', text: '    ├── terminal/       (you are here)', dim: true },
			{ t: 'out', text: '    └── matrix.rain     ← try: matrix', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '4 directories, 847 commits, 0 free weekends', dim: true },
			{ t: 'blank' },
		];

		// ── man ──
		if (verb === 'man') {
			const manPages: Record<string, Line[]> = {
				shravan: [
					{ t: 'blank' },
					{ t: 'out', text: 'SHRAVAN(1)              SHRAVAN-OS MANUAL              SHRAVAN(1)', accent: true },
					{ t: 'blank' },
					{ t: 'out', text: 'NAME' },
					{ t: 'out', text: '       shravan - a software engineer who ships things', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'SYNOPSIS' },
					{ t: 'out', text: '       shravan [--hire] [--relocate] [--available]', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'DESCRIPTION' },
					{ t: 'out', text: '       Shravan Omanakuttan is a software engineer currently' },
					{ t: 'out', text: '       running shravan-os v2.0.0 on SRM University hardware.' },
					{ t: 'blank' },
					{ t: 'out', text: '       Writes Python until 2am. Deploys at 9am.' },
					{ t: 'out', text: '       Available from 2026. Open to relocate.' },
					{ t: 'blank' },
					{ t: 'out', text: 'OPTIONS' },
					{ t: 'out', text: '       --hire        grants access to 90-day shipping velocity', green: true },
					{ t: 'out', text: '       --relocate    works anywhere with good internet', dim: true },
					{ t: 'out', text: '       --available   from 2026 · internships & full-time', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'EXIT STATUS' },
					{ t: 'out', text: '       0   if hired' },
					{ t: 'out', text: '       1   if you don\'t reach out', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'SEE ALSO' },
					{ t: 'out', text: '       open(1), contact(1), sudo hire shravan(8)', dim: true },
					{ t: 'blank' },
				],
				help: [
					{ t: 'blank' },
					{ t: 'out', text: 'HELP(1)                 SHRAVAN-OS MANUAL                 HELP(1)', accent: true },
					{ t: 'blank' },
					{ t: 'out', text: 'NAME' },
					{ t: 'out', text: '       help - display available commands', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'SYNOPSIS' },
					{ t: 'out', text: '       help [--recruiter]', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'DESCRIPTION' },
					{ t: 'out', text: '       Without flags, lists all available terminal commands.' },
					{ t: 'out', text: '       With --recruiter, shows a plain-english summary' },
					{ t: 'out', text: '       for non-developers evaluating Shravan.' },
					{ t: 'blank' },
				],
				ls: [
					{ t: 'blank' },
					{ t: 'out', text: 'LS(1)                   SHRAVAN-OS MANUAL                   LS(1)', accent: true },
					{ t: 'blank' },
					{ t: 'out', text: 'SYNOPSIS' },
					{ t: 'out', text: '       ls [-la] [projects]', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'DESCRIPTION' },
					{ t: 'out', text: '       Lists projects. ls -la reveals hidden files.' },
					{ t: 'out', text: '       Some files are redacted. That\'s intentional.', dim: true },
					{ t: 'blank' },
				],
				cat: [
					{ t: 'blank' },
					{ t: 'out', text: 'CAT(1)                  SHRAVAN-OS MANUAL                  CAT(1)', accent: true },
					{ t: 'blank' },
					{ t: 'out', text: 'SYNOPSIS' },
					{ t: 'out', text: '       cat <project|resume>', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'DESCRIPTION' },
					{ t: 'out', text: '       Outputs project details. cat resume opens the CV.' },
					{ t: 'out', text: '       download resume saves a copy to your machine.', dim: true },
					{ t: 'blank' },
				],
				git: [
					{ t: 'blank' },
					{ t: 'out', text: 'GIT(1)                  SHRAVAN-OS MANUAL                  GIT(1)', accent: true },
					{ t: 'blank' },
					{ t: 'out', text: 'SYNOPSIS' },
					{ t: 'out', text: '       git log', dim: true },
					{ t: 'out', text: '       git push   (easter egg)', dim: true },
					{ t: 'blank' },
					{ t: 'out', text: 'DESCRIPTION' },
					{ t: 'out', text: '       git log shows Shravan\'s recent commit history.' },
					{ t: 'out', text: '       git push is protected. nice try.', dim: true },
					{ t: 'blank' },
				],
			};
			const page = manPages[arg] || manPages[arg?.replace(/\(.*\)/, '')];
			if (page) return page;
			if (arg) return [
				{ t: 'blank' },
				{ t: 'out', text: `No manual entry for ${arg}`, dim: true },
				{ t: 'out', text: 'try: man shravan  man help  man ls  man cat  man git', dim: true },
				{ t: 'blank' },
			];
			return [
				{ t: 'blank' },
				{ t: 'out', text: 'usage: man <command>', dim: true },
				{ t: 'out', text: 'try: man shravan', dim: true },
				{ t: 'blank' },
			];
		}

		// ── cat ──
		if (verb === 'cat') {
			if (arg === 'resume') {
				window.open('/resume.html', '_blank');
				return [
					{ t: 'blank' },
					{ t: 'out', text: 'opening resume...', green: true },
					{ t: 'out', text: '  /resume.html', dim: true },
					{ t: 'out', text: '  download resume  to save a copy', dim: true },
					{ t: 'blank' },
				];
			}
			const p = PROJECTS[arg];
			if (!p) return [
				{ t: 'blank' },
				{ t: 'out', text: `cat: ${arg}: No such project` },
				{ t: 'out', text: 'try: sonar  lookalike-search  linkedin-pipeline  chrome-ext', dim: true },
				{ t: 'blank' },
			];
			return [
				{ t: 'blank' },
				{ t: 'out', text: 'NAME', accent: true },
				{ t: 'out', text: `    ${p.name}` },
				{ t: 'blank' },
				{ t: 'out', text: 'DESCRIPTION', accent: true },
				...p.desc.split('\n').map(l => ({ t: 'out' as const, text: `    ${l}` })),
				{ t: 'blank' },
				{ t: 'out', text: 'METRICS', accent: true },
				{ t: 'out', text: `    ${p.metric}`, green: true },
				{ t: 'blank' },
				{ t: 'out', text: 'STACK', accent: true },
				{ t: 'out', text: `    ${p.tech.join('  ·  ')}`, dim: true },
				{ t: 'blank' },
			];
		}

		// ── download resume ──
		if (cmd === 'download resume') {
			const a = document.createElement('a');
			a.href     = '/resume.html';
			a.download = 'Shravan_Omanakuttan_Resume.html';
			a.click();
			return [
				{ t: 'blank' },
				{ t: 'out', text: 'downloading Shravan_Omanakuttan_Resume.html...', green: true },
				{ t: 'out', text: '  print to PDF for best results', dim: true },
				{ t: 'blank' },
			];
		}

		// ── open resume ──
		if (cmd === 'open resume') {
			window.open('/resume.html', '_blank');
			return [
				{ t: 'blank' },
				{ t: 'out', text: 'opening resume in new tab...', green: true },
				{ t: 'blank' },
			];
		}

		// ── schedule ──
		if (cmd === 'schedule') return [
			{ t: 'blank' },
			{ t: 'out', text: 'SCHEDULE A CALL', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  Preferred: email with your availability' },
			{ t: 'out', text: '  shravanomanakuttan@gmail.com', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  Timezone: IST (UTC +5:30)', dim: true },
			{ t: 'out', text: '  Available: Mon–Fri · flexible hours', dim: true },
			{ t: 'out', text: '  Response time: < 12 hours', green: true },
			{ t: 'blank' },
			{ t: 'out', text: '  open email  to send directly', dim: true },
			{ t: 'blank' },
		];

		// ── skills ──
		if (cmd === 'skills') return [
			{ t: 'blank' },
			{ t: 'out', text: 'FRONTEND', accent: true },
			{ t: 'out', text: '    ' + resume.skills.frontend.join('  ·  '), dim: true },
			{ t: 'blank' },
			{ t: 'out', text: 'BACKEND', accent: true },
			{ t: 'out', text: '    ' + resume.skills.backend.join('  ·  '), dim: true },
			{ t: 'blank' },
			{ t: 'out', text: 'TOOLS', accent: true },
			{ t: 'out', text: '    ' + resume.skills.tools.join('  ·  '), dim: true },
			{ t: 'blank' },
		];

		// ── status ──
		if (cmd === 'status') return [
			{ t: 'blank' },
			{ t: 'out', text: 'CURRENT STATUS', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  building   Sonar v2 — adding AI enrichment layer' },
			{ t: 'out', text: '  learning   LLM evals + production RAG patterns' },
			{ t: 'out', text: '  reading    Designing Data-Intensive Applications' },
			{ t: 'out', text: '  location   Trivandrum, India · open to relocate' },
			{ t: 'blank' },
			{ t: 'out', text: '  available  from 2026 · internships & full-time', green: true },
			{ t: 'blank' },
		];

		// ── contact ──
		if (cmd === 'contact') return [
			{ t: 'blank' },
			{ t: 'out', text: 'CONTACT', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  email      shravanomanakuttan@gmail.com' },
			{ t: 'out', text: '  github     github.com/sxrxvxnn' },
			{ t: 'out', text: '  linkedin   linkedin.com/in/shravanomanakuttan' },
			{ t: 'blank' },
			{ t: 'out', text: 'open github · open linkedin · open email · schedule', dim: true },
			{ t: 'blank' },
		];

		// ── neofetch ──
		if (cmd === 'neofetch') return [
			{ t: 'blank' },
			{ t: 'out', text: '  ╭──────╮   shravan@portfolio', accent: true },
			{ t: 'out', text: '  │ ◉  ◉ │   ─────────────────────────────' },
			{ t: 'out', text: '  │  ──  │   OS       shravan-os 2.0.0' },
			{ t: 'out', text: '  │ ╰──╯ │   Shell    sveltekit · gsap · three.js' },
			{ t: 'out', text: '  ╰──────╯   Lang      python  typescript' },
			{ t: 'out', text: '             Tools     fastapi · groq · playwright' },
			{ t: 'out', text: '             Uptime    3 months @ beagle security' },
			{ t: 'out', text: '             Pkgs      10+ modules shipped', green: true },
			{ t: 'out', text: '             Status    ◉ available from 2026', green: true },
			{ t: 'blank' },
		];

		// ── date ──
		if (cmd === 'date') return [
			{ t: 'blank' },
			{ t: 'out', text: new Date().toString() },
			{ t: 'blank' },
		];

		// ── matrix ──
		if (cmd === 'matrix') {
			matrixActive = true;
			return [
				{ t: 'blank' },
				{ t: 'out', text: 'initiating matrix protocol...', green: true },
				{ t: 'blank' },
			];
		}

		// ── git ──
		if (cmd === 'git log') return [
			{ t: 'blank' },
			{ t: 'out', text: 'commit a8f3d21 (HEAD -> main)', yellow: true },
			{ t: 'out', text: 'Author: Shravan Omanakuttan <shravan@beaglesecurity.com>', dim: true },
			{ t: 'out', text: 'Date:   Mon Jul 28 2026', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '    feat: add AI enrichment layer to Sonar v2' },
			{ t: 'blank' },
			{ t: 'out', text: 'commit 7c4e892', yellow: true },
			{ t: 'out', text: 'Date:   Fri Jul 25 2026', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '    fix: linkedin scraper handles new SPA class hashes' },
			{ t: 'blank' },
			{ t: 'out', text: 'commit 3b8d511', yellow: true },
			{ t: 'out', text: 'Date:   Wed Jul 16 2026', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '    feat: chrome ext mv3 real-time supabase sync' },
			{ t: 'blank' },
			{ t: 'out', text: 'commit 1a2f847', yellow: true },
			{ t: 'out', text: 'Date:   Mon Jun 30 2026', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '    feat: lookalike search <2s single groq inference' },
			{ t: 'blank' },
			{ t: 'out', text: 'commit f9e3c44', yellow: true },
			{ t: 'out', text: 'Date:   Mon May 12 2026', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '    init: sonar — lead intelligence platform' },
			{ t: 'blank' },
		];

		if (cmd.startsWith('git ')) {
			if (arg.startsWith('push')) return [
				{ t: 'blank' },
				{ t: 'out', text: 'Enumerating objects: 847, done.' },
				{ t: 'out', text: 'Writing objects: 100% (612/612), done.' },
				{ t: 'blank' },
				{ t: 'out', text: '  ! [remote rejected] main -> main (protected branch)', dim: true },
				{ t: 'out', text: 'error: failed to push some refs', dim: true },
				{ t: 'blank' },
				{ t: 'out', text: 'nice try though.', accent: true },
				{ t: 'blank' },
			];
			return [{ t: 'blank' }, { t: 'out', text: `git: '${arg}' is not a git command. try: git log`, dim: true }, { t: 'blank' }];
		}

		// ── sudo ──
		if (verb === 'sudo') {
			if (arg === 'hire shravan') return [
				{ t: 'blank' },
				{ t: 'out', text: '[sudo] password for recruiter: ......', dim: true },
				{ t: 'blank' },
				{ t: 'out', text: '  ACCESS GRANTED', green: true },
				{ t: 'blank' },
				{ t: 'out', text: '  You found the secret command.' },
				{ t: 'out', text: '  Shravan writes Python until 2am and ships at 9am.' },
				{ t: 'out', text: '  Built an $800/mo replacement tool solo in 90 days.' },
				{ t: 'out', text: '  Available from 2026. Open to relocate.', green: true },
				{ t: 'blank' },
				{ t: 'out', text: '  shravanomanakuttan@gmail.com', accent: true },
				{ t: 'out', text: '  linkedin.com/in/shravanomanakuttan', accent: true },
				{ t: 'blank' },
				{ t: 'out', text: '  Your move.', accent: true },
				{ t: 'blank' },
			];
			return [{ t: 'blank' }, { t: 'out', text: 'nice try.' }, { t: 'blank' }];
		}

		// ── easter eggs ──
		if (cmd === 'vim' || cmd === 'vi' || cmd === 'nano') return [
			{ t: 'blank' },
			{ t: 'out', text: '~', dim: true },
			{ t: 'out', text: '~', dim: true },
			{ t: 'out', text: '~  VIM - Vi IMproved', dim: true },
			{ t: 'out', text: '~', dim: true },
			{ t: 'out', text: '~  type  :q  to exit  (good luck)', dim: true },
			{ t: 'out', text: '~', dim: true },
			{ t: 'blank' },
		];

		if (verb === 'ssh') return [
			{ t: 'blank' },
			{ t: 'out', text: `ssh: connect to host ${arg || 'localhost'} port 22: Connection refused`, dim: true },
			{ t: 'out', text: 'Permission denied (publickey).', dim: true },
			{ t: 'blank' },
		];

		if (verb === 'ping') {
			const host = arg || 'localhost';
			const isFaang = ['google','faang','meta','apple','amazon','netflix','microsoft','openai','anthropic'].some(h => host.includes(h));
			return [
				{ t: 'blank' },
				{ t: 'out', text: `PING ${host}: 56 data bytes` },
				{ t: 'out', text: `64 bytes from ${host}: icmp_seq=0 ttl=117 time=12.4 ms` },
				{ t: 'out', text: `64 bytes from ${host}: icmp_seq=1 ttl=117 time=11.9 ms` },
				{ t: 'out', text: `64 bytes from ${host}: icmp_seq=2 ttl=117 time=13.1 ms` },
				{ t: 'blank' },
				{ t: 'out', text: '3 packets transmitted, 3 received, 0% packet loss' },
				...(isFaang
					? [{ t: 'blank' as const }, { t: 'out' as const, text: `hiring@${host} is responding. your move.`, green: true }]
					: []),
				{ t: 'blank' },
			];
		}

		if (cmd.startsWith('curl wttr') || cmd.startsWith('curl http')) return [
			{ t: 'blank' },
			{ t: 'out', text: 'Weather report: Trivandrum', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '      \\   /     Clear' },
			{ t: 'out', text: '       .-.      +30(32) °C' },
			{ t: 'out', text: '    ― (   ) ―   ↗ 15 km/h' },
			{ t: 'out', text: '       `-\'      10 km' },
			{ t: 'out', text: '      /   \\     0.0 mm' },
			{ t: 'blank' },
			{ t: 'out', text: '(it\'s always 30°C. always.)', dim: true },
			{ t: 'blank' },
		];

		if (verb === 'cowsay') {
			const msg = arg || 'sudo hire shravan';
			const bar = '-'.repeat(msg.length + 2);
			return [
				{ t: 'blank' },
				{ t: 'out', text: ` ${bar}` },
				{ t: 'out', text: `< ${msg} >` },
				{ t: 'out', text: ` ${bar}` },
				{ t: 'out', text: '        \\   ^__^' },
				{ t: 'out', text: '         \\  (oo)\\_______' },
				{ t: 'out', text: '            (__)\\       )\\/\\' },
				{ t: 'out', text: '                ||----w |' },
				{ t: 'out', text: '                ||     ||' },
				{ t: 'blank' },
			];
		}

		if (cmd === ':q' || cmd === ':q!' || cmd === ':wq') return [
			{ t: 'blank' },
			{ t: 'out', text: 'you\'re not in vim.', dim: true },
			{ t: 'blank' },
		];

		// ── theme ──
		if (verb === 'theme') {
			const t = THEMES[arg];
			if (t) {
				currentTheme = t;
				if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, arg);
				return [{ t: 'blank' }, { t: 'out', text: `theme → ${arg}`, green: true }, { t: 'blank' }];
			}
			return [{ t: 'blank' }, { t: 'out', text: 'themes: gruvbox  tokyo  dracula', dim: true }, { t: 'blank' }];
		}

		// ── misc ──
		if (cmd === 'uname' || cmd === 'uname -a') return [
			{ t: 'blank' },
			{ t: 'out', text: 'shravan-os 2.0.0 SvelteKit-Darwin arm64 gsap/three.js 2026' },
			{ t: 'blank' },
		];

		if (cmd === 'history') {
			if (!cmdHistory.length) return [{ t: 'blank' }, { t: 'out', text: 'no history yet', dim: true }, { t: 'blank' }];
			return [
				{ t: 'blank' },
				...[...cmdHistory].reverse().map((c, i) => ({ t: 'out' as const, text: `  ${String(i + 1).padStart(3)}  ${c}`, dim: true })),
				{ t: 'blank' },
			];
		}

		// ── open ──
		if (verb === 'open') {
			const links: Record<string, string> = {
				github:   'https://github.com/sxrxvxnn',
				linkedin: 'https://linkedin.com/in/shravanomanakuttan',
				email:    'mailto:shravanomanakuttan@gmail.com',
			};
			const proj = PROJECTS[arg];
			if (proj) { window.open(proj.url, '_blank'); return [{ t: 'blank' }, { t: 'out', text: `opening ${proj.name}...`, green: true }, { t: 'blank' }]; }
			const url = links[arg];
			if (url)  { window.open(url, '_blank'); return [{ t: 'blank' }, { t: 'out', text: `opening ${arg}...`, green: true }, { t: 'blank' }]; }
			return [{ t: 'blank' }, { t: 'out', text: `unknown: ${arg}. try: github  linkedin  email  resume`, dim: true }, { t: 'blank' }];
		}

		if (cmd === 'clear' || cmd === 'cls') { lines = []; return []; }
		if (cmd === 'exit') return [{ t: 'blank' }, { t: 'out', text: 'there is no escape.', dim: true }, { t: 'blank' }];

		return [
			{ t: 'blank' },
			{ t: 'out', text: `command not found: ${raw.trim()}` },
			{ t: 'out', text: 'type  help  ·  help --recruiter  if you\'re hiring', dim: true },
			{ t: 'blank' },
		];
	}

	// ── Konami Easter egg ─────────────────────────────────────────────────────
	function konamiEasterEgg(): Line[] {
		return [
			{ t: 'blank' },
			{ t: 'out', text: '  ▲ ▲ ▼ ▼ ◀ ▶ ◀ ▶ B A', accent: true },
			{ t: 'blank' },
			{ t: 'out', text: '  [CHEAT CODE ACTIVATED]', green: true },
			{ t: 'blank' },
			{ t: 'out', text: '  Unlimited coffee: ENABLED', green: true },
			{ t: 'out', text: '  Sleep requirement: DISABLED', dim: true },
			{ t: 'out', text: '  Bug resistance: +99', green: true },
			{ t: 'out', text: '  Shipping velocity: MAX', green: true },
			{ t: 'blank' },
			{ t: 'out', text: '  "just ship it" unlocked as core ability.', dim: true },
			{ t: 'blank' },
		];
	}

	// ── Auto-play boot sequence ────────────────────────────────────────────────
	async function autoPlay(isReturning: boolean) {
		await sleep(6000);
		await bootLines([
			{ t: 'blank' },
			{ t: 'out', text: '  ███████╗██╗  ██╗██████╗  █████╗ ██╗   ██╗ █████╗ ███╗  ██╗', dim: true },
			{ t: 'out', text: '  ██╔════╝██║  ██║██╔══██╗██╔══██╗██║   ██║██╔══██╗████╗ ██║', dim: true },
			{ t: 'out', text: '  ███████╗███████║██████╔╝███████║██║   ██║███████║██╔██╗██║', dim: true },
			{ t: 'out', text: '  ╚════██║██╔══██║██╔══██╗██╔══██║╚██╗ ██╔╝██╔══██║██║╚████║', dim: true },
			{ t: 'out', text: '  ███████║██║  ██║██║  ██║██║  ██║ ╚████╔╝ ██║  ██║██║ ╚███║', dim: true },
			{ t: 'out', text: '  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚══╝', dim: true },
			{ t: 'blank' },
			{ t: 'out', text: '  shravan-os v2.0.0  ·  sveltekit · three.js · gsap', dim: true },
			isReturning
				? { t: 'out', text: '  welcome back.', accent: true }
				: { t: 'out', text: '  type  help  ·  help --recruiter  if you\'re hiring', dim: true },
			{ t: 'blank' },
		], 48);

		await sleep(300);
		await typeCommand('whoami', 52);
		await push(...runCommand('whoami'));
		await sleep(350);
		await typeCommand('ls projects', 48);
		await push(...runCommand('ls projects'));
		await sleep(350);
		await typeCommand('cat sonar', 48);
		await push(...runCommand('cat sonar'));
		busy = false;
		await tick();

		// handle ?cmd= shareable URL
		const urlParams = new URLSearchParams(window.location.search);
		const cmdParam  = urlParams.get('cmd');
		if (cmdParam) {
			await sleep(400);
			await typeCommand(cmdParam, 42);
			await push(...runCommand(cmdParam));
		}

		if (!isMobile) inputEl?.focus();
	}

	// ── Input handlers ────────────────────────────────────────────────────────
	function submit() {
		if (busy || !inputValue.trim()) return;
		const cmd = inputValue.trim();
		cmdHistory = [cmd, ...cmdHistory.slice(0, 49)];
		histIdx    = -1;
		push({ t: 'prompt', cmd });
		const lc = cmd.toLowerCase();
		if (lc !== 'clear' && lc !== 'cls') push(...runCommand(cmd));
		inputValue = '';
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter')     { submit(); return; }
		if (e.key === 'Tab')       { e.preventDefault(); if (!busy) tabComplete(); return; }
		if (e.key === 'ArrowUp')   { e.preventDefault(); histIdx = Math.min(histIdx + 1, cmdHistory.length - 1); inputValue = cmdHistory[histIdx] ?? ''; return; }
		if (e.key === 'ArrowDown') { e.preventDefault(); histIdx = Math.max(histIdx - 1, -1); inputValue = histIdx === -1 ? '' : cmdHistory[histIdx]; return; }
		if (e.ctrlKey && e.key === 'l') { e.preventDefault(); lines = []; return; }
		if (e.ctrlKey && e.key === 'c') { inputValue = ''; return; }

		// Konami code detector
		if (e.key === KONAMI[konamiIdx]) {
			konamiIdx++;
			if (konamiIdx === KONAMI.length) {
				konamiIdx = 0;
				push(...konamiEasterEgg());
			}
		} else {
			konamiIdx = 0;
		}
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────
	onMount(() => {
		isMobile = window.innerWidth < 768;
		window.addEventListener('resize', () => { isMobile = window.innerWidth < 768; });

		// restore saved theme
		const savedTheme = localStorage.getItem(THEME_KEY);
		if (savedTheme && THEMES[savedTheme]) currentTheme = THEMES[savedTheme];

		// returning visitor flag
		const isReturning = localStorage.getItem(VISITED_KEY) === '1';
		localStorage.setItem(VISITED_KEY, '1');

		const tick = () => {
			const now = new Date();
			clockTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
		};
		tick();
		const clockInterval = setInterval(tick, 1000);

		autoPlay(isReturning);
		return () => clearInterval(clockInterval);
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main
	class="terminal"
	class:is-mobile={isMobile}
	style="--accent:{currentTheme.accent};--accent-glow:{currentTheme.glow};--green:{currentTheme.green};--green-glow:{currentTheme.greenGlow}"
	onclick={() => { if (!isMobile) inputEl?.focus(); }}
	onkeydown={() => {}}
	role="main"
>
	<!-- scanlines + CRT flicker -->
	<div class="scanlines" aria-hidden="true"></div>
	<!-- vignette -->
	<div class="vignette"  aria-hidden="true"></div>

	<!-- matrix overlay -->
	{#if matrixActive}
		<canvas class="matrix-canvas" bind:this={matrixCanvas}></canvas>
	{/if}

	<!-- output area -->
	<div class="output" bind:this={outputEl}>
		{#each lines as line}
			{#if line.t === 'blank'}
				<div class="ln-blank"></div>
			{:else if line.t === 'prompt'}
				<div class="ln"><span class="prompt-txt">{PROMPT}</span><span class="prompt-cmd">&nbsp;{line.cmd}</span></div>
			{:else}
				<div
					class="ln"
					class:dim={line.dim}
					class:accent={line.accent}
					class:green={line.green}
					class:yellow={line.yellow}
				>{line.text}</div>
			{/if}
		{/each}

		<!-- desktop cursor line -->
		{#if !isMobile}
			{#if !busy}
				<div class="input-line">
					<span class="prompt-txt">{PROMPT}</span>
					<span class="input-ghost">&nbsp;{inputValue}</span>
					<span class="cursor" aria-hidden="true"></span>
				</div>
			{:else}
				<div class="input-line">
					<span class="prompt-txt">{PROMPT}</span>
					<span class="cursor" aria-hidden="true"></span>
				</div>
			{/if}
		{/if}
	</div>

	<!-- desktop hidden input -->
	{#if !isMobile}
		<input
			bind:this={inputEl}
			bind:value={inputValue}
			onkeydown={onKey}
			class="hidden-input"
			autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck={false}
			aria-label="Terminal input"
		/>
	{/if}

	<!-- mobile visible input bar -->
	{#if isMobile && !busy}
		<div class="mob-bar">
			<span class="mob-prompt">$</span>
			<input
				bind:this={inputEl}
				bind:value={inputValue}
				onkeydown={onKey}
				placeholder="type a command…"
				class="mob-input"
				autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck={false}
				aria-label="Terminal input"
			/>
			<button class="mob-send" onclick={submit} aria-label="Run command">↵</button>
		</div>
	{/if}

	<!-- statusbar -->
	<div class="statusbar" aria-hidden="true">
		<span class="sb-avail">◉ available</span>
		<span class="sb-fill"></span>
		{#if !isMobile}<span class="sb-hint">tab · ↑↓ · ctrl+l</span><span class="sb-div">│</span>{/if}
		{#if !isMobile}<span class="sb-name">shravan omanakuttan</span><span class="sb-div">│</span>{/if}
		<span class="sb-theme">theme: {currentTheme.name}</span>
		<span class="sb-div">│</span>
		<span class="sb-clock">{clockTime}</span>
	</div>
</main>

<style>
	.terminal {
		position: fixed; inset: 0;
		display: flex; flex-direction: column;
		font-family: 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', monospace;
		font-size: clamp(13px, 1.3vw, 15.5px);
		line-height: 1.8;
		cursor: text;
		background: #282828;
		z-index: 10;
	}

	.scanlines {
		position: fixed; inset: 0; pointer-events: none; z-index: 20;
		background: repeating-linear-gradient(
			0deg, transparent, transparent 2px,
			rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 4px
		);
		animation: crt-flicker 9s ease infinite;
	}

	@keyframes crt-flicker {
		0%, 93%, 100% { opacity: 1; }
		94%            { opacity: 0.92; }
		95%            { opacity: 1; }
		96.5%          { opacity: 0.95; }
		97%            { opacity: 1; }
	}

	.vignette {
		position: fixed; inset: 0; pointer-events: none; z-index: 20;
		background: radial-gradient(ellipse at 50% 40%, transparent 58%, rgba(0,0,0,0.6) 100%);
	}

	.matrix-canvas {
		position: fixed; inset: 0;
		z-index: 50; pointer-events: none;
	}

	.output {
		flex: 1; overflow-y: auto;
		padding: 52px 60px 24px;
		scrollbar-width: none;
		position: relative; z-index: 10;
	}
	.output::-webkit-scrollbar { display: none; }

	/* mobile output */
	.is-mobile .output { padding: 24px 18px 16px; font-size: 13px; }

	.ln       { color: #ebdbb2; white-space: pre-wrap; word-break: break-word; }
	.ln.dim   { color: #a89984; }
	.ln.accent {
		color: var(--accent); font-weight: 700; letter-spacing: 0.05em;
		text-shadow: 0 0 10px var(--accent-glow), 0 0 22px var(--accent-glow);
	}
	.ln.green  { color: var(--green); text-shadow: 0 0 10px var(--green-glow); }
	.ln.yellow { color: #d79921; text-shadow: 0 0 8px rgba(215,153,33,0.4); }
	.ln-blank  { height: 1.8em; }

	.prompt-txt {
		color: var(--accent);
		text-shadow: 0 0 10px var(--accent-glow), 0 0 20px var(--accent-glow);
	}
	.prompt-cmd { color: #ebdbb2; }

	.input-line {
		display: flex; align-items: baseline;
		padding-bottom: 48px;
		position: relative; z-index: 10;
	}
	.input-ghost { color: #ebdbb2; white-space: pre; }

	.cursor {
		display: inline-block; width: 8px; height: 1em;
		background: var(--accent); margin-left: 1px; vertical-align: text-bottom;
		animation: blink 1.1s step-start infinite;
		box-shadow: 0 0 8px var(--accent-glow), 0 0 18px var(--accent-glow);
	}
	@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }

	.hidden-input {
		position: absolute; opacity: 0; pointer-events: none;
		width: 1px; height: 1px; top: 0; left: 0;
	}

	/* mobile input bar */
	.mob-bar {
		display: flex; align-items: center; gap: 10px;
		padding: 10px 16px;
		background: #1d2021;
		border-top: 1px solid #3c3836;
		position: relative; z-index: 10;
	}
	.mob-prompt {
		color: var(--accent); font-size: 14px; font-weight: 700;
		text-shadow: 0 0 8px var(--accent-glow);
		flex-shrink: 0;
	}
	.mob-input {
		flex: 1; background: none; border: none; outline: none;
		color: #ebdbb2; font-family: inherit; font-size: 13px;
		caret-color: var(--accent);
	}
	.mob-input::placeholder { color: #665c54; }
	.mob-send {
		background: none; border: 1px solid var(--accent);
		color: var(--accent); padding: 5px 12px;
		border-radius: 4px; font-family: inherit; font-size: 13px;
		cursor: pointer; flex-shrink: 0;
		transition: background 0.15s;
	}
	.mob-send:active { background: rgba(250,189,47,0.15); }

	/* statusbar */
	.statusbar {
		display: flex; align-items: center; gap: 10px;
		height: 26px; padding: 0 16px;
		background: #1d2021;
		border-top: 1px solid #3c3836;
		font-size: 11.5px; font-weight: 700;
		letter-spacing: 0.07em; text-transform: lowercase;
		position: relative; z-index: 10;
	}
	.sb-avail { color: var(--green); text-shadow: 0 0 8px var(--green-glow); }
	.sb-fill  { flex: 1; }
	.sb-hint  { color: #504945; }
	.sb-name  { color: #7c6f64; }
	.sb-div   { color: #3c3836; }
	.sb-theme { color: var(--accent); opacity: 0.6; }
	.sb-clock { color: #7c6f64; font-variant-numeric: tabular-nums; }
</style>
