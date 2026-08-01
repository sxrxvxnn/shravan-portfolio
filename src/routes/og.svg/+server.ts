export function GET() {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d0d1a"/>
      <stop offset="60%" stop-color="#12103a"/>
      <stop offset="100%" stop-color="#1a0a2e"/>
    </linearGradient>
    <linearGradient id="name" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c8d8ff"/>
      <stop offset="100%" stop-color="#a090f0"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative grid dots -->
  ${Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) =>
      `<circle cx="${700 + c * 48}" cy="${80 + r * 68}" r="1.5" fill="rgba(124,106,247,0.18)"/>`
    ).join('')
  ).join('')}

  <!-- Glowing orb -->
  <circle cx="960" cy="280" r="180" fill="rgba(124,106,247,0.04)" filter="url(#glow)"/>
  <circle cx="960" cy="280" r="120" fill="rgba(124,106,247,0.06)"/>
  <circle cx="960" cy="280" r="60" fill="rgba(124,106,247,0.10)"/>

  <!-- Monogram -->
  <text x="960" y="303" font-family="Georgia,serif" font-size="68" font-weight="700"
    fill="rgba(124,106,247,0.55)" text-anchor="middle" letter-spacing="-2">SO</text>

  <!-- Left content -->
  <text x="80" y="160" font-family="Georgia,'Times New Roman',serif" font-size="82"
    font-weight="700" fill="url(#name)" letter-spacing="-2">Shravan</text>
  <text x="80" y="262" font-family="Georgia,'Times New Roman',serif" font-size="82"
    font-weight="700" fill="url(#name)" letter-spacing="-2">Omanakuttan</text>

  <!-- Divider -->
  <rect x="80" y="292" width="280" height="2" rx="1" fill="rgba(124,106,247,0.7)"/>

  <!-- Role -->
  <text x="80" y="348" font-family="'Courier New',monospace" font-size="26"
    fill="rgba(200,216,255,0.75)" letter-spacing="0.04em">CS Student · AI &amp; Full-Stack</text>

  <!-- Tags -->
  <rect x="80" y="378" width="120" height="30" rx="15" fill="rgba(124,106,247,0.18)" stroke="rgba(124,106,247,0.5)" stroke-width="1"/>
  <text x="140" y="398" font-family="'Courier New',monospace" font-size="14" fill="#a090f0" text-anchor="middle">SvelteKit</text>

  <rect x="212" y="378" width="130" height="30" rx="15" fill="rgba(90,247,120,0.12)" stroke="rgba(90,247,120,0.4)" stroke-width="1"/>
  <text x="277" y="398" font-family="'Courier New',monospace" font-size="14" fill="#5af778" text-anchor="middle">FastAPI</text>

  <rect x="354" y="378" width="100" height="30" rx="15" fill="rgba(85,204,255,0.12)" stroke="rgba(85,204,255,0.4)" stroke-width="1"/>
  <text x="404" y="398" font-family="'Courier New',monospace" font-size="14" fill="#55ccff" text-anchor="middle">Three.js</text>

  <!-- Location + company -->
  <text x="80" y="468" font-family="'Courier New',monospace" font-size="18"
    fill="rgba(139,148,158,0.9)">@ Beagle Security · Trivandrum, India</text>

  <!-- URL -->
  <text x="80" y="560" font-family="'Courier New',monospace" font-size="20"
    fill="rgba(88,166,255,0.85)">shravanomanakuttan.vercel.app</text>

  <!-- Bottom accent line -->
  <rect x="0" y="620" width="1200" height="10" fill="url(#bg)"/>
  <rect x="80" y="615" width="180" height="2" fill="rgba(124,106,247,0.4)"/>
</svg>`;

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
		}
	});
}
