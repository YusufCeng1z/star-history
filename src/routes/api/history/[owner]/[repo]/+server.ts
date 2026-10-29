import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoMeta, getStarHistory, GitHubError } from '$lib/server/github';

// Compact history for the home page hero preview.
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	try {
		const meta = await getRepoMeta(params.owner, params.repo);
		if (!meta) return json({ error: 'Repository not found.' }, { status: 404 });
		const { points } = await getStarHistory(meta);
		setHeaders({ 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' });
		return json({ full_name: meta.full_name, stars: meta.stargazers_count, points });
	} catch (e: any) {
		return json({ error: e.message }, { status: e instanceof GitHubError ? e.status : 502, headers: { 'Cache-Control': 'no-store' } });
	}
};
