--!nonstrict
-- Tela de GOLPES: 4 slots fixos + lista de aprendidos e próximos desbloqueios.
-- Trocar: clique no slot e depois no golpe (ou o contrário), ou arraste golpe -> slot, slot -> golpe, slot -> slot.
local M = {}
M.__index = M

local CATS = { fisico = { "Físico", "c_fisico" }, especial = { "Especial", "c_especial" }, status = { "Status", "c_status" } }
local TYPE_ORDER = { "normal", "sombra", "martial", "fogo", "onirico", "raio", "agua", "vento", "terra" }

function M.new(hud)
	local self = setmetatable({ hud = hud, S = hud.S, D = hud.data }, M)
	self.armed, self.picked, self.typeF, self.catF = 0, nil, "all", "all"
	self.focus = { zone = "slots", i = 1 }
	self:build()
	return self
end

function M:build()
	local S = self.S
	local root = S.new("CanvasGroup", { Name = "Golpes", Size = UDim2.fromOffset(1280, 720), BackgroundTransparency = 1, Visible = false, Parent = self.hud.stage })
	self.root = root
	S.rect(root, 0, 0, 1280, 720, Color3.new(0, 0, 0), 0, 0.45)
	S.frame(root, 10, 88, 1262, 556, 1)
	S.slab(root, "Golpes", "Escolha 4 para a batalha")
	-- equipped
	local _, eq = S.panel(root, 30, 124, 462, 386, { kind = "right", z = 3 })
	S.title(eq, 18, 10, 200, 26, "EQUIPADOS", 22, { ZIndex = 6 })
	self.count = S.text(eq, 300, 12, 130, 20, "4 / 4", S.BODY, 12, S.C.dim, { ZIndex = 6, TextXAlignment = Enum.TextXAlignment.Right })
	self.slotHost = S.box(eq, 14, 46, 420, 300, 5)
	self.ult = S.box(eq, 14, 334, 420, 40, 5)
	-- detail
	local _, det = S.panel(root, 30, 520, 462, 100, { kind = "para", slant = 16, z = 3 })
	self.det = S.box(det, 30, 10, 400, 82, 5)
	-- list
	local _, lst = S.panel(root, 508, 132, 742, 488, { kind = "left", slant = 18, z = 3 })
	self.filters = S.box(lst, 34, 12, 700, 56, 5)
	local hdr = S.box(lst, 44, 72, 670, 14, 5)
	for _, h in ipairs({ { 0, "NV" }, { 50, "GOLPE" }, { 440, "TIPO" }, { 530, "PODER" }, { 580, "PREC." }, { 634, "PP" } }) do
		S.text(hdr, h[1], 0, 60, 14, h[2], S.BODYB, 10, S.C.mute, { ZIndex = 6 })
	end
	self.list = S.new("ScrollingFrame", {
		Position = UDim2.fromOffset(26, 90), Size = UDim2.fromOffset(700, 386), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 5,
		ScrollBarImageColor3 = S.C.red, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ZIndex = 6, Parent = lst,
	}, { S.new("UIListLayout", { Padding = UDim.new(0, 5), SortOrder = Enum.SortOrder.LayoutOrder }), S.new("UIPadding", { PaddingLeft = UDim.new(0, 6), PaddingTop = UDim.new(0, 4), PaddingRight = UDim.new(0, 12) }) })
	S.backButton(root, function()
		self:cancel()
		self.hud.back()
	end)
	self:buildLearn()
	self:refresh()
end

function M:moveById(id)
	for _, m in ipairs(self.data.list) do
		if m.id == id then
			return m
		end
	end
end

-- ------------------------------------------------------------------ slots
function M:renderSlots()
	local S = self.S
	self.slotHost:ClearAllChildren()
	self.slots = {}
	for i = 1, 4 do
		local m = self:moveById(self.data.equipped[i])
		local y = (i - 1) * 74
		local b = S.new("TextButton", { Name = "Slot" .. i, Position = UDim2.fromOffset(0, y), Size = UDim2.fromOffset(420, 66), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 6, Parent = self.slotHost })
		b:SetAttribute("PVSlot", i)
		local out = S.shape(b, "para", 0, 0, 420, 66, 12, S.C.line, 6)
		S.shape(b, "para", 2, 2, 416, 62, 11, S.C.ink2, 6)
		S.brush(b, "streak", 250, 30, 170, 34, -4, 7, 0.7)
		S.title(b, 8, 0, 40, 66, tostring(i), 34, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = S.C.dim })
		if m then
			local tc = (S.TYPES[m.type] or S.TYPES.normal)[2]
			S.shape(b, "para", 52, 10, 7, 46, 2, tc, 8)
			S.title(b, 68, 8, 220, 24, S.upper(m.name), 20, { ZIndex = 8 })
			local _, cw = S.chip(b, 68, 36, m.type, nil, 8)
			S.icon(b, CATS[m.cat][2], 76 + cw, 40, 14, S.C.dim, 8)
			S.text(b, 94 + cw, 36, 80, 22, S.upper(CATS[m.cat][1]), S.BODYB, 11, S.C.dim, { ZIndex = 8 })
			local nums = { { "PODER", m.power and (tostring(m.power) .. (m.hits and "×" .. m.hits or "")) or "—" }, { "PREC", m.acc and tostring(m.acc) or "—" }, { "PP", tostring(m.pp) } }
			for k, n in ipairs(nums) do
				S.text(b, 268 + (k - 1) * 46, 14, 44, 12, n[1], S.BODY, 10, S.C.mute, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
				S.text(b, 268 + (k - 1) * 46, 28, 44, 20, n[2], S.BODYB, 16, S.C.bone, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
			end
		end
		b.Activated:Connect(function()
			if not self.dragging then
				self:armSlot(i)
			end
		end)
		b.MouseEnter:Connect(function()
			self:setFocus("slots", i)
		end)
		self:hookDrag(b, { kind = "slot", i = i })
		self.slots[i] = { button = b, outline = out, base = b.Position }
	end
	local S2 = self.S
	self.ult:ClearAllChildren()
	local u = self.D.getFighter().ultimate
	if u then
		S2.shape(self.ult, "para", 0, 0, 420, 40, 10, Color3.fromRGB(61, 42, 6), 6)
		S2.shape(self.ult, "para", 14, 11, 76, 18, 4, S2.C.gold2, 7)
		S2.text(self.ult, 18, 11, 70, 18, "ULTIMATE", S2.BODYB, 10, Color3.fromRGB(20, 15, 0), { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center })
		S2.title(self.ult, 100, 0, 200, 40, S.upper(u.name), 18, { ZIndex = 8, TextColor3 = S2.C.gold2 })
		S2.text(self.ult, 280, 0, 124, 40, u.note or "", S2.BODY, 11, Color3.fromRGB(217, 199, 154), { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = true })
	end
end

-- ------------------------------------------------------------------ filters + list
function M:renderFilters()
	local S = self.S
	self.filters:ClearAllChildren()
	self.filterButtons = {}
	local present = {}
	for _, m in ipairs(self.data.list) do
		present[m.type] = true
	end
	local x = 0
	S.text(self.filters, x, 0, 34, 24, "TIPO", S.BODYB, 10, S.C.mute, { ZIndex = 7 })
	x = 36
	local function fbtn(label, val, color, row, isCat)
		local w = 22 + (utf8.len(label) or #label) * 7
		local b = S.new("TextButton", { Position = UDim2.fromOffset(x, row), Size = UDim2.fromOffset(w, 24), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 7, Parent = self.filters })
		local on = (isCat and self.catF or self.typeF) == val
		S.shape(b, "para", 0, 0, w, 24, 5, on and (color or S.C.bone) or Color3.fromRGB(36, 29, 32), 7)
		S.text(b, 0, 0, w, 24, S.upper(label), S.BODYB, 11, on and (color and Color3.new(1, 1, 1) or S.C.ink) or S.C.dim, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center })
		b.Activated:Connect(function()
			if isCat then
				self.catF = val
			else
				self.typeF = val
			end
			S.sfx("tick")
			self:renderFilters()
			self:renderRows()
		end)
		x += w + 6
		table.insert(self.filterButtons, b)
	end
	fbtn("Todos", "all", nil, 0)
	for _, t in ipairs(TYPE_ORDER) do
		if present[t] then
			fbtn(S.TYPES[t][1], t, S.TYPES[t][2], 0)
		end
	end
	x = 0
	S.text(self.filters, x, 30, 70, 24, "CATEGORIA", S.BODYB, 10, S.C.mute, { ZIndex = 7 })
	x = 72
	fbtn("Todas", "all", nil, 30, true)
	for _, k in ipairs({ "fisico", "especial", "status" }) do
		fbtn(CATS[k][1], k, nil, 30, true)
	end
end

function M:renderRows()
	local S = self.S
	for _, c in ipairs(self.list:GetChildren()) do
		if c:IsA("GuiObject") then
			c:Destroy()
		end
	end
	self.rows = {}
	local learned, locked = {}, {}
	for _, m in ipairs(self.data.list) do
		if (self.typeF == "all" or m.type == self.typeF) and (self.catF == "all" or m.cat == self.catF) then
			table.insert(m.lv <= self.data.level and learned or locked, m)
		end
	end
	local order = 0
	local function section(txt)
		order += 1
		S.text(self.list, 0, 0, 660, 20, txt, S.BODYB, 10, S.C.gold, { LayoutOrder = order, ZIndex = 7 })
	end
	local function row(m, lock)
		order += 1
		local eqI = table.find(self.data.equipped, m.id)
		local tc = (S.TYPES[m.type] or S.TYPES.normal)[2]
		local b = S.new("TextButton", { Name = m.id, LayoutOrder = order, Size = UDim2.fromOffset(660, 56), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 7, Parent = self.list })
		local out = S.shape(b, "para", 0, 0, 660, 56, 8, lock and Color3.fromRGB(20, 16, 18) or Color3.fromRGB(28, 21, 24), 7)
		S.shape(b, "para", 2, 2, 656, 52, 7, lock and Color3.fromRGB(20, 16, 18) or Color3.fromRGB(28, 21, 24), 7)
		S.shape(b, "para", 8, 0, 6, 56, 2, lock and Color3.fromRGB(58, 50, 54) or tc, 8)
		local dimC = lock and Color3.fromRGB(107, 98, 93) or S.C.bone
		S.text(b, 16, 8, 36, 12, "NV", S.BODYB, 10, S.C.dim, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center })
		S.title(b, 16, 22, 36, 24, tostring(m.lv), 20, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = dimC })
		local nm = S.title(b, 62, 7, 360, 22, S.upper(m.name), 19, { ZIndex = 9, TextColor3 = dimC })
		local nameW = nm.TextBounds.X
		if nameW <= 0 then
			nameW = (utf8.len(m.name) or #m.name) * 11 -- TextBounds is 0 until the text is laid out
		end
		local tx = 62 + nameW + 10
		if eqI then
			S.shape(b, "right", tx, 10, 104, 16, 3, Color3.fromRGB(45, 37, 40), 9)
			S.icon(b, "check", tx + 5, 12, 12, S.C.bone, 10)
			S.text(b, tx + 20, 10, 84, 16, "EQUIPADO · " .. eqI, S.BODYB, 10, S.C.bone, { ZIndex = 10 })
			tx += 110
		end
		if m.isNew and not lock then
			S.shape(b, "right", tx, 10, 50, 16, 3, S.C.red, 9)
			S.text(b, tx, 10, 46, 16, "NOVO", S.BODYB, 10, Color3.new(1, 1, 1), { ZIndex = 10, TextXAlignment = Enum.TextXAlignment.Center })
		end
		if lock then
			S.icon(b, "lock", 62, 33, 13, S.C.gold, 9)
			S.text(b, 80, 31, 330, 16, "Desbloqueia no nível " .. m.lv, S.BODYB, 12, S.C.gold, { ZIndex = 9 })
		else
			S.text(b, 62, 31, 360, 16, m.effect or "", S.BODY, 12.5, S.C.dim, { ZIndex = 9, TextTruncate = Enum.TextTruncate.AtEnd })
		end
		S.chip(b, 432, 8, m.type, nil, 9)
		S.icon(b, CATS[m.cat][2], 436, 34, 13, S.C.dim, 9)
		S.text(b, 452, 32, 70, 14, S.upper(CATS[m.cat][1]), S.BODYB, 10, S.C.dim, { ZIndex = 9 })
		local nums = { m.power and (tostring(m.power) .. (m.hits and "×" .. m.hits or "")) or "—", m.acc and tostring(m.acc) or "—", tostring(m.pp) }
		for k, n in ipairs(nums) do
			S.text(b, 516 + (k - 1) * 50, 10, 44, 20, n, S.BODYB, 16, dimC, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
			S.text(b, 516 + (k - 1) * 50, 32, 44, 12, ({ "PODER", "PREC", "PP" })[k], S.BODY, 9, S.C.mute, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Right })
		end
		local r = { button = b, move = m, lock = lock, outline = out, base = UDim2.fromOffset(0, 0) }
		b.Activated:Connect(function()
			if not self.dragging then
				self:pickMove(m)
			end
		end)
		b.MouseEnter:Connect(function()
			self:setFocus("list", table.find(self.rows, r))
		end)
		if not lock then
			self:hookDrag(b, { kind = "row", id = m.id })
		end
		table.insert(self.rows, r)
	end
	if #learned > 0 then
		section("APRENDIDOS · " .. #learned)
		for _, m in ipairs(learned) do
			row(m, false)
		end
	end
	if #locked > 0 then
		section("PRÓXIMOS DESBLOQUEIOS")
		for _, m in ipairs(locked) do
			row(m, true)
		end
	end
end

function M:renderDetail(m)
	local S = self.S
	self.det:ClearAllChildren()
	if not m then
		return
	end
	S.title(self.det, 0, 0, 250, 26, S.upper(m.name), 23, { ZIndex = 6 })
	local _, cw = S.chip(self.det, 260, 3, m.type, nil, 6)
	S.text(self.det, 268 + cw, 3, 100, 22, S.upper(CATS[m.cat][1]), S.BODYB, 11, S.C.dim, { ZIndex = 6 })
	local lock = m.lv > self.data.level
	local txt = (lock and ("Desbloqueia no nível " .. m.lv .. ". ") or "") .. (m.effect or "") .. "  Poder " .. (m.power or "—") .. " · Precisão " .. (m.acc or "—") .. " · PP " .. m.pp .. " · Aprendido no nível " .. m.lv .. "."
	S.text(self.det, 0, 32, 400, 48, txt, S.BODY, 14, Color3.fromRGB(221, 212, 203), { ZIndex = 6, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top })
end

-- ------------------------------------------------------------------ state
function M:refresh()
	self.data = self.D.getMoves()
	local n = 0
	for i = 1, 4 do
		if self.data.equipped[i] then
			n += 1
		end
	end
	self.count.Text = n .. " / 4"
	self:renderSlots()
	self:renderFilters()
	self:renderRows()
	self:decorate()
end

function M:decorate()
	local S = self.S
	for i, s in ipairs(self.slots) do
		local armed = self.armed == i
		local focus = self.focus.zone == "slots" and self.focus.i == i
		S.recolor(s.outline, armed and S.C.gold2 or focus and S.C.bone or S.C.line)
		S.tween(s.button, S.SNAP, { Position = s.base + UDim2.fromOffset((armed or focus) and 6 or 0, 0) })
	end
	for i, r in ipairs(self.rows or {}) do
		local focus = self.focus.zone == "list" and self.focus.i == i
		local sel = self.picked == r.move.id
		S.recolor(r.outline, sel and S.C.gold2 or focus and S.C.bone or (r.lock and Color3.fromRGB(20, 16, 18) or Color3.fromRGB(28, 21, 24)))
		S.tween(r.button, S.FOCUS, { Position = UDim2.fromOffset(focus and 5 or 0, 0) })
	end
	if self.focus.zone == "slots" then
		self:renderDetail(self:moveById(self.data.equipped[self.focus.i]))
	elseif self.rows and self.rows[self.focus.i] then
		self:renderDetail(self.rows[self.focus.i].move)
	end
end

function M:setFocus(zone, i)
	if not i then
		return
	end
	if self.focus.zone ~= zone or self.focus.i ~= i then
		self.focus = { zone = zone, i = i }
		self:decorate()
	end
end

function M:cancel()
	self.armed, self.picked = 0, nil
end

function M:armSlot(i)
	local S = self.S
	if self.picked then
		return self:equip(self.picked, i)
	end
	self.armed = self.armed == i and 0 or i
	S.sfx("select")
	if self.armed > 0 then
		S.toast(self.root, "Escolha o golpe para o slot " .. i)
	end
	self:decorate()
end

function M:pickMove(m)
	local S = self.S
	if m.lv > self.data.level then
		S.sfx("deny")
		S.toast(self.root, "Desbloqueia no nível " .. m.lv)
		return
	end
	if self.armed > 0 then
		return self:equip(m.id, self.armed)
	end
	self.picked = self.picked ~= m.id and m.id or nil
	S.sfx("select")
	if self.picked then
		S.toast(self.root, "Escolha o slot (1–4) para " .. m.name)
	end
	self.focus = { zone = "slots", i = 1 }
	self:decorate()
end

function M:equip(id, slot)
	local S = self.S
	local m = self:moveById(id)
	if not m or m.lv > self.data.level then
		return
	end
	if self.D.equipMove(slot, id) then
		self:cancel()
		self:refresh()
		self.focus = { zone = "slots", i = slot }
		self:decorate()
		local s = self.slots[slot]
		local flash = S.rect(s.button, 0, 0, 420, 66, Color3.new(1, 1, 1), 20, 0.2)
		S.tween(flash, TweenInfo.new(0.5), { BackgroundTransparency = 1 })
		task.delay(0.55, function()
			flash:Destroy()
		end)
		S.sfx("save")
		S.toast(self.root, "Slot " .. slot .. ": " .. m.name .. " · conjunto salvo")
	end
end

-- ------------------------------------------------------------------ drag and drop
function M:hookDrag(button, from)
	button.InputBegan:Connect(function(input)
		local t = input.UserInputType
		if t ~= Enum.UserInputType.MouseButton1 and t ~= Enum.UserInputType.Touch then
			return
		end
		self.pending = { from = from, pos = input.Position, t0 = os.clock(), touch = t == Enum.UserInputType.Touch, src = button }
	end)
end

function M:startDrag(p)
	local S = self.S
	local gui = self.hud.dragGui
	local src = p.src
	local ghost = src:Clone()
	for _, d in ipairs(ghost:GetDescendants()) do
		if d:IsA("GuiObject") then
			d.ZIndex += 100
		end
	end
	ghost.Size = src.Size
	ghost.Rotation = -2
	S.new("UIScale", { Scale = self.hud.scale(), Parent = ghost })
	ghost.Parent = gui
	self.dragging = { ghost = ghost, from = p.from, off = Vector2.new(p.pos.X, p.pos.Y) - src.AbsolutePosition }
	src.Visible = true
	S.sfx("select")
end

function M:dropTarget(pos)
	local objs = self.hud.playerGui:GetGuiObjectsAtPosition(pos.X, pos.Y)
	for _, o in ipairs(objs) do
		local x = o
		while x and x ~= self.root do
			if x:GetAttribute("PVSlot") then
				return { kind = "slot", i = x:GetAttribute("PVSlot") }
			end
			if x.Parent == self.list and x:IsA("TextButton") then
				local m = self:moveById(x.Name)
				if m and m.lv <= self.data.level then
					return { kind = "row", id = m.id }
				end
			end
			x = x.Parent
		end
	end
end

function M:inputChanged(input)
	local p = self.pending
	if p and not self.dragging then
		local d = (Vector2.new(input.Position.X, input.Position.Y) - Vector2.new(p.pos.X, p.pos.Y)).Magnitude
		if p.touch and os.clock() - p.t0 < 0.22 then
			if d > 10 then
				self.pending = nil
			end
			return
		end
		if d > 6 then
			self:startDrag(p)
		end
	end
	if self.dragging then
		local g = self.dragging
		g.ghost.Position = UDim2.fromOffset(input.Position.X - g.off.X, input.Position.Y - g.off.Y)
	end
end

function M:inputEnded(input)
	self.pending = nil
	local g = self.dragging
	if not g then
		return
	end
	g.ghost:Destroy()
	local t = self:dropTarget(input.Position)
	local f = g.from
	task.defer(function()
		self.dragging = nil
	end)
	self:cancel()
	if not t then
		self.S.sfx("close")
		self:decorate()
		return
	end
	if f.kind == "row" and t.kind == "slot" then
		self:equip(f.id, t.i)
	elseif f.kind == "slot" and t.kind == "row" then
		self:equip(t.id, f.i)
	elseif f.kind == "slot" and t.kind == "slot" and f.i ~= t.i then
		self.D.swapSlots(f.i, t.i)
		self:refresh()
		self.S.sfx("save")
		self.S.toast(self.root, "Slots " .. f.i .. " e " .. t.i .. " trocados · conjunto salvo")
	end
end

-- ------------------------------------------------------------------ level-up banner: "Equipar agora" / "Depois"
function M:buildLearn()
	local S = self.S
	local g = S.box(self.root, 740, -150, 520, 128, 40, "Learn")
	S.shape(g, "para", -6, -6, 532, 140, 16, S.C.red, 40)
	local _, c = S.panel(g, 0, 0, 520, 128, { kind = "para", slant = 14, z = 41, outline = S.C.gold2 })
	self.lnCap = S.text(c, 30, 14, 300, 14, "", S.BODYB, 11, S.C.gold2, { ZIndex = 45 })
	self.lnName = S.title(c, 30, 34, 300, 40, "", 32, { ZIndex = 45 })
	self.lnInfo = S.text(c, 30, 82, 300, 20, "", S.BODY, 13, S.C.dim, { ZIndex = 45 })
	local now = S.bigButton(c, 330, 16, 170, 46, "play", "Equipar", "ENTER", 46)
	local later = S.bigButton(c, 330, 70, 170, 42, "x", "Depois", "BKSP", 46)
	now.Activated:Connect(function()
		self:closeLearn(true)
	end)
	later.Activated:Connect(function()
		self:closeLearn(false)
	end)
	self.learnBox = g
end

-- call when the fighter learns a move (after a level up); the move must already be in PVData.getMoves().list
function M:learn(moveId)
	local S = self.S
	self:refresh()
	local m = self:moveById(moveId)
	if not m then
		return
	end
	m.isNew = true
	self.learning = m
	self.lnCap.Text = "NÍVEL " .. m.lv .. " · NOVO GOLPE APRENDIDO"
	self.lnName.Text = S.upper(m.name)
	self.lnInfo.Text = (S.TYPES[m.type] or S.TYPES.normal)[1] .. " · Poder " .. (m.power or "—") .. " · PP " .. m.pp
	S.tween(self.learnBox, S.SLOW, { Position = UDim2.fromOffset(740, 18) })
	S.sfx("save")
	self:renderRows()
end

function M:closeLearn(now)
	local S = self.S
	S.tween(self.learnBox, S.EASE_OUT, { Position = UDim2.fromOffset(740, -150) })
	local m = self.learning
	self.learning = nil
	if not m then
		return
	end
	if now then
		self.picked, self.armed = m.id, 0
		self.focus = { zone = "slots", i = 1 }
		self:decorate()
		S.toast(self.root, "Escolha o slot para " .. m.name)
	else
		S.toast(self.root, m.name .. " ficou na lista de aprendidos")
	end
end

-- ------------------------------------------------------------------ keys: up/down/left/right/ok/back/lb/rb/1-4
function M:key(k)
	if self.learning then
		if k == "ok" then
			self:closeLearn(true)
		elseif k == "back" then
			self:closeLearn(false)
		end
		return true
	end
	local f = self.focus
	local n = f.zone == "slots" and 4 or #self.rows
	if k == "down" then
		f.i = math.min(n, f.i + 1)
	elseif k == "up" then
		f.i = math.max(1, f.i - 1)
	elseif k == "right" and f.zone == "slots" then
		self.focus = { zone = "list", i = 1 }
	elseif k == "left" and f.zone == "list" then
		self.focus = { zone = "slots", i = math.min(4, f.i) }
	elseif k == "ok" then
		if f.zone == "slots" then
			self:armSlot(f.i)
		elseif self.rows[f.i] then
			self:pickMove(self.rows[f.i].move)
		end
		return true
	elseif k == "back" then
		if self.armed > 0 or self.picked then
			self:cancel()
			self.S.toast(self.root, "Troca cancelada")
			self:decorate()
			return true
		end
		return false
	elseif k == "lb" or k == "rb" then
		local list = { "all" }
		for _, t in ipairs(TYPE_ORDER) do
			for _, m in ipairs(self.data.list) do
				if m.type == t then
					table.insert(list, t)
					break
				end
			end
		end
		local i = table.find(list, self.typeF) or 1
		self.typeF = list[(i - 1 + (k == "rb" and 1 or -1)) % #list + 1]
		self:renderFilters()
		self:renderRows()
		return true
	elseif k == "1" or k == "2" or k == "3" or k == "4" then
		self:armSlot(tonumber(k))
		return true
	else
		return false
	end
	self.S.sfx("tick")
	self:decorate()
	if self.focus.zone == "list" and self.rows[self.focus.i] then
		local b = self.rows[self.focus.i].button
		local top = b.AbsolutePosition.Y - self.list.AbsolutePosition.Y
		if top < 0 or top + b.AbsoluteSize.Y > self.list.AbsoluteSize.Y then
			self.list.CanvasPosition = Vector2.new(0, math.max(0, self.list.CanvasPosition.Y + top - 40))
		end
	end
	return true
end

function M:onShow()
	self:refresh()
end

return M
