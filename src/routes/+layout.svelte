<script lang="ts">
	import '../app.css';

	import { navigating } from '$app/state';
	let { children, data } = $props();
</script>

<a href="/" class="brand">Star History</a>

<a href="https://github.com/yusufceng1z/star-history" target="_blank" rel="noopener noreferrer" class="gh-link" aria-label="Star star-history on GitHub">
	<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>
	Star
	{#if data.siteStars !== null}<span class="count">{data.siteStars.toLocaleString('en-US')}</span>{/if}
</a>

{#if navigating.to}<div class="progress" role="progressbar" aria-label="Loading"></div>{/if}

{@render children()}

<style>
	.brand { position: fixed; top: 1.4rem; left: 1.25rem; z-index: 50; font-size: 0.95rem; font-weight: 600; letter-spacing: -0.01em; color: var(--fg); }
	.brand:hover { color: #fff; }
	.progress { position: fixed; top: 0; left: 0; height: 2px; width: 100%; background: var(--fg); transform-origin: left; z-index: 100; animation: load 8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
	@keyframes load { from { transform: scaleX(0); } to { transform: scaleX(0.92); } }
	.gh-link {
		position: fixed;
		top: 1.25rem;
		right: 1.25rem;
		background: var(--raised);
		border: 1px solid var(--line-2);
		color: var(--fg);
		padding: 0.4rem 0.4rem 0.4rem 0.8rem;
		border-radius: 999px;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.85rem;
		font-weight: 500;
		z-index: 50;
		transition: border-color 150ms ease, transform 120ms var(--ease-out);
	}
	.gh-link:hover { border-color: #3a3a3a; }
	.gh-link:active { transform: scale(0.97); }
	.count {
		background: var(--hover);
		border-radius: 999px;
		padding: 0.05rem 0.55rem;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--fg-2);
	}
</style>
