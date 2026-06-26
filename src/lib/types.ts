export interface RepoMeta {
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
