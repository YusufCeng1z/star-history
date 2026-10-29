<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { parseRepo } from '$lib/repo';

	let value = $state('');
	let bad = $state(false);

	function go(e: Event) {
		e.preventDefault();
		const repo = parseRepo(value);
		bad = !repo;
		if (repo) goto(`/${repo}`);
	}

	let title = $derived(page.status === 404 ? 'Repository not found' : page.status === 429 ? 'GitHub is rate limiting us' : 'Something went wrong');
	let help = $derived(
		page.status === 404
			? 'Check the spelling. Private repositories and typos both show up as not found.'
			: page.status === 429
				? 'Too many requests right now. Wait a minute and try again.'
				: 'Try again in a moment.'
	);
</script>

<svelte:head><title>{title} | Star History</title></svelte:head>

<main class="err">
	<h1>{title}</h1>
	<p>{page.error?.message && page.status !== 404 ? page.error.message : help}</p>
	<form onsubmit={go}>
		<input class="input" bind:value placeholder="owner/repo" aria-label="Repository" aria-invalid={bad} />
		<button class="btn btn-primary">Open</button>
	</form>
	{#if bad}<p class="bad" role="alert">Use the form owner/repo, for example sveltejs/kit.</p>{/if}
	<a href="/" class="home">Back to start</a>
</main>

<style>
	.err { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.9rem; text-align: center; padding: 1.5rem; }
	h1 { font-size: 1.75rem; font-weight: 600; letter-spacing: -0.02em; }
	p { color: var(--fg-2); max-width: 28rem; }
	form { display: flex; gap: 0.5rem; width: 100%; max-width: 24rem; margin-top: 0.5rem; }
	.bad { color: var(--danger); font-size: 0.875rem; }
	.home { color: var(--fg-2); text-decoration: underline; text-underline-offset: 3px; font-size: 0.9rem; }
</style>
