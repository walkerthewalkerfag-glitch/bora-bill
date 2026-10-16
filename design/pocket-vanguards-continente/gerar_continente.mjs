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
// continente (sentido horário). O mar do canto NW fica livre para a Estação Astral.
const LAND = [[236, 72], [330, 48], [430, 62], [520, 44], [640, 58], [760, 40], [880, 56], [980, 88], [1030, 160], [1044, 280], [1030, 420], [1044, 540], [1000, 606], [900, 626], [800, 646], [700, 630], [600, 660], [500, 640], [410, 666], [320, 652], [220, 660], [120, 648], [60, 610], [66, 560], [130, 536], [206, 522], [236, 466], [214, 400], [236, 330], [206, 262], [232, 196], [218, 124]];
// cidades: x, y (unidades)
const CITY = {
	vila: [112, 598], farol: [318, 612], capsule: [548, 586], dunas: [846, 566], glicinias: [764, 204], aurea: [590, 118], portoes: [384, 176], astral: [132, 166], amald: [268, 352], liga: [566, 352],
};
// sub-lugares
const SUB = { lago: [206, 582], floresta: [432, 552], circulo: [668, 512], oasis: [760, 600], penhasco: [938, 420], nevado: [906, 292], vulcao: [838, 128], costa: [690, 92], masmorra: [344, 108], caverna: [446, 352], ilhanavio: [330, 690] };
// rotas: número, pontos
const ROUTES = [
	[1, [[140, 598], [206, 582]]], [2, [[206, 582], [296, 612]]], [3, [[340, 604], [432, 552]]], [4, [[432, 552], [522, 586]]],
	[5, [[576, 580], [668, 512]]], [6, [[668, 512], [740, 560], [820, 566]]], [7, [[866, 548], [938, 420]]], [8, [[938, 420], [906, 292]]],
	[9, [[906, 292], [792, 212]]], [10, [[740, 196], [690, 120], [616, 118]]], [11, [[564, 122], [412, 170]]], [13, [[384, 204], [286, 330]]], [14, [[296, 352], [446, 352], [534, 352]]],
];
const RAIL = [[360, 176], [300, 150], [220, 150], [160, 166]]; // Expresso Astral (R12), sobre o mar

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
	for (let y = 20; y < WH; y += 28) { let d = ''; for (let x = 0; x <= WW; x += 12) d += `${x ? 'L' : 'M'} ${x} ${f(y + 3 * Math.sin(x / 19 + y))} `; s += pth(d, 'none', `stroke="${C.seaLine}" stroke-width=".8" opacity=".35"`); }
	const land = coast(LAND, 5, 2.2);
	s += pth(land, C.sand, `stroke="${C.sand}" stroke-width="12" stroke-linejoin="round"`) + pth(coast(offsetPoly(LAND, -5), 4, 2.2), C.grass);
	for (const [d, op] of [[coast(offsetPoly(LAND, 18), 5, 2.2), 0.35], [coast(offsetPoly(LAND, 34), 6, 2.2), 0.2]]) s += pth(d, 'none', `stroke="#9fd0f0" stroke-width="1" opacity="${op}"`);

	// ------ biomas
	// deserto (SE)
	s += pth(blob(810, 580, 118, 10, 5.1), '#ead9a0') + pth(blob(700, 560, 44, 6, 5.4), '#ead9a0');
	for (let i = 0; i < 14; i++) { const x = 720 + (i % 7) * 42, y = 530 + Math.floor(i / 7) * 60 + (i % 2) * 18; s += pth(`M ${x - 14} ${y} q 14 -8 28 0`, 'none', 'stroke="#d8c184" stroke-width="1.6"'); }
	s += pth(blob(760, 600, 12, 1.5, 6.6), C.water, 'stroke="#3d93b8" stroke-width="1.2"') + treeM(748, 592, 0.7, '#4f9c55') + treeM(772, 592, 0.7, '#4f9c55'); // oásis
	for (const [x, y] of [[700, 590], [790, 530], [880, 610], [930, 540], [720, 620]]) s += r(x - 1.5, y - 8, 3, 10, '#4f9c55') + r(x - 5, y - 5, 3, 4, '#4f9c55') + r(x + 2, y - 7, 3, 4, '#4f9c55'); // cactos
	// neve (NE)
	s += pth(blob(906, 292, 78, 7, 7.7), '#eef3f6', 'opacity=".95"');
	const rr0 = rng(5);
	for (let i = 0; i < 14; i++) { const a = rr0() * 360, d = rr0() * 60, x = 906 + d * Math.cos(a * deg), y = 292 + d * Math.sin(a * deg), h = 8 + rr0() * 12; if (Math.hypot(x - 906, y - 292) < 16) continue; s += poly([[x - h * 0.8, y + h * 0.3], [x, y - h], [x + h * 0.8, y + h * 0.3]], '#b7c3cc', `stroke="${C.rockEdge}" stroke-width=".7"`) + poly([[x - h * 0.4, y - h * 0.35], [x, y - h], [x + h * 0.4, y - h * 0.35]], '#ffffff'); }
	for (const [x, y] of [[870, 340], [950, 330], [860, 250], [950, 260]]) s += pineM(x, y, 1, '#4b7a5c');
	// vulcão (N)
	for (let i = 0; i < 4; i++) s += pth(blob(SUB.vulcao[0], SUB.vulcao[1], 50 - i * 11, 4, 2.5 + i), ['#8a7b6b', '#7c6c5c', '#6e5f50', '#5e5044'][i], `stroke="${C.rockEdge}" stroke-width=".8"`);
	s += c(SUB.vulcao[0], SUB.vulcao[1], 10, '#3b1f14') + c(SUB.vulcao[0], SUB.vulcao[1], 6, '#ff6a2b') + c(SUB.vulcao[0] + 6, SUB.vulcao[1] - 20, 8, 'rgba(255,255,255,.45)') + c(SUB.vulcao[0] + 14, SUB.vulcao[1] - 30, 6, 'rgba(255,255,255,.35)');
	// floresta das lanternas
	s += pth(blob(432, 552, 44, 5, 6.6), '#2f4a3a') + pth(blob(432, 552, 32, 4, 7.1), '#263d30');
	const rr1 = rng(4);
	for (let i = 0; i < 22; i++) { const a = rr1() * 360, d = rr1() * 36; s += c(432 + d * Math.cos(a * deg), 552 + d * Math.sin(a * deg), 2.6 + rr1() * 2.6, i % 3 ? '#35634a' : '#2a5340'); }
	for (const [dx, dy] of [[-18, -14], [14, -18], [20, 10], [-22, 14], [0, 24]]) s += lanternM(432 + dx, 552 + dy);
	// serra do meio (em volta da Liga) com a caverna do Caminho da Vitória
	const rr2 = rng(3), peaks = [];
	for (let i = 0; i < 90; i++) { const a = rr2() * 360, d = 46 + rr2() * 70, x = 566 + d * Math.cos(a * deg) * 1.5, y = 352 + d * Math.sin(a * deg) * 0.8; if (Math.hypot(x - 566, y - 352) < 40 || Math.abs(y - 352) < 9 && x < 560) continue; peaks.push([x, y, 8 + rr2() * 11]); }
	peaks.sort((p, q) => p[1] - q[1]);
	for (const [x, y, h] of peaks) s += poly([[x - h * 0.9, y + h * 0.35], [x, y - h], [x + h * 0.9, y + h * 0.35]], C.rock, `stroke="${C.rockEdge}" stroke-width=".8"`) + poly([[x - h * 0.3, y - h * 0.4], [x, y - h], [x + h * 0.3, y - h * 0.4]], C.snow);
	// costa de pedra (penhascos no norte) e penhasco dos cata-ventos
	for (let x = 640; x < 740; x += 6) s += ln(x, 70 + 2 * Math.sin(x / 9), x + 3, 84 + 2 * Math.sin(x / 9), C.rockEdge, 1.2, 'opacity=".7"');
	s += pth(blob(938, 420, 34, 4, 9.9), C.rock, `stroke="${C.rockEdge}" stroke-width="1.5"`) + pth(blob(938, 424, 22, 3, 10.2), '#9bc77e');
	for (const [dx, dy] of [[-14, -14], [4, -20], [18, -8]]) s += windmillM(938 + dx, 420 + dy, 0.8);
	// lago espelhado e círculo de pedra
	s += pth(blob(206, 582, 20, 2.5, 8.1), C.water, 'stroke="#3d93b8" stroke-width="1.6"') + el(200, 576, 6, 2.4, '#bfe9f7', 'opacity=".6"');
	for (let i = 0; i < 8; i++) { const a = i * 45; s += r(668 + 13 * Math.cos(a * deg) - 1.8, 512 + 9 * Math.sin(a * deg) - 2.6, 3.6, 5.2, '#8a8f98', `stroke="${C.rockEdge}" stroke-width=".6"`); }
	// ilha do navio (naufrágio, One Piece)
	s += pth(blob(330, 690, 16, 2, 11.3), C.sand) + pth(blob(330, 690, 10, 1.5, 11.3), C.grass) + shipM(338, 684, 0.8, '#d9d0b2') + treeM(324, 686, 0.7);
	// árvores espalhadas
	const rr3 = rng(8);
	for (let i = 0; i < 90; i++) {
		const x = 70 + rr3() * 960, y = 60 + rr3() * 600;
		if (Math.hypot(x - 810, y - 580) < 125 || Math.hypot(x - 906, y - 292) < 82 || Math.hypot(x - 838, y - 128) < 56 || Math.hypot(x - 566, y - 352) < 160) continue;
		if (Object.values(CITY).some(([cx, cy]) => Math.hypot(x - cx, y - cy) < 52) || Object.values(SUB).some(([cx, cy]) => Math.hypot(x - cx, y - cy) < 34)) continue;
		if (x < 236 && y < 470) continue;
		s += (i % 4 ? treeM : pineM)(x, y, 0.9);
	}

	// ------ rotas (tan) com mato alto, e os números
	let rd = '';
	for (const [, pts] of ROUTES) rd += 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ') + ' ';
	s += pth(rd, 'none', `stroke="${C.pathEdge}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"`) + pth(rd, 'none', `stroke="${C.path}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"`);
	for (const [, pts] of ROUTES) for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0); for (let t = 14; t < len - 10; t += 16) { const x = x0 + ((x1 - x0) * t) / len, y = y0 + ((y1 - y0) * t) / len, side = (Math.floor(t / 16) % 2) * 2 - 1, nx = ((y1 - y0) / len) * 7 * side, ny = (-(x1 - x0) / len) * 7 * side; s += c(x + nx, y + ny, 3.2, '#4f9c55') + c(x + nx + 2.4, y + ny + 1.5, 2.4, '#5fae5a'); } }
	// Expresso Astral: trilho sobre o mar com pilares
	const railD = 'M ' + RAIL.map((p) => `${p[0]} ${p[1]}`).join(' L ');
	for (let i = 0; i < RAIL.length - 1; i++) { const [x0, y0] = RAIL[i], [x1, y1] = RAIL[i + 1], len = Math.hypot(x1 - x0, y1 - y0); for (let t = 10; t < len; t += 18) s += r(x0 + ((x1 - x0) * t) / len - 1.5, y0 + ((y1 - y0) * t) / len, 3, 8, '#4a3a2c'); }
	s += pth(railD, 'none', `stroke="${C.deck}" stroke-width="6"`) + pth(railD, 'none', `stroke="${C.tie}" stroke-width="6" stroke-dasharray="1.6 3.4"`) + pth(railD, 'none', `stroke="${C.rail}" stroke-width="1"`);
	s += `<g transform="translate(262 150)">${r(-9, -4.5, 18, 9, '#2a1b55', `rx="2" stroke="${C.gold}" stroke-width="1"`)}${r(-6, -2.5, 4, 3, '#fde68a')}${r(0, -2.5, 4, 3, '#fde68a')}${c(-12, 0, 1.6, '#fff')}</g>`;
	// balsa opcional Farol → Ilha do Navio
	s += pth('M 318 632 Q 322 660 330 676', 'none', 'stroke="#eaf6ff" stroke-width="1.4" stroke-dasharray="4 3"');

	// ------ cidades
	const [vx, vy] = CITY.vila;
	for (const [dx, dy, roof] of [[-12, -6, '#d9412f'], [4, -12, '#2d9bf0'], [16, -2, '#d9412f'], [-4, 8, '#f2c230'], [10, 12, '#2d9bf0']]) s += houseM(vx + dx, vy + dy, 11, 9, roof);
	s += r(vx - 28, vy + 4, 18, 13, '#f8fafc', 'rx="1.5" stroke="#94a3b8" stroke-width="1"') + r(vx - 26, vy + 6, 14, 4, '#60a5fa') + c(vx - 14, vy - 2, 1.4, '#ef4444');
	for (let i = 0; i < 10; i++) s += c(vx - 30 + i * 7, vy - 28 + (i % 2) * 5, 2.8, '#4f9c55');

	const [fx, fy] = CITY.farol;
	s += pth(`M ${fx - 34} ${fy + 14} Q ${fx} ${fy + 44} ${fx + 34} ${fy + 14} Z`, C.sea) + r(fx - 30, fy + 12, 60, 4, '#a9865e') + r(fx - 8, fy + 14, 3.5, 18, '#a9865e') + r(fx + 12, fy + 14, 3.5, 14, '#a9865e');
	s += shipM(fx + 2, fy + 32, 0.9) + shipM(fx + 26, fy + 28, 0.75, '#ef4444');
	for (const [dx, dy, roof] of [[-34, -6, '#2d9bf0'], [-20, -14, '#d9412f'], [-6, -4, '#f2c230'], [10, -14, '#2d9bf0'], [24, -4, '#d9412f']]) s += houseM(fx + dx, fy + dy, 11, 8, roof);
	s += r(fx + 40, fy - 6, 4, 18, '#f3f4f6') + r(fx + 40, fy - 2, 4, 4, '#ef4444') + r(fx + 40, fy + 6, 4, 4, '#ef4444') + c(fx + 42, fy - 8, 2.6, '#fde68a') + c(fx + 42, fy - 8, 8, '#fde68a', 'opacity=".25"');
	s += gymM(fx - 40, fy + 10, TYPE.agua);

	const [cx, cy] = CITY.capsule;
	s += r(cx - 56, cy - 36, 112, 72, '#dfe4ea', 'rx="8" stroke="#8c97a6" stroke-width="1.5"');
	for (const [dx, dy, rad, col] of [[-30, -12, 14, '#f3f4f6'], [4, -14, 11, '#f3f4f6'], [30, -10, 9, '#f3f4f6'], [-26, 16, 10, '#f3f4f6'], [20, 16, 13, '#f3f4f6']]) s += c(cx + dx, cy + dy, rad, col, 'stroke="#8c97a6" stroke-width="1"') + c(cx + dx, cy + dy, rad * 0.55, '#fde68a', 'opacity=".9"') + r(cx + dx - 2, cy + dy - rad - 4, 4, 5, '#8c97a6');
	s += T(cx, cy - 26, 'CAPSULE CORP.', { size: 5.5, weight: 800, anchor: 'middle', fill: '#1f2937', halo: false, ls: 0.8 });
	s += r(cx - 8, cy - 1, 16, 16, '#f4e7c3', 'stroke="#3f3f46" stroke-width="1"'); // ringue
	s += gymM(cx + 44, cy + 24, TYPE.martial);

	const [dx0, dy0] = CITY.dunas;
	for (const [dx, dy, w] of [[-28, -8, 12], [-10, -16, 10], [8, -8, 12], [-20, 10, 10], [4, 12, 12], [24, 2, 10]]) s += c(dx0 + dx, dy0 + dy, w / 2, '#c9a56a', 'stroke="#8a6a3a" stroke-width="1"') + c(dx0 + dx, dy0 + dy, 1.8, '#5a3d1e');
	s += c(dx0 + 30, dy0 - 18, 9, '#e3c98a', 'stroke="#8a6a3a" stroke-width="1"') + c(dx0 + 30, dy0 - 18, 4, '#b45309'); // domo do Kazekage
	for (let i = 0; i < 3; i++) s += pth(`M ${dx0 - 40 + i * 30} ${dy0 + 30} q 15 -8 30 0`, 'none', 'stroke="#d8c184" stroke-width="1.6"');
	s += gymM(dx0 - 42, dy0 - 20, TYPE.vento);

	const [gx, gy] = CITY.glicinias;
	for (const [dx, dy] of [[-30, 14], [-18, 24], [-4, 28], [12, 26], [26, 18]]) s += c(gx + dx, gy + dy, 6, '#b388ff', 'opacity=".85"') + c(gx + dx + 2, gy + dy - 3, 3.5, '#d9c2ff');
	for (const [dx, dy] of [[-14, -8], [2, -14], [18, -6], [-2, 4]]) s += houseM(gx + dx, gy + dy, 11, 8, '#4a3a2c', '#efe4cc');
	s += toriiM(gx - 30, gy - 10, 1) + gymM(gx + 34, gy - 4, TYPE.fogo);

	const [ax, ay] = CITY.aurea;
	for (const [dx, dy, roof] of [[-36, 4, '#f59e0b'], [-24, -6, '#fb7185'], [-10, 6, '#fde68a'], [4, -6, '#fb923c'], [18, 6, '#f59e0b'], [32, -4, '#fb7185']]) s += houseM(ax + dx, ay + dy, 11, 12, '#b45309', roof);
	s += c(ax + 2, ay + 26, 12, '#e9ddc5', 'stroke="#a89c86" stroke-width="1.2"') + c(ax + 2, ay + 26, 7, 'none', 'stroke="#a89c86" stroke-width="1.2"') + star(ax + 2, ay + 26, 4, 1.6, 5, C.gold); // praça com a seta
	s += pth(`M ${ax - 44} ${ay - 16} L ${ax + 44} ${ay - 16}`, 'none', `stroke="${C.rockEdge}" stroke-width="2"`) + gymM(ax + 46, ay + 14, TYPE.terra);

	const [px, py] = CITY.portoes;
	s += r(px - 50, py - 36, 100, 72, '#cfd6de', 'rx="5" stroke="#8c97a6" stroke-width="1.5"');
	const rr4 = rng(21);
	for (let gx2 = -44; gx2 <= 30; gx2 += 18) for (let gy2 = -30; gy2 <= 18; gy2 += 16) s += r(px + gx2, py + gy2, 10 + rr4() * 6, 8 + rr4() * 6, ['#64748b', '#94a3b8', '#475569'][Math.floor(rr4() * 3)], 'rx="1"');
	for (const [dx, dy, sc] of [[36, -22, 1.1], [-30, 26, 0.9], [20, 20, 1], [-6, -4, 0.8]]) s += gateM(px + dx, py + dy, sc);
	s += pth(blob(SUB.masmorra[0], SUB.masmorra[1], 11, 1.5, 3.3), '#101522', 'stroke="#7a86c9" stroke-width="1.2"') + gateM(SUB.masmorra[0], SUB.masmorra[1], 0.9); // Masmorra Dupla
	s += gymM(px - 42, py - 26, TYPE.sombra);

	const [sx, sy] = CITY.astral;
	s += c(sx, sy, 40, '#1b1740', 'opacity=".55"') + el(sx, sy + 2, 30, 20, '#2a2553', 'stroke="#9fa8ff" stroke-width="1.5"') + el(sx, sy + 2, 30, 20, 'none', 'stroke="#fff" stroke-width=".6" stroke-dasharray="2 3"');
	s += el(sx, sy - 4, 16, 9, '#3b3580', 'stroke="#c7cbff" stroke-width="1"') + c(sx, sy - 6, 6, '#fde68a') + c(sx, sy - 6, 3, '#fff');
	for (const [dx, dy] of [[-22, -2], [22, -2], [0, 12]]) s += c(sx + dx, sy + dy, 3, '#9fa8ff', 'stroke="#fff" stroke-width=".8"');
	const rr5 = rng(31);
	for (let i = 0; i < 26; i++) { const a = rr5() * 360, d = 44 + rr5() * 40; s += c(sx + d * Math.cos(a * deg), sy + d * Math.sin(a * deg) * 0.8, 0.6 + rr5(), '#fff', `opacity="${0.4 + rr5() * 0.5}"`); }
	s += gymM(sx + 24, sy + 14, TYPE.raio);

	const [mx, my] = CITY.amald;
	s += r(mx - 46, my - 34, 92, 68, '#4a3f66', 'rx="5" stroke="#2a2340" stroke-width="1.5"');
	for (let gx3 = -40; gx3 <= 28; gx3 += 17) for (let gy3 = -28; gy3 <= 16; gy3 += 15) { if (Math.abs(gx3 + 6) < 12 && Math.abs(gy3 + 6) < 12) continue; s += r(mx + gx3, my + gy3, 11, 9, ['#6b5f8a', '#857aa6', '#5a4f7a'][(gx3 + gy3) % 3 ? 1 : 0], 'rx="1"'); }
	s += r(mx - 10, my - 10, 14, 14, '#9ca3af') + ln(mx - 10, my - 10, mx + 4, my + 4, '#fff', 1) + ln(mx + 4, my - 10, mx - 10, my + 4, '#fff', 1); // cruzamento de Shibuya
	s += r(mx + 20, my - 30, 22, 12, '#f3e9d2', 'stroke="#7c2d12" stroke-width="1"') + pth(`M ${mx + 18} ${my - 30} L ${mx + 31} ${my - 38} L ${mx + 44} ${my - 30} Z`, '#7c2d12') + toriiM(mx + 31, my - 12, 0.8); // escola/templo
	s += c(mx - 30, my + 20, 9, 'url(#gDark)') + c(mx - 30, my + 20, 6, '#0b0612', 'stroke="#c4a5ff" stroke-width="1"') + c(mx - 30, my + 20, 1.8, '#fff'); // cúpula
	s += gymM(mx + 36, my + 22, TYPE.onirico);

	const [lx, ly] = CITY.liga;
	s += c(lx, ly, 30, '#d6ceb9', 'stroke="#a99f88" stroke-width="1.5"') + poly([[lx, ly - 24], [lx + 14, ly + 8], [lx + 7, ly + 16], [lx - 7, ly + 16], [lx - 14, ly + 8]], '#b91c1c', `stroke="${C.gold}" stroke-width="2"`) + star(lx, ly + 2, 7, 3, 5, C.gold);
	for (const [dx, dy] of [[-22, -18], [22, -18], [-22, 20], [22, 20]]) s += houseM(lx + dx, ly + dy, 9, 7, '#7c2d12', '#f7f1e3');
	s += pth(`M ${SUB.caverna[0] - 10} ${SUB.caverna[1] + 8} A 10 9 0 0 1 ${SUB.caverna[0] + 10} ${SUB.caverna[1] + 8} Z`, '#1d140e') + r(SUB.caverna[0] - 12, SUB.caverna[1] + 4, 3, 6, '#8a5a2b') + r(SUB.caverna[0] + 9, SUB.caverna[1] + 4, 3, 6, '#8a5a2b');

	// Mundo dos Sonhos (dimensão) no mar SE, ligado à Cidade Amaldiçoada
	{
		const x0 = 26, y0 = 292, w = 172, h = 60;
		s += r(x0, y0, w, h, '#2a1b55', `rx="6" stroke="#ff7ad9" stroke-width="1.6" stroke-dasharray="4 2.5"`) + r(x0 + 2, y0 + 2, w - 4, h - 4, 'url(#skyDream)', 'rx="5" opacity=".55"');
		const rr6 = rng(33);
		for (let i = 0; i < 20; i++) s += c(x0 + 6 + rr6() * (w - 12), y0 + 5 + rr6() * (h - 10), 0.6 + rr6() * 0.9, '#fff', `opacity="${0.4 + rr6() * 0.5}"`);
		for (const [dx, dy, rw] of [[34, 42, 18], [86, 30, 20], [138, 44, 18]]) s += el(x0 + dx, y0 + dy, rw, 4, '#8ed9a8') + pth(`M ${x0 + dx - rw} ${y0 + dy} Q ${x0 + dx} ${y0 + dy + 12} ${x0 + dx + rw} ${y0 + dy} Z`, '#6b4a8a');
		s += el(x0 + 86, y0 + 24, 8, 4.5, '#8fb8ff') + c(x0 + 82, y0 + 20, 3, '#8fb8ff') + T(x0 + 97, y0 + 20, 'z', { size: 6, weight: 800, fill: '#fff', halo: false }) + c(x0 + 154, y0 + 14, 6, '#fde68a') + c(x0 + 151, y0 + 12, 5.4, '#2a1b55', 'opacity=".9"');
		s += pth(`M ${mx - 46} ${my - 10} Q ${mx - 60} ${y0 + 30} ${x0 + w + 2} ${y0 + 30}`, 'none', 'stroke="#ff7ad9" stroke-width="1.4" stroke-dasharray="3 3" marker-end="url(#arrowW)"');
	}
	// grade
	let gl = '';
	for (let x = 50; x < WW; x += 50) gl += `M ${x} 0 V ${WH} `;
	for (let y = 50; y < WH; y += 50) gl += `M 0 ${y} H ${WW} `;
	s += pth(gl, 'none', 'stroke="#ffffff" stroke-width=".5" opacity=".08"');
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
	s += regLabel('vila', X(70), Y(548));
	s += regLabel('farol', X(360), Y(650));
	s += regLabel('capsule', X(486), Y(648));
	s += regLabel('dunas', X(790), Y(630));
	s += regLabel('glicinias', X(700), Y(256));
	s += regLabel('aurea', X(538), Y(62));
	s += regLabel('portoes', X(330), Y(238));
	s += regLabel('astral', X(70), Y(222));
	s += regLabel('amald', X(214), Y(412));
	s += regLabel('liga', X(520), Y(410));
	const small = (x, y, t, o = {}) => (s += T(X(x), Y(y), t, { size: 10.5, weight: 700, anchor: 'middle', ...o }));
	small(206, 614, 'Lago Espelhado'); small(432, 592, 'Floresta das Lanternas'); small(668, 538, 'Círculo de Pedra'); small(760, 620, 'Oásis'); small(800, 500, 'DESERTO DE VIDRO', { size: 11, fill: '#5a3d1e', halo: false, ls: 1.5 });
	small(938, 452, 'Penhasco dos Cata-ventos'); small(906, 330, 'MONTE NEVADO', { size: 11, fill: '#334155', halo: false, ls: 1.5 }); small(838, 170, 'Vulcão Adormecido'); small(690, 66, 'Costa de Pedra'); small(344, 92, 'Masmorra Dupla'); small(446, 374, 'Caminho da Vitória (caverna)');
	small(330, 708, 'Ilha do Navio'); small(262, 136, 'Expresso Astral (R12)'); small(566, 304, 'SERRA DO MEIO', { size: 11, fill: '#efe6da', ls: 2 });
	small(112, 366, 'MUNDO DOS SONHOS', { size: 11, fill: '#ffd0f0', ls: 1 }); small(112, 378, 'dimensão · entra dormindo na Cidade Amaldiçoada', { size: 8.5, fill: '#ffd0f0' });
	small(846, 540, 'vila de areia', { size: 9.5 }); small(268, 318, 'escola · cruzamento · cúpula', { size: 9.5 }); small(384, 150, 'portões azuis', { size: 9.5 }); small(132, 196, 'ilha flutuante', { size: 9.5 }); small(590, 150, 'praça da seta', { size: 9.5 });
	// números das rotas
	for (const [n, pts] of ROUTES) { const a = pts[0], b = pts[pts.length - 1], mid = pts.length === 3 ? pts[1] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; s += c(X(mid[0]), Y(mid[1]), 11, '#fff7d6', `stroke="${C.navy}" stroke-width="1.6"`) + T(X(mid[0]), Y(mid[1]) + 4, 'R' + n, { size: 10, weight: 800, anchor: 'middle', fill: C.navy, halo: false }); }
	s += c(X(220), Y(150), 11, '#fff7d6', `stroke="${C.navy}" stroke-width="1.6"`) + T(X(220), Y(150) + 4, 'R12', { size: 10, weight: 800, anchor: 'middle', fill: C.navy, halo: false });
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
	s += avatar(286, 150, 0.9, '#f97316', '#3f3f46', { hat: 'miner' }) + T(286, 22, 'MONTE NEVADO', { size: 10, weight: 800, anchor: 'middle', fill: '#1f2937', halo: false, ls: 1 });
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
	[2, 'agua', 'CIDADE FAROL', 'One Piece · ginásio 1 · Maré', vPorto, ['Porto com farol, taverna e navios. Balsa', 'opcional pra Ilha do Navio (naufrágio com', 'tesouro). Fighter de referência: Luffy.']],
	[3, 'martial', 'CAPSULE CITY', 'Dragon Ball · ginásio 2 · Arena', vCapsule, ['Cidade 3: domos da Capsule Corp., carros-', 'cápsula e o ringue do torneio no centro.', 'Chega pela Floresta das Lanternas (R3–R4).']],
	[4, 'vento', 'CIDADE DAS DUNAS', 'Naruto · ginásio 3 · Brisa', vDunas, ['Vila da Areia no Deserto de Vidro: casas de', 'barro, oásis e tempestades de areia na R6.', 'Fighter de referência: Gaara.']],
	[5, 'fogo', 'VILA DAS GLICÍNIAS', 'Demon Slayer · ginásio 4 · Brasa', vVulcao, ['Vem do Penhasco e do Monte Nevado (R7–R9)', 'até o pé do Vulcão Adormecido, com glicínias', 'e espadachins. Fighter de referência: Tanjiro.']],
	[6, 'terra', 'CIDADE ÁUREA', 'JoJo · ginásio 5 · Rocha', vAurea, ['Cidade costeira de casas coloridas sobre a', 'Costa de Pedra, praça da seta e Stands.', 'Fighter de referência: Giorno.']],
	[7, 'sombra', 'CIDADE DOS PORTÕES', 'Solo Leveling · ginásio 6 · Penumbra', vPortoes, ['Metrópole com portões azuis que abrem', 'masmorras; a Masmorra Dupla fica ao norte.', 'Fighter: Sung Jin-Woo (já está no jogo).']],
	[8, 'raio', 'ESTAÇÃO ASTRAL', 'Star Rail · ginásio 7 · Trovão', vAstral, ['Ilha flutuante no mar do noroeste, só se', 'chega pelo Expresso Astral (R12, trem sobre', 'o mar). Fighter de referência: Trailblazer.']],
	[9, 'onirico', 'CIDADE AMALDIÇOADA', 'Jujutsu Kaisen · ginásio 8 · Sonho', vTemplo, ['Escola de feiticeiros, cruzamento e a cúpula', 'da Expansão de Domínio. Dormindo aqui, abre', 'o Mundo dos Sonhos. Fighter: Gojo (no jogo).']],
	[10, 'martial', 'LIGA DOS VANGUARDAS', 'final · Serra do Meio', vCapital, ['Torre dos Vanguardas no centro do continente,', 'cercada pela serra. Só entra com 8 insígnias,', 'pela caverna do Caminho da Vitória (R14).']],
	[11, 'terra', 'SUB-LUGARES DAS ROTAS', 'floresta · caverna · neve', vRotas, ['Entre uma cidade e outra sempre tem um lugar', 'com Ecos próprios: Floresta das Lanternas,', 'Caminho da Vitória, Monte Nevado, deserto.']],
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
		[2, 'Cidade Farol (1)', 'One Piece', 'porto, praia, ilha', 'agua', 'Maré', 'Luffy'],
		[3, 'Capsule City (2)', 'Dragon Ball', 'cidade tech, após a floresta', 'martial', 'Arena', 'Goku'],
		[4, 'Cidade das Dunas (3)', 'Naruto', 'deserto, oásis', 'vento', 'Brisa', 'Gaara'],
		[5, 'Vila das Glicínias (4)', 'Demon Slayer', 'neve → vulcão', 'fogo', 'Brasa', 'Tanjiro'],
		[6, 'Cidade Áurea (5)', 'JoJo', 'costa de pedra, casas coloridas', 'terra', 'Rocha', 'Giorno'],
		[7, 'Cidade dos Portões (6)', 'Solo Leveling ✓', 'metrópole, masmorras', 'sombra', 'Penumbra', 'Sung Jin-Woo ✓'],
		[8, 'Estação Astral (7)', 'Star Rail', 'ilha flutuante, trem no mar', 'raio', 'Trovão', 'Trailblazer'],
		[9, 'Cidade Amaldiçoada (8)', 'Jujutsu Kaisen ✓', 'cidade noturna, templo', 'onirico', 'Sonho', 'Gojo Satoru ✓'],
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
	const stops = [['Vila Verdejante', 'normal', 1, 'R1 · R2'], ['Cidade Farol', 'agua', 2, 'R3 · Floresta · R4'], ['Capsule City', 'martial', 3, 'R5 · Círculo · R6 deserto'], ['Cidade das Dunas', 'vento', 4, 'R7 · Penhasco · R8 · Neve · R9'], ['Vila das Glicínias', 'fogo', 5, 'R10 · Costa de Pedra'], ['Cidade Áurea', 'terra', 6, 'R11'], ['Cidade dos Portões', 'sombra', 7, 'R12 trem (ida e volta)'], ['Estação Astral', 'raio', 8, 'R13'], ['Cidade Amaldiçoada', 'onirico', 9, 'R14 · Caverna'], ['Liga dos Vanguardas', 'martial', 10, '']];
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
