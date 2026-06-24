<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a href="https://github.com/yusufceng1z/star-history" target="_blank" rel="noopener noreferrer" class="gh-link">
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0 .2-3.8s-1.2-.4-3.9 1.4a13.4 13.4 0 0 0-7 0C6.2 1.4 5 1.8 5 1.8a5.5 5.5 0 0 0 .2 3.8A5.5 5.5 0 0 0 3.7 9.4c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/><path d="M9 18c-4.5 1.5-5-2.5-7-3"/></svg>
	Star on GitHub
</a>

<div class="watermark">
	yusufceng1z
</div>

{@render children()}

<style>
	.gh-link {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		color: var(--muted-foreground);
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		font-weight: 500;
		transition: color 0.2s;
		z-index: 50;
	}
	.gh-link:hover {
		color: var(--foreground);
	}
	
	.watermark {
		position: fixed;
		bottom: 1rem;
		right: 1.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.15);
		pointer-events: none;
		user-select: none;
		z-index: 50;
		font-family: var(--font-mono);
	}
</style>
