<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const W = window.innerWidth, H = window.innerHeight;

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.setSize(W, H);

		const camera = new THREE.PerspectiveCamera(65, W / H, 1, 2000);
		camera.position.z = 420;

		const scene = new THREE.Scene();

		const N = 140;
		const posData = new Float32Array(N * 3);
		const orig: [number, number, number][] = [];
		const vel: [number, number, number][] = [];
		const SPREAD_X = W * 0.52, SPREAD_Y = H * 0.52, SPREAD_Z = 180;

		for (let i = 0; i < N; i++) {
			const x = (Math.random() - 0.5) * SPREAD_X * 2;
			const y = (Math.random() - 0.5) * SPREAD_Y * 2;
			const z = (Math.random() - 0.5) * SPREAD_Z * 2;
			posData[i*3] = x; posData[i*3+1] = y; posData[i*3+2] = z;
			orig.push([x, y, z]);
			vel.push([0, 0, 0]);
		}

		const geo = new THREE.BufferGeometry();
		const posAttr = new THREE.BufferAttribute(posData, 3);
		posAttr.setUsage(THREE.DynamicDrawUsage);
		geo.setAttribute('position', posAttr);

		const ptMat = new THREE.PointsMaterial({
			color: 0x00e5ff,
			size: 3.2,
			transparent: true,
			opacity: 0.5,
			sizeAttenuation: true
		});
		scene.add(new THREE.Points(geo, ptMat));

		const lineMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.1 });
		let linesMesh: THREE.LineSegments | null = null;

		const mouse = { nx: 0, ny: 0 };
		const camTilt = { x: 0, y: 0 };

		const onMove = (e: MouseEvent) => {
			mouse.nx = (e.clientX / W) * 2 - 1;
			mouse.ny = -((e.clientY / H) * 2 - 1);
		};
		window.addEventListener('mousemove', onMove);

		const REPEL = 140, CONNECT = 200, SPRING = 0.028, DAMP = 0.84;

		const onScroll = () => {
			const fade = Math.max(0.12, 1 - window.scrollY / (window.innerHeight * 0.6));
			canvas.style.opacity = String(fade);
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		let raf: number;
		function tick() {
			raf = requestAnimationFrame(tick);
			const p = posAttr.array as Float32Array;

			const fovRad = (65 * Math.PI) / 180;
			const halfH = Math.tan(fovRad / 2) * 420;
			const mx = mouse.nx * halfH * (W / H);
			const my = mouse.ny * halfH;

			for (let i = 0; i < N; i++) {
				const i3 = i * 3;
				const px = p[i3], py = p[i3+1], pz = p[i3+2];
				const dx = px - mx, dy = py - my;
				const d2d = Math.sqrt(dx*dx + dy*dy);

				if (d2d < REPEL && d2d > 0.01) {
					const f = (REPEL - d2d) / REPEL * 0.6;
					vel[i][0] += (dx / d2d) * f * 5;
					vel[i][1] += (dy / d2d) * f * 5;
				}

				vel[i][0] += (orig[i][0] - px) * SPRING;
				vel[i][1] += (orig[i][1] - py) * SPRING;
				vel[i][2] += (orig[i][2] - pz) * SPRING * 0.4;
				vel[i][0] *= DAMP; vel[i][1] *= DAMP; vel[i][2] *= DAMP;

				p[i3]   += vel[i][0];
				p[i3+1] += vel[i][1];
				p[i3+2] += vel[i][2];
			}
			posAttr.needsUpdate = true;

			camTilt.x += (mouse.ny * 8 - camTilt.x) * 0.04;
			camTilt.y += (mouse.nx * 12 - camTilt.y) * 0.04;
			camera.rotation.x = THREE.MathUtils.degToRad(camTilt.x);
			camera.rotation.y = THREE.MathUtils.degToRad(camTilt.y);

			const lp: number[] = [];
			for (let i = 0; i < N; i++) {
				for (let j = i + 1; j < N; j++) {
					const dx = p[i*3]-p[j*3], dy = p[i*3+1]-p[j*3+1], dz = p[i*3+2]-p[j*3+2];
					if (dx*dx + dy*dy + dz*dz < CONNECT*CONNECT) {
						lp.push(p[i*3], p[i*3+1], p[i*3+2], p[j*3], p[j*3+1], p[j*3+2]);
					}
				}
			}
			if (linesMesh) { scene.remove(linesMesh); linesMesh.geometry.dispose(); }
			if (lp.length) {
				const lg = new THREE.BufferGeometry();
				lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
				linesMesh = new THREE.LineSegments(lg, lineMat);
				scene.add(linesMesh);
			}

			renderer.render(scene, camera);
		}
		tick();

		const onResize = () => {
			const W2 = window.innerWidth, H2 = window.innerHeight;
			renderer.setSize(W2, H2);
			camera.aspect = W2 / H2;
			camera.updateProjectionMatrix();
		};
		window.addEventListener('resize', onResize);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			renderer.dispose();
		};
	});
</script>

<canvas bind:this={canvas} class="particle-canvas" aria-hidden="true"></canvas>

<style>
	.particle-canvas {
		position: fixed;
		top: 0; left: 0;
		width: 100vw; height: 100vh;
		pointer-events: none;
		z-index: 0;
		transition: opacity 0.3s ease;
	}
</style>
