import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRepoMeta, getMockStarHistory } from '$lib/server/github';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const { owner, repo } = params;

	// Edge caching for 1 hour, serve stale while revalidating for up to 1 day
	setHeaders({
		'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
	});

	let repoMeta;
	try {
		repoMeta = await getRepoMeta(owner, repo);
	} catch (e: any) {
		throw error(e.message.includes('Limitine') ? 429 : 404, e.message);
	}

	if (!repoMeta) {
		throw error(404, 'Repository not found');
	}

	const history = getMockStarHistory(repoMeta.stargazers_count);

	return {
		meta: repoMeta,
		history
	};
};
