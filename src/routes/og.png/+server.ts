import type { RequestHandler } from './$types';
import { getRepoMeta, getStarHistory } from '$lib/server/github';
import { ogPng } from '$lib/server/og';

// Home page social card: the brand over a real chart.
export const GET: RequestHandler = async () => {
	const meta = (await getRepoMeta('sveltejs', 'kit'))!;
	const { points } = await getStarHistory(meta);
	return new Response(ogPng({ title: 'Star history for every repo', stars: meta.stargazers_count, points, kicker: `Star History  ·  ${meta.full_name}` }) as BodyInit, {
		headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' }
	});
};
