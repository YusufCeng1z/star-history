<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { parseRepo } from '$lib/repo';
	import Seo from '$lib/components/Seo.svelte';
	import { SITE_URL } from '$lib/site';
	import Sky from '$lib/components/Sky.svelte';
	import type { StarPoint } from '$lib/types';

	const EXAMPLES = ['sveltejs/kit', 'vercel/next.js', 'facebook/react'];
	const DEMO = 'sveltejs/kit';
	const STYLES = [
		{ id: 'space', label: 'Space', note: 'a rocket rides the curve', wide: true },
		{ id: 'synthwave', label: 'Synthwave', note: 'neon grid, 80s sunset' },
		{ id: 'matrix', label: 'Matrix', note: 'follow the white rabbit' },
		{ id: 'ascii', label: 'ASCII', note: 'drawn with text characters' },
		{ id: 'default', label: 'Default', note: 'clean and dark' },
		{ id: 'light', label: 'Light', note: 'for light READMEs', wide: true }
	];
	const SNIPPET = `[![Star History](https://starhistory.link/${DEMO}.svg?style=ascii)](https://starhistory.link/${DEMO})`;

	let copied = $state(false);
	function copySnippet() {
		navigator.clipboard.writeText(SNIPPET);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	let inputVal = $state('');
	let input: HTMLInputElement;
	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!inputVal.trim()) { error = 'Please enter a repository name or URL.'; return; }
		const repo = parseRepo(inputVal);
		if (!repo) { error = "Format must be 'owner/repo' or a GitHub URL."; return; }
		error = '';
		goto(`/${repo}`);
	}

	// live preview in the hero sky
	let series = $state<StarPoint[] | null>(null);
	let label = $state('');
	let auto = true;
	let timer: ReturnType<typeof setTimeout>;
	const loaded = new Map<string, { label: string; points: StarPoint[] }>();

	async function preview(repo: string) {
		let hit = loaded.get(repo);
		if (!hit) {
			const res = await fetch(`/api/history/${repo}`).catch(() => null);
			if (!res?.ok) return;
			const d = await res.json();
			hit = { label: d.full_name, points: d.points };
			loaded.set(repo, hit);
		}
		label = hit.label;
		series = hit.points;
	}

	function userPreview(repo: string | null, delay = 0) {
		auto = false;
		clearTimeout(timer);
		if (repo) timer = setTimeout(() => preview(repo), delay);
	}

	onMount(() => {
		// "/" jumps to the search box, like GitHub
		const key = (e: KeyboardEvent) => {
			if (e.key === '/' && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); input.focus(); }
		};
		addEventListener('keydown', key);
		let i = 0;
		const tick = async () => {
			if (!auto) return;
			await preview(EXAMPLES[i++ % EXAMPLES.length]);
			if (auto) setTimeout(tick, 7000);
		};
		tick();
		return () => { auto = false; clearTimeout(timer); removeEventListener('keydown', key); };
	});
</script>

<Seo
	title="Star History: exact GitHub star charts for your README"
	description="Create animated, embeddable GitHub star history charts with exact weekly data. Pure SVG, no JavaScript. Six styles, nine colours, free and open source."
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Star History',
		url: SITE_URL,
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Any',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		description: 'Embeddable GitHub star history charts with exact weekly data.'
	}}
/>

<main class="page">
	<section class="hero">
		<Sky {series} {label} />
		<div class="hero-copy animate-fade-in">
			<h1>See how any GitHub repo grew.</h1>
			<p class="sub">Type a repo, pick a look, paste one line into your README.</p>

			<form onsubmit={handleSubmit} class="search-form">
				<input
					type="text"
					class="input"
					placeholder="sveltejs/kit or a GitHub link"
					bind:this={input}
					aria-label="Repository"
					bind:value={inputVal}
					oninput={() => userPreview(parseRepo(inputVal), 600)}
				/>
				<button type="submit" class="btn btn-primary">Generate</button>
			</form>
			{#if error}
				<p class="error-msg" role="alert">{error}</p>
			{/if}

			<div class="chips" aria-label="Examples">
				{#each EXAMPLES as r}
					<a class="chip" href="/{r}" onpointerenter={() => userPreview(r, 120)} onfocus={() => userPreview(r)}>{r}</a>
				{/each}
			</div>
			<a class="popular" href="/popular">Browse popular repos →</a>
		</div>

	</section>
</main>

<style>
	.hero { position: relative; height: 100svh; padding: 0 1.25rem; display: flex; justify-content: center; overflow: hidden; }
	.hero-copy { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 12vh; width: 100%; max-width: 62rem; }
	h1 { font-size: clamp(2.25rem, 6vw, 3.75rem); font-weight: 600; letter-spacing: -0.035em; line-height: 1.08; max-width: 18ch; }
	.sub { margin-top: 1.25rem; max-width: 30rem; color: var(--fg-2); font-size: 1.1rem; }
	.search-form { display: flex; gap: 0.5rem; width: 100%; max-width: 28rem; margin-top: 2rem; }
	.search-form .btn { height: 2.75rem; padding: 0 1.4rem; }
	.error-msg { margin-top: 0.75rem; color: var(--danger); font-size: 0.875rem; }

	.chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; }
	.chip {
		font-family: var(--font-mono); font-size: 0.82rem; color: var(--fg-2);
		border: 1px solid var(--line-2); border-radius: 999px; padding: 0.25rem 0.7rem; background: rgba(8, 8, 8, 0.6);
		transition: background-color 150ms ease, color 150ms ease;
	}
	.chip:hover { background: var(--hover); color: var(--fg); }

	.popular { margin-top: 1.1rem; font-size: 0.85rem; color: var(--fg-3); transition: color 150ms ease; }
	.popular:hover { color: var(--fg); }
</style>
