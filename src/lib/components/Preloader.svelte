<script lang="ts">
	import { onMount } from 'svelte';

	interface Props { onDone: () => void; }
	let { onDone }: Props = $props();

	let canvas: HTMLCanvasElement;
	let done    = $state(false);
	let exiting = $state(false);

	onMount(() => {
		const W = window.innerWidth;
		const H = window.innerHeight;
		canvas.width  = W;
		canvas.height = H;

		const ctx   = canvas.getContext('2d')!;
		const COLS  = Math.floor(W / 16);
		const drops = Array<number>(COLS).fill(Math.random() * -40);
		const CHARS = 'アイウエオカキクケコサシスセタチツテトナニ0123456789ABCDEF<>{}[]()=+-';

		let nameAlpha  = 0;
		let letterIdx  = 0;
		let subtitleOn = false;
		let frame: number;
		const NAME     = 'SHRAVAN';
		const START    = Date.now();
		const FONT_SIZE = Math.min(W * 0.19, 168);

		// Phase timings (ms)
		const T_PUNCH    = 1600;   // rect fade starts
		const T_LETTERS  = 2000;   // letters appear
		const T_LETTER_D = 95;     // ms per letter
		const T_ALL      = T_LETTERS + NAME.length * T_LETTER_D;
		const T_SUB      = T_ALL + 180;
		const T_EXIT     = T_SUB + 1200;

		function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

		function draw() {
			const now = Date.now() - START;

			// ── rain ───────────────────────────────────────────────────────────
			ctx.fillStyle = 'rgba(40,40,40,0.055)';
			ctx.fillRect(0, 0, W, H);

			ctx.font = '15px "JetBrains Mono", monospace';
			drops.forEach((y, x) => {
				const bright = Math.random() > 0.91;
				ctx.fillStyle   = bright ? '#d9d7a8' : '#b8bb26';
				ctx.globalAlpha = bright ? 0.85 : 0.55;
				ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x * 16, y * 16);
				ctx.globalAlpha = 1;
				if (y * 16 > H && Math.random() > 0.972) drops[x] = 0;
				drops[x]++;
			});

			// ── punch-through ──────────────────────────────────────────────────
			if (now > T_PUNCH) {
				nameAlpha = easeOut(Math.min(1, (now - T_PUNCH) / 380));

				const rW = Math.min(W * 0.9, FONT_SIZE * NAME.length * 0.72 + 140);
				const rH = FONT_SIZE * 1.6;
				const rX = (W - rW) / 2;
				const rY = H / 2 - rH / 2;

				// dark cutout
				ctx.globalAlpha = nameAlpha * 0.92;
				ctx.fillStyle = '#282828';
				ctx.fillRect(rX, rY, rW, rH);
				ctx.globalAlpha = 1;

				// border glow lines
				if (nameAlpha > 0.5) {
					ctx.globalAlpha = (nameAlpha - 0.5) * 2 * 0.4;
					ctx.strokeStyle = '#fabd2f';
					ctx.lineWidth   = 1;
					ctx.strokeRect(rX, rY, rW, rH);
					ctx.globalAlpha = 1;
				}
			}

			// ── letters ───────────────────────────────────────────────────────
			if (now > T_LETTERS) {
				letterIdx = Math.min(NAME.length, Math.floor((now - T_LETTERS) / T_LETTER_D));

				if (letterIdx > 0) {
					ctx.save();
					ctx.textAlign    = 'center';
					ctx.textBaseline = 'middle';
					ctx.font         = `400 ${FONT_SIZE}px "Bebas Neue", sans-serif`;
					ctx.letterSpacing = `${FONT_SIZE * 0.08}px`;

					// outer glow pass
					ctx.shadowColor = '#fabd2f';
					ctx.shadowBlur  = 40;
					ctx.fillStyle   = 'rgba(250,189,47,0.25)';
					ctx.globalAlpha = nameAlpha;
					ctx.fillText(NAME.slice(0, letterIdx), W / 2, H / 2);

					// crisp pass
					ctx.shadowBlur  = 0;
					ctx.fillStyle   = '#fabd2f';
					ctx.fillText(NAME.slice(0, letterIdx), W / 2, H / 2);
					ctx.globalAlpha = 1;
					ctx.restore();
				}
			}

			// ── subtitle ──────────────────────────────────────────────────────
			if (now > T_SUB) {
				subtitleOn = true;
				const sAlpha = easeOut(Math.min(1, (now - T_SUB) / 350)) * 0.55 * nameAlpha;
				ctx.save();
				ctx.textAlign    = 'center';
				ctx.textBaseline = 'middle';
				ctx.font         = `400 ${Math.min(15, W * 0.018)}px "JetBrains Mono", monospace`;
				ctx.fillStyle    = '#fabd2f';
				ctx.globalAlpha  = sAlpha;
				ctx.fillText('SWE INTERN  ·  BEAGLE SECURITY  ·  AVAILABLE 2026', W / 2, H / 2 + FONT_SIZE * 0.72);
				ctx.globalAlpha  = 1;
				ctx.restore();
			}

			// ── exit ──────────────────────────────────────────────────────────
			if (now > T_EXIT && !exiting) {
				exiting = true;
				setTimeout(() => {
					cancelAnimationFrame(frame);
					done = true;
					onDone();
				}, 480);
			}

			frame = requestAnimationFrame(draw);
		}

		// wait for font before starting
		document.fonts.ready.then(draw);

		return () => cancelAnimationFrame(frame);
	});
</script>

{#if !done}
<canvas
	bind:this={canvas}
	class="preloader"
	class:exit={exiting}
	aria-hidden="true"
></canvas>
{/if}

<style>
	.preloader {
		position: fixed; inset: 0;
		width: 100%; height: 100%;
		display: block;
		z-index: 9999;
		opacity: 1;
		transition: opacity 0.45s ease;
	}
	.preloader.exit { opacity: 0; }
</style>
