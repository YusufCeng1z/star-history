import type { RepoMeta, StarPoint } from '../types';
import { env } from '$env/dynamic/private';

/**
 * Fetches basic repository metadata from GitHub.
 */
export async function getRepoMeta(owner: string, repo: string): Promise<RepoMeta | null> {
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github.v3+json',
		'User-Agent': 'star-history-demo'
	};

	if (env.GITHUB_TOKEN) {
		headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
	}

	const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		headers
	});

	if (!response.ok) {
		if (response.status === 403 || response.status === 429) {
			throw new Error("GitHub API Limitine takıldın (Rate Limit). Lütfen biraz bekle.");
		}
		if (response.status === 404) {
			throw new Error("Böyle bir repository bulunamadı.");
		}
		throw new Error(`GitHub API hatası: ${response.status}`);
	}

	const data = await response.json();
	return {
		owner: data.owner.login,
		name: data.name,
		full_name: data.full_name,
		stargazers_count: data.stargazers_count,
		html_url: data.html_url,
		description: data.description,
		created_at: data.created_at
	};
}

/**
 * Generates mock star history data for demonstration purposes,
 * creating a realistic exponential or S-curve up to the current star count.
 */
export function getMockStarHistory(currentStars: number, createdAt: string): StarPoint[] {
	const points: StarPoint[] = [];
	const dataPointsCount = 50;
	
	const now = new Date();
	const startDate = new Date(createdAt);
	
	let currentCount = 0;
	
	for (let i = 0; i <= dataPointsCount; i++) {
		// Calculate the date for this point
		const pointDate = new Date(startDate.getTime() + (now.getTime() - startDate.getTime()) * (i / dataPointsCount));
		
		// Create a realistic looking curve (logistic-like or quadratic)
		// For simplicity, a simple quadratic growth:
		const progress = i / dataPointsCount;
		const growthFactor = Math.pow(progress, 1.5) + (Math.random() * 0.05); // Add a little noise
		
		currentCount = Math.min(Math.floor(growthFactor * currentStars), currentStars);
		
		// Force the last point to be exactly the current stars
		if (i === dataPointsCount) {
			currentCount = currentStars;
		}

		// Ensure strictly non-decreasing
		if (points.length > 0 && currentCount < points[points.length - 1].count) {
			currentCount = points[points.length - 1].count;
		}
		
		points.push({
			date: pointDate.toISOString(),
			count: currentCount
		});
	}

	return points;
}
