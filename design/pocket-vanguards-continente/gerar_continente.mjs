// Gera continente-pocket-vanguards.png: a região do Pocket Vanguards vista de cima, estilo Brick Bronze (cidades ligadas
// por rotas numeradas, uma série por cidade), com um desenho de referência para cada lugar e a tabela "qual é qual".
// Uso:  npm install && npx playwright install chromium
//       npm run gerar                (ou: node gerar_continente.mjs [saida.png]; SCALE=1 gera em 2800x1680)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const OUT = process.argv[2] || path.join(here, 'continente-pocket-vanguards.png');
const SCALE = Number(process.env.SCALE || 2);

// ------------------------------------------------------------------ canvas
const W = 2800, H = 1680;
const K = 1.48, MX = 46, MY = 150; // o mapa começa em (MX, MY); 1 unidade = K px
const WW = 1068, WH = 720; // tamanho do mapa em unidades (1 unidade = 10 studs)
const deg = Math.PI / 180;
const f = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const C = {
	sheet: '#0c2645', grid: '#9cc2ef', panel: '#10315a', panelEdge: '#2b5689', frame: '#3b6ca6',
	ink: '#f3f8ff', dim: '#a9c3e4', cyan: '#6fd3ff', halo: '#0c2645', navy: '#0c2645',
	sea: '#2f7fb8', seaDeep: '#246a9e', seaLine: '#5aa6d8', sand: '#e9d7a6',
	grass: '#79bd63', grass2: '#5f9f4e', grassEdge: '#4b8a3f', dark: '#1c2233',
	rock: '#8a7b6b', rockLine: '#a7978a', rockEdge: '#5f5348', snow: '#f1f3f5',
	path: '#ecdcb0', pathEdge: '#c7b080', rail: '#e1e7ee', tie: '#5b4636', deck: '#7b5b3f',
	tree: '#3d8a46', treeLight: '#5aac5f', gold: '#f6c445', water: '#58b8de',
};
// tipos do jogo (cores da HUD) e as insígnias
const TYPE = { fogo: '#ff6a2b', agua: '#2d9bf0', raio: '#f2c230', sombra: '#7a86c9', terra: '#c08a4a', vento: '#3fcf9a', martial: '#a066ff', onirico: '#ff7ad9', normal: '#b9b2a8' };
const TNAME = { fogo: 'Fogo', agua: 'Água', raio: 'Raio', sombra: 'Sombra', terra: 'Terra', vento: 'Vento', martial: 'Martial', onirico: 'Onírico', normal: 'Normal' };

// ------------------------------------------------------------------ svg helpers
const DEFS = [];
const r = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`;
const c = (x, y, rad, fill, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${fill}" ${extra}/>`;
const el = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const poly = (pts, fill, extra = '') => `<polygon points="${pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="${fill}" ${extra}/>`;
const pth = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ln = (x1, y1, x2, y2, stroke, w, extra = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
function T(x, y, str, o = {}) {
	const size = o.size || 14, weight = o.weight || 700, fill = o.fill || C.ink, anchor = o.anchor || 'start';
	const fam = o.body ? "Barlow, 'Barlow Condensed', sans-serif" : "'Barlow Condensed', Barlow, sans-serif";
	const halo = o.halo === false ? '' : `stroke="${o.haloColor || C.halo}" stroke-width="${o.haloW || 3.6}" stroke-linejoin="round" paint-order="stroke"`;
	const ls = o.ls ? `letter-spacing="${o.ls}"` : '';
	const extra = o.extra || '';
	return `<text x="${f(x)}" y="${f(y)}" font-family="${fam}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" ${ls} ${halo} ${extra}>${esc(str)}</text>`;
}
const lin = (id, stops, vertical = true) => DEFS.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, col, op]) => `<stop offset="${o}" stop-color="${col}" ${op !== undefined ? `stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`);
const rad = (id, stops) => DEFS.push(`<radialGradient id="${id}">${stops.map(([o, col, op]) => `<stop offset="${o}" stop-color="${col}" ${op !== undefined ? `stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`);
lin('skyDay', [[0, '#86c9f5'], [1, '#d9f1ff']]);
lin('skyEve', [[0, '#231b55'], [0.55, '#6b3a78'], [1, '#ff8f5e']]);
lin('skyNight', [[0, '#0b1028'], [1, '#2a2f63']]);
lin('skyDream', [[0, '#5b3fa8'], [0.6, '#c86bd6'], [1, '#ffd0a8']]);
lin('caveP', [[0, '#2b2045'], [1, '#130e1e']]);
rad('gOrange', [[0, '#ffb15c', 0.95], [1, '#ff6b3d', 0]]);
rad('gPurple', [[0, '#c4a5ff', 0.9], [1, '#a77bff', 0]]);
rad('gCyan', [[0, '#a5f3fc', 0.9], [1, '#22d3ee', 0]]);
rad('gGold', [[0, '#fff1a8', 0.95], [1, '#f6c445', 0]]);
rad('gBlue', [[0, '#bfe6ff', 0.95], [0.5, '#3b9cf5', 0.8], [1, '#1d4ed8', 0]]);
rad('gPink', [[0, '#ffe3f7', 0.95], [1, '#ff7ad9', 0]]);
rad('gGreen', [[0, '#d9fbe5', 0.95], [1, '#22c55e', 0]]);
rad('gDark', [[0, '#1a1228', 1], [0.8, '#2a1a44', 1], [1, '#2a1a44', 0]]);
DEFS.push(`<radialGradient id="seaGrad" cx="534" cy="360" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.sea}"/><stop offset="1" stop-color="${C.seaDeep}"/></radialGradient>`);
DEFS.push(`<marker id="arrowW" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker>`);
DEFS.push(`<marker id="arrowC" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.cyan}"/></marker>`);

// ------------------------------------------------------------------ geometry
const X = (x) => MX + x * K, Y = (y) => MY + y * K;
function noise(t, s) { return 0.5 * Math.sin(3 * t + s) + 0.3 * Math.sin(7 * t + 2.1 * s) + 0.2 * Math.sin(13 * t + 0.7 * s) + 0.12 * Math.sin(23 * t + 1.3 * s); }
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function blob(cx, cy, r0, amp, seed, step = 10) { let d = ''; for (let a = 0; a < 360; a += step) { const rr = r0 + amp * noise(a * deg, seed); const x = cx + rr * Math.cos(a * deg), y = cy + rr * Math.sin(a * deg); d += (a === 0 ? 'M' : 'L') + f(x) + ' ' + f(y) + ' '; } return d + 'Z'; }
function coast(pts, amp, seed, step = 7) {
	const out = []; let n = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;
		for (let t = 0; t < len; t += step) { n += 1; const w = amp * noise(n * 0.11, seed); const x = a[0] + ((b[0] - a[0]) * t) / len, y = a[1] + ((b[1] - a[1]) * t) / len; out.push(`${f(x + nx * w)} ${f(y + ny * w)}`); }
	}
	return 'M ' + out.join(' L ') + ' Z';
}
function offsetPoly(pts, d) {
	const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
	return pts.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy); return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d]; });
}
// continente: lobo de deserto a noroeste, faixa norte, braço oeste, península ao sul e uma baía grande a leste com ilhas dentro
const LAND = [[90, 210], [120, 130], [200, 80], [300, 60], [400, 72], [470, 50], [560, 40], [640, 56], [720, 40], [800, 52], [880, 70], [950, 110], [1000, 180], [1010, 260], [990, 340], [960, 400], [910, 420], [880, 380], [870, 320], [820, 300], [760, 310], [700, 330], [640, 340], [580, 330], [520, 340], [470, 360], [440, 400], [450, 460], [480, 520], [500, 580], [500, 640], [470, 700], [420, 710], [370, 690], [340, 640], [330, 580], [300, 540], [250, 520], [200, 500], [150, 470], [120, 420], [110, 350], [130, 290], [100, 250]];
function inLand(x, y, pad = 0) {
	let inside = false;
	for (let i = 0, j = LAND.length - 1; i < LAND.length; j = i++) { const [xi, yi] = LAND[i], [xj, yj] = LAND[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; }
	if (!inside) return false;
	if (pad) for (let i = 0, j = LAND.length - 1; i < LAND.length; j = i++) { const [xi, yi] = LAND[i], [xj, yj] = LAND[j], l2 = (xj - xi) ** 2 + (yj - yi) ** 2, t = Math.max(0, Math.min(1, ((x - xi) * (xj - xi) + (y - yi) * (yj - yi)) / l2)); if (Math.hypot(x - (xi + t * (xj - xi)), y - (yi + t * (yj - yi))) < pad) return false; }
	return true;
}
// cidades: x, y (unidades)
const CITY = {
	vila: [420, 652], farol: [358, 552], capsule: [222, 400], dunas: [172, 176], glicinias: [562, 176], aurea: [778, 126], portoes: [906, 194], astral: [800, 444], amald: [946, 352], liga: [664, 232],
};
// sub-lugares
const SUB = { lago: [402, 604], floresta: [300, 470], circulo: [200, 320], oasis: [232, 232], vale: [330, 110], kamado: [488, 98], natagumo: [520, 150], coliseu: [728, 168], costa: [690, 68], masmorra: [964, 122], caverna: [790, 268], ilhanavio: [280, 640], kame: [62, 430], jeju: [1036, 70], escola: [898, 316] };
const DESERT = [190, 190], DREAM = [700, 596];
// rotas: número, pontos
const ROUTES = [
	[1, [[420, 636], [404, 614]]], [2, [[398, 594], [368, 568]]], [3, [[346, 538], [306, 492]]], [4, [[294, 452], [246, 418]]],
	[5, [[214, 376], [202, 338]]], [6, [[196, 306], [184, 222]]], [7, [[194, 160], [300, 122]]], [8, [[344, 112], [416, 120]]],
	[9, [[484, 142], [528, 166]]], [10, [[598, 164], [690, 96], [740, 118]]], [11, [[816, 140], [866, 182]]], [13, [[930, 236], [942, 316]]], [14, [[902, 352], [790, 268], [720, 236]]],
];
const RAIL = [[898, 236], [890, 300], [842, 404], [806, 438]]; // Expresso Astral (R12), atravessa a baía

// ------------------------------------------------------------------ small map glyphs
const badge = (x, y, n, col, s = 1) => c(x, y, 14 * s, col, `stroke="${C.navy}" stroke-width="${3 * s}"`) + T(x, y + 5.4 * s, String(n), { size: 16 * s, weight: 800, fill: C.navy, anchor: 'middle', halo: false });
function star(x, y, r1, r2, n, fill, extra = '') { const pts = []; for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r2 : r1; const a = (i * 180) / n - 90; pts.push([x + rr * Math.cos(a * deg), y + rr * Math.sin(a * deg)]); } return poly(pts, fill, extra); }
const treeM = (x, y, s = 1, col = C.tree, lt = C.treeLight) => c(x + 1, y + 1.4, 5 * s, 'rgba(0,0,0,.18)') + c(x, y, 5 * s, col) + c(x - 1.6 * s, y - 1.6 * s, 2.4 * s, lt);
const pineM = (x, y, s = 1, col = '#2f6b3a') => poly([[x, y - 9 * s], [x + 5 * s, y + 3 * s], [x - 5 * s, y + 3 * s]], col) + poly([[x, y - 5 * s], [x + 4 * s, y + 5 * s], [x - 4 * s, y + 5 * s]], col);
const houseM = (x, y, w, h, roof, wall = '#f3e9d2', rot = 0) => `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${r(x - w / 2 + 1, y - h / 2 + 1.5, w, h, 'rgba(0,0,0,.2)')}${r(x - w / 2, y - h / 2, w, h, wall)}${r(x - w / 2, y - h / 2, w, h * 0.55, roof)}</g>`;
const gymM = (x, y, col) => c(x, y, 11, col, `stroke="${C.navy}" stroke-width="2"`) + c(x, y, 7, 'none', 'stroke="#ffffff" stroke-width="1.6"') + star(x, y, 4.2, 1.8, 5, '#ffffff');
const gateM = (x, y, s = 1) => c(x, y, 7 * s, 'url(#gBlue)') + pth(`M ${f(x - 4 * s)} ${f(y + 4 * s)} L ${f(x - 4 * s)} ${f(y - 1 * s)} A ${4 * s} ${4 * s} 0 0 1 ${f(x + 4 * s)} ${f(y - 1 * s)} L ${f(x + 4 * s)} ${f(y + 4 * s)}`, 'none', `stroke="#dbeafe" stroke-width="${1.4 * s}"`);
const lanternM = (x, y) => c(x, y, 4, '#ffd27a', 'opacity=".35"') + c(x, y, 1.8, '#ffb347', `stroke="${C.navy}" stroke-width=".6"`);
const windmillM = (x, y, s = 1) => r(x - 1.2 * s, y - 2 * s, 2.4 * s, 12 * s, '#f3e9d2') + pth(`M ${f(x)} ${f(y - 2 * s)} l 0 -8 M ${f(x)} ${f(y - 2 * s)} l 7 4 M ${f(x)} ${f(y - 2 * s)} l -7 4`, 'none', `stroke="#ffffff" stroke-width="${1.6 * s}" stroke-linecap="round"`) + c(x, y - 2 * s, 1.4 * s, '#8a5a2b');
const toriiM = (x, y, s = 1, col = '#d9412f') => r(x - 5 * s, y - 8 * s, 10 * s, 1.8 * s, col) + r(x - 4 * s, y - 5 * s, 8 * s, 1.4 * s, col) + r(x - 3.6 * s, y - 8 * s, 1.4 * s, 9 * s, col) + r(x + 2.2 * s, y - 8 * s, 1.4 * s, 9 * s, col);
const shipM = (x, y, s = 1, sail = '#f6f1e6') => `<g transform="rotate(-12 ${f(x)} ${f(y)})">${pth(`M ${f(x - 10 * s)} ${f(y)} L ${f(x + 10 * s)} ${f(y)} L ${f(x + 7 * s)} ${f(y + 5 * s)} L ${f(x - 7 * s)} ${f(y + 5 * s)} Z`, '#7a4a28')}${r(x - 0.8 * s, y - 12 * s, 1.6 * s, 12 * s, '#4b2e18')}${poly([[x, y - 12 * s], [x + 8 * s, y - 6 * s], [x, y - 1 * s]], sail)}</g>`;

// ------------------------------------------------------------------ MAP (unidades, dentro de um grupo escalado por K)
// ------------------------------------------------------------------ regiões: Voronoi ponderado recortado pela ilha
const REGIONS = [
	// id, semente, peso, chão
	['vila', [432, 662], 900, '#8fd06f'],
	['farol', [370, 540], 2600, '#c6e39a'],
	['floresta', [300, 470], -1800, '#2f5a3e'],
	['capsule', [236, 408], 0, '#9fd46a'],
	['ermos', [190, 304], 0, '#dcbc8c'],
	['dunas', [176, 168], 2200, '#ecd59a'],
	['vale', [336, 108], -600, '#7fb069'],
	['kamado', [470, 118], 0, '#eef3f7'],
	['glicinias', [574, 196], -1400, '#b1d58f'],
	['liga', [690, 270], 1400, '#a39686'],
	['aurea', [782, 106], 0, '#dfe3b0'],
	['portoes', [918, 196], 0, '#c3cbd4'],
	['amald', [948, 356], 0, '#6f6589'],
];
function clipHalf(poly, a, b, c0) {
	const out = [];
	for (let i = 0; i < poly.length; i++) {
		const P = poly[i], Q = poly[(i + 1) % poly.length], fp = a * P[0] + b * P[1] - c0, fq = a * Q[0] + b * Q[1] - c0;
		if (fp <= 0) out.push(P);
		if (fp <= 0 !== fq <= 0) { const t = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
	}
	return out;
}
const CELLS = REGIONS.map(([, [xi, yi], wi], i) => {
	let poly = [[-40, -40], [WW + 40, -40], [WW + 40, WH + 40], [-40, WH + 40]];
	REGIONS.forEach(([, [xj, yj], wj], j) => { if (j !== i) poly = clipHalf(poly, 2 * (xj - xi), 2 * (yj - yi), xj * xj + yj * yj - xi * xi - yi * yi - wj + wi); });
	return poly;
});
const wob = (x, y) => [x + 5 * noise(x * 0.031 + y * 0.017, 1.3), y + 5 * noise(y * 0.029 - x * 0.013, 2.7)];
function cellPath(poly) {
	const pts = [];
	for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6)); for (let k = 0; k < n; k++) pts.push(wob(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n)); }
	return 'M ' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join(' L ') + ' Z';
}
function pip(poly, x, y) { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; }
function distSeg(px, py, ax, ay, bx, by) { const l2 = (bx - ax) ** 2 + (by - ay) ** 2, t = l2 ? Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2)) : 0; return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))); }
function edgeDist(poly, x, y) { let d = 1e9; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; d = Math.min(d, distSeg(x, y, a[0], a[1], b[0], b[1])); } return d; }
function nearRoute(x, y, d) { for (const [, pts] of ROUTES) for (let i = 0; i < pts.length - 1; i++) if (distSeg(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < d) return true; for (let i = 0; i < RAIL.length - 1; i++) if (distSeg(x, y, RAIL[i][0], RAIL[i][1], RAIL[i + 1][0], RAIL[i + 1][1]) < d) return true; return false; }
// lugares com construção: nada de decoração espalhada em cima
const AVOID = [[...CITY.vila, 40], [...CITY.farol, 42], [...CITY.capsule, 52], [...CITY.dunas, 52], [...CITY.glicinias, 40], [...CITY.aurea, 44], [...CITY.portoes, 56], [...CITY.amald, 50], [...CITY.liga, 48], [...SUB.lago, 22], [...SUB.oasis, 16], [...SUB.circulo, 18], [...SUB.kamado, 16], [...SUB.coliseu, 22], [...SUB.masmorra, 18], [...SUB.caverna, 20], [...SUB.escola, 26], [270, 372, 18], [512, 98, 0]];
function scatter(id, n, seed, fn, o = {}) {
	const i = REGIONS.findIndex((rg) => rg[0] === id), poly = CELLS[i], q = rng(seed), placed = [];
	const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(WW, Math.max(...xs)), y0 = Math.max(0, Math.min(...ys)), y1 = Math.min(WH, Math.max(...ys));
	let out = '', tries = 0;
	while (placed.length < n && tries < n * 60) {
		tries++;
		const x = o.cx !== undefined ? o.cx + (q() * 2 - 1) * o.r : x0 + q() * (x1 - x0), y = o.cy !== undefined ? o.cy + (q() * 2 - 1) * o.r : y0 + q() * (y1 - y0);
		if (o.cx !== undefined && Math.hypot(x - o.cx, y - o.cy) > o.r) continue;
		if (!pip(poly, x, y) || edgeDist(poly, x, y) < (o.edge ?? 7) || !inLand(x, y, o.pad ?? 9) || nearRoute(x, y, o.route ?? 10)) continue;
		if (!o.ignoreAvoid && AVOID.some(([ax, ay, ar]) => Math.hypot(x - ax, y - ay) < ar)) continue;
		if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < (o.min ?? 8))) continue;
		placed.push([x, y]);
		out += fn(x, y, q);
	}
	return out;
}

// ------------------------------------------------------------------ peças do mapa (unidades)
const tuft = (x, y, col = '#5f9f4e') => pth(`M ${f(x - 2.5)} ${f(y)} l 1.2 -3 M ${f(x)} ${f(y)} l 0 -3.6 M ${f(x + 2.5)} ${f(y)} l -1.2 -3`, 'none', `stroke="${col}" stroke-width=".9" stroke-linecap="round"`);
const palm = (x, y, s = 1) => { let o = el(x + 2 * s, y + 2 * s, 7 * s, 3 * s, 'rgba(0,0,0,.18)'); for (let k = 0; k < 6; k++) { const a = k * 60 + 15; o += el(x + 4.5 * s * Math.cos(a * deg), y + 4.5 * s * Math.sin(a * deg), 5 * s, 1.8 * s, k % 2 ? '#3f9a4a' : '#5bbb63', `transform="rotate(${a} ${f(x + 4.5 * s * Math.cos(a * deg))} ${f(y + 4.5 * s * Math.sin(a * deg))})"`); } return o + c(x, y, 1.6 * s, '#8a5a2b'); };
const wisteria = (x, y, s = 1) => c(x + 1.5, y + 2, 7 * s, 'rgba(0,0,0,.18)') + c(x, y, 6.5 * s, '#9b7fd4') + c(x - 2.4 * s, y - 1.6 * s, 3.2 * s, '#c9b2f2') + c(x + 2.6 * s, y + 1.4 * s, 2.6 * s, '#b799ea') + c(x + 1 * s, y - 3 * s, 1.8 * s, '#e3d6ff');
const cypress = (x, y, s = 1) => el(x + 2, y + 3, 2.6 * s, 6 * s, 'rgba(0,0,0,.2)') + el(x, y, 2.6 * s, 6.5 * s, '#2f6b3a') + el(x - 0.8 * s, y - 2 * s, 1 * s, 3 * s, '#4f9c55');
const lemon = (x, y) => treeM(x, y, 0.85, '#4f9c55', '#7cc066') + c(x - 2, y + 1.5, 1.1, '#fde047') + c(x + 2, y - 1, 1.1, '#fde047') + c(x + 0.5, y + 2.6, 1, '#fde047');
const spire = (x, y, s = 1) => el(x + 5 * s, y + 4 * s, 7 * s, 3.5 * s, 'rgba(0,0,0,.22)') + r(x - 5 * s, y - 10 * s, 10 * s, 12 * s, '#a87d52') + el(x, y + 2 * s, 5 * s, 2.2 * s, '#a87d52') + el(x, y - 10 * s, 5 * s, 2.2 * s, '#d8b07e') + ln(x - 5 * s, y - 5 * s, x + 5 * s, y - 4 * s, '#8a6440', 0.8) + ln(x - 5 * s, y - 1 * s, x + 5 * s, y, '#8a6440', 0.8);
const crater = (x, y, s = 1) => el(x, y, 7 * s, 4.5 * s, '#c8a576') + el(x, y + 0.6 * s, 5 * s, 3 * s, '#b48f62');
const dragonBall = (x, y) => c(x, y, 5, '#ffb347', 'opacity=".35"') + c(x, y, 2.4, '#ff9a1f', `stroke="${C.navy}" stroke-width=".5"`) + star(x, y, 1.2, 0.5, 5, '#d92a1c');
const snowPine = (x, y, s = 1) => el(x + 2, y + 3, 4 * s, 2 * s, 'rgba(60,80,100,.18)') + poly([[x, y - 8 * s], [x + 5 * s, y + 3 * s], [x - 5 * s, y + 3 * s]], '#3f6e55') + poly([[x, y - 8 * s], [x + 2.4 * s, y - 2.6 * s], [x - 2.4 * s, y - 2.6 * s]], '#ffffff') + poly([[x - 3.8 * s, y + 0.6 * s], [x - 1 * s, y - 1 * s], [x + 1.5 * s, y + 0.6 * s]], '#ffffff', 'opacity=".8"');
const snowRock = (x, y) => el(x, y, 4, 2.6, '#c7d1da') + el(x - 0.6, y - 0.8, 3, 1.6, '#ffffff');
const peak = (x, y, h) => poly([[x - h * 0.9, y + h * 0.35], [x, y - h], [x + h * 0.9, y + h * 0.35]], C.rock, `stroke="${C.rockEdge}" stroke-width=".8"`) + poly([[x, y - h], [x + h * 0.9, y + h * 0.35], [x + h * 0.1, y + h * 0.35]], 'rgba(0,0,0,.14)') + poly([[x - h * 0.3, y - h * 0.4], [x, y - h], [x + h * 0.3, y - h * 0.4]], C.snow);
const dune = (x, y, s = 1) => pth(`M ${f(x - 12 * s)} ${f(y)} q ${f(12 * s)} ${f(-7 * s)} ${f(24 * s)} 0`, 'none', 'stroke="#cfb478" stroke-width="1.6" stroke-linecap="round"') + pth(`M ${f(x - 9 * s)} ${f(y + 2)} q ${f(9 * s)} ${f(-5 * s)} ${f(18 * s)} 0`, 'none', 'stroke="#f6e6b6" stroke-width="1" stroke-linecap="round"');
const rockS = (x, y, s = 1, col = '#b39a7c') => el(x + 1, y + 1.4, 3.6 * s, 2.2 * s, 'rgba(0,0,0,.18)') + el(x, y, 3.4 * s, 2.4 * s, col) + el(x - 0.8 * s, y - 0.8 * s, 1.6 * s, 1 * s, 'rgba(255,255,255,.35)');
const roofHouse = (x, y, w, h, roof, rot = 0, ridge = 'rgba(255,255,255,.35)') => `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${r(x - w / 2 + 1.2, y - h / 2 + 1.8, w, h, 'rgba(0,0,0,.22)')}${r(x - w / 2, y - h / 2, w, h, roof)}${ln(x - w / 2, y, x + w / 2, y, ridge, 0.9)}${r(x - w / 2, y, w, h / 2, 'rgba(0,0,0,.12)')}</g>`;
const tower = (x, y, w, h, col, sh = 1) => r(x - w / 2 + 2 * sh, y - h / 2 + 3 * sh, w, h, 'rgba(0,0,0,.25)') + r(x - w / 2, y - h / 2, w, h, col) + r(x - w / 2, y - h / 2, w, 1.4, 'rgba(255,255,255,.35)') + ln(x - w / 2 + 1, y, x + w / 2 - 1, y, 'rgba(0,0,0,.18)', 0.6) + ln(x, y - h / 2 + 1, x, y + h / 2 - 1, 'rgba(0,0,0,.18)', 0.6);
const dome = (x, y, rr, col = '#f6f7f9', inner = '#fde68a') => c(x + rr * 0.25, y + rr * 0.35, rr, 'rgba(0,0,0,.18)') + c(x, y, rr, col, 'stroke="#9aa5b1" stroke-width=".8"') + c(x, y, rr * 0.55, inner, 'opacity=".9"') + c(x - rr * 0.35, y - rr * 0.35, rr * 0.22, '#ffffff', 'opacity=".8"');
const sandDome = (x, y, rr) => c(x + rr * 0.3, y + rr * 0.35, rr, 'rgba(90,60,20,.22)') + c(x, y, rr, '#d9b878', 'stroke="#a8834f" stroke-width=".8"') + c(x - rr * 0.3, y - rr * 0.3, rr * 0.4, '#ecd29c') + r(x - 1, y + rr - 2.2, 2, 2.2, '#5a3d1e');
const ghost = (x, y, s = 1) => el(x, y, 4 * s, 3.4 * s, '#8b5cf6', 'opacity=".85"') + c(x - 1.4 * s, y - 0.6 * s, 0.8 * s, '#fff') + c(x + 1.4 * s, y - 0.6 * s, 0.8 * s, '#fff') + pth(`M ${f(x - 4 * s)} ${f(y + 1.5 * s)} l 1.3 2 1.3 -2 1.3 2 1.3 -2 1.3 2 1.3 -2`, 'none', `stroke="#8b5cf6" stroke-width="${0.8 * s}" opacity=".85"`);
const web = (x, y, rr) => { let o = ''; for (let k = 0; k < 8; k++) o += ln(x, y, x + rr * Math.cos(k * 45 * deg), y + rr * Math.sin(k * 45 * deg), '#ffffff', 0.5, 'opacity=".85"'); for (const q of [0.4, 0.7, 1]) o += c(x, y, rr * q, 'none', 'stroke="#ffffff" stroke-width=".45" opacity=".85"'); return o; };
const pirateShip = (x, y, s = 1, rot = 0) => `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${el(x + 1.5 * s, y + 2 * s, 13 * s, 4.5 * s, 'rgba(0,0,0,.2)')}${pth(`M ${f(x - 13 * s)} ${f(y)} Q ${f(x - 6 * s)} ${f(y - 5 * s)} ${f(x + 12 * s)} ${f(y - 1.5 * s)} L ${f(x + 12 * s)} ${f(y + 1.5 * s)} Q ${f(x - 6 * s)} ${f(y + 5 * s)} ${f(x - 13 * s)} ${f(y)} Z`, '#7a4a28')}${el(x - 1 * s, y, 9 * s, 2.6 * s, '#b07a44')}${r(x - 2 * s, y - 9 * s, 9 * s, 7 * s, '#f6f1e6', `rx="${s}"`)}${r(x - 0.6 * s, y - 13 * s, 5 * s, 3.4 * s, '#111827')}${c(x + 1.9 * s, y - 11.3 * s, 0.9 * s, '#ffffff')}${c(x + 12 * s, y, 1.8 * s, '#f6c445')}</g>`;
const skull = (x, y) => r(x - 3, y - 2, 6, 4, '#111827') + c(x, y - 0.2, 1, '#fff');
const gondola = (x, y, rot = 0) => `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${el(x, y, 6, 1.6, '#1f2937')}${el(x, y - 0.4, 4, 0.8, '#7f1d1d')}</g>`;

function drawMap() {
	let s = '';
	s += r(0, 0, WW, WH, 'url(#seaGrad)');
	for (let y = 20; y < WH; y += 28) { let d = ''; for (let x = 0; x <= WW; x += 12) d += `${x ? 'L' : 'M'} ${x} ${f(y + 3 * Math.sin(x / 19 + y))} `; s += pth(d, 'none', `stroke="${C.seaLine}" stroke-width=".8" opacity=".35"`); }
	// águas rasas turquesa na costa tropical (One Piece) e na ilha do Kame
	for (const [x, y, rr] of [[318, 560, 34], [330, 622, 26], [296, 600, 20], [62, 430, 26], [280, 640, 26]]) s += pth(blob(x, y, rr, 3, x * 0.01), '#5cc8d4', 'opacity=".55"');
	for (const [d, op] of [[18, 0.35], [34, 0.2]]) s += pth(coast(offsetPoly(LAND, d), 5, 2.2), 'none', `stroke="#9fd0f0" stroke-width="1" opacity="${op}"`);

	// ------ ilha: praia + recorte das regiões
	s += pth(coast(LAND, 5, 2.2), '#f0dfae', `stroke="#f0dfae" stroke-width="14" stroke-linejoin="round"`);
	const inner = coast(offsetPoly(LAND, -4), 4, 2.2);
	DEFS.push(`<clipPath id="landClip"><path d="${inner}"/></clipPath>`);
	let reg = '';
	REGIONS.forEach(([, , , col], i) => (reg += pth(cellPath(CELLS[i]), col)));
	// texturas de chão por região
	reg += scatter('vila', 60, 1, (x, y) => tuft(x, y, '#6aac52'), { min: 6, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('farol', 30, 2, (x, y) => pth(blob(x, y, 7, 1.5, x), '#f3e2a6', 'opacity=".9"'), { min: 10, pad: 4, route: 6, edge: 4, ignoreAvoid: true });
	reg += scatter('capsule', 50, 3, (x, y) => tuft(x, y, '#7dbb4f'), { min: 6, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('ermos', 26, 4, (x, y) => el(x, y, 6, 3, '#cfae7d', 'opacity=".8"'), { min: 9, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('dunas', 40, 5, (x, y) => dune(x, y, 0.8), { min: 16, pad: 8, route: 9, edge: 6, ignoreAvoid: true });
	reg += scatter('kamado', 40, 6, (x, y) => el(x, y, 5, 1.6, '#dbe4ec'), { min: 8, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('glicinias', 40, 7, (x, y) => tuft(x, y, '#86b366'), { min: 6, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('aurea', 30, 8, (x, y) => el(x, y, 5, 2.4, '#cfd394', 'opacity=".9"'), { min: 8, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('liga', 30, 9, (x, y) => rockS(x, y, 0.8, '#8f8376'), { min: 8, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	reg += scatter('amald', 60, 10, (x, y) => c(x, y, 1.2, '#8b7fb0', 'opacity=".7"'), { min: 6, pad: 6, route: 7, edge: 3, ignoreAvoid: true });
	// névoa amaldiçoada sobre a região do JJK
	const iA = REGIONS.findIndex((rg) => rg[0] === 'amald');
	reg += `<g opacity=".55">${pth(cellPath(CELLS[iA]), 'url(#gPurple)')}</g>`;
	// bordas entre regiões: degrau de barro
	REGIONS.forEach((_, i) => (reg += pth(cellPath(CELLS[i]), 'none', 'stroke="#5e4432" stroke-width="4.2" stroke-linejoin="round"')));
	REGIONS.forEach((_, i) => (reg += pth(cellPath(CELLS[i]), 'none', 'stroke="#b08a62" stroke-width="1.1" stroke-linejoin="round" opacity=".8"')));
	s += `<g clip-path="url(#landClip)">${reg}</g>`;
	s += pth(inner, 'none', 'stroke="#6b4c33" stroke-width="2.6"');

	// ------ rios
	const vale = 'M 486 150 Q 440 152 404 134 Q 366 118 340 112 L 326 104 Q 304 84 290 58';
	s += `<g clip-path="url(#landClip)">${pth(vale, 'none', 'stroke="#6b4c33" stroke-width="26" stroke-linecap="round"')}${pth(vale, 'none', 'stroke="#9b7a5a" stroke-width="21" stroke-linecap="round"')}${pth(vale, 'none', 'stroke="#4fb3d9" stroke-width="7" stroke-linecap="round"')}${pth(vale, 'none', 'stroke="#bfe9f7" stroke-width="1.2" stroke-dasharray="6 5" opacity=".8"')}</g>`;
	s += c(330, 108, 7, '#bfe9f7') + c(330, 108, 4, '#ffffff', 'opacity=".7"');
	for (let k = 0; k < 4; k++) s += ln(334 + k * 1.8, 100 - k, 330 + k * 1.8, 107 - k, '#ffffff', 0.9);
	// estátuas do Vale do Fim, uma de cada lado da cachoeira
	for (const [x, y, col] of [[316, 124, '#9aa3ad'], [346, 96, '#8c96a0']]) s += el(x + 2, y + 3, 6, 3, 'rgba(0,0,0,.25)') + el(x, y, 5, 7, col, `stroke="${C.rockEdge}" stroke-width=".8"`) + c(x, y - 6, 3, col, `stroke="${C.rockEdge}" stroke-width=".8"`);
	const han = 'M 858 262 Q 900 242 950 238 Q 985 234 1012 226';
	s += `<g clip-path="url(#landClip)">${pth(han, 'none', 'stroke="#4b7fa6" stroke-width="10" stroke-linecap="round"')}${pth(han, 'none', 'stroke="#6fb0d8" stroke-width="7" stroke-linecap="round"')}</g>`;
	for (const x of [900, 948, 988]) s += r(x - 1.6, 228, 3.2, 20, '#e5e7eb', `transform="rotate(-6 ${x} 238)"`);

	// ------ decoração por região (cada uma com a cara da série)
	s += scatter('vila', 16, 11, (x, y) => treeM(x, y, 0.95), { min: 12 }) + scatter('vila', 26, 12, (x, y) => c(x, y, 1.3, ['#f472b6', '#facc15', '#ffffff', '#fb7185'][Math.floor(x) % 4]), { min: 5 });
	s += scatter('farol', 22, 13, (x, y) => palm(x, y, 1), { min: 12 });
	s += scatter('floresta', 46, 14, (x, y, q) => c(x + 1, y + 1.4, 4.6, 'rgba(0,0,0,.25)') + c(x, y, 4.6, q() > 0.5 ? '#2a5340' : '#35634a') + c(x - 1.4, y - 1.4, 2, '#4b7d5c'), { min: 6, pad: 6, edge: 4 });
	s += scatter('floresta', 9, 15, (x, y) => lanternM(x, y), { min: 14 });
	s += scatter('capsule', 14, 16, (x, y) => treeM(x, y, 0.9, '#3f9a4a', '#6cc46d'), { min: 12 });
	s += scatter('ermos', 16, 17, (x, y, q) => spire(x, y, 0.8 + q() * 0.6), { min: 16 }) + scatter('ermos', 6, 18, (x, y) => crater(x, y, 1), { min: 18 });
	s += dragonBall(176, 268) + dragonBall(238, 288);
	s += scatter('dunas', 8, 19, (x, y) => rockS(x, y, 1, '#c9a56a'), { min: 20 });
	s += scatter('vale', 26, 20, (x, y) => treeM(x, y, 0.95, '#2f8a3f', '#5bbb63'), { min: 9 });
	s += scatter('kamado', 30, 21, (x, y, q) => snowPine(x, y, 0.9 + q() * 0.3), { min: 9 }) + scatter('kamado', 10, 22, (x, y) => snowRock(x, y), { min: 12 });
	s += scatter('glicinias', 7, 29, (x, y) => r(x - 9, y - 5, 18, 10, '#8fc0a0', 'rx="1.5" stroke="#6b8f4e" stroke-width="1.4"') + ln(x - 9, y, x + 9, y, '#6b8f4e', 1) + ln(x - 6, y - 3, x - 2, y - 3, '#d9f0ff', 0.8, 'opacity=".8"'), { min: 26, cx: 590, cy: 300, r: 70 });
	s += scatter('glicinias', 34, 23, (x, y, q) => wisteria(x, y, 0.85 + q() * 0.3), { min: 12 });
	s += scatter('liga', 34, 24, (x, y, q) => peak(x, y, 9 + q() * 10), { min: 12, edge: 6 });
	s += scatter('aurea', 14, 25, (x, y) => cypress(x, y, 1), { min: 10 }) + scatter('aurea', 10, 26, (x, y) => lemon(x, y), { min: 12 });
	s += scatter('portoes', 10, 27, (x, y) => treeM(x, y, 0.8, '#4b8a5a', '#6cae78'), { min: 12 });
	s += scatter('amald', 12, 28, (x, y) => ghost(x, y, 0.9), { min: 16 });

	// ------ Vila Verdejante: casinhas, laboratório, plantação, lago
	{
		const [x, y] = CITY.vila;
		for (const [fx, fy, w, h] of [[x + 14, y + 18, 28, 16], [x - 42, y + 16, 24, 14]]) { s += r(fx, fy, w, h, '#b88a55', 'rx="2"'); for (let k = 2; k < h; k += 3.6) s += ln(fx + 1, fy + k, fx + w - 1, fy + k, '#7fb35a', 1.6); }
		for (const [dx, dy, roof] of [[-14, -10, '#d9412f'], [2, -16, '#2d9bf0'], [16, -6, '#d9412f'], [-6, 4, '#f2c230']]) s += houseM(x + dx, y + dy, 11, 9, roof);
		s += r(x + 22, y - 30, 20, 13, '#f8fafc', 'rx="1.5" stroke="#94a3b8" stroke-width="1"') + r(x + 24, y - 28, 16, 4, '#60a5fa') + c(x + 40, y - 32, 1.4, '#ef4444');
		s += windmillM(x - 30, y - 18, 0.9);
		s += pth(blob(SUB.lago[0], SUB.lago[1], 17, 2.5, 8.1), C.water, 'stroke="#3d93b8" stroke-width="1.6"') + el(SUB.lago[0] - 6, SUB.lago[1] - 6, 5, 2.2, '#bfe9f7', 'opacity=".6"');
	}
	// ------ Cidade Farol (One Piece): praia tropical, cais, navios piratas, farol
	{
		const [x, y] = CITY.farol;
		s += r(x - 38, y - 10, 24, 4, '#a9865e') + r(x - 34, y + 12, 22, 4, '#a9865e');
		for (const [dx, dy] of [[-36, -6], [-28, -6], [-32, 16], [-24, 16]]) s += r(x + dx, y + dy, 2.4, 5, '#7a4a28');
		s += pirateShip(x - 62, y - 8, 1, -8) + pirateShip(x - 56, y + 22, 0.8, 6);
		for (const [dx, dy, roof] of [[-6, -18, '#2d9bf0'], [8, -24, '#f97316'], [20, -12, '#22c55e'], [-2, 2, '#f2c230'], [14, 6, '#ec4899'], [26, 2, '#2d9bf0']]) s += houseM(x + dx, y + dy, 11, 8, roof);
		s += c(x - 26, y + 30, 3.4, '#7a4a28') + c(x - 20, y + 32, 3, '#7a4a28'); // barris
		s += r(x - 26, y - 40, 4, 16, '#f3f4f6') + r(x - 26, y - 36, 4, 3.5, '#ef4444') + r(x - 26, y - 29, 4, 3.5, '#ef4444') + c(x - 24, y - 42, 2.6, '#fde68a') + c(x - 24, y - 42, 9, '#fde68a', 'opacity=".25"');
		s += skull(x + 30, y - 30) + r(x + 26.6, y - 30, 0.8, 10, '#4b2e18');
		s += gymM(x + 30, y + 22, TYPE.agua);
	}
	// ------ Capsule City (Dragon Ball): domos, Capsule Corp., ringue do torneio
	{
		const [x, y] = CITY.capsule;
		s += c(x, y, 46, '#e6eaef', 'stroke="#c3cad4" stroke-width="2"') + c(x, y, 31, 'none', 'stroke="#cfd6de" stroke-width="4"');
		for (const [dx, dy, rr] of [[-30, -18, 8], [-34, 10, 7], [-16, 30, 8], [14, 32, 7], [32, 16, 8], [34, -12, 7], [16, -32, 8], [-12, -34, 7]]) s += dome(x + dx, y + dy, rr);
		s += dome(x, y, 14, '#ffffff', '#fbbf24') + T(x, y + 2.3, 'CC', { size: 6.5, weight: 800, anchor: 'middle', fill: '#1f2937', halo: false });
		for (const [a, col] of [[30, '#ef4444'], [150, '#3b82f6'], [260, '#22c55e']]) s += el(x + 31 * Math.cos(a * deg), y + 31 * Math.sin(a * deg), 3, 1.8, col, `stroke="${C.navy}" stroke-width=".5"`);
		s += gymM(x + 44, y - 30, TYPE.martial);
		// ringue do Torneio de Artes Marciais
		const [tx, ty] = [270, 372];
		s += c(tx, ty, 17, '#efcf86', 'stroke="#a9853c" stroke-width="1.5"') + r(tx - 9, ty - 9, 18, 18, '#f4e7c3', 'stroke="#3f3f46" stroke-width="1"');
		for (let k = 1; k < 3; k++) s += ln(tx - 9 + k * 6, ty - 9, tx - 9 + k * 6, ty + 9, '#d9c89a', 0.7) + ln(tx - 9, ty - 9 + k * 6, tx + 9, ty - 9 + k * 6, '#d9c89a', 0.7);
		// círculo de pedra nos ermos
		for (let i = 0; i < 8; i++) { const a = i * 45; s += r(SUB.circulo[0] + 12 * Math.cos(a * deg) - 1.8, SUB.circulo[1] + 8 * Math.sin(a * deg) - 2.6, 3.6, 5.2, '#8a8f98', `stroke="${C.rockEdge}" stroke-width=".6"`); }
	}
	// ------ Casa do Kame: ilhota no mar a oeste
	{
		const [x, y] = SUB.kame;
		s += pth(blob(x, y, 11, 1.2, 4.4), '#f3e2a6') + r(x - 4, y - 5, 9, 7, '#f472b6', 'stroke="#9d174d" stroke-width=".6"') + r(x - 4.6, y - 6, 10, 2.4, '#dc2626') + palm(x + 6, y + 3, 0.6);
	}
	// ------ Cidade das Dunas (Naruto): muralha de areia, domos, torre do Kazekage, oásis
	{
		const [x, y] = CITY.dunas;
		s += c(x, y, 44, '#e5c98d') + c(x, y, 44, 'none', 'stroke="#a8834f" stroke-width="9"') + c(x, y, 44, 'none', 'stroke="#c9a56a" stroke-width="6"');
		for (const [dx, dy, rr] of [[-24, -18, 6], [-10, -28, 5], [10, -26, 6], [26, -14, 5], [-28, 4, 5], [-18, 22, 6], [2, 28, 5], [22, 20, 6], [30, 2, 5], [-8, 10, 4.5], [12, 10, 4.5]]) s += sandDome(x + dx, y + dy, rr);
		s += sandDome(x, y - 6, 10) + c(x, y - 6, 3, '#dc2626', `stroke="${C.navy}" stroke-width=".6"`);
		for (const [a, b2] of [[[x - 70, y - 40], [x - 40, y - 60]], [[x + 54, y + 40], [x + 80, y + 20]]]) s += pth(`M ${a[0]} ${a[1]} Q ${(a[0] + b2[0]) / 2 + 10} ${(a[1] + b2[1]) / 2 + 10} ${b2[0]} ${b2[1]}`, 'none', 'stroke="#f6e6b6" stroke-width="2" stroke-dasharray="6 4" opacity=".9"');
		const [ox, oy] = SUB.oasis;
		s += pth(blob(ox, oy, 11, 1.5, 6.6), C.water, 'stroke="#3d93b8" stroke-width="1.2"') + palm(ox - 12, oy - 6, 0.7) + palm(ox + 12, oy - 4, 0.7) + palm(ox, oy + 12, 0.6);
		s += gymM(x + 34, y + 40, TYPE.vento);
	}
	// ------ Monte Kamado (Demon Slayer): cabana de carvão na neve e a teia do Monte Natagumo
	{
		const [x, y] = SUB.kamado;
		s += roofHouse(x, y, 13, 9, '#4a3a2c') + c(x + 4, y - 9, 3, 'rgba(120,120,120,.5)') + c(x + 7, y - 15, 2.4, 'rgba(120,120,120,.4)');
		for (const [dx, dy] of [[-6, 8], [-2, 9], [2, 8]]) s += r(x + dx, y + dy, 2.6, 1.6, '#1f2937');
		const [nx, ny] = SUB.natagumo;
		for (const [dx, dy] of [[-12, -6], [10, -8], [0, 8], [-14, 10], [14, 8]]) s += c(nx + dx, ny + dy, 5, '#3c4c48') + c(nx + dx - 1.4, ny + dy - 1.4, 2.2, '#56685f');
		s += web(nx - 2, ny - 2, 8) + web(nx + 12, ny + 6, 5);
	}
	// ------ Vila das Glicínias (Demon Slayer): casas de madeira, torii, mansão das borboletas
	{
		const [x, y] = CITY.glicinias;
		for (const [dx, dy] of [[-18, -10], [-2, -16], [14, -8], [-12, 8], [6, 6]]) s += roofHouse(x + dx, y + dy, 13, 9, '#3f3a40', 0, 'rgba(255,255,255,.25)');
		for (let k = 0; k < 3; k++) s += toriiM(x - 30 + k * 6, y + 26 - k * 4, 0.8);
		s += roofHouse(x + 30, y + 22, 18, 12, '#6b4a3a') + c(x + 24, y + 12, 1.6, '#60a5fa') + c(x + 36, y + 14, 1.4, '#93c5fd') + c(x + 40, y + 28, 1.6, '#60a5fa');
		s += gymM(x + 30, y - 22, TYPE.fogo);
	}
	// ------ Liga dos Vanguardas: platô verde no meio da serra, torre e o Caminho da Vitória
	{
		const [x, y] = CITY.liga;
		s += pth(blob(x, y, 40, 3, 2.2), '#5e4432') + pth(blob(x, y, 37, 3, 2.2), '#9bc77e');
		for (const [dx, dy] of [[-26, -14], [24, -16], [-24, 18], [26, 16]]) s += treeM(x + dx, y + dy, 0.8);
		s += c(x, y, 20, '#d6ceb9', 'stroke="#a99f88" stroke-width="1.5"') + poly([[x, y - 18], [x + 11, y + 6], [x + 5, y + 12], [x - 5, y + 12], [x - 11, y + 6]], '#b91c1c', `stroke="${C.gold}" stroke-width="1.8"`) + star(x, y + 1, 5.5, 2.4, 5, C.gold);
		const [cx2, cy2] = SUB.caverna;
		s += pth(blob(cx2, cy2, 14, 2, 1.5), '#6e5f50', `stroke="${C.rockEdge}" stroke-width="1"`) + pth(`M ${cx2 - 8} ${cy2 + 5} A 8 7 0 0 1 ${cx2 + 8} ${cy2 + 5} Z`, '#1d140e') + r(cx2 - 10, cy2 + 1, 2.4, 5, '#8a5a2b') + r(cx2 + 7.6, cy2 + 1, 2.4, 5, '#8a5a2b');
	}
	// ------ Cidade Áurea (JoJo): telhados de terracota, Coliseu, porto com gôndolas, costa de pedra
	{
		const [x, y] = CITY.aurea;
		const q = rng(51);
		for (let gx = -36; gx <= 36; gx += 12) for (let gy = -26; gy <= 26; gy += 10) { if (Math.hypot(gx, gy * 1.3) > 40 || Math.hypot(gx, gy) < 11 || q() < 0.12) continue; s += roofHouse(x + gx + (q() - 0.5) * 2, y + gy + (q() - 0.5) * 2, 9 + q() * 2, 7, ['#c2410c', '#ea580c', '#b45309', '#dc6b3c'][Math.floor(q() * 4)], q() > 0.7 ? 90 : 0); }
		s += c(x, y, 8, '#e9ddc5', 'stroke="#a89c86" stroke-width="1"') + star(x, y, 4, 1.6, 5, C.gold);
		const [cx2, cy2] = SUB.coliseu;
		s += el(cx2 + 2, cy2 + 3, 17, 12, 'rgba(0,0,0,.2)') + el(cx2, cy2, 17, 12, '#d6c4a0', 'stroke="#8a7458" stroke-width="1.2"') + el(cx2, cy2, 17, 12, 'none', 'stroke="#a88f6a" stroke-width="2.4" stroke-dasharray="1.6 1.6"') + el(cx2, cy2, 10, 6.5, '#ead9b0', 'stroke="#8a7458" stroke-width=".8"');
		s += pth(`M ${cx2 + 10} ${cy2 - 9} A 17 12 0 0 1 ${cx2 + 17} ${cy2}`, 'none', 'stroke="#dfe3b0" stroke-width="3"'); // parte desabada
		const [kx, ky] = SUB.costa;
		for (let px = kx - 40; px < kx + 40; px += 6) s += ln(px, ky - 6 + 2 * Math.sin(px / 9), px + 3, ky + 8 + 2 * Math.sin(px / 9), C.rockEdge, 1.2, 'opacity=".7"');
		s += gondola(770, 30, -10) + gondola(796, 26, 8) + gondola(744, 26, 4);
		s += gymM(x + 36, y + 24, TYPE.terra);
	}
	// ------ Cidade dos Portões (Solo Leveling): arranha-céus, Associação dos Caçadores, portões, Masmorra Dupla, Ilha de Jeju
	{
		const [x, y] = CITY.portoes;
		const q = rng(61);
		for (let gx = -48; gx <= 44; gx += 13) for (let gy = -44; gy <= 30; gy += 13) { const bx = x + gx, by = y + gy; if (Math.hypot(gx, gy) > 52 || Math.abs(by - (238 - (bx - 900) * 0.05)) < 9) continue; s += tower(bx, by, 9 + q() * 2, 9 + q() * 2, ['#64748b', '#94a3b8', '#475569', '#7b8ba1'][Math.floor(q() * 4)], 0.6 + q() * 0.8); }
		s += tower(x + 6, y - 8, 12, 12, '#1e293b', 2) + r(x + 2, y - 12, 8, 8, '#f6c445', 'opacity=".9"');
		for (const [gx, gy, sc] of [[x - 34, y - 26, 1.2], [x + 30, y + 22, 1], [x - 10, y + 32, 0.9]]) s += gateM(gx, gy, sc);
		s += c(x + 40, y - 30, 7, '#ef4444', 'opacity=".35"') + c(x + 40, y - 30, 4.5, '#b91c1c', 'stroke="#fecaca" stroke-width="1.2"'); // portão vermelho
		const [mx, my] = SUB.masmorra;
		s += c(mx, my, 16, 'url(#gDark)') + r(mx - 9, my - 9, 18, 18, '#3f3f46', 'stroke="#9ca3af" stroke-width="1"') + r(mx - 5, my - 5, 10, 10, '#52525b') + c(mx, my - 1, 2.6, '#9ca3af') + c(mx, my - 1, 1, '#ef4444');
		const [jx, jy] = SUB.jeju;
		s += pth(blob(jx, jy, 15, 1.6, 7.7), '#f0dfae') + pth(blob(jx, jy, 11, 1.4, 7.7), '#7fb069');
		for (const [dx, dy] of [[-4, -3], [4, 2], [-2, 5]]) s += el(jx + dx, jy + dy, 3, 2, '#7a4a28') + c(jx + dx, jy + dy - 0.6, 0.8, '#1d140e');
		s += gymM(x - 46, y + 4, TYPE.sombra);
	}
	// ------ Cidade Amaldiçoada (JJK): prédios escuros, cruzamento de Shibuya, Escola Jujutsu, cúpula do domínio
	{
		const [x, y] = CITY.amald;
		const q = rng(71);
		for (let gx = -40; gx <= 40; gx += 12) for (let gy = -36; gy <= 36; gy += 12) { if (Math.hypot(gx, gy) > 44 || (Math.abs(gx) < 10 && Math.abs(gy) < 10)) continue; s += tower(x + gx, y + gy, 9, 9, ['#3b3354', '#4a4066', '#2e2842'][Math.floor(q() * 3)], 0.8 + q()); if (q() > 0.5) s += r(x + gx - 2, y + gy - 2, 1.6, 1.6, '#f0abfc'); }
		s += r(x - 9, y - 9, 18, 18, '#3f3f46');
		for (let k = -7; k <= 7; k += 2.4) s += r(x + k, y - 9, 1.2, 4, '#e5e7eb') + r(x + k, y + 5, 1.2, 4, '#e5e7eb') + r(x - 9, y + k, 4, 1.2, '#e5e7eb') + r(x + 5, y + k, 4, 1.2, '#e5e7eb');
		const [ex, ey] = SUB.escola;
		s += pth(blob(ex, ey, 20, 2, 9.1), '#2f5a3e');
		for (const [dx, dy] of [[-14, -6], [12, -10], [14, 8], [-12, 10]]) s += c(ex + dx, ey + dy, 4, '#3f7a52');
		s += roofHouse(ex, ey - 2, 14, 9, '#7c2d12') + toriiM(ex, ey + 14, 0.8);
		s += c(x + 30, y + 36, 11, 'url(#gDark)') + c(x + 30, y + 36, 7, '#0b0612', 'stroke="#c4a5ff" stroke-width="1"') + c(x + 30, y + 36, 1.8, '#fff');
		s += gymM(x + 40, y - 30, TYPE.onirico);
	}
	// ------ Estação Astral (Star Rail): estação espacial flutuando na baía
	{
		const [x, y] = CITY.astral;
		const q = rng(31);
		for (let i = 0; i < 40; i++) { const a = q() * 360, d = 36 + q() * 34; s += c(x + d * Math.cos(a * deg), y + d * Math.sin(a * deg) * 0.8, 0.5 + q(), '#fff', `opacity="${0.4 + q() * 0.5}"`); }
		s += c(x, y, 34, '#1b1740', 'opacity=".55"') + el(x, y + 2, 28, 18, '#2a2553', 'stroke="#9fa8ff" stroke-width="1.5"') + el(x, y + 2, 34, 22, 'none', 'stroke="#c7cbff" stroke-width="1" stroke-dasharray="3 3"');
		for (const [dx, dy] of [[-22, 2], [22, 2], [0, 16], [0, -12]]) s += r(x + dx - 5, y + dy - 3, 10, 6, '#4b4a8a', 'rx="1.5" stroke="#c7cbff" stroke-width=".7"');
		s += c(x, y + 2, 7, '#fde68a') + c(x, y + 2, 3.4, '#fff');
		s += gymM(x + 26, y - 18, TYPE.raio);
	}
	// ------ Ilha do Navio (naufrágio do One Piece)
	{
		const [x, y] = SUB.ilhanavio;
		s += pth(blob(x, y, 17, 2, 11.3), '#f3e2a6') + pth(blob(x, y, 10, 1.5, 11.3), '#c6e39a') + palm(x - 5, y - 2, 0.7) + pirateShip(x + 12, y + 8, 0.6, 35);
	}
	// ------ Ilha Crescente: o Mundo dos Sonhos, dentro da baía
	{
		const [cx2, cy2] = DREAM;
		s += c(cx2, cy2, 46, 'url(#gPink)', 'opacity=".45"');
		s += pth(`M ${cx2} ${cy2 - 36} A 36 36 0 1 0 ${cx2} ${cy2 + 36} A 25 25 0 1 1 ${cx2} ${cy2 - 36} Z`, '#f0dfae', 'stroke="#f0dfae" stroke-width="5" stroke-linejoin="round"');
		s += pth(`M ${cx2} ${cy2 - 33} A 33 33 0 1 0 ${cx2} ${cy2 + 33} A 24 24 0 1 1 ${cx2} ${cy2 - 33} Z`, '#8ed9a8');
		s += pth(`M ${cx2 - 3} ${cy2 - 26} A 26 26 0 1 0 ${cx2 - 3} ${cy2 + 26} A 19 19 0 1 1 ${cx2 - 3} ${cy2 - 26} Z`, '#6b4a8a', 'opacity=".55"');
		for (const [dx, dy] of [[-27, -8], [-19, 15], [-29, 4]]) s += c(cx2 + dx, cy2 + dy, 2.6, '#ff7ad9', 'opacity=".8"') + sparkle(cx2 + dx, cy2 + dy, 0.5, '#fff');
		s += el(cx2 - 21, cy2 - 21, 6, 3.5, '#8fb8ff') + c(cx2 - 24, cy2 - 24, 2.2, '#8fb8ff') + T(cx2 - 13, cy2 - 25, 'z', { size: 5.5, weight: 800, fill: '#fff', halo: false });
	}

	// ------ rotas: trilhas de terra com mato alto dos lados
	let rd = '';
	for (const [, pts] of ROUTES) rd += 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ') + ' ';
	s += pth(rd, 'none', `stroke="#5e4432" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"`) + pth(rd, 'none', `stroke="#e6d3a6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"`) + pth(rd, 'none', `stroke="#c9b383" stroke-width="1" stroke-dasharray="2 4" stroke-linecap="round"`);
	for (const [, pts] of ROUTES) for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0); for (let t = 12; t < len - 10; t += 15) { const x = x0 + ((x1 - x0) * t) / len, y = y0 + ((y1 - y0) * t) / len, side = (Math.floor(t / 15) % 2) * 2 - 1, nx = ((y1 - y0) / len) * 7.5 * side, ny = (-(x1 - x0) / len) * 7.5 * side; s += c(x + nx, y + ny, 3, '#4f9c55') + c(x + nx + 2.2, y + ny + 1.4, 2.2, '#5fae5a'); } }
	s += r(372, 116, 14, 9, '#8a5a2b', 'transform="rotate(14 379 120)" stroke="#5e4432" stroke-width=".8"'); // ponte do Vale do Fim
	// Expresso Astral: trilho sobre a baía
	const railD = 'M ' + RAIL.map((p) => `${p[0]} ${p[1]}`).join(' L ');
	for (let i = 0; i < RAIL.length - 1; i++) { const [x0, y0] = RAIL[i], [x1, y1] = RAIL[i + 1], len = Math.hypot(x1 - x0, y1 - y0); for (let t = 10; t < len; t += 18) s += r(x0 + ((x1 - x0) * t) / len - 1.5, y0 + ((y1 - y0) * t) / len, 3, 8, '#4a3a2c'); }
	s += pth(railD, 'none', `stroke="${C.deck}" stroke-width="6"`) + pth(railD, 'none', `stroke="${C.tie}" stroke-width="6" stroke-dasharray="1.6 3.4"`) + pth(railD, 'none', `stroke="${C.rail}" stroke-width="1"`);
	s += `<g transform="translate(866 352) rotate(-65)">${r(-9, -4.5, 18, 9, '#2a1b55', `rx="2" stroke="${C.gold}" stroke-width="1"`)}${r(-6, -2.5, 4, 3, '#fde68a')}${r(0, -2.5, 4, 3, '#fde68a')}${c(-12, 0, 1.6, '#fff')}</g>`;
	s += pth('M 332 566 Q 300 600 292 626', 'none', 'stroke="#eaf6ff" stroke-width="1.4" stroke-dasharray="4 3"');
	s += pth('M 124 404 Q 96 412 74 424', 'none', 'stroke="#eaf6ff" stroke-width="1.4" stroke-dasharray="4 3"');

	// grade
	let gl = '';
	for (let x = 50; x < WW; x += 50) gl += `M ${x} 0 V ${WH} `;
	for (let y = 50; y < WH; y += 50) gl += `M 0 ${y} H ${WW} `;
	s += pth(gl, 'none', 'stroke="#ffffff" stroke-width=".5" opacity=".06"');
	return s;
}


// ------------------------------------------------------------------ labels (px)
const SERIES = {
	vila: { n: 1, title: 'VILA VERDEJANTE', serie: 'início · Lab da Mina', type: 'normal' },
	farol: { n: 2, title: 'CIDADE FAROL', serie: 'One Piece · ginásio 1', type: 'agua' },
	capsule: { n: 3, title: 'CAPSULE CITY', serie: 'Dragon Ball · ginásio 2', type: 'martial' },
	dunas: { n: 4, title: 'CIDADE DAS DUNAS', serie: 'Naruto · ginásio 3', type: 'vento' },
	glicinias: { n: 5, title: 'VILA DAS GLICÍNIAS', serie: 'Demon Slayer · ginásio 4', type: 'fogo' },
	aurea: { n: 6, title: 'CIDADE ÁUREA', serie: 'JoJo · ginásio 5', type: 'terra' },
	portoes: { n: 7, title: 'CIDADE DOS PORTÕES', serie: 'Solo Leveling · ginásio 6', type: 'sombra' },
	astral: { n: 8, title: 'ESTAÇÃO ASTRAL', serie: 'Star Rail · ginásio 7', type: 'raio' },
	amald: { n: 9, title: 'CIDADE AMALDIÇOADA', serie: 'Jujutsu Kaisen · ginásio 8', type: 'onirico' },
	liga: { n: 10, title: 'LIGA DOS VANGUARDAS', serie: 'Torre · final', type: 'martial' },
};
function regLabel(key, px, py, anchor = 'start') {
	const d = SERIES[key], col = TYPE[d.type], dir = anchor === 'end' ? -1 : 1;
	return badge(px, py - 6, d.n, col) + T(px + 20 * dir, py, d.title, { size: 17, weight: 800, ls: 0.5, anchor }) + T(px + 20 * dir, py + 16, d.serie, { size: 12.5, weight: 700, fill: d.serie.includes('início') || d.serie.includes('Torre') ? C.dim : '#ffe9a3', anchor });
}
function drawMapLabels() {
	let s = '';
	s += regLabel('vila', X(488), Y(650));
	s += regLabel('farol', X(290), Y(546), 'end');
	s += regLabel('capsule', X(150), Y(400), 'end');
	s += regLabel('dunas', X(100), Y(258));
	s += regLabel('glicinias', X(500), Y(254));
	s += regLabel('aurea', X(730), Y(44));
	s += regLabel('portoes', X(846), Y(214), 'end');
	s += regLabel('astral', X(744), Y(500));
	s += regLabel('amald', X(872), Y(410));
	s += regLabel('liga', X(608), Y(312));
	const small = (x, y, t, o = {}) => (s += T(X(x), Y(y), t, { size: 10.5, weight: 700, anchor: 'middle', ...o }));
	small(446, 612, 'Lago Espelhado', { anchor: 'start' }); small(300, 506, 'Floresta das Lanternas'); small(222, 324, 'Círculo de Pedra', { anchor: 'start' }); small(232, 254, 'Oásis'); small(186, 104, 'DESERTO DE VIDRO', { size: 11, fill: '#5a3d1e', halo: false, ls: 1.5 });
	small(160, 356, 'ERMOS ROCHOSOS', { size: 10.5, fill: '#5a3d1e', halo: false, ls: 1.2 }); small(270, 398, 'ringue do torneio', { size: 9.5 }); small(62, 452, 'Casa do Kame', { size: 9.5 });
	small(330, 150, 'Vale do Fim'); small(470, 64, 'MONTE KAMADO', { size: 11, fill: '#334155', halo: false, ls: 1.5 }); small(520, 172, 'Monte Natagumo', { size: 9.5 }); small(488, 84, 'cabana', { size: 9 });
	small(728, 192, 'Coliseu', { size: 9.5 }); small(650, 66, 'Costa de Pedra', { anchor: 'end' }); small(964, 148, 'Masmorra Dupla'); small(1036, 98, 'Ilha de Jeju', { size: 9.5 }); small(940, 262, 'Rio Han', { size: 9.5, fill: '#dbeafe' }); small(790, 294, 'Caminho da Vitória (caverna)');
	small(280, 666, 'Ilha do Navio'); small(828, 348, 'Expresso Astral (R12)', { anchor: 'end' }); small(700, 330, 'SERRA DO MEIO', { size: 11, fill: '#efe6da', ls: 2 });
	small(700, 646, 'MUNDO DOS SONHOS', { size: 11, fill: '#ffd0f0', ls: 1 }); small(700, 658, 'Ilha Crescente · entra dormindo', { size: 9, fill: '#ffd0f0' });
	small(898, 290, 'Escola Jujutsu', { size: 9.5 }); small(946, 400, 'Shibuya', { size: 9.5, fill: '#f5d0fe' }); small(596, 236, 'mansão das borboletas', { size: 9 });
	// números das rotas
	for (const [n, pts] of ROUTES) { const a = pts[0], b = pts[pts.length - 1], mid = pts.length === 3 ? pts[1] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; s += c(X(mid[0]), Y(mid[1]), 11, '#fff7d6', `stroke="${C.navy}" stroke-width="1.6"`) + T(X(mid[0]), Y(mid[1]) + 4, 'R' + n, { size: 10, weight: 800, anchor: 'middle', fill: C.navy, halo: false }); }
	s += c(X(866), Y(352), 11, '#fff7d6', `stroke="${C.navy}" stroke-width="1.6"`) + T(X(866), Y(352) + 4, 'R12', { size: 10, weight: 800, anchor: 'middle', fill: C.navy, halo: false });
	// régua
	for (let x = 0; x <= WW; x += 50) { s += ln(X(x), MY - (x % 100 ? 5 : 9), X(x), MY - 1, C.dim, 1.2); if (x % 100 === 0) s += T(X(x), MY - 13, String(x / 100) + ' km', { size: 11, weight: 700, anchor: 'middle', fill: C.dim, halo: false }); }
	for (let y = 0; y <= WH; y += 50) { s += ln(MX - (y % 100 ? 5 : 9), Y(y), MX - 1, Y(y), C.dim, 1.2); if (y % 100 === 0) s += T(MX - 12, Y(y) + 4, String(y / 100), { size: 11, weight: 700, anchor: 'end', fill: C.dim, halo: false }); }
	return s;
}

// ------------------------------------------------------------------ vignettes (343 x 166)
const VW = 343, VH = 166;
function avatar(x, y, s, shirt, pants = '#2b3a55', o = {}) {
	const skin = o.skin || '#f5c84c';
	const legW = 4.3 * s, legH = 8.5 * s, tw = 9 * s, th = 9 * s, aw = 3.9 * s, hw = 7 * s, hh = 6.6 * s;
	const ay = y - legH - th;
	let q = '';
	if (o.tool === 'sword') q += ln(x + tw / 2 + aw / 2, ay + th * 0.6, x + tw / 2 + 12 * s, ay - 10 * s, o.toolColor || '#cfd6de', 2 * s, 'stroke-linecap="round"') + ln(x + tw / 2 + 1 * s, ay + 1 * s, x + tw / 2 + 6 * s, ay - 2 * s, '#8a5a2b', 2.4 * s);
	if (o.tool === 'dagger') q += ln(x + tw / 2 + aw / 2, ay + th * 0.6, x + tw / 2 + 8 * s, ay - 2 * s, '#7a86c9', 2 * s, 'stroke-linecap="round"');
	if (o.tool === 'blade') q += ln(x + tw / 2 + aw / 2, ay + th * 0.6, x + tw / 2 + 12 * s, ay + th * 0.2, '#cfd6de', 1.8 * s, 'stroke-linecap="round"') + ln(x - tw / 2 - aw / 2, ay + th * 0.6, x - tw / 2 - 12 * s, ay + th * 0.2, '#cfd6de', 1.8 * s, 'stroke-linecap="round"');
	q += r(x - tw / 2, y - legH, legW, legH, pants) + r(x + tw / 2 - legW, y - legH, legW, legH, pants);
	q += r(x - tw / 2, ay, tw, th, shirt);
	if (o.belt) q += r(x - tw / 2, ay + th - 2 * s, tw, 2 * s, o.belt);
	if (o.wave) q += r(x - tw / 2 - aw, ay - th + 1 * s, aw, th, skin, `transform="rotate(20 ${f(x - tw / 2)} ${f(ay)})"`);
	else if (o.punch) q += r(x - tw / 2 - aw - 6 * s, ay + 1 * s, aw + 6 * s, aw, skin);
	else q += r(x - tw / 2 - aw, ay, aw, th, skin);
	q += r(x + tw / 2, ay, aw, th, skin);
	const hy = ay - hh - 0.4 * s;
	q += r(x - hw / 2, hy, hw, hh, skin, `rx="${f(1.6 * s)}"`);
	if (o.hair) q += pth(`M ${f(x - hw / 2 - 0.6 * s)} ${f(hy + 2.4 * s)} L ${f(x - hw / 2 - 0.6 * s)} ${f(hy - 0.4 * s)} Q ${f(x)} ${f(hy - 3.4 * s)} ${f(x + hw / 2 + 0.6 * s)} ${f(hy - 0.4 * s)} L ${f(x + hw / 2 + 0.6 * s)} ${f(hy + 2.4 * s)} Z`, o.hair);
	if (o.spiky) for (let i = -2; i <= 2; i++) q += poly([[x + i * 1.6 * s - 1 * s, hy], [x + i * 1.6 * s, hy - 4.2 * s - Math.abs(i) * 0.4 * s], [x + i * 1.6 * s + 1 * s, hy]], o.spiky);
	if (o.blindfold) q += r(x - hw / 2 - 0.4 * s, hy + 1.6 * s, hw + 0.8 * s, 2.4 * s, '#111827');
	else q += c(x - 1.5 * s, hy + 2.6 * s, 0.6 * s, '#1b1b1b') + c(x + 1.5 * s, hy + 2.6 * s, 0.6 * s, '#1b1b1b');
	q += pth(`M ${f(x - 1.6 * s)} ${f(hy + 4.3 * s)} Q ${f(x)} ${f(hy + 5.4 * s)} ${f(x + 1.6 * s)} ${f(hy + 4.3 * s)}`, 'none', `stroke="#1b1b1b" stroke-width="${f(0.45 * s)}" stroke-linecap="round"`);
	if (o.headband) q += r(x - hw / 2 - 0.4 * s, hy + 0.4 * s, hw + 0.8 * s, 1.6 * s, '#1e3a8a') + r(x - 1.4 * s, hy + 0.2 * s, 2.8 * s, 2 * s, '#cfd6de');
	if (o.strawhat) q += el(x, hy + 0.6 * s, hw * 0.95, 1.6 * s, '#f5d77a') + r(x - hw / 2 + 0.6 * s, hy - 3 * s, hw - 1.2 * s, 3.6 * s, '#f5d77a', `rx="${0.8 * s}"`) + r(x - hw / 2 + 0.6 * s, hy - 0.8 * s, hw - 1.2 * s, 1 * s, '#dc2626');
	if (o.hat === 'miner') q += pth(`M ${f(x - hw / 2 - 1 * s)} ${f(hy + 1.6 * s)} Q ${f(x)} ${f(hy - 4 * s)} ${f(x + hw / 2 + 1 * s)} ${f(hy + 1.6 * s)} Z`, '#facc15') + c(x, hy - 0.4 * s, 1.1 * s, '#fff');
	if (o.coat) q += r(x - tw / 2 - 1 * s, ay, 2 * s, th + 3 * s, '#ffffff') + r(x + tw / 2 - 1 * s, ay, 2 * s, th + 3 * s, '#ffffff');
	if (o.capeGreen) q += r(x - tw / 2 - 1.5 * s, ay + 1 * s, tw + 3 * s, th + 5 * s, '#2f6b3a', 'opacity=".9"') + r(x - tw / 2, ay, tw, th, shirt);
	return q;
}
function pet(x, y, s, col) {
	return r(x - 6 * s, y - 7 * s, 11 * s, 5 * s, col, `rx="${f(1 * s)}"`) + r(x - 5 * s, y - 2 * s, 2 * s, 2 * s, col) + r(x + 2 * s, y - 2 * s, 2 * s, 2 * s, col) + r(x + 3 * s, y - 11 * s, 5.5 * s, 5 * s, col, `rx="${f(1 * s)}"`) + r(x + 3.5 * s, y - 13 * s, 1.6 * s, 2.4 * s, col) + c(x + 6.6 * s, y - 9 * s, 0.6 * s, '#1b1b1b') + ln(x - 6 * s, y - 6 * s, x - 9 * s, y - 9 * s, col, 1.4 * s);
}
const blobEco = (x, y, s, col, lt) => el(x, y - 6 * s, 9 * s, 7 * s, col) + el(x - 3 * s, y - 9 * s, 2.6 * s, 2 * s, lt, 'opacity=".6"') + c(x - 2.5 * s, y - 6 * s, 1 * s, '#1b1b1b') + c(x + 2.5 * s, y - 6 * s, 1 * s, '#1b1b1b') + pth(`M ${f(x - 1.6 * s)} ${f(y - 3.4 * s)} Q ${f(x)} ${f(y - 2 * s)} ${f(x + 1.6 * s)} ${f(y - 3.4 * s)}`, 'none', `stroke="#1b1b1b" stroke-width="${0.6 * s}"`);
function treeV(x, y, s, col = '#3f9a4a') { return r(x - 2 * s, y - 10 * s, 4 * s, 10 * s, '#7a5232') + c(x, y - 16 * s, 9 * s, col) + c(x - 6 * s, y - 11 * s, 6 * s, col) + c(x + 6 * s, y - 12 * s, 6.5 * s, col) + c(x - 3 * s, y - 18 * s, 4 * s, 'rgba(255,255,255,.18)'); }
function sparkle(x, y, s, col = '#fff') { return poly([[x, y - 5 * s], [x + 1.3 * s, y - 1.3 * s], [x + 5 * s, y], [x + 1.3 * s, y + 1.3 * s], [x, y + 5 * s], [x - 1.3 * s, y + 1.3 * s], [x - 5 * s, y], [x - 1.3 * s, y - 1.3 * s]], col); }
function signBoard(x, y, w, h, text, o = {}) { return r(x - w / 2, y - h / 2, w, h, o.bg || C.dark, `rx="${o.rx || 3}"`) + T(x, y + (o.size || 10) * 0.36, text, { size: o.size || 10, weight: 800, anchor: 'middle', fill: o.fill || '#fff', halo: false, ls: o.ls || 0.5 }); }
function ground(y, col = '#74c160', dark = '#5ea84e') { return r(0, y, VW, VH - y, col) + r(0, y, VW, 3, dark); }
function mountainsV(y, col = '#9fb4c4', op = 0.7) { return poly([[0, y + 30], [50, y + 2], [100, y + 18], [160, y - 6], [230, y + 14], [290, y - 2], [343, y + 12], [343, y + 60], [0, y + 60]], col, `opacity="${op}"`); }
function houseV(x, y, w, h, roof, wall = '#f7f1e3') { return r(x - w / 2, y - h, w, h, wall) + poly([[x - w / 2 - 3, y - h], [x, y - h - h * 0.6], [x + w / 2 + 3, y - h]], roof) + r(x - 3, y - h * 0.5, 6, h * 0.5, '#6b4a2b'); }

function vVerde() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)') + mountainsV(70, '#9fb4c4');
	s += ground(124);
	for (let i = 0; i < 7; i++) s += el(14 + i * 20, 128 - (i % 2) * 6, 11, 9, '#4f9c55') + el(14 + i * 20, 126 - (i % 2) * 6, 7, 6, '#6cc46d');
	s += c(70, 96, 10, '#ffffff', `stroke="${C.dark}" stroke-width="1.5"`) + poly([[64, 103], [60, 110], [69, 105]], '#ffffff') + T(70, 101, '!', { size: 15, weight: 800, anchor: 'middle', fill: '#f97316', halo: false });
	s += houseV(160, 124, 36, 26, '#d9412f') + houseV(205, 124, 30, 22, '#2d9bf0');
	s += r(246, 84, 70, 40, '#f8fafc', 'rx="3" stroke="#94a3b8" stroke-width="1.5"') + r(252, 92, 58, 10, '#60a5fa', 'opacity=".8"') + r(276, 106, 12, 18, '#64748b') + r(298, 60, 3, 24, '#64748b') + c(299.5, 58, 3, '#ef4444') + signBoard(281, 78, 56, 12, 'LABORATÓRIO', { size: 8 });
	s += avatar(236, 150, 1.05, '#3b82f6', '#1e3a8a', { hair: '#6a4a36' }) + avatar(268, 150, 1.05, '#f8fafc', '#334155', { hair: '#3b2a1a', coat: true });
	s += blobEco(206, 150, 1.1, '#f1e4c8', '#fff') + pet(130, 150, 0.9, '#ff6a2b');
	s += treeV(24, 100, 1) + treeV(330, 112, 1.1);
	s += signBoard(60, 150, 76, 12, 'VILA VERDEJANTE', { size: 8.5, bg: '#7a4a28' });
	return s;
}
function vCapital() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	for (const [x, w, h, col] of [[20, 30, 60, '#94a3b8'], [60, 40, 90, '#64748b'], [110, 26, 70, '#94a3b8'], [240, 34, 80, '#64748b'], [284, 44, 100, '#94a3b8'], [330, 20, 64, '#64748b']]) { s += r(x, 124 - h, w, h, col); for (let yy = 124 - h + 8; yy < 118; yy += 12) for (let xx = x + 5; xx < x + w - 4; xx += 10) s += r(xx, yy, 4, 5, '#fef3c7', 'opacity=".8"'); }
	s += r(146, 20, 52, 104, '#e5e7eb') + poly([[146, 20], [172, 2], [198, 20]], '#b91c1c') + r(160, 60, 24, 64, '#b91c1c', 'opacity=".9"') + star(172, 44, 9, 4, 5, C.gold) + r(140, 112, 64, 12, '#d6ceb9');
	s += ground(124, '#e3dccb', '#cbc2ad');
	for (let x = -10; x < VW; x += 30) s += ln(x, 128, x - 12, 166, '#d6cdb8', 1.2);
	s += r(0, 134, 110, 20, '#5d6b7a', 'rx="2"') + r(0, 131, 110, 4, '#8796a6');
	s += `<g transform="translate(40 142)">${r(-26, -9, 52, 16, '#e5483b', 'rx="3"')}${r(-20, -6, 10, 7, '#fde68a')}${r(-4, -6, 10, 7, '#fde68a')}${r(12, -6, 10, 7, '#fde68a')}</g>`;
	s += avatar(172, 158, 1.0, '#a855f7', '#312e81') + avatar(214, 162, 1.0, '#ef4444', '#1f2937', { wave: true }) + avatar(300, 160, 0.95, '#22c55e', '#14532d') + pet(260, 160, 0.9, '#f59e0b');
	s += signBoard(172, 136, 92, 13, 'TORRE DOS VANGUARDAS', { size: 8 });
	return s;
}
function vVulcao() {
	let s = r(0, 0, VW, VH, 'url(#skyEve)');
	s += poly([[230, 124], [290, 40], [343, 110]], '#b7c3cc') + poly([[282, 56], [290, 40], [300, 56]], '#fff');
	s += poly([[110, 124], [176, 26], [262, 124]], '#9aa8b4') + poly([[146, 70], [176, 26], [206, 70], [192, 62], [180, 72], [166, 62]], '#ffffff') + r(196, 92, 18, 12, '#4a3a2c') + poly([[192, 92], [205, 84], [218, 92]], '#3a2c20') + c(212, 80, 4, 'rgba(255,255,255,.45)') + c(216, 72, 3, 'rgba(255,255,255,.35)');
	s += pth('M 110 124 L 176 26 L 156 70 L 146 124 Z', 'rgba(0,0,0,.15)');
	s += ground(124, '#6c9a4e', '#587f40');
	for (const [x, y, sc] of [[40, 124, 1.2], [300, 124, 1.1]]) { s += r(x - 2.5 * sc, y - 34 * sc, 5 * sc, 34 * sc, '#6b4a2b'); for (let i = 0; i < 9; i++) { const a = (i / 9) * 360; s += el(x + 22 * sc * Math.cos(a * deg), y - 34 * sc + 10 * sc * Math.sin(a * deg), 9 * sc, 6 * sc, '#b388ff') + el(x + 22 * sc * Math.cos(a * deg) + 2, y - 34 * sc + 10 * sc * Math.sin(a * deg) + 6, 3 * sc, 8 * sc, '#d9c2ff', 'opacity=".9"'); } }
	s += toriiM(120, 124, 2.4) + houseV(260, 124, 34, 22, '#4a3a2c', '#efe4cc');
	s += avatar(176, 150, 1.1, '#2d6a4f', '#1f2937', { tool: 'sword', hair: '#7c2d12' }) + pth('M 186 112 Q 212 96 236 112 Q 214 104 190 118', '#ff6a2b', 'opacity=".9"') + sparkle(238, 108, 0.8, '#ffe0a3');
	s += `<g opacity=".9">${el(70, 150, 12, 9, '#1f2937')}${c(66, 144, 1.4, '#ef4444')}${c(74, 144, 1.4, '#ef4444')}</g>`;
	s += signBoard(60, 24, 100, 14, 'VILA DAS GLICÍNIAS', { size: 9 });
	return s;
}
function vPorto() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += r(0, 96, VW, 70, '#2f7fb8');
	for (let y = 104; y < 166; y += 10) { let d = ''; for (let x = 0; x <= VW; x += 10) d += `${x ? 'L' : 'M'} ${x} ${f(y + 2 * Math.sin(x / 11 + y))} `; s += pth(d, 'none', 'stroke="#7fc0e6" stroke-width="1" opacity=".5"'); }
	s += r(0, 88, 160, 12, '#a9865e') + r(0, 84, 160, 4, '#c9a67a');
	for (let x = 10; x < 160; x += 24) s += r(x, 100, 5, 20, '#7a4a28');
	s += houseV(30, 84, 34, 26, '#2d9bf0') + houseV(70, 84, 30, 22, '#d9412f') + houseV(110, 84, 36, 28, '#f2c230');
	s += r(300, 36, 18, 56, '#f3f4f6') + r(300, 44, 18, 8, '#ef4444') + r(300, 62, 18, 8, '#ef4444') + r(296, 92, 26, 6, '#64748b') + c(309, 30, 7, '#fde68a') + c(309, 30, 18, '#fde68a', 'opacity=".25"') + r(292, 24, 34, 4, '#1f2937');
	s += pth('M 170 118 L 262 118 L 250 136 L 182 136 Z', '#7a4a28') + r(214, 60, 4, 58, '#4b2e18') + poly([[218, 62], [256, 86], [218, 110]], '#f6f1e6') + poly([[214, 66], [178, 88], [214, 108]], '#f6f1e6') + r(212, 54, 8, 7, '#111827') + c(216, 57, 2, '#fff');
	s += avatar(236, 118, 0.95, '#ef4444', '#1e3a8a', { strawhat: true }) + avatar(80, 84, 0.9, '#22c55e', '#1f2937', { wave: true }) + blobEco(130, 84, 1, '#2d9bf0', '#bfe9f7');
	s += c(60, 30, 3, '#fff') + pth('M 48 30 q 6 -6 12 0 q 6 -6 12 0', 'none', 'stroke="#fff" stroke-width="1.6"') + pth('M 260 40 q 6 -6 12 0 q 6 -6 12 0', 'none', 'stroke="#fff" stroke-width="1.6"');
	return s;
}
function vHerois() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	for (const [x, w, h, col] of [[0, 40, 80, '#64748b'], [46, 30, 110, '#475569'], [82, 44, 70, '#94a3b8'], [250, 36, 96, '#475569'], [294, 50, 120, '#64748b']]) { s += r(x, 124 - h, w, h, col); for (let yy = 124 - h + 8; yy < 118; yy += 12) for (let xx = x + 5; xx < x + w - 4; xx += 10) s += r(xx, yy, 4, 5, '#bfe6ff', 'opacity=".7"'); }
	s += pth('M 132 124 L 132 44 L 160 44 L 160 96 L 212 96 L 212 44 L 240 44 L 240 124 Z', '#bfe6ff', 'stroke="#1e3a8a" stroke-width="2"') + r(150, 30, 72, 14, '#1e3a8a', 'rx="2"') + T(186, 40.5, 'ACADEMIA', { size: 9, weight: 800, anchor: 'middle', fill: '#fff', halo: false, ls: 1.5 });
	s += r(250, 20, 56, 26, C.dark, 'rx="2"') + T(278, 37, 'HERÓIS', { size: 12, weight: 800, anchor: 'middle', fill: TYPE.raio, halo: false, ls: 1 });
	s += ground(124, '#cfd6de', '#aab4c0');
	s += r(0, 136, VW, 3, '#f8fafc', 'stroke-dasharray="14 10"');
	s += avatar(186, 160, 1.1, '#22c55e', '#1f2937', { hair: '#14532d', punch: true });
	for (const [x, y] of [[158, 118], [214, 112], [172, 140], [204, 150]]) s += poly([[x, y - 10], [x - 4, y], [x + 1, y], [x - 2, y + 10], [x + 5, y - 2], [x, y - 2]], '#86efac', `stroke="${C.navy}" stroke-width=".6"`);
	s += avatar(60, 158, 1.0, '#ef4444', '#1f2937', { spiky: '#f2c230' }) + avatar(300, 160, 1.0, '#f97316', '#3f3f46', { wave: true }) + blobEco(120, 160, 1, TYPE.raio, '#fff3b0');
	return s;
}
function vPortoes() {
	let s = r(0, 0, VW, VH, 'url(#skyNight)');
	for (const [x, sc] of [[30, 1.3], [90, 1.1], [250, 1.2], [320, 1.4]]) s += treeV(x, 124, sc, '#1f3d2a');
	s += ground(124, '#1a2e22', '#13241a');
	for (const [x, y] of [[60, 70], [120, 84], [230, 76], [290, 66]]) s += c(x, y, 10, '#ffd27a', 'opacity=".25"') + r(x - 3, y - 5, 6, 10, '#ffb347', `rx="1.5" stroke="${C.navy}" stroke-width=".8"`) + ln(x, y - 5, x, y - 16, '#1b1b1b', 1);
	s += c(172, 100, 36, 'url(#gBlue)') + pth('M 148 124 L 148 92 A 24 24 0 0 1 196 92 L 196 124 Z', '#1d4ed8', 'opacity=".7"') + pth('M 148 124 L 148 92 A 24 24 0 0 1 196 92 L 196 124', 'none', 'stroke="#dbeafe" stroke-width="3"');
	for (let i = 0; i < 6; i++) s += c(150 + i * 9, 86 + Math.sin(i) * 6, 1.4, '#fff', 'opacity=".9"');
	s += avatar(120, 152, 1.1, '#1f2937', '#111827', { hair: '#111827', tool: 'dagger' });
	for (const [x, sc] of [[66, 0.9], [84, 1], [230, 1], [252, 0.9]]) s += `<g opacity=".92">${avatar(x, 154, sc, '#2a1a44', '#1a1030', { skin: '#2a1a44', hair: '#2a1a44' })}${c(x - 1.3 * sc, 154 - 8.5 * sc - 9 * sc - 4 * sc, 0.8 * sc, '#c4a5ff')}${c(x + 1.5 * sc, 154 - 8.5 * sc - 9 * sc - 4 * sc, 0.8 * sc, '#c4a5ff')}</g>`;
	s += signBoard(172, 20, 110, 14, 'PORTÃO · RANK A', { size: 9, bg: '#1e3a8a' }) + T(172, 46, 'LEVANTE-SE', { size: 11, weight: 800, anchor: 'middle', fill: '#c4a5ff', halo: false, ls: 2 });
	return s;
}
function vMuralhas() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)') + mountainsV(50, '#9fb4c4', 0.5);
	s += `<g opacity=".45">${r(60, 36, 26, 40, '#5b4a3c')}${c(73, 30, 10, '#5b4a3c')}${r(58, 70, 10, 14, '#5b4a3c')}${r(78, 70, 10, 14, '#5b4a3c')}</g>`;
	s += r(0, 84, VW, 40, '#c9bca2') + r(0, 84, VW, 6, '#a89a80');
	for (let yy = 92; yy < 124; yy += 8) for (let xx = (yy / 8) % 2 ? 0 : 10; xx < VW; xx += 20) s += r(xx, yy, 18, 6, 'none', 'stroke="#a89a80" stroke-width=".8"');
	s += pth('M 156 124 L 156 100 A 16 16 0 0 1 188 100 L 188 124 Z', '#3f3f46') + r(150, 78, 44, 8, '#8a7b6b');
	s += ground(124, '#9bc77e', '#7fa866');
	s += houseV(40, 160, 30, 24, '#b45309', '#f1e6cf') + houseV(80, 160, 26, 20, '#9a3412', '#f1e6cf') + houseV(270, 160, 30, 24, '#b45309', '#f1e6cf') + houseV(310, 160, 26, 20, '#9a3412', '#f1e6cf');
	s += avatar(172, 150, 1.05, '#d6cfc2', '#f3f4f6', { hair: '#111827', tool: 'blade', capeGreen: true }) + avatar(216, 84, 0.8, '#d6cfc2', '#f3f4f6', { capeGreen: true }) + avatar(120, 84, 0.8, '#d6cfc2', '#f3f4f6', { capeGreen: true });
	s += ln(216, 70, 260, 40, '#e5e7eb', 1) + ln(120, 70, 86, 44, '#e5e7eb', 1);
	s += blobEco(240, 150, 1, TYPE.terra, '#e7cfa8');
	s += signBoard(172, 22, 118, 14, 'MURALHA EXTERNA', { size: 9, bg: '#5b4a3c' });
	return s;
}
function vPenhasco() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += poly([[0, 124], [0, 50], [60, 36], [140, 46], [220, 30], [300, 44], [343, 36], [343, 124]], '#8a7b6b') + poly([[0, 50], [60, 36], [140, 46], [220, 30], [300, 44], [343, 36], [343, 46], [300, 54], [220, 40], [140, 56], [60, 46], [0, 60]], '#a7978a');
	for (let i = 0; i < 4; i++) { const x = 90 + i * 50; s += r(x - 14, 60, 28, 30, '#a89786', 'rx="5"') + r(x - 10, 68, 20, 8, '#8a7b6b', 'opacity=".6"') + r(x - 8, 78, 16, 3, '#8a7b6b'); }
	for (const [x, sc] of [[30, 1.3], [320, 1.2]]) s += r(x - 2 * sc, 50 - 18 * sc, 4 * sc, 18 * sc, '#f3e9d2') + `<g transform="rotate(25 ${x} ${50 - 18 * sc})">${pth(`M ${x} ${50 - 18 * sc} l 0 -14 M ${x} ${50 - 18 * sc} l 12 7 M ${x} ${50 - 18 * sc} l -12 7`, 'none', 'stroke="#fff" stroke-width="2.4" stroke-linecap="round"')}</g>`;
	s += ground(124, '#8fcf6f', '#73b358');
	s += treeV(50, 124, 1.2, '#2f8a3f') + treeV(290, 124, 1.3, '#2f8a3f') + houseV(170, 124, 50, 30, '#ef4444', '#fff4dc') + r(150, 110, 40, 3, '#1e3a8a') + signBoard(170, 100, 54, 12, 'VILA DA FOLHA', { size: 8 });
	s += avatar(120, 158, 1.1, '#f97316', '#1f2937', { spiky: '#f2c230', headband: true }) + c(140, 132, 7, 'url(#gCyan)') + c(140, 132, 4, '#67e8f9') + avatar(232, 158, 1.0, '#1f2937', '#1f2937', { hair: '#111827', headband: true });
	for (const [x, y] of [[60, 140], [270, 150], [100, 118]]) s += pth(`M ${x} ${y} q 8 -6 16 0 q 8 6 16 0`, 'none', 'stroke="#fff" stroke-width="1.6" opacity=".9"');
	return s;
}
function vArena() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += r(0, 60, VW, 50, '#efcf86') + r(0, 56, VW, 6, '#a9853c');
	for (let i = 0; i < 24; i++) s += c(8 + i * 14, 72 + (i % 2) * 14, 5, ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'][i % 5]);
	s += r(70, 100, 200, 28, '#f4e7c3', 'stroke="#3f3f46" stroke-width="2"') + r(70, 100, 200, 4, '#3f3f46');
	for (let i = 1; i < 10; i++) s += ln(70 + i * 20, 104, 70 + i * 20, 128, '#d9c89a', 1);
	s += ground(128, '#9bc77e', '#7fa866');
	s += r(120, 14, 100, 24, '#b91c1c', 'rx="3"') + T(170, 31, 'TORNEIO', { size: 14, weight: 800, anchor: 'middle', fill: '#fff', halo: false, ls: 2 }) + poly([[170, 38], [178, 48], [162, 48]], '#b91c1c');
	for (const x of [40, 300]) s += r(x - 2, 20, 4, 40, '#6b4a2b') + c(x, 16, 6, '#ff6a2b') + c(x, 12, 3, '#ffe0a3');
	s += avatar(130, 100, 1.1, '#f97316', '#1e3a8a', { spiky: '#111827', belt: '#1e3a8a', punch: true }) + avatar(212, 100, 1.1, '#22c55e', '#1f2937', { hair: '#14532d' });
	s += c(100, 78, 6, 'url(#gGold)') + sparkle(100, 78, 1, '#fff7c2') + sparkle(118, 64, 0.7, '#fff7c2');
	s += blobEco(60, 128, 1, TYPE.martial, '#e9d5ff') + avatar(280, 158, 0.9, '#3b82f6', '#1e3a8a', { wave: true });
	return s;
}
function vTemplo() {
	let s = r(0, 0, VW, VH, 'url(#skyEve)');
	s += c(270, 40, 30, 'url(#gDark)') + c(270, 40, 20, '#0b0612', 'stroke="#c4a5ff" stroke-width="2"') + c(270, 40, 4, '#fff') + c(262, 32, 1.2, '#fff') + c(280, 48, 1, '#fff');
	s += poly([[0, 124], [80, 80], [160, 96], [240, 70], [343, 90], [343, 124]], '#4a3a5a');
	s += ground(124, '#6a9a60', '#557f4c');
	for (let i = 0; i < 6; i++) s += r(150 - i * 2, 112 - i * 2, 44 + i * 4, 2, '#d6ceb9');
	s += r(146, 70, 52, 30, '#f3e9d2', 'stroke="#7c2d12" stroke-width="1.5"') + poly([[138, 70], [172, 52], [206, 70]], '#7c2d12') + r(150, 74, 44, 4, '#7c2d12') + r(166, 84, 12, 16, '#7c2d12');
	for (const [x, sc] of [[60, 2.4], [300, 2.4]]) s += toriiM(x, 124, sc);
	s += avatar(172, 154, 1.15, '#111827', '#111827', { hair: '#f8fafc', blindfold: true }) + c(190, 118, 6, 'url(#gBlue)') + c(190, 118, 3, '#bfe6ff') + c(186, 122, 1.8, '#ef4444');
	for (const [x, y, sc] of [[80, 150, 1.1], [262, 152, 0.9]]) s += el(x, y - 8 * sc, 10 * sc, 9 * sc, '#5b21b6') + c(x - 3 * sc, y - 9 * sc, 1.5 * sc, '#fff') + c(x + 3 * sc, y - 9 * sc, 1.5 * sc, '#fff') + pth(`M ${x - 4 * sc} ${y - 4 * sc} L ${x + 4 * sc} ${y - 4 * sc}`, 'none', `stroke="#fff" stroke-width="${1.2 * sc}"`);
	s += signBoard(172, 24, 140, 14, 'EXPANSÃO DE DOMÍNIO', { size: 9, bg: '#1e1033' });
	return s;
}
function vSonhos() {
	let s = r(0, 0, VW, VH, 'url(#skyDream)');
	const rr = rng(44);
	for (let i = 0; i < 40; i++) s += c(rr() * VW, rr() * 120, 0.6 + rr() * 1.2, '#fff', `opacity="${0.3 + rr() * 0.6}"`);
	s += c(290, 36, 18, '#fde68a') + c(282, 32, 16, '#8a5fc8', 'opacity=".9"');
	for (const [x, y, w] of [[60, 120, 50], [170, 96, 60], [280, 126, 54]]) s += el(x, y, w, 10, '#8ed9a8') + pth(`M ${x - w} ${y} Q ${x} ${y + 34} ${x + w} ${y} Z`, '#6b4a8a') + treeV(x - w * 0.5, y - 2, 0.7, '#5fd3b8');
	s += el(170, 88, 22, 12, '#8fb8ff') + c(154, 78, 9, '#8fb8ff') + c(150, 76, 1, '#1b1b1b') + pth('M 146 80 q 4 2 8 0', 'none', 'stroke="#1b1b1b" stroke-width=".8"') + T(188, 74, 'z', { size: 10, weight: 800, fill: '#fff', halo: false }) + T(196, 64, 'z', { size: 13, weight: 800, fill: '#fff', halo: false }) + T(206, 52, 'z', { size: 16, weight: 800, fill: '#fff', halo: false });
	s += avatar(60, 112, 0.9, '#3b82f6', '#1e3a8a', { hair: '#6a4a36' }) + blobEco(278, 116, 1, TYPE.onirico, '#ffe3f7');
	for (const [x, y] of [[120, 40], [240, 70], [40, 60]]) s += c(x, y, 8, 'none', 'stroke="#fff" stroke-width="1.2" opacity=".7"') + ln(x, y, x, y - 5, '#fff', 1.2) + ln(x, y, x + 4, y, '#fff', 1.2);
	s += signBoard(172, 150, 150, 14, 'ACORDA AO LEVAR DANO', { size: 9, bg: '#5b21b6' });
	return s;
}
function vTrem() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)') + mountainsV(40, '#9fb4c4', 0.5);
	s += r(0, 110, VW, 56, '#2f7fb8');
	for (let y = 118; y < 166; y += 10) { let d = ''; for (let x = 0; x <= VW; x += 10) d += `${x ? 'L' : 'M'} ${x} ${f(y + 2 * Math.sin(x / 11 + y))} `; s += pth(d, 'none', 'stroke="#7fc0e6" stroke-width="1" opacity=".5"'); }
	for (let x = 20; x < VW; x += 60) s += r(x, 78, 8, 40, '#5b4636') + ln(x + 4, 80, x + 64, 116, '#6b4a2b', 2) + ln(x + 64, 80, x + 4, 116, '#6b4a2b', 2);
	s += r(0, 70, VW, 8, '#6b4a2b') + r(0, 68, VW, 3, '#cfd6de');
	s += `<g transform="translate(120 56)">${r(-50, -16, 100, 26, '#e5483b', 'rx="4"')}${r(50, -12, 20, 22, '#b91c1c', 'rx="3"')}${r(-42, -10, 14, 10, '#fde68a')}${r(-20, -10, 14, 10, '#fde68a')}${r(2, -10, 14, 10, '#fde68a')}${r(24, -10, 14, 10, '#fde68a')}${c(-36, 12, 4, '#2b2b2b')}${c(-10, 12, 4, '#2b2b2b')}${c(20, 12, 4, '#2b2b2b')}${c(44, 12, 4, '#2b2b2b')}</g>`;
	for (const [y, w] of [[48, 30], [56, 40], [64, 24]]) s += ln(60 - w, y, 62, y, '#fff', 2, 'stroke-linecap="round" opacity=".8"');
	s += `<g transform="translate(250 140)">${pth('M -34 0 L 34 0 L 24 14 L -24 14 Z', '#f3f4f6')}${r(-18, -16, 36, 16, '#2d9bf0', 'rx="2"')}${r(-12, -12, 8, 6, '#bfe6ff')}${r(2, -12, 8, 6, '#bfe6ff')}${c(8, -22, 3, '#64748b')}${c(10, -30, 4, 'rgba(255,255,255,.6)')}</g>`;
	s += avatar(236, 124, 0.8, '#ef4444', '#1f2937', { wave: true }) + signBoard(60, 150, 108, 14, 'BALSA · ILHA → PORTO', { size: 9 }) + signBoard(120, 22, 110, 14, 'TREM VANGUARDA', { size: 9, bg: '#b91c1c' });
	return s;
}

function vCapsule() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)') + mountainsV(60, '#9fb4c4', 0.5);
	for (const [x, rad, col] of [[50, 34, '#f3f4f6'], [130, 44, '#f3f4f6'], [230, 30, '#f3f4f6'], [300, 40, '#f3f4f6']]) s += pth(`M ${x - rad} 124 A ${rad} ${rad} 0 0 1 ${x + rad} 124 Z`, col, 'stroke="#8c97a6" stroke-width="1.5"') + pth(`M ${x - rad * 0.6} 124 A ${rad * 0.6} ${rad * 0.6} 0 0 1 ${x + rad * 0.6} 124 Z`, '#fde68a', 'opacity=".9"') + r(x - 2, 124 - rad - 8, 4, 8, '#8c97a6') + c(x, 124 - rad - 10, 3, '#ef4444');
	s += signBoard(130, 60, 96, 14, 'CAPSULE CORP.', { size: 9.5, bg: '#1f2937', ls: 1.5 });
	s += ground(124, '#cfd6de', '#aab4c0');
	s += r(150, 132, 60, 20, '#f4e7c3', 'stroke="#3f3f46" stroke-width="1.5"') + r(150, 132, 60, 3, '#3f3f46');
	s += avatar(170, 132, 1.0, '#f97316', '#1e3a8a', { spiky: '#111827', belt: '#1e3a8a', punch: true }) + avatar(200, 132, 1.0, '#22c55e', '#1f2937', { hair: '#14532d' });
	s += c(150, 112, 5, 'url(#gGold)') + sparkle(150, 112, 0.9, '#fff7c2');
	s += `<g transform="translate(70 150)">${el(0, 0, 12, 6, '#22d3ee', 'opacity=".9"')}${r(-10, -10, 20, 10, '#f3f4f6', 'rx="4"')}${c(-6, -8, 2, '#1f2937')}${c(6, -8, 2, '#1f2937')}</g>`; // carro-cápsula
	s += avatar(280, 158, 0.95, '#3b82f6', '#1e3a8a', { wave: true }) + blobEco(250, 160, 1, TYPE.martial, '#e9d5ff');
	return s;
}
function vDunas() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += r(0, 70, VW, 96, '#ead9a0') + pth('M 0 90 Q 60 60 120 86 Q 190 110 260 80 Q 310 64 343 84 L 343 100 L 0 100 Z', '#e0c98a') + pth('M 0 120 Q 80 96 170 118 Q 250 138 343 110 L 343 166 L 0 166 Z', '#d8c184');
	s += c(290, 30, 14, '#fde68a') + c(290, 30, 26, '#fde68a', 'opacity=".2"');
	for (const [x, w, h] of [[60, 50, 40], [120, 40, 32], [230, 56, 46], [300, 36, 30]]) s += pth(`M ${x - w / 2} 124 L ${x - w / 2} ${124 - h * 0.6} A ${w / 2} ${h * 0.5} 0 0 1 ${x + w / 2} ${124 - h * 0.6} L ${x + w / 2} 124 Z`, '#c9a56a', 'stroke="#8a6a3a" stroke-width="1.2"') + r(x - 5, 108, 10, 16, '#5a3d1e') + c(x, 124 - h * 0.8, 3, '#5a3d1e');
	s += c(176, 86, 18, '#e3c98a', 'stroke="#8a6a3a" stroke-width="1.5"') + r(150, 86, 52, 38, '#c9a56a', 'stroke="#8a6a3a" stroke-width="1.2"') + signBoard(176, 76, 40, 11, '風', { size: 9, bg: '#b45309' });
	s += avatar(100, 150, 1.05, '#7f1d1d', '#1f2937', { hair: '#b91c1c', headband: true }) + pth('M 112 118 q 10 -14 22 -4 q 8 8 -4 14', 'none', 'stroke="#e0c98a" stroke-width="4" stroke-linecap="round"') + c(134, 126, 3, '#e0c98a');
	for (const [x, y] of [[40, 150], [250, 156], [310, 150]]) s += r(x - 2, y - 14, 4, 14, '#4f9c55') + r(x - 7, y - 9, 4, 5, '#4f9c55') + r(x + 3, y - 11, 4, 5, '#4f9c55');
	s += blobEco(210, 160, 1, TYPE.vento, '#d1fae5') + avatar(280, 160, 0.9, '#f59e0b', '#78350f', { wave: true });
	s += signBoard(60, 24, 100, 14, 'VILA DA AREIA', { size: 9, bg: '#78350f' });
	return s;
}
function vAurea() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += r(0, 110, VW, 56, '#2f7fb8');
	for (let y = 118; y < 166; y += 10) { let d = ''; for (let x = 0; x <= VW; x += 10) d += `${x ? 'L' : 'M'} ${x} ${f(y + 2 * Math.sin(x / 11 + y))} `; s += pth(d, 'none', 'stroke="#7fc0e6" stroke-width="1" opacity=".5"'); }
	s += poly([[0, 110], [0, 70], [60, 64], [140, 72], [220, 60], [300, 70], [343, 64], [343, 110]], '#a89786') + poly([[0, 110], [0, 100], [343, 94], [343, 110]], '#8a7b6b');
	for (let x = 10; x < VW; x += 8) s += ln(x, 98, x + 2, 108, '#6e5f50', 1);
	for (const [x, w, h, col] of [[24, 30, 40, '#fb7185'], [58, 26, 32, '#fde68a'], [90, 30, 46, '#fb923c'], [126, 28, 36, '#f59e0b'], [228, 30, 44, '#fde68a'], [262, 26, 34, '#fb7185'], [294, 32, 48, '#fb923c']]) { s += r(x, 68 - h + 14, w, h, col, 'stroke="#7c2d12" stroke-width="1"') + r(x - 2, 68 - h + 10, w + 4, 5, '#b45309'); for (let yy = 68 - h + 22; yy < 76; yy += 12) s += r(x + 6, yy, 6, 8, '#1f2937') + r(x + w - 12, yy, 6, 8, '#1f2937') + r(x + 4, yy + 8, w - 8, 2, '#166534'); }
	s += c(176, 56, 22, '#e9ddc5', 'stroke="#a89c86" stroke-width="1.5"') + star(176, 56, 9, 3.6, 5, C.gold) + poly([[170, 40], [176, 26], [182, 40]], C.gold);
	s += avatar(176, 100, 1.05, '#ec4899', '#1f2937', { hair: '#fde68a', belt: '#1f2937' }) + sparkle(196, 70, 1, '#fde68a') + sparkle(156, 66, 0.7, '#fde68a');
	s += `<g opacity=".85">${avatar(130, 100, 1.0, '#c4b5fd', '#a78bfa', { skin: '#c4b5fd', hair: '#c4b5fd' })}</g>`; // stand
	s += shipM(60, 140, 1.2) + signBoard(286, 24, 100, 14, 'COSTA ÁUREA', { size: 9, bg: '#7c2d12' });
	return s;
}
function vAstral() {
	let s = r(0, 0, VW, VH, 'url(#skyNight)');
	const rr = rng(77);
	for (let i = 0; i < 60; i++) s += c(rr() * VW, rr() * VH, 0.5 + rr() * 1.3, '#fff', `opacity="${0.3 + rr() * 0.7}"`);
	s += c(60, 40, 22, '#4c1d95', 'opacity=".8"') + c(60, 40, 14, '#7c3aed', 'opacity=".9"') + el(60, 40, 34, 7, 'none', 'stroke="#c4b5fd" stroke-width="2" transform="rotate(-20 60 40)"');
	s += el(190, 124, 150, 20, '#2a2553', 'stroke="#9fa8ff" stroke-width="2"') + r(40, 96, 300, 28, '#3b3580') + r(40, 96, 300, 4, '#c7cbff');
	for (let x = 60; x < 330; x += 24) s += r(x, 102, 10, 10, '#fde68a', 'opacity=".9"');
	s += r(70, 60, 120, 36, '#4b4a8a', 'rx="6" stroke="#c7cbff" stroke-width="1.5"') + r(78, 68, 104, 14, '#bfe6ff', 'opacity=".8"');
	s += `<g transform="translate(250 84)">${r(-56, -14, 112, 26, '#2a1b55', `rx="5" stroke="${C.gold}" stroke-width="1.5"`)}${r(56, -10, 20, 22, '#1a1038', 'rx="3"')}${r(-48, -8, 14, 10, '#fde68a')}${r(-28, -8, 14, 10, '#fde68a')}${r(-8, -8, 14, 10, '#fde68a')}${r(12, -8, 14, 10, '#fde68a')}${r(32, -8, 14, 10, '#fde68a')}${c(-40, 14, 4, '#c7cbff')}${c(-10, 14, 4, '#c7cbff')}${c(20, 14, 4, '#c7cbff')}${c(50, 14, 4, '#c7cbff')}</g>`;
	for (const [y, w] of [[76, 24], [84, 34], [92, 20]]) s += ln(190 - w, y, 192, y, '#c7cbff', 2, 'stroke-linecap="round" opacity=".7"');
	s += avatar(120, 96, 1.0, '#e5e7eb', '#1f2937', { hair: '#9ca3af' }) + avatar(150, 96, 0.95, '#f9a8d4', '#1f2937', { hair: '#f9a8d4', wave: true });
	for (const [x, y] of [[300, 40], [330, 60]]) s += poly([[x, y - 8], [x - 3, y], [x + 1, y], [x - 2, y + 8], [x + 4, y - 2], [x, y - 2]], TYPE.raio, `stroke="${C.navy}" stroke-width=".6"`);
	s += signBoard(172, 24, 110, 14, 'EXPRESSO ASTRAL', { size: 9, bg: '#2a1b55' });
	return s;
}
function vRotas() {
	let s = '';
	// três faixas: floresta das lanternas, caverna do caminho da vitória, monte nevado
	s += r(0, 0, 114, VH, 'url(#skyNight)') + treeV(20, 124, 1.1, '#1f3d2a') + treeV(90, 124, 1.2, '#1f3d2a') + r(0, 124, 114, 42, '#1a2e22');
	for (const [x, y] of [[40, 80], [76, 92]]) s += c(x, y, 9, '#ffd27a', 'opacity=".3"') + r(x - 3, y - 5, 6, 10, '#ffb347', 'rx="1.5"');
	s += avatar(56, 150, 0.9, '#3b82f6', '#1e3a8a') + T(57, 22, 'FLORESTA', { size: 10, weight: 800, anchor: 'middle', fill: '#fff', halo: false, ls: 1 });
	s += r(114, 0, 115, VH, '#3b2a1e');
	for (let i = 0; i < 18; i++) s += c(120 + (i * 37) % 110, 10 + (i * 53) % 150, 2 + (i % 3), '#5c4636');
	s += crystalV(150, 150, 1.2, '#a77bff', '#e9ddff') + crystalV(200, 148, 0.9, '#22d3ee', '#cffafe') + pth('M 140 124 A 32 30 0 0 1 204 124 Z', '#1d140e', 'opacity=".7"');
	s += avatar(172, 150, 0.9, '#ef4444', '#1f2937') + T(172, 22, 'CAVERNA', { size: 10, weight: 800, anchor: 'middle', fill: '#fff', halo: false, ls: 1 });
	s += r(229, 0, 114, VH, 'url(#skyDay)') + poly([[229, 124], [260, 60], [290, 90], [320, 44], [343, 80], [343, 124]], '#b7c3cc') + poly([[250, 80], [260, 60], [272, 78]], '#fff') + poly([[308, 68], [320, 44], [334, 68]], '#fff') + r(229, 124, 114, 42, '#eef3f6');
	for (let i = 0; i < 12; i++) s += c(235 + (i * 29) % 108, 10 + (i * 47) % 110, 1.4, '#fff', 'opacity=".8"');
	s += avatar(286, 150, 0.9, '#f97316', '#3f3f46', { hat: 'miner' }) + T(286, 22, 'MONTE KAMADO', { size: 10, weight: 800, anchor: 'middle', fill: '#1f2937', halo: false, ls: 1 });
	for (const x of [114, 229]) s += ln(x, 0, x, VH, '#0c2645', 2);
	return s;
}
function crystalV(x, y, s, col, light) {
	const one = (dx, hgt, wid, tilt) => `<g transform="rotate(${tilt} ${f(x + dx)} ${f(y)})">` + poly([[x + dx - wid, y], [x + dx - wid, y - hgt * 0.7], [x + dx, y - hgt], [x + dx + wid, y - hgt * 0.7], [x + dx + wid, y]], col) + poly([[x + dx, y - hgt], [x + dx + wid, y - hgt * 0.7], [x + dx + wid, y], [x + dx, y]], light, 'opacity=".55"') + '</g>';
	return one(-4 * s, 12 * s, 2.6 * s, -18) + one(4 * s, 10 * s, 2.4 * s, 20) + one(0, 17 * s, 3.2 * s, 0);
}

// ------------------------------------------------------------------ right panel
const CARDS = [
	[1, 'normal', 'VILA VERDEJANTE', 'início · campo', vVerde, ['Casa do jogador e laboratório da Mina, que', 'dá o Eco inicial. R1 passa pelo Mato Alto e', 'pelo Lago Espelhado até a primeira cidade.']],
	[2, 'agua', 'CIDADE FAROL', 'One Piece · ginásio 1 · Maré', vPorto, ['Praia tropical com coqueiros, cais, farol e', 'navios piratas. Balsa pra Ilha do Navio', '(naufrágio). Fighter de referência: Luffy.']],
	[3, 'martial', 'CAPSULE CITY', 'Dragon Ball · ginásio 2 · Arena', vCapsule, ['Cidade 3: domos da Capsule Corp. e o ringue', 'do torneio. Ao norte, ermos com pilares de', 'pedra e esferas. Casa do Kame numa ilhota.']],
	[4, 'vento', 'CIDADE DAS DUNAS', 'Naruto · ginásio 3 · Brisa', vDunas, ['Vila da Areia murada no Deserto de Vidro,', 'com oásis. Saindo pela R7 está o Vale do Fim,', 'com as duas estátuas. Fighter: Gaara.']],
	[5, 'fogo', 'VILA DAS GLICÍNIAS', 'Demon Slayer · ginásio 4 · Brasa', vVulcao, ['Vem pelo Monte Kamado (neve, cabana de', 'carvão) e pela teia do Monte Natagumo até o', 'vale das glicínias. Fighter: Tanjiro.']],
	[6, 'terra', 'CIDADE ÁUREA', 'JoJo · ginásio 5 · Rocha', vAurea, ['Cidade italiana de telhados de terracota,', 'Coliseu, gôndolas, ciprestes e limoeiros.', 'Praça da Flecha. Fighter: Giorno.']],
	[7, 'sombra', 'CIDADE DOS PORTÕES', 'Solo Leveling · ginásio 6 · Penumbra', vPortoes, ['Seul: arranha-céus, Rio Han, portões azuis', 'e um vermelho, Masmorra Dupla ao norte e', 'Ilha de Jeju. Fighter: Sung Jin-Woo (no jogo).']],
	[8, 'raio', 'ESTAÇÃO ASTRAL', 'Star Rail · ginásio 7 · Trovão', vAstral, ['Estação espacial flutuando na baía, só se', 'chega pelo Expresso Astral (R12, trem sobre', 'a baía). Fighter de referência: Trailblazer.']],
	[9, 'onirico', 'CIDADE AMALDIÇOADA', 'Jujutsu Kaisen · ginásio 8 · Sonho', vTemplo, ['Shibuya sob névoa roxa, maldições à solta,', 'Escola Jujutsu na mata e a cúpula do domínio.', 'Abre o Mundo dos Sonhos. Fighter: Gojo.']],
	[10, 'martial', 'LIGA DOS VANGUARDAS', 'final · Serra do Meio', vCapital, ['Torre dos Vanguardas no centro do continente,', 'cercada pela serra. Só entra com 8 insígnias,', 'pela caverna do Caminho da Vitória (R14).']],
	[11, 'terra', 'SUB-LUGARES DAS ROTAS', 'floresta · caverna · neve', vRotas, ['Entre uma cidade e outra sempre tem um lugar', 'com Ecos próprios: Floresta das Lanternas,', 'Vale do Fim, Monte Kamado, Caminho da Vitória.']],
	[12, 'onirico', 'MUNDO DOS SONHOS', 'dimensão à parte', vSonhos, ['Ilhas flutuantes com Sonecão e Ecos que só', 'aparecem lá. Entra dormindo na Cidade', 'Amaldiçoada. Acorda ao levar dano.']],
];
const PX = 1666, PW = 1114, CW = 359, CH = 300, GAP = 18, PY = 146;
function drawPanel() {
	let s = '';
	CARDS.forEach(([n, type, title, sub, fn, lines], i) => {
		const x = PX + (i % 3) * (CW + GAP), y = PY + Math.floor(i / 3) * (CH + 16);
		s += r(x, y, CW, CH, C.panel, `rx="8" stroke="${C.panelEdge}" stroke-width="1.5"`);
		DEFS.push(`<clipPath id="clip${n}"><rect x="0" y="0" width="${VW}" height="${VH}" rx="5"/></clipPath>`);
		s += `<g transform="translate(${x + 8} ${y + 8})"><g clip-path="url(#clip${n})">${fn()}</g><rect x="0" y="0" width="${VW}" height="${VH}" rx="5" fill="none" stroke="rgba(255,255,255,.18)"/></g>`;
		s += badge(x + 30, y + 196, n, TYPE[type]);
		s += T(x + 52, y + 203, title, { size: 20, weight: 800, halo: false, ls: 0.4 });
		s += T(x + 52, y + 221, sub, { size: 13, weight: 700, halo: false, fill: sub.includes('ginásio') ? '#ffe9a3' : C.dim });
		lines.forEach((t, k) => (s += T(x + 16, y + 246 + k * 19, t, { size: 14, weight: 500, body: true, halo: false, fill: '#c9dbf1' })));
	});
	return s;
}

// ------------------------------------------------------------------ quadros embaixo do mapa
function frame(x, y, w, h, title) {
	let s = r(x, y, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) s += pth(`M ${cx + dx * 14} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * 14}`, 'none', `stroke="${C.cyan}" stroke-width="2.5"`);
	s += T(x + 14, y + 25, title, { size: 15, weight: 800, fill: C.cyan, ls: 1.2, halo: false });
	return s;
}
const IY = 1232, IH = 292;
function insetTable() {
	const x0 = MX, w = 866;
	let s = frame(x0, IY, w, IH, 'QUAL É QUAL · CIDADE → SÉRIE → BIOMA → INSÍGNIA → FIGHTER');
	const cols = [16, 46, 222, 372, 560, 712];
	['#', 'Cidade (ginásio)', 'Série', 'Bioma / chegada', 'Tipo · insígnia', 'Fighter'].forEach((h, i) => (s += T(x0 + cols[i], IY + 50, h, { size: 12, weight: 800, fill: C.dim, halo: false, ls: 1 })));
	s += ln(x0 + 14, IY + 57, x0 + w - 14, IY + 57, C.panelEdge, 1.2);
	const rows = [
		[2, 'Cidade Farol (1)', 'One Piece', 'praia tropical, navios', 'agua', 'Maré', 'Luffy'],
		[3, 'Capsule City (2)', 'Dragon Ball', 'domos + ermos rochosos', 'martial', 'Arena', 'Goku'],
		[4, 'Cidade das Dunas (3)', 'Naruto', 'deserto + Vale do Fim', 'vento', 'Brisa', 'Gaara'],
		[5, 'Vila das Glicínias (4)', 'Demon Slayer', 'neve → glicínias', 'fogo', 'Brasa', 'Tanjiro'],
		[6, 'Cidade Áurea (5)', 'JoJo', 'costa italiana, Coliseu', 'terra', 'Rocha', 'Giorno'],
		[7, 'Cidade dos Portões (6)', 'Solo Leveling ✓', 'Seul, Rio Han, Jeju', 'sombra', 'Penumbra', 'Sung Jin-Woo ✓'],
		[8, 'Estação Astral (7)', 'Star Rail', 'ilha flutuante, trem no mar', 'raio', 'Trovão', 'Trailblazer'],
		[9, 'Cidade Amaldiçoada (8)', 'Jujutsu Kaisen ✓', 'Shibuya + Escola Jujutsu', 'onirico', 'Sonho', 'Gojo Satoru ✓'],
	];
	rows.forEach(([n, city, serie, bioma, type, ins, fighter], i) => {
		const y = IY + 80 + i * 24;
		s += badge(x0 + cols[0] + 9, y - 5, n, TYPE[type], 0.78);
		s += T(x0 + cols[1], y, city, { size: 14.5, weight: 600, body: true, halo: false });
		s += T(x0 + cols[2], y, serie, { size: 14.5, weight: 700, body: true, halo: false, fill: serie.includes('✓') ? '#86efac' : '#ffe9a3' });
		s += T(x0 + cols[3], y, bioma, { size: 13.5, weight: 500, body: true, halo: false, fill: C.dim });
		s += r(x0 + cols[4], y - 12, 9, 14, TYPE[type], 'rx="2"') + T(x0 + cols[4] + 14, y, `${TNAME[type]} · ${ins}`, { size: 14.5, weight: 600, body: true, halo: false });
		s += T(x0 + cols[5], y, fighter, { size: 14.5, weight: 600, body: true, halo: false, fill: fighter.includes('✓') ? '#86efac' : C.ink });
	});
	s += T(x0 + 16, IY + 278, '✓ = já no jogo. Nomes provisórios. JoJo, Star Rail, Dragon Ball e Naruto você citou; Demon Slayer e One Piece são sugestão.', { size: 12.5, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}
function insetLine() {
	const x0 = MX + 866 + 14, w = 384;
	let s = frame(x0, IY, w, IH, 'LINHA DA AVENTURA');
	const stops = [['Vila Verdejante', 'normal', 1, 'R1 · R2'], ['Cidade Farol', 'agua', 2, 'R3 · Floresta · R4'], ['Capsule City', 'martial', 3, 'R5 · Círculo · R6 deserto'], ['Cidade das Dunas', 'vento', 4, 'R7 · Vale do Fim · R8 · Kamado · R9'], ['Vila das Glicínias', 'fogo', 5, 'R10 · Costa de Pedra'], ['Cidade Áurea', 'terra', 6, 'R11'], ['Cidade dos Portões', 'sombra', 7, 'R12 trem (ida e volta)'], ['Estação Astral', 'raio', 8, 'R13'], ['Cidade Amaldiçoada', 'onirico', 9, 'R14 · Caverna'], ['Liga dos Vanguardas', 'martial', 10, '']];
	s += ln(x0 + 30, IY + 50, x0 + 30, IY + 50 + 9 * 23, C.dim, 3);
	stops.forEach(([t, type, n, rt], i) => {
		const y = IY + 54 + i * 23;
		s += badge(x0 + 30, y - 4, n, TYPE[type], 0.72) + T(x0 + 48, y, t, { size: 14, weight: 700, body: true, halo: false });
		if (rt) s += T(x0 + w - 16, y + 11, rt, { size: 10.5, weight: 500, body: true, halo: false, fill: C.dim, anchor: 'end' });
	});
	s += T(x0 + 16, IY + 284, 'linear como Brick Bronze: cada rota só abre depois do ginásio anterior', { size: 11.5, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}
function insetSymbols() {
	const x0 = MX + 866 + 14 + 384 + 14, w = WW * K - (866 + 14 + 384 + 14);
	let s = frame(x0, IY, w, IH, 'SÍMBOLOS · ESCALA');
	const rows = [
		[gymM(x0 + 30, 0, TYPE.fogo), 'ginásio (cor = tipo)'],
		[c(x0 + 30, 0, 11, '#fff7d6', `stroke="${C.navy}" stroke-width="1.6"`) + T(x0 + 30, 4, 'R1', { size: 10, weight: 800, anchor: 'middle', fill: C.navy, halo: false }), 'rota (mato alto dos dois lados)'],
		[gateM(x0 + 30, 0, 1.4), 'portão / masmorra'],
		[ln(x0 + 14, 0, x0 + 46, 0, C.deck, 5) + ln(x0 + 14, 0, x0 + 46, 0, C.tie, 5, 'stroke-dasharray="1.6 3.4"'), 'trem (Expresso Astral)'],
		[ln(x0 + 14, 0, x0 + 46, 0, '#eaf6ff', 1.8, 'stroke-dasharray="5 4"'), 'balsa opcional'],
		[ln(x0 + 14, 0, x0 + 46, 0, '#ff7ad9', 1.6, 'stroke-dasharray="3 3"'), 'passagem pro Mundo dos Sonhos'],
		[poly([[x0 + 20, 6], [x0 + 30, -8], [x0 + 40, 6]], C.rock, `stroke="${C.rockEdge}" stroke-width=".8"`) + poly([[x0 + 27, -4], [x0 + 30, -8], [x0 + 33, -4]], C.snow), 'serra (bloqueia o atalho)'],
	];
	rows.forEach(([sym, t], i) => { const y = IY + 56 + i * 27; s += `<g transform="translate(0 ${y})">${sym}</g>` + T(x0 + 56, y + 5, t, { size: 14, weight: 600, body: true, halo: false }); });
	const bx = x0 + 20, by = IY + 258, seg = 50 * K;
	for (let i = 0; i < 2; i++) s += r(bx + i * seg, by - 5, seg, 10, i % 2 ? C.sheet : C.ink, `stroke="${C.ink}" stroke-width="1.2"`);
	[0, 50, 100].forEach((v) => (s += T(bx + (v / 50) * seg, by + 22, v === 0 ? '0' : v * 10 + ' studs', { size: 11, weight: 700, anchor: 'middle', halo: false })));
	s += T(bx + 2 * seg + 14, by + 4, '1 quadrado = 500 studs', { size: 12, weight: 700, halo: false, fill: C.dim });
	return s;
}
function drawTitleBlock() {
	const x0 = MX, y0 = 1540, w = WW * K, h = 118;
	let s = r(x0, y0, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	const cells = [['PROJETO', 'Pocket Vanguards', 300], ['FOLHA', '02 · Mapa da região: cidades, rotas e sub-lugares', 470], ['ESCALA', '1 quadrado = 500 studs (referência)', 300], ['GINÁSIOS', '8 + Liga · 14 rotas', 270], ['DATA', '16/10/2026', 150], ['REV.', 'B', w - 1490]];
	let x = x0;
	cells.forEach(([k, v, cw], i) => {
		if (i) s += ln(x, y0 + 12, x, y0 + h - 12, C.frame, 1.2);
		s += T(x + 16, y0 + 40, k, { size: 13, weight: 800, fill: C.cyan, halo: false, ls: 1.5 });
		const words = v.split(' ');
		let line = '', ly = y0 + 66;
		const maxChars = Math.floor(cw / 8.4);
		for (const wd of words) { if ((line + ' ' + wd).trim().length > maxChars) { s += T(x + 16, ly, line.trim(), { size: 17, weight: 600, body: true, halo: false }); line = wd; ly += 22; } else line += ' ' + wd; }
		s += T(x + 16, ly, line.trim(), { size: 17, weight: 600, body: true, halo: false });
		x += cw;
	});
	return s;
}
function drawHeader() {
	let s = '';
	s += T(40, 44, 'POCKET VANGUARDS · ROBLOX', { size: 17, weight: 800, fill: C.cyan, halo: false, ls: 3 });
	s += T(38, 98, 'MAPA DA REGIÃO', { size: 62, weight: 800, halo: false, ls: 1.5 });
	s += T(520, 74, 'Estilo Brick Bronze: você sai da Vila e segue R1, R2, R3… Cada cidade é o mundo de uma série', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	s += T(520, 99, 'e guarda um ginásio; entre elas, floresta, deserto, neve, caverna e ilhas com Ecos próprios.', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	const chips = ['fogo', 'agua', 'raio', 'sombra', 'terra', 'vento', 'martial', 'onirico', 'normal'];
	chips.forEach((k, i) => {
		const x = PX + (i % 5) * 224, y = 42 + Math.floor(i / 5) * 40;
		s += c(x + 12, y - 5, 12, TYPE[k], `stroke="${C.navy}" stroke-width="2"`) + T(x + 32, y + 1, TNAME[k], { size: 18, weight: 600, body: true, halo: false });
	});
	s += T(PX + 4 * 224, 83, 'cor = tipo do ginásio', { size: 16, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}

// ------------------------------------------------------------------ assemble
function buildSVG() {
	const g50 = 50 * K, g250 = 250 * K;
	const grid = `<pattern id="gridMinor" x="${MX}" y="${MY}" width="${g50}" height="${g50}" patternUnits="userSpaceOnUse"><path d="M ${g50} 0 L 0 0 0 ${g50}" fill="none" stroke="${C.grid}" stroke-opacity=".09" stroke-width="1"/></pattern><pattern id="gridMajor" x="${MX}" y="${MY}" width="${g250}" height="${g250}" patternUnits="userSpaceOnUse"><path d="M ${g250} 0 L 0 0 0 ${g250}" fill="none" stroke="${C.grid}" stroke-opacity=".18" stroke-width="1.2"/></pattern>`;
	DEFS.push(`<clipPath id="mapClip"><rect x="0" y="0" width="${WW}" height="${WH}" rx="10"/></clipPath>`);
	const map = `<g transform="translate(${MX} ${MY}) scale(${K})" clip-path="url(#mapClip)">${drawMap()}</g>` + r(MX, MY, WW * K, WH * K, 'none', `stroke="${C.frame}" stroke-width="2" rx="${10 * K}"`);
	const labels = drawMapLabels();
	const insets = insetTable() + insetLine() + insetSymbols() + drawTitleBlock();
	const panel = drawPanel();
	const header = drawHeader();
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${grid}${DEFS.join('')}</defs>` +
		r(0, 0, W, H, C.sheet) + r(0, 0, W, H, 'url(#gridMinor)') + r(0, 0, W, H, 'url(#gridMajor)') +
		ln(PX - 18, 140, PX - 18, H - 16, C.frame, 1, 'stroke-dasharray="2 6"') +
		map + labels + insets + panel + header + `</svg>`;
}

function findPkg(name) {
	const tries = [path.join(here, 'node_modules', name), ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map((p) => path.join(p, name))];
	for (const t of tries) if (fs.existsSync(t)) return t;
	throw new Error(`pacote ${name} não encontrado. Rode: npm i ${name}`);
}
async function main() {
	const svg = buildSVG();
	if (process.env.SVG_OUT) fs.writeFileSync(process.env.SVG_OUT, svg);
	const fonts = [['Barlow Condensed', 500, '@fontsource/barlow-condensed', 'barlow-condensed-latin-500-normal.woff2'], ['Barlow Condensed', 600, '@fontsource/barlow-condensed', 'barlow-condensed-latin-600-normal.woff2'], ['Barlow Condensed', 700, '@fontsource/barlow-condensed', 'barlow-condensed-latin-700-normal.woff2'], ['Barlow Condensed', 800, '@fontsource/barlow-condensed', 'barlow-condensed-latin-800-normal.woff2'], ['Barlow', 500, '@fontsource/barlow', 'barlow-latin-500-normal.woff2'], ['Barlow', 600, '@fontsource/barlow', 'barlow-latin-600-normal.woff2'], ['Barlow', 700, '@fontsource/barlow', 'barlow-latin-700-normal.woff2']]
		.map(([fam, wgt, pkg, file]) => `@font-face{font-family:'${fam}';font-weight:${wgt};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(findPkg(pkg), 'files', file)).toString('base64')}) format('woff2');}`)
		.join('\n');
	const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}\nhtml,body{margin:0;background:${C.sheet}}svg{display:block}</style></head><body>${svg}</body></html>`;
	const { chromium } = require(findPkg('playwright'));
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
	await page.setContent(html, { waitUntil: 'load' });
	await page.evaluate(() => document.fonts.ready);
	await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
	await browser.close();
	console.log('ok:', OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
