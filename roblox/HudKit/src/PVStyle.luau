--!nonstrict
-- PVStyle: the Carmesim look built from GuiObjects (Roblox has no clip-path, so slanted shapes are a
-- centre rectangle + triangle sprites). Every screen of the HUD kit is made only from these pieces.
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")
local Config = require(script.Parent:WaitForChild("PVHudConfig"))

local S = {}
S.Config = Config
local A = Config.Images

S.C = {
	red = Color3.fromRGB(227, 24, 47), red2 = Color3.fromRGB(255, 48, 72), deep = Color3.fromRGB(122, 9, 23),
	gold = Color3.fromRGB(226, 207, 142), gold2 = Color3.fromRGB(245, 197, 66),
	ink = Color3.fromRGB(12, 10, 11), ink2 = Color3.fromRGB(26, 19, 22), ink3 = Color3.fromRGB(36, 27, 31), line = Color3.fromRGB(58, 47, 51),
	bone = Color3.fromRGB(246, 241, 234), dim = Color3.fromRGB(165, 156, 148), mute = Color3.fromRGB(111, 103, 96), ok = Color3.fromRGB(69, 212, 131),
}
S.TYPES = {
	martial = { "Martial", Color3.fromRGB(160, 102, 255) }, sombra = { "Sombra", Color3.fromRGB(122, 134, 201) }, fogo = { "Fogo", Color3.fromRGB(255, 106, 43) },
	raio = { "Raio", Color3.fromRGB(242, 194, 48) }, agua = { "Água", Color3.fromRGB(45, 155, 240) }, vento = { "Vento", Color3.fromRGB(63, 207, 154) },
	terra = { "Terra", Color3.fromRGB(192, 138, 74) }, onirico = { "Onírico", Color3.fromRGB(255, 122, 217) }, normal = { "Normal", Color3.fromRGB(179, 172, 164) },
}
S.DISPLAY = Config.DisplayFont
S.BODY = Font.new("rbxasset://fonts/families/RobotoCondensed.json", Enum.FontWeight.Medium)
S.BODYB = Font.new("rbxasset://fonts/families/RobotoCondensed.json", Enum.FontWeight.Bold)

S.EASE_OUT = TweenInfo.new(0.24, Enum.EasingStyle.Quint, Enum.EasingDirection.Out)
S.SNAP = TweenInfo.new(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
S.POP = TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
S.SLOW = TweenInfo.new(0.42, Enum.EasingStyle.Quint, Enum.EasingDirection.Out)
S.FOCUS = TweenInfo.new(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

local ICONS = {
	i_fighters = { 8, 8 },
	i_ecodex = { 104, 8 },
	i_bag = { 200, 8 },
	i_profile = { 296, 8 },
	i_settings = { 392, 8 },
	i_quest = { 488, 8 },
	i_map = { 584, 8 },
	i_capture = { 680, 8 },
	i_phone = { 8, 104 },
	i_fight = { 104, 104 },
	i_run = { 200, 104 },
	i_audio = { 296, 104 },
	i_video = { 392, 104 },
	i_controls = { 488, 104 },
	i_access = { 584, 104 },
	i_lang = { 680, 104 },
	i_account = { 8, 200 },
	t_martial = { 104, 200 },
	t_sombra = { 200, 200 },
	t_fogo = { 296, 200 },
	t_raio = { 392, 200 },
	t_agua = { 488, 200 },
	t_vento = { 584, 200 },
	t_terra = { 680, 200 },
	t_onirico = { 8, 296 },
	t_normal = { 104, 296 },
	c_fisico = { 200, 296 },
	c_especial = { 296, 296 },
	c_status = { 392, 296 },
	lock = { 488, 296 },
	check = { 584, 296 },
	arrow = { 680, 296 },
	play = { 8, 392 },
	star = { 104, 392 },
	x = { 200, 392 },
	search = { 296, 392 },
	eye = { 392, 392 },
	talent = { 488, 392 },
	item = { 584, 392 },
	statusic = { 680, 392 },
	passive = { 8, 488 }
}
S.ICONS = ICONS

-- string.upper only knows ASCII; this also uppercases the Portuguese accents (á -> Á, ç -> Ç...)
local ACCENTS = { ["á"] = "Á", ["à"] = "À", ["â"] = "Â", ["ã"] = "Ã", ["é"] = "É", ["ê"] = "Ê", ["í"] = "Í", ["ó"] = "Ó", ["ô"] = "Ô", ["õ"] = "Õ", ["ú"] = "Ú", ["ü"] = "Ü", ["ç"] = "Ç", ["ñ"] = "Ñ" }
function S.upper(str)
	return (string.gsub(string.upper(str), "[\xC3][\x80-\xBF]", ACCENTS))
end

-- ------------------------------------------------------------------ basics
function S.new(class, props, children)
	local o = Instance.new(class)
	for k, v in pairs(props) do
		if k ~= "Parent" then
			o[k] = v
		end
	end
	for _, c in ipairs(children or {}) do
		c.Parent = o
	end
	if props.Parent then
		o.Parent = props.Parent
	end
	return o
end
local new = S.new

function S.tween(o, info, goal)
	if Config.ReducedMotion then
		for k, v in pairs(goal) do
			o[k] = v
		end
		return nil
	end
	local t = TweenService:Create(o, info, goal)
	t:Play()
	return t
end

function S.box(parent, x, y, w, h, z, name)
	return new("Frame", { Name = name or "Box", Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, ZIndex = z or 1, Parent = parent })
end

function S.rect(parent, x, y, w, h, color, z, tr)
	return new("Frame", { Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundColor3 = color, BackgroundTransparency = tr or 0, BorderSizePixel = 0, ZIndex = z or 1, Parent = parent })
end

-- triangle sprite, named by the filled corner: LL lower-left, LR lower-right, UL upper-left, UR upper-right
local TRI = { LL = Vector2.new(0, 0), LR = Vector2.new(256, 0), UL = Vector2.new(0, 256), UR = Vector2.new(256, 256) }
function S.tri(parent, kind, x, y, w, h, color, z, tr)
	return new("ImageLabel", {
		Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, Image = A.tris,
		ImageRectOffset = TRI[kind], ImageRectSize = Vector2.new(256, 256), ImageColor3 = color, ImageTransparency = tr or 0, ZIndex = z or 1, Parent = parent,
	})
end

function S.text(parent, x, y, w, h, str, font, size, color, props)
	local p = {
		Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, Text = str, FontFace = font, TextSize = size,
		TextColor3 = color, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Center, ZIndex = 3, Parent = parent,
	}
	for k, v in pairs(props or {}) do
		p[k] = v
	end
	return new("TextLabel", p)
end

-- big italic title with the hard black offset shadow the game uses
function S.title(parent, x, y, w, h, str, size, props)
	local p = props or {}
	local z = p.ZIndex or 4
	local sh = S.text(parent, x + 2, y + 3, w, h, str, S.DISPLAY, size, Color3.new(0, 0, 0), { ZIndex = z, TextXAlignment = p.TextXAlignment or Enum.TextXAlignment.Left, TextWrapped = p.TextWrapped or false })
	local t = S.text(parent, x, y, w, h, str, S.DISPLAY, size, p.TextColor3 or S.C.bone, { ZIndex = z + 1, TextXAlignment = p.TextXAlignment or Enum.TextXAlignment.Left, TextWrapped = p.TextWrapped or false })
	t:GetPropertyChangedSignal("Text"):Connect(function()
		sh.Text = t.Text
	end)
	t:GetPropertyChangedSignal("Rotation"):Connect(function()
		sh.Rotation = t.Rotation
	end)
	return t, sh
end

function S.icon(parent, key, x, y, size, color, z)
	local r = ICONS[key] or ICONS.i_settings
	return new("ImageLabel", {
		Name = key, Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(size, size), BackgroundTransparency = 1, Image = A.icons,
		ImageRectOffset = Vector2.new(r[1], r[2]), ImageRectSize = Vector2.new(80, 80), ImageColor3 = color or Color3.new(1, 1, 1), ZIndex = z or 3, Parent = parent,
	})
end

function S.brush(parent, kind, x, y, w, h, rot, z, tr)
	return new("ImageLabel", {
		Name = "Brush", Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, Image = A["brush_" .. kind],
		Rotation = rot or 0, ImageTransparency = tr or 0, ZIndex = z or 1, Parent = parent,
	})
end

function S.tile(parent, key, x, y, w, h, z, tr, tile)
	return new("ImageLabel", {
		Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, Image = A[key], ScaleType = Enum.ScaleType.Tile,
		TileSize = UDim2.fromOffset(tile or 300, tile or 300), ImageTransparency = tr or 0, ZIndex = z or 1, Parent = parent,
	})
end

local function fade(o, rot, from, to)
	new("UIGradient", { Rotation = rot, Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, from), NumberSequenceKeypoint.new(0.65, to), NumberSequenceKeypoint.new(1, to) }), Parent = o })
end

-- ------------------------------------------------------------------ slanted shapes
-- "para": parallelogram (top edge shifted right); "right": straight left edge, slanted right edge;
-- "left": slanted left edge, straight right edge; anything else: rectangle
function S.shape(parent, kind, x, y, w, h, s, color, z, tr)
	local g = S.box(parent, x, y, w, h, z, "Shape")
	if kind == "para" then
		S.tri(g, "LR", 0, 0, s + 1, h, color, z, tr)
		S.rect(g, s, 0, w - 2 * s, h, color, z, tr)
		S.tri(g, "UL", w - s - 1, 0, s + 1, h, color, z, tr)
	elseif kind == "right" then
		S.rect(g, 0, 0, w - s, h, color, z, tr)
		S.tri(g, "UL", w - s - 1, 0, s + 1, h, color, z, tr)
	elseif kind == "left" then
		S.tri(g, "LR", 0, 0, s + 1, h, color, z, tr)
		S.rect(g, s, 0, w - s, h, color, z, tr)
	else
		S.rect(g, 0, 0, w, h, color, z, tr)
	end
	return g
end

function S.recolor(shape, color)
	for _, p in ipairs(shape:GetChildren()) do
		if p:IsA("ImageLabel") then
			p.ImageColor3 = color
		elseif p:IsA("Frame") then
			p.BackgroundColor3 = color
		end
	end
end

-- gold-outlined dark panel with rain texture and halftone. returns the panel group and a content frame
function S.panel(parent, x, y, w, h, opts)
	opts = opts or {}
	local kind, s, z = opts.kind or "right", opts.slant or 18, opts.z or 2
	local g = S.box(parent, x, y, w, h, z, opts.name or "Panel")
	S.shape(g, kind, 0, 0, w, h, s, opts.outline or S.C.gold, z)
	S.shape(g, kind, 2, 2, w - 4, h - 4, s - 1, opts.fill or S.C.ink, z)
	local inner = S.box(g, (kind == "para" or kind == "left") and s or 2, 2, w - 2 * s, h - 4, z)
	inner.ClipsDescendants = true
	S.tile(inner, "tex_rain", 0, 0, w, h, z)
	if opts.halftone ~= false then
		local ht = S.tile(inner, "tex_halftone", 0, h * 0.55, w * 0.4, h * 0.45, z, 0.1, 64)
		fade(ht, -35, 0, 1)
	end
	local content = S.box(g, 0, 0, w, h, z + 1, "Content")
	return g, content
end

-- the big notched frame: thick red border, thin gold line, dark rain-textured inside
function S.frame(parent, x, y, w, h, z)
	z = z or 1
	local g = S.box(parent, x, y, w, h, z, "HudFrame")
	local stepX = math.floor(w * 0.44)
	local function layer(inset, color)
		local c1, st, c2 = 30 - inset * 0.5, 26, 44 - inset * 0.5
		local X, Y, W, H = inset, inset, w - 2 * inset, h - 2 * inset
		S.tri(g, "LR", X, Y, c1, c1, color, z)
		S.rect(g, X, Y + c1 - 1, c1 + 1, H - c1 + 1, color, z)
		S.rect(g, X + c1 - 1, Y, stepX - c1 - inset + 2, H, color, z)
		S.tri(g, "LL", X + stepX - inset, Y, st, st, color, z)
		S.rect(g, X + stepX - inset, Y + st - 1, st + 1, H - st + 1, color, z)
		S.rect(g, X + stepX - inset + st - 1, Y + st, W - stepX + inset - st + 1, H - st - c2 + 1, color, z)
		S.rect(g, X + stepX - inset + st - 1, Y + H - c2, W - stepX + inset - st - c2 + 2, c2, color, z)
		S.tri(g, "UL", X + W - c2, Y + H - c2, c2, c2, color, z)
	end
	layer(0, S.C.red)
	layer(7, S.C.gold)
	layer(9, Color3.fromRGB(10, 8, 9))
	local inner = S.box(g, 9, 35, w - 18, h - 44 - 35, z, "Texture")
	inner.ClipsDescendants = true
	S.tile(inner, "tex_rain", 0, 0, w, h, z)
	fade(S.tile(g, "tex_halftone", w * 0.64, 35, w * 0.34, h * 0.4, z, 0, 64), 145, 0.1, 1)
	fade(S.tile(g, "tex_halftone", 12, h * 0.62, w * 0.3, h * 0.36, z, 0, 64), -35, 0.1, 1)
	return g
end

-- black brush slab with the screen title (top-left corner)
function S.slab(parent, title, sub)
	local g = S.box(parent, -10, -6, 580, 130, 20, "Title")
	S.brush(g, "slab", 0, 0, 600, 132, -3, 20)
	local t = S.title(g, 34, 14, 520, 60, S.upper(title), 58, { ZIndex = 21 })
	t.Rotation = -3
	local s = S.text(g, 150, 78, 420, 18, S.upper(sub), S.BODY, 13, Color3.fromRGB(214, 207, 200), { ZIndex = 22, Rotation = -3 })
	return g, t, s
end

-- ------------------------------------------------------------------ buttons
-- category button (Mochila style). returns an api with .button and .setSelected(bool)
function S.catButton(parent, x, y, w, h, iconKey, label, num, z)
	z = z or 5
	local b = new("TextButton", { Name = label, Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = z, Parent = parent })
	local shapeGold = S.shape(b, "right", 0, 0, w, h, 16, S.C.gold, z)
	S.shape(b, "right", 2, 2, w - 4, h - 4, 15, S.C.ink2, z)
	local tex = S.box(b, 2, 2, w - 22, h - 4, z)
	tex.ClipsDescendants = true
	S.tile(tex, "tex_rain", 0, 0, w, h, z)
	local tint = S.rect(tex, 0, 0, w, h, S.C.red, z, 1)
	new("UIGradient", { Transparency = NumberSequence.new(0.55, 1), Parent = tint })
	local br = S.brush(b, "streak", w - h * 2.1, h * 0.2, h * 2.4, h * 0.55, -6, z + 1, 0.1)
	local sq = math.floor(h * 0.74)
	local ico = new("Frame", { Position = UDim2.fromOffset(12, (h - sq) / 2), Size = UDim2.fromOffset(sq, sq), BackgroundColor3 = S.C.ink, BorderSizePixel = 0, Rotation = -4, ZIndex = z + 2, Parent = b }, {
		new("UIStroke", { Color = S.C.gold, Thickness = 2 }),
	})
	local ig = S.icon(ico, iconKey, sq * 0.2, sq * 0.2, sq * 0.6, Color3.new(1, 1, 1), z + 3)
	local lbl = S.title(b, sq + 26, 0, w - sq - 40, h, S.upper(label), math.clamp(math.floor(h * 0.27), 15, 28), { ZIndex = z + 3 })
	if num then
		S.text(b, w - 70, 6, 46, 12, num, S.BODY, 10, S.C.mute, { ZIndex = z + 3, TextXAlignment = Enum.TextXAlignment.Right })
	end
	local api = { button = b, label = lbl, selected = false }
	local basePos = b.Position
	function api.setSelected(on)
		api.selected = on
		S.recolor(shapeGold, on and S.C.gold2 or S.C.gold)
		S.tween(tint, S.SNAP, { BackgroundTransparency = on and 0 or 1 })
		S.tween(ico, S.POP, { BackgroundColor3 = on and Color3.new(1, 1, 1) or S.C.ink, Rotation = on and -7 or -4 })
		ig.ImageColor3 = on and S.C.ink or Color3.new(1, 1, 1)
		S.tween(b, S.EASE_OUT, { Position = basePos + UDim2.fromOffset(on and 12 or 0, 0) })
		S.tween(br, S.EASE_OUT, { Size = UDim2.fromOffset(h * 2.4 * (on and 1.18 or 1), h * 0.55), ImageTransparency = on and 0 or 0.1 })
	end
	local function hover(on)
		if not api.selected then
			S.tween(b, S.SNAP, { Position = basePos + UDim2.fromOffset(on and 5 or 0, 0) })
		end
	end
	b.MouseEnter:Connect(function()
		hover(true)
		S.sfx("tick")
	end)
	b.MouseLeave:Connect(function()
		hover(false)
	end)
	b.SelectionGained:Connect(function()
		hover(true)
	end)
	b.SelectionLost:Connect(function()
		hover(false)
	end)
	return api
end

-- big action button (USAR / VOLTAR style)
function S.bigButton(parent, x, y, w, h, iconKey, label, key, z)
	z = z or 8
	local b = new("TextButton", { Name = label, Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = z, Parent = parent })
	S.shape(b, "para", -10, -8, w + 14, h + 18, 22, S.C.red, z)
	S.shape(b, "right", 0, 0, w, h, 20, S.C.gold, z)
	S.shape(b, "right", 2, 2, w - 4, h - 4, 19, S.C.ink2, z)
	local tex = S.box(b, 2, 2, w - 24, h - 4, z)
	tex.ClipsDescendants = true
	S.tile(tex, "tex_rain", 0, 0, w, h, z)
	S.brush(b, "streak", w - h * 2.7, h * 0.3, h * 2.7, h * 0.6, -5, z + 1)
	local sq = math.floor(h * 0.7)
	local box = new("Frame", { Position = UDim2.fromOffset(h * 0.2, (h - sq) / 2), Size = UDim2.fromOffset(sq, sq), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, Rotation = -3, ZIndex = z + 2, Parent = b }, {
		new("UIStroke", { Color = S.C.red, Thickness = 3 }),
	})
	S.icon(box, iconKey, sq * 0.22, sq * 0.22, sq * 0.56, S.C.ink, z + 3)
	local lbl = S.title(b, sq + h * 0.45, 0, w - sq - h * 0.6, h, S.upper(label), math.floor(h * 0.38), { ZIndex = z + 3 })
	if key then
		S.text(b, w - 120, 8, 90, 12, key, S.BODY, 11, S.C.mute, { ZIndex = z + 3, TextXAlignment = Enum.TextXAlignment.Right })
	end
	local sc = new("UIScale", { Parent = b })
	local base = b.Position
	b.MouseEnter:Connect(function()
		S.tween(b, S.SNAP, { Position = base + UDim2.fromOffset(-4, 0) })
		S.sfx("tick")
	end)
	b.MouseLeave:Connect(function()
		S.tween(b, S.SNAP, { Position = base })
		S.tween(sc, S.SNAP, { Scale = 1 })
	end)
	b.MouseButton1Down:Connect(function()
		S.tween(sc, TweenInfo.new(0.07), { Scale = 0.96 })
	end)
	b.MouseButton1Up:Connect(function()
		S.tween(sc, S.POP, { Scale = 1 })
	end)
	return b, lbl
end

function S.backButton(parent, onClick)
	local b = S.bigButton(parent, 18, 720 - 14 - 72, 250, 72, "arrow", "Voltar", "BACKSPACE", 30)
	b.Activated:Connect(function()
		S.sfx("close")
		onClick()
	end)
	return b
end

-- type chip (colour + glyph + name, never colour alone)
function S.chip(parent, x, y, typeKey, labelOverride, z)
	local t = S.TYPES[typeKey] or S.TYPES.normal
	local label = labelOverride or t[1]
	local w = 34 + (utf8.len(label) or #label) * 7
	z = z or 4
	local g = S.shape(parent, "para", x, y, w, 22, 5, t[2], z)
	S.icon(g, "t_" .. typeKey, 7, 4, 14, Color3.new(1, 1, 1), z + 1)
	S.text(g, 24, 0, w - 26, 22, S.upper(label), S.BODYB, 12, Color3.new(1, 1, 1), { ZIndex = z + 1 })
	return g, w
end

-- segmented bar; returns group and an api with set(fraction)
function S.bar(parent, x, y, w, h, color, frac, z)
	z = z or 4
	local g = S.shape(parent, "para", x, y, w, h, 4, Color3.fromRGB(42, 34, 37), z)
	local fill = S.rect(g, 3, 0, math.max(0, (w - 6) * math.clamp(frac, 0, 1)), h, color, z + 1)
	for i = 1, 3 do
		S.rect(g, 3 + (w - 6) * i / 4 - 1, 0, 2, h, S.C.ink, z + 2)
	end
	local api = {}
	function api.set(f)
		S.tween(fill, S.SLOW, { Size = UDim2.fromOffset(math.max(0, (w - 6) * math.clamp(f, 0, 1)), h) })
	end
	return g, api
end

-- toast at the bottom centre of a screen
function S.toast(screen, text)
	local old = screen:FindFirstChild("Toast")
	if old then
		old:Destroy()
	end
	local w = math.max(220, (utf8.len(text) or #text) * 10 + 60)
	local g = S.box(screen, 640 - w / 2, 656, w, 40, 60, "Toast")
	S.shape(g, "para", 0, 0, w, 40, 10, S.C.gold2, 60)
	S.text(g, 0, 0, w, 40, S.upper(text), S.DISPLAY, 18, Color3.fromRGB(20, 15, 0), { ZIndex = 61, TextXAlignment = Enum.TextXAlignment.Center })
	S.tween(g, S.EASE_OUT, { Position = UDim2.fromOffset(640 - w / 2, 590) })
	task.delay(1.8, function()
		if g.Parent then
			S.tween(g, S.EASE_OUT, { Position = UDim2.fromOffset(640 - w / 2, 740) })
			task.delay(0.3, function()
				g:Destroy()
			end)
		end
	end)
	return g
end

-- line between two points (used by the radar)
function S.line(parent, x1, y1, x2, y2, color, th, z, tr)
	local dx, dy = x2 - x1, y2 - y1
	local len = math.sqrt(dx * dx + dy * dy)
	return new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset((x1 + x2) / 2, (y1 + y2) / 2), Size = UDim2.fromOffset(len, th),
		Rotation = math.deg(math.atan2(dy, dx)), BackgroundColor3 = color, BackgroundTransparency = tr or 0, BorderSizePixel = 0, ZIndex = z or 3, Parent = parent,
	})
end

-- ------------------------------------------------------------------ UI sounds (one sprite file, see PVHudConfig)
local sfxFolder
function S.sfx(name)
	local r = Config.UiSprite[name]
	if not r or Config.Sounds.ui == "rbxassetid://0" then
		return
	end
	if not sfxFolder then
		sfxFolder = new("Folder", { Name = "PVHudSfx", Parent = SoundService })
	end
	local s = new("Sound", { SoundId = Config.Sounds.ui, Volume = Config.UiVolume, Parent = sfxFolder })
	pcall(function()
		s.PlaybackRegionsEnabled = true
		s.PlaybackRegion = NumberRange.new(r[1], r[2])
	end)
	s.TimePosition = r[1]
	s:Play()
	task.delay(r[2] - r[1] + 0.3, function()
		s:Destroy()
	end)
end

return S
