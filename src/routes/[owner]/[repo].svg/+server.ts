import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoMeta, getStarHistory } from '$lib/server/github';
import { render } from 'svelte/server';
import StarGraphSVG from '$lib/components/StarGraphSVG.svelte';

// Errors must not be cached by the CDN/camo, or a rate-limit blip sticks for a day.
const errorSvg = (message: string, status = 502) =>
	new Response(
		`<svg width="900" height="450" viewBox="0 0 900 450" xmlns="http://www.w3.org/2000/svg">
	<rect width="100%" height="100%" fill="#000" />
	<text x="50%" y="50%" fill="#ff5555" text-anchor="middle" font-family="sans-serif" font-size="20">${message}</text>
</svg>`,
		{ status, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' } }
	);

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	const { owner, repo } = params;
	const theme = url.searchParams.get('theme') || 'mono';
	const chartStyle = url.searchParams.get('style') || 'default';

	// Edge and Camo caching for 5 minutes, serve stale while revalidating
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
		'Content-Type': 'image/svg+xml'
	});

	let repoMeta;
	try {
		repoMeta = await getRepoMeta(owner, repo);
	} catch (e: any) {
		return errorSvg(e.message, e.status);
	}

	if (!repoMeta) {
		throw error(404, 'Repository not found');
	}

	let history, coverage;
	try {
		({ points: history, coverage } = await getStarHistory(repoMeta));
	} catch (e: any) {
		return errorSvg(e.message, e.status);
	}

	// Render the SVG component on the server
	const { html } = render(StarGraphSVG, {
		props: {
			meta: repoMeta,
			history,
			coverage,
			theme,
			chartStyle
		}
	});

	// The rendered HTML is already an <svg> string since our component root is <svg>
	return new Response(html, {
		headers: { 'Content-Type': 'image/svg+xml' }
	});
};
