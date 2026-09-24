--!nocheck
-- Pocket Vanguards intro: platform-free core (mirror of web/core.js).
-- CSS-animation semantics: delay, duration, fill, iterations, per-property keyframes with per-segment
-- cubic-bezier; later tracks override earlier ones; controller springs/tweens override tracks.

local PVCore = {}
PVCore.__index = PVCore

PVCore.PROPS = { "tx", "ty", "rot", "sx", "sy", "op", "vis", "tint", "gx", "gy", "bw" }
PVCore.K = { tx = 1, ty = 2, rot = 3, sx = 4, sy = 5, op = 6, vis = 7, tint = 8, gx = 9, gy = 10, bw = 11 }
local DEF = { 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0 }
local NP = 11
local VIS = 7

local function bezier(e)
	if type(e[1]) == "string" then
		if e[1] == "steps" then
			local n = e[2]
			return function(x)
				if x >= 1 then
					return 1
				end
				return math.floor(x * n) / n
			end
		end
		return function(x)
			return x >= 1 and 1 or 0
		end
	end
	local x1, y1, x2, y2 = e[1], e[2], e[3], e[4]
	if x1 == y1 and x2 == y2 then
		return function(x)
			return x
		end
	end
	local cx = 3 * x1
	local bx = 3 * (x2 - x1) - cx
	local ax = 1 - cx - bx
	local cy = 3 * y1
	local by = 3 * (y2 - y1) - cy
	local ay = 1 - cy - by
	return function(x)
		if x <= 0 then
			return 0
		end
		if x >= 1 then
			return 1
		end
		local t = x
		for _ = 1, 8 do
			local err = ((ax * t + bx) * t + cx) * t - x
			if math.abs(err) < 1e-7 then
				return ((ay * t + by) * t + cy) * t
			end
			local d = (3 * ax * t + 2 * bx) * t + cx
			if math.abs(d) < 1e-6 then
				break
			end
			t -= err / d
		end
		local lo, hi = 0, 1
		t = x
		for _ = 1, 48 do
			local v = ((ax * t + bx) * t + cx) * t
			if math.abs(v - x) < 1e-7 then
				break
			end
			if v < x then
				lo = t
			else
				hi = t
			end
			t = (lo + hi) / 2
		end
		return ((ay * t + by) * t + cy) * t
	end
end
PVCore.bezier = bezier

-- damped spring in closed form: any frame rate lands on the same curve
local function springAt(sp, t)
	local dt = math.max(0, t - sp.t0)
	local A = sp.x0 - sp.to
	local w, z = sp.w, sp.z
	if dt == 0 then
		return sp.x0, sp.v0
	end
	if z >= 1 then
		local B = sp.v0 + w * A
		local ex = math.exp(-w * dt)
		return sp.to + (A + B * dt) * ex, (B - w * (A + B * dt)) * ex
	end
	local wd = w * math.sqrt(1 - z * z)
	local B = (sp.v0 + z * w * A) / wd
	local ex = math.exp(-z * w * dt)
	local c, s = math.cos(wd * dt), math.sin(wd * dt)
	local x = A * c + B * s
	return sp.to + ex * x, ex * ((B * wd - z * w * A) * c - (A * wd + z * w * B) * s)
end
PVCore.springAt = springAt

function PVCore.new(scene, assets)
	local self = setmetatable({}, PVCore)
	self.scene = scene
	self.assets = assets
	local nodes = scene.nodes
	local N = #nodes
	self.N = N
	self.nodes = nodes
	self.ids = {}
	self.kids = {}
	self.base = {}
	for i = 1, N do
		local n = nodes[i]
		n.pi = n.p + 1 -- 1-based parent index, 0 = root
		self.ids[n.id] = i
		self.kids[i] = {}
		local b = table.clone(DEF)
		if n.b then
			for k = 1, NP do
				local v = n.b[PVCore.PROPS[k]]
				if v ~= nil then
					b[k] = v
				end
			end
		end
		self.base[i] = b
	end
	for i = 1, N do
		local p = nodes[i].pi
		if p > 0 then
			table.insert(self.kids[p], i)
		end
	end
	self.order = {}
	local function walk(i)
		table.insert(self.order, i)
		for _, c in ipairs(self.kids[i]) do
			walk(c)
		end
	end
	for i = 1, N do
		if nodes[i].pi == 0 then
			walk(i)
		end
	end
	self.rank = {}
	for r, n in ipairs(self.order) do
		self.rank[n] = r
	end
	self.tracks = {}
	for _, t in ipairs(scene.tracks) do
		local props = {}
		for name, list in pairs(t.p) do
			local k = PVCore.K[name]
			local src = table.clone(list)
			table.sort(src, function(a, b)
				return a[1] < b[1]
			end)
			local kfs = {}
			for _, r in ipairs(src) do
				table.insert(kfs, { o = r[1], v = r[2], e = bezier(r[3]) })
			end
			if kfs[1].o > 0 then
				table.insert(kfs, 1, { o = 0, v = nil, e = kfs[1].e })
			end
			if kfs[#kfs].o < 1 then
				table.insert(kfs, { o = 1, v = nil, e = kfs[#kfs].e })
			end
			table.insert(props, { k = k, kfs = kfs })
		end
		table.insert(self.tracks, { n = t.n + 1, c = t.c, d = t.d, u = t.u, f = t.f, it = t.it, tag = t.tag or "", props = props })
	end
	self.val = {}
	self.world = {}
	self.dyn = {}
	self.add = {}
	for i = 1, N do
		self.val[i] = table.create(NP, 0)
		self.world[i] = { m = { 1, 0, 0, 1, 0, 0 }, op = 1, tint = 1, vis = true }
	end
	self.skipTags = {}
	self.phase = "gate"
	self.clocks = { gate = 0, intro = nil, cut = nil }
	return self
end

function PVCore:id(name)
	local i = self.ids[name]
	if not i then
		error("no node " .. tostring(name))
	end
	return i
end

local function progress(tr, t)
	local l = t - tr.d
	if l < 0 then
		return (bit32.band(tr.f, 2) ~= 0) and 0 or -1
	end
	if tr.it > 0 and l >= tr.u * tr.it then
		return (bit32.band(tr.f, 1) ~= 0) and 1 or -1
	end
	if tr.u <= 0 then
		return 1
	end
	return (l % tr.u) / tr.u
end
PVCore.progress = progress

local function evalKfs(kfs, p, under, discrete)
	local n = #kfs
	if p >= kfs[n].o then
		local v = kfs[n].v
		if v == nil then
			return under
		end
		return v
	end
	local i = 1
	while i < n - 1 and p >= kfs[i + 1].o do
		i += 1
	end
	local a, b = kfs[i], kfs[i + 1]
	local va = a.v
	if va == nil then
		va = under
	end
	if discrete then
		return va
	end
	local vb = b.v
	if vb == nil then
		vb = under
	end
	local span = b.o - a.o
	if span <= 0 then
		return vb
	end
	return va + (vb - va) * a.e((p - a.o) / span)
end
PVCore.evalKfs = evalKfs

-- ---------------------------------------------------------------- dynamic layer
function PVCore:slotValue(sl, now)
	if sl.kind == 0 then
		return (springAt(sl, now))
	elseif sl.kind == 1 then
		local u = sl.dur > 0 and (now - sl.t0) / sl.dur or 1
		if u <= 0 then
			return sl.from
		end
		if u >= 1 then
			return sl.to
		end
		return sl.from + (sl.to - sl.from) * sl.e(u)
	end
	return sl.to
end

function PVCore:slot(n)
	local d = self.dyn[n]
	if not d then
		d = {}
		self.dyn[n] = d
	end
	return d
end

function PVCore:spring(n, k, to, sp, now)
	local d = self:slot(n)
	local cur = d[k]
	local w = 2 * math.pi * sp[1]
	if cur and cur.kind == 0 and cur.to == to and cur.w == w and cur.z == sp[2] then
		return
	end
	local x0, v0 = nil, 0
	if cur and cur.kind == 0 then
		x0, v0 = springAt(cur, now)
	elseif cur then
		x0 = self:slotValue(cur, now)
	else
		x0 = self.val[n][k]
	end
	d[k] = { kind = 0, x0 = x0, v0 = v0, to = to, t0 = now, w = w, z = sp[2] }
end

function PVCore:snap(n, k, v, now)
	self:slot(n)[k] = { kind = 0, x0 = v, v0 = 0, to = v, t0 = now, w = 1, z = 1 }
end

function PVCore:tween(n, k, to, tw, now, delay, from)
	local d = self:slot(n)
	local f = from
	if f == nil then
		if d[k] then
			f = self:slotValue(d[k], now)
		else
			f = self.val[n][k]
		end
	end
	d[k] = { kind = 1, from = f, to = to, t0 = now + (delay or 0), dur = tw[1], e = bezier(tw[2]) }
end

function PVCore:set(n, k, v)
	self:slot(n)[k] = { kind = 2, to = v }
end

function PVCore:addKfs(n, k, vals, tw, now)
	local a = self.add[n]
	if not a then
		a = {}
		self.add[n] = a
	end
	a[k] = { vals = vals, t0 = now, dur = tw[1], e = bezier(tw[2]) }
end

function PVCore:clearDyn()
	table.clear(self.dyn)
	table.clear(self.add)
end

-- ---------------------------------------------------------------- evaluation
function PVCore:evaluate(now)
	local N = self.N
	local val, base = self.val, self.base
	for i = 1, N do
		local v, b = val[i], base[i]
		for k = 1, NP do
			v[k] = b[k]
		end
	end
	local clocks, skip = self.clocks, self.skipTags
	for _, tr in ipairs(self.tracks) do
		local c0 = clocks[tr.c]
		if c0 ~= nil and not (tr.tag ~= "" and skip[tr.tag]) then
			local p = progress(tr, now - c0)
			if p >= 0 then
				local v = val[tr.n]
				for _, pr in ipairs(tr.props) do
					v[pr.k] = evalKfs(pr.kfs, p, v[pr.k], pr.k == VIS)
				end
			end
		end
	end
	for i, d in pairs(self.dyn) do
		local v = val[i]
		for k, sl in pairs(d) do
			v[k] = self:slotValue(sl, now)
		end
	end
	for i, a in pairs(self.add) do
		local v = val[i]
		for k, s in pairs(a) do
			local vals = s.vals
			local m = #vals - 1
			local u = s.dur > 0 and (now - s.t0) / s.dur or 1
			if u >= 1 then
				a[k] = nil
			elseif u >= 0 then
				local x = u * m
				local j = math.min(m - 1, math.floor(x))
				v[k] += vals[j + 1] + (vals[j + 2] - vals[j + 1]) * s.e(x - j)
			end
		end
	end
	local nodes, world, phase = self.nodes, self.world, self.phase
	for i = 1, N do
		local n, v, w = nodes[i], val[i], world[i]
		local r = v[3] * math.pi / 180
		local cs, sn = math.cos(r), math.sin(r)
		local a, b, c, d = cs * v[4], sn * v[4], -sn * v[5], cs * v[5]
		local e = n.x + n.ox + v[1] - a * n.ox - c * n.oy
		local f = n.y + n.oy + v[2] - b * n.ox - d * n.oy
		local vis = v[VIS] >= 0.5
		if n.app then
			vis = vis and phase == n.id
		end
		local m = w.m
		if n.pi == 0 then
			m[1], m[2], m[3], m[4], m[5], m[6] = a, b, c, d, e, f
			w.op, w.tint, w.vis = v[6], v[8], vis
		else
			local pw = world[n.pi]
			local P = pw.m
			m[1] = P[1] * a + P[3] * b
			m[2] = P[2] * a + P[4] * b
			m[3] = P[1] * c + P[3] * d
			m[4] = P[2] * c + P[4] * d
			m[5] = P[1] * e + P[3] * f + P[5]
			m[6] = P[2] * e + P[4] * f + P[6]
			w.op = pw.op * v[6]
			w.tint = pw.tint * v[8]
			w.vis = pw.vis and vis
		end
	end
end

-- centre, size, rotation (degrees) of an element of local size w x h under world matrix m
function PVCore.box(m, w, h)
	local sx = math.sqrt(m[1] * m[1] + m[2] * m[2])
	local rot = math.atan2(m[2], m[1])
	local sy
	if sx > 1e-9 then
		sy = (m[1] * m[4] - m[2] * m[3]) / sx
	else
		sy = math.sqrt(m[3] * m[3] + m[4] * m[4])
	end
	return m[1] * w / 2 + m[3] * h / 2 + m[5], m[2] * w / 2 + m[4] * h / 2 + m[6], w * sx, h * sy, rot * 180 / math.pi, sx, sy
end

-- band: a rotated strip that shows the ref node's image, cropped from a copy pre-rotated by -ang
function PVCore:band(i)
	local n = self.nodes[i]
	local ref = self:id(n.ref)
	local rn = self.nodes[ref]
	local M = self.world[ref].m
	local k = math.sqrt(M[1] * M[1] + M[2] * M[2])
	local hw = self.val[i][11]
	local A = self.assets[n.img]
	local cw = A.content and A.content.w or rn.w
	local ch = A.content and A.content.h or rn.h
	local ang = n.ang * math.pi / 180
	local ca, sa = math.cos(ang), math.sin(ang)
	local ux, uy = (n.cx - M[5]) / k, (n.cy - M[6]) / k
	local dx, dy = ux - rn.w / 2, uy - rn.h / 2
	local qy = ch / 2 + (-sa * dx + ca * dy)
	local y0 = math.max(0, qy - hw / k)
	local y1 = math.min(ch, qy + hw / k)
	if y1 <= y0 then
		return nil
	end
	local ox, oy = 0, (y0 + y1) / 2 - ch / 2
	local lx = rn.w / 2 + (ca * ox - sa * oy)
	local ly = rn.h / 2 + (sa * ox + ca * oy)
	local s = A.w / cw
	return {
		cx = M[5] + k * lx,
		cy = M[6] + k * ly,
		w = cw * k,
		h = (y1 - y0) * k,
		rot = n.ang,
		rx = A.x,
		ry = A.y + y0 * s,
		rw = A.w,
		rh = (y1 - y0) * s,
		op = self.world[ref].op * self.world[i].op,
		tint = self.world[ref].tint * self.world[i].tint,
	}
end

-- transparency keypoints {{pos, t}, ...} of the reflection fade (screen-space band y0..y1)
function PVCore:fadeStops(i)
	local n = self.nodes[i]
	local m = self.world[i].m
	local top, hgt = m[6], n.h * m[4]
	local y0, y1 = n.fade.y0, n.fade.y1
	local function at(y)
		return math.clamp((y - y0) / (y1 - y0), 0, 1)
	end
	local pts = { { 0, at(top) } }
	for _, y in ipairs({ y0, y1 }) do
		local u = (y - top) / hgt
		if u > 0.001 and u < 0.999 then
			table.insert(pts, { u, at(y) })
		end
	end
	table.insert(pts, { 1, at(top + hgt) })
	table.sort(pts, function(a, b)
		return a[1] < b[1]
	end)
	return pts
end

return PVCore
