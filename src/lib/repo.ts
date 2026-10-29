/** "owner/repo" or any github.com URL -> "owner/repo", else null */
export function parseRepo(raw: string): string | null {
	let t = raw.trim();
	const m = t.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/);
	if (m) t = `${m[1]}/${m[2]}`;
	t = t.replace(/\.git$/, '');
	return /^[\w.-]+\/[\w.-]+$/.test(t) ? t : null;
}
