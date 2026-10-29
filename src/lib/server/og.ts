import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import type { StarPoint } from '$lib/types';

const require = createRequire(import.meta.url);
const fontFiles = [
	require.resolve('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
	require.resolve('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
	require.resolve('@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf')
];

const W = 1200, H = 630;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** 1200x630 social card. Literal colours only: resvg has no CSS variables or animation. */
export function ogPng(opts: { title: string; stars: number; points: StarPoint[]; kicker?: string }): Uint8Array {
	const { title, stars, points, kicker = 'Star History' } = opts;
	const x0 = 72, x1 = W - 72, yb = 560, yt = 270;
	const t0 = new Date(points[0].date).getTime(), t1 = new Date(points[points.length - 1].date).getTime();
	const max = points[points.length - 1].count || 1;
	const xy = points.map((p) => [
		x0 + ((new Date(p.date).getTime() - t0) / (t1 - t0 || 1)) * (x1 - x0),
		yb - (p.count / max) * (yb - yt)
	]);
	const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
	const area = `${line} L${x1} ${yb} L${x0} ${yb} Z`;
	const year = (t: number) => new Date(t).getUTCFullYear();
	const [lx, ly] = xy[xy.length - 1];

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ededed" stop-opacity="0.22"/><stop offset="1" stop-color="#ededed" stop-opacity="0"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="#0d0d0d"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#2a2a2a" stroke-width="2"/>
<text x="72" y="96" font-family="JetBrains Mono" font-size="26" fill="#6b6b6b">${esc(kicker)}</text>
<text x="72" y="170" font-family="Inter" font-weight="600" font-size="64" fill="#ededed">${esc(title)}</text>
<text x="${W - 72}" y="170" text-anchor="end" font-family="JetBrains Mono" font-weight="700" font-size="64" fill="#ededed">★ ${new Intl.NumberFormat('en-US').format(stars)}</text>
<line x1="${x0}" y1="${yb}" x2="${x1}" y2="${yb}" stroke="#2a2a2a" stroke-width="2"/>
<path d="${area}" fill="url(#g)"/>
<path d="${line}" fill="none" stroke="#ededed" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${lx}" cy="${ly}" r="9" fill="#0d0d0d" stroke="#ededed" stroke-width="4"/>
<text x="${x0}" y="${yb + 40}" font-family="JetBrains Mono" font-size="22" fill="#6b6b6b">${year(t0)}</text>
<text x="${x1}" y="${yb + 40}" text-anchor="end" font-family="JetBrains Mono" font-size="22" fill="#6b6b6b">${year(t1)}</text>
<text x="${W / 2}" y="${yb + 40}" text-anchor="middle" font-family="JetBrains Mono" font-size="22" fill="#3a3a3a">starhistory.link</text>
</svg>`;
	return new Resvg(svg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render().asPng();
}
