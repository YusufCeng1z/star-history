import { env } from '$env/dynamic/private';

const REPO = 'YusufCeng1z/star-history';
let cached: { at: number; stars: number | null } | null = null;

// Live star count for the header button; failure just hides the number.
export const load = async () => {
	if (!cached || Date.now() - cached.at > 10 * 60 * 1000) {
		const headers: Record<string, string> = { 'User-Agent': 'star-history' };
		if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
		const stars = await fetch(`https://api.github.com/repos/${REPO}`, { headers })
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => (d ? (d.stargazers_count as number) : null))
			.catch(() => null);
		cached = { at: Date.now(), stars };
	}
	return { siteStars: cached.stars };
};
