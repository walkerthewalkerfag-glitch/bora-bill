--!nonstrict
-- CaptureUI: 5th battle button "CAPTURAR" + capsule picker, Carmesim style.
-- Put this ModuleScript in ReplicatedStorage and use it from a LocalScript (see CaptureExample.client.luau).
--
--   local ui = CaptureUI.new(playerGui)                 -- or pass your battle ScreenGui
--   ui:SetCapsules({ {id="eco", name="Cápsula Eco", count=12, rate=1, desc="Comum.", color=Color3.fromRGB(227,24,47)}, ... })
--   ui:SetEnemyHp(0.34)                                   -- 0..1, updates the chance bars
--   ui.Chosen:Connect(function(capsuleId) ... end)        -- fire your RemoteEvent here
--   ui:SetEnabled(false)                                  -- grey out while it is not your turn
--   ui:Destroy()
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")

export type Capsule = { id: string, name: string, count: number, rate: number, desc: string, color: Color3 }

local C = {
	ink = Color3.fromRGB(12, 10, 11),
	ink2 = Color3.fromRGB(36, 27, 31),
	red = Color3.fromRGB(227, 24, 47),
	deep = Color3.fromRGB(58, 10, 18),
	gold = Color3.fromRGB(245, 197, 66),
	goldLine = Color3.fromRGB(226, 207, 142),
	bone = Color3.fromRGB(246, 241, 234),
	dim = Color3.fromRGB(165, 156, 148),
	ok = Color3.fromRGB(69, 212, 131),
}
local DISPLAY = Font.new("rbxasset://fonts/families/Oswald.json", Enum.FontWeight.Bold, Enum.FontStyle.Normal)
local BODY = Font.new("rbxasset://fonts/families/RobotoCondensed.json", Enum.FontWeight.Medium, Enum.FontStyle.Normal)
local BODYB = Font.new("rbxasset://fonts/families/RobotoCondensed.json", Enum.FontWeight.Bold, Enum.FontStyle.Normal)
local SNAP = TweenInfo.new(0.14, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local POP = TweenInfo.new(0.26, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
local FADE = TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

local function new(class: string, props: { [string]: any }, children: { Instance }?): any
	local o = Instance.new(class)
	for k, v in props do
		if k ~= "Parent" then
			(o :: any)[k] = v
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

local function stroke(color: Color3, th: number): UIStroke
	return new("UIStroke", { Color = color, Thickness = th, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

local function label(text: string, font: Font, size: number, color: Color3, props: { [string]: any }?): TextLabel
	local p = { BackgroundTransparency = 1, Text = text, FontFace = font, TextSize = size, TextColor3 = color, TextXAlignment = Enum.TextXAlignment.Left }
	for k, v in pairs(props or {}) do
		p[k] = v
	end
	return new("TextLabel", p)
end

-- capsule drawn from frames: white body, coloured top half, black band, centre button
local function capsuleIcon(color: Color3, size: number): Frame
	local f = new("Frame", { Size = UDim2.fromOffset(size, size), BackgroundTransparency = 1 })
	local body = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1), ClipsDescendants = true, Parent = f }, {
		new("UICorner", { CornerRadius = UDim.new(1, 0) }),
		stroke(Color3.new(0, 0, 0), 2),
	})
	new("Frame", { Size = UDim2.fromScale(1, 0.5), BackgroundColor3 = color, BorderSizePixel = 0, Parent = body })
	new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.fromScale(0, 0.5), Size = UDim2.new(1, 0, 0, math.max(2, size // 12)), BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, Parent = body })
	new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.32, 0.32), BackgroundColor3 = Color3.new(1, 1, 1), Parent = f }, {
		new("UICorner", { CornerRadius = UDim.new(1, 0) }),
		stroke(Color3.new(0, 0, 0), 2),
	})
	return f
end

local CaptureUI = {}
CaptureUI.__index = CaptureUI

export type CaptureUI = typeof(setmetatable({} :: {
	gui: ScreenGui,
	root: Frame,
	button: TextButton,
	picker: Frame,
	list: Frame,
	Chosen: RBXScriptSignal,
	_chosen: BindableEvent,
	_capsules: { Capsule },
	_hp: number,
	_open: boolean,
	_enabled: boolean,
	_cards: { TextButton },
	_conns: { RBXScriptConnection },
	chance: (Capsule, number) -> number,
}, CaptureUI))

-- default catch chance (0..100); replace with your own formula through CaptureUI.new(parent, {chance = fn})
local function defaultChance(c: Capsule, hp: number): number
	return math.clamp(math.floor((1 - hp * 0.7) * 30 * c.rate + 0.5), 1, 99)
end

function CaptureUI.new(parent: Instance, opts: { chance: ((Capsule, number) -> number)?, position: UDim2? }?): CaptureUI
	local self = setmetatable({}, CaptureUI) :: any
	self._chosen = Instance.new("BindableEvent")
	self.Chosen = self._chosen.Event
	self._capsules = {}
	self._hp = 1
	self._open = false
	self._enabled = true
	self._cards = {}
	self._conns = {}
	self.chance = (opts and opts.chance) or defaultChance

	local gui = parent:IsA("ScreenGui") and parent or new("ScreenGui", { Name = "CaptureUI", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = 50, Parent = parent })
	self.gui = gui
	local root = new("Frame", {
		Name = "Capture", AnchorPoint = Vector2.new(1, 1), Position = (opts and opts.position) or UDim2.new(1, -26, 1, -26),
		Size = UDim2.fromOffset(560, 340), BackgroundTransparency = 1, Parent = gui,
	}, { new("UIScale", { Name = "Fit" }) })
	self.root = root

	-- ---------------- the CAPTURAR button (gold frame, crimson fill, capsule in a square)
	local btn = new("TextButton", {
		Name = "CaptureButton", AnchorPoint = Vector2.new(1, 1), Position = UDim2.fromScale(1, 1), Size = UDim2.fromOffset(380, 72),
		BackgroundColor3 = C.deep, AutoButtonColor = false, Text = "", Parent = root,
	}, {
		stroke(C.gold, 2),
		new("UIGradient", { Color = ColorSequence.new(C.deep, C.red), Rotation = 0 }),
		new("UIScale", { Name = "Press" }),
	})
	local sq = new("Frame", { Position = UDim2.fromOffset(12, 10), Size = UDim2.fromOffset(52, 52), BackgroundColor3 = Color3.fromRGB(20, 15, 0), Parent = btn }, { stroke(C.gold, 2) })
	local ic = capsuleIcon(C.red, 34)
	ic.AnchorPoint = Vector2.new(0.5, 0.5)
	ic.Position = UDim2.fromScale(0.5, 0.5)
	ic.Parent = sq
	label("CAPTURAR", DISPLAY, 28, C.bone, { Position = UDim2.fromOffset(78, 0), Size = UDim2.new(0, 160, 1, 0), Parent = btn })
	label("Escolha a cápsula", BODY, 13, Color3.fromRGB(255, 217, 221), { Position = UDim2.fromOffset(222, 0), Size = UDim2.new(0, 120, 1, 0), Parent = btn })
	label("05 · C", BODY, 11, C.dim, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 8), Size = UDim2.fromOffset(60, 14), TextXAlignment = Enum.TextXAlignment.Right, Parent = btn })
	self.button = btn

	-- ---------------- capsule picker panel
	local picker = new("Frame", {
		Name = "Picker", AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, 0, 1, -90), Size = UDim2.fromOffset(560, 240),
		BackgroundColor3 = C.ink, Visible = false, Parent = root,
	}, {
		stroke(C.goldLine, 2),
		new("UIGradient", { Color = ColorSequence.new(Color3.fromRGB(23, 18, 20), C.ink), Rotation = 110 }),
	})
	label("CÁPSULAS", DISPLAY, 22, C.bone, { Position = UDim2.fromOffset(22, 10), Size = UDim2.fromOffset(200, 28), Parent = picker })
	label("Chance com o HP atual · Esc fechar", BODY, 12, C.dim, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -20, 0, 16), Size = UDim2.fromOffset(260, 16), TextXAlignment = Enum.TextXAlignment.Right, Parent = picker })
	new("Frame", { Position = UDim2.fromOffset(0, 0), Size = UDim2.new(0, 6, 1, 0), BackgroundColor3 = C.red, BorderSizePixel = 0, Parent = picker })
	local list = new("Frame", { Position = UDim2.fromOffset(20, 48), Size = UDim2.new(1, -40, 0, 176), BackgroundTransparency = 1, Parent = picker }, {
		new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})
	self.picker = picker
	self.list = list

	-- ---------------- interactions
	local press = btn:FindFirstChild("Press") :: UIScale
	table.insert(self._conns, btn.MouseEnter:Connect(function()
		if self._enabled then
			TweenService:Create(btn, SNAP, { Position = UDim2.new(1, -6, 1, 0) }):Play()
		end
	end))
	table.insert(self._conns, btn.MouseLeave:Connect(function()
		TweenService:Create(btn, SNAP, { Position = UDim2.fromScale(1, 1) }):Play()
		TweenService:Create(press, SNAP, { Scale = 1 }):Play()
	end))
	table.insert(self._conns, btn.MouseButton1Down:Connect(function()
		if self._enabled then
			TweenService:Create(press, TweenInfo.new(0.07), { Scale = 0.96 }):Play()
		end
	end))
	table.insert(self._conns, btn.MouseButton1Up:Connect(function()
		TweenService:Create(press, POP, { Scale = 1 }):Play()
	end))
	table.insert(self._conns, btn.Activated:Connect(function()
		self:Toggle()
	end))
	table.insert(self._conns, UserInputService.InputBegan:Connect(function(input, processed)
		if processed or not self.root.Parent then
			return
		end
		local k = input.KeyCode
		if k == Enum.KeyCode.C or k == Enum.KeyCode.ButtonX then
			self:Toggle()
		elseif self._open and (k == Enum.KeyCode.Escape or k == Enum.KeyCode.Backspace or k == Enum.KeyCode.ButtonB) then
			self:Close()
		elseif self._open and k.Value >= Enum.KeyCode.One.Value and k.Value <= Enum.KeyCode.Nine.Value then
			self:_pick(k.Value - Enum.KeyCode.One.Value + 1)
		end
	end))
	-- keep 1:1 with the 1280x720 layout on any screen
	local fit = root:FindFirstChild("Fit") :: UIScale
	local function refit()
		local a = gui.AbsoluteSize
		if a.X > 0 then
			fit.Scale = math.clamp(math.min(a.X / 1280, a.Y / 720), 0.55, 2)
		end
	end
	table.insert(self._conns, gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(refit))
	refit()
	return self
end

function CaptureUI:_render()
	for _, c in self._cards do
		c:Destroy()
	end
	table.clear(self._cards)
	for i, cap in self._capsules do
		local has = cap.count > 0
		local ch = self.chance(cap, self._hp)
		local card = new("TextButton", {
			Name = cap.id, LayoutOrder = i, Size = UDim2.fromOffset(96, 176), AutoButtonColor = false, Text = "",
			BackgroundColor3 = C.ink2, BackgroundTransparency = has and 0 or 0.5, Parent = self.list,
		}, {
			new("UIGradient", { Color = ColorSequence.new(Color3.fromRGB(36, 27, 31), Color3.fromRGB(15, 11, 13)), Rotation = 80 }),
		})
		local st = stroke(C.gold, 2)
		st.Transparency = 1
		st.Parent = card
		local icon = capsuleIcon(cap.color, 52)
		icon.AnchorPoint = Vector2.new(0.5, 0)
		icon.Position = UDim2.new(0.5, 0, 0, 10)
		icon.Parent = card
		local t = has and 0 or 0.55
		label(string.upper(cap.name), DISPLAY, 14, C.bone, { Position = UDim2.fromOffset(4, 68), Size = UDim2.new(1, -8, 0, 32), TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Center, TextYAlignment = Enum.TextYAlignment.Top, TextTransparency = t, Parent = card })
		label("× " .. cap.count, BODYB, 12, C.gold, { Position = UDim2.fromOffset(0, 100), Size = UDim2.new(1, 0, 0, 14), TextXAlignment = Enum.TextXAlignment.Center, TextTransparency = t, Parent = card })
		label(cap.desc, BODY, 11, C.dim, { Position = UDim2.fromOffset(4, 116), Size = UDim2.new(1, -8, 0, 26), TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Center, TextTransparency = t, Parent = card })
		local bar = new("Frame", { Position = UDim2.fromOffset(8, 146), Size = UDim2.new(1, -16, 0, 6), BackgroundColor3 = Color3.fromRGB(42, 34, 37), BorderSizePixel = 0, Parent = card })
		new("Frame", { Size = UDim2.fromScale(ch / 100, 1), BackgroundColor3 = C.ok, BorderSizePixel = 0, BackgroundTransparency = t, Parent = bar })
		label(ch .. "%", BODYB, 11, C.dim, { Position = UDim2.fromOffset(0, 156), Size = UDim2.new(1, 0, 0, 14), TextXAlignment = Enum.TextXAlignment.Center, Parent = card })
		card.MouseEnter:Connect(function()
			if has then
				TweenService:Create(card, SNAP, { Position = UDim2.fromOffset(0, -4) }):Play()
				TweenService:Create(st, SNAP, { Transparency = 0 }):Play()
			end
		end)
		card.MouseLeave:Connect(function()
			TweenService:Create(card, SNAP, { Position = UDim2.fromOffset(0, 0) }):Play()
			TweenService:Create(st, SNAP, { Transparency = 1 }):Play()
		end)
		card.Activated:Connect(function()
			self:_pick(i)
		end)
		table.insert(self._cards, card)
	end
end

function CaptureUI:_pick(i: number)
	local cap = self._capsules[i]
	if not self._open or not cap then
		return
	end
	if cap.count <= 0 then
		-- deny: short shake, nothing happens
		local card = self._cards[i]
		local x = card.Position
		local t = TweenService:Create(card, TweenInfo.new(0.05, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, 3, true), { Position = x + UDim2.fromOffset(5, 0) })
		t:Play()
		return
	end
	self:Close()
	self._chosen:Fire(cap.id)
end

function CaptureUI:SetCapsules(list: { Capsule })
	self._capsules = list
	self:_render()
end

function CaptureUI:SetEnemyHp(fraction: number)
	self._hp = math.clamp(fraction, 0, 1)
	if self._open then
		self:_render()
	end
end

function CaptureUI:SetEnabled(on: boolean)
	self._enabled = on
	self.button.Active = on
	self.button.BackgroundTransparency = on and 0 or 0.5
	if not on then
		self:Close()
	end
end

function CaptureUI:Open()
	if self._open or not self._enabled then
		return
	end
	self._open = true
	self:_render()
	local p = self.picker
	p.Visible = true
	p.Position = UDim2.new(1, 0, 1, -74)
	TweenService:Create(p, POP, { Position = UDim2.new(1, 0, 1, -90) }):Play()
	if GuiService.SelectedObject == nil and UserInputService.GamepadEnabled and self._cards[1] then
		GuiService.SelectedObject = self._cards[1]
	end
end

function CaptureUI:Close()
	if not self._open then
		return
	end
	self._open = false
	local p = self.picker
	local tw = TweenService:Create(p, FADE, { Position = UDim2.new(1, 0, 1, -74) })
	tw.Completed:Once(function()
		if not self._open then
			p.Visible = false
		end
	end)
	tw:Play()
	if GuiService.SelectedObject and GuiService.SelectedObject:IsDescendantOf(p) then
		GuiService.SelectedObject = nil
	end
end

function CaptureUI:Toggle()
	if self._open then
		self:Close()
	else
		self:Open()
	end
end

function CaptureUI:Destroy()
	for _, c in self._conns do
		c:Disconnect()
	end
	self._chosen:Destroy()
	self.root:Destroy()
end

return CaptureUI
