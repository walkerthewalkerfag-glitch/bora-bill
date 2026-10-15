// Gera blueprint-simulador.png: o mapa do simulador visto de cima + um desenho de referência para cada área.
// Uso:  npm install && npx playwright install chromium
//       npm run gerar                (ou: node gerar_blueprint.mjs [saida.png]; SCALE=1 gera em 2800x1680)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const OUT = process.argv[2] || path.join(here, 'blueprint-simulador.png');
const SCALE = Number(process.env.SCALE || 2);

// ------------------------------------------------------------------ canvas
const W = 2800, H = 1680;
const K = 1.48, MX = 46, MY = 150; // o mapa começa em (MX, MY); 1 stud = K px
const deg = Math.PI / 180;
const f = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const C = {
	sheet: '#0c2645', grid: '#9cc2ef', panel: '#10315a', panelEdge: '#2b5689', frame: '#3b6ca6',
	ink: '#f3f8ff', dim: '#a9c3e4', cyan: '#6fd3ff', halo: '#0c2645', navy: '#0c2645',
	grassIn: '#7cc067', grassOut: '#629f50', grassEdge: '#4d8a3f',
	path: '#ecdcb0', pathEdge: '#c7b080',
	plaza: '#e8e1d0', plazaLine: '#d3cab5',
	rock: '#8a7b6b', rockLine: '#a7978a', rockEdge: '#5f5348',
	plotDirt: '#c29760', plotYard: '#d8b67e', fence: '#6b4a2b',
	terra: '#b37b44', pedra: '#a2acb7', cristal: '#a77bff', magma: '#ff6b3d', nucleo: '#ffd447',
	rail: '#e1e7ee', tie: '#5b4636', deck: '#7b5b3f',
	water: '#58b8de', tree: '#3d8a46', treeLight: '#5aac5f', gold: '#f6c445', dark: '#1c2233',
};
const CAT = { social: '#2dd4bf', lote: '#f5a524', mina: '#a78bfa', evento: '#fb7185', transporte: '#7dd3fc' };
const PLAYER = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
const PORTAL = { trocas: '#4ade80', eventos: '#fb923c', vip: '#facc15', torneio: '#38bdf8' };

// ------------------------------------------------------------------ svg helpers
const DEFS = [];
const r = (x, y, w, h, fill, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`;
const c = (x, y, rad, fill, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${fill}" ${extra}/>`;
const el = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const poly = (pts, fill, extra = '') => `<polygon points="${pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="${fill}" ${extra}/>`;
const pth = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const ln = (x1, y1, x2, y2, stroke, w, extra = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const g = (inner, extra = '') => `<g ${extra}>${inner}</g>`;
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

// shared gradients
lin('skyDay', [[0, '#86c9f5'], [1, '#d9f1ff']]);
lin('skyEve', [[0, '#231b55'], [0.55, '#6b3a78'], [1, '#ff8f5e']]);
lin('caveP', [[0, '#2b2045'], [1, '#130e1e']]);
rad('gOrange', [[0, '#ffb15c', 0.95], [1, '#ff6b3d', 0]]);
rad('gPurple', [[0, '#c4a5ff', 0.9], [1, '#a77bff', 0]]);
rad('gCyan', [[0, '#a5f3fc', 0.9], [1, '#22d3ee', 0]]);
rad('gGold', [[0, '#fff1a8', 0.95], [1, '#f6c445', 0]]);
rad('gWhite', [[0, '#ffffff', 0.9], [1, '#ffffff', 0]]);
for (const [k, col] of Object.entries(PORTAL)) rad('portal_' + k, [[0, '#ffffff', 0.95], [0.35, col, 0.95], [1, col, 0.55]]);
DEFS.push(`<radialGradient id="grassGrad" cx="534" cy="360" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.grassIn}"/><stop offset="1" stop-color="${C.grassOut}"/></radialGradient>`);
DEFS.push(`<radialGradient id="craterGrad"><stop offset="0" stop-color="#5c4636"/><stop offset="1" stop-color="#2a201b"/></radialGradient>`);
DEFS.push(`<marker id="arrowW" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker>`);
DEFS.push(`<marker id="arrowC" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.cyan}"/></marker>`);
DEFS.push(`<marker id="arrowM" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.magma}"/></marker>`);

// ------------------------------------------------------------------ world (studs): a 1068 x 720 rectangle
const WW = 1068, WH = 720;
const X = (x) => MX + x * K, Y = (y) => MY + y * K;
function noise(t, s) { return 0.5 * Math.sin(3 * t + s) + 0.3 * Math.sin(7 * t + 2.1 * s) + 0.2 * Math.sin(13 * t + 0.7 * s) + 0.12 * Math.sin(23 * t + 1.3 * s); }
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function blob(cx, cy, r0, amp, seed, step = 10) { let d = ''; for (let a = 0; a < 360; a += step) { const rr = r0 + amp * noise(a * deg, seed); const x = cx + rr * Math.cos(a * deg), y = cy + rr * Math.sin(a * deg); d += (a === 0 ? 'M' : 'L') + f(x) + ' ' + f(y) + ' '; } return d + 'Z'; }
// closed polygon with rounded corners
function roundedPoly(pts, rad) {
	let d = '';
	pts.forEach((p, i) => {
		const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
		const l1 = Math.hypot(a[0] - p[0], a[1] - p[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]), rr = Math.min(rad, l1 / 2, l2 / 2);
		const p1 = [p[0] + ((a[0] - p[0]) / l1) * rr, p[1] + ((a[1] - p[1]) / l1) * rr], p2 = [p[0] + ((b[0] - p[0]) / l2) * rr, p[1] + ((b[1] - p[1]) / l2) * rr];
		d += `${i ? 'L' : 'M'} ${f(p1[0])} ${f(p1[1])} Q ${f(p[0])} ${f(p[1])} ${f(p2[0])} ${f(p2[1])} `;
	});
	return d + 'Z';
}
// contour line around the valley, d studs into the mountain
function contour(d, seed) {
	const x0 = 48 - d, y0 = 150 - d, x1 = 1020 + d, y1 = 570 + d, rr = 10 + d, pts = [];
	let n = 0;
	const push = (x, y, nx, ny) => { n += 1; const w = 3.2 * noise(n * 0.09, seed); pts.push(`${f(x + nx * w)} ${f(y + ny * w)}`); };
	const arc = (cx, cy, a0) => { for (let a = a0; a <= a0 + 90; a += 7.5) { const ca = Math.cos(a * deg), sa = Math.sin(a * deg); push(cx + rr * ca, cy + rr * sa, ca, sa); } };
	for (let x = x0 + rr; x <= x1 - rr; x += 6) push(x, y0, 0, -1);
	arc(x1 - rr, y0 + rr, -90);
	for (let y = y0 + rr; y <= y1 - rr; y += 6) push(x1, y, 1, 0);
	arc(x1 - rr, y1 - rr, 0);
	for (let x = x1 - rr; x >= x0 + rr; x -= 6) push(x, y1, 0, 1);
	arc(x0 + rr, y1 - rr, 90);
	for (let y = y1 - rr; y >= y0 + rr; y -= 6) push(x0, y, -1, 0);
	arc(x0 + rr, y0 + rr, 180);
	return 'M ' + pts.join(' L ') + ' Z';
}
// valley (clockwise) with the events zone carved into the north side and the lobby into the south side
const VALLEY = [[48, 150], [434, 150], [434, 100], [634, 100], [634, 150], [1020, 150], [1020, 570], [634, 570], [634, 620], [434, 620], [434, 570], [48, 570]];
const PLOTS = [[256, 200], [370, 200], [698, 200], [812, 200], [256, 520], [370, 520], [698, 520], [812, 520]];
const RAIL = [[197, 265], [871, 265], [871, 455], [197, 455]];
const STATIONS = [[534, 265, 0], [534, 455, 0], [197, 360, 90], [871, 360, 90]];
// x, y (84 x 58 studs), name, roof, icon, awning side (1 = bottom edge, -1 = top edge)
const SHOPS = [[218, 290, 'PICARETAS', '#ef4444', 'pick', 1], [308, 290, 'MOCHILAS', '#3b82f6', 'bag', 1], [218, 372, 'FORJA', '#64748b', 'anvil', -1], [308, 372, 'RENASCER', '#db2777', 'rebirth', -1], [676, 290, 'VENDER', '#16a34a', 'coin', 1], [766, 290, 'OVOS', '#9333ea', 'egg', 1], [676, 372, 'PLACARES', '#0284c7', 'trophy', -1], [766, 372, 'MISSÕES', '#f59e0b', 'quest', -1]];
// guide light: spawn -> through the hub -> gate of lote 2
const GUIDE = [[534, 506], [534, 440], [448, 420], [448, 292], [448, 276], [370, 276], [370, 254]];

// ------------------------------------------------------------------ small map icons
function star(x, y, r1, r2, n, fill, extra = '') { const pts = []; for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r2 : r1; const a = (i * 180) / n - 90; pts.push([x + rr * Math.cos(a * deg), y + rr * Math.sin(a * deg)]); } return poly(pts, fill, extra); }
const meteorMark = (x, y, s = 1) => star(x, y, 11 * s, 4.5 * s, 8, '#ff8a3d', `stroke="${C.navy}" stroke-width="1.2"`) + c(x, y, 3.2 * s, '#fff1a8');
const chestMark = (x, y, s = 1) => r(x - 6 * s, y - 4.5 * s, 12 * s, 9 * s, C.gold, `stroke="${C.navy}" stroke-width="1.2" rx="1.5"`) + ln(x - 6 * s, y - 0.8 * s, x + 6 * s, y - 0.8 * s, '#8a5520', 1.2);
const badge = (x, y, n, col) => c(x, y, 14, col, `stroke="${C.navy}" stroke-width="3"`) + T(x, y + 5.4, String(n), { size: 16, weight: 800, fill: C.navy, anchor: 'middle', halo: false });
function icon(kind, x, y, s = 1) {
	// tiny glyphs ~14 px, used on shop roofs and in the legend
	const k = s;
	switch (kind) {
		case 'pick': return ln(x - 5 * k, y + 5 * k, x + 4 * k, y - 4 * k, '#7a5232', 2 * k, 'stroke-linecap="round"') + pth(`M ${f(x - 2 * k)} ${f(y - 7 * k)} Q ${f(x + 6 * k)} ${f(y - 7 * k)} ${f(x + 7 * k)} ${f(y + 2 * k)}`, 'none', `stroke="#cfd6de" stroke-width="${f(2.4 * k)}" stroke-linecap="round"`);
		case 'bag': return r(x - 5 * k, y - 3 * k, 10 * k, 9 * k, '#8b5a2b', `rx="${f(2 * k)}"`) + pth(`M ${f(x - 3 * k)} ${f(y - 3 * k)} Q ${f(x)} ${f(y - 9 * k)} ${f(x + 3 * k)} ${f(y - 3 * k)}`, 'none', `stroke="#8b5a2b" stroke-width="${f(1.6 * k)}"`);
		case 'coin': return c(x, y, 6 * k, C.gold, `stroke="#b7861f" stroke-width="${f(1.4 * k)}"`) + T(x, y + 3.2 * k, '$', { size: 9 * k, weight: 800, fill: '#8a5a12', anchor: 'middle', halo: false });
		case 'egg': return el(x, y + 0.5 * k, 5 * k, 6.5 * k, '#f5f0ff', `stroke="#7c3aed" stroke-width="${f(1.2 * k)}"`) + c(x - 1.5 * k, y - 1 * k, 1.2 * k, '#a855f7') + c(x + 2 * k, y + 2 * k, 1.4 * k, '#a855f7');
		case 'anvil': return poly([[x - 6 * k, y - 3 * k], [x + 6 * k, y - 3 * k], [x + 3 * k, y + 1 * k], [x + 3 * k, y + 4 * k], [x - 3 * k, y + 4 * k], [x - 3 * k, y + 1 * k]], '#e2e8f0');
		case 'rebirth': return pth(`M ${f(x + 5 * k)} ${f(y - 1 * k)} A ${f(5 * k)} ${f(5 * k)} 0 1 1 ${f(x + 1 * k)} ${f(y - 5 * k)}`, 'none', `stroke="#fff" stroke-width="${f(2 * k)}"`) + poly([[x + 1 * k, y - 8 * k], [x + 5 * k, y - 5 * k], [x + 1 * k, y - 2 * k]], '#fff');
		case 'trophy': return pth(`M ${f(x - 5 * k)} ${f(y - 6 * k)} L ${f(x + 5 * k)} ${f(y - 6 * k)} L ${f(x + 4 * k)} ${f(y)} Q ${f(x)} ${f(y + 3 * k)} ${f(x - 4 * k)} ${f(y)} Z`, C.gold) + r(x - 1 * k, y + 1 * k, 2 * k, 3 * k, C.gold) + r(x - 3.5 * k, y + 4 * k, 7 * k, 2 * k, C.gold);
		case 'quest': return T(x, y + 5 * k, '!', { size: 15 * k, weight: 800, fill: '#fff', anchor: 'middle', halo: false });
		case 'wagon': return r(x - 6 * k, y - 3 * k, 12 * k, 6 * k, '#8a5a2b') + pth(`M ${f(x - 7 * k)} ${f(y - 3 * k)} Q ${f(x)} ${f(y - 10 * k)} ${f(x + 7 * k)} ${f(y - 3 * k)} Z`, '#7c3aed') + c(x - 3.5 * k, y + 4 * k, 2 * k, '#3b2a1a') + c(x + 3.5 * k, y + 4 * k, 2 * k, '#3b2a1a');
		case 'worm': { let s2 = ''; for (let i = 0; i < 5; i++) s2 += c(x - 8 * k + i * 4 * k, y + Math.sin(i * 1.3) * 2 * k, (2.6 + i * 0.35) * k, i === 4 ? '#e88d7f' : '#c9776a', `stroke="${C.navy}" stroke-width="0.8"`); return s2; }
		default: return '';
	}
}

// ------------------------------------------------------------------ the player plot (local: back/mountain at y<0, gate at y=+55)
function plotLocal(col, n = 0) {
	let s = '';
	s += r(-55, -55, 110, 110, C.plotDirt, 'rx="4"');
	s += r(-50, -50, 100, 100, C.plotYard, 'rx="3"');
	s += r(-7, 2, 14, 53, C.path);
	// pet pen
	s += r(-48, -46, 24, 24, '#9ad07a', `stroke="${C.fence}" stroke-width="1.6" stroke-dasharray="3 1.5"`);
	s += c(-40, -37, 3, '#f59e0b') + c(-31, -30, 3, '#f472b6');
	// upgrade bench (anvil)
	s += r(-46, -8, 18, 12, '#6b7480', 'rx="1.5"') + r(-43, -6, 12, 4, '#3f4652');
	// showcase pedestals
	[[36, -24, '#a77bff'], [36, -8, '#22d3ee'], [36, 8, '#f87171']].forEach(([x, y, gc]) => { s += c(x, y, 5, '#efe9dc', 'stroke="#b9ae95" stroke-width="1"') + c(x, y, 2.4, gc); });
	// rails tunnel -> chest, with a cart
	for (let y = -50; y < -16; y += 4) s += r(-5, y, 10, 1.6, C.tie);
	s += ln(-3, -54, -3, -15, C.rail, 1.1) + ln(3, -54, 3, -15, C.rail, 1.1);
	s += r(-6, -40, 12, 11, '#6b7280', 'rx="1.5"') + c(-2.5, -35.5, 2, C.gold) + c(2.5, -34, 2, '#22d3ee');
	// storage chest
	s += r(-10, -14, 20, 15, '#b8752e', 'rx="2"') + r(-10, -14, 20, 4, '#8a5520', 'rx="2"') + r(-1.5, -9, 3, 3, C.gold);
	// tunnel mouth into the cliff + timber frame
	s += pth('M -15 -55 A 15 10 0 0 0 15 -55 Z', '#1d140e') + r(-18, -57, 5, 7, '#8a5a2b') + r(13, -57, 5, 7, '#8a5a2b');
	// depth board
	s += r(16, -51, 28, 9, C.dark, 'rx="1.5"') + r(19, -48, 18, 3, '#ffb347');
	// front bushes, flag and name board
	s += c(-40, 40, 6, C.tree) + c(-36, 37, 3, C.treeLight) + c(42, 40, 6, C.tree) + c(46, 37, 3, C.treeLight);
	s += c(-49, 50, 1.6, '#3b2a1a') + poly([[-49, 50], [-49, 40], [-41, 43]], col);
	s += r(12, 47, 24, 6, col, 'rx="1"');
	// fence with gate gap
	s += pth('M -9 55 L -55 55 L -55 -55 M 55 -55 L 55 55 L 9 55', 'none', `stroke="${C.fence}" stroke-width="2.6" stroke-dasharray="4 2"`);
	return s;
}

// ------------------------------------------------------------------ MAP (in studs, inside a group scaled by K)
function drawMap() {
	let s = '';
	const hidden = (w = 0.8) => `stroke="${C.ink}" stroke-width="${w}" stroke-dasharray="4 3" opacity=".85"`;
	// mountain + contour lines
	s += r(0, 0, WW, WH, C.rock);
	for (const [d, seed] of [[18, 1.1], [40, 2.3], [64, 3.7], [90, 4.9], [118, 6.1]]) s += pth(contour(d, seed), 'none', `stroke="${C.rockLine}" stroke-width=".9" opacity=".75"`);
	// deep ring (Anel Profundo): one gallery around the whole map, in the magma layer
	const ring = (o) => roundedPoly([[24 - o, 52 - o], [1044 + o, 52 - o], [1044 + o, 668 + o], [24 - o, 668 + o]], 24 + o);
	s += pth(ring(0), 'none', `stroke="${C.magma}" stroke-width="8" opacity=".55"`) + pth(ring(5.5), 'none', hidden(0.75)) + pth(ring(-5.5), 'none', hidden(0.75));
	// shared caverns between neighbour tunnels (crystal layer)
	for (const [cx, cy] of [[313, 80], [755, 80], [313, 640], [755, 640]]) {
		s += ln(cx - 57, cy, cx + 57, cy, C.cristal, 7, 'opacity=".55"');
		s += pth(blob(cx, cy, 18, 2.2, cx * 0.01 + cy * 0.003), C.cristal, `fill-opacity=".6" ${hidden()}`);
		for (const [dx, dy] of [[-7, -3], [5, -7], [6, 5], [-3, 7]]) s += poly([[cx + dx, cy + dy - 3.2], [cx + dx + 2.2, cy + dy], [cx + dx, cy + dy + 3.2], [cx + dx - 2.2, cy + dy]], '#efe6ff');
	}
	// tunnels: straight from the back of each lot into the mountain, one colour per layer
	const LAYERS = [[150, 122, C.terra], [122, 94, C.pedra], [94, 66, C.cristal], [66, 38, C.magma], [38, 12, C.nucleo]];
	PLOTS.forEach(([cx], i) => {
		const m = (y) => (i < 4 ? y : WH - y);
		s += ln(cx, m(150), cx, m(12), '#2a1f17', 14, 'opacity=".55"');
		for (const [a, b, col] of LAYERS) s += ln(cx, m(a), cx, m(b), col, 7.5);
		s += ln(cx - 7, m(150), cx - 7, m(12), C.ink, 0.8, 'stroke-dasharray="4 3" opacity=".85"') + ln(cx + 7, m(150), cx + 7, m(12), C.ink, 0.8, 'stroke-dasharray="4 3" opacity=".85"');
		s += ln(cx, m(12), cx, m(5), C.ink, 1, 'stroke-dasharray="2 2" marker-end="url(#arrowW)"');
	});

	// valley floor + cliff hachures
	const valley = roundedPoly(VALLEY, 10);
	s += pth(valley, 'url(#grassGrad)') + pth(valley, 'none', `stroke="${C.grassEdge}" stroke-width="2"`);
	let hach = '';
	VALLEY.forEach(([x0, y0], i) => {
		const [x1, y1] = VALLEY[(i + 1) % VALLEY.length], len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
		for (let t = 10; t < len - 9; t += 6) { const qx = x0 + ux * t, qy = y0 + uy * t; hach += `M ${f(qx + uy * 1.5)} ${f(qy - ux * 1.5)} L ${f(qx + uy * 8)} ${f(qy - ux * 8)} `; }
	});
	s += pth(hach, 'none', `stroke="${C.rockEdge}" stroke-width="1.1" opacity=".85"`);

	// market wings, then paths (avenues, side streets, alleys through the wings)
	s += r(206, 282, 198, 156, '#e3dbc8', 'rx="4"') + r(664, 282, 198, 156, '#e3dbc8', 'rx="4"');
	const PATHS = [[188, 250, 880, 280], [188, 440, 880, 470], [188, 156, 206, 564], [862, 156, 880, 564], [206, 348, 414, 372], [654, 348, 862, 372]];
	for (const [x0, y0, x1, y1] of PATHS) s += r(x0 - 1.5, y0 - 1.5, x1 - x0 + 3, y1 - y0 + 3, C.pathEdge, 'rx="3"');
	for (const [x0, y0, x1, y1] of PATHS) s += r(x0, y0, x1 - x0, y1 - y0, C.path, 'rx="2"');
	// hedges between the lots, trees around the mine and the arena
	for (const gx of [306, 420, 634, 748]) for (const [y0, y1] of [[156, 244], [476, 564]]) {
		s += r(gx + 2.5, y0, 9, y1 - y0, '#3f8a46', 'rx="4.5"');
		for (let y = y0 + 5; y < y1 - 2; y += 10) s += c(gx + 7, y, 4.2, '#4f9c55');
	}
	for (const [x, y] of [[62, 170], [174, 170], [62, 550], [174, 550], [894, 170], [1006, 170], [894, 550], [1006, 550]]) s += c(x + 1, y + 1.5, 7, 'rgba(0,0,0,.18)') + c(x, y, 7, C.tree) + c(x - 2, y - 2, 3.5, C.treeLight);

	// hub plaza
	s += r(412, 286, 244, 148, C.pathEdge, 'rx="16"') + r(414, 288, 240, 144, C.plaza, 'rx="14"');
	let tiles = '';
	for (let x = 430; x <= 640; x += 16) tiles += `M ${x} 288 V 432 `;
	for (let y = 304; y <= 420; y += 16) tiles += `M 414 ${y} H 654 `;
	s += `<g clip-path="url(#plazaClip)">${pth(tiles, 'none', `stroke="${C.plazaLine}" stroke-width=".8"`)}</g>`;
	for (const [x, y] of [[430, 304], [638, 304], [430, 416], [638, 416]]) s += c(x, y, 8, '#5fae5a', 'stroke="#8a7a60" stroke-width="1.5"') + c(x - 2.5, y - 2, 1.8, '#f472b6') + c(x + 2.5, y + 2, 1.8, '#facc15');
	for (const x of [409, 659]) for (const y of [298, 322, 398, 422]) s += c(x, y, 3.6, '#4f9c55');
	// giant drill monument, countdown screen, merchant spot
	s += poly(Array.from({ length: 8 }, (_, i) => [534 + 22 * Math.cos((i * 45 + 22.5) * deg), 352 + 22 * Math.sin((i * 45 + 22.5) * deg)]), '#d6ceb9', 'stroke="#a99f88" stroke-width="1.5"');
	s += c(534, 352, 13.5, '#f2b134', 'stroke="#b7861f" stroke-width="1.5"');
	for (let i = 0; i < 4; i++) s += pth(`M 534 352 a ${6 + i} ${6 + i} 0 0 1 ${f(12 * Math.cos(i * 1.57))} ${f(12 * Math.sin(i * 1.57))}`, 'none', 'stroke="#a8740f" stroke-width="1.5"');
	s += c(534, 352, 2.6, '#fff1a8') + r(498, 379, 72, 14, C.dark, 'rx="2"');
	s += c(612, 410, 12, 'rgba(251,113,133,.16)', `stroke="${CAT.evento}" stroke-width="1.6" stroke-dasharray="4 2.5"`) + icon('wagon', 612, 411, 0.75);
	// shops: 4 on each side of the plaza
	for (const [x0, y0, , col, ic, aw] of SHOPS) {
		s += r(x0 + 2, y0 + 3, 84, 58, 'rgba(0,0,0,.18)', 'rx="3"') + r(x0, y0, 84, 58, col, 'rx="3"') + ln(x0 + 3, y0 + 29, x0 + 81, y0 + 29, 'rgba(255,255,255,.28)', 1.2);
		for (let i = 0; i < 7; i++) s += r(x0 + i * 12, aw === 1 ? y0 + 52 : y0, 12, 6, i % 2 ? '#ffffff' : 'rgba(0,0,0,.25)');
		s += c(x0 + 15, y0 + 29, 9.5, 'rgba(12,38,69,.6)') + icon(ic, x0 + 15, y0 + 29, 0.8);
	}

	// lots (top row: tunnel to the north; bottom row: tunnel to the south)
	PLOTS.forEach(([cx, cy], i) => (s += `<g transform="translate(${cx} ${cy}) rotate(${i < 4 ? 0 : 180}) scale(${(100 / 110).toFixed(4)})">${plotLocal(PLAYER[i])}</g>`));

	// live events zone (top centre, carved into the mountain)
	s += r(440, 104, 188, 142, '#d6c4a0', 'rx="24" stroke="#7d6b56" stroke-width="2.4"') + r(446, 110, 176, 130, 'none', 'rx="20" stroke="#e8dcbf" stroke-width="1.3" stroke-dasharray="1.5 4"');
	s += ln(504, 57, 510, 150, C.magma, 7, 'opacity=".55"') + ln(504, 57, 510, 150, C.ink, 0.8, 'stroke-dasharray="4 3"');
	const arcD = (rr, a0, a1) => `M ${f(534 + rr * Math.cos(a0 * deg))} ${f(182 + rr * Math.sin(a0 * deg))} A ${rr} ${rr} 0 0 1 ${f(534 + rr * Math.cos(a1 * deg))} ${f(182 + rr * Math.sin(a1 * deg))}`;
	for (const [a0, a1] of [[150, 210], [-30, 30]]) s += pth(arcD(54, a0, a1), 'none', 'stroke="#9aa6b5" stroke-width="13"') + pth(arcD(54, a0, a1), 'none', 'stroke="#c3ccd6" stroke-width="13" stroke-dasharray="1.5 3.5"');
	s += r(488, 104, 92, 6, C.dark, 'rx="1.5"') + r(492, 105.6, 84, 2.4, C.cyan) + r(482, 110, 104, 17, '#e5483b', 'rx="2.5"') + r(482, 124, 104, 3, '#a3271d') + c(488, 116, 2.2, '#fff3c4') + c(580, 116, 2.2, '#fff3c4');
	s += c(534, 182, 40, '#b9a284') + c(534, 182, 34, 'url(#craterGrad)');
	for (let i = 0; i < 7; i++) { const a = (i * 51 + 10) * deg; s += ln(534 + 8 * Math.cos(a), 182 + 8 * Math.sin(a), 534 + 28 * Math.cos(a), 182 + 28 * Math.sin(a), '#ff8a3d', 1.2, 'opacity=".7"'); }
	s += c(534, 182, 22, 'url(#gOrange)') + c(534, 182, 8.5, '#ff9b4a', 'stroke="#7a3b1e" stroke-width="1.5"') + c(531.5, 179.5, 2.8, '#ffe0a3');
	s += c(510, 150, 5.5, '#1b1411', `stroke="${C.magma}" stroke-width="1.6"`);

	// lobby / spawn (bottom centre, carved into the mountain), portals at the back
	s += r(440, 474, 188, 142, '#a6e3d8', 'rx="24" stroke="#5aa99b" stroke-width="2.4"');
	let lt = '';
	for (let x = 456; x <= 612; x += 16) lt += `M ${x} 474 V 616 `;
	for (let y = 490; y <= 602; y += 16) lt += `M 440 ${y} H 628 `;
	s += `<g clip-path="url(#lobbyClip)">${pth(lt, 'none', 'stroke="#c4eee6" stroke-width=".8"')}</g>`;
	s += c(534, 530, 24, '#e8fffb', 'stroke="#2ec4a9" stroke-width="2.2"') + c(534, 530, 15, 'none', 'stroke="#2ec4a9" stroke-width="1.4" stroke-dasharray="3 2"');
	s += r(507, 500, 6, 6, '#8a6a48') + r(555, 500, 6, 6, '#8a6a48') + r(507, 501.5, 54, 3, '#8a6a48');
	s += c(478, 528, 6, '#f6c445', `stroke="${C.navy}" stroke-width="1.2"`) + r(582, 522, 18, 12, C.gold, 'rx="2" stroke="#8a5520" stroke-width="1.2"');
	for (const [k, x] of [['trocas', 465], ['eventos', 511], ['vip', 557], ['torneio', 603]]) s += c(x, 600, 16, `url(#portal_${k})`, 'opacity=".55"') + c(x, 600, 10.5, `url(#portal_${k})`, 'stroke="#cfc6b2" stroke-width="3"');

	// public mine (west): open pit with terraces, a ramp from the street, rare veins
	s += r(56, 164, 124, 392, '#b9997a', 'rx="30" stroke="#7a6046" stroke-width="2.4"');
	for (const [d, col, rx] of [[12, '#a8865f', 24], [24, '#937150', 18], [36, '#7b5c40', 12], [48, '#634830', 8]]) s += r(56 + d, 164 + d, 124 - 2 * d, 392 - 2 * d, col, `rx="${rx}" stroke="rgba(0,0,0,.18)" stroke-width="1.4"`);
	s += r(110, 352, 78, 16, '#cdb08a');
	for (let x = 116; x < 188; x += 7) s += ln(x, 352, x, 368, '#a88b65', 0.9);
	for (const [x, y, col] of [[84, 205, '#22d3ee'], [150, 262, C.gold], [88, 318, '#c084fc'], [156, 420, '#f87171'], [82, 505, C.gold], [120, 455, '#22d3ee'], [118, 236, '#c084fc'], [150, 530, C.gold]]) s += c(x, y, 7, col, 'opacity=".3"') + poly([[x, y - 4.6], [x + 3.4, y], [x, y + 4.6], [x - 3.4, y]], col, `stroke="${C.navy}" stroke-width=".8"`);
	s += c(166, 184, 8, '#9aa3ad', 'stroke="#5b6573" stroke-width="1.6"') + c(166, 184, 5, C.water);
	for (const [x, y] of [[90, 252], [150, 478], [100, 432]]) s += chestMark(x, y, 0.85);

	// minigame arena (east): scoreboard, 8 lanes, queue pads, podium
	s += r(888, 164, 124, 392, '#efcf86', 'rx="24" stroke="#a9853c" stroke-width="2.4"');
	s += r(900, 174, 100, 18, C.dark, 'rx="2.5"');
	for (let i = 0; i < 8; i++) s += r(905 + i * 11.8, 178, 8, 10, ['#facc15', '#22c55e', '#38bdf8', '#fb7185'][i % 4]);
	for (let i = 0; i < 8; i++) { const y = 204 + i * 36; s += r(928, y, 76, 36, i % 2 ? '#e8bf62' : '#f4d891') + r(966, y + 8, 20, 20, '#4a3221', 'rx="1.5"') + r(969, y + 11, 14, 14, '#2a1b12'); }
	s += r(925.5, 204, 2.5, 288, '#ffffff');
	[306, 338, 370, 402].forEach((y, i) => (s += c(906, y, 9, ['#38bdf8', '#4ade80', '#facc15', '#fb7185'][i], 'stroke="#fff" stroke-width="2"')));
	s += r(922, 512, 22, 26, '#cbd5e1') + r(944, 504, 22, 34, C.gold) + r(966, 518, 22, 20, '#d97706');

	// elevated cart rail over the avenues, 4 stations, carts running clockwise
	const railD = roundedPoly(RAIL, 18);
	s += `<path d="${railD}" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="13" transform="translate(3 5)"/>`;
	s += pth(railD, 'none', `stroke="${C.deck}" stroke-width="12"`) + pth(railD, 'none', `stroke="${C.tie}" stroke-width="12" stroke-dasharray="2 4.5"`);
	s += pth(roundedPoly([[200.6, 268.6], [867.4, 268.6], [867.4, 451.4], [200.6, 451.4]], 14.4), 'none', `stroke="${C.rail}" stroke-width="1.3"`);
	s += pth(roundedPoly([[193.4, 261.4], [874.6, 261.4], [874.6, 458.6], [193.4, 458.6]], 21.6), 'none', `stroke="${C.rail}" stroke-width="1.3"`);
	for (const [x, y, rot] of STATIONS) s += `<g transform="translate(${x} ${y}) rotate(${rot})">${r(-20, -11, 40, 22, '#5d6b7a', `rx="2.5" stroke="${C.navy}" stroke-width="1.2"`)}${ln(-20, 0, 20, 0, '#8796a6', 1.6)}</g>`;
	for (const [x, y, rot, col] of [[340, 265, 0, '#e5483b'], [871, 300, 90, '#f59e0b'], [740, 455, 180, '#3b82f6'], [197, 420, 270, '#22c55e']]) {
		s += `<g transform="translate(${x} ${y}) rotate(${rot})">${r(-8, -5.5, 16, 11, col, `rx="2" stroke="${C.navy}" stroke-width="1.2"`)}${c(-2.5, 0, 2, C.gold)}${c(2.5, 0, 2, '#22d3ee')}`;
		for (const k of [1, 2]) s += pth(`M ${-10 - k * 6} -3.5 L ${-6 - k * 6} 0 L ${-10 - k * 6} 3.5`, 'none', `stroke="#fff" stroke-width="1.6" opacity="${0.95 - k * 0.3}"`);
		s += '</g>';
	}

	// event markers, the worm on the deep ring, the guide light from the spawn to a lot
	for (const [x, y] of [[313, 212], [755, 512], [409, 335], [659, 335]]) s += meteorMark(x, y, 0.8);
	s += `<g transform="translate(930 668) rotate(180)">${icon('worm', 0, 0, 1.1)}</g>` + ln(906, 668, 874, 668, C.magma, 2, 'marker-end="url(#arrowM)"');
	for (let i = 0; i < GUIDE.length - 1; i++) {
		const [x0, y0] = GUIDE[i], [x1, y1] = GUIDE[i + 1], len = Math.hypot(x1 - x0, y1 - y0);
		for (let t = 0; t < len; t += 9) { const x = x0 + ((x1 - x0) * t) / len, y = y0 + ((y1 - y0) * t) / len; s += c(x, y, 3.2, '#fff3b0', 'opacity=".35"') + c(x, y, 1.6, '#ffe27a', `stroke="${C.navy}" stroke-width=".45"`); }
	}
	// 50-stud grid over the map
	let gl = '';
	for (let x = 50; x < WW; x += 50) gl += `M ${x} 0 V ${WH} `;
	for (let y = 50; y < WH; y += 50) gl += `M 0 ${y} H ${WW} `;
	s += pth(gl, 'none', 'stroke="#ffffff" stroke-width=".5" opacity=".07"');
	return s;
}

// ------------------------------------------------------------------ MAP LABELS (px, drawn on top)
function drawMapLabels() {
	let s = '';
	const zl = (x, y, n, cat, title, sub) => badge(x - 4, y - 6, n, CAT[cat]) + T(x + 16, y, title, { size: 19, weight: 800, ls: 0.6 }) + (sub ? T(x + 16, y + 17, sub, { size: 13, weight: 600, fill: C.dim }) : '');
	// hub
	s += zl(X(534) - 62, Y(306), 2, 'social', 'HUB CENTRAL');
	s += T(X(534), Y(326), 'BROCA GIGANTE', { size: 11, weight: 800, anchor: 'middle', fill: '#5b4a2a', halo: false });
	s += T(X(534), Y(386) + 4, 'EVENTO EM 04:59', { size: 11, weight: 800, anchor: 'middle', fill: '#ffb15c', halo: false, ls: 0.6 });
	s += badge(X(590), Y(410), 11, CAT.evento) + T(X(590) - 20, Y(410) - 1, 'MERCADOR', { size: 14, weight: 800, anchor: 'end' }) + T(X(590) - 20, Y(410) + 13, 'a cada 1 h', { size: 12, weight: 700, anchor: 'end', fill: C.dim });
	for (const [x0, y0, name] of SHOPS) s += T(X(x0 + 51), Y(y0 + 29) + 5, name, { size: 14.5, weight: 800, anchor: 'middle', ls: 0.4 });
	// lots
	PLOTS.forEach(([cx], i) => (s += T(X(cx), Y(i < 4 ? 236 : 484) + 5, `LOTE ${i + 1}`, { size: 15, weight: 800, anchor: 'middle' })));
	s += badge(X(256) - 48, Y(236), 3, CAT.lote);
	// live events zone
	s += zl(X(534) - 82, Y(241), 6, 'evento', 'ZONA DE EVENTOS');
	s += T(X(534), Y(207), 'CRATERA DO METEORO', { size: 11, weight: 800, anchor: 'middle' });
	s += T(X(534), Y(121), 'PALCO + TELÃO', { size: 11.5, weight: 800, anchor: 'middle', halo: false });
	s += T(X(503), Y(149), 'saída do Verme', { size: 10.5, weight: 700, anchor: 'end', fill: '#ffd2bf' });
	// lobby + portals
	s += zl(X(534) - 76, Y(493), 1, 'social', 'LOBBY · CHEGADA');
	s += T(X(534), Y(530) + 4, 'SPAWN', { size: 11.5, weight: 800, anchor: 'middle', fill: '#0f766e', halo: false });
	s += T(X(478), Y(546) + 4, 'TUTORIAL', { size: 11, weight: 700, anchor: 'middle', fill: '#e6fffb' }) + T(X(591), Y(546) + 4, 'DIÁRIO', { size: 11, weight: 700, anchor: 'middle', fill: '#e6fffb' });
	s += badge(X(534) - 92, Y(578) - 5, 10, CAT.transporte) + T(X(534) - 74, Y(578), 'PORTAIS → OUTROS LOBBIES', { size: 15, weight: 800 });
	for (const [t, x] of [['TROCAS', 465], ['EVENTOS', 511], ['VIP', 557], ['TORNEIO', 603]]) s += T(X(x), Y(627), t, { size: 11.5, weight: 800, anchor: 'middle' });
	// mine + arena
	s += zl(X(60), Y(126), 8, 'mina', 'MINA PÚBLICA', 'veios raros p/ todos');
	s += T(X(156), Y(186) + 4, 'POÇO DOS DESEJOS', { size: 11, weight: 700, anchor: 'end' });
	s += zl(X(894), Y(126), 7, 'evento', 'ARENA', 'corrida de escavação');
	s += T(X(906), Y(424), 'FILA', { size: 12, weight: 800, anchor: 'middle' });
	for (const [x, y, t] of [[933, 529, '2'], [955, 524, '1'], [977, 532, '3']]) s += T(X(x), Y(y), t, { size: 12, weight: 800, anchor: 'middle', fill: '#3a2a12', halo: false });
	s += T(X(955), Y(551), 'PÓDIO', { size: 11, weight: 800, anchor: 'middle' });
	// underground
	s += zl(X(720), Y(116), 4, 'mina', 'TÚNEL', 'cada lote tem o seu');
	s += zl(X(280), Y(116), 5, 'mina', 'CAVERNA', 'compartilhada');
	for (const [y, t] of [[598, '100 m'], [626, '500 m'], [654, '1,5 km'], [682, '5 km']]) s += ln(X(256) - 11, Y(y), X(256) + 11, Y(y), C.ink, 1.6) + T(X(256) - 15, Y(y) + 4, t, { size: 11.5, weight: 700, anchor: 'end' });
	s += T(X(56), Y(44), 'ANEL PROFUNDO · liga todos os túneis', { size: 12.5, weight: 800, fill: '#ffd2bf', ls: 0.5 });
	s += T(X(892), Y(606), 'MONTANHA', { size: 14, weight: 800, fill: '#efe6da', ls: 2.5 }) + T(X(892), Y(606) + 16, 'os túneis entram aqui', { size: 12, weight: 600, fill: '#efe6da' });
	s += zl(X(892), Y(694), 12, 'evento', 'VERME GIGANTE', 'chefe que ronda o anel');
	// rail + guide light
	s += badge(X(572), Y(265), 9, CAT.transporte) + T(X(572) + 18, Y(265) + 5, 'ESTAÇÃO', { size: 13, weight: 800 });
	s += T(X(226), Y(455) + 4.5, 'TRILHO ELEVADO · POR CIMA DAS AVENIDAS', { size: 12, weight: 800, ls: 0.8 });
	s += T(X(441), Y(364) + 4, 'luz guia até o seu lote', { size: 12, weight: 700, fill: '#ffe9a3', anchor: 'end' });
	return s;
}
function drawRulers() {
	let s = '';
	for (let x = 0; x <= WW; x += 50) { s += ln(X(x), MY - (x % 100 ? 5 : 9), X(x), MY - 1, C.dim, 1.2); if (x % 100 === 0) s += T(X(x), MY - 13, String(x), { size: 11, weight: 700, anchor: 'middle', fill: C.dim, halo: false }); }
	for (let y = 0; y <= WH; y += 50) { s += ln(MX - (y % 100 ? 5 : 9), Y(y), MX - 1, Y(y), C.dim, 1.2); if (y % 100 === 0) s += T(MX - 12, Y(y) + 4, String(y), { size: 11, weight: 700, anchor: 'end', fill: C.dim, halo: false }); }
	s += T(X(WW), MY - 13, 'studs', { size: 11, weight: 700, anchor: 'end', fill: C.dim, halo: false });
	return s;
}

// ------------------------------------------------------------------ insets under the map
function frame(x, y, w, h, title) {
	let s = r(x, y, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) s += pth(`M ${cx + dx * 14} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * 14}`, 'none', `stroke="${C.cyan}" stroke-width="2.5"`);
	s += T(x + 14, y + 25, title, { size: 15, weight: 800, fill: C.cyan, ls: 1.2, halo: false });
	return s;
}
const IY = 1232, IW = 384, IH = 292;
function insetPlot() {
	const x0 = MX, y0 = IY, w = IW;
	let s = frame(x0, y0, w, IH, 'DETALHE DO LOTE · 100 × 100 STUDS');
	const k = 1.72, cx = x0 + w / 2, cy = y0 + 170;
	s += r(cx - 55 * k - 4, cy - 55 * k - 24, 110 * k + 8, 24, C.rock, 'rx="3"');
	for (let i = 0; i < 3; i++) s += ln(cx - 55 * k, cy - 55 * k - 5 - i * 6, cx + 55 * k, cy - 55 * k - 8 - i * 5, C.rockLine, 1);
	s += `<g transform="translate(${cx} ${cy}) scale(${k})">${plotLocal(PLAYER[0])}</g>`;
	const lab = (px, py, tx, ty, t, anchor) => ln(cx + px * k, cy + py * k, tx, ty, C.ink, 1, 'opacity=".8"') + c(cx + px * k, cy + py * k, 2.2, C.ink) + T(tx + (anchor === 'end' ? -4 : 4), ty + 4, t, { size: 13, weight: 700, anchor });
	s += T(cx, cy - 55 * k - 8, 'BOCA DO TÚNEL (na montanha)', { size: 12, weight: 800, anchor: 'middle', fill: '#fff' });
	const Lx = x0 + 92, Rx = x0 + w - 92;
	s += lab(-36, -34, Lx, cy - 66, 'pets', 'end') + lab(-37, -2, Lx, cy - 6, 'upgrade', 'end') + lab(-49, 46, Lx, cy + 64, 'bandeira', 'end');
	s += lab(30, -47, Rx, cy - 80, 'metragem', 'start') + lab(4, -34, Rx, cy - 48, 'trilho', 'start') + lab(10, -6, Rx, cy - 14, 'baú', 'start') + lab(41, 8, Rx, cy + 20, 'vitrine', 'start');
	s += T(cx, cy + 55 * k + 18, 'portão · placa com o nome', { size: 13, weight: 700, anchor: 'middle' });
	return s;
}
function insetLoop() {
	const x0 = MX + IW + 14, y0 = IY, w = IW;
	let s = frame(x0, y0, w, IH, 'LOOP DO JOGADOR');
	const steps = ['Cava no túnel', 'Enche a mochila', 'Vende no Hub', 'Compra melhoria', 'Desce mais fundo'];
	steps.forEach((t, i) => {
		const y = y0 + 62 + i * 36;
		s += c(x0 + 56, y, 12, CAT.lote, `stroke="${C.navy}" stroke-width="2"`) + T(x0 + 56, y + 5, String(i + 1), { size: 14, weight: 800, anchor: 'middle', fill: C.navy, halo: false }) + T(x0 + 78, y + 6, t, { size: 17, weight: 600, body: true, halo: false });
		if (i < 4) s += ln(x0 + 56, y + 13, x0 + 56, y + 23, C.dim, 1.5);
	});
	s += pth(`M ${x0 + 42} ${y0 + 206} Q ${x0 + 18} ${y0 + 206} ${x0 + 18} ${y0 + 182} L ${x0 + 18} ${y0 + 86} Q ${x0 + 18} ${y0 + 62} ${x0 + 40} ${y0 + 62}`, 'none', `stroke="${C.cyan}" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#arrowC)"`);
	s += r(x0 + 14, y0 + 238, w - 28, 38, 'rgba(219,39,119,.18)', `stroke="#db2777" stroke-width="1.5" rx="4"`);
	s += T(x0 + w / 2, y0 + 263, 'Chegou no Núcleo? RENASCE com bônus', { size: 15, weight: 700, anchor: 'middle', halo: false, fill: '#fbcfe8' });
	return s;
}
function insetScale() {
	const x0 = MX + 2 * (IW + 14), y0 = IY, w = IW;
	let s = frame(x0, y0, w, IH, 'NORTE · ESCALA · MEDIDAS');
	const nx = x0 + 52, ny = y0 + 90;
	s += c(nx, ny, 26, 'none', `stroke="${C.dim}" stroke-width="1.5"`) + poly([[nx, ny - 30], [nx + 9, ny + 6], [nx, ny], [nx - 9, ny + 6]], C.ink) + poly([[nx, ny + 30], [nx + 9, ny - 6], [nx, ny], [nx - 9, ny - 6]], 'none', `stroke="${C.ink}" stroke-width="1.2"`);
	s += T(nx, ny - 36, 'N', { size: 16, weight: 800, anchor: 'middle', halo: false });
	const bx = x0 + 130, by = y0 + 90, seg = 50 * K;
	for (let i = 0; i < 3; i++) s += r(bx + i * seg, by - 5, seg, 10, i % 2 ? C.sheet : C.ink, `stroke="${C.ink}" stroke-width="1.2"`);
	[0, 50, 100, 150].forEach((v) => (s += T(bx + (v / 50) * seg, by + 24, String(v), { size: 12.5, weight: 700, anchor: 'middle', halo: false })));
	s += T(bx + 1.5 * seg, by - 14, 'studs', { size: 12.5, weight: 700, anchor: 'middle', halo: false, fill: C.dim });
	const rows = [['Mapa inteiro', '1.068 × 720'], ['Lote', '100 × 100'], ['Praça do Hub', '240 × 144'], ['Avenidas', '30 de largura'], ['Spawn → Hub', '≈ 6 s a pé'], ['Hub → lotes', '5 a 12 s a pé']];
	rows.forEach(([k2, v], i) => { const y = y0 + 146 + i * 22; s += T(x0 + 18, y, k2, { size: 14, weight: 600, body: true, halo: false, fill: C.dim }) + T(x0 + w - 18, y, v, { size: 14, weight: 700, anchor: 'end', halo: false }); });
	s += T(x0 + 18, y0 + 278, 'medidas em studs · andando a 16 studs/s', { size: 12, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}
function insetSymbols() {
	const x0 = MX + 3 * (IW + 14), y0 = IY, w = IW;
	let s = frame(x0, y0, w, IH, 'SÍMBOLOS');
	const rows = [
		[meteorMark(x0 + 30, 0, 0.9), 'queda de meteoro (evento)'],
		[chestMark(x0 + 30, 0, 1.1), 'baú que cai (evento)'],
		[c(x0 + 30, 0, 11, 'rgba(251,113,133,.16)', `stroke="${CAT.evento}" stroke-width="2" stroke-dasharray="5 3"`), 'aparece por tempo limitado'],
		[ln(x0 + 14, -4, x0 + 46, -4, C.ink, 1.2, 'stroke-dasharray="5 4"') + ln(x0 + 14, 4, x0 + 46, 4, C.ink, 1.2, 'stroke-dasharray="5 4"'), 'subterrâneo (túnel, caverna)'],
		[icon('worm', x0 + 32, 0, 1.3), 'rota do Verme Gigante'],
		[r(x0 + 16, -8, 28, 16, '#5d6b7a', 'rx="3"'), 'estação do trilho'],
		[[0, 1, 2, 3].map((i) => c(x0 + 18 + i * 8, 0, 2.6, '#ffe27a', `stroke="${C.navy}" stroke-width=".8"`)).join(''), 'luz guia: spawn → lote'],
		[r(x0 + 16, -5, 28, 10, '#3f8a46', 'rx="5"') + c(x0 + 22, 0, 4, '#4f9c55') + c(x0 + 31, 0, 4, '#4f9c55') + c(x0 + 40, 0, 4, '#4f9c55'), 'cerca viva entre lotes'],
	];
	rows.forEach(([sym, t], i) => { const y = y0 + 54 + i * 29; s += `<g transform="translate(0 ${y})">${sym}</g>` + T(x0 + 62, y + 5, t, { size: 15, weight: 600, body: true, halo: false }); });
	return s;
}

// ------------------------------------------------------------------ vignettes (343 x 166, side views)
const VW = 343, VH = 166;
function avatar(x, y, s, shirt, pants = '#2b3a55', o = {}) {
	const skin = o.skin || '#f5c84c';
	const legW = 4.3 * s, legH = 8.5 * s, tw = 9 * s, th = 9 * s, aw = 3.9 * s, hw = 7 * s, hh = 6.6 * s;
	const ay = y - legH - th;
	let q = '';
	if (o.tool === 'pick') q += ln(x + tw / 2 + aw / 2, ay + th * 0.7, x + tw / 2 + 9 * s, ay - 9 * s, '#7a5232', 1.6 * s, 'stroke-linecap="round"') + pth(`M ${f(x + tw / 2 + 3 * s)} ${f(ay - 11 * s)} Q ${f(x + tw / 2 + 11 * s)} ${f(ay - 13 * s)} ${f(x + tw / 2 + 15 * s)} ${f(ay - 5 * s)}`, 'none', `stroke="#cfd6de" stroke-width="${f(2.2 * s)}" stroke-linecap="round"`);
	if (o.tool === 'drill') q += r(x + tw / 2 + 1 * s, ay + 3 * s, 9 * s, 4 * s, '#f2b134') + poly([[x + tw / 2 + 10 * s, ay + 2.5 * s], [x + tw / 2 + 16 * s, ay + 5 * s], [x + tw / 2 + 10 * s, ay + 7.5 * s]], '#cfd6de');
	q += r(x - tw / 2, y - legH, legW, legH, pants) + r(x + tw / 2 - legW, y - legH, legW, legH, pants);
	q += r(x - tw / 2, ay, tw, th, shirt);
	if (o.wave) q += r(x - tw / 2 - aw, ay - th + 1 * s, aw, th, skin, `transform="rotate(20 ${f(x - tw / 2)} ${f(ay)})"`);
	else q += r(x - tw / 2 - aw, ay, aw, th, skin);
	q += r(x + tw / 2, ay, aw, th, skin);
	const hy = ay - hh - 0.4 * s;
	q += r(x - hw / 2, hy, hw, hh, skin, `rx="${f(1.6 * s)}"`);
	q += c(x - 1.5 * s, hy + 2.6 * s, 0.6 * s, '#1b1b1b') + c(x + 1.5 * s, hy + 2.6 * s, 0.6 * s, '#1b1b1b');
	q += pth(`M ${f(x - 1.6 * s)} ${f(hy + 4.3 * s)} Q ${f(x)} ${f(hy + 5.4 * s)} ${f(x + 1.6 * s)} ${f(hy + 4.3 * s)}`, 'none', `stroke="#1b1b1b" stroke-width="${f(0.45 * s)}" stroke-linecap="round"`);
	if (o.hat === 'miner') q += pth(`M ${f(x - hw / 2 - 1 * s)} ${f(hy + 1.6 * s)} Q ${f(x)} ${f(hy - 4 * s)} ${f(x + hw / 2 + 1 * s)} ${f(hy + 1.6 * s)} Z`, '#facc15') + c(x, hy - 0.4 * s, 1.1 * s, '#fff');
	if (o.hat === 'wizard') q += poly([[x - hw / 2 - 2.5 * s, hy + 0.8 * s], [x + hw / 2 + 2.5 * s, hy + 0.8 * s], [x + 2 * s, hy - 10 * s]], '#6d28d9') + c(x + 2 * s, hy - 10 * s, 1.2 * s, C.gold);
	if (o.hat === 'cap') q += r(x - hw / 2, hy - 1 * s, hw, 2.6 * s, o.capColor || '#ef4444', `rx="${f(0.8 * s)}"`) + r(x, hy + 0.6 * s, hw * 0.75, 1.2 * s, o.capColor || '#ef4444');
	return q;
}
function pet(x, y, s, col) {
	return r(x - 6 * s, y - 7 * s, 11 * s, 5 * s, col, `rx="${f(1 * s)}"`) + r(x - 5 * s, y - 2 * s, 2 * s, 2 * s, col) + r(x + 2 * s, y - 2 * s, 2 * s, 2 * s, col) + r(x + 3 * s, y - 11 * s, 5.5 * s, 5 * s, col, `rx="${f(1 * s)}"`) + r(x + 3.5 * s, y - 13 * s, 1.6 * s, 2.4 * s, col) + c(x + 6.6 * s, y - 9 * s, 0.6 * s, '#1b1b1b') + ln(x - 6 * s, y - 6 * s, x - 9 * s, y - 9 * s, col, 1.4 * s);
}
function chestV(x, y, w, h, glow = true) {
	let q = glow ? el(x, y - h / 2, w, h, 'url(#gGold)', 'opacity=".55"') : '';
	q += r(x - w / 2, y - h * 0.62, w, h * 0.62, '#b8752e') + r(x - w / 2, y - h, w, h * 0.42, '#9a5f22', 'rx="3"');
	q += r(x - w / 2 + 3, y - h, 3, h, C.gold) + r(x + w / 2 - 6, y - h, 3, h, C.gold) + r(x - 2.5, y - h * 0.66, 5, 5, C.gold);
	return q;
}
function crystal(x, y, s, col, light) {
	const one = (dx, hgt, wid, tilt) => `<g transform="rotate(${tilt} ${f(x + dx)} ${f(y)})">` + poly([[x + dx - wid, y], [x + dx - wid, y - hgt * 0.7], [x + dx, y - hgt], [x + dx + wid, y - hgt * 0.7], [x + dx + wid, y]], col) + poly([[x + dx, y - hgt], [x + dx + wid, y - hgt * 0.7], [x + dx + wid, y], [x + dx, y]], light, 'opacity=".55"') + '</g>';
	return one(-4 * s, 12 * s, 2.6 * s, -18) + one(4 * s, 10 * s, 2.4 * s, 20) + one(0, 17 * s, 3.2 * s, 0);
}
function treeV(x, y, s) { return r(x - 2 * s, y - 10 * s, 4 * s, 10 * s, '#7a5232') + c(x, y - 16 * s, 9 * s, '#3f9a4a') + c(x - 6 * s, y - 11 * s, 6 * s, '#4fae58') + c(x + 6 * s, y - 12 * s, 6.5 * s, '#5bbb63'); }
function sparkle(x, y, s, col = '#fff') { return poly([[x, y - 5 * s], [x + 1.3 * s, y - 1.3 * s], [x + 5 * s, y], [x + 1.3 * s, y + 1.3 * s], [x, y + 5 * s], [x - 1.3 * s, y + 1.3 * s], [x - 5 * s, y], [x - 1.3 * s, y - 1.3 * s]], col); }
function signBoard(x, y, w, h, text, o = {}) { return r(x - w / 2, y - h / 2, w, h, o.bg || C.dark, `rx="${o.rx || 3}"`) + T(x, y + (o.size || 10) * 0.36, text, { size: o.size || 10, weight: 800, anchor: 'middle', fill: o.fill || '#fff', halo: false, ls: o.ls || 0.5 }); }
function stall(x, y, w, hgt, colA, label, ic) {
	let q = r(x + 4, y - 24, w - 8, 24, '#9a6b3f') + r(x + 2, y - 26, w - 4, 4, '#7a522d');
	q += r(x + 5, y - hgt + 10, 4, hgt - 34, '#6b4a2b') + r(x + w - 9, y - hgt + 10, 4, hgt - 34, '#6b4a2b');
	const n = 6, sw = w / n;
	for (let i = 0; i < n; i++) q += r(x + i * sw, y - hgt, sw, 14, i % 2 ? '#ffffff' : colA);
	for (let i = 0; i < n; i++) q += c(x + i * sw + sw / 2, y - hgt + 14, sw / 2, i % 2 ? '#ffffff' : colA);
	q += signBoard(x + w / 2, y - hgt - 11, w - 14, 16, label, { size: 11 });
	q += icon(ic, x + w / 2, y - 34, 1.2);
	return q;
}
function ground(y, col = '#74c160', dark = '#5ea84e') { return r(0, y, VW, VH - y, col) + r(0, y, VW, 3, dark); }

function vLobby() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += poly([[0, 76], [40, 58], [90, 66], [140, 50], [200, 62], [262, 46], [343, 58], [343, 128], [0, 128]], '#a39380');
	s += poly([[0, 92], [60, 82], [130, 88], [200, 80], [270, 86], [343, 78], [343, 128], [0, 128]], '#8f806e');
	s += r(0, 124, VW, 42, '#9fe0d4') + r(0, 124, VW, 3, '#7fcdbf');
	for (let x = 12; x < VW; x += 26) s += ln(x, 128, x - 8, 166, '#c2f0e7', 1.2);
	s += treeV(16, 124, 1.1) + treeV(330, 124, 1.0);
	// arch
	s += r(114, 56, 14, 70, '#8a6a48') + r(122, 56, 6, 70, '#745638') + r(214, 56, 14, 70, '#8a6a48') + r(222, 56, 6, 70, '#745638');
	s += r(104, 44, 134, 16, '#7a5a3a', 'rx="3"');
	s += signBoard(171, 40, 104, 22, 'BEM-VINDO', { bg: C.gold, fill: '#3a2a12', size: 14, ls: 1.5 });
	// spawn pad + light
	s += poly([[133, 128], [209, 128], [196, 60], [146, 60]], '#ffffff', 'opacity=".22"');
	s += el(171, 128, 50, 8, '#e6fffb', 'stroke="#2ec4a9" stroke-width="3"');
	s += avatar(171, 127, 1.15, '#3b82f6', '#1e3a8a');
	s += sparkle(150, 86, 1, '#ffffff') + sparkle(194, 74, 0.8, '#ffffff') + sparkle(186, 100, 0.6, '#fff7c2');
	// npc
	s += avatar(58, 127, 1.15, '#f97316', '#3f3f46', { hat: 'miner' });
	s += c(76, 70, 10, '#ffffff', `stroke="${C.dark}" stroke-width="1.5"`) + poly([[70, 77], [66, 84], [75, 79]], '#ffffff') + T(76, 76, '!', { size: 15, weight: 800, anchor: 'middle', fill: '#f97316', halo: false });
	// daily chest + codes
	s += chestV(266, 127, 30, 22) + sparkle(250, 98, 0.8, '#fff7c2') + sparkle(284, 92, 0.6, '#fff7c2');
	s += T(266, 92, 'DIÁRIO', { size: 11, weight: 800, anchor: 'middle', fill: '#3a2a12', halo: false });
	s += r(309, 98, 4, 29, '#4b5563') + r(296, 82, 30, 19, C.dark, 'rx="2"') + r(299, 85, 24, 6, C.cyan, 'opacity=".8"') + r(299, 93, 16, 4, C.cyan, 'opacity=".5"');
	return s;
}
function vHub() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += poly([[0, 92], [50, 70], [100, 84], [160, 64], [230, 82], [290, 66], [343, 80], [343, 118], [0, 118]], '#9fb4c4', 'opacity=".7"');
	s += ground(116, '#e3dccb', '#cbc2ad');
	for (let x = -10; x < VW; x += 30) s += ln(x, 120, x - 14, 166, '#d6cdb8', 1.2);
	s += ln(0, 140, VW, 140, '#d6cdb8', 1.2);
	s += stall(10, 124, 82, 72, '#ef4444', 'PICARETAS', 'pick');
	s += stall(251, 124, 82, 72, '#16a34a', 'VENDER', 'coin');
	// monument
	s += el(171, 22, 26, 22, 'url(#gGold)', 'opacity=".6"');
	s += r(141, 98, 60, 24, '#d1c8b3') + r(186, 98, 15, 24, '#b9af98') + r(136, 94, 70, 6, '#bdb39c');
	s += signBoard(171, 111, 58, 13, 'EVENTO 04:59', { bg: C.dark, fill: '#ffb15c', size: 8.5, ls: 0.2 });
	s += r(158, 76, 26, 18, '#9aa3ad') + r(176, 76, 8, 18, '#7c8691') + r(154, 72, 34, 6, '#6b7480');
	s += poly([[156, 72], [186, 72], [171, 14]], '#f2b134');
	for (let i = 0; i < 4; i++) { const yy = 66 - i * 13; const hw = 15 * (1 - (72 - yy) / 58); s += ln(171 - hw, yy, 171 + hw * 0.9, yy - 7, '#c98a14', 2.4); }
	s += poly([[171, 14], [186, 72], [178, 72]], '#d39a1f', 'opacity=".6"');
	s += avatar(118, 150, 1.0, '#a855f7', '#312e81') + avatar(226, 158, 1.0, '#ef4444', '#1f2937', { hat: 'cap', capColor: '#111827' }) + pet(246, 158, 0.9, '#f59e0b');
	return s;
}
function vPlot() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += poly([[150, 128], [168, 70], [196, 46], [236, 30], [282, 38], [343, 22], [343, 128]], '#8b7c6c');
	s += poly([[196, 46], [236, 30], [282, 38], [343, 22], [343, 34], [282, 50], [236, 42]], '#a89886');
	s += ln(170, 90, 343, 76, '#77695b', 2) + ln(158, 112, 343, 102, '#77695b', 2);
	s += r(276, 12, 3, 28, '#5b4636') + r(318, 8, 3, 30, '#5b4636') + r(264, 2, 68, 22, C.dark, 'rx="3"');
	s += T(298, 19, '1.240 m', { size: 15, weight: 800, anchor: 'middle', fill: '#ffb347', halo: false });
	s += pth('M 212 128 L 212 100 A 25 25 0 0 1 262 100 L 262 128 Z', '#1d140e');
	s += r(207, 96, 7, 32, '#8a5a2b') + r(260, 96, 7, 32, '#8a5a2b') + r(203, 90, 68, 8, '#9a6a3a', 'rx="2"');
	s += ground(124);
	s += r(92, 121, 176, 3, '#9aa3ad');
	for (let x = 96; x < 266; x += 10) s += r(x, 123, 5, 3, '#5b4636');
	// minecart with ore
	s += c(184, 112, 6, C.gold) + c(193, 109, 6, '#22d3ee') + c(201, 113, 5, '#c084fc');
	s += poly([[174, 112], [210, 112], [206, 124], [178, 124]], '#6b7280') + r(172, 110, 40, 4, '#4b5563');
	s += c(182, 124, 3.4, '#1f2937') + c(202, 124, 3.4, '#1f2937');
	// fence, flag, name sign
	for (let x = 4; x < 46; x += 10) s += r(x, 104, 4, 22, '#8a5a2b');
	s += r(0, 108, 50, 3, '#a06a35') + r(0, 116, 50, 3, '#a06a35');
	s += r(26, 64, 3, 62, '#5b4636') + poly([[29, 64], [50, 70], [29, 76]], '#3b82f6');
	s += r(58, 104, 3, 22, '#5b4636') + r(88, 104, 3, 22, '#5b4636') + signBoard(74, 98, 50, 16, '@SeuNome', { bg: C.gold, fill: '#3a2a12', size: 10, ls: 0 });
	// showcase + chest + player + pet
	for (const [x, gc] of [[104, '#a77bff'], [122, '#22d3ee']]) s += c(x, 100, 9, gc, 'opacity=".25"') + r(x - 5, 108, 10, 18, '#e8e1d3') + r(x - 7, 106, 14, 4, '#cfc6b2') + poly([[x, 94], [x + 4, 100], [x, 106], [x - 4, 100]], gc);
	s += chestV(146, 127, 26, 20);
	s += avatar(232, 127, 1.05, '#ef4444', '#1f2937', { tool: 'pick' });
	s += pet(252, 127, 0.9, '#f59e0b');
	return s;
}
function vTunnel() {
	let s = r(0, 0, VW, 30, 'url(#skyDay)');
	const bands = [[30, 56, '#b37b44', 'TERRA', '0–100 m'], [56, 82, '#8f9aa6', 'PEDRA', '100–500 m'], [82, 108, '#5b3f99', 'CRISTAL', '0,5–1,5 km'], [108, 136, '#a8381f', 'MAGMA', '1,5–5 km'], [136, 166, '#e0a31a', 'NÚCLEO', '5 km+']];
	for (const [y0, y1, col] of bands) s += r(0, y0, VW, y1 - y0, col);
	s += r(0, 26, VW, 5, '#74c160');
	s += r(84, 12, 76, 16, '#d8b67e', 'opacity=".9"') + r(96, 2, 3, 14, '#5b4636') + poly([[99, 2], [112, 6], [99, 10]], '#3b82f6');
	const rand = rng(11);
	const ore = [['#2b2b2b', 'c'], ['#e8b4a0', 'c'], ['#c4a5ff', 'd'], ['#ffb347', 'c'], ['#fff1a8', 'c']];
	bands.forEach(([y0, y1], i) => { for (let k = 0; k < 9; k++) { const x = 112 + rand() * 225, y = y0 + 5 + rand() * (y1 - y0 - 10); const [col, sh] = ore[i]; s += sh === 'c' ? c(x, y, 2.4 + rand() * 1.6, col, i >= 3 ? '' : 'opacity=".85"') : poly([[x, y - 4], [x + 2.6, y], [x, y + 4], [x - 2.6, y]], col); if (i >= 3) s += c(x, y, 6, i === 3 ? 'url(#gOrange)' : 'url(#gGold)', 'opacity=".6"'); } });
	s += el(250, 95, 34, 10, '#c4a5ff', 'opacity=".35"');
	const zig = 'M 132 28 L 300 46 L 150 68 L 312 88 L 160 112 L 304 132 L 224 152';
	s += pth(zig, 'none', 'stroke="#1b120c" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"');
	s += pth(zig, 'none', 'stroke="#c0c7cf" stroke-width="1.2" stroke-dasharray="3 3" stroke-linejoin="round"');
	s += avatar(222, 151, 0.62, '#ef4444', '#1f2937', { tool: 'drill' }) + sparkle(238, 146, 0.7, '#fff7c2');
	bands.forEach(([y0, y1, , name, rng2]) => { s += T(8, y0 + 12, name, { size: 11.5, weight: 800, haloW: 3 }) + T(8, y0 + 23, rng2, { size: 10, weight: 700, fill: '#f1e9ff', haloW: 3 }); });
	s += T(250, 99, 'caverna', { size: 9.5, weight: 800, anchor: 'middle', haloW: 2.6 });
	return s;
}
function vCavern() {
	let s = r(0, 0, VW, VH, 'url(#caveP)');
	s += c(171, 96, 90, 'url(#gPurple)', 'opacity=".45"');
	s += poly([[0, 0], [343, 0], [343, 22], [300, 34], [250, 20], [200, 36], [150, 24], [100, 38], [50, 22], [0, 30]], '#1a1328');
	s += poly([[0, 166], [0, 140], [40, 134], [90, 142], [140, 132], [200, 140], [260, 130], [300, 138], [343, 132], [343, 166]], '#3a2d55');
	s += pth('M 0 140 L 0 72 Q 26 66 40 84 L 44 140 Z', '#0d0915') + pth('M 343 136 L 343 70 Q 318 64 302 82 L 299 136 Z', '#0d0915');
	s += T(6, 64, 'SEU TÚNEL', { size: 10.5, weight: 800, fill: '#e9ddff', haloColor: '#130e1e', haloW: 3 });
	s += T(337, 62, 'TÚNEL DO VIZINHO', { size: 10.5, weight: 800, anchor: 'end', fill: '#e9ddff', haloColor: '#130e1e', haloW: 3 });
	for (const [x, y, sc, col, li] of [[70, 140, 1.4, '#a77bff', '#e9ddff'], [262, 136, 1.6, '#22d3ee', '#cffafe'], [120, 136, 0.9, '#22d3ee', '#cffafe'], [222, 140, 1.0, '#a77bff', '#e9ddff']]) s += c(x, y - 10, 20 * sc, col === '#22d3ee' ? 'url(#gCyan)' : 'url(#gPurple)', 'opacity=".6"') + crystal(x, y, sc, col, li);
	for (const [x, y] of [[96, 30], [210, 34], [280, 26]]) s += `<g transform="rotate(180 ${x} ${y})">${crystal(x, y, 0.9, '#a77bff', '#e9ddff')}</g>`;
	s += avatar(150, 138, 1.08, '#ef4444', '#1f2937', { tool: 'pick' }) + avatar(196, 138, 1.08, '#22c55e', '#14532d', { wave: true });
	s += c(173, 66, 15, '#ffffff', `stroke="${C.dark}" stroke-width="1.5"`) + poly([[168, 79], [164, 87], [174, 80]], '#ffffff');
	s += pth('M 165 62 L 181 62', 'none', 'stroke="#7c3aed" stroke-width="2.4" marker-end="url(#arrowV)"') + pth('M 181 70 L 165 70', 'none', 'stroke="#16a34a" stroke-width="2.4" marker-end="url(#arrowG)"');
	return s;
}
DEFS.push(`<marker id="arrowV" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#7c3aed"/></marker>`);
DEFS.push(`<marker id="arrowG" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#16a34a"/></marker>`);
function vEvents() {
	let s = r(0, 0, VW, VH, 'url(#skyEve)');
	const rand = rng(5);
	for (let i = 0; i < 26; i++) s += c(rand() * VW, rand() * 60, 0.6 + rand() * 0.9, '#ffffff', `opacity="${0.4 + rand() * 0.5}"`);
	s += poly([[0, 110], [60, 96], [120, 104], [190, 92], [260, 102], [343, 94], [343, 128], [0, 128]], '#3b2a4a');
	s += ground(124, '#5e4a3e', '#4a3a30');
	// stage
	s += r(204, 104, 132, 22, '#2f2633') + r(204, 104, 132, 5, '#e5483b');
	s += pth('M 206 104 L 206 34 L 334 34 L 334 104', 'none', 'stroke="#9aa3ad" stroke-width="3"') + ln(206, 34, 334, 34, '#9aa3ad', 5);
	s += r(222, 42, 96, 46, '#141a2b', 'rx="2"') + r(224, 44, 92, 42, '#1f2a44');
	s += T(270, 64, 'AO VIVO', { size: 16, weight: 800, anchor: 'middle', fill: '#ff6b6b', halo: false, ls: 1 });
	s += T(270, 80, 'SÁB · 18H', { size: 11, weight: 800, anchor: 'middle', fill: '#ffffff', halo: false, ls: 1 });
	for (const x of [216, 324]) s += poly([[x, 38], [x - 30, 124], [x + 22, 124]], '#fff3c4', 'opacity=".14"') + c(x, 38, 4, '#fff3c4');
	// crater + meteor
	s += el(98, 130, 70, 13, '#2a1f1a') + el(98, 128, 72, 12, 'none', 'stroke="#8a6a50" stroke-width="3"');
	s += c(98, 124, 22, 'url(#gOrange)') + c(98, 125, 8, '#ff7a2f');
	s += pth('M 340 -4 L 143 82 L 122 100 Z', 'url(#trail)');
	s += c(132, 92, 18, 'url(#gOrange)') + c(132, 92, 10, '#7a3b2a', 'stroke="#ff9b4a" stroke-width="2.5"');
	// crowd
	const shirts = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#ffffff', '#16a34a'];
	for (let i = 0; i < 10; i++) s += avatar(176 + i * 16, 166 - (i % 2) * 3, 0.68, shirts[i], '#1f2937');
	s += avatar(40, 160, 0.8, '#3b82f6', '#1e3a8a', { wave: true }) + avatar(160, 162, 0.8, '#f97316', '#3f3f46');
	return s;
}
lin('trail', [[0, '#ff6b3d', 0.95], [0.45, '#ffb15c', 0.65], [1, '#fff1a8', 0]], false);
function vArena() {
	let s = r(0, 0, VW, 50, 'url(#skyDay)');
	for (let i = 0; i < 3; i++) s += r(0, 22 + i * 8, VW, 6, ['#9aa6b5', '#b6c0cc', '#c9d1db'][i]);
	s += r(0, 50, VW, 116, '#9a6b45');
	for (let y = 70; y < 166; y += 22) s += ln(0, y, VW, y + 3, '#8a5e3c', 2);
	s += r(0, 47, VW, 6, '#74c160');
	s += r(8, 8, 6, 44, '#4b5563') + r(329, 8, 6, 44, '#4b5563') + r(8, 6, 327, 16, C.dark, 'rx="3"');
	s += c(150, 14, 4, '#ef4444') + c(171, 14, 4, '#facc15') + c(192, 14, 4, '#22c55e');
	s += T(20, 18.5, 'CORRIDA · 60 s', { size: 11, weight: 800, fill: '#ffffff', halo: false, ls: 0.5 });
	s += T(323, 18.5, 'FILA → JOGA', { size: 11, weight: 800, anchor: 'end', fill: '#ffffff', halo: false, ls: 0.5 });
	const depth = [64, 92, 50, 104, 80, 58];
	const shirts = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];
	depth.forEach((d, i) => {
		const cx = 44 + i * 51;
		s += r(cx - 13, 53, 26, d, '#3a2618') + r(cx - 13, 53, 26, 4, '#2a1b12');
		s += avatar(cx - 2, 53 + d - 1, 0.62, shirts[i], '#1f2937', { tool: 'drill' }) + sparkle(cx + 8, 53 + d - 6, 0.5, '#fff7c2');
		s += r(cx - 1, 34, 2, 14, '#e5e7eb') + poly([[cx + 1, 34], [cx + 11, 37], [cx + 1, 40]], shirts[i]);
	});
	s += poly([[193, 28], [196, 22], [200, 27], [204, 22], [207, 28]], C.gold, `stroke="#8a5a12" stroke-width=".8"`);
	return s;
}
function vMine() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += poly([[0, 84], [70, 58], [140, 72], [210, 52], [290, 66], [343, 56], [343, 120], [0, 120]], '#9b8b7a');
	s += ground(116);
	s += poly([[56, 116], [288, 116], [266, 128], [246, 128], [228, 142], [208, 142], [196, 166], [146, 166], [134, 142], [114, 142], [96, 128], [76, 128]], '#5d442d');
	for (const [x0, x1, y] of [[60, 98, 128], [244, 284, 128], [96, 134, 142], [208, 246, 142]]) s += r(x0, y - 3, x1 - x0, 4, '#a8865f');
	s += r(140, 162, 62, 4, '#a8865f');
	for (const [x, y, col] of [[80, 124, '#22d3ee'], [262, 124, C.gold], [118, 138, '#c084fc'], [226, 138, '#f87171'], [170, 160, C.gold]]) s += c(x, y - 2, 11, col === C.gold ? 'url(#gGold)' : col === '#22d3ee' ? 'url(#gCyan)' : 'url(#gPurple)', 'opacity=".7"') + poly([[x, y - 9], [x + 5, y - 2], [x, y + 3], [x - 5, y - 2]], col, `stroke="${C.dark}" stroke-width=".8"`);
	s += avatar(104, 125, 0.8, '#ef4444', '#1f2937', { tool: 'pick' }) + avatar(236, 139, 0.8, '#3b82f6', '#1e3a8a', { tool: 'pick' }) + avatar(158, 163, 0.8, '#22c55e', '#14532d', { tool: 'pick' });
	// wishing well
	s += r(8, 108, 40, 20, '#9aa3ad') + el(28, 108, 20, 5, '#58b8de', 'stroke="#7c8691" stroke-width="2"') + r(10, 80, 3, 28, '#6b4a2b') + r(43, 80, 3, 28, '#6b4a2b') + poly([[2, 82], [28, 66], [54, 82]], '#b45309');
	s += sparkle(28, 100, 0.6, '#fff7c2') + T(5, 146, 'POÇO DOS DESEJOS', { size: 10, weight: 800, fill: '#ffffff', haloColor: '#2f5e2a', haloW: 2.6 });
	// chest with parachute
	s += pth('M 270 34 Q 296 4 322 34 Z', '#ef4444') + pth('M 283 34 Q 296 12 309 34 Z', '#ffffff') + ln(272, 34, 290, 56, '#e5e7eb', 1) + ln(320, 34, 302, 56, '#e5e7eb', 1);
	s += chestV(296, 66, 20, 14, false);
	return s;
}
function vRail() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += poly([[298, 74], [310, 22], [322, 74]], '#f2b134', 'opacity=".8"') + r(300, 74, 20, 8, '#9aa3ad', 'opacity=".8"');
	s += ground(138);
	for (let x = 30; x < VW; x += 56) s += r(x, 82, 7, 56, '#5b4636') + ln(x + 3, 84, x + 59, 136, '#6b4a2b', 2) + ln(x + 59, 84, x + 3, 136, '#6b4a2b', 2);
	s += r(0, 74, VW, 8, '#6b4a2b') + r(0, 72, VW, 3, '#cfd6de');
	// station
	s += r(10, 76, 104, 8, '#8a8f98') + r(14, 38, 4, 38, '#4b5563') + r(104, 38, 4, 38, '#4b5563') + poly([[4, 40], [120, 40], [112, 28], [12, 28]], '#3b82f6');
	s += signBoard(62, 20, 72, 14, 'ESTAÇÃO NORTE', { size: 9.5 });
	for (let i = 0; i < 6; i++) s += r(114 + i * 6, 84 + i * 9, 10, 3, '#8a8f98');
	s += avatar(52, 74, 0.9, '#a855f7', '#312e81');
	// cart with riders
	s += avatar(214, 58, 0.85, '#ef4444', '#1f2937') + avatar(236, 58, 0.85, '#22c55e', '#14532d', { wave: true });
	s += poly([[198, 50], [254, 50], [248, 72], [204, 72]], '#e5483b') + r(196, 48, 60, 4, '#b91c1c');
	s += c(212, 74, 4, '#2b2b2b') + c(242, 74, 4, '#2b2b2b');
	for (const [y, w] of [[54, 34], [62, 46], [70, 28]]) s += ln(190 - w, y, 186, y, '#ffffff', 2, 'stroke-linecap="round" opacity=".8"');
	return s;
}
function vPortals() {
	let s = r(0, 0, VW, VH, '#8b7c6c');
	for (const y of [26, 60, 98]) s += ln(0, y, VW, y + 6, '#77695b', 2);
	s += ground(132, '#9fe0d4', '#7fcdbf');
	[['trocas', 48, 'TROCAS'], ['eventos', 129, 'EVENTOS'], ['vip', 214, 'VIP'], ['torneio', 295, 'TORNEIO']].forEach(([k, x, t]) => {
		s += pth(`M ${x - 32} 134 L ${x - 32} 66 A 32 32 0 0 1 ${x + 32} 66 L ${x + 32} 134 Z`, '#cfc6b2');
		s += pth(`M ${x - 23} 134 L ${x - 23} 68 A 23 23 0 0 1 ${x + 23} 68 L ${x + 23} 134 Z`, `url(#portal_${k})`);
		s += el(x, 96, 12, 22, '#ffffff', 'opacity=".25"');
		s += signBoard(x, 22, 64, 17, t, { size: 11.5, ls: 1 });
	});
	s += `<g opacity=".55">${avatar(214, 132, 0.95, '#3b82f6', '#1e3a8a')}</g>`;
	s += avatar(160, 160, 0.95, '#ef4444', '#1f2937') + avatar(258, 162, 0.95, '#22c55e', '#14532d', { wave: true });
	return s;
}
function vMerchant() {
	let s = r(0, 0, VW, VH, 'url(#skyDay)');
	s += ground(124, '#e3dccb', '#cbc2ad');
	s += pth('M 112 82 Q 196 10 280 82 Z', '#7c3aed');
	for (let i = 0; i < 6; i++) { const x0 = 112 + i * 28; s += pth(`M ${x0} 82 Q ${x0 + 14} ${82 - 34 - Math.sin((i + 0.5) / 6 * Math.PI) * 18} ${x0 + 28} 82 Z`, i % 2 ? C.gold : '#7c3aed', 'opacity=".9"'); }
	s += r(120, 82, 152, 40, '#8a5a2b') + ln(120, 96, 272, 96, '#6b4a2b', 1.5) + ln(120, 110, 272, 110, '#6b4a2b', 1.5);
	s += r(126, 84, 140, 7, '#6b4a2b');
	s += icon('pick', 150, 72, 1.6) + el(196, 70, 9, 11, 'url(#gPurple)') + el(196, 72, 7, 9, '#f5f0ff', 'stroke="#7c3aed" stroke-width="1.5"') + c(193, 69, 1.6, '#a855f7') + c(199, 75, 1.8, '#ec4899') + sparkle(208, 60, 0.7, C.gold);
	s += r(236, 70, 10, 14, '#22d3ee', 'rx="3"') + r(239, 64, 4, 6, '#94a3b8');
	s += c(150, 124, 13, '#5b3d22') + c(150, 124, 5, '#8a5a2b') + c(244, 124, 13, '#5b3d22') + c(244, 124, 5, '#8a5a2b');
	s += avatar(78, 127, 1.15, '#7c3aed', '#3b0764', { hat: 'wizard' });
	s += r(310, 92, 3, 34, '#5b4636') + r(286, 70, 52, 30, C.dark, 'rx="3"');
	s += T(312, 82, 'SAI EM', { size: 9, weight: 800, anchor: 'middle', fill: '#cbd5e1', halo: false, ls: 1 }) + T(312, 95, '09:59', { size: 13, weight: 800, anchor: 'middle', fill: '#ffb347', halo: false });
	return s;
}
function vWorm() {
	let s = r(0, 0, VW, VH, 'url(#skyEve)');
	s += poly([[0, 116], [80, 104], [170, 112], [260, 100], [343, 110], [343, 130], [0, 130]], '#3b2a4a');
	s += ground(128, '#4e3b30', '#3e2f26');
	s += el(186, 134, 82, 12, '#1d1512');
	const pts = [];
	for (let i = 0; i <= 9; i++) { const t = i / 9; const x = (1 - t) ** 2 * 206 + 2 * (1 - t) * t * 238 + t * t * 160, y = (1 - t) ** 2 * 140 + 2 * (1 - t) * t * 50 + t * t * 56; pts.push([x, y, 22 - t * 5]); }
	pts.forEach(([x, y, rr], i) => { s += c(x, y, rr, i % 2 ? '#c9776a' : '#b9685c', `stroke="#8f4d43" stroke-width="2"`) + c(x - rr * 0.25, y - rr * 0.3, rr * 0.35, '#e3a093', 'opacity=".55"'); });
	const [hx, hy] = [146, 58];
	s += c(hx, hy, 23, '#d07f71', 'stroke="#8f4d43" stroke-width="2"');
	s += el(hx - 10, hy + 6, 14, 12, '#3b1414');
	for (let i = 0; i < 8; i++) { const a = (i / 8) * 360; const tx = hx - 10 + 14 * Math.cos(a * deg), ty = hy + 6 + 12 * Math.sin(a * deg); s += poly([[tx - 2.4, ty], [tx + 2.4, ty], [tx - 10 * Math.cos(a * deg) * 0.3, ty - 10 * Math.sin(a * deg) * 0.3]], '#ffffff'); }
	s += c(hx + 8, hy - 10, 3.4, '#ffffff') + c(hx + 9, hy - 10, 1.7, '#111827');
	for (const [x, y] of [[120, 116], [262, 112], [234, 98], [110, 96]]) s += poly([[x, y], [x + 7, y - 3], [x + 9, y + 4], [x + 2, y + 7]], '#7a6050');
	s += r(52, 8, 240, 18, C.dark, 'rx="4"') + r(55, 11, 168, 12, '#ef4444', 'rx="2"');
	s += T(60, 21, 'VERME GIGANTE', { size: 11, weight: 800, fill: '#ffffff', halo: false, ls: 1 });
	s += avatar(40, 160, 0.9, '#3b82f6', '#1e3a8a', { tool: 'pick' }) + avatar(286, 160, 0.9, '#22c55e', '#14532d', { tool: 'pick' }) + avatar(316, 156, 0.8, '#eab308', '#1f2937', { tool: 'drill' }) + avatar(74, 164, 0.8, '#ec4899', '#831843', { wave: true });
	s += sparkle(118, 80, 1, '#fff7c2') + sparkle(196, 100, 0.8, '#fff7c2') + sparkle(250, 120, 0.9, '#fff7c2');
	return s;
}

// ------------------------------------------------------------------ right panel
const CARDS = [
	[1, 'social', 'LOBBY · CHEGADA', vLobby, ['Todo mundo nasce aqui. Tutorial, prêmio', 'diário, códigos e baú do grupo. Uma luz', 'no chão leva cada jogador até o lote dele.']],
	[2, 'social', 'HUB CENTRAL', vHub, ['Praça no meio do mapa: 4 lojas de cada', 'lado e a Broca Gigante no centro. O telão', 'conta o tempo até o próximo evento.']],
	[3, 'lote', 'LOTE DO JOGADOR', vPlot, ['100 × 100 studs, encostado na montanha:', 'placa com o nome, baú, vitrine, pets e a', 'boca do túnel. Fica mais bonito ao evoluir.']],
	[4, 'mina', 'TÚNEL (CORTE)', vTunnel, ['Desce montanha adentro, camada por', 'camada. Cada uma tem minérios novos e', 'a profundidade vai pro placar do Hub.']],
	[5, 'mina', 'CAVERNA COMPARTILHADA', vCavern, ['No Cristal, o túnel fura uma caverna que', 'você divide com o vizinho. Dá pra minerar', 'junto e trocar sem voltar pro Hub.']],
	[6, 'evento', 'ZONA DE EVENTOS', vEvents, ['Cratera do meteoro, palco e telão. Os', 'eventos do servidor e o show ao vivo de', 'sábado acontecem aqui.']],
	[7, 'evento', 'ARENA DE MINIGAMES', vArena, ['Corrida de Escavação: 8 raias, quem chegar', 'mais fundo em 60 s ganha. Pisou na fila,', 'a partida começa quando lotar.']],
	[8, 'mina', 'MINA PÚBLICA', vMine, ['Poço aberto pra todo mundo, com veios', 'raros que reaparecem. Quem chega primeiro', 'leva. O Poço dos Desejos fica na entrada.']],
	[9, 'transporte', 'TRILHO DOS VAGONETES', vRail, ['Volta elevada por cima das avenidas, com 4', 'estações. O vagonete não para: sobe numa', 'estação e desce em qualquer outra.']],
	[10, 'transporte', 'PORTAIS → OUTROS LOBBIES', vPortals, ['No fundo do Lobby: Trocas, Eventos', 'Globais, VIP e Torneio. Cada portal leva', 'a um servidor separado (outro place).']],
	[11, 'evento', 'MERCADOR VIAJANTE', vMerchant, ['Aparece no Hub a cada 1 h e fica 10 min.', 'Vende picaretas e ovos que não existem', 'na loja. O chat avisa quando ele chega.']],
	[12, 'evento', 'VERME GIGANTE', vWorm, ['Chefe que ronda o Anel Profundo. A cada', '1 h atravessa os túneis e sai na Cratera.', 'O servidor inteiro luta junto.']],
];
const PX = 1666, PW = 1114, CW = 359, CH = 300, GAP = 18, PY = 146;
function drawPanel() {
	let s = '';
	CARDS.forEach(([n, cat, title, fn, lines], i) => {
		const x = PX + (i % 3) * (CW + GAP), y = PY + Math.floor(i / 3) * (CH + 16);
		s += r(x, y, CW, CH, C.panel, `rx="8" stroke="${C.panelEdge}" stroke-width="1.5"`);
		DEFS.push(`<clipPath id="clip${n}"><rect x="0" y="0" width="${VW}" height="${VH}" rx="5"/></clipPath>`);
		s += `<g transform="translate(${x + 8} ${y + 8})"><g clip-path="url(#clip${n})">${fn()}</g><rect x="0" y="0" width="${VW}" height="${VH}" rx="5" fill="none" stroke="rgba(255,255,255,.18)"/></g>`;
		s += badge(x + 30, y + 197, n, CAT[cat]);
		s += T(x + 52, y + 205, title, { size: 23, weight: 800, halo: false, ls: 0.6 });
		lines.forEach((t, k) => (s += T(x + 16, y + 232 + k * 22, t, { size: 16, weight: 500, body: true, halo: false, fill: '#c9dbf1' })));
	});
	return s;
}
function drawEvents() {
	const x0 = PX, y0 = PY + 4 * (CH + 16) - 2, w = PW, h = 248;
	let s = r(x0, y0, w, h, C.panel, `rx="8" stroke="${C.panelEdge}" stroke-width="1.5"`);
	s += T(x0 + 18, y0 + 34, 'EVENTOS AO VIVO', { size: 25, weight: 800, halo: false, ls: 1 }) + T(x0 + 230, y0 + 34, 'o que acontece, quando e onde', { size: 16, weight: 500, body: true, halo: false, fill: C.dim });
	const cols = [
		['A CADA 20 MIN', 'servidor · sorteia um', [['meteor', 'Chuva de meteoros → Cratera (6)'], ['coin', 'Corrida do Ouro → venda paga 2×'], ['quake', 'Terremoto → salas secretas no túnel'], ['chest', 'Chuva de baús → Mina Pública (8)']]],
		['A CADA 1 HORA', 'servidor', [['worm', 'Verme Gigante (12) → sai na Cratera'], ['wagon', 'Mercador Viajante (11) → Hub, 10 min']]],
		['SÁBADO · 18H', 'todos os servidores, ao vivo', [['stage', 'Show no Palco (6), contagem no Hub'], ['egg', 'Sorte 3× e chuva de ovos'], ['portal', 'Portal Eventos Globais (10)']]],
		['TODO MÊS', 'temporada', [['season', 'Tema novo no mapa (Halloween…)'], ['layer', 'Camada nova no fim do túnel'], ['trophy', 'Placar da temporada zera']]],
	];
	const cw = (w - 36) / 4;
	cols.forEach(([head, sub, items], i) => {
		const x = x0 + 18 + i * cw, y = y0 + 56;
		s += r(x, y, cw - 14, 44, i === 2 ? 'rgba(251,113,133,.22)' : 'rgba(111,211,255,.10)', `rx="5" stroke="${i === 2 ? CAT.evento : C.panelEdge}" stroke-width="1.2"`);
		s += T(x + 12, y + 20, head, { size: 17, weight: 800, halo: false, ls: 0.8, fill: i === 2 ? '#ffd5dc' : C.ink }) + T(x + 12, y + 37, sub, { size: 13.5, weight: 500, body: true, halo: false, fill: C.dim });
		items.forEach(([ic, t], k) => {
			const iy = y + 70 + k * 30;
			let glyph = '';
			if (ic === 'meteor') glyph = meteorMark(x + 14, iy, 0.75);
			else if (ic === 'chest') glyph = chestMark(x + 14, iy, 1);
			else if (ic === 'quake') glyph = pth(`M ${x + 6} ${iy + 2} L ${x + 11} ${iy - 6} L ${x + 15} ${iy + 3} L ${x + 19} ${iy - 4} L ${x + 23} ${iy + 2}`, 'none', `stroke="#fbbf24" stroke-width="2.4" stroke-linejoin="round"`);
			else if (ic === 'stage') glyph = r(x + 4, iy - 7, 20, 10, '#e5483b', 'rx="2"') + r(x + 7, iy - 5, 14, 5, C.dark);
			else if (ic === 'portal') glyph = c(x + 14, iy - 1, 8, 'url(#portal_eventos)', 'stroke="#cfc6b2" stroke-width="2"');
			else if (ic === 'season') glyph = pth(`M ${x + 6} ${iy - 1} Q ${x + 14} ${iy - 13} ${x + 22} ${iy - 1} Q ${x + 14} ${iy + 9} ${x + 6} ${iy - 1}`, '#f97316') + r(x + 13, iy - 11, 2, 4, '#4d7c0f');
			else if (ic === 'layer') glyph = r(x + 4, iy - 9, 20, 5, C.terra) + r(x + 4, iy - 4, 20, 5, C.cristal) + r(x + 4, iy + 1, 20, 5, C.nucleo);
			else glyph = icon(ic, x + 14, iy - 1, 1);
			s += glyph + T(x + 32, iy + 4, t, { size: 15, weight: 500, body: true, halo: false, fill: '#dbe8f8' });
		});
	});
	return s;
}
function drawTitleBlock() {
	const x0 = MX, y0 = 1540, w = WW * K, h = 118;
	let s = r(x0, y0, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	const cells = [['PROJETO', 'Simulador de escavação (nome provisório)', 400], ['FOLHA', '01 · Mapa principal, vista de cima', 400], ['ESCALA', '1 quadrado = 50 studs', 260], ['SERVIDOR', '8 jogadores · 8 lotes', 250], ['DATA', '15/10/2026', 150], ['REV.', 'B', WW * K - 1460]];
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
	s += T(40, 44, 'SIMULADOR DE ESCAVAÇÃO · ROBLOX', { size: 17, weight: 800, fill: C.cyan, halo: false, ls: 3 });
	s += T(38, 98, 'BLUEPRINT DO MAPA', { size: 62, weight: 800, halo: false, ls: 1.5 });
	s += T(560, 74, 'Vista de cima. O Hub fica no meio e os 8 lotes, em duas fileiras,', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	s += T(560, 99, 'encostam na montanha. Cada jogador cava o próprio túnel.', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	const chips = [['social', 'Social: Hub e Lobby'], ['lote', 'Lotes dos jogadores'], ['mina', 'Mineração e túneis'], ['evento', 'Eventos e minigames'], ['transporte', 'Transporte e portais'], ['dash', 'Tracejado = subterrâneo']];
	chips.forEach(([k, t], i) => {
		const x = PX + (i % 3) * 372, y = 42 + Math.floor(i / 3) * 40;
		if (k === 'dash') s += ln(x, y - 9, x + 26, y - 9, C.ink, 1.4, 'stroke-dasharray="5 3"') + ln(x, y - 1, x + 26, y - 1, C.ink, 1.4, 'stroke-dasharray="5 3"');
		else s += c(x + 12, y - 5, 12, CAT[k], `stroke="${C.navy}" stroke-width="2"`);
		s += T(x + 36, y + 1, t, { size: 18, weight: 600, body: true, halo: false });
	});
	return s;
}

// ------------------------------------------------------------------ assemble
function buildSVG() {
	const g50 = 50 * K, g250 = 250 * K;
	const grid = `<pattern id="gridMinor" x="${MX}" y="${MY}" width="${g50}" height="${g50}" patternUnits="userSpaceOnUse"><path d="M ${g50} 0 L 0 0 0 ${g50}" fill="none" stroke="${C.grid}" stroke-opacity=".09" stroke-width="1"/></pattern><pattern id="gridMajor" x="${MX}" y="${MY}" width="${g250}" height="${g250}" patternUnits="userSpaceOnUse"><path d="M ${g250} 0 L 0 0 0 ${g250}" fill="none" stroke="${C.grid}" stroke-opacity=".18" stroke-width="1.2"/></pattern>`;
	DEFS.push(`<clipPath id="mapClip"><rect x="0" y="0" width="${WW}" height="${WH}" rx="10"/></clipPath>`, '<clipPath id="plazaClip"><rect x="414" y="288" width="240" height="144" rx="14"/></clipPath>', '<clipPath id="lobbyClip"><rect x="440" y="474" width="188" height="142" rx="24"/></clipPath>');
	const map = `<g transform="translate(${MX} ${MY}) scale(${K})" clip-path="url(#mapClip)">${drawMap()}</g>` + r(MX, MY, WW * K, WH * K, 'none', `stroke="${C.frame}" stroke-width="2" rx="${10 * K}"`);
	const labels = drawMapLabels() + drawRulers();
	const insets = insetPlot() + insetLoop() + insetScale() + insetSymbols() + drawTitleBlock();
	const panel = drawPanel() + drawEvents();
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
	const missing = await page.evaluate(() => ['Barlow Condensed', 'Barlow'].filter((fam) => !document.fonts.check(`700 16px "${fam}"`)));
	if (missing.length) console.warn('fontes faltando:', missing);
	await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
	await browser.close();
	console.log('ok:', OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
