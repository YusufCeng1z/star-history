import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRepoMeta, getStarHistory, GitHubError } from '$lib/server/github';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const { owner, repo } = params;

	// Edge and browser caching for 5 minutes, serve stale while revalidating
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400'
	});

	let repoMeta;
	try {
		repoMeta = await getRepoMeta(owner, repo);
	} catch (e: any) {
		throw error(e instanceof GitHubError ? e.status : 502, e.message);
	}

	if (!repoMeta) {
		throw error(404, 'Repository not found');
	}

	let history, coverage, insights;
	try {
		({ points: history, coverage, ...insights } = await getStarHistory(repoMeta));
	} catch (e: any) {
		throw error(e instanceof GitHubError ? e.status : 502, e.message);
	}

	return {
		meta: repoMeta,
		history,
		coverage,
		insights
	};
};
