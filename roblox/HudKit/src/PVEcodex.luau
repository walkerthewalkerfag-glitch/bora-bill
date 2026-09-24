--!nonstrict
-- Tela ECODEX: busca, filtro por tipo, lista (capturado / visto / ???) e perfil com arte, fatos, descrição e status.
local E = {}
E.__index = E

local STATS = { "HP", "ATQ", "DEF", "ESP", "VEL" }
local FILTERS = { "all", "fogo", "agua", "raio", "sombra", "terra", "vento", "onirico", "normal", "martial" }

function E.new(hud)
	local self = setmetatable({ hud = hud, S = hud.S, D = hud.data, i = 1, q = "", t = "all" }, E)
	self:build()
	return self
end

function E:build()
	local S = self.S
	local root = S.new("CanvasGroup", { Name = "Ecodex", Size = UDim2.fromOffset(1280, 720), BackgroundTransparency = 1, Visible = false, Parent = self.hud.stage })
	self.root = root
	S.rect(root, 0, 0, 1280, 720, Color3.new(0, 0, 0), 0, 0.45)
	S.frame(root, 10, 88, 1262, 556, 1)
	S.slab(root, "Ecodex", "Registro de Ecos da região")
	self.counts = S.box(root, 900, 30, 350, 44, 5)
	local _, l = S.panel(root, 30, 124, 432, 496, { kind = "right", slant = 20, z = 3 })
	-- search
	local sb = S.shape(l, "para", 16, 14, 380, 40, 6, Color3.fromRGB(34, 27, 30), 6)
	S.icon(sb, "search", 14, 11, 18, S.C.dim, 7)
	self.search = S.new("TextBox", {
		Position = UDim2.fromOffset(40, 0), Size = UDim2.fromOffset(330, 40), BackgroundTransparency = 1, Text = "", PlaceholderText = "Buscar por nome ou número",
		PlaceholderColor3 = S.C.mute, TextColor3 = S.C.bone, FontFace = S.BODY, TextSize = 15, TextXAlignment = Enum.TextXAlignment.Left, ClearTextOnFocus = false, ZIndex = 7, Parent = sb,
	})
	self.search:GetPropertyChangedSignal("Text"):Connect(function()
		self.q = self.search.Text
		self.i = 1
		self:renderList()
	end)
	self.filterHost = S.box(l, 16, 62, 400, 60, 6)
	self.list = S.new("ScrollingFrame", {
		Position = UDim2.fromOffset(12, 126), Size = UDim2.fromOffset(400, 358), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 5,
		ScrollBarImageColor3 = S.C.red, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(), ZIndex = 6, Parent = l,
	}, { S.new("UIListLayout", { Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }), S.new("UIPadding", { PaddingLeft = UDim.new(0, 4), PaddingRight = UDim.new(0, 10), PaddingTop = UDim.new(0, 2) }) })
	local _, p = S.panel(root, 478, 132, 772, 488, { kind = "left", slant = 20, z = 3 })
	self.prof = S.box(p, 30, 0, 730, 488, 6)
	S.backButton(root, function()
		self.hud.back()
	end)
	self:refresh()
end

function E:refresh()
	local S = self.S
	self.dex = self.D.getDex()
	self.counts:ClearAllChildren()
	for k, c in ipairs({ { self.dex.seen, "VISTOS" }, { self.dex.caught, "CAPTURADOS" }, { self.dex.total, "REGIÃO" } }) do
		local x = (k - 1) * 118
		S.title(self.counts, x, 0, 110, 30, tostring(c[1]), 30, { ZIndex = 6, TextXAlignment = Enum.TextXAlignment.Right })
		S.text(self.counts, x, 30, 110, 12, c[2], S.BODYB, 10, S.C.dim, { ZIndex = 6, TextXAlignment = Enum.TextXAlignment.Right })
	end
	self:renderFilters()
	self:renderList()
end

function E:renderFilters()
	local S = self.S
	self.filterHost:ClearAllChildren()
	local x, y = 0, 0
	for _, t in ipairs(FILTERS) do
		local label = t == "all" and "Todos" or S.TYPES[t][1]
		local w = 22 + (utf8.len(label) or #label) * 7
		if x + w > 400 then
			x, y = 0, y + 28
		end
		local on = self.t == t
		local b = S.new("TextButton", { Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(w, 24), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 7, Parent = self.filterHost })
		S.shape(b, "para", 0, 0, w, 24, 5, on and (t == "all" and S.C.bone or S.TYPES[t][2]) or Color3.fromRGB(36, 29, 32), 7)
		S.text(b, 0, 0, w, 24, S.upper(label), S.BODYB, 11, on and (t == "all" and S.C.ink or Color3.new(1, 1, 1)) or S.C.dim, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center })
		b.Activated:Connect(function()
			self.t = t
			self.i = 1
			S.sfx("tick")
			self:renderFilters()
			self:renderList()
		end)
		x += w + 5
	end
end

function E:filtered()
	local q = string.lower(self.q)
	local out = {}
	for _, e in ipairs(self.dex.entries) do
		local okT = self.t == "all" or (e.status ~= "unknown" and table.find(e.types, self.t))
		local okQ = q == "" or string.find(e.no, q, 1, true) or (e.status ~= "unknown" and string.find(string.lower(e.name), q, 1, true))
		if okT and okQ then
			table.insert(out, e)
		end
	end
	return out
end

function E:renderList()
	local S = self.S
	for _, c in ipairs(self.list:GetChildren()) do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
	local L = self:filtered()
	self.i = math.clamp(self.i, 1, math.max(1, #L))
	for k, e in ipairs(L) do
		local focus = k == self.i
		local b = S.new("TextButton", { LayoutOrder = k, Size = UDim2.fromOffset(384, 44), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 7, Parent = self.list })
		S.shape(b, "para", 0, 0, 384, 44, 7, focus and S.C.bone or Color3.fromRGB(28, 21, 24), 7)
		S.shape(b, "para", 2, 2, 380, 40, 6, focus and Color3.fromRGB(42, 29, 34) or Color3.fromRGB(28, 21, 24), 7)
		S.text(b, 14, 0, 50, 44, "Nº" .. e.no, S.BODYB, 12, S.C.mute, { ZIndex = 8 })
		local unk = e.status == "unknown"
		if not unk then
			local dot = S.new("Frame", { Position = UDim2.fromOffset(70, 11), Size = UDim2.fromOffset(22, 22), BackgroundColor3 = e.status == "caught" and (S.TYPES[e.types[1]] or S.TYPES.normal)[2] or Color3.fromRGB(8, 6, 7), ZIndex = 8, Parent = b }, { S.new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
			if e.image then
				S.new("ImageLabel", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Image = e.image, ImageColor3 = e.status == "caught" and Color3.new(1, 1, 1) or Color3.new(0, 0, 0), ZIndex = 9, Parent = dot })
			end
		end
		S.title(b, 102, 0, 180, 44, unk and "???" or S.upper(e.name), 18, { ZIndex = 8, TextColor3 = unk and Color3.fromRGB(107, 98, 93) or S.C.bone })
		if not unk then
			S.icon(b, e.status == "caught" and "i_capture" or "eye", 284, 14, 16, e.status == "caught" and Color3.new(1, 1, 1) or S.C.dim, 8)
			S.text(b, 304, 0, 76, 44, e.status == "caught" and "CAPTURADO" or "VISTO", S.BODYB, 10, S.C.dim, { ZIndex = 8 })
		end
		b.Activated:Connect(function()
			self.i = k
			S.sfx("select")
			self:renderList()
		end)
	end
	if #L == 0 then
		S.text(self.list, 0, 0, 380, 60, "Nenhum Eco encontrado. Tente outro nome ou limpe o filtro.", S.BODY, 13, S.C.dim, { TextWrapped = true, ZIndex = 8 })
	end
	self:renderProfile(L[self.i])
end

function E:renderProfile(e)
	local S = self.S
	self.prof:ClearAllChildren()
	if not e then
		return
	end
	local caught, unk = e.status == "caught", e.status == "unknown"
	local tc = unk and S.TYPES.normal[2] or (S.TYPES[e.types[1]] or S.TYPES.normal)[2]
	-- art on a brush splash tinted by the type
	local art = S.box(self.prof, 0, 20, 300, 300, 7)
	S.brush(art, "splash", -30, -10, 360, 320, 0, 7)
	S.new("ImageLabel", { Position = UDim2.fromOffset(-30, -10), Size = UDim2.fromOffset(360, 320), BackgroundTransparency = 1, Image = S.Config.Images.brush_splash, ImageColor3 = tc, ImageTransparency = 0.45, ZIndex = 8, Parent = art })
	if e.image and not unk then
		S.new("ImageLabel", { Position = UDim2.fromOffset(30, 30), Size = UDim2.fromOffset(240, 240), BackgroundTransparency = 1, Image = e.image, ImageColor3 = caught and Color3.new(1, 1, 1) or Color3.new(0, 0, 0), ScaleType = Enum.ScaleType.Fit, ZIndex = 9, Parent = art })
	else
		S.title(art, 0, 0, 300, 300, unk and "?" or "", 120, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = Color3.fromRGB(90, 79, 83) })
	end
	S.title(art, 0, -6, 120, 30, "Nº" .. e.no, 24, { ZIndex = 10, TextColor3 = S.C.gold2 })
	local x = 320
	S.title(self.prof, x, 20, 400, 50, unk and "???" or S.upper(e.name), 44, { ZIndex = 9 })
	S.text(self.prof, x, 72, 400, 16, unk and "Ainda não visto" or ((e.kind or "") .. (e.status == "seen" and " · visto, não capturado" or "")), S.BODY, 14, S.C.dim, { ZIndex = 9 })
	local cx = x
	if unk then
		S.chip(self.prof, cx, 96, "normal", "???", 9)
	else
		for _, t in ipairs(e.types) do
			local _, w = S.chip(self.prof, cx, 96, t, nil, 9)
			cx += w + 6
		end
	end
	local facts = { { "ALTURA", caught and e.height and (string.gsub(string.format("%.1f m", e.height), "%.", ",")) or "—" }, { "PESO", caught and e.weight and (string.gsub(tostring(e.weight) .. " kg", "%.", ",")) or "—" }, { "STATUS", caught and "Capturado" or e.status == "seen" and "Visto" or "—" } }
	for k, f in ipairs(facts) do
		local g = S.shape(self.prof, "para", x + (k - 1) * 134, 130, 126, 48, 5, Color3.fromRGB(29, 22, 25), 9)
		S.text(g, 12, 6, 110, 12, f[1], S.BODYB, 10, S.C.mute, { ZIndex = 10 })
		S.text(g, 12, 22, 110, 20, f[2], S.BODYB, 16, S.C.bone, { ZIndex = 10 })
	end
	local desc = caught and (e.desc or "") or e.status == "seen" and "Capture este Eco para ler o registro completo." or "Encontre este Eco para registrar."
	S.text(self.prof, x, 190, 400, 80, desc, S.BODY, 15, Color3.fromRGB(226, 217, 208), { ZIndex = 9, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top })
	for k, name in ipairs(STATS) do
		local col, row = (k - 1) % 2, math.floor((k - 1) / 2)
		local sx, sy = col * 360, 340 + row * 26
		local v = caught and e.stats and e.stats[k] or nil
		S.text(self.prof, sx, sy, 40, 16, name, S.BODYB, 12, S.C.dim, { ZIndex = 9 })
		S.text(self.prof, sx + 40, sy, 30, 16, v and tostring(v) or "??", S.BODYB, 12, S.C.bone, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
		S.rect(self.prof, sx + 80, sy + 5, 250, 7, Color3.fromRGB(42, 34, 37), 9)
		if v then
			local f = S.rect(self.prof, sx + 80, sy + 5, 0, 7, tc, 10)
			S.tween(f, S.SLOW, { Size = UDim2.fromOffset(250 * math.min(1, v / 120), 7) })
		end
	end
	S.text(self.prof, 0, 440, 700, 20, "Habitat  " .. (unk and "???" or (e.habitat or "—")), S.BODY, 13, S.C.dim, { ZIndex = 9 })
end

function E:key(k)
	local L = self:filtered()
	if k == "down" then
		self.i = math.min(#L, self.i + 1)
	elseif k == "up" then
		self.i = math.max(1, self.i - 1)
	elseif k == "search" then
		self.search:CaptureFocus()
		return true
	else
		return false
	end
	self.S.sfx("tick")
	self:renderList()
	return true
end

function E:onShow()
	self:refresh()
end

return E
