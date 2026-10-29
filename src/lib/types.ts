export interface RepoMeta {
	id: number;
	owner: string;
	name: string;
	full_name: string;
	stargazers_count: number;
	html_url: string;
	description: string | null;
	created_at: string;
}

export interface StarPoint {
	date: string;
	count: number;
}

export interface StarHistory {
	points: StarPoint[];
	/** share of the live star count that has a dated event (1 = fully dated) */
	coverage: number;
	/** stars gained per calendar year, oldest first */
	yearly: { year: number; stars: number }[];
	/** stars in the last 4 full weeks and the single busiest week */
	last4Weeks: number;
	peakWeek: { start: string; stars: number } | null;
}
