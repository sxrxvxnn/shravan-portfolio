<script lang="ts">
	// Scene.svelte — Three.js canvas wrapper.
	// All scene code runs inside onMount (client-only, never SSR).
	// $effect bridges Svelte store state → Three.js imperatively.

	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
	import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
	import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
	import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
	import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
	import gsap from 'gsap';

	import { setProgress, setFocus, focus, lamp, setWebGLSupport, updateClock } from '$lib/stores/scene.svelte.js';
	import { openPanel, closePanel } from '$lib/stores/ui.svelte.js';

	let canvasEl: HTMLCanvasElement;
	let labelsEl: HTMLDivElement;

	// Three.js refs kept outside reactive state
	let renderer: THREE.WebGLRenderer;
	let composer: EffectComposer;
	let camera: THREE.PerspectiveCamera;
	let controls: OrbitControls;
	let scene: THREE.Scene;
	let raf: number;

	// Mutable scene state (plain JS, not Svelte reactive)
	let lampOn = true;
	let lampLightRef: THREE.PointLight;
	let lampShadeMat: THREE.MeshStandardMaterial;
	let lampBulbMesh: THREE.Mesh;
	let lampLightBase = 9.0;
	let deskGlowBase = 2.2;
	let deskGlowRef: THREE.PointLight;
	let laptopScreenMats: any[] = [];
	let lampMeshes: THREE.Object3D[] = [];
	let allInteractiveMeshes: THREE.Object3D[] = [];
	let focusedObject: any = null;
	let hoveredObject: any = null;
	let isAnimating = false;
	let charState = 'sitting';
	let characterGroupRef: THREE.Group;
	let bedBodyLumpRef: THREE.Group;
	let particleGeoRef: THREE.BufferGeometry;
	let labelEls: Record<string, HTMLElement> = {};
	let labelDefs: any[] = [];
	let interactiveObjects: any[] = [];
	let focusObjectFn: ((obj: any) => void) | null = null;
	let hourPivot: THREE.Group, minPivot: THREE.Group, secPivot: THREE.Group;
	let winPaneMats: THREE.MeshStandardMaterial[] = [];
	let winLightRef: THREE.PointLight;
	let fillLeftRef: THREE.PointLight, fillRightRef: THREE.PointLight;
	let ceilBounceRef: THREE.PointLight, charLightRef: THREE.PointLight;
	let ambientRef: THREE.AmbientLight, dirLightRef: THREE.DirectionalLight;
	let nightLightPtRef: THREE.SpotLight;
	let ceilPanelRef: THREE.Mesh;
	let wfSkyMat: THREE.MeshStandardMaterial, wfMtnMat: THREE.MeshStandardMaterial;
	let wfMoon: THREE.Mesh, wfSun: THREE.Mesh;
	let wfStars: THREE.Mesh[] = [], wfBldMats: THREE.MeshStandardMaterial[] = [], wfWinMats: THREE.MeshStandardMaterial[] = [];

	// Screen animation refs (accessible from animate loop)
	let laptopCanvasCtx: CanvasRenderingContext2D | null = null;
	let laptopCanvasTex: THREE.CanvasTexture | null = null;
	let screenGlowRef: THREE.PointLight;
	let vignetteActive = $state(false);
	let konamiActive = $state(false);
	let konamiToast = $state(false);

	// Rain refs
	let rainCanvasCtx: CanvasRenderingContext2D | null = null;
	let rainCanvasTex: THREE.CanvasTexture | null = null;
	const rainDrops: { x: number; y: number; speed: number; len: number; alpha: number }[] = [];

	// Steam + misc scene refs
	let steamParticles: THREE.Mesh[] = [];
	let ssaoPassRef: any = null;
	let neonLightRef: THREE.PointLight;

	// Physics wobble targets
	let wobbleMeshes: THREE.Mesh[] = [];

	// Webcam easter egg refs
	let webcamCtx: CanvasRenderingContext2D | null = null;
	let webcamTex: THREE.CanvasTexture | null = null;
	let webcamVideo: HTMLVideoElement | null = null;
	let dispMatRef: THREE.MeshStandardMaterial | null = null;
	let webcamOn = $state(false);

	// Ambient music refs
	let musicOn = $state(false);
	let audioCtx: AudioContext | null = null;
	let masterGain: GainNode | null = null;

	// Exposed actions (set inside onMount so template can call them)
	let toggleMusicFn: (() => void) | null = null;
	let toggleWebcamFn: (() => Promise<void>) | null = null;

	// Terminal typing animation
	let typingInterval: ReturnType<typeof setInterval> | null = null;
	const TERMINAL_LINES = [
		'$ cd ~/projects/sonar',
		'$ git log --oneline -4',
		'  dcff398 add consistency validator',
		'  6f12f1b industry vs business model sep',
		'  d53e6fe fix LinkedIn parser',
		'  685bfb5 fix SaaS misclassification',
		'$ npm run dev',
		'  ➜  Local: http://localhost:5173/',
		'  ✓  ready in 842ms',
	];

	// Terminal $effect — fires when laptop is focused/unfocused
	$effect(() => {
		const key = focus.key;
		if (!laptopCanvasCtx || !laptopCanvasTex) return;
		if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
		if (key === 'laptop') {
			const lc = laptopCanvasCtx;
			// Draw terminal background
			lc.fillStyle = '#0d1117'; lc.fillRect(0, 0, 512, 300);
			lc.fillStyle = '#1e1e2e'; lc.fillRect(0, 0, 512, 24);
			lc.fillStyle = '#ff5f56'; lc.beginPath(); lc.arc(12, 12, 5, 0, Math.PI * 2); lc.fill();
			lc.fillStyle = '#ffbd2e'; lc.beginPath(); lc.arc(28, 12, 5, 0, Math.PI * 2); lc.fill();
			lc.fillStyle = '#27c93f'; lc.beginPath(); lc.arc(44, 12, 5, 0, Math.PI * 2); lc.fill();
			lc.fillStyle = '#8b949e'; lc.font = '11px monospace'; lc.textAlign = 'center';
			lc.fillText('sonar — zsh', 256, 16); lc.textAlign = 'left';
			laptopCanvasTex.needsUpdate = true;
			// Animate typing line by line
			let lineIdx = 0, charIdx = 0, y = 46;
			typingInterval = setInterval(() => {
				if (!laptopCanvasCtx || !laptopCanvasTex) return;
				if (lineIdx >= TERMINAL_LINES.length) {
					// Blink cursor at end
					lc.fillStyle = '#0d1117'; lc.fillRect(charIdx * 6 + 8, y - 12, 8, 13);
					const on = Math.floor(Date.now() / 500) % 2 === 0;
					if (on) { lc.fillStyle = '#7c6af7'; lc.fillRect(8, y - 12, 8, 13); }
					laptopCanvasTex.needsUpdate = true;
					return;
				}
				const line = TERMINAL_LINES[lineIdx];
				const isCmd = line.startsWith('$');
				lc.font = '11px monospace';
				if (charIdx === 0 && lineIdx > 0) y += 16;
				const ch = line[charIdx];
				lc.fillStyle = isCmd ? '#5af778' : line.startsWith('  dcff') || line.startsWith('  6f12') || line.startsWith('  d53') || line.startsWith('  685') ? '#8b949e' : line.startsWith('  ➜') ? '#55ccff' : line.startsWith('  ✓') ? '#5af778' : '#e6edf3';
				lc.fillText(ch, 8 + charIdx * 6.5, y);
				charIdx++;
				if (charIdx >= line.length) { charIdx = 0; lineIdx++; }
				laptopCanvasTex.needsUpdate = true;
			}, 28);
		} else {
			// Restore GitHub grid view
			const lc = laptopCanvasCtx;
			lc.fillStyle = '#0d1117'; lc.fillRect(0, 0, 512, 300);
			lc.fillStyle = '#58a6ff'; lc.font = 'bold 13px monospace';
			lc.fillText('github.com/sxrxvxnn', 16, 26);
			lc.fillStyle = '#8b949e'; lc.font = '10px monospace';
			lc.fillText('Sonar · FastAPI · React · Groq · Playwright', 16, 44);
			const _levels = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
			for (let c = 0; c < 40; c++) {
				for (let r = 0; r < 7; r++) {
					const rng = Math.random();
					const lv = rng < 0.32 ? 0 : rng < 0.52 ? 1 : rng < 0.68 ? 2 : rng < 0.84 ? 3 : 4;
					lc.fillStyle = _levels[lv];
					lc.fillRect(16 + c * 9, 58 + r * 9, 7, 7);
				}
			}
			lc.fillStyle = '#39d353'; lc.font = 'bold 11px monospace';
			lc.fillText('847 contributions in the last year', 16, 156);
			laptopCanvasTex.needsUpdate = true;
		}
	});

	const DEFAULT_CAM_POS = new THREE.Vector3(0, 2.8, 5.2);
	const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 1.4, -3.5);

	// ── $effect: lamp store → Three.js ────────────────────────────────────────
	$effect(() => {
		const isOn = lamp.on;
		if (!lampLightRef) return;
		lampOn = isOn;
		if (isOn) {
			lampLightRef.intensity = lampLightBase;
			if (lampShadeMat) { lampShadeMat.emissive.set(0xffaa44); lampShadeMat.emissiveIntensity = 3.0; }
			if (lampBulbMesh) (lampBulbMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 5.0;
		} else {
			lampLightRef.intensity = 0;
			if (lampShadeMat) { lampShadeMat.emissive.set(0x000000); lampShadeMat.emissiveIntensity = 0; }
			if (lampBulbMesh) (lampBulbMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
		}
	});

	// ── $effect: focus store → Three.js (from nav dots) ──────────────────────
	$effect(() => {
		const key = focus.key;
		if (!key || !focusObjectFn) return;
		const obj = interactiveObjects.find((o: any) => o.key === key);
		if (obj && (!focusedObject || focusedObject.key !== key)) focusObjectFn(obj);
	});

	onMount(() => {
		// WebGL detection
		try {
			const c = document.createElement('canvas');
			if (!c.getContext('webgl2') && !c.getContext('webgl')) { setWebGLSupport(false); return; }
		} catch { setWebGLSupport(false); return; }
		setWebGLSupport(true);

		const isMobile = window.innerWidth <= 600 || ('ontouchstart' in window && window.innerWidth <= 1024);

		/* ── Renderer ─────────────────────────────────────────────── */
		renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: !isMobile });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = !isMobile;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 2.2;

		/* ── Post-processing (Bloom) ──────────────────────────────── */
		// Composer is set up after camera is created, so we init here and
		// add passes below after camera is constructed.

		/* ── Scene ────────────────────────────────────────────────── */
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x131325);
		scene.fog = new THREE.FogExp2(0x131325, 0.016);

		/* ── Environment map for metallic reflections ─────────────── */
		{
			const pmrem = new THREE.PMREMGenerator(renderer);
			pmrem.compileEquirectangularShader();
			scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
			pmrem.dispose();
		}

		/* ── Reduced-motion preference ────────────────────────────── */
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		/* ── Camera ───────────────────────────────────────────────── */
		camera = new THREE.PerspectiveCamera(isMobile ? 65 : 55, window.innerWidth / window.innerHeight, 0.1, 60);
		camera.position.set(0, 7, 14);
		camera.lookAt(DEFAULT_CAM_TARGET);

		/* ── Controls ─────────────────────────────────────────────── */
		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.copy(DEFAULT_CAM_TARGET);
		controls.enableDamping = true;
		controls.dampingFactor = 0.07;
		controls.minDistance = isMobile ? 2 : 2.5;
		controls.maxDistance = isMobile ? 12 : 9;
		controls.maxPolarAngle = Math.PI / 2.08;
		controls.minPolarAngle = 0.15;
		controls.enabled = false;

		/* ── Post-processing: SSAO → Bloom → Output ──────────────── */
		composer = new EffectComposer(renderer);
		composer.addPass(new RenderPass(scene, camera));
		if (!isMobile) {
			const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
			ssao.kernelRadius = 14;
			ssao.minDistance = 0.004;
			ssao.maxDistance = 0.09;
			composer.addPass(ssao); ssaoPassRef = ssao;
		}
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.18,   // strength
			0.42,   // radius
			0.25    // threshold
		);
		composer.addPass(bloomPass);
		composer.addPass(new OutputPass()); // handles sRGB output color space

		setProgress(15, 'Setting up lights…');

		/* ── Lights ───────────────────────────────────────────────── */
		const ambient = new THREE.AmbientLight(0xc8d0ff, 1.4);
		scene.add(ambient); ambientRef = ambient;

		const dirLight = new THREE.DirectionalLight(0xfff8f0, 2.8);
		dirLight.position.set(5, 10, 6);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.set(1024, 1024);
		dirLight.shadow.camera.near = 0.5; dirLight.shadow.camera.far = 40;
		dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -10;
		dirLight.shadow.camera.right = dirLight.shadow.camera.top = 10;
		dirLight.shadow.bias = -0.001;
		scene.add(dirLight); dirLightRef = dirLight;

		const fillLeft = new THREE.PointLight(0x88aaff, 1.5, 14);
		fillLeft.position.set(-4, 4.5, -3); scene.add(fillLeft); fillLeftRef = fillLeft;

		const fillRight = new THREE.PointLight(0xffddbb, 1.4, 14);
		fillRight.position.set(4, 4.5, -4); scene.add(fillRight); fillRightRef = fillRight;

		deskGlowBase = 2.2;
		const deskGlow = new THREE.PointLight(0xffbb66, deskGlowBase, 5);
		deskGlow.position.set(-0.3, 3.2, -5.5); scene.add(deskGlow); deskGlowRef = deskGlow;

		lampLightBase = 9.0;
		const lampLight = new THREE.PointLight(0xffcc77, lampLightBase, 18);
		lampLight.castShadow = false;
		lampLight.position.set(1.2, 2.8, -4.0); scene.add(lampLight); lampLightRef = lampLight;

		const ceilBounce = new THREE.PointLight(0xaabbff, 1.3, 16);
		ceilBounce.position.set(0, 6.0, -5.0); scene.add(ceilBounce); ceilBounceRef = ceilBounce;

		const charLight = new THREE.PointLight(0xffeedd, 1.3, 7);
		charLight.position.set(2, 4, -1.5); scene.add(charLight); charLightRef = charLight;

		setProgress(28, 'Building room…');

		/* ── Material helpers ─────────────────────────────────────── */
		const mat = (c: number, o: any = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0.04, ...o });
		const gloss = (c: number, o: any = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.22, metalness: 0.35, ...o });
		const emMat = (c: number, e: number, i = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: 0.4 });

		/* ═══════════════════════════════════════════════════════════
		   ROOM
		═══════════════════════════════════════════════════════════ */
		const ROOM_W = 10, ROOM_D = 9, ROOM_H = 6.5, ROOM_CZ = -4.0;
		const wallColor = 0x1e1e3a, wallColor2 = 0x1c1c38;
		const wainscotColor = 0x252545, trimColor = 0x2e2e52;

		// Floor — low roughness lets env map show subtle reflections
		const floorBase = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), new THREE.MeshStandardMaterial({ color: 0x1e1e36, roughness: 0.26, metalness: 0.14, envMapIntensity: 1.1 }));
		floorBase.rotation.x = -Math.PI / 2; floorBase.position.set(0, 0, ROOM_CZ); floorBase.receiveShadow = true; scene.add(floorBase);
		for (let i = 0; i < 12; i++) {
			const plank = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, 0.005), new THREE.MeshStandardMaterial({ color: 0x28284a, roughness: 0.95 }));
			plank.rotation.x = -Math.PI / 2; plank.position.set(0, 0.001, ROOM_CZ - ROOM_D / 2 + (i + 1) * (ROOM_D / 13)); scene.add(plank);
		}
		const grid = new THREE.GridHelper(ROOM_W, 14, 0x2a2a4a, 0x222240);
		grid.position.set(0, 0.002, ROOM_CZ); scene.add(grid);

		// Back wall
		const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), mat(wallColor, { roughness: 0.92 }));
		backWall.position.set(0, ROOM_H / 2, -8.5); backWall.receiveShadow = true; scene.add(backWall);
		// Left wall
		const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), mat(wallColor2, { roughness: 0.92 }));
		leftWall.position.set(-5, ROOM_H / 2, ROOM_CZ); leftWall.rotation.y = Math.PI / 2; leftWall.receiveShadow = true; scene.add(leftWall);
		// Right wall
		const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), mat(wallColor2, { roughness: 0.92 }));
		rightWall.position.set(5, ROOM_H / 2, ROOM_CZ); rightWall.rotation.y = -Math.PI / 2; rightWall.receiveShadow = true; scene.add(rightWall);
		// Ceiling
		const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), mat(0x14142a));
		ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ROOM_H, ROOM_CZ); scene.add(ceil);

		// Wainscoting
		([[ROOM_W, 0, ROOM_H / 2, -8.47, 0], [ROOM_D, -5 + 0.03, ROOM_H / 2, ROOM_CZ, Math.PI / 2], [ROOM_D, 5 - 0.03, ROOM_H / 2, ROOM_CZ, Math.PI / 2]] as any[]).forEach(([w, x, _y, z, ry]) => {
			const lower = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.3), mat(wainscotColor, { roughness: 0.88 }));
			lower.position.set(x, 0.65, z); if (ry) lower.rotation.y = ry; scene.add(lower);
			const rail = new THREE.Mesh(new THREE.BoxGeometry(ry ? 0.07 : w, 0.055, ry ? w : 0.07), mat(trimColor, { roughness: 0.7 }));
			rail.position.set(x ? x * 0.98 : 0, 1.32, z); scene.add(rail);
		});

		// Skirting boards
		([[ROOM_W, new THREE.Vector3(0, 0.09, -8.46), 0], [ROOM_D, new THREE.Vector3(-4.97, 0.09, ROOM_CZ), Math.PI / 2], [ROOM_D, new THREE.Vector3(4.97, 0.09, ROOM_CZ), Math.PI / 2]] as any[]).forEach(([w, pos, ry]) => {
			const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.06), mat(trimColor));
			m.position.copy(pos); m.rotation.y = ry; scene.add(m);
		});

		// Crown molding
		([[ROOM_W, new THREE.Vector3(0, 6.44, -8.46), 0], [ROOM_D, new THREE.Vector3(-4.97, 6.44, ROOM_CZ), Math.PI / 2], [ROOM_D, new THREE.Vector3(4.97, 6.44, ROOM_CZ), Math.PI / 2]] as any[]).forEach(([w, pos, ry]) => {
			const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.08), mat(trimColor));
			m.position.copy(pos); m.rotation.y = ry; scene.add(m);
		});

		// Ceiling light panel
		const ceilPanel = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 0.7), emMat(0xffffff, 0xbbccff, 0.65));
		ceilPanel.position.set(0, 6.48, ROOM_CZ); scene.add(ceilPanel); ceilPanelRef = ceilPanel;

		// Window on left wall
		let winLight: THREE.PointLight;
		{
			const winX = -4.97, winY = 3.3, winZ = -5.8, winW = 1.4, winH = 1.2;
			const frameMat = mat(0x2a2a48, { roughness: 0.6 });
			([[winW + 0.12, 0.08, 0.06, 0, winH / 2 + 0.04, 0], [winW + 0.12, 0.08, 0.06, 0, -winH / 2 - 0.04, 0], [0.08, winH, 0.06, -winW / 2 - 0.04, 0, 0], [0.08, winH, 0.06, winW / 2 + 0.04, 0, 0], [0.04, winH, 0.06, 0, 0, 0], [winW, 0.04, 0.06, 0, 0, 0]] as any[]).forEach(([w, h, d, ox, oy]) => {
				const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
				bar.position.set(winX + 0.04, winY + oy, winZ + ox); bar.rotation.y = Math.PI / 2; scene.add(bar);
			});
			([[-winW / 4, winH / 4], [winW / 4, winH / 4], [-winW / 4, -winH / 4], [winW / 4, -winH / 4]] as any[]).forEach(([ox, oy]) => {
				const paneMat = new THREE.MeshStandardMaterial({ color: 0x0a0a20, emissive: 0x0a0a20, emissiveIntensity: 0.3, roughness: 0.4 });
				winPaneMats.push(paneMat);
				const pane = new THREE.Mesh(new THREE.PlaneGeometry(winW / 2 - 0.06, winH / 2 - 0.06), paneMat);
				pane.position.set(winX + 0.03, winY + oy, winZ + ox); pane.rotation.y = Math.PI / 2; scene.add(pane);
			});
			winLight = new THREE.PointLight(0xaaccff, 0.05, 8);
			winLight.position.set(winX + 0.5, winY, winZ); scene.add(winLight); winLightRef = winLight;
		}

		// Rain canvas on window panes
		{
			const _rc = document.createElement('canvas');
			_rc.width = 256; _rc.height = 512;
			rainCanvasCtx = _rc.getContext('2d')!;
			rainCanvasTex = new THREE.CanvasTexture(_rc);
			for (let i = 0; i < 55; i++) {
				rainDrops.push({ x: Math.random() * 256, y: Math.random() * 512, speed: 1.2 + Math.random() * 2.2, len: 6 + Math.random() * 18, alpha: 0.18 + Math.random() * 0.45 });
			}
			winPaneMats.forEach(m => { m.emissiveMap = rainCanvasTex!; m.needsUpdate = true; });
		}

		// Wall panels
		for (let i = 0; i < 3; i++) {
			const pw = 2.2, ph = 0.85, px = -3.3 + i * 3.3;
			const pf = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.12, ph + 0.1, 0.03), mat(wainscotColor, { roughness: 0.85 }));
			pf.position.set(px, 0.72, -8.47); scene.add(pf);
			const pi = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.025), mat(wallColor, { roughness: 0.95 }));
			pi.position.set(px, 0.72, -8.455); scene.add(pi);
		}

		// Area rug
		const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.2), mat(0x2d1a40, { roughness: 0.95 }));
		rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.003, -3.2); scene.add(rug);
		const rugBorder = new THREE.Mesh(new THREE.PlaneGeometry(5.08, 3.48), mat(0x4a2a62, { roughness: 0.95 }));
		rugBorder.rotation.x = -Math.PI / 2; rugBorder.position.set(0, 0.002, -3.2); scene.add(rugBorder);
		const rugPattern = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), mat(0x3a1e52, { roughness: 0.95 }));
		rugPattern.rotation.x = -Math.PI / 2; rugPattern.position.set(0, 0.004, -3.2); scene.add(rugPattern);

		setProgress(42, 'Placing furniture…');

		/* ═══════════════════════════════════════════════════════════
		   DESK
		═══════════════════════════════════════════════════════════ */
		{
			const deskWood = gloss(0x3a2010, { roughness: 0.45, metalness: 0.05 });
			const deskFrame = gloss(0x2c1a0c, { roughness: 0.5 });
			const DX = -0.3, DZ = -6.5;
			const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.45), deskWood);
			top.position.set(DX, 1.08, DZ); top.castShadow = top.receiveShadow = true; scene.add(top);
			([[DX - 1.5, 0.65], [DX + 1.5, 0.65], [DX - 1.5, -0.65], [DX + 1.5, -0.65]] as any[]).forEach(([x, zo]) => {
				const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.08, 0.07), deskFrame);
				leg.position.set(x, 0.54, DZ + zo); leg.castShadow = true; scene.add(leg);
			});
		}

		/* ═══════════════════════════════════════════════════════════
		   DESK LAMP (clickable)
		═══════════════════════════════════════════════════════════ */
		const lampGroup = new THREE.Group();
		{
			const LX = 0.7, LY = 1.13, LZ = -6.15;
			const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.25, metalness: 0.85 });
			const shadeMat = new THREE.MeshStandardMaterial({ color: 0xffeecc, emissive: 0xffaa44, emissiveIntensity: 1.8, roughness: 0.55, side: THREE.DoubleSide });
			lampShadeMat = shadeMat;

			const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.04, 16), metalMat);
			base.castShadow = true; lampGroup.add(base);
			const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.020, 0.74, 10), metalMat);
			pole.position.set(0, 0.39, 0); pole.castShadow = true; lampGroup.add(pole);
			const topJoint = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), metalMat);
			topJoint.position.set(0, 0.76, 0); lampGroup.add(topJoint);
			const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.30, 10), metalMat);
			arm.rotation.x = Math.PI / 2; arm.position.set(0, 0.76, 0.15); arm.castShadow = true; lampGroup.add(arm);
			const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 0.20, 20, 1, true), shadeMat);
			shade.position.set(0, 0.65, 0.30); lampGroup.add(shade);
			const shadeCap = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 }));
			shadeCap.rotation.x = -Math.PI / 2; shadeCap.position.set(0, 0.75, 0.30); lampGroup.add(shadeCap);
			const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 3.0 }));
			bulb.position.set(0, 0.66, 0.30); lampGroup.add(bulb); lampBulbMesh = bulb;

			lampGroup.position.set(LX, LY, LZ); scene.add(lampGroup);
			lampGroup.traverse((c: any) => { if (c.isMesh) lampMeshes.push(c); });
		}

		/* ═══════════════════════════════════════════════════════════
		   LAPTOP → Projects
		═══════════════════════════════════════════════════════════ */
		const laptopGroup = new THREE.Group();
		{
			const alum = gloss(0x2c2c36, { roughness: 0.28, metalness: 0.65 });
			const keyMat = mat(0x1e1e26, { roughness: 0.82 });
			const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.055, 0.68), alum);
			base.castShadow = true; laptopGroup.add(base);
			for (let i = 0; i < 5; i++) {
				const slot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.012), mat(0x111118));
				slot.position.set(-0.28 + i * 0.14, 0.03, 0.32); laptopGroup.add(slot);
			}
			const screen = new THREE.Mesh(new THREE.BoxGeometry(0.91, 0.59, 0.028), alum);
			screen.position.set(0, 0.312, -0.325); screen.rotation.x = -Math.PI * 0.175; screen.castShadow = true; laptopGroup.add(screen);
			const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.50, 0.006), mat(0x0a0a12));
			bezel.position.set(0, 0.312, -0.31); bezel.rotation.x = -Math.PI * 0.175; laptopGroup.add(bezel);
			// Canvas texture — GitHub activity grid + Sonar status (animated in render loop)
			const _sc = document.createElement('canvas');
			_sc.width = 512; _sc.height = 300;
			laptopCanvasCtx = _sc.getContext('2d')!;
			const lc = laptopCanvasCtx;
			// Background
			lc.fillStyle = '#0d1117'; lc.fillRect(0, 0, 512, 300);
			// Header
			lc.fillStyle = '#58a6ff'; lc.font = 'bold 13px monospace';
			lc.fillText('github.com/sxrxvxnn', 16, 26);
			lc.fillStyle = '#8b949e'; lc.font = '10px monospace';
			lc.fillText('Sonar · FastAPI · React · Groq · Playwright', 16, 44);
			// Contribution grid (40 cols × 7 rows)
			const _levels = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
			const _cx = 16, _cy = 58, _cs = 7, _cg = 2;
			for (let c = 0; c < 40; c++) {
				for (let r = 0; r < 7; r++) {
					const rng = Math.random();
					const lv = rng < 0.32 ? 0 : rng < 0.52 ? 1 : rng < 0.68 ? 2 : rng < 0.84 ? 3 : 4;
					lc.fillStyle = _levels[lv];
					lc.fillRect(_cx + c * (_cs + _cg), _cy + r * (_cs + _cg), _cs, _cs);
				}
			}
			// Stats
			lc.fillStyle = '#39d353'; lc.font = 'bold 11px monospace';
			lc.fillText('847 contributions in the last year', 16, 156);
			// Tech badges
			const _badges = [['Sonar','#7c6af7'],['FastAPI','#5af778'],['React','#55ccff'],['Groq','#f7d96a']];
			let _bx = 16;
			_badges.forEach(([label, col]) => {
				const bw = (label as string).length * 8 + 16;
				lc.fillStyle = (col as string) + '22'; lc.fillRect(_bx, 166, bw, 18);
				lc.strokeStyle = col as string; lc.lineWidth = 1; lc.strokeRect(_bx, 166, bw, 18);
				lc.fillStyle = col as string; lc.font = '10px monospace'; lc.fillText(label as string, _bx + 6, 179);
				_bx += bw + 6;
			});
			// Status line
			lc.fillStyle = '#8b949e'; lc.font = '10px monospace';
			lc.fillText('Building:', 16, 210);
			lc.fillStyle = '#e6edf3'; lc.font = 'bold 11px monospace';
			lc.fillText('Sonar — Lead Intelligence Platform', 16, 224);
			lc.fillStyle = '#8b949e'; lc.font = '10px monospace';
			lc.fillText('@ Beagle Security · Trivandrum, India', 16, 238);
			// Cursor drawn live in animate loop (blinks)
			laptopCanvasTex = new THREE.CanvasTexture(_sc);
			const dispMat = new THREE.MeshStandardMaterial({
				color: 0x000000,
				emissive: new THREE.Color(1, 1, 1),
				emissiveIntensity: 0.85,
				emissiveMap: laptopCanvasTex,
				roughness: 0.3,
			});
			(dispMat as any)._baseIntensity = dispMat.emissiveIntensity; laptopScreenMats.push(dispMat); dispMatRef = dispMat;
			const display = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.44, 0.004), dispMat);
			display.position.set(0, 0.312, -0.296); display.rotation.x = -Math.PI * 0.175; laptopGroup.add(display);
			const codeColors = [0x7c6af7, 0x5af778, 0xf7d96a, 0xf7916a, 0x55ccff, 0x7c6af7, 0x5af778];
			codeColors.forEach((col, i) => {
				const w = 0.12 + Math.random() * 0.25;
				const lm = emMat(col, col, 1.2); (lm as any)._baseIntensity = lm.emissiveIntensity; laptopScreenMats.push(lm);
				const line = new THREE.Mesh(new THREE.BoxGeometry(w, 0.018, 0.002), lm);
				const indent = i % 3 === 0 ? 0.02 : i % 3 === 1 ? 0.06 : 0.1;
				line.position.set(-0.28 + indent + w / 2, 0.145 - i * 0.058 + 0.312, -0.284); line.rotation.x = -Math.PI * 0.175; laptopGroup.add(line);
			});
			const kbd = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.009, 0.52), keyMat);
			kbd.position.set(0, 0.032, 0.02); laptopGroup.add(kbd);
			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 12; col++) {
					const key = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.01, 0.044), mat(0x262632));
					key.position.set(-0.37 + col * 0.067, 0.04, -0.08 + row * 0.065); laptopGroup.add(key);
				}
			}
			const logo = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), emMat(0xaaaacc, 0xffffff, 0.4));
			logo.position.set(0, 0.31, -0.34); logo.rotation.x = Math.PI * 0.825; laptopGroup.add(logo);
			const led = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), emMat(0x00ff88, 0x00ff88, 3));
			led.position.set(0.44, 0.032, 0.32); laptopGroup.add(led);
		}
		laptopGroup.position.set(-0.3, 1.135, -6.52); laptopGroup.rotation.y = Math.PI * 0.06; laptopGroup.scale.set(0.88, 0.88, 0.88); scene.add(laptopGroup);

		/* ── Screen glow spill light ──────────────────────────────── */
		const screenGlow = new THREE.PointLight(0x2255cc, 2.2, 2.8);
		screenGlow.position.set(-0.32, 1.48, -6.72); scene.add(screenGlow); screenGlowRef = screenGlow;

		/* ═══════════════════════════════════════════════════════════
		   SECOND MONITOR → Sonar dashboard
		═══════════════════════════════════════════════════════════ */
		{
			const alum2 = gloss(0x2c2c36, { roughness: 0.28, metalness: 0.65 });
			const monGroup = new THREE.Group();
			// Stand base + pole
			const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.18), alum2);
			standBase.position.set(0, 0, 0); monGroup.add(standBase);
			const standPole = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.38, 0.045), alum2);
			standPole.position.set(0, 0.19, 0); monGroup.add(standPole);
			// Monitor housing
			const housing = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.78, 0.055), alum2);
			housing.position.set(0, 0.74, 0); housing.castShadow = true; monGroup.add(housing);
			// Bezel
			const mBezel = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.68, 0.012), mat(0x0a0a12));
			mBezel.position.set(0, 0.74, 0.028); monGroup.add(mBezel);
			// Display — Sonar dashboard canvas
			const _ms = document.createElement('canvas');
			_ms.width = 640; _ms.height = 380;
			const mc = _ms.getContext('2d')!;
			mc.fillStyle = '#0a0f1e'; mc.fillRect(0, 0, 640, 380);
			// Sidebar
			mc.fillStyle = '#111827'; mc.fillRect(0, 0, 140, 380);
			mc.fillStyle = '#7c6af7'; mc.fillRect(0, 0, 3, 380);
			// Sidebar nav items
			[['Leads','#7c6af7',true],['Pipeline','#8b949e',false],['Signals','#8b949e',false],['Export','#8b949e',false]].forEach(([label, col, active], i) => {
				if (active) { mc.fillStyle = '#7c6af722'; mc.fillRect(3, 12 + i * 38, 137, 30); }
				mc.fillStyle = col as string; mc.font = `${active ? 'bold' : 'normal'} 12px monospace`;
				mc.fillText(label as string, 18, 32 + i * 38);
			});
			// Main content header
			mc.fillStyle = '#e6edf3'; mc.font = 'bold 15px monospace';
			mc.fillText('Sonar — Lead Intelligence Platform', 156, 32);
			mc.fillStyle = '#8b949e'; mc.font = '10px monospace';
			mc.fillText('Beagle Security · Internal Tool', 156, 50);
			// Stats row
			const stats = [['247','Total Leads','#7c6af7'],['89','Qualified','#5af778'],['12','Active','#55ccff'],['94%','Match Rate','#f7d96a']];
			stats.forEach(([val, label, col], i) => {
				const sx = 156 + i * 118;
				mc.fillStyle = '#111827'; mc.fillRect(sx, 62, 108, 58);
				mc.fillStyle = col as string; mc.font = 'bold 20px monospace'; mc.fillText(val as string, sx + 10, 90);
				mc.fillStyle = '#8b949e'; mc.font = '9px monospace'; mc.fillText(label as string, sx + 10, 108);
			});
			// Bar chart — weekly leads
			mc.fillStyle = '#e6edf3'; mc.font = 'bold 11px monospace'; mc.fillText('Weekly Pipeline', 156, 144);
			const bars = [32, 48, 41, 67, 55, 82, 74];
			const days = ['M','T','W','T','F','S','S'];
			bars.forEach((h, i) => {
				const bx = 156 + i * 62, maxH = 70;
				mc.fillStyle = '#1c2333'; mc.fillRect(bx, 154, 48, maxH);
				const fh = Math.round(h / 100 * maxH);
				mc.fillStyle = '#7c6af7'; mc.fillRect(bx, 154 + maxH - fh, 48, fh);
				mc.fillStyle = '#8b949e'; mc.font = '9px monospace'; mc.fillText(days[i], bx + 18, 238);
			});
			// Status row
			mc.fillStyle = '#00cc66'; mc.beginPath(); mc.arc(162, 260, 5, 0, Math.PI * 2); mc.fill();
			mc.fillStyle = '#5af778'; mc.font = '11px monospace'; mc.fillText('Pipeline active · 3 enrichment workers running', 174, 264);
			// Recent leads table header
			mc.fillStyle = '#8b949e'; mc.font = '9px monospace';
			['Company','Industry','Score'].forEach((h, i) => mc.fillText(h, 156 + i * 155, 290));
			mc.strokeStyle = '#1c2333'; mc.lineWidth = 1; mc.beginPath(); mc.moveTo(152, 296); mc.lineTo(628, 296); mc.stroke();
			// Sample rows
			const rows = [['Stripe','Fintech SaaS','94'],['Notion','Productivity','87'],['Linear','Dev Tools','82']];
			rows.forEach(([co, ind, sc], i) => {
				mc.fillStyle = i % 2 === 0 ? '#0f1420' : '#0a0f1e'; mc.fillRect(152, 300 + i * 22, 476, 22);
				mc.fillStyle = '#e6edf3'; mc.font = '10px monospace'; mc.fillText(co, 156, 315 + i * 22);
				mc.fillStyle = '#8b949e'; mc.fillText(ind, 311, 315 + i * 22);
				mc.fillStyle = '#5af778'; mc.fillText(sc, 466, 315 + i * 22);
			});
			const monTex = new THREE.CanvasTexture(_ms);
			const monMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(1,1,1), emissiveIntensity: 0.75, emissiveMap: monTex, roughness: 0.3 });
			const monDisplay = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, 0.004), monMat);
			monDisplay.position.set(0, 0.74, 0.032); monGroup.add(monDisplay);
			monGroup.position.set(0.95, 1.12, -6.85); monGroup.rotation.y = -Math.PI * 0.04; scene.add(monGroup);
			// Monitor glow light
			const monGlow = new THREE.PointLight(0x7c6af7, 1.2, 2.2);
			monGlow.position.set(0.95, 1.52, -6.72); scene.add(monGlow);
		}

		/* ═══════════════════════════════════════════════════════════
		   NEON SIGN on back wall
		═══════════════════════════════════════════════════════════ */
		{
			const nc = document.createElement('canvas');
			nc.width = 512; nc.height = 80;
			const nctx = nc.getContext('2d')!;
			nctx.fillStyle = '#08081a'; nctx.fillRect(0, 0, 512, 80);
			// Multi-pass glow: outer → inner
			[['rgba(255,0,140,0.12)', 48], ['rgba(255,0,140,0.3)', 22], ['rgba(255,80,180,0.8)', 8]].forEach(([col, blur]) => {
				nctx.shadowColor = col as string; nctx.shadowBlur = blur as number;
				nctx.fillStyle = col as string; nctx.font = 'bold 56px monospace'; nctx.textAlign = 'center';
				nctx.fillText('BUILDING', 256, 62);
			});
			nctx.fillStyle = '#ffaadd'; nctx.shadowBlur = 0; nctx.fillText('BUILDING', 256, 62);
			const neonTex = new THREE.CanvasTexture(nc);
			const neonSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(1,1,1), emissiveIntensity: 1.4, emissiveMap: neonTex, transparent: true }));
			neonSign.position.set(3.0, 4.5, -8.44); scene.add(neonSign);
			const neonLight = new THREE.PointLight(0xff0088, 2.2, 4.0);
			neonLight.position.set(3.0, 4.5, -7.8); scene.add(neonLight); neonLightRef = neonLight;
		}

		/* ═══════════════════════════════════════════════════════════
		   COFFEE MUG + STEAM on desk
		═══════════════════════════════════════════════════════════ */
		{
			const mugMat = mat(0xe8e0d0, { roughness: 0.65 });
			const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.044, 0.115, 16), mugMat);
			mug.position.set(0.24, 1.198, -6.28); mug.castShadow = true; scene.add(mug);
			const coffeeTop = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), mat(0x3d1800, { roughness: 0.95 }));
			coffeeTop.rotation.x = -Math.PI / 2; coffeeTop.position.set(0.24, 1.258, -6.28); scene.add(coffeeTop);
			const handle = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 8, 14, Math.PI), mugMat);
			handle.rotation.z = Math.PI / 2; handle.position.set(0.24 + 0.052, 1.198, -6.28); scene.add(handle);
			// Steam particles
			for (let i = 0; i < 5; i++) {
				const sp = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 4),
					new THREE.MeshStandardMaterial({ color: 0xccccff, transparent: true, opacity: 0.3, roughness: 1, depthWrite: false }));
				sp.position.set(0.24 + (Math.random()-0.5)*0.015, 1.27 + i * 0.045, -6.28 + (Math.random()-0.5)*0.015);
				sp.userData.baseX = sp.position.x; sp.userData.baseZ = sp.position.z;
				sp.userData.phase = i * (Math.PI * 2 / 5); sp.userData.startY = sp.position.y;
				scene.add(sp); steamParticles.push(sp);
			}
		}

		/* ═══════════════════════════════════════════════════════════
		   POST-IT NOTES on back wall
		═══════════════════════════════════════════════════════════ */
		{
			const notes = [
				{ text: 'Groq LLM', color: '#f7d96a', x: -1.8, y: 3.9, rz: -0.08 },
				{ text: 'FastAPI', color: '#5af778', x: -1.12, y: 4.18, rz: 0.05 },
				{ text: 'Playwright', color: '#55ccff', x: -0.42, y: 3.82, rz: -0.04 },
				{ text: 'Supabase', color: '#7c6af7', x: 0.28, y: 4.1, rz: 0.07 },
				{ text: 'Vercel ▲', color: '#e8e8e8', x: 0.98, y: 3.85, rz: -0.06 },
			];
			notes.forEach(({ text, color, x, y, rz }) => {
				const pc = document.createElement('canvas');
				pc.width = 128; pc.height = 128;
				const pctx = pc.getContext('2d')!;
				pctx.fillStyle = color; pctx.fillRect(0, 0, 128, 128);
				pctx.fillStyle = 'rgba(0,0,0,0.07)'; pctx.fillRect(0, 0, 128, 14); // fold shadow
				pctx.fillStyle = 'rgba(0,0,0,0.65)'; pctx.font = 'bold 20px sans-serif'; pctx.textAlign = 'center';
				pctx.fillText(text, 64, 75);
				const ptex = new THREE.CanvasTexture(pc);
				const post = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.88 }));
				post.position.set(x, y, -8.43); post.rotation.z = rz; scene.add(post);
			});
		}

		/* ═══════════════════════════════════════════════════════════
		   RUBBER DUCK on desk
		═══════════════════════════════════════════════════════════ */
		{
			const dYellow = mat(0xf7d020, { roughness: 0.55, metalness: 0.05 });
			const dOrange = mat(0xf77020, { roughness: 0.5 });
			const body = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), dYellow);
			body.scale.set(1, 0.82, 1); body.position.set(0.58, 1.185, -6.42); body.castShadow = true; scene.add(body); wobbleMeshes.push(body);
			const head = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), dYellow);
			head.position.set(0.58, 1.244, -6.38); scene.add(head);
			const beak = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.025, 8), dOrange);
			beak.rotation.x = -Math.PI / 2; beak.position.set(0.58, 1.243, -6.355); scene.add(beak);
			const eye = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 4), mat(0x111111));
			eye.position.set(0.595, 1.252, -6.363); scene.add(eye);
		}

		/* ═══════════════════════════════════════════════════════════
		   BOOKSHELF → Skills
		═══════════════════════════════════════════════════════════ */
		const bookshelfGroup = new THREE.Group();
		{
			const wood = mat(0x9a7c4a, { roughness: 0.75 }), dark = mat(0x6b5638, { roughness: 0.78 });
			const makePanel = (w: number, h: number, d: number, x: number, y: number, z: number) => {
				const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood);
				m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; bookshelfGroup.add(m);
			};
			makePanel(0.12, 3.2, 0.45, -0.73, 0, 0); makePanel(0.12, 3.2, 0.45, 0.73, 0, 0);
			makePanel(1.55, 0.12, 0.45, 0, -1.55, 0); makePanel(1.55, 0.12, 0.45, 0, 1.55, 0);
			makePanel(1.55, 0.08, 0.43, 0, -0.78, 0); makePanel(1.55, 0.08, 0.43, 0, 0.10, 0); makePanel(1.55, 0.08, 0.43, 0, 0.98, 0);
			const back = new THREE.Mesh(new THREE.BoxGeometry(1.46, 3.1, 0.04), dark);
			back.position.set(0, 0, -0.20); bookshelfGroup.add(back);
			const bookPalette = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xd35400, 0x27ae60, 0x8e44ad, 0xc0392b, 0x2980b9, 0xf1c40f, 0x16a085, 0x7f8c8d];
			let bi = 0;
			for (let row = 0; row < 3; row++) {
				const baseY = -1.48 + row * 0.88;
				let x = -0.62;
				while (x < 0.63) {
					const bw = 0.062 + Math.random() * 0.052, bh = 0.38 + Math.random() * 0.22;
					const tilted = Math.random() > 0.82;
					const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.30), mat(bookPalette[bi % bookPalette.length], { roughness: 0.85 }));
					book.position.set(x + bw / 2, baseY + bh / 2, 0.02); book.rotation.z = tilted ? (Math.random() - 0.5) * 0.25 : 0; book.castShadow = true; bookshelfGroup.add(book);
					const spine = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.7, bh * 0.15, 0.01), mat(0xffffff, { roughness: 0.95 }));
					spine.position.set(x + bw / 2, baseY + bh * 0.6, 0.162); bookshelfGroup.add(spine);
					x += bw + 0.008; bi++;
				}
			}
			// Top shelf décor
			const globeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.08, 8), mat(0x8a6030));
			globeBase.position.set(-0.45, 1.67, 0.04); bookshelfGroup.add(globeBase);
			const globe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat(0x2255aa, { roughness: 0.5 }));
			globe.position.set(-0.45, 1.83, 0.04); bookshelfGroup.add(globe);
			for (let i = 0; i < 3; i++) {
				const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.004, 4, 16), mat(0x88aaff));
				ring.position.set(-0.45, 1.83, 0.04); ring.rotation.y = (i / 3) * Math.PI; bookshelfGroup.add(ring);
			}
			const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.055, 0.13, 10), mat(0xcc7755));
			pot.position.set(0.5, 1.64, 0.04); bookshelfGroup.add(pot);
			const soil = new THREE.Mesh(new THREE.CircleGeometry(0.066, 10), mat(0x3d2b1f));
			soil.position.set(0.5, 1.706, 0.04); soil.rotation.x = -Math.PI / 2; bookshelfGroup.add(soil);
			for (let i = 0; i < 6; i++) {
				const angle = (i / 6) * Math.PI * 2;
				const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.062, 6, 5), mat(0x228844, { roughness: 0.9 }));
				leaf.scale.set(0.6, 1.3, 0.6); leaf.position.set(0.5 + Math.sin(angle) * 0.06, 1.82 + Math.random() * 0.06, 0.04 + Math.cos(angle) * 0.06); leaf.castShadow = true; bookshelfGroup.add(leaf);
			}
			const trophy = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.14, 8), mat(0xf0c040, { roughness: 0.3, metalness: 0.8 }));
			trophy.position.set(0.15, 1.73, 0.04); bookshelfGroup.add(trophy);
			const star = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 4), mat(0xf0c040, { roughness: 0.2, metalness: 0.9 }));
			star.position.set(0.15, 1.83, 0.04); bookshelfGroup.add(star);
			([[- 0.63, -2.15, -0.18], [-0.63, -2.15, 0.18], [0.63, -2.15, -0.18], [0.63, -2.15, 0.18]] as any[]).forEach(([x, y, z]) => {
				const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), wood);
				leg.position.set(x, y, z); leg.castShadow = leg.receiveShadow = true; bookshelfGroup.add(leg);
			});
		}
		bookshelfGroup.position.set(3.5, 1.85, -7.2); bookshelfGroup.scale.set(1.2, 1.2, 1.2); scene.add(bookshelfGroup);

		/* ═══════════════════════════════════════════════════════════
		   WALL FRAME → About Me
		═══════════════════════════════════════════════════════════ */
		const wallFrameGroup = new THREE.Group();
		{
			const goldMat = gloss(0xd4a048, { roughness: 0.25, metalness: 0.7 });
			const frameW = 1.6, frameH = 1.15, thick = 0.07, depth = 0.055;
			([[frameW + thick * 2, thick, depth, 0, frameH / 2 + thick / 2, 0], [frameW + thick * 2, thick, depth, 0, -frameH / 2 - thick / 2, 0], [thick, frameH, depth, -frameW / 2 - thick / 2, 0, 0], [thick, frameH, depth, frameW / 2 + thick / 2, 0, 0]] as any[]).forEach(([w, h, d, x, y]) => {
				const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), goldMat);
				bar.position.set(x, y, 0); bar.castShadow = true; wallFrameGroup.add(bar);
			});
			const canvas3d = new THREE.Mesh(new THREE.PlaneGeometry(frameW, frameH), new THREE.MeshStandardMaterial({ color: 0x18183a, roughness: 0.92 }));
			canvas3d.position.z = 0.015; wallFrameGroup.add(canvas3d);
			wfSkyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a25, roughness: 0.9 });
			const skyGrad = new THREE.Mesh(new THREE.PlaneGeometry(frameW * 0.95, frameH * 0.95), wfSkyMat);
			skyGrad.position.z = 0.018; wallFrameGroup.add(skyGrad);
			const mountainPoints: [number, number][] = [[-0.78, -0.42], [0.78, -0.42], [0.78, -0.1], [0.55, -0.1], [0.4, -0.3], [0.22, -0.06], [0.05, -0.28], [-0.18, -0.02], [-0.38, -0.3], [-0.55, -0.1], [-0.78, -0.1]];
			const shape = new THREE.Shape();
			shape.moveTo(...mountainPoints[0]); mountainPoints.slice(1).forEach(p => shape.lineTo(...p)); shape.closePath();
			wfMtnMat = new THREE.MeshStandardMaterial({ color: 0x1a1a40, roughness: 0.9 });
			const mtn = new THREE.Mesh(new THREE.ShapeGeometry(shape), wfMtnMat);
			mtn.position.z = 0.022; wallFrameGroup.add(mtn);
			wfMoon = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshStandardMaterial({ color: 0xfffde8, emissive: 0xffeeaa, emissiveIntensity: 0.6, transparent: true, opacity: 1 }));
			wfMoon.position.set(0.4, 0.28, 0.023); wallFrameGroup.add(wfMoon);
			wfSun = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshStandardMaterial({ color: 0xffee55, emissive: 0xffaa00, emissiveIntensity: 1.4, transparent: true, opacity: 0 }));
			wfSun.position.set(0.35, 0.28, 0.023); wfSun.visible = false; wallFrameGroup.add(wfSun);
			for (let i = 0; i < 18; i++) {
				const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8, transparent: true, opacity: 1 });
				const star = new THREE.Mesh(new THREE.CircleGeometry(0.008 + Math.random() * 0.007, 6), starMat);
				star.position.set((Math.random() - 0.5) * 1.4, Math.random() * 0.55 - 0.05, 0.024);
				wfStars.push(star); wallFrameGroup.add(star);
			}
			for (let i = 0; i < 14; i++) {
				const bh = 0.06 + Math.random() * 0.16, bw = 0.04 + Math.random() * 0.06;
				const bldMat = new THREE.MeshStandardMaterial({ color: 0x0d0d28, roughness: 0.9 });
				wfBldMats.push(bldMat);
				const bld = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.01), bldMat);
				bld.position.set(-0.62 + i * 0.095, -0.42 + bh / 2, 0.025); wallFrameGroup.add(bld);
				if (Math.random() > 0.4) {
					const winMat = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffdd44, emissiveIntensity: 1.5, transparent: true, opacity: 1 });
					wfWinMats.push(winMat);
					const win = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.002), winMat);
					win.position.set(-0.62 + i * 0.095, -0.42 + bh * 0.6, 0.027); wallFrameGroup.add(win);
				}
			}
		}
		wallFrameGroup.position.set(-1.8, 4.0, -8.49); wallFrameGroup.scale.set(1.3, 1.3, 1.3); scene.add(wallFrameGroup);

		/* ═══════════════════════════════════════════════════════════
		   CHAIR (stays at desk permanently)
		═══════════════════════════════════════════════════════════ */
		const chairGroup = new THREE.Group();
		{
			const seatMat = mat(0x1a1a24, { roughness: 0.8 }), chromeMat = gloss(0x888898, { metalness: 0.9, roughness: 0.15 });
			const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.55), seatMat);
			seat.position.y = 0.58; seat.castShadow = true; chairGroup.add(seat);
			const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.06), seatMat);
			chairBack.position.set(0, 0.92, -0.24); chairBack.castShadow = true; chairGroup.add(chairBack);
			const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.06), seatMat);
			headrest.position.set(0, 1.27, -0.24); chairGroup.add(headrest);
			([-0.34, 0.34] as number[]).forEach(x => {
				const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.36), seatMat);
				arm.position.set(x, 0.74, 0.03); chairGroup.add(arm);
				const sup = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.17, 8), chromeMat);
				sup.position.set(x, 0.65, 0.09); chairGroup.add(sup);
			});
			const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.4, 10), chromeMat);
			lift.position.set(0, 0.2, 0); chairGroup.add(lift);
			for (let i = 0; i < 5; i++) {
				const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.04), chromeMat);
				spoke.rotation.y = (i / 5) * Math.PI * 2; spoke.position.y = 0.03; chairGroup.add(spoke);
				const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), mat(0x111111));
				wheel.rotation.z = Math.PI / 2; wheel.position.set(Math.sin((i / 5) * Math.PI * 2) * 0.19, 0.03, Math.cos((i / 5) * Math.PI * 2) * 0.19); chairGroup.add(wheel);
			}
		}
		chairGroup.position.set(1.6, 0, -2.2); chairGroup.rotation.y = -Math.PI * 0.18; chairGroup.scale.set(1.18, 1.18, 1.18); scene.add(chairGroup);

		/* ═══════════════════════════════════════════════════════════
		   CHARACTER → Contact
		═══════════════════════════════════════════════════════════ */
		const characterGroup = new THREE.Group();
		{
			const skin = mat(0xffccaa), shirt = mat(0x3a3acc, { roughness: 0.8 });
			const pants = mat(0x223355, { roughness: 0.85 }), hair = mat(0x1a0f05);
			const shoe = mat(0x111111), glass = gloss(0x222233, { metalness: 0.85, roughness: 0.08 });

			const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.22), shirt);
			torso.position.set(0, 0.87, 0.02); torso.castShadow = true; characterGroup.add(torso);
			const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.30, 0.012), mat(0x5555dd));
			stripe.position.set(0, 0.87, 0.117); characterGroup.add(stripe);
			const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.012), mat(0xfafafa));
			collarL.position.set(-0.05, 1.09, 0.116); collarL.rotation.z = 0.35; characterGroup.add(collarL);
			const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.012), mat(0xfafafa));
			collarR.position.set(0.05, 1.09, 0.116); collarR.rotation.z = -0.35; characterGroup.add(collarR);

			([-0.11, 0.11] as number[]).forEach(lx => {
				const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.38), pants);
				thigh.position.set(lx, 0.64, 0.19); thigh.castShadow = true; characterGroup.add(thigh);
				const calf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.13), pants);
				calf.position.set(lx, 0.40, 0.38); calf.castShadow = true; characterGroup.add(calf);
				const shoe2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), shoe);
				shoe2.position.set(lx, 0.14, 0.47); characterGroup.add(shoe2);
			});

			([-0.21, 0.21] as number[]).forEach(ax => {
				const side = ax < 0 ? -1 : 1;
				const uArm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.11), shirt);
				uArm.position.set(ax, 0.96, 0.04); uArm.rotation.z = side * 0.22; uArm.rotation.x = -0.55; uArm.castShadow = true; characterGroup.add(uArm);
				const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), shirt);
				elbow.position.set(ax, 0.841, 0.113); characterGroup.add(elbow);
				const fore = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.21, 0.088), skin);
				fore.position.set(ax * 0.89, 0.766, 0.184); fore.rotation.x = 2.38; fore.rotation.z = -side * 0.10; characterGroup.add(fore);
				const hand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.036, 0.085), skin);
				hand.position.set(ax * 0.78, 0.690, 0.255); characterGroup.add(hand);
				for (let f = 0; f < 4; f++) {
					const fing = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.034), skin);
					fing.position.set(ax * 0.78 + (f - 1.5) * 0.020, 0.690, 0.296); characterGroup.add(fing);
				}
			});

			const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.060, 0.09, 10), skin);
			neck.position.set(0, 1.145, 0.02); characterGroup.add(neck);
			const head = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.225, 0.20), skin);
			head.position.set(0, 1.305, 0.02); head.castShadow = true; characterGroup.add(head);

			const eyeY = 1.315;
			([-0.056, 0.056] as number[]).forEach(ex => {
				const brow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.010, 0.006), mat(0x1a0f05));
				brow.position.set(ex, eyeY + 0.022, 0.124); characterGroup.add(brow);
				const sclera = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.030, 0.006), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
				sclera.position.set(ex, eyeY, 0.128); characterGroup.add(sclera);
				const iris = new THREE.Mesh(new THREE.CircleGeometry(0.013, 12), new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
				iris.position.set(ex, eyeY, 0.132); characterGroup.add(iris);
				const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.007, 10), new THREE.MeshStandardMaterial({ color: 0x050508 }));
				pupil.position.set(ex, eyeY, 0.133); characterGroup.add(pupil);
				const shine = new THREE.Mesh(new THREE.CircleGeometry(0.004, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 }));
				shine.position.set(ex + 0.006, eyeY + 0.006, 0.134); characterGroup.add(shine);
			});

			([-0.108, 0.108] as number[]).forEach(ex => {
				const ear = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.048, 0.042), skin);
				ear.position.set(ex, 1.30, 0.02); characterGroup.add(ear);
			});

			const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.085, 0.21), hair);
			hairCap.position.set(0, 1.455, 0.01); characterGroup.add(hairCap);
			([-0.10, 0.10] as number[]).forEach(hx => {
				const side2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.18), hair);
				side2.position.set(hx, 1.36, 0.01); characterGroup.add(side2);
			});
			const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.04), hair);
			fringe.position.set(0, 1.41, 0.105); characterGroup.add(fringe);

			([-0.054, 0.054] as number[]).forEach(gx => {
				const lens = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 7, 18), glass);
				lens.position.set(gx, 1.30, 0.112); characterGroup.add(lens);
				const fill = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.35, roughness: 0.1 }));
				fill.position.set(gx, 1.30, 0.114); characterGroup.add(fill);
			});
			const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.007, 0.005), glass);
			bridge.position.set(0, 1.30, 0.113); characterGroup.add(bridge);
			([-0.08, 0.08] as number[]).forEach(tx => {
				const temple = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.006, 0.09), glass);
				temple.position.set(tx, 1.30, 0.067); characterGroup.add(temple);
			});

			([-0.11, 0.11] as number[]).forEach(hpx => {
				const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.022, 10), mat(0x1a1a22));
				cup.rotation.z = Math.PI / 2; cup.position.set(hpx, 1.345, 0.02); characterGroup.add(cup);
				const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.008, 10), mat(0x111118));
				pad.rotation.z = Math.PI / 2; pad.position.set(hpx * 1.06, 1.345, 0.02); characterGroup.add(pad);
			});
			const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.010, 7, 20, Math.PI), mat(0x1a1a22));
			hpBand.position.set(0, 1.38, 0.02); hpBand.rotation.z = Math.PI / 2; characterGroup.add(hpBand);

			// Laptop on lap
			const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.032, 0.30), gloss(0x2c2c36, { metalness: 0.6 }));
			lapBase.position.set(0, 0.66, 0.19); lapBase.rotation.x = -0.08; lapBase.castShadow = true; characterGroup.add(lapBase);
			const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.27, 0.016), gloss(0x2c2c36, { metalness: 0.6 }));
			lapScreen.position.set(0, 0.86, 0.01); lapScreen.rotation.x = -1.05; characterGroup.add(lapScreen);
			const lapDispMat = emMat(0x0d1f3c, 0x2244ee, 0.9);
			(lapDispMat as any)._baseIntensity = lapDispMat.emissiveIntensity; laptopScreenMats.push(lapDispMat);
			const lapDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.21, 0.006), lapDispMat);
			lapDisplay.position.set(0, 0.86, 0.022); lapDisplay.rotation.x = -1.05; characterGroup.add(lapDisplay);
			[0xf7916a, 0x5af778, 0x7c6af7, 0xffee88, 0x55ccff].forEach((col, i) => {
				const w = 0.055 + Math.random() * 0.10, indent = (i % 3) * 0.022;
				const clm = emMat(col, col, 1.5); (clm as any)._baseIntensity = clm.emissiveIntensity; laptopScreenMats.push(clm);
				const cl = new THREE.Mesh(new THREE.BoxGeometry(w, 0.013, 0.002), clm);
				cl.position.set(-0.08 + indent + w / 2, 0.88 + 0.04 - i * 0.038, 0.034); cl.rotation.x = -1.05; characterGroup.add(cl);
			});
		}
		characterGroup.position.set(1.6, 0, -2.2); characterGroup.rotation.y = -Math.PI * 0.18; characterGroup.scale.set(1.18, 1.18, 1.18);
		scene.add(characterGroup); characterGroupRef = characterGroup;

		/* ═══════════════════════════════════════════════════════════
		   BED
		═══════════════════════════════════════════════════════════ */
		const BED_X = -3.5, BED_Z = -7.1, BED_W = 2.2, BED_L = 2.9;
		let bedBodyLump: THREE.Group;
		{
			const bedWood = gloss(0x2e1a0e, { roughness: 0.48, metalness: 0.06 });
			const mattressMat = mat(0xcec0aa, { roughness: 0.88 });
			const blanketBase = mat(0x1e2d50, { roughness: 0.92 });
			const blanketFoldMat = mat(0x2a3f6a, { roughness: 0.88 });
			const bedGroup = new THREE.Group();

			([[BED_W / 2 - 0.06, BED_L / 2 - 0.07], [-BED_W / 2 + 0.06, BED_L / 2 - 0.07], [BED_W / 2 - 0.06, -BED_L / 2 + 0.07], [-BED_W / 2 + 0.06, -BED_L / 2 + 0.07]] as any[]).forEach(([ox, oz]) => {
				const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.36, 0.07), bedWood);
				leg.position.set(ox, 0.18, oz); leg.castShadow = true; bedGroup.add(leg);
			});
			([-BED_W / 2 + 0.04, BED_W / 2 - 0.04] as number[]).forEach(ox => {
				const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.20, BED_L - 0.14), bedWood);
				rail.position.set(ox, 0.22, 0); rail.castShadow = true; bedGroup.add(rail);
			});
			const mattress = new THREE.Mesh(new THREE.BoxGeometry(BED_W - 0.09, 0.22, BED_L - 0.04), mattressMat);
			mattress.position.set(0, 0.41, 0); mattress.receiveShadow = mattress.castShadow = true; bedGroup.add(mattress);
			const headboard = new THREE.Mesh(new THREE.BoxGeometry(BED_W + 0.12, 0.75, 0.10), bedWood);
			headboard.position.set(0, 0.58, -BED_L / 2 - 0.05); headboard.castShadow = true; bedGroup.add(headboard);
			const headTop = new THREE.Mesh(new THREE.BoxGeometry(BED_W + 0.12, 0.09, 0.14), bedWood);
			headTop.position.set(0, 0.97, -BED_L / 2 - 0.05); bedGroup.add(headTop);
			for (let i = 0; i < 4; i++) {
				const slat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.07), bedWood);
				slat.position.set(-BED_W / 2 + 0.32 + i * (BED_W - 0.30) / 3, 0.58, -BED_L / 2 - 0.04); bedGroup.add(slat);
			}
			const footboard = new THREE.Mesh(new THREE.BoxGeometry(BED_W + 0.12, 0.34, 0.08), bedWood);
			footboard.position.set(0, 0.38, BED_L / 2 + 0.04); footboard.castShadow = true; bedGroup.add(footboard);
			([-0.34, 0.34] as number[]).forEach(px => {
				const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.11, 0.38), mat(0xf5f0e8, { roughness: 0.85 }));
				pillow.position.set(px, 0.55, -BED_L / 2 + 0.27); bedGroup.add(pillow);
			});
			const blanket = new THREE.Mesh(new THREE.BoxGeometry(BED_W - 0.09, 0.13, BED_L - 0.55), blanketBase);
			blanket.position.set(0, 0.55, 0.16); blanket.castShadow = true; bedGroup.add(blanket);
			const fold = new THREE.Mesh(new THREE.BoxGeometry(BED_W - 0.09, 0.07, 0.24), blanketFoldMat);
			fold.position.set(0, 0.61, -BED_L / 2 + 0.57); bedGroup.add(fold);

			// Sleeping body lump
			bedBodyLump = new THREE.Group();
			const BSY = 0.52, HZ = -BED_L / 2 + 0.26, S = 1.18;
			const _skin = mat(0xf0c090, { roughness: 0.75 }), _hair = mat(0x1a1008, { roughness: 0.85 });
			const _shirt = mat(0x3a3acc, { roughness: 0.8 }), _blkA = mat(0x1c2e55, { roughness: 0.90 }), _blkB = mat(0x253e6e, { roughness: 0.88 });
			const blkUpper = new THREE.Mesh(new THREE.BoxGeometry(BED_W - 0.08, 0.26, 1.22), _blkA);
			blkUpper.position.set(0, BSY + 0.18, -BED_L / 2 + 1.16); bedBodyLump.add(blkUpper);
			const blkMid = new THREE.Mesh(new THREE.BoxGeometry(BED_W - 0.08, 0.20, 0.93), _blkA);
			blkMid.position.set(0, BSY + 0.15, -BED_L / 2 + 2.26); bedBodyLump.add(blkMid);
			const blkLow = new THREE.Mesh(new THREE.BoxGeometry(BED_W - 0.08, 0.12, 0.52), _blkA);
			blkLow.position.set(0, BSY + 0.10, BED_L / 2 - 0.21); bedBodyLump.add(blkLow);
			const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 1.30), _blkB);
			ridge.position.set(0, BSY + 0.25, -BED_L / 2 + 1.35); bedBodyLump.add(ridge);
			const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45 * S, 0.15, 0.28 * S), _shirt);
			chest.position.set(0, BSY + 0.25, HZ + 0.40 * S); bedBodyLump.add(chest);
			const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.26 * S, 0.19, 0.28 * S), _skin);
			headBox.position.set(0, BSY + 0.16, HZ); bedBodyLump.add(headBox);
			const hairMain = new THREE.Mesh(new THREE.BoxGeometry(0.27 * S, 0.08, 0.22 * S), _hair);
			hairMain.position.set(0, BSY + 0.225, HZ - 0.045); bedBodyLump.add(hairMain);
			bedBodyLump.visible = false;
			bedGroup.add(bedBodyLump);
			bedGroup.position.set(BED_X, 0, BED_Z);
			scene.add(bedGroup);
			bedBodyLumpRef = bedBodyLump;
		}

		/* ── Moonlight ────────────────────────────────────────────── */
		const nightLightPt = new THREE.SpotLight(0x8899bb, 0, 11, Math.PI * 0.14, 0.6, 1.5);
		nightLightPt.position.set(-4.7, 3.0, -5.8); nightLightPt.target.position.set(BED_X, 0.5, BED_Z);
		nightLightPt.castShadow = false; scene.add(nightLightPt); scene.add(nightLightPt.target); nightLightPtRef = nightLightPt;
		{
			const poolMat = new THREE.MeshBasicMaterial({ color: 0x99aacc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
			const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.8), poolMat);
			pool.rotation.x = -Math.PI / 2; pool.rotation.z = Math.PI * 0.12; pool.position.set(BED_X + 0.2, 0.01, BED_Z + 0.3); scene.add(pool);
			const bedMat = new THREE.MeshBasicMaterial({ color: 0xaabbee, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
			const bedPool = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), bedMat);
			bedPool.rotation.x = -Math.PI / 2; bedPool.rotation.z = Math.PI * 0.12; bedPool.position.set(BED_X + 0.1, 0.53, BED_Z + 0.2); scene.add(bedPool);
			nightLightPt.userData.poolMat = poolMat; nightLightPt.userData.bedPoolMat = bedMat;
		}

		/* ── Sleep state machine ──────────────────────────────────── */
		const DESK_POS = new THREE.Vector3(1.6, 0, -2.2), DESK_ROT_Y = -Math.PI * 0.18;
		const BED_ENTRY = new THREE.Vector3(BED_X + 0.95, 0, BED_Z + 0.55), BED_ROT_Y = Math.PI * 0.55;
		{
			const h = new Date().getHours();
			if (h >= 23 || h < 7) { charState = 'sleeping'; characterGroup.visible = false; bedBodyLump.visible = true; }
		}

		function startGoingToBed() {
			if (charState !== 'sitting') return;
			charState = 'going_to_bed';
			const proxy = { px: characterGroup.position.x, pz: characterGroup.position.z, ry: characterGroup.rotation.y };
			gsap.to(proxy, { px: BED_ENTRY.x, pz: BED_ENTRY.z, ry: BED_ROT_Y, duration: 2.6, ease: 'power2.inOut',
				onUpdate() { characterGroup.position.set(proxy.px, 0, proxy.pz); characterGroup.rotation.y = proxy.ry; },
				onComplete() { characterGroup.visible = false; bedBodyLump.visible = true; charState = 'sleeping'; }
			});
		}
		function startWakingUp() {
			if (charState !== 'sleeping') return;
			charState = 'waking_up'; bedBodyLump.visible = false;
			characterGroup.position.copy(BED_ENTRY); characterGroup.rotation.y = BED_ROT_Y; characterGroup.visible = true;
			const proxy = { px: BED_ENTRY.x, pz: BED_ENTRY.z, ry: BED_ROT_Y };
			gsap.to(proxy, { px: DESK_POS.x, pz: DESK_POS.z, ry: DESK_ROT_Y, duration: 2.6, ease: 'power2.inOut',
				onUpdate() { characterGroup.position.set(proxy.px, 0, proxy.pz); characterGroup.rotation.y = proxy.ry; },
				onComplete() { charState = 'sitting'; }
			});
		}

		setProgress(60, 'Hanging clock…');

		/* ═══════════════════════════════════════════════════════════
		   WALL CLOCK
		═══════════════════════════════════════════════════════════ */
		const clockGroup = new THREE.Group();
		const handMat = new THREE.MeshStandardMaterial({ color: 0x111122 });
		const redMat = new THREE.MeshStandardMaterial({ color: 0xe84040 });
		const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.065, 52), gloss(0x1a1a32, { roughness: 0.18, metalness: 0.6 }));
		clockBody.rotation.x = Math.PI / 2; clockGroup.add(clockBody);
		const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.325, 52), new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.95 }));
		clockFace.position.z = 0.035; clockGroup.add(clockFace);
		const rim = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.026, 10, 52), gloss(0x999ab0, { metalness: 0.85, roughness: 0.18 }));
		rim.position.z = 0.028; clockGroup.add(rim);
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2, big = i % 3 === 0;
			const mark = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.025 : 0.014, big ? 0.065 : 0.042, 0.01), new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
			mark.position.set(Math.sin(a) * 0.265, Math.cos(a) * 0.265, 0.04); mark.rotation.z = -a; clockGroup.add(mark);
		}
		function makeHand(w: number, len: number, m: THREE.Material, zOff: number) {
			const pivot = new THREE.Group(); pivot.position.z = zOff;
			const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.011), m); mesh.position.y = len / 2; pivot.add(mesh);
			const tail = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, len * 0.22, 0.011), m); tail.position.y = -(len * 0.22) / 2; pivot.add(tail);
			return pivot;
		}
		hourPivot = makeHand(0.019, 0.16, handMat, 0.048);
		minPivot = makeHand(0.013, 0.23, handMat, 0.055);
		secPivot = makeHand(0.008, 0.27, redMat, 0.062);
		clockGroup.add(hourPivot, minPivot, secPivot);
		const pin = new THREE.Mesh(new THREE.CircleGeometry(0.02, 14), redMat.clone()); pin.position.z = 0.068; clockGroup.add(pin);
		clockGroup.position.set(0.8, 4.4, -8.49); scene.add(clockGroup);

		/* ═══════════════════════════════════════════════════════════
		   PARTICLES
		═══════════════════════════════════════════════════════════ */
		const PARTICLE_COUNT = isMobile ? 60 : 200;
		const particleGeo = new THREE.BufferGeometry();
		const particlePos = new Float32Array(PARTICLE_COUNT * 3);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			particlePos[i * 3] = (Math.random() - 0.5) * 9;
			particlePos[i * 3 + 1] = Math.random() * 5.5 + 0.5;
			particlePos[i * 3 + 2] = Math.random() * -8 - 0.3;
		}
		particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
		scene.add(new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0x9aafff, size: 0.042, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false })));
		particleGeoRef = particleGeo;

		/* ── Corner plants ────────────────────────────────────────── */
		function buildPlant(s: number) {
			const g = new THREE.Group();
			const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.14 * s, 0.28 * s, 10), mat(0xaa6633)); pot.castShadow = true; g.add(pot);
			const soil = new THREE.Mesh(new THREE.CircleGeometry(0.175 * s, 10), mat(0x3a2310)); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.142 * s; g.add(soil);
			for (let i = 0; i < 7; i++) {
				const a = (i / 7) * Math.PI * 2, h = 0.3 + Math.random() * 0.28;
				const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 7, 5), mat(0x228844, { roughness: 0.88 }));
				leaf.scale.set(0.55, h / 0.28, 0.55); leaf.position.set(Math.sin(a) * 0.12 * s, (0.45 + h * 0.2) * s, Math.cos(a) * 0.12 * s); leaf.castShadow = true; g.add(leaf);
			}
			return g;
		}
		const plant1 = buildPlant(1.2); plant1.position.set(-4.6, 0, -1.5); scene.add(plant1);
		const plant2 = buildPlant(0.9); plant2.position.set(4.5, 0, -6.5); scene.add(plant2);

		/* ── Coffee mug ───────────────────────────────────────────── */
		const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.12, 12), mat(0xf0f0f0));
		mug.position.set(-1.0, 1.19, -6.55); mug.castShadow = true; scene.add(mug); wobbleMeshes.push(mug);
		const mugLiq = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), mat(0x3a1800));
		mugLiq.rotation.x = -Math.PI / 2; mugLiq.position.set(-1.0, 1.252, -6.55); scene.add(mugLiq);
		const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.014, 7, 14, Math.PI), mat(0xf0f0f0));
		mugHandle.position.set(-0.935, 1.19, -6.55); mugHandle.rotation.y = Math.PI / 2; scene.add(mugHandle);

		/* ── Sticky notes ─────────────────────────────────────────── */
		([[0xffee44, -2.2], [0xff9999, 0.0], [0xaaffaa, 2.2]] as any[]).forEach(([col, px]) => {
			const note = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.015), mat(col, { roughness: 0.9 }));
			note.position.set(px, 2.1, -8.47); note.rotation.z = (Math.random() - 0.5) * 0.1; scene.add(note);
			for (let r = 0; r < 3; r++) {
				const ln = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.002), mat(0x33333333));
				ln.position.set(px, 2.18 - r * 0.07, -8.46); scene.add(ln);
			}
		});

		setProgress(86, 'Wiring interactions…');

		/* ═══════════════════════════════════════════════════════════
		   FLOATING LABELS
		═══════════════════════════════════════════════════════════ */
		labelDefs = [
			{ key: 'laptop', mesh: laptopGroup, icon: '💻', text: 'Projects', offset: new THREE.Vector3(0, 0.7, 0) },
			{ key: 'bookshelf', mesh: bookshelfGroup, icon: '📚', text: 'Skills', offset: new THREE.Vector3(0, 2.3, 0) },
			{ key: 'frame', mesh: wallFrameGroup, icon: '🖼️', text: 'About Me', offset: new THREE.Vector3(0, 1.0, 0) },
			{ key: 'character', mesh: characterGroup, icon: '🛏️', text: 'Contact', offset: new THREE.Vector3(0, 2.0, 0), getMesh: () => charState === 'sleeping' ? bedBodyLump : characterGroup },
		];
		labelDefs.forEach(def => {
			const div = document.createElement('div');
			div.className = 'scene-label';
			div.innerHTML = `<span class="label-emoji">${def.icon}</span><span class="label-text">${def.text}</span>`;
			if ('ontouchstart' in window) {
				div.style.pointerEvents = 'auto';
				div.addEventListener('click', (e: Event) => { e.stopPropagation(); const obj = interactiveObjects.find((o: any) => o.key === def.key); if (obj) focusObject(obj); });
			}
			labelsEl.appendChild(div);
			labelEls[def.key] = div;
		});

		/* ═══════════════════════════════════════════════════════════
		   INTERACTIVE OBJECTS MAP
		═══════════════════════════════════════════════════════════ */
		interactiveObjects = [
			{ mesh: laptopGroup, key: 'laptop', camPos: new THREE.Vector3(-0.1, 2.1, -4.5), camTarget: new THREE.Vector3(-0.3, 1.2, -6.5) },
			{ mesh: bookshelfGroup, key: 'bookshelf', camPos: new THREE.Vector3(1.6, 2.4, -5.5), camTarget: new THREE.Vector3(3.5, 2.0, -7.2) },
			{ mesh: wallFrameGroup, key: 'frame', camPos: new THREE.Vector3(-1.7, 4.0, -6.5), camTarget: new THREE.Vector3(-1.8, 4.0, -8.5) },
			{ mesh: characterGroup, key: 'character', camPos: new THREE.Vector3(-2.5, 2.0, -5.0), camTarget: new THREE.Vector3(-3.5, 0.5, -7.1),
			getMesh: () => charState === 'sleeping' ? bedBodyLump : characterGroup,
			getCamPos: () => charState === 'sleeping' ? new THREE.Vector3(-2.5, 2.0, -5.0) : new THREE.Vector3(-0.2, 2.0, 0.8),
			getCamTarget: () => charState === 'sleeping' ? new THREE.Vector3(-3.5, 0.5, -7.1) : new THREE.Vector3(1.6, 0.8, -2.2) },
		];

		const bedBodyMeshes = new Set<THREE.Object3D>();
		const meshToObject = new Map<THREE.Object3D, any>();
		function getAllMeshes(obj: THREE.Object3D) { const out: THREE.Object3D[] = []; obj.traverse((c: any) => { if (c.isMesh) out.push(c); }); return out; }

		interactiveObjects.forEach(o => getAllMeshes(o.mesh).forEach(m => { allInteractiveMeshes.push(m); meshToObject.set(m, o); }));
		const contactObj = interactiveObjects.find(o => o.key === 'character');
		bedBodyLump.traverse((c: any) => { if (c.isMesh) { allInteractiveMeshes.push(c); meshToObject.set(c, contactObj); bedBodyMeshes.add(c); } });

		function resolveHit(mesh: THREE.Object3D) {
			if (bedBodyMeshes.has(mesh) && charState !== 'sleeping') return null;
			return meshToObject.get(mesh) ?? null;
		}
		function setEmissive(group: THREE.Object3D, color: number, intensity: number) {
			group.traverse((c: any) => { if (!c.isMesh) return; (Array.isArray(c.material) ? c.material : [c.material]).forEach((m: any) => { if (m.emissive) { m.emissive.set(color); m.emissiveIntensity = intensity; } }); });
		}
		function clearEmissive(group: THREE.Object3D) { setEmissive(group, 0x000000, 0); }

		/* ═══════════════════════════════════════════════════════════
		   LIGHTING UPDATE
		═══════════════════════════════════════════════════════════ */
		function updateRoomLighting(now: Date) {
			const h24 = now.getHours() + now.getMinutes() / 60;
			let dayT = h24 < 5 ? 0 : h24 < 7 ? (h24 - 5) / 2 : h24 < 18 ? 1 : h24 < 20 ? 1 - (h24 - 18) / 2 : 0;
			const glowT = (h24 >= 5 && h24 < 8) ? Math.sin(((h24 - 5) / 3) * Math.PI) : (h24 >= 17 && h24 < 20) ? Math.sin(((h24 - 17) / 3) * Math.PI) : 0;

			ambient.color.lerpColors(new THREE.Color(0x1a1b38), new THREE.Color(0xc8d0ff), dayT);
			if (glowT > 0) ambient.color.lerp(new THREE.Color(0x6b3318), glowT * 0.4);
			ambient.intensity = 1.2 + dayT * 0.8;

			dirLight.color.lerpColors(new THREE.Color(0x1a2650), new THREE.Color(0xfff8f0), dayT);
			if (glowT > 0) dirLight.color.lerp(new THREE.Color(0xff7722), glowT * 0.7);
			dirLight.intensity = 0.6 + dayT * 2.2;

			const moonColor = new THREE.Color(0x8899cc);
			const paneColor = new THREE.Color(0x1a2244).lerp(new THREE.Color(0x6699cc), dayT);
			if (glowT > 0) paneColor.lerp(new THREE.Color(0xdd5500), glowT * 0.65);
			winPaneMats.forEach(m => { m.color.copy(paneColor); m.emissive.copy(dayT < 0.1 ? moonColor : paneColor); m.emissiveIntensity = dayT < 0.1 ? 0.55 : 0.05 + dayT * 0.5 + glowT * 0.35; });
			winLight.color.lerpColors(moonColor, new THREE.Color(0xaaccff), dayT);
			if (glowT > 0) winLight.color.lerp(new THREE.Color(0xff8844), glowT * 0.6);
			winLight.intensity = 0.55 * (1 - dayT) + 0.05 + dayT * 1.15 + glowT * 0.4;

			fillLeft.color.lerpColors(new THREE.Color(0x3355aa), new THREE.Color(0x88aaff), dayT);
			fillLeft.intensity = 0.9 + dayT * 0.6;
			fillRight.intensity = 1.0 + dayT * 0.4;
			ceilBounce.intensity = 0.8 + dayT * 0.5;
			charLight.intensity = 2.5 - dayT * 0.5;
			deskGlowBase = 4.0 - dayT * 0.9;
			lampLightBase = lampOn ? (9.0 - dayT * 1.5) : 0;
			if (ceilPanel.material) (ceilPanel.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 - dayT * 0.2;

			const nightT = Math.max(0, 1 - dayT * 2.5);
			nightLightPt.intensity = nightT * 2.2;
			if (nightLightPt.userData.poolMat) { nightLightPt.userData.poolMat.opacity = nightT * 0.12; nightLightPt.userData.bedPoolMat.opacity = nightT * 0.22; }

			const screenOn = h24 >= 7 && h24 < 23;
			laptopScreenMats.forEach((m: any) => { m.emissiveIntensity = screenOn ? (m._baseIntensity ?? 1.2) : 0; });

			updateClock(now.getHours(), now.getMinutes(), dayT);
		}

		function updateWallFrameTime(now: Date) {
			const h24 = now.getHours() + now.getMinutes() / 60;
			let dayT = h24 < 5 ? 0 : h24 < 7 ? (h24 - 5) / 2 : h24 < 18 ? 1 : h24 < 20 ? 1 - (h24 - 18) / 2 : 0;
			const glowT = (h24 >= 5 && h24 < 8) ? Math.sin(((h24 - 5) / 3) * Math.PI) : (h24 >= 17 && h24 < 20) ? Math.sin(((h24 - 17) / 3) * Math.PI) : 0;
			const skyColor = new THREE.Color(0x0a0a25).lerp(new THREE.Color(0x2277bb), dayT);
			if (glowT > 0) skyColor.lerp(new THREE.Color(0xcc5511), glowT * 0.6);
			wfSkyMat.color.copy(skyColor);
			wfMtnMat.color.lerpColors(new THREE.Color(0x1a1a40), new THREE.Color(0x1e3e18), dayT);
			const moonAlpha = Math.max(0, 1 - dayT * 2.5);
			wfMoon.visible = moonAlpha > 0.02; (wfMoon.material as THREE.MeshStandardMaterial).opacity = moonAlpha;
			const sunAlpha = Math.min(1, dayT * 3);
			wfSun.visible = sunAlpha > 0.02; (wfSun.material as THREE.MeshStandardMaterial).opacity = sunAlpha;
			const sunAngle = Math.max(0, Math.min(Math.PI, ((h24 - 6) / 12) * Math.PI));
			wfSun.position.x = 0.48 * Math.cos(Math.PI - sunAngle); wfSun.position.y = 0.38 * Math.sin(sunAngle) + 0.04;
			const zenithT = Math.sin(sunAngle);
			(wfSun.material as THREE.MeshStandardMaterial).color.lerpColors(new THREE.Color(0xff8800), new THREE.Color(0xffee88), zenithT);
			(wfSun.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + zenithT * 0.6;
			const starAlpha = Math.max(0, 1 - dayT * 3);
			wfStars.forEach(s => { s.visible = starAlpha > 0.02; (s.material as THREE.MeshStandardMaterial).opacity = starAlpha; });
			wfWinMats.forEach(m => { m.emissiveIntensity = Math.max(0, 1.5 - dayT * 1.8); m.opacity = Math.max(0.1, 1 - dayT * 0.6); });
			wfBldMats.forEach(m => m.color.lerpColors(new THREE.Color(0x0d0d28), new THREE.Color(0x2d2d50), dayT));
		}

		/* ═══════════════════════════════════════════════════════════
		   CLOCK TICK
		═══════════════════════════════════════════════════════════ */
		let simTime: Date | null = null;
		(window as any).setSimHour = (h: number, m = 0) => {
			simTime = new Date(2024, 0, 1, h, m, 0); charState = 'sitting';
			characterGroup.visible = true; bedBodyLump.visible = false;
			characterGroup.position.copy(DESK_POS); characterGroup.rotation.y = DESK_ROT_Y;
		};

		function tickScene() {
			const now = simTime ? new Date(simTime) : new Date();
			const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();
			secPivot.rotation.z = -((s + ms / 1000) / 60) * Math.PI * 2;
			minPivot.rotation.z = -((m + (s + ms / 1000) / 60) / 60) * Math.PI * 2;
			hourPivot.rotation.z = -((h + m / 60) / 12) * Math.PI * 2;
			updateWallFrameTime(now); updateRoomLighting(now);
			const h24 = now.getHours() + now.getMinutes() / 60;
			if (h24 >= 23 && charState === 'sitting') startGoingToBed();
			if (h24 >= 7 && h24 < 23 && charState === 'sleeping') startWakingUp();
		}

		/* ═══════════════════════════════════════════════════════════
		   RAYCASTING + INTERACTIONS
		═══════════════════════════════════════════════════════════ */
		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();
		let lastTouchEndTime = 0;

		function updatePointer(e: MouseEvent | Touch) { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = -(e.clientY / window.innerHeight) * 2 + 1; }

		function animateCamera(toPos: THREE.Vector3, toTarget: THREE.Vector3, onComplete?: () => void) {
			isAnimating = true; controls.enabled = false;
			const fromPos = camera.position.clone(), fromTarget = controls.target.clone();
			const proxy = { t: 0 };
			gsap.to(proxy, { t: 1, duration: 1.45, ease: 'power2.inOut',
				onUpdate() { camera.position.lerpVectors(fromPos, toPos, proxy.t); controls.target.lerpVectors(fromTarget, toTarget, proxy.t); camera.lookAt(controls.target); },
				onComplete() { isAnimating = false; onComplete?.(); }
			});
		}

		function getActiveMesh(obj: any) { return obj.getMesh ? obj.getMesh() : obj.mesh; }

		function focusObject(obj: any) {
			clearHover();
			if (focusedObject && focusedObject !== obj) clearEmissive(getActiveMesh(focusedObject));
			focusedObject = obj; setEmissive(getActiveMesh(obj), 0xaa88ff, 0.55);
			setFocus(obj.key);
			const camPos = obj.getCamPos ? obj.getCamPos() : obj.camPos;
			const camTarget = obj.getCamTarget ? obj.getCamTarget() : obj.camTarget;
			animateCamera(camPos, camTarget);
			setTimeout(() => openPanel(obj.key), 320);
			vignetteActive = true;
		}
		focusObjectFn = focusObject;

		function doResetCamera() {
			if (focusedObject) { clearEmissive(getActiveMesh(focusedObject)); focusedObject = null; }
			setFocus(null); closePanel();
			animateCamera(DEFAULT_CAM_POS, DEFAULT_CAM_TARGET, () => { controls.enabled = true; });
			vignetteActive = false;
		}

		function clearHover() {
			if (!hoveredObject) return;
			const mesh = getActiveMesh(hoveredObject);
			clearEmissive(mesh);
			gsap.killTweensOf(mesh.position);
			if (mesh.userData.bobOrigY !== undefined) gsap.to(mesh.position, { y: mesh.userData.bobOrigY, duration: 0.25, ease: 'power2.out' });
			hoveredObject = null;
		}
		function startHover(obj: any) {
			hoveredObject = obj;
			const mesh = getActiveMesh(obj);
			setEmissive(mesh, 0x9977ff, 0.4);
			if (mesh.userData.bobOrigY === undefined) mesh.userData.bobOrigY = mesh.position.y;
			gsap.to(mesh.position, { y: mesh.userData.bobOrigY + 0.055, duration: 0.55, yoyo: true, repeat: -1, ease: 'sine.inOut' });
		}

		canvasEl.addEventListener('mousemove', (e: MouseEvent) => {
			if (isAnimating || focusedObject) return;
			updatePointer(e); raycaster.setFromCamera(pointer, camera);
			const lampHover = raycaster.intersectObjects(lampMeshes, false);
			if (lampHover.length > 0) { clearHover(); canvasEl.style.cursor = 'pointer'; return; }
			const hits = raycaster.intersectObjects(allInteractiveMeshes, false);
			const obj = hits.length > 0 ? resolveHit(hits[0].object) : null;
			if (obj) {
				if (obj !== hoveredObject) { clearHover(); startHover(obj); }
				canvasEl.style.cursor = 'pointer';
			} else { clearHover(); canvasEl.style.cursor = 'default'; }
		});

		window.addEventListener('click', (e: MouseEvent) => {
			if (isAnimating) return;
			if (Date.now() - lastTouchEndTime < 350) return;
			updatePointer(e); raycaster.setFromCamera(pointer, camera);
			const lampHits = raycaster.intersectObjects(lampMeshes, false);
			if (lampHits.length > 0) { import('$lib/stores/scene.svelte.js').then(({ toggleLamp }) => toggleLamp()); return; }
			// Physics wobble on decorative meshes
			const wobbleHits = raycaster.intersectObjects(wobbleMeshes, false);
			if (wobbleHits.length > 0) {
				const wm = wobbleHits[0].object as THREE.Mesh;
				gsap.killTweensOf(wm.rotation);
				gsap.to(wm.rotation, { z: wm.userData.wobbleDir ? 0.22 : -0.22, duration: 0.12, ease: 'power3.out',
					onComplete() { gsap.to(wm.rotation, { z: 0, duration: 1.2, ease: 'elastic.out(1, 0.28)' }); }
				});
				wm.userData.wobbleDir = !wm.userData.wobbleDir;
			}
			const hits = raycaster.intersectObjects(allInteractiveMeshes, false);
			if (hits.length > 0) { const obj = resolveHit(hits[0].object); if (obj) { focusObject(obj); return; } }
			if (focusedObject) doResetCamera();
		});

		/* ── Webcam easter egg ────────────────────────────────────── */
		async function toggleWebcam() {
			if (!webcamVideo) {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 512, height: 300 } });
					const vid = document.createElement('video');
					vid.srcObject = stream; vid.autoplay = true; vid.playsInline = true; vid.muted = true;
					await vid.play();
					webcamVideo = vid;
					const wc = document.createElement('canvas'); wc.width = 512; wc.height = 300;
					webcamCtx = wc.getContext('2d')!;
					webcamTex = new THREE.CanvasTexture(wc);
					if (dispMatRef) { dispMatRef.emissiveMap = webcamTex; dispMatRef.needsUpdate = true; }
					webcamOn = true;
				} catch { webcamOn = false; }
			} else {
				(webcamVideo.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
				webcamVideo = null; webcamCtx = null;
				if (webcamTex) { webcamTex.dispose(); webcamTex = null; }
				if (dispMatRef) { dispMatRef.emissiveMap = laptopCanvasTex; dispMatRef.needsUpdate = true; }
				webcamOn = false;
			}
		}

		/* ── Ambient music (Web Audio drone) ─────────────────────── */
		function toggleMusic() {
			if (!audioCtx) {
				audioCtx = new AudioContext();
				masterGain = audioCtx.createGain(); masterGain.gain.value = 0;
				masterGain.connect(audioCtx.destination);
				// A minor ambient drone: A2, E3, A1 sub, C3, G3
				const voices = [{ f: 110, g: 0.36, t: 'sine' }, { f: 164.8, g: 0.26, t: 'sine' }, { f: 55, g: 0.12, t: 'triangle' }, { f: 130.8, g: 0.10, t: 'sine' }, { f: 196, g: 0.08, t: 'sine' }] as const;
				voices.forEach(({ f, g, t }) => {
					const osc = audioCtx!.createOscillator(); const gn = audioCtx!.createGain();
					osc.type = t; osc.frequency.value = f; osc.detune.value = (Math.random() - 0.5) * 6;
					gn.gain.value = g; osc.connect(gn); gn.connect(masterGain!); osc.start();
				});
				const lfo = audioCtx.createOscillator(); const lfoG = audioCtx.createGain();
				lfo.frequency.value = 0.11; lfoG.gain.value = 0.007;
				lfo.connect(lfoG); lfoG.connect(masterGain.gain); lfo.start();
			}
			musicOn = !musicOn;
			masterGain!.gain.setTargetAtTime(musicOn ? 0.05 : 0, audioCtx!.currentTime, 1.8);
		}

		toggleMusicFn = toggleMusic;
		toggleWebcamFn = toggleWebcam;

		// Konami code tracker
		const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
		let konamiIdx = 0;
		function triggerKonami() {
			konamiActive = true; konamiToast = true;
			ambientRef.color.set(0xff00cc); ambientRef.intensity = 3.5;
			scene.background = new THREE.Color(0x0d001a);
			laptopScreenMats.forEach(m => { m.emissive.set(0xff00ff); });
			setTimeout(() => {
				konamiActive = false; konamiToast = false;
				ambientRef.color.set(0xc8d0ff); ambientRef.intensity = 1.4;
				scene.background = new THREE.Color(0x131325);
				laptopScreenMats.forEach((m, i) => { m.emissive.set(i === 0 ? 0xffffff : [0x7c6af7,0x5af778,0xf7d96a,0xf7916a,0x55ccff,0x7c6af7,0x5af778][i - 1] ?? 0xffffff); });
			}, 6000);
		}

		window.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Escape' && focusedObject) doResetCamera();
			// Keyboard shortcuts 1-4
			if (['1','2','3','4'].includes(e.key) && !isAnimating) {
				const objKey = ['laptop','bookshelf','frame','character'][parseInt(e.key) - 1];
				const target = interactiveObjects.find((o: any) => o.key === objKey);
				if (target) { if (focusedObject) doResetCamera(); else focusObject(target); }
			}
			// [m] toggle ambient music
			if (e.key === 'm' || e.key === 'M') toggleMusic();
			// [w] webcam mirror on laptop screen
			if (e.key === 'w' || e.key === 'W') toggleWebcam();
			// Konami code
			if (e.key === KONAMI[konamiIdx]) {
				konamiIdx++;
				if (konamiIdx === KONAMI.length) { triggerKonami(); konamiIdx = 0; }
			} else { konamiIdx = e.key === KONAMI[0] ? 1 : 0; }
		});

		window.addEventListener('touchstart', (e: TouchEvent) => {
			if (e.touches.length !== 1) return;
			const t = e.touches[0];
			pointer.x = (t.clientX / window.innerWidth) * 2 - 1; pointer.y = -(t.clientY / window.innerHeight) * 2 + 1;
		}, { passive: true });

		window.addEventListener('touchend', (e: TouchEvent) => {
			lastTouchEndTime = Date.now();
			const t = e.changedTouches[0];
			updatePointer(t); raycaster.setFromCamera(pointer, camera);
			const lampHits = raycaster.intersectObjects(lampMeshes, false);
			if (lampHits.length > 0) { import('$lib/stores/scene.svelte.js').then(({ toggleLamp }) => toggleLamp()); return; }
			const hits = raycaster.intersectObjects(allInteractiveMeshes, false);
			const obj = hits.length > 0 ? resolveHit(hits[0].object) : null;
			if (obj) { focusObject(obj); } else if (focusedObject) { doResetCamera(); }
		}, { passive: true });

		window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); if (ssaoPassRef) ssaoPassRef.setSize(window.innerWidth, window.innerHeight); });

		/* ═══════════════════════════════════════════════════════════
		   RENDER LOOP
		═══════════════════════════════════════════════════════════ */
		const _vProj = new THREE.Vector3();
		function updateLabels(hideDueToFocus: boolean) {
			labelDefs.forEach((def: any) => {
				const el = labelEls[def.key]; if (!el) return;
				if (hideDueToFocus) { el.style.opacity = '0'; return; }
				const srcMesh = def.getMesh ? def.getMesh() : def.mesh;
				const wp = new THREE.Vector3(); srcMesh.getWorldPosition(wp); wp.add(def.offset);
				_vProj.copy(wp).project(camera);
				if (_vProj.z > 1) { el.style.opacity = '0'; return; }
				const x = (_vProj.x * 0.5 + 0.5) * window.innerWidth;
				const y = (-_vProj.y * 0.5 + 0.5) * window.innerHeight;
				el.style.transform = `translate(-50%, -100%) translate(${x}px,${y}px)`; el.style.opacity = '1';
			});
		}

		// Initial lighting pass
		tickScene();

		setProgress(100, 'Ready!');

		// Cinematic intro — skip if prefers-reduced-motion
		if (reducedMotion) {
			camera.position.copy(DEFAULT_CAM_POS); camera.lookAt(DEFAULT_CAM_TARGET); controls.enabled = true;
			const q = new URLSearchParams(window.location.search).get('focus') as any;
			if (q) { const target = interactiveObjects.find((o: any) => o.key === q); if (target) setTimeout(() => focusObject(target), 400); }
		} else {
		camera.position.set(0, 1.6, -2.5);
		camera.lookAt(DEFAULT_CAM_TARGET);
		gsap.to(camera.position, { x: DEFAULT_CAM_POS.x, y: DEFAULT_CAM_POS.y, z: DEFAULT_CAM_POS.z, duration: 3.2, ease: 'expo.inOut',
			onUpdate() { camera.lookAt(DEFAULT_CAM_TARGET); },
			onComplete() {
				controls.enabled = true;
				// URL param auto-focus
				const q = new URLSearchParams(window.location.search).get('focus') as any;
				if (q) { const target = interactiveObjects.find((o: any) => o.key === q); if (target) setTimeout(() => focusObject(target), 400); }
				// Fetch real GitHub contribution data and redraw laptop canvas
				fetch('https://github-contributions-api.jogruber.de/v4/sxrxvxnn?y=last')
					.then(r => r.json())
					.then((d: any) => {
						if (!laptopCanvasCtx || !laptopCanvasTex || !d.contributions) return;
						const lc = laptopCanvasCtx;
						const _lv = ['#161b22','#0e4429','#006d32','#26a641','#39d353'];
						const contribs: any[] = d.contributions.slice(-280);
						lc.fillStyle = '#0d1117'; lc.fillRect(16, 54, 380, 108);
						contribs.forEach((c: any, i: number) => {
							const col = Math.floor(i / 7), row = i % 7;
							const lv = c.count === 0 ? 0 : c.count < 3 ? 1 : c.count < 6 ? 2 : c.count < 10 ? 3 : 4;
							lc.fillStyle = _lv[lv]; lc.fillRect(16 + col * 9, 58 + row * 9, 7, 7);
						});
						const yr = Object.keys(d.total ?? {})[0];
						const total = yr ? d.total[yr] : '—';
						lc.fillStyle = '#0d1117'; lc.fillRect(16, 149, 380, 16);
						lc.fillStyle = '#39d353'; lc.font = 'bold 11px monospace';
						lc.fillText(`${total} contributions in the last year`, 16, 161);
						laptopCanvasTex.needsUpdate = true;
					}).catch(() => {});
			}
		});
		} // end !reducedMotion

		let lastTime = 0;
		let _frame = 0;
		function animate(time: number) {
			raf = requestAnimationFrame(animate);
			const dt = Math.min((time - lastTime) * 0.001, 0.05); lastTime = time;
			_frame++;
			tickScene();
			deskGlowRef.intensity = deskGlowBase + Math.sin(time * 0.0028) * 0.06;
			if (lampOn) lampLightRef.intensity = lampLightBase + Math.sin(time * 0.0031 + 1.2) * 0.08;
			// Screen glow pulse
			if (screenGlowRef) screenGlowRef.intensity = 2.2 + Math.sin(time * 0.0024) * 0.35;
			// Neon sign flicker
			if (neonLightRef) neonLightRef.intensity = 2.2 + Math.sin(time * 0.007) * 0.4 + (Math.random() < 0.003 ? -1.2 : 0);
			// Steam particles rise + fade
			steamParticles.forEach(sp => {
				sp.position.y += dt * 0.038;
				sp.position.x = sp.userData.baseX + Math.sin(time * 0.0018 + sp.userData.phase) * 0.012;
				const life = Math.min(1, (sp.position.y - sp.userData.startY) / 0.2);
				(sp.material as THREE.MeshStandardMaterial).opacity = 0.3 * (1 - life);
				if (life >= 1) { sp.position.y = sp.userData.startY; (sp.material as THREE.MeshStandardMaterial).opacity = 0.3; }
			});
			// Rain animation on window panes (every 2nd frame)
			if (rainCanvasCtx && rainCanvasTex && _frame % 2 === 0) {
				const rc = rainCanvasCtx;
				rc.fillStyle = 'rgba(5, 8, 30, 0.28)'; rc.fillRect(0, 0, 256, 512);
				rainDrops.forEach(d => {
					d.y += d.speed;
					if (d.y > 512 + d.len) { d.y = -d.len; d.x = Math.random() * 256; }
					rc.strokeStyle = `rgba(120, 170, 255, ${d.alpha})`; rc.lineWidth = 1;
					rc.beginPath(); rc.moveTo(d.x, d.y); rc.lineTo(d.x - 0.8, d.y - d.len); rc.stroke();
				});
				rainCanvasTex.needsUpdate = true;
			}
			// Laptop canvas cursor blink (every ~30 frames at 60fps ≈ 500ms)
			if (laptopCanvasCtx && laptopCanvasTex && _frame % 3 === 0 && !webcamVideo) {
				const lc = laptopCanvasCtx;
				lc.fillStyle = '#0d1117'; lc.fillRect(16, 248, 50, 16);
				const cursorOn = Math.floor(time / 500) % 2 === 0;
				if (cursorOn) { lc.fillStyle = '#7c6af7'; lc.fillRect(16, 249, 7, 13); }
				laptopCanvasTex.needsUpdate = true;
			}
			// Webcam mirror — draw video frame to laptop screen every frame
			if (webcamCtx && webcamTex && webcamVideo && webcamVideo.readyState >= 2) {
				webcamCtx.save(); webcamCtx.scale(-1, 1); webcamCtx.drawImage(webcamVideo, -512, 0, 512, 300); webcamCtx.restore();
				webcamTex.needsUpdate = true;
			}

			// Particle drift
			const posAttr = particleGeoRef.attributes.position;
			for (let i = 0; i < PARTICLE_COUNT; i++) {
				posAttr.setY(i, posAttr.getY(i) + dt * 0.05);
				if (posAttr.getY(i) > 6.2) posAttr.setY(i, 0.4);
				posAttr.setX(i, posAttr.getX(i) + Math.sin(time * 0.0004 + i) * dt * 0.012);
			}
			posAttr.needsUpdate = true;

			// Character sway at desk
			if (charState === 'sitting') { characterGroupRef.rotation.y = DESK_ROT_Y + Math.sin(time * 0.0009) * 0.035; }

			updateLabels(!!focusedObject);
			controls.update();
			composer.render();
		}
		animate(0);

		return () => { cancelAnimationFrame(raf); renderer.dispose(); };
	});
</script>

<canvas bind:this={canvasEl} aria-label="Interactive 3D portfolio room — use mouse to orbit, click objects to explore"></canvas>
<div bind:this={labelsEl} class="labels-container" aria-hidden="true"></div>
<div class="vignette" class:active={vignetteActive} aria-hidden="true"></div>
{#if konamiToast}
	<div class="konami-toast" aria-live="polite">⬆⬆⬇⬇◀▶◀▶BA — CHEAT UNLOCKED 🎮</div>
{/if}
<button class="screenshot-btn" onclick={() => { renderer.domElement.toBlob(b => { if(!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'shravan-portfolio.png'; a.click(); }); }} aria-label="Download screenshot" title="Download screenshot">⬇ PNG</button>
<button class="music-btn" class:active={musicOn} onclick={() => toggleMusicFn?.()} aria-label="Toggle ambient music" title="[M] Toggle ambient music">
	{musicOn ? '♪' : '♩'}
</button>
<button class="webcam-btn" class:active={webcamOn} onclick={() => toggleWebcamFn?.()} aria-label="Toggle webcam mirror" title="[W] Webcam mirror on laptop">
	{webcamOn ? '⊙' : '○'}
</button>
<div class="key-hints" aria-hidden="true">
	<span>[1] Laptop</span><span>[2] Shelf</span><span>[3] Frame</span><span>[4] Char</span>
	<span>[M] Music</span><span>[W] Webcam</span>
</div>

<style>
	canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		z-index: 0;
	}
	.labels-container {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}
	:global(.scene-label) {
		position: absolute;
		top: 0; left: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px;
		background: rgba(0 0 0 / 0.55);
		backdrop-filter: blur(6px);
		border-radius: 20px;
		color: #fff;
		font-size: 13px;
		font-weight: 500;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.25s ease;
		white-space: nowrap;
	}
	:global(.label-emoji) { font-size: 15px; }

	.vignette {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 2;
		background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.72) 100%);
		opacity: 0;
		transition: opacity 0.8s ease;
	}
	.vignette.active { opacity: 1; }

	.konami-toast {
		position: fixed;
		top: 24px;
		left: 50%;
		transform: translateX(-50%);
		padding: 10px 22px;
		background: linear-gradient(135deg, rgba(255,0,204,0.85), rgba(120,0,255,0.85));
		backdrop-filter: blur(10px);
		border-radius: 24px;
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.04em;
		z-index: 50;
		animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
		pointer-events: none;
	}
	@keyframes toastIn {
		from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.92); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
	}

	.key-hints {
		position: fixed;
		bottom: 68px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		pointer-events: none;
		z-index: 10;
		opacity: 0.28;
	}
	.key-hints span {
		font-size: 11px;
		font-family: monospace;
		color: #c8d8ff;
		text-align: right;
	}
	@media (max-width: 600px) { .key-hints { display: none; } }

	.screenshot-btn {
		position: fixed;
		top: 16px;
		right: 16px;
		padding: 6px 12px;
		background: rgba(0,0,0,0.5);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255,255,255,0.15);
		border-radius: 8px;
		color: rgba(255,255,255,0.6);
		font-size: 11px;
		font-family: monospace;
		cursor: none;
		z-index: 15;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}
	.screenshot-btn:hover {
		color: #fff;
		border-color: rgba(124,106,247,0.5);
		background: rgba(124,106,247,0.15);
	}

	.music-btn, .webcam-btn {
		position: fixed;
		top: 16px;
		padding: 6px 11px;
		background: rgba(0,0,0,0.5);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255,255,255,0.15);
		border-radius: 8px;
		color: rgba(255,255,255,0.55);
		font-size: 15px;
		cursor: none;
		z-index: 15;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
	}
	.music-btn { right: 80px; }
	.webcam-btn { right: 128px; }
	.music-btn.active, .webcam-btn.active {
		color: #7c6af7;
		border-color: rgba(124,106,247,0.6);
		background: rgba(124,106,247,0.18);
	}
	.music-btn:hover, .webcam-btn:hover {
		color: #fff;
		border-color: rgba(124,106,247,0.5);
		background: rgba(124,106,247,0.15);
	}
	@media (max-width: 600px) { .music-btn, .webcam-btn { display: none; } }
</style>
