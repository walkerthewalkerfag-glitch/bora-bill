--!nocheck
-- Roblox renderer: one GuiObject per visual node, placed from the node's world matrix
-- (centre + size + rotation, AnchorPoint 0.5). Same geometry the web renderer writes as CSS matrices.
local PVCore = require(script.Parent.PVCore)

local PVRender = {}
PVRender.__index = PVRender

local FONTS = {
	oswald = "rbxasset://fonts/families/Oswald.json",
	roboto = "rbxasset://fonts/families/RobotoCondensed.json",
}
local WEIGHTS = { [500] = Enum.FontWeight.Medium, [600] = Enum.FontWeight.SemiBold, [700] = Enum.FontWeight.Bold }
local XA = { l = Enum.TextXAlignment.Left, c = Enum.TextXAlignment.Center, r = Enum.TextXAlignment.Right }
local YA = { t = Enum.TextYAlignment.Top, c = Enum.TextYAlignment.Center, b = Enum.TextYAlignment.Bottom }

local function rgb(c, t)
	return Color3.fromRGB(math.clamp(math.floor(c[1] * t + 0.5), 0, 255), math.clamp(math.floor(c[2] * t + 0.5), 0, 255), math.clamp(math.floor(c[3] * t + 0.5), 0, 255))
end

local function numSeq(stops)
	local kp = {}
	local last = -1
	for _, s in ipairs(stops) do
		local t = math.clamp(s[1], 0, 1)
		if t <= last then
			t = math.min(1, last + 1e-4)
		end
		if #kp > 0 and t >= 1 and s ~= stops[#stops] then
			continue
		end
		table.insert(kp, NumberSequenceKeypoint.new(t, math.clamp(s[2], 0, 1)))
		last = t
	end
	if kp[1].Time > 0 then
		table.insert(kp, 1, NumberSequenceKeypoint.new(0, kp[1].Value))
	end
	if kp[#kp].Time < 1 then
		table.insert(kp, NumberSequenceKeypoint.new(1, kp[#kp].Value))
	end
	return NumberSequence.new(kp)
end

local function colSeq(stops)
	local kp = {}
	for _, s in ipairs(stops) do
		table.insert(kp, ColorSequenceKeypoint.new(math.clamp(s[1], 0, 1), rgb(s[2], 1)))
	end
	return ColorSequence.new(kp)
end

function PVRender.new(core, stage, images)
	local self = setmetatable({}, PVRender)
	self.core = core
	self.stage = stage
	self.inst = {}
	self.grad = {}
	self.corner = {}
	self.tscale = {}
	self.clipOf = {}
	self.last = {}
	local nodes = core.nodes
	local zc = {}
	local function z(container)
		zc[container] = (zc[container] or 0) + 1
		return zc[container]
	end
	for _, i in ipairs(core.order) do
		local n = nodes[i]
		local c = 0
		local p = n.pi
		while p > 0 do
			if nodes[p].k == "c" then
				c = p
				break
			end
			p = nodes[p].pi
		end
		self.clipOf[i] = c
		if n.k == "g" or n.k == "h" then
			continue
		end
		local parent = c > 0 and self.inst[c] or stage
		local o
		if n.k == "i" or n.k == "b" then
			o = Instance.new("ImageLabel")
			o.BackgroundTransparency = 1
			local A = core.assets[n.img]
			o.Image = images[A.file] or ""
			if n.tile then
				o.ScaleType = Enum.ScaleType.Tile
				o.TileSize = UDim2.fromOffset(n.tile, n.tile)
			elseif n.k == "i" then
				o.ImageRectOffset = Vector2.new(A.x, A.y)
				o.ImageRectSize = Vector2.new(A.w, A.h)
			end
			o.ImageColor3 = n.tc and rgb(n.tc, 1) or Color3.new(1, 1, 1)
		elseif n.k == "r" then
			o = Instance.new("Frame")
			o.BackgroundColor3 = rgb(n.col, 1)
			if n.rad then
				local uc = Instance.new("UICorner")
				uc.Parent = o
				self.corner[i] = uc
			end
		elseif n.k == "t" then
			o = Instance.new("TextLabel")
			o.BackgroundTransparency = 1
			local t = n.txt
			o.FontFace = Font.new(FONTS[t.f], WEIGHTS[t.wt] or Enum.FontWeight.Regular, Enum.FontStyle.Normal)
			o.TextSize = t.sz
			o.TextColor3 = rgb(t.col, 1)
			o.TextXAlignment = XA[t.ax] or Enum.TextXAlignment.Left
			o.TextYAlignment = YA[t.ay] or Enum.TextYAlignment.Center
			o.TextWrapped = false
			o.RichText = false
			o.Text = t.s or ""
			local us = Instance.new("UIScale")
			us.Parent = o
			self.tscale[i] = us
		elseif n.k == "c" then
			o = Instance.new("Frame")
			o.BackgroundTransparency = 1
			o.ClipsDescendants = true
		end
		o.Name = n.id
		o.BorderSizePixel = 0
		o.AnchorPoint = n.k == "c" and Vector2.zero or Vector2.new(0.5, 0.5)
		o.ZIndex = z(parent)
		o.Visible = false
		if n.grad or n.fade then
			local g = Instance.new("UIGradient")
			if n.fade then
				g.Rotation = 90
			else
				g.Rotation = n.grad.r or 0
				if n.grad.t then
					g.Transparency = numSeq(n.grad.t)
				end
				if n.grad.c then
					g.Color = colSeq(n.grad.c)
				end
			end
			g.Parent = o
			self.grad[i] = g
		end
		if n.k == "r" and n.grad and n.grad.c then
			o.BackgroundColor3 = Color3.new(1, 1, 1)
		end
		o.Parent = parent
		self.inst[i] = o
		self.last[i] = {}
	end
	return self
end

-- every GuiObject that shows an image (for ContentProvider:PreloadAsync)
function PVRender:instances()
	local out = {}
	for _, o in pairs(self.inst) do
		table.insert(out, o)
	end
	return out
end

local function near(a, b, eps)
	return a ~= nil and math.abs(a - b) <= eps
end

function PVRender:update(binds)
	local core = self.core
	local nodes, world, val = core.nodes, core.world, core.val
	for _, i in ipairs(core.order) do
		local o = self.inst[i]
		if not o then
			continue
		end
		local n = nodes[i]
		local w = world[i]
		local L = self.last[i]
		if n.k == "b" then
			local b = w.vis and core:band(i) or nil
			if not b or b.op <= 0.001 then
				if L.vis ~= false then
					o.Visible = false
					L.vis = false
				end
				continue
			end
			if L.vis ~= true then
				o.Visible = true
				L.vis = true
			end
			o.ImageRectOffset = Vector2.new(b.rx, b.ry)
			o.ImageRectSize = Vector2.new(b.rw, b.rh)
			o.Position = UDim2.fromOffset(b.cx, b.cy)
			o.Size = UDim2.fromOffset(b.w, b.h)
			o.Rotation = b.rot
			o.ImageTransparency = 1 - b.op
			o.ImageColor3 = Color3.new(b.tint, b.tint, b.tint)
			continue
		end
		local op = w.op
		if n.k == "r" then
			op *= (n.a or 1)
		end
		if not w.vis or op <= 0.001 then
			if L.vis ~= false then
				o.Visible = false
				L.vis = false
			end
			continue
		end
		if L.vis ~= true then
			o.Visible = true
			L.vis = true
		end
		local m = w.m
		local ox, oy = 0, 0
		local c = self.clipOf[i]
		if c > 0 then
			local cm = world[c].m
			ox, oy = cm[5], cm[6]
		end
		if n.k == "c" then
			local sx = math.sqrt(m[1] * m[1] + m[2] * m[2])
			local sy = math.sqrt(m[3] * m[3] + m[4] * m[4])
			local px, py, pw, ph = m[5] - ox, m[6] - oy, n.w * sx, n.h * sy
			if not (near(L.px, px, 1e-3) and near(L.py, py, 1e-3) and near(L.pw, pw, 1e-3) and near(L.ph, ph, 1e-3)) then
				o.Position = UDim2.fromOffset(px, py)
				o.Size = UDim2.fromOffset(pw, ph)
				L.px, L.py, L.pw, L.ph = px, py, pw, ph
			end
			continue
		end
		local cx, cy, bw, bh, rot, sx, sy = PVCore.box(m, n.w, n.h)
		cx -= ox
		cy -= oy
		if not (near(L.px, cx, 1e-3) and near(L.py, cy, 1e-3)) then
			o.Position = UDim2.fromOffset(cx, cy)
			L.px, L.py = cx, cy
		end
		if n.k == "t" then
			if not (near(L.pw, n.w, 0) and near(L.ph, n.h, 0)) then
				o.Size = UDim2.fromOffset(n.w, n.h)
				L.pw, L.ph = n.w, n.h
			end
			local sc = (sx + sy) / 2
			if not near(L.sc, sc, 1e-4) then
				self.tscale[i].Scale = sc
				L.sc = sc
			end
		elseif not (near(L.pw, bw, 1e-3) and near(L.ph, bh, 1e-3)) then
			o.Size = UDim2.fromOffset(bw, bh)
			L.pw, L.ph = bw, bh
		end
		if not near(L.rot, rot, 1e-3) then
			o.Rotation = rot
			L.rot = rot
		end
		local t = w.tint
		local tr = 1 - op
		if not near(L.tr, tr, 1e-4) then
			if n.k == "i" then
				o.ImageTransparency = tr
			elseif n.k == "r" then
				o.BackgroundTransparency = tr
			else
				o.TextTransparency = tr
			end
			L.tr = tr
		end
		if n.k == "t" then
			local col = n.txt.col
			if n.txt.cbind and binds[n.txt.cbind] then
				col = binds[n.txt.cbind]
			end
			local key = col[1] * 65536 + col[2] * 256 + col[3] + t
			if L.col ~= key then
				o.TextColor3 = rgb(col, t)
				L.col = key
			end
			if n.txt.bind then
				local s = binds[n.txt.bind]
				s = s == nil and "" or tostring(s)
				if L.text ~= s then
					o.Text = s
					L.text = s
				end
			end
		elseif not near(L.tint, t, 1e-4) then
			if n.k == "i" then
				o.ImageColor3 = n.tc and rgb(n.tc, t) or Color3.new(t, t, t)
			elseif n.grad and n.grad.c then
				o.BackgroundColor3 = Color3.new(t, t, t)
			else
				o.BackgroundColor3 = rgb(n.col, t)
			end
			L.tint = t
		end
		if self.corner[i] then
			local r = n.rad * sy
			if not near(L.rad, r, 1e-3) then
				self.corner[i].CornerRadius = UDim.new(0, r)
				L.rad = r
			end
		end
		local g = self.grad[i]
		if g then
			if n.fade then
				local stops = core:fadeStops(i)
				local key = table.concat({ stops[1][2], stops[#stops][2], #stops, stops[2][1] }, ",")
				if L.fade ~= key then
					g.Transparency = numSeq(stops)
					L.fade = key
				end
			else
				local v = val[i]
				local gx, gy = v[9], v[10]
				if not (near(L.gx, gx, 1e-4) and near(L.gy, gy, 1e-4)) then
					g.Offset = Vector2.new(gx, gy)
					L.gx, L.gy = gx, gy
				end
			end
		end
	end
end

return PVRender
