<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { POPULAR } from '$lib/popular';
</script>

<Seo
	title="Star history of popular GitHub repositories | Star History"
	description="Exact star growth charts for popular open source projects: React, Vue, Svelte, Next.js, Linux, Rust, Go and more. Open any chart and copy it into your README."
	path="/popular"
/>

<main class="wrap animate-fade-in">
	<a href="/" class="btn btn-outline back">Back</a>
	<h1>Popular repositories</h1>
	<p class="lead">Exact weekly star history for well-known open source projects. Pick one, or <a href="/">chart your own</a>.</p>
	<ul class="grid">
		{#each POPULAR as p}
			<li>
				<a href="/{p.repo}">
					<img src="/{p.repo}.svg?style=minimal" alt="Star history chart of {p.repo}" loading="lazy" width="900" height="450" />
					<span><b>{p.repo}</b> {p.blurb}</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.wrap { max-width: 62rem; margin: 0 auto; padding: 4.5rem 1.25rem 3rem; }
	.back { margin-bottom: 1.5rem; }
	h1 { font-size: 2rem; font-weight: 500; letter-spacing: -0.03em; }
	.lead { margin-top: 0.4rem; color: var(--fg-2); }
	.lead a { text-decoration: underline; text-underline-offset: 3px; }
	.grid { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem; margin-top: 2rem; }
	.grid a { display: block; border: 1px solid var(--line-2); border-radius: var(--radius); overflow: hidden; transition: border-color 150ms ease, transform 200ms var(--ease-out); }
	.grid a:hover { border-color: #3a3a3a; transform: translateY(-2px); }
	.grid img { display: block; width: 100%; height: auto; }
	.grid span { display: block; padding: 0.6rem 0.9rem; font-size: 0.78rem; color: var(--fg-3); border-top: 1px solid var(--line); background: var(--frame); }
	.grid b { color: var(--fg); font-weight: 500; margin-right: 0.35rem; }
</style>
