// Gera blueprint-simulador.png: o mapa do simulador visto de cima + um desenho de referência para cada área.
// Uso:  npm install && npx playwright install chromium
//       npm run gerar                (ou: node gerar_blueprint.mjs [saida.png]; SCALE=1 gera em 2800x1800)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const OUT = process.argv[2] || path.join(here, 'blueprint-simulador.png');
const SCALE = Number(process.env.SCALE || 2);

// ------------------------------------------------------------------ canvas
const W = 2800, H = 1800;
const CX = 830, CY = 965; // centro do mapa (1 px = 1 stud)
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
DEFS.push(`<radialGradient id="grassGrad" cx="${CX}" cy="${CY}" r="480" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.grassIn}"/><stop offset="1" stop-color="${C.grassOut}"/></radialGradient>`);
DEFS.push(`<radialGradient id="craterGrad"><stop offset="0" stop-color="#5c4636"/><stop offset="1" stop-color="#2a201b"/></radialGradient>`);
DEFS.push(`<marker id="arrowW" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/></marker>`);
DEFS.push(`<marker id="arrowC" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.cyan}"/></marker>`);
DEFS.push(`<marker id="arrowM" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.magma}"/></marker>`);

// ------------------------------------------------------------------ geometry of the world (studs)
function P(rr, a) { return [CX + rr * Math.sin(a * deg), CY - rr * Math.cos(a * deg)]; }
function noise(t, s) { return 0.5 * Math.sin(3 * t + s) + 0.3 * Math.sin(7 * t + 2.1 * s) + 0.2 * Math.sin(13 * t + 0.7 * s) + 0.12 * Math.sin(23 * t + 1.3 * s); }
function angDist(a, b) { return Math.abs((((a - b) % 360) + 540) % 360 - 180); }
function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const R = { hub: 130, rail: 205, road: 318, plot: 395, half: 55 };
const PLOTS = [32, 58, 122, 148, 212, 238, 302, 328];
const Z = { eventos: { a: 0, rc: 452 }, arena: { a: 90, rc: 440 }, lobby: { a: 180, rc: 442 }, mina: { a: 270, rc: 446 } };
const SPOKES = [0, 32, 58, 90, 122, 148, 180, 212, 238, 270, 302, 328];
const BUMPS = [{ c: 0, w: 24, h: 112 }, { c: 90, w: 21, h: 96 }, { c: 180, w: 24, h: 112 }, { c: 270, w: 24, h: 110 }];
function rIn(a) { let v = 458 + 7 * noise(a * deg, 1.7); for (const b of BUMPS) v += b.h * smooth(1 - angDist(a, b.c) / b.w); return v; }
function rOut(a) { return 741 + 10 * noise(a * deg, 4.2); }
function ringPath(fn, step = 1.5) { let d = ''; for (let a = 0; a < 360; a += step) { const [x, y] = P(fn(a), a); d += (a === 0 ? 'M' : 'L') + f(x) + ' ' + f(y) + ' '; } return d + 'Z'; }
function blob(cx, cy, r0, amp, seed, step = 10) { let d = ''; for (let a = 0; a < 360; a += step) { const rr = r0 + amp * noise(a * deg, seed); const x = cx + rr * Math.cos(a * deg), y = cy + rr * Math.sin(a * deg); d += (a === 0 ? 'M' : 'L') + f(x) + ' ' + f(y) + ' '; } return d + 'Z'; }
// zone-local frame: u = right (looking outward), v = outward. In a rotated group, local x = u, local y = -v.
function L(a, rc, u, v) { const [x, y] = P(rc, a); return [x + v * Math.sin(a * deg) + u * Math.cos(a * deg), y - v * Math.cos(a * deg) + u * Math.sin(a * deg)]; }
const zoneG = (a, rc, inner) => { const [x, y] = P(rc, a); return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">${inner}</g>`; };
const PONDS = [{ a: 45, rr: 262, s: 24 }, { a: 225, rr: 262, s: 22 }].map((p) => { const [x, y] = P(p.rr, p.a); return { ...p, x, y }; });

function isFree(x, y, pad = 0) {
	const dx = x - CX, dy = y - CY, rr = Math.hypot(dx, dy);
	let a = Math.atan2(dx, -dy) / deg; if (a < 0) a += 360;
	if (rr < R.hub + 18 + pad) return false;
	if (Math.abs(rr - R.rail) < 16 + pad) return false;
	if (Math.abs(rr - R.road) < 17 + pad) return false;
	if (rr > rIn(a) - 10 - pad) return false;
	for (const s of SPOKES) { const ad = angDist(a, s); if (ad < 60 && rr * Math.sin(ad * deg) < 16 + pad && rr < 360) return false; }
	for (const pa of PLOTS) { const [px, py] = P(R.plot, pa); if (Math.hypot(x - px, y - py) < 84 + pad) return false; }
	for (const z of Object.values(Z)) { const [zx, zy] = P(z.rc, z.a); if (Math.hypot(x - zx, y - zy) < 140 + pad) return false; }
	for (const p of PONDS) if (Math.hypot(x - p.x, y - p.y) < p.s + 8 + pad) return false;
	return true;
}

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
		case 'anvil': return poly([[x - 6 * k, y - 3 * k], [x + 6 * k, y - 3 * k], [x + 3 * k, y + 1 * k], [x + 3 * k, y + 4 * k], [x - 3 * k, y + 4 * k], [x - 3 * k, y + 1 * k]], '#3f4652');
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

// ------------------------------------------------------------------ MAP
function drawMap() {
	let s = '';
	// mountain disc + topographic lines
	s += pth(ringPath(rOut), C.rock);
	for (let k = 1; k <= 5; k++) s += pth(ringPath((a) => rIn(a) + ((rOut(a) - rIn(a)) * k) / 6 + 5 * noise(a * deg, k * 2.9)), 'none', `stroke="${C.rockLine}" stroke-width="1.3" opacity=".7"`);
	s += pth(ringPath(rOut), 'none', `stroke="${C.rockEdge}" stroke-width="3.5"`);

	// tunnels (underground: dashed hidden lines)
	const LAYERS = [[452, 510, C.terra], [510, 568, C.pedra], [568, 626, C.cristal], [626, 684, C.magma], [684, 732, C.nucleo]];
	// deep ring (Anel Profundo)
	s += c(CX, CY, 655, 'none', `stroke="${C.magma}" stroke-width="9" opacity=".55"`);
	s += c(CX, CY, 649.5, 'none', `stroke="${C.ink}" stroke-width="1" stroke-dasharray="5 4" opacity=".75"`) + c(CX, CY, 660.5, 'none', `stroke="${C.ink}" stroke-width="1" stroke-dasharray="5 4" opacity=".75"`);
	// shared caverns between neighbour tunnels
	for (const a of [45, 135, 225, 315]) {
		const [x0, y0] = P(597, a - 13), [x1, y1] = P(597, a + 13);
		s += ln(x0, y0, x1, y1, C.cristal, 8, 'opacity=".55"');
		const [cx, cy] = P(597, a);
		s += pth(blob(cx, cy, 27, 4, a * 0.1), C.cristal, `fill-opacity=".55" stroke="${C.ink}" stroke-width="1.1" stroke-dasharray="5 3.5"`);
		for (const [dx, dy] of [[-9, -4], [6, -9], [8, 7], [-4, 9]]) s += poly([[cx + dx, cy + dy - 4], [cx + dx + 2.6, cy + dy], [cx + dx, cy + dy + 4], [cx + dx - 2.6, cy + dy]], '#e9ddff');
	}
	for (const a of PLOTS) {
		const [x0, y0] = P(452, a), [x1, y1] = P(732, a);
		s += ln(x0, y0, x1, y1, '#2a1f17', 15, 'opacity=".55"');
		for (const [r0, r1, col] of LAYERS) { const [ax, ay] = P(r0, a), [bx, by] = P(r1, a); s += ln(ax, ay, bx, by, col, 8); }
		const ox = Math.cos(a * deg) * 7.5, oy = Math.sin(a * deg) * 7.5;
		s += ln(x0 + ox, y0 + oy, x1 + ox, y1 + oy, C.ink, 1.1, 'stroke-dasharray="5 4" opacity=".85"') + ln(x0 - ox, y0 - oy, x1 - ox, y1 - oy, C.ink, 1.1, 'stroke-dasharray="5 4" opacity=".85"');
		const [ex, ey] = P(758, a);
		s += ln(x1, y1, ex, ey, C.ink, 1.4, 'stroke-dasharray="3 3" marker-end="url(#arrowW)" opacity=".85"');
	}

	// valley floor
	s += pth(ringPath(rIn), 'url(#grassGrad)');
	s += pth(ringPath(rIn), 'none', `stroke="${C.grassEdge}" stroke-width="3"`);
	let hach = '';
	for (let a = 0; a < 360; a += 1.6) { const ri = rIn(a); const [x0, y0] = P(ri + 2, a), [x1, y1] = P(ri + 11, a); hach += `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)} `; }
	s += pth(hach, 'none', `stroke="${C.rockEdge}" stroke-width="1.5" opacity=".8"`);

	// ponds
	for (const p of PONDS) s += pth(blob(p.x, p.y, p.s, 3, p.a * 0.05), C.water, `stroke="#3d93b8" stroke-width="2"`) + el(p.x - 6, p.y - 6, 7, 3, '#bfe9f7', 'opacity=".6"');

	// paths: ring road + spokes
	const spokeEnd = { 0: 336, 90: 342, 180: 330, 270: 340 };
	let paths = '';
	for (const a of SPOKES) { const [x0, y0] = P(R.hub - 4, a), [x1, y1] = P(spokeEnd[a] || 344, a); paths += `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)} `; }
	s += pth(paths, 'none', `stroke="${C.pathEdge}" stroke-width="22" stroke-linecap="round"`);
	s += c(CX, CY, R.road, 'none', `stroke="${C.pathEdge}" stroke-width="24"`);
	s += pth(paths, 'none', `stroke="${C.path}" stroke-width="17" stroke-linecap="round"`);
	s += c(CX, CY, R.road, 'none', `stroke="${C.path}" stroke-width="19"`);

	// trees
	const rand = rng(7), trees = [];
	for (let i = 0; i < 3000 && trees.length < 110; i++) {
		const rr = 140 + rand() * 340, a = rand() * 360, [x, y] = P(rr, a), sz = 5.5 + rand() * 6;
		if (!isFree(x, y, sz)) continue;
		if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < t.sz + sz + 2)) continue;
		trees.push({ x, y, sz });
	}
	for (const t of trees) s += c(t.x + 1.5, t.y + 2, t.sz, 'rgba(0,0,0,.18)') + c(t.x, t.y, t.sz, C.tree) + c(t.x - t.sz * 0.3, t.y - t.sz * 0.3, t.sz * 0.5, C.treeLight);
	// lamps along spokes
	for (const a of SPOKES) for (let rr = 150; rr < 300; rr += 42) for (const side of [-1, 1]) {
		if (Math.abs(rr - R.rail) < 14) continue;
		const [x, y] = P(rr, a); const ox = Math.cos(a * deg) * 13 * side, oy = Math.sin(a * deg) * 13 * side;
		s += c(x + ox, y + oy, 5, '#fff3b0', 'opacity=".35"') + c(x + ox, y + oy, 2.2, '#ffe27a', `stroke="${C.navy}" stroke-width=".6"`);
	}

	// ---------------- hub plaza
	s += c(CX, CY, R.hub + 3, C.pathEdge) + c(CX, CY, R.hub, C.plaza);
	for (const rr of [112, 64, 40]) s += c(CX, CY, rr, 'none', `stroke="${C.plazaLine}" stroke-width="2"`);
	for (let a = 0; a < 360; a += 15) { const [x0, y0] = P(40, a), [x1, y1] = P(R.hub, a); s += ln(x0, y0, x1, y1, C.plazaLine, 1); }
	// planters in the narrow wedges
	for (const a of [45, 225, 315]) { const [x, y] = P(112, a); s += c(x, y, 9, '#5fae5a', `stroke="#8a7a60" stroke-width="2"`) + c(x - 3, y - 2, 2, '#f472b6') + c(x + 3, y + 2, 2, '#facc15'); }
	// shops
	const SHOPS = [[16, 'MOCHILAS', '#3b82f6', 'bag'], [74, 'PICARETAS', '#ef4444', 'pick'], [106, 'VENDER', '#16a34a', 'coin'], [164, 'MISSÕES', '#f59e0b', 'quest'], [196, 'OVOS', '#9333ea', 'egg'], [254, 'FORJA', '#64748b', 'anvil'], [286, 'RENASCER', '#db2777', 'rebirth'], [344, 'PLACARES', '#0284c7', 'trophy']];
	for (const [a, name, col, ic] of SHOPS) {
		const [x, y] = P(94, a);
		s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + r(-19, -13, 38, 24, 'rgba(0,0,0,.2)', 'rx="3" transform="translate(2 3)"') + r(-19, -13, 38, 24, col, 'rx="3"') + ln(-19, -1, 19, -1, 'rgba(255,255,255,.35)', 1.5) + r(-19, 9, 38, 4, 'rgba(0,0,0,.25)') + '</g>';
		s += c(x, y, 9, 'rgba(12,38,69,.55)') + icon(ic, x, y, 0.95);
		const [lx, ly] = P(166, a);
		s += T(lx, ly + 5, name, { size: 14.5, weight: 800, anchor: 'middle', ls: 0.4 });
	}
	// monument: giant drill + countdown screen
	s += poly(Array.from({ length: 8 }, (_, i) => P(27, i * 45 + 22.5)), '#d6ceb9', `stroke="#a99f88" stroke-width="2"`);
	s += c(CX, CY, 17, '#f2b134', 'stroke="#b7861f" stroke-width="2"');
	for (let i = 0; i < 4; i++) s += pth(`M ${f(CX)} ${f(CY)} m 0 0 a ${f(8 + i)} ${f(8 + i)} 0 0 1 ${f(15 * Math.cos(i * 1.57))} ${f(15 * Math.sin(i * 1.57))}`, 'none', 'stroke="#a8740f" stroke-width="2"');
	s += c(CX, CY, 3.5, '#fff1a8');
	s += r(CX - 20, CY + 30, 40, 9, C.dark, 'rx="2"') + r(CX - 16, CY + 33, 32, 3, '#ff8a3d');
	// travelling merchant spot (appears)
	const [mx, my] = P(80, 135);
	s += c(mx, my, 17, 'rgba(251,113,133,.16)', `stroke="${CAT.evento}" stroke-width="2.2" stroke-dasharray="5 3"`) + icon('wagon', mx, my + 1, 1);

	// ---------------- plots
	PLOTS.forEach((a, i) => { const [x, y] = P(R.plot, a); s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">${plotLocal(PLAYER[i], i + 1)}</g>`; });

	// ---------------- N: live events zone
	{
		const { a, rc } = Z.eventos;
		let z = '';
		z += r(-108, -120, 216, 236, '#d6c4a0', `rx="46" stroke="#7d6b56" stroke-width="3"`);
		z += r(-100, -112, 200, 220, 'none', `rx="40" stroke="#e6d8b8" stroke-width="2" stroke-dasharray="2 6"`);
		// stands around the crater
		z += pth('M -78 -40 A 74 74 0 0 0 -78 52', 'none', 'stroke="#9aa6b5" stroke-width="20"') + pth('M -78 -40 A 74 74 0 0 0 -78 52', 'none', 'stroke="#c3ccd6" stroke-width="20" stroke-dasharray="2 5"');
		z += pth('M 78 -40 A 74 74 0 0 1 78 52', 'none', 'stroke="#9aa6b5" stroke-width="20"') + pth('M 78 -40 A 74 74 0 0 1 78 52', 'none', 'stroke="#c3ccd6" stroke-width="20" stroke-dasharray="2 5"');
		// stage + big screen at the back
		z += r(-50, -114, 100, 8, C.dark, 'rx="2"') + r(-44, -112, 88, 3, C.cyan);
		z += r(-52, -104, 104, 24, '#e5483b', 'rx="3"') + r(-52, -84, 104, 4, '#a3271d');
		z += c(-46, -98, 3, '#fff3c4') + c(46, -98, 3, '#fff3c4');
		// countdown board at the entrance
		z += r(-22, 92, 44, 10, C.dark, 'rx="2"') + r(-17, 95, 34, 4, '#ff8a3d');
		s += zoneG(a, rc, z);
		// worm passage from the deep ring into the crater (hidden line)
		const [px0, py0] = P(650, -9), [px1, py1] = P(512, -5);
		s += ln(px0, py0, px1, py1, C.magma, 8, 'opacity=".55"') + ln(px0, py0, px1, py1, C.ink, 1.1, 'stroke-dasharray="5 4"');
		// crater
		const [cx, cy] = L(a, rc, 0, 8);
		s += c(cx, cy, 60, '#b9a284') + c(cx, cy, 51, 'url(#craterGrad)');
		for (let i = 0; i < 7; i++) { const aa = i * 51 + 10; s += ln(cx + 10 * Math.cos(aa * deg), cy + 10 * Math.sin(aa * deg), cx + 38 * Math.cos(aa * deg), cy + 38 * Math.sin(aa * deg), '#ff8a3d', 1.6, 'opacity=".7"'); }
		s += c(cx, cy, 30, 'url(#gOrange)') + c(cx, cy, 12, '#ff9b4a', 'stroke="#7a3b1e" stroke-width="2"') + c(cx - 3, cy - 3, 4, '#ffe0a3');
		const [hx, hy] = P(512, -5); s += c(hx, hy, 7, '#1b1411', `stroke="${C.magma}" stroke-width="2"`);
	}

	// ---------------- E: minigame arena
	{
		const { a, rc } = Z.arena;
		let z = '';
		z += r(-102, -104, 204, 206, '#efcf86', `rx="34" stroke="#a9853c" stroke-width="3"`);
		for (let i = 0; i < 8; i++) { const x = -84 + i * 24; z += r(x - 10, -70, 20, 78, i % 2 ? '#e8bf62' : '#f4d891'); z += r(x - 8, -40, 16, 16, '#4a3221', 'rx="1.5"') + r(x - 5, -37, 10, 10, '#2a1b12'); }
		z += r(-96, 8, 192, 3, '#ffffff');
		z += r(-62, -94, 124, 16, C.dark, 'rx="3"');
		for (let i = 0; i < 8; i++) z += r(-56 + i * 14.5, -90, 9, 8, ['#facc15', '#22c55e', '#38bdf8', '#fb7185'][i % 4]);
		[-45, -15, 15, 45].forEach((x, i) => { z += c(x, 54, 10, ['#38bdf8', '#4ade80', '#facc15', '#fb7185'][i], 'stroke="#fff" stroke-width="2.5"'); });
		s += zoneG(a, rc, z);
	}

	// ---------------- S: lobby / spawn + portals
	{
		const { a, rc } = Z.lobby;
		let z = '';
		z += r(-114, -122, 228, 236, '#a6e3d8', `rx="44" stroke="#5aa99b" stroke-width="3"`);
		for (let x = -96; x <= 96; x += 24) z += ln(x, -112, x, 104, '#c4eee6', 1.2);
		for (let y = -96; y <= 96; y += 24) z += ln(-104, y, 104, y, '#c4eee6', 1.2);
		// spawn pad + welcome arch, tutorial npc and daily chest on the sides
		z += c(0, 34, 30, '#e8fffb', 'stroke="#2ec4a9" stroke-width="3"') + c(0, 34, 20, 'none', 'stroke="#2ec4a9" stroke-width="2" stroke-dasharray="4 3"');
		for (const x of [-30, 30]) z += r(x - 4, 0, 8, 8, '#8a6a48');
		z += r(-30, 2, 60, 4, '#8a6a48');
		z += c(-62, 30, 7, '#f6c445', `stroke="${C.navy}" stroke-width="1.5"`);
		z += r(53, 24, 18, 12, C.gold, `rx="2" stroke="#8a5520" stroke-width="1.5"`);
		// codes terminal + group chest
		z += r(55, -17, 14, 14, C.dark, 'rx="2"') + r(58, -14, 8, 6, C.cyan);
		z += r(-70, -16, 16, 12, '#a855f7', `rx="2" stroke="#5b21b6" stroke-width="1.5"`);
		// portals against the cliff
		[['trocas', -78], ['eventos', -26], ['vip', 26], ['torneio', 78]].forEach(([k, x]) => {
			z += c(x, -100, 21, `url(#portal_${k})`, 'opacity=".55"');
			z += c(x, -100, 14, `url(#portal_${k})`, `stroke="#cfc6b2" stroke-width="4"`);
		});
		s += zoneG(a, rc, z);
	}

	// ---------------- W: public mine (open pit)
	{
		const { a, rc } = Z.mina;
		let z = '';
		z += pth(blob(0, 0, 108, 6, 2.2), '#b9997a', `stroke="#7a6046" stroke-width="3"`);
		[[92, '#a8865f'], [72, '#937150'], [52, '#7b5c40'], [32, '#634830'], [14, '#4b3524']].forEach(([rr, col], i) => { z += pth(blob(0, 10, rr, 3 + i, 3.1 + i), col, `stroke="rgba(0,0,0,.18)" stroke-width="2"`); });
		z += r(-7, 10, 14, 96, '#cdb08a', 'opacity=".9"');
		for (let y = 18; y < 104; y += 8) z += ln(-7, y, 7, y, '#a88b65', 1.2);
		const nodes = [[-60, -20, '#22d3ee'], [44, -44, C.gold], [62, 20, '#c084fc'], [-30, -56, '#f87171'], [-44, 46, C.gold], [20, 58, '#22d3ee'], [-18, -6, '#c084fc'], [28, 0, C.gold]];
		for (const [x, y, col] of nodes) z += c(x, y, 9, col, 'opacity=".3"') + poly([[x, y - 6], [x + 4.5, y], [x, y + 6], [x - 4.5, y]], col, `stroke="${C.navy}" stroke-width="1"`);
		// wishing well near the entrance
		z += c(44, 92, 11, '#9aa3ad', `stroke="#5b6573" stroke-width="2"`) + c(44, 92, 6.5, C.water);
		s += zoneG(a, rc, z);
		// chest spawn points
		for (const [u, v] of [[-50, 30], [30, -40], [56, 18]]) { const [x, y] = L(a, rc, u, v); s += chestMark(x, y, 1); }
	}

	// ---------------- rail ring (elevated)
	s += c(CX + 4, CY + 7, R.rail, 'none', 'stroke="rgba(0,0,0,.22)" stroke-width="14"');
	for (let a = 0; a < 360; a += 20) { const [x, y] = P(R.rail, a + 10); s += r(x - 4, y - 4, 8, 8, '#4a3a2c'); }
	s += c(CX, CY, R.rail, 'none', `stroke="${C.deck}" stroke-width="13"`);
	s += c(CX, CY, R.rail, 'none', `stroke="${C.tie}" stroke-width="13" stroke-dasharray="2.2 5"`);
	s += c(CX, CY, R.rail - 3.6, 'none', `stroke="${C.rail}" stroke-width="1.8"`) + c(CX, CY, R.rail + 3.6, 'none', `stroke="${C.rail}" stroke-width="1.8"`);
	for (const a of [0, 90, 180, 270]) { const [x, y] = P(R.rail, a); s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + r(-22, -12, 44, 24, '#5d6b7a', `rx="3" stroke="${C.navy}" stroke-width="1.5"`) + ln(-22, 0, 22, 0, '#8796a6', 2) + '</g>'; }
	for (const [a, col] of [[47, '#e5483b'], [227, '#3b82f6'], [137, '#f59e0b']]) {
		const [x, y] = P(R.rail, a);
		s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a + 90})">` + r(-9, -6, 18, 12, col, `rx="2.5" stroke="${C.navy}" stroke-width="1.5"`) + c(-3, 0, 2.2, C.gold) + c(3, 0, 2.2, '#22d3ee') + '</g>';
		for (const k of [1, 2]) { const [ax, ay] = P(R.rail + 0.1, a - 6 * k); s += `<g transform="translate(${f(ax)} ${f(ay)}) rotate(${a - 6 * k + 90})">` + pth('M -3 -4 L 2 0 L -3 4', 'none', `stroke="#fff" stroke-width="2" opacity="${0.9 - k * 0.3}"`) + '</g>'; }
	}

	// ---------------- dynamic markers
	for (const [rr, a] of [[262, 102], [250, 196], [282, 345], [420, 45], [268, 258]]) { const [x, y] = P(rr, a); s += meteorMark(x, y, 0.95); }
	for (const [rr, a] of [[275, 160], [282, 318]]) { const [x, y] = P(rr, a); s += chestMark(x, y, 1); }
	// the worm on the deep ring, heading clockwise
	{ const [wx, wy] = P(655, 152); s += `<g transform="translate(${f(wx)} ${f(wy)}) rotate(${152 + 90})">${icon('worm', 0, 0, 1.6)}</g>`; }
	s += pth(`M ${P(655, 160).map(f).join(' ')} A 655 655 0 0 1 ${P(655, 176).map(f).join(' ')}`, 'none', `stroke="${C.magma}" stroke-width="2.5" marker-end="url(#arrowM)"`);
	return s;
}

// ------------------------------------------------------------------ MAP LABELS (drawn on top)
function drawMapLabels() {
	let s = '';
	// curved texts
	DEFS.push(`<path id="roadArcN" d="M ${P(R.road, -40).map(f).join(' ')} A ${R.road} ${R.road} 0 0 1 ${P(R.road, 40).map(f).join(' ')}"/>`);
	DEFS.push(`<path id="roadArcS" d="M ${P(R.road, 220).map(f).join(' ')} A ${R.road} ${R.road} 0 0 0 ${P(R.road, 140).map(f).join(' ')}"/>`);
	DEFS.push(`<path id="railArc" d="M ${P(R.rail + 24, 300).map(f).join(' ')} A ${R.rail + 24} ${R.rail + 24} 0 0 1 ${P(R.rail + 24, 345).map(f).join(' ')}"/>`);
	DEFS.push(`<path id="ringArc" d="M ${P(675, 70).map(f).join(' ')} A 675 675 0 0 1 ${P(675, 112).map(f).join(' ')}"/>`);
	DEFS.push(`<path id="mtnArc" d="M ${P(712, 236).map(f).join(' ')} A 712 712 0 0 1 ${P(712, 296).map(f).join(' ')}"/>`);
	const tp = (id, str, o = {}) => `<text font-family="'Barlow Condensed', sans-serif" font-size="${o.size || 13}" font-weight="${o.weight || 800}" fill="${o.fill || C.ink}" letter-spacing="${o.ls || 2}" ${o.halo === false ? '' : `stroke="${o.haloColor || C.halo}" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round"`}><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(str)}</textPath></text>`;
	s += tp('roadArcN', 'AVENIDA DOS LOTES', { fill: '#6b5532', halo: false, size: 13 });
	s += tp('roadArcS', 'AVENIDA DOS LOTES', { fill: '#6b5532', halo: false, size: 13 });
	s += tp('railArc', 'TRILHO DOS VAGONETES (ELEVADO)', { size: 13.5, ls: 1.5 });
	s += tp('ringArc', 'ANEL PROFUNDO · LIGA TODOS OS TÚNEIS', { size: 13.5, ls: 1.5, fill: '#ffd2bf' });
	s += tp('mtnArc', 'MONTANHA · OS TÚNEIS ENTRAM AQUI', { size: 14, ls: 2.5, fill: '#efe6da' });

	// plot labels
	PLOTS.forEach((a, i) => {
		const [x, y] = P(R.plot - 30, a);
		s += T(x, y + 5, `LOTE ${i + 1}`, { size: 15, weight: 800, anchor: 'middle' });
	});

	// zone labels + badges
	const zl = (x, y, n, cat, title, sub) => badge(x - 4, y - 6, n, CAT[cat]) + T(x + 16, y, title, { size: 19, weight: 800, ls: 0.6 }) + (sub ? T(x + 16, y + 17, sub, { size: 13, weight: 600, fill: C.dim }) : '');
	// 1 lobby / 10 portals
	{
		const { a, rc } = Z.lobby;
		const [x, y] = L(a, rc, 0, -92); s += zl(x - 76, y + 6, 1, 'social', 'LOBBY · CHEGADA');
		const [sx, sy] = L(a, rc, 0, -34); s += T(sx, sy + 4.5, 'SPAWN', { size: 12.5, weight: 800, anchor: 'middle', fill: '#0f766e', halo: false });
		const items = [[-62, 30, 'TUTORIAL'], [62, 30, 'DIÁRIO'], [62, -10, 'CÓDIGOS'], [-62, -10, 'GRUPO']];
		for (const [lx, ly, t] of items) { const [px, py] = L(a, rc, lx, -ly); s += T(px, py + 21, t, { size: 11.5, weight: 700, anchor: 'middle', fill: '#e6fffb' }); }
		[['TROCAS', -78], ['EVENTOS', -26], ['VIP', 26], ['TORNEIO', 78]].forEach(([t, lx]) => { const [px, py] = L(a, rc, lx, 100); s += T(px, py - 25, t, { size: 12.5, weight: 800, anchor: 'middle' }); });
		const [bx, by] = L(a, rc, 0, 100); s += badge(bx - 146, by - 4, 10, CAT.transporte) + T(bx - 166, by + 1, 'PORTAIS', { size: 16, weight: 800, anchor: 'end' }) + T(bx - 166, by + 17, 'p/ outros lobbies', { size: 12.5, weight: 600, fill: C.dim, anchor: 'end' });
		// guide light: spawn -> hub -> lote 4
		const pts = [];
		for (let yy = sy - 34; yy > CY + R.hub + 6; yy -= 11) pts.push([CX, yy]);
		for (let aa = 180; aa >= 148; aa -= 4.6) pts.push(P(R.hub + 8, aa));
		for (let rr = R.hub + 18; rr < 338; rr += 11) pts.push(P(rr, 148));
		for (const [px, py] of pts) s += c(px, py, 4.6, '#fff3b0', 'opacity=".35"') + c(px, py, 2.4, '#ffe27a', `stroke="${C.navy}" stroke-width=".7"`);
		s += T(CX + 16, CY + 258, 'luz guia até o seu lote', { size: 12, weight: 700, fill: '#ffe9a3' });
	}
	// 2 hub
	s += badge(CX - 68, CY - 62, 2, CAT.social) + T(CX - 50, CY - 56, 'HUB CENTRAL', { size: 19, weight: 800, ls: 0.6 });
	s += T(CX, CY - 33, 'BROCA GIGANTE', { size: 11, weight: 800, anchor: 'middle', fill: '#5b4a2a', halo: false });
	s += T(CX, CY + 52, 'telão: próximo evento', { size: 11.5, weight: 700, anchor: 'middle', fill: '#4b5563', halo: false });
	// 11 merchant
	{ const [mx, my] = P(97, 135), [lx, ly] = P(163, 135); s += ln(mx, my, lx - 30, ly - 6, C.ink, 1.2, 'opacity=".9"') + badge(lx - 30, ly - 6, 11, CAT.evento) + T(lx - 12, ly - 1, 'MERCADOR', { size: 14, weight: 800 }) + T(lx - 12, ly + 13, 'a cada 1 h', { size: 12, weight: 700, fill: C.dim }); }
	// 3 plot badge (lote 8)
	{ const [x, y] = P(R.plot - 30, 302); s += badge(x - 48, y, 3, CAT.lote); }
	// 4 tunnel badge (tunnel of lote 7, 302°)
	{ const [x, y] = P(560, 302); s += badge(x - 18, y - 40, 4, CAT.mina) + T(x, y - 35, 'TÚNEL', { size: 16, weight: 800 }) + T(x, y - 20, 'cada lote tem o seu', { size: 12, weight: 600, fill: '#efe6da' }); }
	// depth ticks along tunnel of lote 6 (238°)
	[[510, '100 m'], [568, '500 m'], [626, '1,5 km'], [684, '5 km']].forEach(([rr, t]) => { const [x, y] = P(rr, 238); const ox = Math.cos(238 * deg) * 12, oy = Math.sin(238 * deg) * 12; s += ln(x - ox, y - oy, x + ox, y + oy, C.ink, 1.6) + T(x + ox * 1.6, y + oy * 1.6 + 4, t, { size: 11.5, weight: 700, anchor: 'end', fill: C.ink }); });
	// 5 cavern badge (225°)
	{ const [x, y] = P(597, 225); s += badge(x + 34, y + 30, 5, CAT.mina) + T(x + 52, y + 35, 'CAVERNA', { size: 15, weight: 800 }) + T(x + 52, y + 50, 'compartilhada', { size: 12, weight: 600, fill: '#efe6da' }); }
	// 12 worm
	{ const [x, y] = P(655, 152); s += badge(x + 32, y + 18, 12, CAT.evento) + T(x + 50, y + 23, 'VERME GIGANTE', { size: 15, weight: 800 }) + T(x + 50, y + 38, 'chefe que ronda o anel', { size: 12, weight: 600, fill: '#ffd2bf' }); }
	// 6 events
	{
		const { a, rc } = Z.eventos;
		const [x, y] = L(a, rc, 0, -78); s += zl(x - 88, y + 6, 6, 'evento', 'ZONA DE EVENTOS', 'eventos ao vivo + shows');
		const [cx, cy] = L(a, rc, 0, 8); s += T(cx, cy + 34, 'CRATERA DO METEORO', { size: 12, weight: 800, anchor: 'middle' });
		const [sx, sy] = L(a, rc, 0, 92); s += T(sx, sy + 5, 'PALCO + TELÃO', { size: 12, weight: 800, anchor: 'middle', halo: false });
		const [ax, ay] = L(a, rc, -82, 6); s += T(ax - 14, ay + 4, 'ARQUIBANCADA', { size: 11, weight: 700, anchor: 'end' });
		const [hx, hy] = P(512, -5); s += T(hx - 12, hy - 6, 'saída do Verme', { size: 11, weight: 700, anchor: 'end', fill: '#ffd2bf' });
	}
	// 7 arena
	{
		const { a, rc } = Z.arena;
		const [x, y] = L(a, rc, -128, -46); s += zl(x - 6, y, 7, 'evento', 'ARENA', 'corrida de escavação');
		const [qx, qy] = L(a, rc, 0, -54); s += T(qx, qy + 72, 'FILA', { size: 12, weight: 800, anchor: 'middle' });
	}
	// 8 public mine
	{
		const { a, rc } = Z.mina;
		const [x, y] = L(a, rc, 0, 0); s += zl(x - 70, y - 128, 8, 'mina', 'MINA PÚBLICA', 'veios raros p/ todos');
		const [wx, wy] = L(a, rc, 44, -92); s += T(wx, wy + 26, 'POÇO DOS DESEJOS', { size: 11.5, weight: 700, anchor: 'middle' });
	}
	// 9 rail
	{ const [x, y] = P(R.rail, 0); s += badge(x + 34, y - 1, 9, CAT.transporte) + T(x + 52, y + 4, 'ESTAÇÃO', { size: 12.5, weight: 800 }); }
	return s;
}

// ------------------------------------------------------------------ corner insets
function frame(x, y, w, h, title) {
	let s = r(x, y, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) s += pth(`M ${cx + dx * 14} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * 14}`, 'none', `stroke="${C.cyan}" stroke-width="2.5"`);
	s += T(x + 14, y + 25, title, { size: 15, weight: 800, fill: C.cyan, ls: 1.2, halo: false });
	return s;
}
function insetPlot() {
	const x0 = 16, y0 = 146, w = 280, h = 280;
	let s = frame(x0, y0, w, h, 'DETALHE DO LOTE · 110 × 110 STUDS');
	const cx = x0 + 150, cy = y0 + 160, k = 1.42;
	s += r(cx - 55 * k - 4, cy - 55 * k - 26, 110 * k + 8, 26, C.rock, 'rx="3"');
	for (let i = 0; i < 3; i++) s += ln(cx - 55 * k, cy - 55 * k - 6 - i * 7, cx + 55 * k, cy - 55 * k - 9 - i * 6, C.rockLine, 1);
	s += `<g transform="translate(${cx} ${cy}) scale(${k})">${plotLocal(PLAYER[0])}</g>`;
	const lab = (px, py, tx, ty, t, anchor = 'start') => ln(cx + px * k, cy + py * k, tx, ty, C.ink, 1, 'opacity=".8"') + c(cx + px * k, cy + py * k, 2, C.ink) + T(tx + (anchor === 'end' ? -3 : 3), ty + 4, t, { size: 12.5, weight: 700, anchor });
	s += T(cx, cy - 55 * k - 8, 'BOCA DO TÚNEL (na montanha)', { size: 11.5, weight: 800, anchor: 'middle', fill: '#fff' });
	s += lab(-36, -34, x0 + 52, cy - 70, 'pets', 'end');
	s += lab(-37, -2, x0 + 52, cy - 14, 'upgrade', 'end');
	s += lab(-49, 46, x0 + 52, cy + 48, 'bandeira', 'end');
	s += lab(30, -47, x0 + w - 36, cy - 76, 'metragem', 'start');
	s += lab(4, -34, x0 + w - 36, cy - 50, 'trilho', 'start');
	s += lab(10, -6, x0 + w - 36, cy - 22, 'baú', 'start');
	s += lab(41, 8, x0 + w - 36, cy + 8, 'vitrine', 'start');
	s += T(cx, cy + 55 * k + 18, 'portão · placa com o nome', { size: 12.5, weight: 700, anchor: 'middle' });
	return s;
}
function insetLoop() {
	const x0 = 1364, y0 = 146, w = 280, h = 280;
	let s = frame(x0, y0, w, h, 'LOOP DO JOGADOR');
	const steps = ['Cava no túnel', 'Enche a mochila', 'Vende no Hub', 'Compra melhoria', 'Desce mais fundo'];
	steps.forEach((t, i) => { const y = y0 + 62 + i * 38; s += c(x0 + 56, y, 12, CAT.lote, `stroke="${C.navy}" stroke-width="2"`) + T(x0 + 56, y + 5, String(i + 1), { size: 14, weight: 800, anchor: 'middle', fill: C.navy, halo: false }) + T(x0 + 76, y + 6, t, { size: 17, weight: 600, body: true, halo: false }); if (i < 4) s += ln(x0 + 56, y + 13, x0 + 56, y + 25, C.dim, 1.5); });
	s += pth(`M ${x0 + 42} ${y0 + 214} Q ${x0 + 18} ${y0 + 214} ${x0 + 18} ${y0 + 190} L ${x0 + 18} ${y0 + 84} Q ${x0 + 18} ${y0 + 62} ${x0 + 40} ${y0 + 62}`, 'none', `stroke="${C.cyan}" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#arrowC)"`);
	s += r(x0 + 14, y0 + 236, w - 28, 32, 'rgba(219,39,119,.18)', `stroke="#db2777" stroke-width="1.5" rx="4"`);
	s += T(x0 + w / 2, y0 + 257, 'Chegou no Núcleo? RENASCE com bônus', { size: 14, weight: 700, anchor: 'middle', halo: false, fill: '#fbcfe8' });
	return s;
}
function insetScale() {
	const x0 = 16, y0 = 1504, w = 280, h = 280;
	let s = frame(x0, y0, w, h, 'NORTE · ESCALA · MEDIDAS');
	// north arrow
	const nx = x0 + 48, ny = y0 + 82;
	s += c(nx, ny, 26, 'none', `stroke="${C.dim}" stroke-width="1.5"`) + poly([[nx, ny - 30], [nx + 9, ny + 6], [nx, ny], [nx - 9, ny + 6]], C.ink) + poly([[nx, ny + 30], [nx + 9, ny - 6], [nx, ny], [nx - 9, ny - 6]], 'none', `stroke="${C.ink}" stroke-width="1.2"`);
	s += T(nx, ny - 36, 'N', { size: 16, weight: 800, anchor: 'middle', halo: false });
	// scale bar 0-150 studs (1 px = 1 stud)
	const bx = x0 + 104, by = y0 + 82;
	for (let i = 0; i < 3; i++) s += r(bx + i * 50, by - 5, 50, 10, i % 2 ? C.sheet : C.ink, `stroke="${C.ink}" stroke-width="1.2"`);
	[0, 50, 100, 150].forEach((v) => (s += T(bx + v, by + 24, String(v), { size: 12.5, weight: 700, anchor: 'middle', halo: false })));
	s += T(bx + 75, by - 14, 'studs (1 px = 1 stud)', { size: 12.5, weight: 700, anchor: 'middle', halo: false, fill: C.dim });
	const rows = [['Hub', 'raio 130'], ['Trilho', 'raio 205'], ['Avenida dos Lotes', 'raio 318'], ['Lotes (centro)', 'raio 395'], ['Montanha', 'raio 460 → 745'], ['Hub → lote a pé', '≈ 13 s (16 studs/s)']];
	rows.forEach(([k, v], i) => { const y = y0 + 142 + i * 22; s += T(x0 + 18, y, k, { size: 14, weight: 600, body: true, halo: false, fill: C.dim }) + T(x0 + w - 18, y, v, { size: 14, weight: 700, anchor: 'end', halo: false }); });
	return s;
}
function insetSymbols() {
	const x0 = 1364, y0 = 1504, w = 280, h = 280;
	let s = frame(x0, y0, w, h, 'SÍMBOLOS');
	const rows = [
		[meteorMark(x0 + 30, 0, 0.9), 'queda de meteoro (evento)'],
		[chestMark(x0 + 30, 0, 1.1), 'baú que cai (evento)'],
		[c(x0 + 30, 0, 11, 'rgba(251,113,133,.16)', `stroke="${CAT.evento}" stroke-width="2" stroke-dasharray="5 3"`), 'aparece por tempo limitado'],
		[ln(x0 + 14, -4, x0 + 46, -4, C.ink, 1.2, 'stroke-dasharray="5 4"') + ln(x0 + 14, 4, x0 + 46, 4, C.ink, 1.2, 'stroke-dasharray="5 4"'), 'subterrâneo (túnel, caverna)'],
		[icon('worm', x0 + 32, 0, 1.3), 'rota do Verme Gigante'],
		[r(x0 + 16, -8, 28, 16, '#5d6b7a', 'rx="3"'), 'estação do trilho'],
		[c(x0 + 30, 0, 5, '#fff3b0', 'opacity=".35"') + c(x0 + 30, 0, 2.6, '#ffe27a'), 'poste de luz'],
		[c(x0 + 26, 0, 7, C.tree) + c(x0 + 36, 3, 5, C.treeLight), 'árvores / decoração'],
	];
	rows.forEach(([sym, t], i) => { const y = y0 + 56 + i * 28; s += `<g transform="translate(0 ${y})">${sym}</g>` + T(x0 + 60, y + 5, t, { size: 14.5, weight: 600, body: true, halo: false }); });
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
	[2, 'social', 'HUB CENTRAL', vHub, ['Praça redonda com 8 lojas em volta e a', 'Broca Gigante no meio. O telão da broca', 'conta o tempo até o próximo evento.']],
	[3, 'lote', 'LOTE DO JOGADOR', vPlot, ['110 × 110 studs, encostado na montanha:', 'placa com o nome, baú, vitrine, pets e a', 'boca do túnel. Fica mais bonito ao evoluir.']],
	[4, 'mina', 'TÚNEL (CORTE)', vTunnel, ['Desce montanha adentro, camada por', 'camada. Cada uma tem minérios novos e', 'a profundidade vai pro placar do Hub.']],
	[5, 'mina', 'CAVERNA COMPARTILHADA', vCavern, ['No Cristal, o túnel fura uma caverna que', 'você divide com o vizinho. Dá pra minerar', 'junto e trocar sem voltar pro Hub.']],
	[6, 'evento', 'ZONA DE EVENTOS', vEvents, ['Cratera do meteoro, palco e telão. Os', 'eventos do servidor e o show ao vivo de', 'sábado acontecem aqui.']],
	[7, 'evento', 'ARENA DE MINIGAMES', vArena, ['Corrida de Escavação: 8 raias, quem chegar', 'mais fundo em 60 s ganha. Pisou na fila,', 'a partida começa quando lotar.']],
	[8, 'mina', 'MINA PÚBLICA', vMine, ['Poço aberto pra todo mundo, com veios', 'raros que reaparecem. Quem chega primeiro', 'leva. O Poço dos Desejos fica na entrada.']],
	[9, 'transporte', 'TRILHO DOS VAGONETES', vRail, ['Anel elevado em volta do Hub, com 4', 'estações. O vagonete não para: sobe numa', 'estação e desce em qualquer outra.']],
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
	const x0 = PX, y0 = 1666, w = PW, h = 118;
	let s = r(x0, y0, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	const cells = [['PROJETO', 'Simulador de escavação (nome provisório)', 288], ['FOLHA', '01 · Mapa principal, vista de cima', 270], ['ESCALA', '1 quadrado = 50 studs', 190], ['SERVIDOR', '8 jogadores · 8 lotes', 190], ['DATA', '15/10/2026', 112], ['REV.', 'A', 64]];
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
	s += T(560, 74, 'Vista de cima. Cada jogador tem um lote encostado na montanha', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	s += T(560, 99, 'e cava o próprio túnel. Tudo gira em volta do Hub.', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
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
	const grid = `<pattern id="gridMinor" x="${CX % 50}" y="${CY % 50}" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="${C.grid}" stroke-opacity=".09" stroke-width="1"/></pattern><pattern id="gridMajor" x="${CX % 250}" y="${CY % 250}" width="250" height="250" patternUnits="userSpaceOnUse"><path d="M 250 0 L 0 0 0 250" fill="none" stroke="${C.grid}" stroke-opacity=".18" stroke-width="1.2"/></pattern>`;
	const map = drawMap();
	const labels = drawMapLabels();
	const insets = insetPlot() + insetLoop() + insetScale() + insetSymbols();
	const panel = drawPanel() + drawEvents() + drawTitleBlock();
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
