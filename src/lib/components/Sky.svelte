<script lang="ts">
	import type { StarPoint } from '$lib/types';

	let { series, label = '' } = $props<{ series: StarPoint[] | null; label?: string }>();

	let canvas: HTMLCanvasElement;
	let shown = $state(0);

	const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const ease = (t: number) => 1 - Math.pow(1 - t, 4);

	let cur: StarPoint[] | null = null;
	let startedAt = 0;

	let redraw: (() => void) | null = null;

	$effect(() => {
		cur = series;
		startedAt = performance.now();
		// reduced motion: no loop, so repaint once per new series
		if (reduce) redraw?.();
	});

	$effect(() => {
		const ctx = canvas.getContext('2d')!;
		let w = 0, h = 0, raf = 0;

		function resize() {
			const dpr = Math.min(devicePixelRatio || 1, 2);
			w = canvas.clientWidth; h = canvas.clientHeight;
			canvas.width = w * dpr; canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (reduce) frame(performance.now());
		}

		function frame(now: number) {
			ctx.clearRect(0, 0, w, h);

			if (cur && cur.length > 1) {
				const t0 = new Date(cur[0].date).getTime(), t1 = new Date(cur[cur.length - 1].date).getTime();
				const max = cur[cur.length - 1].count || 1;
				const x0 = w * 0.08, x1 = w * 0.92, yb = h * 0.84, yt = h * 0.58;
				const pts = cur.map((p) => ({
					x: x0 + ((new Date(p.date).getTime() - t0) / (t1 - t0 || 1)) * (x1 - x0),
					y: yb - (p.count / max) * (yb - yt)
				}));
				const p = reduce ? 1 : ease(Math.min(1, (now - startedAt) / 1900));
				const upto = p * (pts.length - 1), whole = Math.floor(upto), frac = upto - whole;
				const head = whole >= pts.length - 1 ? pts[pts.length - 1]
					: { x: pts[whole].x + (pts[whole + 1].x - pts[whole].x) * frac, y: pts[whole].y + (pts[whole + 1].y - pts[whole].y) * frac };

				ctx.beginPath();
				ctx.moveTo(pts[0].x, pts[0].y);
				for (let i = 1; i <= whole; i++) ctx.lineTo(pts[i].x, pts[i].y);
				ctx.lineTo(head.x, head.y);

				// soft area under the drawn part
				ctx.save();
				const g = ctx.createLinearGradient(0, yt, 0, yb);
				g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
				ctx.lineTo(head.x, yb); ctx.lineTo(pts[0].x, yb); ctx.closePath();
				ctx.fillStyle = g; ctx.fill();
				ctx.restore();

				ctx.beginPath();
				ctx.moveTo(pts[0].x, pts[0].y);
				for (let i = 1; i <= whole; i++) ctx.lineTo(pts[i].x, pts[i].y);
				ctx.lineTo(head.x, head.y);
				ctx.strokeStyle = 'rgba(237,237,237,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();

				// nodes read as stars on the line
				const k = Math.max(1, Math.ceil(pts.length / 16));
				ctx.fillStyle = '#fff';
				for (let i = 0; i <= whole; i += k) {
					ctx.globalAlpha = 0.85;
					ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 1.8, 0, 6.283); ctx.fill();
				}
				ctx.globalAlpha = 1;

				// head star with a four-point flare
				const pulse = reduce ? 1 : 0.8 + 0.2 * Math.sin(now / 260);
				const L = 12 * pulse;
				ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(head.x - L, head.y); ctx.lineTo(head.x + L, head.y);
				ctx.moveTo(head.x, head.y - L); ctx.lineTo(head.x, head.y + L);
				ctx.stroke();
				ctx.beginPath(); ctx.arc(head.x, head.y, 3, 0, 6.283); ctx.fillStyle = '#fff'; ctx.fill();

				const next = Math.round(max * p);
				if (next !== shown) shown = next;
			}
			if (!reduce) raf = requestAnimationFrame(frame);
		}

		resize();
		addEventListener('resize', resize);
		redraw = () => frame(performance.now());
		if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
		return () => {
			redraw = null; cancelAnimationFrame(raf); removeEventListener('resize', resize); };
	});

</script>

<canvas bind:this={canvas} class="sky" aria-hidden="true"></canvas>
{#if series}
	<div class="cap" aria-live="polite"><span>{label}</span><b>★ {shown.toLocaleString('en-US')}</b></div>
{/if}

<style>
	.sky { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
	.cap { position: absolute; left: 8%; bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: baseline; font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-3); }
	.cap b { font-weight: 500; color: var(--fg); font-size: 1rem; }
</style>
