<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StarGraphSVG from '$lib/components/StarGraphSVG.svelte';
	
	let { data } = $props<{ data: PageData }>();
	
	let meta = $state(data.meta);
	let history = $state(data.history);

	$effect(() => {
		meta = data.meta;
		history = data.history;
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
		lime: { primary: '#84cc16', glow: 'rgba(132, 204, 22, 0.4)' }
	};
	type Theme = keyof typeof THEMES;

	let activeTheme = $state<Theme>('cyan');
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

	let markdownSnippet = $derived(`[![Star History Chart](https://starhistory.link/${meta.full_name}.svg?theme=${activeTheme}${activeStyle !== 'default' ? '&style=' + activeStyle : ''})](https://starhistory.link/${meta.full_name})`);
	let copied = $state(false);

	function copySnippet() {
		navigator.clipboard.writeText(markdownSnippet);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}
</script>

<svelte:head>
	<title>{meta.full_name} - Star History</title>
</svelte:head>

<div class="repo-page animate-fade-in" style={themeVars}>
	<nav class="mb-4 flex justify-between items-center flex-wrap gap-4">
		<a href="/" class="btn btn-outline text-sm">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
			Go Back
		</a>
	</nav>

	<div class="card">
		<div class="card-header">
			<div class="repo-header">
				<div class="repo-info">
					<h2 class="card-title flex items-center">
						<a href={meta.html_url} target="_blank" rel="noopener noreferrer" class="hover-underline">
							{meta.full_name}
						</a>
						<a href={meta.html_url} target="_blank" rel="noopener noreferrer" class="ml-2 text-muted hover-glow">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
						</a>
					</h2>
					{#if meta.description}
						<p class="card-description">{meta.description}</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="card-content">
			<div class="flex flex-col gap-2 mb-4">
				<span class="text-sm text-muted-foreground font-medium">Customize Design:</span>
				<div class="flex flex-wrap gap-4 items-center">
					<div class="style-picker flex gap-1">
						{#each ['default', 'light', 'minimal', 'glass'] as s}
							<button 
								class="style-btn {activeStyle === s ? 'active' : ''}"
								onclick={() => selectStyle(s)}
							>
								{s}
							</button>
						{/each}
					</div>

					<div class="theme-picker flex gap-2">
						{#each Object.keys(THEMES) as t}
							<button 
								class="theme-dot {activeTheme === t ? 'active' : ''}"
								style="background-color: {THEMES[t as Theme].primary};"
								onclick={() => selectTheme(t as Theme)}
								title="Theme: {t}"
								aria-label="Select {t} theme"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<div class="graph-container relative" style="background: {activeStyle === 'glass' ? 'repeating-conic-gradient(#222 0% 25%, #111 0% 50%) 50% / 20px 20px' : 'transparent'}; border-radius: 12px;">
				{#key activeTheme + activeStyle}
					<StarGraphSVG {meta} {history} theme={activeTheme} chartStyle={activeStyle} />
				{/key}
			</div>

			<div class="mt-8 pt-6 border-t border-white/5">
				<label class="block text-sm text-muted-foreground mb-2" for="snippet">
					Copy to embed in your README.md:
				</label>
				<div class="flex gap-2">
					<input id="snippet" readonly type="text" class="input font-mono text-sm" value={markdownSnippet} />
					<button class="btn {copied ? 'btn-success' : 'btn-primary'} whitespace-nowrap" onclick={copySnippet}>
						{#if copied}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="20 6 9 17 4 12"/></svg>
							Copied!
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
							Copy
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.repo-page {
		min-height: 100vh;
		padding: 3rem 1rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.mb-8 { margin-bottom: 1rem; }
	.mb-6 { margin-bottom: 1rem; }
	.mb-4 { margin-bottom: 1rem; }
	.mr-2 { margin-right: 0.5rem; }
	.ml-2 { margin-left: 0.5rem; }

	.flex { display: flex; }
	.items-center { align-items: center; }
	.justify-between { justify-content: space-between; }
	
	.text-sm { font-size: 0.875rem; }

	.hover-underline:hover { text-decoration: underline; }
	.hover-glow:hover { color: var(--foreground); filter: drop-shadow(0 0 8px rgba(255,255,255,0.5)); }

	.flex-col { flex-direction: column; }
	.font-medium { font-weight: 500; }

	/* Theme & Style Picker */
	.gap-4 { gap: 1rem; }
	.gap-2 { gap: 0.5rem; }
	.gap-1 { gap: 0.25rem; }
	.flex-wrap { flex-wrap: wrap; }
	
	.style-picker {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.15rem;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.style-btn {
		background: transparent;
		border: none;
		color: var(--muted-foreground);
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		text-transform: capitalize;
		transition: all 0.2s;
	}
	.style-btn:hover {
		color: var(--foreground);
		background: rgba(255, 255, 255, 0.05);
	}
	.style-btn.active {
		background: var(--foreground);
		color: var(--background);
		font-weight: 600;
	}

	.theme-picker {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.25rem;
		border-radius: 6px;
		border: 1px solid var(--border);
	}
	.theme-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		opacity: 0.5;
		transition: all 0.2s;
	}
	.theme-dot:hover {
		opacity: 0.8;
		transform: scale(1.1);
	}
	.theme-dot.active {
		opacity: 1;
		transform: scale(1.2);
		box-shadow: 0 0 10px currentColor;
	}

	.repo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.repo-info { flex: 1; }

	.text-yellow-500 { color: #f59e0b; }

	.glow-badge {
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.05);
	}

	.graph-container {
		width: 100%;
		overflow-x: auto;
		display: flex;
		justify-content: center;
	}

	.border-t { border-top-width: 1px; }
	.border-white\/5 { border-color: rgba(255, 255, 255, 0.05); }
	.mt-8 { margin-top: 2rem; }
	.pt-6 { padding-top: 1.5rem; }
	.block { display: block; }
	.mb-2 { margin-bottom: 0.5rem; }
	.whitespace-nowrap { white-space: nowrap; }
	
	.btn-success {
		background: #10b981;
		color: #000;
		box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
	}
	.btn-success:hover {
		background: #0ea5e9;
	}

	.star-graph {
		width: 100%;
		max-width: 100%;
		height: auto;
		display: block;
	}

	.watermark {
		opacity: 0.5;
	}

</style>
