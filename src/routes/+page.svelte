<script lang="ts">
	import { goto } from '$app/navigation';

	let inputVal = $state('');
	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		let trimmed = inputVal.trim();
		if (!trimmed) {
			error = "Please enter a repository name or URL.";
			return;
		}
		
		// If it's a full GitHub URL, extract the owner/repo
		if (trimmed.includes('github.com/')) {
			try {
				const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
				const urlParts = urlObj.pathname.split('/').filter(Boolean);
				if (urlParts.length >= 2) {
					trimmed = `${urlParts[0]}/${urlParts[1]}`.replace('.git', '');
				}
			} catch (err) {
				// Fallback
				const match = trimmed.match(/github\.com\/([^\/]+\/[^\/]+)/);
				if (match && match[1]) {
					trimmed = match[1].replace('.git', '');
				}
			}
		}

		const parts = trimmed.split('/');
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			error = "Format must be 'owner/repo' or a GitHub URL.";
			return;
		}

		error = '';
		goto(`/${parts[0]}/${parts[1]}`);
	}
</script>

<svelte:head>
	<title>GitHub Star History</title>
</svelte:head>

<div class="page-wrapper animate-fade-in">
	<div class="card main-card">
		<div class="card-header text-center">
			<div class="icon-wrapper">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0 .2-3.8s-1.2-.4-3.9 1.4a13.4 13.4 0 0 0-7 0C6.2 1.4 5 1.8 5 1.8a5.5 5.5 0 0 0 .2 3.8A5.5 5.5 0 0 0 3.7 9.4c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/><path d="M9 18c-4.5 1.5-5-2.5-7-3"/></svg>
			</div>
			<h1 class="card-title">Star History</h1>
			<p class="card-description">View the star history of GitHub repositories.</p>
		</div>

		<div class="card-content">
			<form onsubmit={handleSubmit} class="search-form">
				<div class="input-wrapper">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
					<input
						type="text"
						class="input"
						placeholder="owner/repo or full GitHub URL"
						bind:value={inputVal}
					/>
				</div>
				
				{#if error}
					<p class="error-msg">{error}</p>
				{/if}

				<button type="submit" class="btn btn-primary w-full">
					Generate Chart
				</button>
			</form>
		</div>
	</div>
</div>

<style>
	.page-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 1rem;
	}

	.main-card {
		width: 100%;
		max-width: 400px;
	}

	.text-center {
		align-items: center;
		text-align: center;
	}

	.icon-wrapper {
		margin-bottom: 0.5rem;
		display: flex;
		justify-content: center;
		color: var(--foreground);
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.input-wrapper {
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--muted-foreground);
	}

	.input {
		padding-left: 2.25rem;
	}

	.w-full {
		width: 100%;
	}

	.error-msg {
		color: var(--destructive);
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		margin-top: -0.5rem;
	}
</style>
