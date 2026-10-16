// Gera continente-pocket-vanguards.png: o continente do Pocket Vanguards visto de cima, uma região por série,
// com um desenho de referência para cada região e a tabela "qual é qual".
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
// polygon -> wobbly coast: subdivide edges and push points along the normal
function coast(pts, amp, seed, step = 7) {
	const out = []; let n = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;
		for (let t = 0; t < len; t += step) { n += 1; const w = amp * noise(n * 0.11, seed); const x = a[0] + ((b[0] - a[0]) * t) / len, y = a[1] + ((b[1] - a[1]) * t) / len; out.push(`${f(x + nx * w)} ${f(y + ny * w)}`); }
	}
	return 'M ' + out.join(' L ') + ' Z';
}
function offsetPoly(pts, d) { // crude outward offset about the centroid
	const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
	return pts.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy); return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d]; });
}
const LAND = [[262, 118], [330, 78], [420, 66], [500, 84], [580, 56], [680, 72], [790, 52], [900, 70], [985, 112], [1030, 200], [1022, 320], [1042, 430], [1012, 530], [950, 606], [870, 648], [780, 626], [700, 664], [610, 650], [540, 668], [448, 630], [368, 606], [292, 536], [312, 456], [244, 372], [232, 262], [250, 176]];
const ISLAND = [[70, 500], [120, 470], [182, 486], [222, 528], [226, 590], [186, 640], [120, 650], [72, 612], [58, 552]];

// regiões: id, nome, série, tipo, centro (x,y), raio (unidades)
const REG = {
	verde: { x: 142, y: 560, r: 86 },
	capital: { x: 560, y: 400 },
	vulcao: { x: 330, y: 300, r: 92 },
	porto: { x: 575, y: 598, r: 80 },
	herois: { x: 905, y: 560, r: 86 },
	portoes: { x: 940, y: 360, r: 84 },
	muralhas: { x: 880, y: 160, r: 78 },
	penhasco: { x: 630, y: 118, r: 70 },
	arena: { x: 345, y: 140, r: 66 },
	templo: { x: 672, y: 262, r: 62 },
};
// trem (loop) e estações, na ordem da aventura
const TRAIN = [[520, 400], [352, 392], [300, 342], [420, 560], [560, 540], [740, 600], [905, 500], [945, 300], [860, 206], [700, 120], [560, 150], [420, 170], [372, 210], [560, 300], [600, 340], [520, 400]];
const STATIONS = [[352, 392, 'Vulcão'], [560, 540, 'Porto'], [905, 500, 'Heróis'], [945, 300, 'Portões'], [860, 206, 'Muralhas'], [560, 150, 'Penhasco'], [420, 170, 'Arena'], [600, 340, 'Templo'], [520, 400, 'Capital']];

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
function drawMap() {
	let s = '';
	s += r(0, 0, WW, WH, 'url(#seaGrad)');
	// ondulação do mar
	for (let y = 20; y < WH; y += 28) { let d = ''; for (let x = 0; x <= WW; x += 12) d += `${x ? 'L' : 'M'} ${x} ${f(y + 3 * Math.sin(x / 19 + y))} `; s += pth(d, 'none', `stroke="${C.seaLine}" stroke-width=".8" opacity=".35"`); }
	// rotas de balsa (tracejadas) antes da terra
	s += pth('M 230 548 Q 380 690 575 690 Q 760 700 870 652', 'none', `stroke="#eaf6ff" stroke-width="1.8" stroke-dasharray="5 4" opacity=".9"`);
	// terra: areia, grama
	const land = coast(LAND, 5, 2.2), island = coast(ISLAND, 3, 4.1);
	for (const d of [land, island]) s += pth(d, C.sand, `stroke="${C.sand}" stroke-width="12" stroke-linejoin="round"`);
	s += pth(coast(offsetPoly(LAND, -5), 4, 2.2), C.grass) + pth(coast(offsetPoly(ISLAND, -4), 2.5, 4.1), C.grass);
	// linhas de costa (batimetria)
	for (const [d, op] of [[coast(offsetPoly(LAND, 18), 5, 2.2), 0.35], [coast(offsetPoly(LAND, 34), 6, 2.2), 0.2]]) s += pth(d, 'none', `stroke="#9fd0f0" stroke-width="1" opacity="${op}"`);
	s += pth(coast(offsetPoly(ISLAND, 14), 3, 4.1), 'none', 'stroke="#9fd0f0" stroke-width="1" opacity=".35"');

	// ------ relevo: montanhas no centro-norte (em volta do Templo)
	const rand = rng(3);
	const peaks = [];
	for (let i = 0; i < 70; i++) {
		const a = rand() * 360, rr = 50 + rand() * 115, x = 672 + rr * Math.cos(a * deg) * 1.35, y = 250 + rr * Math.sin(a * deg) * 0.72;
		if (Math.hypot(x - 672, y - 262) < 44) continue; // deixa o templo livre
		if (Math.hypot(x - 560, y - 400) < 120 || y < 70 || Math.hypot(x - 630, y - 118) < 62 || Math.hypot(x - 880, y - 160) < 70) continue;
		peaks.push([x, y, 9 + rand() * 11]);
	}
	peaks.sort((p, q) => p[1] - q[1]);
	for (const [x, y, h] of peaks) s += poly([[x - h * 0.9, y + h * 0.35], [x, y - h], [x + h * 0.9, y + h * 0.35]], C.rock, `stroke="${C.rockEdge}" stroke-width=".8"`) + poly([[x - h * 0.3, y - h * 0.4], [x, y - h], [x + h * 0.3, y - h * 0.4]], C.snow) + poly([[x, y - h], [x + h * 0.9, y + h * 0.35], [x + h * 0.15, y + h * 0.35]], 'rgba(0,0,0,.15)');
	// rio: das montanhas, passa pela capital e sai no porto
	s += pth('M 640 300 Q 620 360 600 400 Q 590 470 600 530 Q 606 570 575 600', 'none', `stroke="${C.water}" stroke-width="7" stroke-linecap="round"`) + pth('M 640 300 Q 620 360 600 400 Q 590 470 600 530 Q 606 570 575 600', 'none', 'stroke="#bfe9f7" stroke-width="1.2" opacity=".6"');

	// ------ estradas entre regiões
	const ROADS = [[142, 560, 232, 500], [232, 500, 300, 420], [300, 420, 330, 340], [330, 340, 520, 400], [520, 400, 575, 560], [575, 560, 905, 560], [905, 560, 940, 400], [940, 400, 880, 200], [880, 200, 672, 300], [672, 300, 630, 160], [630, 160, 345, 180], [345, 180, 330, 260], [600, 400, 672, 300]];
	let rd = '';
	for (const [x0, y0, x1, y1] of ROADS) rd += `M ${x0} ${y0} L ${x1} ${y1} `;
	s += pth(rd, 'none', `stroke="${C.pathEdge}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`) + pth(rd, 'none', `stroke="${C.path}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`);
	// ponte da ilha
	s += ln(204, 520, 260, 470, '#7b5b3f', 8) + ln(204, 520, 260, 470, '#a9865e', 5) + ln(204, 520, 260, 470, '#f3e9d2', 1, 'stroke-dasharray="3 3"');

	// ------ 1 · Ilha Verdejante (início)
	{
		const { x, y } = REG.verde;
		s += pth(blob(x - 40, y + 20, 22, 2.5, 8.1), C.water, 'stroke="#3d93b8" stroke-width="1.6"') + el(x - 46, y + 14, 6, 2.6, '#bfe9f7', 'opacity=".6"'); // Lago Espelhado
		for (let i = 0; i < 26; i++) { const a = i * 37; s += c(x + 6 + 26 * Math.cos(a * deg) * (0.6 + (i % 3) * 0.2), y - 50 + 14 * Math.sin(a * deg), 2.6, '#4f9c55'); } // Mato Alto
		for (const [dx, dy, roof] of [[-14, -6, '#d9412f'], [2, -14, '#2d9bf0'], [16, -4, '#d9412f'], [-6, 10, '#f2c230'], [10, 12, '#2d9bf0']]) s += houseM(x + dx, y + dy, 11, 9, roof);
		s += r(x + 30, y + 24, 20, 14, '#f8fafc', 'rx="1.5" stroke="#94a3b8" stroke-width="1"') + r(x + 32, y + 26, 16, 4, '#60a5fa') + ln(x + 46, y + 24, x + 46, y + 16, '#64748b', 1.2) + c(x + 46, y + 15, 1.6, '#ef4444'); // Laboratório da Mina
		for (let i = 0; i < 8; i++) { const a = i * 45; s += r(x + 44 + 13 * Math.cos(a * deg) - 1.6, y - 36 + 9 * Math.sin(a * deg) - 2.4, 3.2, 4.8, '#8a8f98', `stroke="${C.rockEdge}" stroke-width=".6"`); } // Círculo de Pedra
		for (const [dx, dy] of [[-62, -28], [-50, -44], [-24, -62], [-70, 0], [-62, 36], [-30, 48], [10, 56], [40, 50], [62, 32], [66, 8], [28, -60]]) s += treeM(x + dx, y + dy, 0.95);
		s += r(x + 58, y - 22, 14, 4, '#7b5b3f') + r(x + 70, y - 24, 6, 8, '#7b5b3f'); // cais
		s += gymM(x + 8, y + 30, TYPE.normal);
	}
	// ------ 2 · Capital Encruzilhada + Torre dos Vanguardas
	{
		const { x, y } = REG.capital;
		s += r(x - 70, y - 48, 140, 96, '#e3dbc8', 'rx="6" stroke="#a89c86" stroke-width="1.5"');
		for (let gx = -56; gx <= 56; gx += 28) s += ln(x + gx, y - 48, x + gx, y + 48, '#d1c6ae', 1.2);
		for (let gy = -24; gy <= 24; gy += 24) s += ln(x - 70, y + gy, x + 70, y + gy, '#d1c6ae', 1.2);
		const rr = rng(9);
		for (let gx = -56; gx <= 56; gx += 28) for (let gy = -36; gy <= 36; gy += 24) { if (Math.abs(gx) < 20 && Math.abs(gy) < 20) continue; s += houseM(x + gx + 14, y + gy + 10, 16 + rr() * 6, 10 + rr() * 6, ['#d9412f', '#2d9bf0', '#f2c230', '#3fcf9a', '#a066ff'][Math.floor(rr() * 5)], '#f7f1e3'); }
		s += c(x, y, 22, '#d6ceb9', 'stroke="#a99f88" stroke-width="1.5"') + poly([[x, y - 20], [x + 12, y + 8], [x + 6, y + 14], [x - 6, y + 14], [x - 12, y + 8]], '#b91c1c', `stroke="${C.gold}" stroke-width="1.8"`) + star(x, y + 2, 6, 2.6, 5, C.gold); // Torre dos Vanguardas
		s += r(x - 32, y + 38, 64, 12, '#5d6b7a', `rx="2" stroke="${C.navy}" stroke-width="1.2"`) + ln(x - 32, y + 44, x + 32, y + 44, '#8796a6', 1.6); // estação central
		s += c(x - 52, y - 38, 7, '#ef4444', 'stroke="#fff" stroke-width="1.5"') + r(x - 54.5, y - 40.5, 5, 5, '#fff') + r(x - 50.5, y - 36.5, 2.5, 1.5, '#ef4444'); // Centro Eco (hospital)
	}
	// ------ 3 · Vulcão Adormecido (Demon Slayer · Fogo · Brasa)
	{
		const { x, y } = REG.vulcao;
		s += pth(blob(x, y, 88, 8, 1.3), '#a9c48a', 'opacity=".55"');
		for (let i = 0; i < 4; i++) s += pth(blob(x - 6, y - 10, 54 - i * 12, 4, 2.5 + i), ['#8a7b6b', '#7c6c5c', '#6e5f50', '#5e5044'][i], `stroke="${C.rockEdge}" stroke-width=".8"`);
		s += c(x - 6, y - 10, 12, '#3b1f14') + c(x - 6, y - 10, 7, '#ff6a2b') + c(x - 8, y - 12, 2.6, '#ffe0a3') + c(x - 2, y - 30, 9, 'rgba(255,255,255,.5)') + c(x + 6, y - 40, 7, 'rgba(255,255,255,.4)'); // cratera + fumaça
		for (const [dx, dy] of [[-62, 30], [-50, 44], [-36, 54], [-20, 60], [-4, 62]]) s += c(x + dx, y + dy, 7, '#b388ff', 'opacity=".8"') + c(x + dx + 3, y + dy - 4, 4, '#d9c2ff', 'opacity=".9"'); // glicínias
		for (const [dx, dy] of [[26, 40], [42, 30], [40, 52], [58, 42]]) s += houseM(x + dx, y + dy, 12, 9, '#4a3a2c', '#efe4cc');
		s += toriiM(x + 20, y + 62, 1.1);
		for (const [dx, dy] of [[-78, -20], [-70, 8], [70, -10], [74, 20], [60, -40], [-40, -70], [20, -78]]) s += pineM(x + dx, y + dy, 1);
		s += gymM(x + 46, y + 14, TYPE.fogo);
	}
	// ------ 4 · Porto do Farol (One Piece · Água · Maré)
	{
		const { x, y } = REG.porto;
		s += pth(blob(x, y - 10, 70, 6, 5.5), '#d9d0b2', 'opacity=".7"');
		s += pth(`M ${x - 40} ${y + 30} Q ${x} ${y + 70} ${x + 40} ${y + 30} Z`, C.sea); // baía
		s += r(x - 34, y + 30, 70, 5, '#a9865e') + r(x - 10, y + 32, 4, 24, '#a9865e') + r(x + 14, y + 32, 4, 20, '#a9865e'); // cais
		s += shipM(x + 2, y + 56, 1.1, '#f6f1e6') + shipM(x + 34, y + 50, 0.9, '#ef4444');
		for (const [dx, dy, roof] of [[-50, 6, '#2d9bf0'], [-36, -4, '#d9412f'], [-20, 8, '#f2c230'], [-4, -6, '#2d9bf0'], [12, 8, '#d9412f'], [30, -2, '#f2c230'], [46, 10, '#2d9bf0']]) s += houseM(x + dx, y + dy, 12, 9, roof);
		s += c(x + 60, y + 38, 6, '#f3f4f6', `stroke="${C.navy}" stroke-width="1.2"`) + r(x + 58, y + 20, 4, 18, '#f3f4f6') + r(x + 58, y + 24, 4, 4, '#ef4444') + r(x + 58, y + 32, 4, 4, '#ef4444') + c(x + 60, y + 18, 3, '#fde68a') + c(x + 60, y + 18, 10, '#fde68a', 'opacity=".25"'); // farol
		s += r(x - 36, y - 30, 24, 10, '#7a4a28', 'rx="1"') + r(x - 34, y - 28, 20, 2, '#f6c445'); // taverna
		s += gymM(x - 54, y - 28, TYPE.agua);
	}
	// ------ 5 · Cidade dos Heróis (My Hero Academia · Raio · Trovão)
	{
		const { x, y } = REG.herois;
		s += r(x - 72, y - 56, 144, 104, '#cfd6de', 'rx="6" stroke="#8c97a6" stroke-width="1.5"');
		for (let gx = -54; gx <= 54; gx += 36) s += ln(x + gx, y - 56, x + gx, y + 48, '#aab4c0', 2);
		for (let gy = -22; gy <= 22; gy += 22) s += ln(x - 72, y + gy, x + 72, y + gy, '#aab4c0', 2);
		const rr = rng(21);
		for (let gx = -54; gx <= 54; gx += 36) for (let gy = -44; gy <= 22; gy += 22) { if (gy < 0 && gx > 0) continue; s += r(x + gx + 4, y + gy + 3, 14 + rr() * 12, 10 + rr() * 6, ['#64748b', '#94a3b8', '#475569', '#7dd3fc'][Math.floor(rr() * 4)], 'rx="1"'); }
		s += pth(`M ${x + 22} ${y - 48} L ${x + 22} ${y - 8} L ${x + 66} ${y - 8} L ${x + 66} ${y - 48} L ${x + 56} ${y - 48} L ${x + 56} ${y - 18} L ${x + 32} ${y - 18} L ${x + 32} ${y - 48} Z`, '#bfe6ff', 'stroke="#1e3a8a" stroke-width="1.2"'); // Academia em U
		for (const [dx, dy] of [[-62, -70], [60, 62], [-20, 60]]) s += poly([[x + dx, y + dy - 8], [x + dx - 3, y + dy], [x + dx + 1, y + dy], [x + dx - 2, y + dy + 8], [x + dx + 4, y + dy - 2], [x + dx, y + dy - 2]], TYPE.raio, `stroke="${C.navy}" stroke-width=".8"`);
		s += gymM(x - 44, y + 60, TYPE.raio);
	}
	// ------ 6 · Portões da Penumbra / Floresta das Lanternas (Solo Leveling · Sombra · Penumbra)
	{
		const { x, y } = REG.portoes;
		s += pth(blob(x, y, 82, 7, 6.6), '#2f4a3a') + pth(blob(x, y, 66, 6, 7.1), '#263d30');
		const rr = rng(4);
		for (let i = 0; i < 48; i++) { const a = rr() * 360, d = rr() * 72; s += c(x + d * Math.cos(a * deg), y + d * Math.sin(a * deg), 3 + rr() * 3, i % 3 ? '#35634a' : '#2a5340'); }
		for (const [dx, dy] of [[-30, -34], [26, -40], [40, 10], [-44, 20], [0, 48], [-10, -4]]) s += lanternM(x + dx, y + dy);
		for (const [dx, dy, sc] of [[14, 14, 1.3], [-22, 40, 1], [44, -22, 1], [-50, -40, 0.9]]) s += gateM(x + dx, y + dy, sc);
		s += pth(blob(x + 2, y - 62, 10, 1.5, 3.3), '#101522', 'stroke="#7a86c9" stroke-width="1.2"'); // masmorra
		s += gymM(x - 20, y - 20, TYPE.sombra);
	}
	// ------ 7 · Muralhas do Norte (Attack on Titan · Terra · Rocha)
	{
		const { x, y } = REG.muralhas;
		for (const [rr, col] of [[70, '#b7a98f'], [52, '#c9bca2'], [34, '#d8ccb3']]) s += c(x, y, rr, col, `stroke="${C.rockEdge}" stroke-width="3.5"`);
		for (const rr of [70, 52, 34]) s += c(x, y, rr, 'none', `stroke="#efe6d2" stroke-width="1" stroke-dasharray="2 2"`);
		for (const [dx, dy, roof] of [[-10, -8, '#b45309'], [8, -12, '#b45309'], [-4, 8, '#9a3412'], [12, 6, '#b45309'], [-44, 2, '#9a3412'], [40, -6, '#9a3412'], [2, -46, '#9a3412'], [-6, 44, '#b45309']]) s += houseM(x + dx, y + dy, 9, 7, roof, '#f1e6cf');
		s += r(x - 3, y + 64, 6, 10, '#3f3f46') + r(x - 3, y - 74, 6, 10, '#3f3f46'); // portões sul/norte
		s += `<g opacity=".55">${poly([[x + 92, y + 20], [x + 98, y - 10], [x + 104, y + 20]], '#5b4a3c')}${c(x + 98, y - 14, 4.5, '#5b4a3c')}</g>`; // titã longe
		s += gymM(x, y + 22, TYPE.terra);
	}
	// ------ 8 · Penhasco dos Cata-ventos / Vila da Folha (Naruto · Vento · Brisa)
	{
		const { x, y } = REG.penhasco;
		s += pth(blob(x, y, 68, 6, 9.9), C.rock, `stroke="${C.rockEdge}" stroke-width="2"`);
		for (let a = 0; a < 360; a += 9) { const x0 = x + 60 * Math.cos(a * deg), y0 = y + 60 * Math.sin(a * deg); s += ln(x0, y0, x + 69 * Math.cos(a * deg), y + 69 * Math.sin(a * deg), C.rockEdge, 1); }
		s += pth(blob(x, y + 6, 46, 4, 10.2), '#9bc77e');
		for (const [dx, dy] of [[-30, -22], [-10, -34], [12, -30], [32, -18]]) s += windmillM(x + dx, y + dy, 1);
		for (let i = 0; i < 4; i++) s += c(x - 24 + i * 16, y - 52, 5, '#a89786', `stroke="${C.rockEdge}" stroke-width=".8"`) + r(x - 26 + i * 16, y - 49, 4, 1.2, C.rockEdge); // rostos na pedra
		for (const [dx, dy, roof] of [[-20, 4, '#ef4444'], [0, 12, '#f2c230'], [20, 4, '#3fcf9a'], [-8, 26, '#ef4444'], [14, 28, '#f2c230']]) s += houseM(x + dx, y + dy, 11, 8, roof, '#fff4dc');
		for (const [dx, dy] of [[-44, 18], [44, 20], [-36, 40], [36, 42], [0, 48]]) s += treeM(x + dx, y + dy, 1.1, '#3f9a4a', '#6cc46d');
		s += gymM(x + 34, y - 2, TYPE.vento);
	}
	// ------ 9 · Arena do Torneio (Dragon Ball · Martial · Arena)
	{
		const { x, y } = REG.arena;
		s += pth(blob(x, y, 66, 5, 12.4), '#e8d9a8', 'opacity=".8"');
		s += c(x, y, 44, '#efcf86', `stroke="#a9853c" stroke-width="2.5"`) + c(x, y, 34, '#c3ccd6', 'stroke="#8c97a6" stroke-width="1.5"');
		for (let a = 0; a < 360; a += 20) s += ln(x + 36 * Math.cos(a * deg), y + 36 * Math.sin(a * deg), x + 43 * Math.cos(a * deg), y + 43 * Math.sin(a * deg), '#a9853c', 1.2);
		s += r(x - 20, y - 20, 40, 40, '#f4e7c3', 'stroke="#3f3f46" stroke-width="1.5"');
		for (let i = 1; i < 4; i++) s += ln(x - 20 + i * 10, y - 20, x - 20 + i * 10, y + 20, '#d9c89a', 1) + ln(x - 20, y - 20 + i * 10, x + 20, y - 20 + i * 10, '#d9c89a', 1);
		s += r(x - 30, y - 38, 60, 6, '#b91c1c') + T(x, y - 33.2, 'TORNEIO', { size: 5, weight: 800, anchor: 'middle', fill: '#fff', halo: false, ls: 1 });
		for (const [dx, dy] of [[-58, 30], [58, 30], [-56, -26], [56, -26]]) s += c(x + dx, y + dy, 3, '#fde68a', 'opacity=".9"') + c(x + dx, y + dy, 7, '#fde68a', 'opacity=".25"');
		s += c(x - 6, y + 2, 3.5, '#f97316', `stroke="${C.navy}" stroke-width=".8"`) + c(x + 7, y - 4, 3.5, '#22c55e', `stroke="${C.navy}" stroke-width=".8"`);
		s += gymM(x + 50, y + 40, TYPE.martial);
	}
	// ------ 10 · Templo do Domínio (Jujutsu Kaisen · Onírico · Sonho)
	{
		const { x, y } = REG.templo;
		s += pth(blob(x, y, 40, 4, 13.7), '#b9a284', `stroke="${C.rockEdge}" stroke-width="1.5"`);
		for (let i = 0; i < 5; i++) s += r(x - 4, y + 10 + i * 5, 8, 2, '#d6ceb9'); // escadaria
		for (let i = 0; i < 3; i++) s += toriiM(x, y + 40 + i * 9, 0.9);
		s += r(x - 16, y - 12, 32, 18, '#f3e9d2', `stroke="#7c2d12" stroke-width="1.2"`) + pth(`M ${x - 20} ${y - 12} L ${x} ${y - 24} L ${x + 20} ${y - 12} Z`, '#7c2d12') + r(x - 14, y - 10, 28, 3, '#7c2d12');
		s += c(x + 30, y - 24, 12, 'url(#gDark)') + c(x + 30, y - 24, 8, '#0b0612', 'stroke="#c4a5ff" stroke-width="1.2"') + c(x + 30, y - 24, 2.4, '#fff'); // cúpula do domínio
		for (const [dx, dy] of [[-30, 18], [-26, -16], [26, 20]]) s += c(x + dx, y + dy, 4, '#a855f7', 'opacity=".7"') + c(x + dx + 1, y + dy - 1, 1.4, '#fff'); // espíritos amaldiçoados
		s += gymM(x - 22, y + 36, TYPE.onirico);
	}
	// ------ Mundo dos Sonhos: dimensão à parte (quadro no canto do mar)
	{
		const x0 = 36, y0 = 14, w = 196, h = 84;
		s += r(x0, y0, w, h, '#2a1b55', `rx="6" stroke="#ff7ad9" stroke-width="1.6" stroke-dasharray="4 2.5"`) + r(x0 + 2, y0 + 2, w - 4, h - 4, 'url(#skyDream)', 'rx="5" opacity=".55"');
		const rr = rng(33);
		for (let i = 0; i < 24; i++) s += c(x0 + 6 + rr() * (w - 12), y0 + 5 + rr() * (h - 10), 0.6 + rr() * 0.9, '#fff', `opacity="${0.4 + rr() * 0.5}"`);
		for (const [dx, dy, rw] of [[30, 52, 22], [74, 40, 26], [124, 56, 24], [160, 34, 20]]) s += el(x0 + dx, y0 + dy, rw, 5, '#8ed9a8') + pth(`M ${x0 + dx - rw} ${y0 + dy} Q ${x0 + dx} ${y0 + dy + 14} ${x0 + dx + rw} ${y0 + dy} Z`, '#6b4a8a');
		s += el(x0 + 74, y0 + 33, 9, 5, '#8fb8ff') + c(x0 + 70, y0 + 28, 3.5, '#8fb8ff') + T(x0 + 86, y0 + 29, 'z', { size: 6, weight: 800, fill: '#fff', halo: false }) + T(x0 + 91, y0 + 24, 'z', { size: 7.5, weight: 800, fill: '#fff', halo: false }); // Sonecão dormindo
		s += c(x0 + 172, y0 + 20, 8, '#fde68a') + c(x0 + 169, y0 + 18, 7, '#2a1b55', 'opacity=".9"'); // lua
		const tx = REG.templo.x + 30, ty = REG.templo.y - 36;
		s += pth(`M ${tx} ${ty} C ${tx + 40} ${ty - 420} ${x0 + 40} ${y0 - 60} ${x0 + w - 20} ${y0 + h + 2}`, 'none', 'stroke="#ff7ad9" stroke-width="1.4" stroke-dasharray="3 3" marker-end="url(#arrowW)"');
	}

	// ------ trem (loop do continente) + estações
	let tr = 'M ' + TRAIN.map((p) => `${p[0]} ${p[1]}`).join(' L ');
	s += pth(tr, 'none', `stroke="rgba(0,0,0,.25)" stroke-width="7" stroke-linejoin="round" transform="translate(1.5 2.5)"`);
	s += pth(tr, 'none', `stroke="${C.deck}" stroke-width="6" stroke-linejoin="round"`) + pth(tr, 'none', `stroke="${C.tie}" stroke-width="6" stroke-dasharray="1.6 3.4" stroke-linejoin="round"`) + pth(tr, 'none', `stroke="${C.rail}" stroke-width="1" stroke-linejoin="round"`);
	for (const [x, y] of STATIONS) s += r(x - 7, y - 4.5, 14, 9, '#5d6b7a', `rx="1.5" stroke="${C.navy}" stroke-width="1"`) + ln(x - 7, y, x + 7, y, '#8796a6', 1.2);
	s += `<g transform="translate(760 604) rotate(22)">${r(-8, -4.5, 16, 9, '#e5483b', `rx="2" stroke="${C.navy}" stroke-width="1"`)}${r(-6, -3, 4, 3, '#fde68a')}${r(0, -3, 4, 3, '#fde68a')}</g>`;
	// balsa
	s += `<g transform="translate(400 690)">${pth('M -9 0 L 9 0 L 6 5 L -6 5 Z', '#f3f4f6')}${r(-4, -5, 8, 5, '#2d9bf0')}${c(2, -7, 1.6, '#64748b')}</g>`;
	// rotas numeradas (encontros no mato alto)
	for (const [x, y, n] of [[262, 466, 1], [318, 372, 2], [430, 404, 3], [540, 480, 4], [740, 562, 5], [928, 462, 6], [912, 258, 7], [776, 254, 8], [640, 190, 9], [486, 174, 10], [338, 224, 11], [636, 346, 12]]) s += c(x, y, 7, '#fff7d6', `stroke="${C.navy}" stroke-width="1.2"`) + T(x, y + 2.6, 'R' + n, { size: 6.5, weight: 800, anchor: 'middle', fill: C.navy, halo: false });
	// grade de 50 unidades
	let gl = '';
	for (let x = 50; x < WW; x += 50) gl += `M ${x} 0 V ${WH} `;
	for (let y = 50; y < WH; y += 50) gl += `M 0 ${y} H ${WW} `;
	s += pth(gl, 'none', 'stroke="#ffffff" stroke-width=".5" opacity=".08"');
	return s;
}

// ------------------------------------------------------------------ labels (px)
const SERIES = {
	verde: { n: 1, title: 'ILHA VERDEJANTE', serie: 'início · sem série', type: 'normal' },
	capital: { n: 2, title: 'CAPITAL ENCRUZILHADA', serie: 'hub · Liga dos Vanguardas', type: 'martial' },
	vulcao: { n: 3, title: 'VULCÃO ADORMECIDO', serie: 'Demon Slayer', type: 'fogo' },
	porto: { n: 4, title: 'PORTO DO FAROL', serie: 'One Piece', type: 'agua' },
	herois: { n: 5, title: 'CIDADE DOS HERÓIS', serie: 'My Hero Academia', type: 'raio' },
	portoes: { n: 6, title: 'PORTÕES DA PENUMBRA', serie: 'Solo Leveling', type: 'sombra' },
	muralhas: { n: 7, title: 'MURALHAS DO NORTE', serie: 'Attack on Titan', type: 'terra' },
	penhasco: { n: 8, title: 'PENHASCO DOS CATA-VENTOS', serie: 'Naruto', type: 'vento' },
	arena: { n: 9, title: 'ARENA DO TORNEIO', serie: 'Dragon Ball', type: 'martial' },
	templo: { n: 10, title: 'TEMPLO DO DOMÍNIO', serie: 'Jujutsu Kaisen', type: 'onirico' },
};
function regLabel(key, px, py, anchor = 'start') {
	const d = SERIES[key], col = TYPE[d.type];
	let s = '';
	const dir = anchor === 'end' ? -1 : 1;
	s += badge(px, py - 6, d.n, col);
	s += T(px + 20 * dir, py, d.title, { size: 18, weight: 800, ls: 0.5, anchor });
	s += T(px + 20 * dir, py + 17, d.serie, { size: 13.5, weight: 700, fill: d.serie.includes('·') ? C.dim : '#ffe9a3', anchor });
	return s;
}
function drawMapLabels() {
	let s = '';
	s += regLabel('verde', X(72), Y(468));
	s += regLabel('capital', X(488), Y(466));
	s += regLabel('vulcao', X(240), Y(222));
	s += regLabel('porto', X(500), Y(636));
	s += regLabel('herois', X(830), Y(636));
	s += regLabel('portoes', X(1012), Y(262), 'end');
	s += regLabel('muralhas', X(954), Y(78), 'end');
	s += regLabel('penhasco', X(560), Y(44));
	s += regLabel('arena', X(300), Y(60));
	s += regLabel('templo', X(698), Y(330));
	// pontos menores
	const small = (x, y, t, o = {}) => T(X(x), Y(y), t, { size: 11, weight: 700, anchor: 'middle', ...o });
	small(102, 586, 'Lago Espelhado'); small(148, 496, 'Mato Alto'); small(186, 516, 'Círculo de Pedra'); small(188, 604, 'Lab. da Mina'); small(150, 572, 'Vila Verdejante', { fill: '#fff7d6' });
	small(560, 376, 'TORRE DOS VANGUARDAS', { size: 10 }); small(560, 458, 'estação central', { size: 10 });
	small(296, 356, 'glicínias', { size: 10 }); small(310, 262, 'cratera', { size: 10 });
	small(636, 648, 'farol', { size: 10 }); small(560, 666, 'baía dos piratas', { size: 10 });
	small(950, 532, 'Academia de Heróis', { size: 10 });
	small(942, 290, 'masmorra', { size: 10 }); small(930, 420, 'Floresta das Lanternas', { size: 10 });
	small(880, 96, 'três muralhas', { size: 10 }); small(990, 176, 'titã', { size: 10 });
	small(630, 58, 'rostos na pedra', { size: 10 }); small(630, 160, 'Vila da Folha', { size: 10 });
	small(702, 232, 'cúpula do domínio', { size: 10 });
	small(134, 112, 'MUNDO DOS SONHOS', { size: 12, fill: '#ffd0f0', ls: 1 }); small(134, 126, 'dimensão à parte · entra dormindo no Templo', { size: 10, fill: '#ffd0f0' });
	small(400, 702, 'balsa: Ilha → Porto', { size: 10 }); small(770, 616, 'Trem Vanguarda', { size: 10 });
	small(720, 190, 'Serra do Meio', { size: 11, fill: '#efe6da', ls: 2 });
	s += badge(X(742), Y(596), 11, '#7dd3fc', 0.85);
	s += badge(X(50), Y(28), 12, TYPE.onirico, 0.85);
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
	s += signBoard(172, 136, 92, 13, 'LIGA DOS VANGUARDAS', { size: 8.5 });
	return s;
}
function vVulcao() {
	let s = r(0, 0, VW, VH, 'url(#skyEve)');
	s += poly([[110, 124], [170, 30], [196, 30], [262, 124]], '#5e5044') + poly([[150, 60], [170, 30], [196, 30], [214, 60], [196, 54], [182, 62], [168, 54]], '#ff6a2b') + c(183, 18, 14, 'rgba(255,255,255,.35)') + c(200, 6, 10, 'rgba(255,255,255,.3)');
	s += pth('M 110 124 L 170 30 L 150 60 L 140 124 Z', 'rgba(0,0,0,.2)');
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

// ------------------------------------------------------------------ right panel
const CARDS = [
	[1, 'normal', 'ILHA VERDEJANTE · INÍCIO', 'casa do jogador', vVerde, ['Vila Verdejante, laboratório da Mina (ela', 'dá o Eco inicial), Mato Alto do primeiro', 'encontro, Lago Espelhado e Círculo de Pedra.']],
	[2, 'martial', 'CAPITAL ENCRUZILHADA', 'hub · Liga dos Vanguardas', vCapital, ['Cidade no meio do continente: Torre dos', 'Vanguardas (a Liga final), estação central', 'do trem, lojas e Centro Eco.']],
	[3, 'fogo', 'VULCÃO ADORMECIDO', 'Demon Slayer · insígnia Brasa', vVulcao, ['Vila de madeira ao pé do vulcão, campo de', 'glicínias e espadachins. Ecos: Brasalume,', 'Brasardente. Fighter de referência: Tanjiro.']],
	[4, 'agua', 'PORTO DO FAROL', 'One Piece · insígnia Maré', vPorto, ['Porto pirata com farol, taverna e navios.', 'A balsa da Ilha chega aqui. Ecos: Marolinha,', 'Gotaluz. Fighter de referência: Luffy.']],
	[5, 'raio', 'CIDADE DOS HERÓIS', 'My Hero Academia · insígnia Trovão', vHerois, ['Metrópole com a Academia de Heróis em', 'forma de U e neon por todo lado. Ecos:', 'Voltisco, Relampejo. Fighter de referência: Deku.']],
	[6, 'sombra', 'PORTÕES DA PENUMBRA', 'Solo Leveling · insígnia Penumbra', vPortoes, ['Floresta das Lanternas com portões azuis', 'que abrem masmorras. Ecos: Sombrelo,', 'Nebulume. Fighter: Sung Jin-Woo (já no jogo).']],
	[7, 'terra', 'MURALHAS DO NORTE', 'Attack on Titan · insígnia Rocha', vMuralhas, ['Três muralhas em círculo e um distrito de', 'pedra. Ecos: Pedrelho, Musgorila. Fighter de', 'referência: Levi (lâminas duplas).']],
	[8, 'vento', 'PENHASCO DOS CATA-VENTOS', 'Naruto · insígnia Brisa', vPenhasco, ['Vila ninja no alto do penhasco, cata-ventos', 'e rostos esculpidos na pedra. Ecos: Ventuela.', 'Fighter de referência: Naruto (Rasengan).']],
	[9, 'martial', 'ARENA DO TORNEIO', 'Dragon Ball · insígnia Arena', vArena, ['Ringue de pedra do Torneio de Artes', 'Marciais, com arquibancada e tochas.', 'Fighter de referência: Goku.']],
	[10, 'onirico', 'TEMPLO DO DOMÍNIO', 'Jujutsu Kaisen · insígnia Sonho', vTemplo, ['Escola de feiticeiros na Serra do Meio.', 'A cúpula preta é a Expansão de Domínio.', 'Fighter: Gojo Satoru (golpe já no jogo).']],
	[11, 'onirico', 'MUNDO DOS SONHOS', 'dimensão à parte · Onírico', vSonhos, ['Entra dormindo no Templo (ou com o golpe', 'onírico). Ilhas flutuantes, Sonecão e Ecos', 'que só aparecem lá. Acorda ao levar dano.']],
	[12, 'agua', 'TREM E BALSA', 'transporte', vTrem, ['O Trem Vanguarda dá a volta no continente', 'com 9 estações. A balsa liga a Ilha ao', 'Porto. Rotas R1 a R12 têm mato alto.']],
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
		s += T(x + 52, y + 221, sub, { size: 13, weight: 700, halo: false, fill: sub.includes('·') && !sub.includes('insígnia') && !sub.includes('dimensão') ? C.dim : '#ffe9a3' });
		lines.forEach((t, k) => (s += T(x + 16, y + 246 + k * 19, t, { size: 14.2, weight: 500, body: true, halo: false, fill: '#c9dbf1' })));
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
	let s = frame(x0, IY, w, IH, 'QUAL É QUAL · REGIÃO → SÉRIE → TIPO → INSÍGNIA → FIGHTER');
	const cols = [16, 48, 262, 440, 560, 680];
	const head = ['#', 'Região', 'Série', 'Tipo', 'Insígnia', 'Fighter de referência'];
	head.forEach((h, i) => (s += T(x0 + cols[i], IY + 50, h, { size: 12, weight: 800, fill: C.dim, halo: false, ls: 1 })));
	s += ln(x0 + 14, IY + 57, x0 + w - 14, IY + 57, C.panelEdge, 1.2);
	const rows = [
		[3, 'Vulcão Adormecido', 'Demon Slayer', 'fogo', 'Brasa', 'Tanjiro'],
		[4, 'Porto do Farol', 'One Piece', 'agua', 'Maré', 'Luffy'],
		[5, 'Cidade dos Heróis', 'My Hero Academia', 'raio', 'Trovão', 'Deku'],
		[6, 'Portões da Penumbra', 'Solo Leveling ✓', 'sombra', 'Penumbra', 'Sung Jin-Woo ✓'],
		[7, 'Muralhas do Norte', 'Attack on Titan', 'terra', 'Rocha', 'Levi'],
		[8, 'Penhasco dos Cata-ventos', 'Naruto', 'vento', 'Brisa', 'Naruto'],
		[9, 'Arena do Torneio', 'Dragon Ball', 'martial', 'Arena', 'Goku'],
		[10, 'Templo do Domínio', 'Jujutsu Kaisen ✓', 'onirico', 'Sonho', 'Gojo Satoru ✓'],
	];
	rows.forEach(([n, reg, serie, type, ins, fighter], i) => {
		const y = IY + 80 + i * 24;
		s += badge(x0 + cols[0] + 9, y - 5, n, TYPE[type], 0.78);
		s += T(x0 + cols[1], y, reg, { size: 15, weight: 600, body: true, halo: false });
		s += T(x0 + cols[2], y, serie, { size: 15, weight: 700, body: true, halo: false, fill: serie.includes('✓') ? '#86efac' : '#ffe9a3' });
		s += r(x0 + cols[3], y - 12, 9, 14, TYPE[type], 'rx="2"') + T(x0 + cols[3] + 14, y, TNAME[type], { size: 15, weight: 600, body: true, halo: false });
		s += star(x0 + cols[4] + 6, y - 5, 6, 2.6, 5, TYPE[type]) + T(x0 + cols[4] + 18, y, ins, { size: 15, weight: 600, body: true, halo: false });
		s += T(x0 + cols[5], y, fighter, { size: 15, weight: 600, body: true, halo: false, fill: fighter.includes('✓') ? '#86efac' : C.ink });
	});
	s += T(x0 + 16, IY + 278, '✓ = já existe no jogo (Gojo e Jin-Woo). As outras 6 séries são sugestão pelo tipo que combina: troque à vontade, o mapa não muda.', { size: 12.5, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}
function insetOrder() {
	const x0 = MX + 866 + 14, w = 384;
	let s = frame(x0, IY, w, IH, 'ORDEM DA AVENTURA');
	const steps = [['Ilha Verdejante', 'Lv 1–8 · inicial com a Mina', 'normal', 1], ['Vulcão → Brasa', 'Lv 8–14', 'fogo', 3], ['Porto → Maré', 'Lv 14–20 · balsa', 'agua', 4], ['Heróis → Trovão', 'Lv 20–26', 'raio', 5], ['Portões → Penumbra', 'Lv 26–32', 'sombra', 6], ['Muralhas → Rocha', 'Lv 32–38', 'terra', 7], ['Penhasco → Brisa', 'Lv 38–44', 'vento', 8], ['Arena → Arena', 'Lv 44–50', 'martial', 9], ['Templo → Sonho', 'Lv 50+ · Mundo dos Sonhos', 'onirico', 10], ['Capital → Liga', 'Torre dos Vanguardas', 'martial', 2]];
	steps.forEach(([t, sub, type, n], i) => {
		const y = IY + 54 + i * 23;
		s += badge(x0 + 30, y - 4, n, TYPE[type], 0.72) + T(x0 + 48, y, t, { size: 14.5, weight: 700, body: true, halo: false }) + T(x0 + w - 16, y, sub, { size: 12, weight: 500, body: true, halo: false, fill: C.dim, anchor: 'end' });
		if (i < steps.length - 1) s += ln(x0 + 30, y + 7, x0 + 30, y + 14, C.dim, 1.2);
	});
	s += T(x0 + 16, IY + 284, 'o trem segue essa ordem no sentido horário', { size: 12, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}
function insetSymbols() {
	const x0 = MX + 866 + 14 + 384 + 14, w = WW * K - (866 + 14 + 384 + 14);
	let s = frame(x0, IY, w, IH, 'SÍMBOLOS · ESCALA');
	const rows = [
		[gymM(x0 + 30, 0, TYPE.fogo), 'ginásio da insígnia (cor = tipo)'],
		[gateM(x0 + 30, 0, 1.4), 'portão / masmorra'],
		[c(x0 + 30, 0, 7, '#fff7d6', `stroke="${C.navy}" stroke-width="1.2"`) + T(x0 + 30, 2.6, 'R1', { size: 6.5, weight: 800, anchor: 'middle', fill: C.navy, halo: false }), 'rota com mato alto (encontros)'],
		[r(x0 + 20, -5, 20, 10, '#5d6b7a', 'rx="2"') + ln(x0 + 20, 0, x0 + 40, 0, '#8796a6', 1.4), 'estação do trem'],
		[ln(x0 + 14, 0, x0 + 46, 0, '#eaf6ff', 1.8, 'stroke-dasharray="5 4"'), 'rota da balsa'],
		[ln(x0 + 14, 0, x0 + 46, 0, '#ff7ad9', 1.6, 'stroke-dasharray="3 3"'), 'passagem pro Mundo dos Sonhos'],
		[poly([[x0 + 20, 6], [x0 + 30, -8], [x0 + 40, 6]], C.rock, `stroke="${C.rockEdge}" stroke-width=".8"`) + poly([[x0 + 27, -4], [x0 + 30, -8], [x0 + 33, -4]], C.snow), 'serra (bloqueia até ter a insígnia)'],
	];
	rows.forEach(([sym, t], i) => { const y = IY + 56 + i * 27; s += `<g transform="translate(0 ${y})">${sym}</g>` + T(x0 + 56, y + 5, t, { size: 14, weight: 600, body: true, halo: false }); });
	const bx = x0 + 20, by = IY + 258, seg = 50 * K;
	for (let i = 0; i < 2; i++) s += r(bx + i * seg, by - 5, seg, 10, i % 2 ? C.sheet : C.ink, `stroke="${C.ink}" stroke-width="1.2"`);
	[0, 50, 100].forEach((v) => (s += T(bx + (v / 50) * seg, by + 22, v === 0 ? '0' : v * 10 + ' studs', { size: 11, weight: 700, anchor: 'middle', halo: false })));
	s += T(bx + 2 * seg + 14, by + 4, '1 quadrado = 50 un = 500 studs', { size: 12, weight: 700, halo: false, fill: C.dim });
	return s;
}
function drawTitleBlock() {
	const x0 = MX, y0 = 1540, w = WW * K, h = 118;
	let s = r(x0, y0, w, h, 'rgba(12,38,69,.92)', `stroke="${C.frame}" stroke-width="1.5" rx="4"`);
	const cells = [['PROJETO', 'Pocket Vanguards', 300], ['FOLHA', '02 · Mapa do continente, uma região por série', 470], ['ESCALA', '1 quadrado = 500 studs (referência)', 300], ['REGIÕES', '8 insígnias + início + capital', 270], ['DATA', '16/10/2026', 150], ['REV.', 'A', w - 1490]];
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
	s += T(38, 98, 'MAPA DO CONTINENTE', { size: 62, weight: 800, halo: false, ls: 1.5 });
	s += T(620, 74, 'Vista de cima. Cada região é o mundo de uma série e guarda uma insígnia.', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	s += T(620, 99, 'Você começa na Ilha Verdejante e termina na Torre dos Vanguardas, no meio.', { size: 19, weight: 500, body: true, halo: false, fill: C.dim });
	const chips = ['fogo', 'agua', 'raio', 'sombra', 'terra', 'vento', 'martial', 'onirico', 'normal'];
	chips.forEach((k, i) => {
		const x = PX + (i % 5) * 224, y = 42 + Math.floor(i / 5) * 40;
		s += c(x + 12, y - 5, 12, TYPE[k], `stroke="${C.navy}" stroke-width="2"`) + T(x + 32, y + 1, TNAME[k], { size: 18, weight: 600, body: true, halo: false });
	});
	s += T(PX + 4 * 224 + 0, 83, 'cor = tipo da região', { size: 16, weight: 500, body: true, halo: false, fill: C.dim });
	return s;
}

// ------------------------------------------------------------------ assemble
function buildSVG() {
	const g50 = 50 * K, g250 = 250 * K;
	const grid = `<pattern id="gridMinor" x="${MX}" y="${MY}" width="${g50}" height="${g50}" patternUnits="userSpaceOnUse"><path d="M ${g50} 0 L 0 0 0 ${g50}" fill="none" stroke="${C.grid}" stroke-opacity=".09" stroke-width="1"/></pattern><pattern id="gridMajor" x="${MX}" y="${MY}" width="${g250}" height="${g250}" patternUnits="userSpaceOnUse"><path d="M ${g250} 0 L 0 0 0 ${g250}" fill="none" stroke="${C.grid}" stroke-opacity=".18" stroke-width="1.2"/></pattern>`;
	DEFS.push(`<clipPath id="mapClip"><rect x="0" y="0" width="${WW}" height="${WH}" rx="10"/></clipPath>`);
	const map = `<g transform="translate(${MX} ${MY}) scale(${K})" clip-path="url(#mapClip)">${drawMap()}</g>` + r(MX, MY, WW * K, WH * K, 'none', `stroke="${C.frame}" stroke-width="2" rx="${10 * K}"`);
	const labels = drawMapLabels();
	const insets = insetTable() + insetOrder() + insetSymbols() + drawTitleBlock();
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
