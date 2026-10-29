# Star History

Star history charts for any public GitHub repo, as an SVG you can paste into a README.

Live at [starhistory.link](https://starhistory.link).

[![Star History of sveltejs/kit](https://starhistory.link/sveltejs/kit.svg?style=ascii)](https://starhistory.link/sveltejs/kit)

## Use it

1. Open the site and enter `owner/repo` or a GitHub link.
2. Pick a look and a colour.
3. Copy the Markdown, HTML or image URL into your README.

The embed is a plain SVG with CSS animation, so it runs inside GitHub READMEs without JavaScript. Direct URL form:

```
https://starhistory.link/OWNER/REPO.svg?style=ascii&theme=blue
```

## Looks

`default`, `light`, `minimal`, `glass`, `ascii`, `matrix`, `space`, `synthwave`

Colours (`theme`): `cyan`, `emerald`, `violet`, `amber`, `rose`, `fuchsia`, `blue`, `lime`, `mono`. `matrix`, `space` and `synthwave` use their own palette.

## Data

Numbers come from GitHub's repository star history endpoint (`GET /repos/{owner}/{repo}/stargazers/history`), which returns exact stars per week for any public repo. Totals match the live star count.

## Run locally

```
npm install
cp .env.example .env   # optional: add GITHUB_TOKEN for a higher rate limit
npm run dev
```

SvelteKit 2, Svelte 5. Social images (`/og/owner/repo.png`) are rendered with resvg.
