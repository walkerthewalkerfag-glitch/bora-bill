--!nonstrict
-- Tela FICHA DO LUTADOR (layout igual ao da Mochila): categorias à esquerda, conteúdo no meio,
-- retrato + nome + barras à direita, botão de ação grande embaixo à direita.
local F = {}
F.__index = F

local TABS = {
	{ "Status", "statusic", "Distribuir" }, { "Golpes", "i_fight", "Editar golpes" }, { "Talento", "talent", "Melhorar" },
	{ "Item", "item", "Equipar item" }, { "Passivas", "passive", nil },
}

function F.new(hud)
	local self = setmetatable({ hud = hud, S = hud.S, D = hud.data, tab = 1 }, F)
	self:build()
	return self
end

function F:build()
	local S = self.S
	local root = S.new("CanvasGroup", { Name = "Ficha", Size = UDim2.fromOffset(1280, 720), BackgroundTransparency = 1, Visible = false, Parent = self.hud.stage })
	self.root = root
	S.rect(root, 0, 0, 1280, 720, Color3.new(0, 0, 0), 0, 0.45)
	S.frame(root, 10, 88, 1262, 556, 1)
	S.slab(root, "Ficha", "Do lutador")
	self.cats = {}
	for i, t in ipairs(TABS) do
		local c = S.catButton(root, 28, 122 + (i - 1) * 96, 258, 84, t[2], t[1], "0" .. i, 6)
		c.button.Activated:Connect(function()
			self:setTab(i)
		end)
		self.cats[i] = c
	end
	local _, main = S.panel(root, 318, 122, 548, 496, { kind = "para", slant = 18, z = 3 })
	self.main = S.box(main, 40, 16, 470, 464, 6, "Pane")
	-- portrait with the red splash behind
	self.art = S.box(root, 884, 120, 370, 300, 4, "Art")
	S.brush(self.art, "splash", -40, -10, 440, 310, 0, 4)
	self.portrait = S.box(self.art, 70, 30, 230, 270, 5)
	S.text(self.art, 200, 280, 164, 16, "RETRATO 3D DO LUTADOR", S.BODYB, 10, S.C.dim, { ZIndex = 7, TextXAlignment = Enum.TextXAlignment.Right })
	local info = S.box(root, 890, 406, 362, 200, 6, "Info")
	self.info = info
	S.brush(info, "under", -18, 30, 390, 30, 0, 6)
	self.name = S.title(info, 0, 0, 362, 40, "", 36, { ZIndex = 8 })
	self.lv = S.title(info, 0, 50, 90, 22, "", 18, { ZIndex = 8, TextColor3 = S.C.gold2 })
	self.chipHost = S.box(info, 90, 50, 200, 22, 8)
	self.bars = {}
	for i, b in ipairs({ { "HP", Color3.fromRGB(227, 24, 47) }, { "EN", Color3.fromRGB(45, 127, 224) }, { "XP", Color3.fromRGB(245, 197, 66) } }) do
		local y = 80 + (i - 1) * 22
		S.text(info, 0, y, 30, 14, b[1], S.BODYB, 13, S.C.dim, { ZIndex = 8 })
		local _, api = S.bar(info, 32, y + 2, 236, 12, b[2], 0, 8)
		local v = S.text(info, 272, y, 90, 14, "000 / 000", S.BODYB, 13, S.C.bone, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
		self.bars[i] = { api = api, text = v }
	end
	local nick = S.catButton(info, 0, 148, 176, 56, "i_profile", "Apelido", nil, 8)
	nick.button.Activated:Connect(function()
		self.D.setNickname()
	end)
	self.fav = S.catButton(info, 186, 148, 176, 56, "star", "Favoritar", nil, 8)
	self.fav.button.Activated:Connect(function()
		local f = self.D.getFighter()
		self.D.setFavorite(not f.favorite)
		self:refresh()
		S.sfx("select")
		S.toast(self.root, self.D.getFighter().favorite and "Lutador favoritado" or "Removido dos favoritos")
	end)
	self.act, self.actLabel = S.bigButton(root, 880, 720 - 16 - 92, 380, 92, "play", "Editar", "ENTER", 30)
	self.act.Activated:Connect(function()
		self:action()
	end)
	S.backButton(root, function()
		if self.drawer then
			return self:closeDrawer()
		end
		self.hud.back()
	end)
	self:refresh()
end

function F:refresh()
	local S = self.S
	local f = self.D.getFighter()
	self.f = f
	self.name.Text = S.upper(f.name)
	self.lv.Text = "NV " .. f.level
	self.chipHost:ClearAllChildren()
	S.chip(self.chipHost, 0, 0, f.typeKey, nil, 8)
	for i, v in ipairs({ f.hp, f.en, f.xp }) do
		local cur, max = math.floor(v[1] + 0.5), math.floor(v[2] + 0.5)
		self.bars[i].api.set(max > 0 and cur / max or 0)
		self.bars[i].text.Text = cur .. " / " .. max
	end
	self.fav.setSelected(f.favorite)
	self.portrait:ClearAllChildren()
	if f.portraitModel then
		local vf = S.new("ViewportFrame", { Size = UDim2.fromOffset(230, 270), BackgroundTransparency = 1, ZIndex = 5, Parent = self.portrait })
		local m = f.portraitModel:Clone()
		m.Parent = vf
		local cf, size = m:GetBoundingBox()
		local cam = S.new("Camera", { FieldOfView = 30, Parent = vf })
		cam.CFrame = CFrame.new(cf.Position + cf.LookVector * size.Y * 2.2 + Vector3.new(0, size.Y * 0.2, 0), cf.Position + Vector3.new(0, size.Y * 0.2, 0))
		vf.CurrentCamera = cam
	elseif f.portrait then
		S.new("ImageLabel", { Size = UDim2.fromOffset(230, 270), BackgroundTransparency = 1, Image = f.portrait, ScaleType = Enum.ScaleType.Fit, ZIndex = 5, Parent = self.portrait })
	else
		S.new("Frame", { Position = UDim2.fromOffset(69, 20), Size = UDim2.fromOffset(92, 92), BackgroundColor3 = Color3.fromRGB(5, 3, 4), ZIndex = 5, Parent = self.portrait }, { S.new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		S.new("Frame", { Position = UDim2.fromOffset(15, 130), Size = UDim2.fromOffset(200, 180), BackgroundColor3 = Color3.fromRGB(5, 3, 4), ZIndex = 5, Parent = self.portrait }, { S.new("UICorner", { CornerRadius = UDim.new(0.5, 0) }) })
	end
	self:setTab(self.tab, true)
end

function F:setTab(i, quiet)
	local S = self.S
	self.tab = (i - 1) % #TABS + 1
	for k, c in ipairs(self.cats) do
		c.setSelected(k == self.tab)
	end
	local act = TABS[self.tab][3]
	self.act.Visible = act ~= nil
	if act then
		self.actLabel.Text = S.upper(self.tab == 4 and self.f.item and "Trocar item" or act)
	end
	self.main:ClearAllChildren()
	self.drawer = nil
	local pane = S.box(self.main, 14, 0, 470, 464, 6)
	S.tween(pane, S.EASE_OUT, { Position = UDim2.fromOffset(0, 0) })
	local builders = { self.paneStatus, self.paneMoves, self.paneTalent, self.paneItem, self.panePassives }
	builders[self.tab](self, pane)
	if not quiet then
		S.sfx("tick")
	end
end

local function header(S, pane, title, cap)
	S.title(pane, 0, 0, 300, 30, S.upper(title), 28, { ZIndex = 8 })
	S.text(pane, 250, 8, 220, 14, S.upper(cap), S.BODYB, 10, S.C.mute, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
end

function F:paneStatus(pane)
	local S = self.S
	header(S, pane, "Atributos", "Base + bônus")
	local stats = self.f.stats
	-- radar: grid rings, spokes, base outline (red) and base+bonus outline (green), diamonds on the points
	local cx, cy, R, n = 125, 170, 92, #stats
	local function pt(i, r)
		local a = -math.pi / 2 + (i - 1) * 2 * math.pi / n
		return cx + math.cos(a) * r, cy + math.sin(a) * r
	end
	for _, k in ipairs({ 0.25, 0.5, 0.75, 1 }) do
		for i = 1, n do
			local x1, y1 = pt(i, R * k)
			local x2, y2 = pt(i % n + 1, R * k)
			S.line(pane, x1, y1, x2, y2, Color3.fromRGB(58, 48, 52), 1, 7)
		end
	end
	for i = 1, n do
		local x, y = pt(i, R)
		S.line(pane, cx, cy, x, y, Color3.fromRGB(58, 48, 52), 1, 7)
	end
	for layer = 1, 2 do
		for i = 1, n do
			local j = i % n + 1
			local vi = stats[i][2] + (layer == 2 and stats[i][3] or 0)
			local vj = stats[j][2] + (layer == 2 and stats[j][3] or 0)
			local x1, y1 = pt(i, R * vi / 100)
			local x2, y2 = pt(j, R * vj / 100)
			S.line(pane, x1, y1, x2, y2, layer == 1 and S.C.red or S.C.ok, 2, 8, layer == 2 and 0.3 or 0)
		end
	end
	for i, st in ipairs(stats) do
		local x, y = pt(i, R * st[2] / 100)
		S.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(9, 9), Rotation = 45, BackgroundColor3 = S.C.gold2, BorderSizePixel = 0, ZIndex = 9, Parent = pane }, { S.new("UIStroke", { Color = S.C.ink, Thickness = 2 }) })
		local lx, ly = pt(i, R + 26)
		S.text(pane, lx - 50, ly - 16, 100, 14, S.upper(st[1]), S.BODYB, 11, S.C.dim, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center })
		S.title(pane, lx - 50, ly - 2, 100, 18, tostring(st[2] + st[3]), 17, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center })
	end
	-- rows
	for i, st in ipairs(stats) do
		local y = 44 + (i - 1) * 56
		local g = S.shape(pane, "para", 256, y, 214, 48, 6, Color3.fromRGB(29, 22, 25), 7)
		S.text(g, 14, 6, 110, 16, S.upper(st[1]), S.BODYB, 12, S.C.dim, { ZIndex = 8 })
		S.title(g, 120, 3, 44, 22, tostring(st[2] + st[3]), 20, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
		S.text(g, 166, 6, 36, 16, st[3] > 0 and ("+" .. st[3]) or "—", S.BODYB, 12, st[3] > 0 and S.C.ok or S.C.mute, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
		S.rect(g, 14, 32, 186, 7, Color3.fromRGB(42, 34, 37), 8)
		S.rect(g, 14, 32, 186 * st[2] / 100, 7, S.C.red, 9)
		if st[3] > 0 then
			S.rect(g, 14 + 186 * st[2] / 100, 32, 186 * st[3] / 100, 7, S.C.ok, 9)
		end
	end
	S.rect(pane, 0, 330, 12, 8, S.C.red, 8)
	S.text(pane, 18, 327, 60, 14, "Base", S.BODY, 12, S.C.dim, { ZIndex = 8 })
	S.rect(pane, 70, 330, 12, 8, S.C.ok, 8)
	S.text(pane, 88, 327, 200, 14, "Bônus de item e talento", S.BODY, 12, S.C.dim, { ZIndex = 8 })
	S.text(pane, 280, 430, 120, 24, "Pontos livres", S.BODY, 13, S.C.dim, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
	S.title(pane, 404, 430, 60, 24, tostring(self.f.freePoints or 0), 22, { ZIndex = 8, TextColor3 = S.C.gold2, TextXAlignment = Enum.TextXAlignment.Right })
end

function F:paneMoves(pane)
	local S = self.S
	header(S, pane, "Golpes", "4 slots de combate")
	local mv = self.D.getMoves()
	local byId = {}
	for _, m in ipairs(mv.list) do
		byId[m.id] = m
	end
	for i = 1, 4 do
		local m = byId[mv.equipped[i]]
		local y = 44 + (i - 1) * 84
		S.shape(pane, "para", 0, y, 470, 76, 12, m and S.C.gold or Color3.fromRGB(74, 61, 66), 7)
		S.shape(pane, "para", 2, y + 2, 466, 72, 11, Color3.fromRGB(22, 17, 19), 7)
		S.brush(pane, "streak", 300, y + 36, 170, 34, -4, 8, 0.7)
		S.title(pane, 10, y, 40, 76, tostring(i), 34, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center })
		if m then
			S.shape(pane, "para", 56, y + 14, 7, 48, 2, (S.TYPES[m.type] or S.TYPES.normal)[2], 9)
			S.title(pane, 74, y + 12, 250, 24, S.upper(m.name), 20, { ZIndex = 9 })
			S.chip(pane, 74, y + 42, m.type, nil, 9)
			S.text(pane, 330, y + 14, 60, 12, "PODER", S.BODY, 10, S.C.mute, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
			S.text(pane, 330, y + 28, 60, 20, m.power and tostring(m.power) or "—", S.BODYB, 17, S.C.bone, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
			S.text(pane, 392, y + 14, 50, 12, "PP", S.BODY, 10, S.C.mute, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
			S.text(pane, 392, y + 28, 50, 20, tostring(m.pp), S.BODYB, 17, S.C.bone, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
		else
			S.text(pane, 56, y, 30, 76, "+", S.BODY, 30, S.C.mute, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center })
			S.title(pane, 92, y + 14, 200, 24, "VAGO", 20, { ZIndex = 9, TextColor3 = Color3.fromRGB(141, 133, 124) })
			S.text(pane, 92, y + 40, 200, 16, "Adicione um golpe.", S.BODY, 12, S.C.dim, { ZIndex = 9 })
		end
	end
	local u = self.f.ultimate
	if u then
		S.shape(pane, "para", 0, 386, 470, 50, 10, Color3.fromRGB(61, 42, 6), 7)
		S.shape(pane, "para", 16, 402, 76, 18, 4, S.C.gold2, 8)
		S.text(pane, 20, 402, 70, 18, "ULTIMATE", S.BODYB, 10, Color3.fromRGB(20, 15, 0), { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center })
		S.title(pane, 104, 386, 240, 50, S.upper(u.name), 19, { ZIndex = 9, TextColor3 = S.C.gold2 })
		S.text(pane, 320, 386, 136, 50, u.note or "", S.BODY, 11, Color3.fromRGB(217, 199, 154), { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = true })
	end
end

function F:paneTalent(pane)
	local S = self.S
	header(S, pane, "Talento", "Habilidade única")
	local t = self.f.talent
	S.brush(pane, "splash", -30, 40, 220, 190, 0, 7)
	local em = S.box(pane, 20, 60, 130, 146, 8)
	S.shape(em, "para", 0, 0, 130, 146, 10, S.C.gold, 8)
	S.shape(em, "para", 3, 3, 124, 140, 9, S.C.ink, 8)
	S.icon(em, "talent", 25, 33, 80, S.C.gold2, 9)
	S.title(pane, 180, 50, 290, 36, S.upper(t.name), 30, { ZIndex = 9 })
	for k = 1, t.maxRank do
		S.shape(pane, "para", 180 + (k - 1) * 28, 96, 24, 9, 3, k <= t.rank and S.C.gold2 or Color3.fromRGB(42, 34, 37), 9)
	end
	S.text(pane, 180, 116, 290, 44, t.desc, S.BODY, 14, Color3.fromRGB(226, 217, 208), { ZIndex = 9, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top })
	for k, e in ipairs(t.effects or {}) do
		S.new("Frame", { Position = UDim2.fromOffset(182, 172 + (k - 1) * 24), Size = UDim2.fromOffset(7, 7), Rotation = 45, BackgroundColor3 = S.C.red2, BorderSizePixel = 0, ZIndex = 9, Parent = pane })
		S.text(pane, 198, 166 + (k - 1) * 24, 270, 20, e, S.BODY, 14, Color3.fromRGB(226, 217, 208), { ZIndex = 9 })
	end
	if t.nextUnlock then
		S.shape(pane, "para", 0, 260, 470, 56, 8, Color3.fromRGB(20, 16, 18), 8)
		S.icon(pane, "lock", 22, 276, 24, S.C.gold, 9)
		S.text(pane, 58, 260, 400, 56, t.nextUnlock, S.BODY, 14, S.C.dim, { ZIndex = 9 })
	end
end

function F:paneItem(pane)
	local S = self.S
	header(S, pane, "Item", "1 por lutador")
	local items = self.D.getHeldItems()
	local cur
	for _, it in ipairs(items) do
		if it.id == self.f.item then
			cur = it
		end
	end
	S.brush(pane, "splash", -30, 30, 280, 240, 0, 7)
	S.shape(pane, "para", 0, 50, 200, 200, 10, cur and S.C.gold or Color3.fromRGB(74, 61, 66), 8)
	local box = S.shape(pane, "para", 2, 52, 196, 196, 9, Color3.fromRGB(20, 15, 17), 8)
	if cur then
		S.icon(box, "item", 48, 48, 100, cur.color, 9)
	else
		local plus = S.new("Frame", { Position = UDim2.fromOffset(66, 50), Size = UDim2.fromOffset(64, 64), BackgroundTransparency = 1, ZIndex = 9, Parent = box }, { S.new("UIStroke", { Color = S.C.gold, Thickness = 2, LineJoinMode = Enum.LineJoinMode.Miter }) })
		S.text(plus, 0, 0, 64, 64, "+", S.BODY, 40, S.C.gold, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center })
		S.title(box, 0, 124, 196, 24, "VAGO", 16, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = S.C.dim })
	end
	S.title(pane, 224, 50, 246, 34, S.upper(cur and cur.name or "Nenhum item"), 28, { ZIndex = 9, TextColor3 = cur and S.C.bone or S.C.dim, TextWrapped = true })
	S.text(pane, 224, 92, 246, 60, cur and cur.desc or "Itens de segurar dão bônus passivos em batalha.", S.BODY, 14, Color3.fromRGB(226, 217, 208), { ZIndex = 9, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top })
	local b = S.catButton(pane, 224, 170, 176, 56, cur and "x" or "i_bag", cur and "Remover" or "Adicionar", nil, 9)
	b.button.Activated:Connect(function()
		if cur then
			self.D.removeItem()
			self:refresh()
			S.sfx("close")
			S.toast(self.root, cur.name .. " voltou para a mochila")
		else
			self:openDrawer()
		end
	end)
end

function F:openDrawer()
	local S = self.S
	if self.drawer then
		return
	end
	local d = S.box(self.main, 0, 464, 470, 430, 20, "Drawer")
	S.rect(d, -30, 0, 530, 470, Color3.fromRGB(8, 6, 7), 20, 0.03)
	S.title(d, 0, 6, 300, 26, "MOCHILA · ITENS DE SEGURAR", 19, { ZIndex = 21 })
	local close = S.catButton(d, 330, 0, 140, 40, "x", "Fechar", nil, 21)
	close.button.Activated:Connect(function()
		self:closeDrawer()
	end)
	for i, it in ipairs(self.D.getHeldItems()) do
		local x, y = ((i - 1) % 3) * 158, 52 + math.floor((i - 1) / 3) * 124
		local b = S.new("TextButton", { Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(150, 116), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 21, Parent = d })
		local o = S.shape(b, "para", 0, 0, 150, 116, 6, Color3.fromRGB(36, 27, 31), 21)
		S.icon(b, "item", 47, 10, 56, it.color, 22)
		S.title(b, 6, 66, 138, 20, S.upper(it.name), 14, { ZIndex = 22, TextXAlignment = Enum.TextXAlignment.Center })
		S.text(b, 6, 88, 138, 16, "× " .. it.count, S.BODYB, 12, S.C.gold2, { ZIndex = 22, TextXAlignment = Enum.TextXAlignment.Center })
		if it.count <= 0 then
			b.Active = false
			for _, c in ipairs(b:GetDescendants()) do
				if c:IsA("TextLabel") then
					c.TextTransparency = 0.6
				elseif c:IsA("ImageLabel") then
					c.ImageTransparency = 0.6
				end
			end
		end
		b.MouseEnter:Connect(function()
			if it.count > 0 then
				S.recolor(o, Color3.fromRGB(64, 30, 36))
			end
		end)
		b.MouseLeave:Connect(function()
			S.recolor(o, Color3.fromRGB(36, 27, 31))
		end)
		b.Activated:Connect(function()
			if it.count <= 0 then
				return S.sfx("deny")
			end
			self.D.equipItem(it.id)
			self:refresh()
			S.sfx("save")
			S.toast(self.root, it.name .. " equipado")
		end)
	end
	self.drawer = d
	S.tween(d, S.EASE_OUT, { Position = UDim2.fromOffset(0, 30) })
	S.sfx("open")
end

function F:closeDrawer()
	if self.drawer then
		local d = self.drawer
		self.drawer = nil
		self.S.tween(d, self.S.EASE_OUT, { Position = UDim2.fromOffset(0, 480) })
		task.delay(0.25, function()
			d:Destroy()
		end)
		self.S.sfx("close")
	end
end

function F:panePassives(pane)
	local S = self.S
	header(S, pane, "Passivas", "Sempre ativas")
	for i, p in ipairs(self.f.passives) do
		local y = 44 + (i - 1) * 80
		S.shape(pane, "para", 0, y, 470, 72, 8, p.unlocked and Color3.fromRGB(31, 24, 27) or Color3.fromRGB(20, 16, 18), 7)
		local ic = S.new("Frame", { Position = UDim2.fromOffset(18, y + 12), Size = UDim2.fromOffset(48, 48), BackgroundColor3 = S.C.ink, BorderSizePixel = 0, ZIndex = 8, Parent = pane }, { S.new("UIStroke", { Color = p.unlocked and S.C.gold or S.C.line, Thickness = 2 }) })
		S.icon(ic, p.unlocked and "passive" or "lock", 10, 10, 28, p.unlocked and Color3.new(1, 1, 1) or Color3.fromRGB(107, 98, 93), 9)
		S.title(pane, 80, y + 12, 280, 22, S.upper(p.name), 19, { ZIndex = 9, TextColor3 = p.unlocked and S.C.bone or Color3.fromRGB(107, 98, 93) })
		S.text(pane, 80, y + 38, 280, 18, p.desc, S.BODY, 13, S.C.dim, { ZIndex = 9 })
		S.icon(pane, p.unlocked and "check" or "lock", 364, y + 29, 14, p.unlocked and S.C.ok or S.C.gold, 9)
		S.text(pane, 382, y + 26, 84, 20, p.unlocked and "ATIVA" or "BLOQUEADA", S.BODYB, 11, p.unlocked and S.C.ok or S.C.gold, { ZIndex = 9 })
	end
end

function F:action()
	local S = self.S
	S.sfx("select")
	if self.tab == 2 then
		self.hud.go("moves")
	elseif self.tab == 4 then
		self:openDrawer()
	elseif self.tab == 1 then
		S.toast(self.root, (self.f.freePoints or 0) > 0 and "Distribua os pontos" or "Sem pontos livres")
	elseif self.tab == 3 then
		S.toast(self.root, "Melhorar talento")
	end
end

function F:key(k)
	if k == "lb" or k == "up" then
		self:setTab(self.tab - 1)
	elseif k == "rb" or k == "down" then
		self:setTab(self.tab + 1)
	elseif k == "ok" or k == "act" then
		self:action()
	elseif k == "back" and self.drawer then
		self:closeDrawer()
	else
		return false
	end
	return true
end

function F:onShow()
	self:refresh()
end

return F
