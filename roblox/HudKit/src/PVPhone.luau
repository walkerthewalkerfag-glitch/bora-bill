--!nonstrict
-- HUD lateral + CELULAR: aba na borda esquerda (tecla M) que sobe o celular com os apps.
-- Abrir um app: o ícone cresce até a tela do celular, passa o corte vermelho e a tela do app entra.
local Ph = {}
Ph.__index = Ph

function Ph.new(hud)
	local self = setmetatable({ hud = hud, S = hud.S, open = false, focus = 1 }, Ph)
	self:build()
	return self
end

function Ph:build()
	local S = self.S
	local root = S.box(self.hud.stage, 0, 0, 1280, 720, 50, "Phone")
	self.root = root
	-- side tab
	local tab = S.new("TextButton", { Name = "PhoneTab", Position = UDim2.fromOffset(0, 190), Size = UDim2.fromOffset(86, 78), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 51, Parent = root })
	S.shape(tab, "right", 0, 0, 86, 78, 10, S.C.gold, 51)
	S.shape(tab, "right", 0, 2, 84, 74, 9, S.C.deep, 51)
	S.brush(tab, "streak", 10, 44, 90, 22, -8, 52, 0.2)
	S.icon(tab, "i_phone", 24, 10, 36, Color3.new(1, 1, 1), 53)
	S.title(tab, 0, 50, 80, 20, "CELULAR", 13, { ZIndex = 53, TextXAlignment = Enum.TextXAlignment.Center })
	S.text(tab, 62, 4, 18, 12, "M", S.BODYB, 10, S.C.gold, { ZIndex = 53 })
	self.tabBase = tab.Position
	tab.MouseEnter:Connect(function()
		S.tween(tab, S.SNAP, { Size = UDim2.fromOffset(100, 78) })
		S.sfx("tick")
	end)
	tab.MouseLeave:Connect(function()
		S.tween(tab, S.SNAP, { Size = UDim2.fromOffset(86, 78) })
	end)
	tab.Activated:Connect(function()
		self:toggle()
	end)
	self.tab = tab
	-- phone body (rotates with its children; no clipping inside rotated frames, so rounded corners come from UICorner)
	local ph = S.new("Frame", { Name = "Body", AnchorPoint = Vector2.new(0.2, 1), Position = UDim2.fromOffset(110 + 66, 720 + 700), Size = UDim2.fromOffset(330, 640), Rotation = -9, BackgroundColor3 = Color3.fromRGB(26, 20, 23), ZIndex = 54, Parent = root }, {
		S.new("UICorner", { CornerRadius = UDim.new(0, 38) }), S.new("UIStroke", { Color = Color3.fromRGB(70, 58, 62), Thickness = 2 }),
	})
	self.body = ph
	local scr = S.new("Frame", { Name = "Screen", Position = UDim2.fromOffset(12, 12), Size = UDim2.fromOffset(306, 616), BackgroundColor3 = Color3.fromRGB(18, 11, 14), ZIndex = 55, Parent = ph }, { S.new("UICorner", { CornerRadius = UDim.new(0, 28) }) })
	self.screen = scr
	S.new("ImageLabel", { Size = UDim2.fromOffset(306, 440), BackgroundTransparency = 1, Image = S.Config.Images.wallpaper, ScaleType = Enum.ScaleType.Crop, ZIndex = 55, Parent = scr }, { S.new("UICorner", { CornerRadius = UDim.new(0, 28) }) })
	local shade = S.rect(scr, 0, 0, 306, 616, Color3.fromRGB(8, 6, 7), 56, 0)
	S.new("UICorner", { CornerRadius = UDim.new(0, 28), Parent = shade })
	S.new("UIGradient", { Rotation = 90, Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.45), NumberSequenceKeypoint.new(0.3, 1), NumberSequenceKeypoint.new(0.46, 1), NumberSequenceKeypoint.new(0.6, 0.15), NumberSequenceKeypoint.new(1, 0.05) }), Parent = shade })
	S.new("Frame", { Position = UDim2.fromOffset(108, 8), Size = UDim2.fromOffset(90, 22), BackgroundColor3 = Color3.new(0, 0, 0), ZIndex = 58, Parent = scr }, { S.new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
	self.clock = S.title(scr, 24, 40, 260, 60, "00:00", 58, { ZIndex = 58 })
	self.place = S.text(scr, 26, 102, 260, 14, S.upper(S.Config.PhonePlace or "Ilha Verdejante"), S.BODYB, 12, S.C.gold, { ZIndex = 58 })
	-- app grid
	self.apps = {}
	for i, a in ipairs(S.Config.PhoneApps) do
		local x, y = 22 + ((i - 1) % 3) * 94, 300 + math.floor((i - 1) / 3) * 104
		local b = S.new("TextButton", { Name = a.id, Position = UDim2.fromOffset(x, y), Size = UDim2.fromOffset(78, 96), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 58, Parent = scr })
		local ic = S.box(b, 3, 0, 72, 72, 58)
		local out = S.shape(ic, "para", 0, 0, 72, 72, 8, S.C.gold, 58)
		S.shape(ic, "para", 2, 2, 68, 68, 7, Color3.fromRGB(28, 21, 24), 58)
		S.icon(ic, a.icon, 16, 16, 40, Color3.new(1, 1, 1), 59)
		if a.badge then
			S.rect(ic, 54, -4, 20, 20, S.C.red, 60)
		end
		S.title(b, 0, 76, 78, 18, S.upper(a.name), 13, { ZIndex = 59, TextXAlignment = Enum.TextXAlignment.Center })
		local sc = S.new("UIScale", { Scale = 0.6, Parent = b })
		b.MouseEnter:Connect(function()
			S.tween(ic, S.SNAP, { Position = UDim2.fromOffset(3, -3), Rotation = -3 })
			S.sfx("tick")
		end)
		b.MouseLeave:Connect(function()
			S.tween(ic, S.SNAP, { Position = UDim2.fromOffset(3, 0), Rotation = 0 })
		end)
		b.Activated:Connect(function()
			self:openApp(i)
		end)
		self.apps[i] = { button = b, scale = sc, outline = out, def = a, icon = ic }
	end
	-- mission widget
	local wid = S.shape(scr, "para", 18, 526, 270, 74, 8, Color3.fromRGB(0, 0, 0), 57, 0.45)
	S.text(wid, 16, 10, 240, 12, "MISSÃO ATIVA", S.BODYB, 10, S.C.gold, { ZIndex = 58 })
	self.mission = S.text(wid, 16, 26, 240, 36, "Nenhuma missão ativa", S.BODYB, 14, S.C.bone, { ZIndex = 58, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top })
	-- red wipe used for the hand-over to the full screen
	self.wipe = S.new("Frame", { Name = "Wipe", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(1900, 360), Size = UDim2.fromOffset(420, 1400), Rotation = 14, BackgroundColor3 = S.C.red, BorderSizePixel = 0, ZIndex = 90, Visible = false, Parent = self.hud.stage })
	task.spawn(function()
		while root.Parent do
			local t = os.date("*t")
			self.clock.Text = string.format("%02d:%02d", t.hour, t.min)
			task.wait(5)
		end
	end)
end

function Ph:setMission(text)
	self.mission.Text = (text and text ~= "") and text or "Nenhuma missão ativa"
end

function Ph:toggle()
	if self.open then
		self:close()
	else
		self:show()
	end
end

function Ph:show()
	local S = self.S
	if self.open then
		return
	end
	self.open = true
	S.tween(self.body, S.SLOW, { Position = UDim2.fromOffset(110 + 66, 708), Rotation = -2.5 })
	for i, a in ipairs(self.apps) do
		a.scale.Scale = 0.6
		task.delay(0.12 + i * 0.03, function()
			S.tween(a.scale, S.POP, { Scale = 1 })
		end)
	end
	self.focus = 1
	self:decorate()
	S.sfx("open")
end

function Ph:close(silent)
	local S = self.S
	if not self.open then
		return
	end
	self.open = false
	S.tween(self.body, S.EASE_OUT, { Position = UDim2.fromOffset(110 + 66, 720 + 700), Rotation = -9 })
	if not silent then
		S.sfx("close")
	end
end

function Ph:decorate()
	for i, a in ipairs(self.apps) do
		self.S.recolor(a.outline, i == self.focus and self.S.C.bone or self.S.C.gold)
	end
end

function Ph:openApp(i)
	local S = self.S
	local a = self.apps[i]
	if not a then
		return
	end
	S.sfx("select")
	local id = a.def.id
	local function handOver()
		self.wipe.Visible = true
		self.wipe.Position = UDim2.fromOffset(1700, 360)
		S.tween(self.wipe, TweenInfo.new(0.52, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { Position = UDim2.fromOffset(-420, 360) })
		task.delay(0.2, function()
			self:close(true)
			self.hud.openApp(id)
		end)
		task.delay(0.55, function()
			self.wipe.Visible = false
		end)
	end
	if S.Config.ReducedMotion then
		self:close(true)
		self.hud.openApp(id)
		return
	end
	-- icon grows to fill the phone screen
	local z = S.new("Frame", { Position = a.icon.Position + a.button.Position, Size = UDim2.fromOffset(72, 72), BackgroundColor3 = Color3.fromRGB(28, 21, 24), ZIndex = 70, Parent = self.screen }, { S.new("UICorner", { CornerRadius = UDim.new(0, 4) }) })
	S.icon(z, a.def.icon, 16, 16, 40, Color3.new(1, 1, 1), 71)
	S.tween(z, TweenInfo.new(0.32, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { Position = UDim2.fromOffset(0, 0), Size = UDim2.fromOffset(306, 616) })
	task.delay(0.32, function()
		handOver()
		task.delay(0.3, function()
			z:Destroy()
		end)
	end)
end

function Ph:key(k)
	if not self.open then
		return false
	end
	local n = #self.apps
	if k == "right" then
		self.focus = self.focus % n + 1
	elseif k == "left" then
		self.focus = (self.focus - 2) % n + 1
	elseif k == "down" then
		self.focus = math.min(n, self.focus + 3)
	elseif k == "up" then
		self.focus = math.max(1, self.focus - 3)
	elseif k == "ok" then
		self:openApp(self.focus)
		return true
	elseif k == "back" then
		self:close()
		return true
	else
		return false
	end
	self.S.sfx("tick")
	self:decorate()
	return true
end

return Ph
