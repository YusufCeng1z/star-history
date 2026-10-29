import type { RepoMeta, StarHistory, StarPoint } from '../types';
import { env } from '$env/dynamic/private';

/**
 * Fetches basic repository metadata from GitHub.
 */
export class GitHubError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

function ghHeaders(accept = 'application/vnd.github.v3+json'): Record<string, string> {
	const headers: Record<string, string> = { Accept: accept, 'User-Agent': 'star-history' };
	if (env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
	return headers;
}

function ghFail(status: number): never {
	if (status === 403 || status === 429) throw new GitHubError(429, 'GitHub API rate limit reached. Try again shortly.');
	if (status === 404) throw new GitHubError(404, 'Repository not found.');
	throw new GitHubError(502, `GitHub API error: ${status}`);
}

export async function getRepoMeta(owner: string, repo: string): Promise<RepoMeta | null> {
	const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders() });
	if (!response.ok) ghFail(response.status);

	const data = await response.json();
	return {
		id: data.id,
		owner: data.owner.login,
		name: data.name,
		full_name: data.full_name,
		stargazers_count: data.stargazers_count,
		html_url: data.html_url,
		description: data.description,
		created_at: data.created_at
	};
}

const TTL_MS = 60 * 60 * 1000;
const WEEKS_PER_PAGE = 30; // API max
const MAX_POINTS = 120;
const cache = new Map<string, { at: number; value: StarHistory }>();

/**
 * Official GitHub endpoint (shipped Sep 2026): exact stars per calendar week for any public repo.
 * Replaces the stargazers listing, which is admin-only since Jul 2026.
 */
export async function getStarHistory(meta: RepoMeta): Promise<StarHistory> {
	const key = `${meta.id}:${meta.stargazers_count}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

	const weeksOld = Math.ceil((Date.now() - new Date(meta.created_at).getTime()) / (7 * 864e5)) + 2;
	const pageCount = Math.min(100, Math.ceil(weeksOld / WEEKS_PER_PAGE));
	const pages = await Promise.all(
		Array.from({ length: pageCount }, async (_, i) => {
			const res = await fetch(
				`https://api.github.com/repos/${meta.full_name}/stargazers/history?per_page=${WEEKS_PER_PAGE}&page=${i + 1}`,
				{ headers: { ...ghHeaders('application/vnd.github+json'), 'X-GitHub-Api-Version': '2026-03-10' } }
			);
			if (!res.ok) ghFail(res.status);
			return (await res.json()) as { week: number; total: number }[];
		})
	);

	// pages are newest first; flip to oldest first and accumulate
	const weeks = pages.flat().sort((a, b) => a.week - b.week);
	const total = meta.stargazers_count;
	const dated = weeks.reduce((n, w) => n + w.total, 0);
	const coverage = total ? dated / total : 1;

	const points: StarPoint[] = [{ date: meta.created_at, count: 0 }];
	let sum = 0;
	for (const w of weeks) {
		sum += w.total;
		// week start is before its stars; use the week end so the curve never leads the data
		const end = Math.min(Date.now(), (w.week + 7 * 86400) * 1000);
		points.push({ date: new Date(end).toISOString(), count: Math.min(sum, total) });
	}
	points.push({ date: new Date().toISOString(), count: total });

	// thin long histories evenly, always keeping the first and last point
	const step = Math.ceil(points.length / MAX_POINTS);
	const thinned = step > 1 ? points.filter((_, i) => i % step === 0 || i === points.length - 1) : points;

	const byYear = new Map<number, number>();
	for (const w of weeks) {
		const y = new Date((w.week + 3.5 * 86400) * 1000).getUTCFullYear();
		byYear.set(y, (byYear.get(y) ?? 0) + w.total);
	}
	const peak = weeks.reduce<typeof weeks[number] | null>((m, w) => (!m || w.total > m.total ? w : m), null);
	const value: StarHistory = {
		points: thinned,
		coverage,
		yearly: [...byYear].map(([year, stars]) => ({ year, stars })),
		last4Weeks: weeks.slice(-4).reduce((n, w) => n + w.total, 0),
		peakWeek: peak && peak.total ? { start: new Date(peak.week * 1000).toISOString(), stars: peak.total } : null
	};
	cache.set(key, { at: Date.now(), value });
	return value;
}
