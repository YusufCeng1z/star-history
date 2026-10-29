import { POPULAR } from '$lib/popular';
import { SITE_URL } from '$lib/site';

export const prerender = true;

export const GET = () => {
	const urls = ['/', '/popular', ...POPULAR.map((p) => `/${p.repo}`)];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `\t<url><loc>${SITE_URL}${u}</loc><changefreq>${u === '/' || u === '/popular' ? 'weekly' : 'daily'}</changefreq></url>`).join('\n')}
</urlset>`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400' } });
};
