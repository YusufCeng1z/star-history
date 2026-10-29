<script lang="ts">
	import type { StarPoint } from "$lib/types";
	let { meta, history, coverage = 1, theme = 'mono', chartStyle = 'default' } = $props<{ 
		coverage?: number;
		meta: any; 
		history: any[]; 
		theme?: string;
		chartStyle?: string;
	}>();

	// Theme logic
	const THEMES = {
		cyan: { primary: '#00e5ff', glow: 'rgba(0, 229, 255, 0.4)' },
		emerald: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
		violet: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
		amber: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
		rose: { primary: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
		fuchsia: { primary: '#d946ef', glow: 'rgba(217, 70, 239, 0.4)' },
		blue: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
		lime: { primary: '#84cc16', glow: 'rgba(132, 204, 22, 0.4)' },
		mono: { primary: '#ededed', glow: 'rgba(237, 237, 237, 0.3)' }
	};
	
	let activeTheme = $derived(THEMES[theme as keyof typeof THEMES] || THEMES.mono);
	
	let styleConfig = $derived((() => {
		switch(chartStyle) {
			case 'light': return { bg: '#ffffff', fg: '#0d0f14', muted: '#6b7280', grid: 'rgba(13,15,20,0.07)', showGrid: true, showFill: true, glowScale: 0 };
			case 'dark': return { bg: '#0d0d0d', fg: '#ededed', muted: '#8a8a8a', grid: 'rgba(255,255,255,0.06)', showGrid: true, showFill: true, glowScale: 0 };
			case 'minimal': return { bg: '#0d0d0d', fg: '#ededed', muted: '#8a8a8a', grid: 'transparent', showGrid: false, showFill: false, glowScale: 0 };
			case 'glass': return { bg: 'transparent', fg: '#ededed', muted: '#8a8a8a', grid: 'rgba(255,255,255,0.06)', showGrid: true, showFill: true, glowScale: 0 };
			case 'space': return { bg: '#04050c', fg: '#e8f0ff', muted: '#6f7d99', grid: 'rgba(160,190,255,0.06)', showGrid: true, showFill: true, glowScale: 0, primary: '#9ad1ff' };
			case 'synthwave': return { bg: '#12042b', fg: '#ffe9fb', muted: '#a58bd6', grid: 'rgba(255,60,172,0.12)', showGrid: true, showFill: true, glowScale: 1, primary: '#ff3cac' };
			case 'ascii': return { bg: '#0a0a0a', fg: '#ededed', muted: '#7a7a7a', grid: 'transparent', showGrid: false, showFill: false, glowScale: 0 };
			case 'matrix': return { bg: '#000000', fg: '#00ff41', muted: '#0e8a30', grid: 'transparent', showGrid: false, showFill: false, glowScale: 0, primary: '#00ff41' };
			default: return { bg: '#0d0d0d', fg: '#ededed', muted: '#8a8a8a', grid: 'rgba(255,255,255,0.06)', showGrid: true, showFill: true, glowScale: 0 };
		}
	})());

	let themeVars = $derived(`--primary: ${(styleConfig as { primary?: string }).primary ?? activeTheme.primary}; --primary-glow: ${activeTheme.glow}; --bg: ${styleConfig.bg}; --fg: ${styleConfig.fg}; --muted: ${styleConfig.muted}; --grid: ${styleConfig.grid}; --glow-1: ${8 * styleConfig.glowScale}px; --glow-2: ${20 * styleConfig.glowScale}px;`);

	let currentStars = $derived(history[history.length - 1]?.count || meta.stargazers_count);

	// Graph coordinates calculation
	let width = 900;
	let height = 450;
	let padding = { top: 80, right: 30, bottom: 40, left: 60 };

	let innerWidth = width - padding.left - padding.right;
	let innerHeight = height - padding.top - padding.bottom;

	// X values
	let minTime = $derived(new Date(history[0].date).getTime());
	let maxTime = $derived(new Date(history[history.length - 1].date).getTime());
	
	let xScale = $derived((time: number) => {
		return padding.left + ((time - minTime) / (maxTime - minTime)) * innerWidth;
	});

	// Y values
	let maxStars = $derived(currentStars);

	// round axis: 1/2/5 x 10^n steps, ceiling above the data so the line never touches the frame
	let yStep = $derived((() => {
		const raw = maxStars / 5 || 1;
		const mag = 10 ** Math.floor(Math.log10(raw));
		const n = raw / mag;
		return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
	})());
	let niceMax = $derived(Math.ceil(maxStars / yStep) * yStep);
	
	let yScale = $derived((stars: number) => {
		return height - padding.bottom - (stars / niceMax) * innerHeight;
	});

	// Smooth Curve Generator
	let points = $derived(history.map((h: StarPoint) => ({
		x: xScale(new Date(h.date).getTime()),
		y: yScale(h.count)
	})));

	let pathData = $derived((() => {
		if (points.length === 0) return '';
		if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
		
		let path = `M ${points[0].x} ${points[0].y}`;
		
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[i === 0 ? 0 : i - 1];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[i + 2 === points.length ? i + 1 : i + 2];
			
			const cp1x = p1.x + (p2.x - p0.x) * 0.15;
			const cp1y = p1.y + (p2.y - p0.y) * 0.15;
			
			const cp2x = p2.x - (p3.x - p1.x) * 0.15;
			const cp2y = p2.y - (p3.y - p1.y) * 0.15;
			
			// clamp control points to the segment box so the curve never overshoots or loops
			const lo = Math.min(p1.y, p2.y), hi = Math.max(p1.y, p2.y);
			const cl = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
			path += ` C ${cl(cp1x, p1.x, p2.x)} ${cl(cp1y, lo, hi)}, ${cl(cp2x, p1.x, p2.x)} ${cl(cp2y, lo, hi)}, ${p2.x} ${p2.y}`;
		}
		return path;
	})());

	// Estimate path length for SVG animation
	let pathLength = $derived((() => {
		let len = 0;
		for(let i = 1; i < points.length; i++) {
			let dx = points[i].x - points[i-1].x;
			let dy = points[i].y - points[i-1].y;
			len += Math.sqrt(dx*dx + dy*dy);
		}
		return len * 1.2; // roughly compensate for the curve
	})());

	let fillPathData = $derived((() => {
		if (points.length === 0) return '';
		return `${pathData} L ${points[points.length-1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
	})());

	function formatDate(isoStr: string) {
		return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}
	
	function formatCompact(num: number) {
		return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
	}

	function formatExact(num: number) {
		return new Intl.NumberFormat('en-US').format(num);
	}

	let yTicks = $derived(Array.from({ length: Math.round(niceMax / yStep) + 1 }, (_, i) => i * yStep));

	// x ticks on calendar boundaries: years for long histories, quarters or months for short ones
	let xTicks = $derived((() => {
		const span = maxTime - minTime;
		const day = 864e5;
		const start = new Date(minTime);
		const out: string[] = [];
		const monthStep = span > 3 * 365 * day ? 12 : span > 365 * day ? 3 : 1;
		const d = new Date(Date.UTC(start.getUTCFullYear(), monthStep === 12 ? 0 : Math.floor(start.getUTCMonth() / monthStep) * monthStep, 1));
		while (d.getTime() <= maxTime) {
			// skip ticks hugging either edge so labels never collide with the frame
			const f = (d.getTime() - minTime) / span;
			if (f > 0.025 && f < 0.97) out.push(d.toISOString());
			d.setUTCMonth(d.getUTCMonth() + monthStep);
		}
		return out;
	})());
	let tickLabel = $derived((iso: string) => {
		const d = new Date(iso);
		const span = maxTime - minTime;
		if (span > 3 * 365 * 864e5) return String(d.getUTCFullYear());
		return d.toLocaleDateString('en-US', { month: 'short', year: span > 365 * 864e5 ? 'numeric' : undefined, timeZone: 'UTC' });
	});

	let starText = $derived(formatExact(currentStars));
	// JetBrains Mono 26px -> ~15.6px width per character.
	let starIconX = $derived(width - padding.right - (starText.length * 15.6) - 35);


	// deterministic decoration (same chart -> same sky), no Math.random so SVG output is stable
	const rnd = (i: number, n: number) => { const x = Math.sin(meta.id * 12.9898 + i * 78.233 + n * 37.719) * 43758.5453; return x - Math.floor(x); };
	let stars = $derived(chartStyle === 'space' ? Array.from({ length: 70 }, (_, i) => ({ x: rnd(i, 1) * width, y: rnd(i, 2) * height, r: 0.4 + rnd(i, 3) * 1.1, d: 2 + rnd(i, 4) * 4, delay: -rnd(i, 5) * 6 })) : []);
	let endPoint = $derived(points[points.length - 1]);

	// ASCII renderer: each column is the cumulative star count at that moment, drawn with block glyphs.
	const COLS = 96;
	const ROWS = 18;
	const LINE_H = 15;
	const CHAR_W = 8;
	let isAscii = $derived(chartStyle === 'ascii' || chartStyle === 'matrix');

	let asciiRows = $derived((() => {
		if (!isAscii) return [];
		const times = history.map((h: StarPoint) => new Date(h.date).getTime());
		const at = (t: number) => {
			let i = times.findIndex((x: number) => x >= t);
			if (i <= 0) return history[0].count;
			const f = (t - times[i - 1]) / (times[i] - times[i - 1] || 1);
			return history[i - 1].count + f * (history[i].count - history[i - 1].count);
		};
		const eighths = Array.from({ length: COLS }, (_, c) =>
			Math.round((at(minTime + ((maxTime - minTime) * c) / (COLS - 1)) / maxStars) * ROWS * 8)
		);
		const part = ' ▁▂▃▄▅▆▇';
		return Array.from({ length: ROWS }, (_, r) => {
			const rowFromBottom = ROWS - 1 - r;
			return eighths.map((h) => {
				const full = Math.floor(h / 8), rem = h % 8;
				if (rowFromBottom === full) return part[rem];
				if (rowFromBottom < full) return rowFromBottom === full - 1 && rem === 0 ? '█' : '·';
				return ' ';
			}).join('');
		});
	})());

	let asciiLabel = $derived((r: number) => (r === 0 ? formatCompact(maxStars) : r === ROWS - 1 ? '0' : r === Math.floor(ROWS / 2) ? formatCompact(maxStars / 2) : '').padStart(5) + ' │');
	let asciiDates = $derived((() => {
		const a = formatDate(history[0].date), b = formatDate(history[history.length - 1].date);
		return ' '.repeat(7) + a + ' '.repeat(Math.max(1, COLS - a.length - b.length)) + b;
	})());
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" class="star-graph" data-style={chartStyle} style="--foreground: var(--fg); --muted-foreground: var(--muted); --background: var(--bg); --font-main: 'Inter', system-ui, -apple-system, sans-serif; --font-mono: 'JetBrains Mono', monospace; {themeVars}">
	<defs>
		<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.28" /></pattern>
		<linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3" />
			<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
		</linearGradient>
		<style>
			/* We embed the font directly in SVG so it works in READMEs */
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap');
			
			.star-graph {
				background-color: var(--background);
				border-radius: 12px;
				font-family: var(--font-main);
			}

			.graph-grid {
				stroke: var(--grid);
				stroke-dasharray: 4 4;
			}

			.graph-axis {
				stroke: var(--grid);
			}

			.graph-text {
				fill: var(--muted-foreground);
				font-size: 11px;
				font-family: var(--font-mono);
			}

			.svg-title {
				fill: var(--foreground);
				opacity: 0.85;
				font-size: 22px;
				font-weight: 600;
				font-family: var(--font-main);
			}
			
			.svg-star-count {
				fill: var(--foreground);
				font-size: 26px;
				font-weight: 700;
				font-family: var(--font-mono);
			}

			.star-count-group {
				transform-box: fill-box;
				transform-origin: center right;
				opacity: 0;
				animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
			}

			.graph-line {
				fill: none;
				stroke: var(--primary);
				stroke-width: 2.5;
				stroke-linecap: round;
				stroke-linejoin: round;
				filter: drop-shadow(0 0 var(--glow-1) var(--primary-glow)) drop-shadow(0 0 var(--glow-2) var(--primary-glow));
				/* Pure CSS line drawing, one pass */
				animation: drawLine 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
			}

			.graph-fill {
				fill: url(#gradientFill);
				opacity: 0;
				animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
			}

			.graph-point {
				fill: var(--background);
				stroke: var(--primary);
				stroke-width: 2;
				opacity: 0;
				animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards;
			}

			@keyframes drawLine {
				to { stroke-dashoffset: 0; }
			}

			@keyframes fadeIn {
				to { opacity: 1; }
			}

			.star-graph[data-style="space"] .graph-line { animation-duration: 2.4s; animation-timing-function: cubic-bezier(0.45, 0, 0.2, 1); }
			.twinkle { animation: twinkle 3s ease-in-out infinite; }
			@keyframes twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.95; } }
			.floor-scroll { animation: floor 1.4s linear infinite; }
			@keyframes floor { to { transform: translateY(14px); } }
			.rocket { offset-rotate: auto; offset-distance: 0%; opacity: 0; animation: fly 2.4s cubic-bezier(0.45, 0, 0.2, 1) 0.1s forwards; }
			@keyframes fly { 0% { offset-distance: 0%; opacity: 1; } 96% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
			.flame { animation: flame 0.18s steps(2) infinite; transform-box: fill-box; transform-origin: right center; }
			@keyframes flame { 50% { transform: scaleX(0.6); } }
			.ripple { fill: none; stroke: var(--primary); stroke-width: 1.5; opacity: 0; transform-box: fill-box; transform-origin: center; animation: ripple 2.2s cubic-bezier(0.16, 1, 0.3, 1) 2.6s infinite; }
			@keyframes ripple { 0% { opacity: 0.9; transform: scale(1); } 100% { opacity: 0; transform: scale(5); } }
			.ascii-text { font-family: var(--font-mono); font-size: 12px; white-space: pre; }
			.ascii-fg { fill: var(--foreground); }
			.ascii-muted { fill: var(--muted-foreground); }
			.ascii-accent { fill: var(--primary); }
			.reveal-rect { transform-box: fill-box; transform-origin: left; animation: reveal 1.1s steps(48) 0.1s both; }
			.cursor { animation: blink 1s steps(1) infinite; }
			@keyframes reveal { from { transform: scaleX(0); } to { transform: scaleX(1); } }
			@keyframes blink { 50% { opacity: 0; } }
			@media (prefers-reduced-motion: reduce) {
				.reveal-rect, .cursor, .twinkle, .floor-scroll, .flame, .ripple { animation: none; }
				.rocket { display: none; }
				.ripple { opacity: 0; }
				.graph-line { animation: none; stroke-dashoffset: 0 !important; }
				.graph-fill, .graph-point, .star-count-group { animation: none; opacity: 1; }
			}
		</style>
	</defs>

	{#if isAscii}
		<defs>
			<clipPath id="reveal"><rect x={34 + 7 * CHAR_W} y="60" width={COLS * CHAR_W} height={ROWS * LINE_H + 12} class="reveal-rect" /></clipPath>
		</defs>
		<text x="34" y="36" class="ascii-text ascii-muted" textLength={(chartStyle === 'matrix' ? 14 : 15) * CHAR_W} lengthAdjust="spacing">{chartStyle === 'matrix' ? '> wake up, neo..' : '$ star-history '}</text>
		<text x={34 + 16 * CHAR_W} y="36" class="ascii-text ascii-fg" textLength={meta.full_name.length * CHAR_W} lengthAdjust="spacing">{meta.full_name}</text>
		{#each asciiRows as row, r}
			<text x="34" y={78 + r * LINE_H} xml:space="preserve" class="ascii-text ascii-muted" textLength={7 * CHAR_W} lengthAdjust="spacing">{asciiLabel(r)}</text>
			<text x={34 + 7 * CHAR_W} y={78 + r * LINE_H} xml:space="preserve" class="ascii-text ascii-accent" clip-path="url(#reveal)" textLength={COLS * CHAR_W} lengthAdjust="spacing">{row}</text>
		{/each}
		<text x="34" y={78 + ROWS * LINE_H} xml:space="preserve" class="ascii-text ascii-muted" textLength={(COLS + 7) * CHAR_W} lengthAdjust="spacing">{'      └' + '─'.repeat(COLS)}</text>
		<text x="34" y={78 + (ROWS + 1) * LINE_H} xml:space="preserve" class="ascii-text ascii-muted" textLength={(COLS + 7) * CHAR_W} lengthAdjust="spacing">{asciiDates}</text>
		<text x="34" y={height - 22} class="ascii-text ascii-fg">{chartStyle === 'matrix' ? 'follow the white rabbit' : 'total'} ★ {starText}<tspan class="cursor"> █</tspan></text>
		<text x={width - 34} y={height - 22} text-anchor="end" class="ascii-text ascii-muted">starhistory.link</text>
		{#if chartStyle === 'matrix'}
			<rect width="100%" height="100%" fill="url(#scan)" pointer-events="none" />
		{/if}
	{:else}
	{#if chartStyle === 'space'}
		{#each stars as st}
			<circle cx={st.x} cy={st.y} r={st.r} fill="#fff" class="twinkle" style="animation-duration: {st.d}s; animation-delay: {st.delay}s" />
		{/each}
	{:else if chartStyle === 'synthwave'}
		<defs>
			<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12042b" /><stop offset="0.6" stop-color="#2b0a52" /><stop offset="1" stop-color="#5a1473" /></linearGradient>
			<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14d" /><stop offset="1" stop-color="#ff2e97" /></linearGradient>
			<clipPath id="above"><rect x="0" y="0" width={width} height="330" /></clipPath>
			<clipPath id="floor"><rect x="0" y="330" width={width} height="120" /></clipPath>
		</defs>
		<rect width="100%" height="100%" fill="url(#sky)" />
		<circle cx={width / 2} cy="330" r="110" fill="url(#sun)" opacity="0.3" clip-path="url(#above)" />
		<g clip-path="url(#floor)" stroke="#ff3cac" stroke-width="1" opacity="0.28">
			<g class="floor-scroll">
				{#each Array(10) as _, k}<line x1="0" x2={width} y1={326 + k * 14} y2={326 + k * 14} />{/each}
			</g>
			{#each Array(25) as _, k}<line x1={width / 2 + (k - 12) * 8} y1="330" x2={width / 2 + (k - 12) * 90} y2="450" />{/each}
		</g>
	{/if}
	<!-- SVG Header -->
	<text x={padding.left} y="40" class="svg-title" dominant-baseline="middle">{meta.full_name}</text>
	{#if coverage < 0.9}
		<text x={padding.left} y="62" class="graph-text" style="opacity: 0.8">{coverage >= 0.5 ? `Estimated: ${Math.round(coverage * 100)}% of stars have a recorded date, curve scaled to the live total.` : `Partial data: only ${Math.round(coverage * 100)}% of stars have a recorded date, the rest start as a baseline.`}</text>
	{/if}
	
	<g class="star-count-group">
		<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f59e0b" transform="translate({starIconX}, 28) scale(1.1)" />
		<text x={width - padding.right} y="42" class="svg-star-count" text-anchor="end" dominant-baseline="middle">{starText}</text>
	</g>

	{#if styleConfig.showGrid}
		<!-- Grid Lines Y -->
		{#each yTicks as tick}
			<line x1={padding.left} y1={yScale(tick)} x2={width - padding.right} y2={yScale(tick)} class="graph-grid" />
			{#if tick > 0}
				<text x={padding.left - 15} y={yScale(tick)} text-anchor="end" class="graph-text" dominant-baseline="middle">{formatCompact(tick)}</text>
			{/if}
		{/each}
		<text x={padding.left - 15} y={yScale(0)} text-anchor="end" class="graph-text" dominant-baseline="middle">{formatCompact(0)}</text>

		<!-- Grid Lines X -->
		{#each xTicks as tick}
			<line x1={xScale(new Date(tick).getTime())} y1={padding.top} x2={xScale(new Date(tick).getTime())} y2={height - padding.bottom} class="graph-grid" />
			<text x={xScale(new Date(tick).getTime())} y={height - padding.bottom + 20} text-anchor="middle" class="graph-text">{tickLabel(tick)}</text>
		{/each}

		<!-- Axes -->
		<line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} class="graph-axis" />
		<line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} class="graph-axis" />
	{/if}

	<!-- Data paths -->
	{#if styleConfig.showFill}
		<path d={fillPathData} class="graph-fill" />
	{/if}
	<path d={pathData} pathLength="1000" class="graph-line" style="stroke-dasharray: 1000; stroke-dashoffset: 1000;" />

	<!-- Data Points -->
	{#if points.length}
		<circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" class="graph-point" />
	{/if}

	{#if chartStyle === 'space'}
		<g class="rocket" style="offset-path: path('{pathData}')"><g transform="scale(1.7)">
			<path d="M9 0 L-5 -5 L-3 0 L-5 5 Z" fill="#e8f0ff" />
			<path d="M-3 0 L-12 -2.5 L-20 0 L-12 2.5 Z" fill="#ffb84d" class="flame" />
		</g></g>
	{/if}
	{#if chartStyle === 'space' || chartStyle === 'synthwave'}
		<circle cx={endPoint.x} cy={endPoint.y} r="4" class="ripple" />
	{/if}

	<!-- Watermark -->
	<text x={width - padding.right} y={height - padding.bottom - 10} text-anchor="end" class="graph-text" style="opacity: 0.5">starhistory.link</text>
	{/if}
</svg>
