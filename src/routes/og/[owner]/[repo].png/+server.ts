import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoMeta, getStarHistory, GitHubError } from '$lib/server/github';
import { ogPng } from '$lib/server/og';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const meta = await getRepoMeta(params.owner, params.repo);
		if (!meta) throw error(404, 'Repository not found');
		const { points } = await getStarHistory(meta);
		const png = ogPng({ title: meta.full_name, stars: meta.stargazers_count, points });
		return new Response(png as BodyInit, {
			headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' }
		});
	} catch (e: any) {
		if (e?.status && !(e instanceof GitHubError)) throw e;
		throw error(e instanceof GitHubError ? e.status : 502, e.message);
	}
};
