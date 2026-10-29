<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { SITE_URL } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
	import StarGraphSVG from '$lib/components/StarGraphSVG.svelte';
	
	let { data } = $props<{ data: PageData }>();
	
	let meta = $state(data.meta);
	let history = $state(data.history);
	let coverage = $state(data.coverage);
	let insights = $derived(data.insights);
	const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);
	let maxYear = $derived(Math.max(1, ...insights.yearly.map((y: { stars: number }) => y.stars)));

	$effect(() => {
		meta = data.meta;
		history = data.history;
		coverage = data.coverage;
	});

	let currentStars = $derived(history[history.length - 1]?.count || meta.stargazers_count);

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
	type Theme = keyof typeof THEMES;

	let activeTheme = $state<Theme>('mono');
	let activeStyle = $state('default');

	$effect(() => {
		const queryTheme = $page.url.searchParams.get('theme') as Theme;
		if (queryTheme && THEMES[queryTheme]) {
			activeTheme = queryTheme;
		}
		
		const queryStyle = $page.url.searchParams.get('style');
		if (queryStyle) {
			activeStyle = queryStyle;
		}
	});

	function selectTheme(t: Theme) {
		activeTheme = t;
		updateUrl();
	}

	function selectStyle(s: string) {
		moreOpen = false;
		activeStyle = s;
		updateUrl();
	}

	function updateUrl() {
		const newUrl = new URL($page.url);
		newUrl.searchParams.set('theme', activeTheme);
		if (activeStyle !== 'default') {
			newUrl.searchParams.set('style', activeStyle);
		} else {
			newUrl.searchParams.delete('style');
		}
		goto(newUrl, { replaceState: true, keepFocus: true });
	}

	let themeVars = $derived(`--primary: ${THEMES[activeTheme].primary}; --primary-glow: ${THEMES[activeTheme].glow};`);

	const MAIN_LOOKS = ['default', 'light', 'ascii', 'space'];
	const MORE_LOOKS = ['synthwave', 'matrix', 'minimal', 'glass'];
	let moreOpen = $state(false);
	// these bring their own palette, so the colour picker would do nothing
	let ownPalette = $derived(['matrix', 'space', 'synthwave'].includes(activeStyle));

	let svgUrl = $derived(`${SITE_URL}/${meta.full_name}.svg?theme=${activeTheme}${activeStyle !== 'default' ? '&style=' + activeStyle : ''}`);
	const FORMATS = ['Markdown', 'HTML', 'Image URL'] as const;
	let format = $state<(typeof FORMATS)[number]>('Markdown');
	let snippet = $derived(
		format === 'Markdown'
			? `[![Star History of ${meta.full_name}](${svgUrl})](${SITE_URL}/${meta.full_name})`
			: format === 'HTML'
				? `<a href="${SITE_URL}/${meta.full_name}"><img src="${svgUrl}" alt="Star History of ${meta.full_name}" width="600"></a>`
				: svgUrl
	);
	let copied = $state(false);

	async function copySnippet() {
		try {
			await navigator.clipboard.writeText(snippet);
		} catch {
			// clipboard blocked: select the text so Ctrl+C works
			(document.getElementById('snippet') as HTMLTextAreaElement)?.select();
			return;
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<Seo
	title="{meta.full_name} star history: {fmt(meta.stargazers_count)} stars | Star History"
	description="{meta.full_name} has {fmt(meta.stargazers_count)} GitHub stars{insights.peakWeek ? `, with a best week of +${fmt(insights.peakWeek.stars)}` : ''} and +{fmt(insights.last4Weeks)} in the last 4 weeks. See its exact star growth by year and embed the chart in your README."
	path="/{meta.full_name}"
	image="/og/{meta.full_name}.png"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: `${meta.full_name} star history`,
		about: { '@type': 'SoftwareSourceCode', name: meta.full_name, codeRepository: meta.html_url, description: meta.description ?? undefined }
	}}
/>

<div class="repo-page animate-fade-in" style={themeVars}>
	<header class="head">
		<h1><a href={meta.html_url} target="_blank" rel="noopener noreferrer" title="Open on GitHub">{meta.full_name} ↗</a></h1>
		{#if meta.description}<p class="desc">{meta.description}</p>{/if}
		<p class="facts">
			<b>{fmt(meta.stargazers_count)}</b> stars
			<span>+{fmt(insights.last4Weeks)} in the last 4 weeks</span>
			{#if insights.peakWeek}<span>best week +{fmt(insights.peakWeek.stars)}, {new Date(insights.peakWeek.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</span>{/if}
		</p>
	</header>

	<div class="graph-container" style="background: {activeStyle === 'glass' ? '#141414' : 'transparent'};">
		{#key activeTheme + activeStyle}
			<StarGraphSVG {meta} {history} {coverage} theme={activeTheme} chartStyle={activeStyle} />
		{/key}
	</div>

	<div class="controls">
		<div class="pills" role="group" aria-label="Look">
			{#each MAIN_LOOKS as s}
				<button class="pill" class:on={activeStyle === s} aria-pressed={activeStyle === s} onclick={() => selectStyle(s)}>{s}</button>
			{/each}
			<div class="more">
				<button class="pill" class:on={MORE_LOOKS.includes(activeStyle)} aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}>
					{MORE_LOOKS.includes(activeStyle) ? activeStyle : 'more'} ▾
				</button>
				{#if moreOpen}
					<div class="menu">
						{#each MORE_LOOKS as s}
							<button class="pill" class:on={activeStyle === s} onclick={() => selectStyle(s)}>{s}</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		{#if !ownPalette}
			<div class="dots" role="group" aria-label="Colour">
				{#each Object.keys(THEMES) as t}
					<button class="dot" class:on={activeTheme === t} style="background-color: {THEMES[t as Theme].primary};" onclick={() => selectTheme(t as Theme)} aria-pressed={activeTheme === t} aria-label={t} title={t}></button>
				{/each}
			</div>
		{/if}
	</div>

	<section class="embed" aria-labelledby="embed-title">
		<div class="embed-head">
			<h2 id="embed-title">Add to your README</h2>
			<div class="tabs" role="tablist">
				{#each FORMATS as f}
					<button role="tab" aria-selected={format === f} class:on={format === f} onclick={() => (format = f)}>{f}</button>
				{/each}
			</div>
		</div>
		<div class="snippet-row">
			<textarea id="snippet" readonly rows="2" class="snippet" aria-label="{format} snippet" onfocus={(e) => e.currentTarget.select()}>{snippet}</textarea>
			<button class="btn btn-primary" onclick={copySnippet}>{copied ? 'Copied' : 'Copy'}</button>
		</div>
		<p class="hint" aria-live="polite">{copied ? 'Copied to clipboard.' : 'Paste it into any README.md. GitHub keeps the chart current.'}</p>
	</section>

	<section class="years" aria-labelledby="years-title">
		<h2 id="years-title">Stars per year</h2>
		<div class="bars">
			{#each insights.yearly as y, i}
				<div class="bar-col">
					<span class="bar-val">{fmt(y.stars)}</span>
					<div class="bar" style="--p: {y.stars / maxYear}; animation-delay: {Math.min(i, 8) * 30}ms"></div>
					<span class="bar-year">{y.year}</span>
				</div>
			{/each}
		</div>
	</section>

	<p class="cta">Free and open source. <a href="https://github.com/yusufceng1z/star-history" target="_blank" rel="noopener noreferrer">Star it on GitHub</a> if it helped.</p>
</div>

<style>
	.repo-page { min-height: 100vh; padding: 5rem 1.25rem 3rem; max-width: 56rem; margin: 0 auto; }

	.head h1 { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.03em; }
	.head h1 a:hover { text-decoration: underline; text-underline-offset: 4px; }
	.desc { margin-top: 0.3rem; color: var(--fg-2); }
	.facts { margin-top: 0.6rem; display: flex; flex-wrap: wrap; gap: 0.2rem 1.1rem; font-size: 0.9rem; color: var(--fg-2); }
	.facts b { color: var(--fg); font-weight: 600; margin-right: -0.7rem; }

	.graph-container { margin-top: 1.5rem; border: 1px solid var(--line-2); border-radius: var(--radius); overflow: hidden; display: flex; justify-content: center; }
	:global(.graph-container svg) { width: 100%; height: auto; display: block; }

	.controls { margin-top: 1rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem 1.5rem; }
	.pills { display: flex; gap: 0.3rem; flex-wrap: wrap; align-items: center; }
	.pill { background: none; border: 1px solid var(--line-2); color: var(--fg-2); font: inherit; font-size: 0.85rem; text-transform: capitalize; padding: 0.3rem 0.85rem; border-radius: 999px; cursor: pointer; transition: background-color 150ms ease, color 150ms ease; }
	.pill:hover { color: var(--fg); background: var(--hover); }
	.pill.on { background: var(--fg); border-color: var(--fg); color: var(--page); }
	.more { position: relative; }
	.menu { position: absolute; top: calc(100% + 0.4rem); left: 0; z-index: 5; display: flex; flex-direction: column; gap: 0.25rem; padding: 0.4rem; background: var(--raised); border: 1px solid var(--line-2); border-radius: 14px; box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.9); }
	.menu .pill { border-color: transparent; text-align: left; }
	.dots { display: flex; gap: 0.5rem; }
	.dot { width: 1.1rem; height: 1.1rem; border-radius: 50%; border: 2px solid var(--page); cursor: pointer; transition: transform 120ms var(--ease-out); }
	.dot:hover { transform: scale(1.15); }
	.dot.on { box-shadow: 0 0 0 2px var(--fg); }

	section { margin-top: 2.5rem; }
	h2 { font-size: 0.95rem; font-weight: 600; }

	.embed-head { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
	.tabs { display: flex; gap: 0.25rem; }
	.tabs button { background: none; border: 0; color: var(--fg-2); font: inherit; font-size: 0.85rem; padding: 0.2rem 0.6rem; border-radius: 999px; cursor: pointer; }
	.tabs button.on { color: var(--fg); background: var(--hover); }
	.snippet-row { display: flex; gap: 0.6rem; margin-top: 0.7rem; }
	.snippet { flex: 1; min-width: 0; resize: none; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.45; color: var(--fg-2); background: var(--frame); border: 1px solid var(--line-2); border-radius: 12px; padding: 0.6rem 0.8rem; word-break: break-all; }
	.snippet:focus-visible { outline: 1px solid var(--fg-2); }
	.snippet-row .btn { border-radius: 12px; height: auto; min-width: 5rem; }
	.hint { margin-top: 0.5rem; font-size: 0.82rem; color: var(--fg-3); }

	.bars { display: flex; align-items: flex-end; gap: 0.5rem; height: 9rem; margin-top: 0.8rem; }
	.bar-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 0.3rem; }
	.bar-val { font-family: var(--font-mono); font-size: 0.7rem; color: var(--fg-2); }
	.bar { height: max(2px, calc(var(--p) * 6.5rem)); width: 100%; max-width: 3.5rem; background: var(--fg); border-radius: 6px 6px 2px 2px; opacity: 0.8; transform-origin: bottom; animation: grow 500ms var(--ease-out) both; }
	.bar-col:hover .bar { opacity: 1; }
	.bar-year { font-size: 0.72rem; color: var(--fg-3); }
	@keyframes grow { from { transform: scaleY(0); } }

	.cta { margin-top: 3rem; text-align: center; font-size: 0.85rem; color: var(--fg-3); }
	.cta a { color: var(--fg-2); text-decoration: underline; text-underline-offset: 3px; }
	.cta a:hover { color: var(--fg); }
</style>
