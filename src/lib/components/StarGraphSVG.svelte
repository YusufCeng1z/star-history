<script lang="ts">
	let { meta, history, theme = 'cyan', chartStyle = 'default' } = $props<{ 
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
		lime: { primary: '#84cc16', glow: 'rgba(132, 204, 22, 0.4)' }
	};
	
	let activeTheme = $derived(THEMES[theme as keyof typeof THEMES] || THEMES.cyan);
	
	let styleConfig = $derived((() => {
		switch(chartStyle) {
			case 'light': return { bg: '#ffffff', fg: '#000000', muted: '#666666', grid: 'rgba(0,0,0,0.1)', showGrid: true, showFill: true, glowScale: 0.3 };
			case 'minimal': return { bg: '#000000', fg: '#ffffff', muted: '#888888', grid: 'transparent', showGrid: false, showFill: false, glowScale: 1 };
			case 'glass': return { bg: 'transparent', fg: '#ffffff', muted: '#888888', grid: 'rgba(255,255,255,0.05)', showGrid: true, showFill: true, glowScale: 1 };
			default: return { bg: '#000000', fg: '#ffffff', muted: '#888888', grid: 'rgba(255,255,255,0.05)', showGrid: true, showFill: true, glowScale: 1 };
		}
	})());

	let themeVars = $derived(`--primary: ${activeTheme.primary}; --primary-glow: ${activeTheme.glow}; --bg: ${styleConfig.bg}; --fg: ${styleConfig.fg}; --muted: ${styleConfig.muted}; --grid: ${styleConfig.grid}; --glow-1: ${8 * styleConfig.glowScale}px; --glow-2: ${20 * styleConfig.glowScale}px;`);

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
	
	let yScale = $derived((stars: number) => {
		return height - padding.bottom - (stars / maxStars) * innerHeight;
	});

	// Smooth Curve Generator
	let points = $derived(history.map(h => ({
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
			
			path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
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

	let yTicks = $derived([0, 0.25, 0.5, 0.75, 1].map(mult => maxStars * mult));
	let xTicks = $derived([0, 0.25, 0.5, 0.75, 1].map(mult => {
		const t = minTime + (maxTime - minTime) * mult;
		return new Date(t).toISOString();
	}));

	let starText = $derived(formatExact(currentStars));
	// JetBrains Mono 26px -> ~15.6px width per character.
	let starIconX = $derived(width - padding.right - (starText.length * 15.6) - 35);

</script>

<svg {width} {height} viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" class="star-graph" style="--foreground: var(--fg); --muted-foreground: var(--muted); --background: var(--bg); --font-main: 'Inter', system-ui, -apple-system, sans-serif; --font-mono: 'JetBrains Mono', monospace; {themeVars}">
	<defs>
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
				animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
				animation-delay: 1.2s; /* wait for line to finish */
			}

			.graph-line {
				fill: none;
				stroke: var(--primary);
				stroke-width: 2.5;
				stroke-linecap: round;
				stroke-linejoin: round;
				filter: drop-shadow(0 0 var(--glow-1) var(--primary-glow)) drop-shadow(0 0 var(--glow-2) var(--primary-glow));
				
				/* Pure CSS Line Drawing Animation */
				animation: drawLine 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
				animation-delay: 0.1s;
			}

			.graph-fill {
				fill: url(#gradientFill);
				opacity: 0;
				animation: fadeIn 1s ease-in forwards;
				animation-delay: 0.8s;
			}

			.graph-point {
				fill: var(--background);
				stroke: var(--primary);
				stroke-width: 2;
				opacity: 0;
				animation: fadeIn 0.3s ease forwards;
			}

			@keyframes drawLine {
				to { stroke-dashoffset: 0; }
			}

			@keyframes fadeIn {
				to { opacity: 1; }
			}

			@keyframes pop {
				0% { transform: scale(1); filter: drop-shadow(0 0 0px var(--primary-glow)); }
				50% { transform: scale(1.15); filter: drop-shadow(0 0 15px var(--primary-glow)); }
				100% { transform: scale(1); filter: drop-shadow(0 0 0px var(--primary-glow)); }
			}
		</style>
	</defs>

	<!-- SVG Header -->
	<text x={padding.left} y="40" class="svg-title" dominant-baseline="middle">{meta.full_name}</text>
	
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
			<text x={xScale(new Date(tick).getTime())} y={height - padding.bottom + 20} text-anchor="middle" class="graph-text">{formatDate(tick)}</text>
		{/each}

		<!-- Axes -->
		<line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} class="graph-axis" />
		<line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} class="graph-axis" />
	{/if}

	<!-- Data paths -->
	{#if styleConfig.showFill}
		<path d={fillPathData} class="graph-fill" />
	{/if}
	<path d={pathData} class="graph-line" style="stroke-dasharray: {pathLength}; stroke-dashoffset: {pathLength};" />

	<!-- Data Points -->
	{#each points as point, i}
		{#if i % Math.max(1, Math.floor(points.length / 10)) === 0 || i === points.length - 1}
			<circle 
				cx={point.x} 
				cy={point.y} 
				r="4" 
				class="graph-point" 
				style="animation-delay: {600 + i * 15}ms"
			/>
		{/if}
	{/each}

	<!-- Watermark -->
	<text x={width - padding.right} y={height - padding.bottom - 10} text-anchor="end" class="graph-text" style="opacity: 0.5">starhistory.link</text>
</svg>
