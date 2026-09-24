--!nonstrict
-- PVHud: creates the HUD (ScreenGui 1280x720 scaled to any screen), the phone and every screen, routes
-- navigation (Voltar / Backspace / B) and input (mouse, touch, keyboard, gamepad).
--
-- From your own LocalScripts:
--   local Hud = require(ReplicatedStorage.PVHudKit.PVHud)
--   Hud.open("ficha")            -- "moves", "ficha", "ecodex", "perfil"
--   Hud.close()
--   Hud.learnMove("oni")         -- level-up banner with "Equipar agora" / "Depois"
--   Hud.setMission("Encontrar o Nico no Círculo de Pedra")
--   Hud.AppOpened.Event:Connect(function(appId) ... end)   -- apps you already have (bag, settings, map)
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")

local root = script.Parent
local S = require(root:WaitForChild("PVStyle"))
local Data = require(root:WaitForChild("PVData"))

local Hud = {}
Hud.AppOpened = Instance.new("BindableEvent")
local started = false

function Hud.start()
	if started then
		return
	end
	started = true
	local player = Players.LocalPlayer
	local pg = player:WaitForChild("PlayerGui")
	local gui = S.new("ScreenGui", { Name = "PVHud", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = S.Config.DisplayOrder, ZIndexBehavior = Enum.ZIndexBehavior.Global, Parent = pg })
	pcall(function()
		gui.ScreenInsets = Enum.ScreenInsets.None
	end)
	local stage = S.new("Frame", { Name = "Stage", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(1280, 720), BackgroundTransparency = 1, Parent = gui })
	local fit = S.new("UIScale", { Parent = stage })
	local function refit()
		local a = gui.AbsoluteSize
		if a.X > 0 then
			fit.Scale = math.min(a.X / 1280, a.Y / 720)
		end
	end
	gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(refit)
	refit()
	-- drag layer: same coordinate space as InputObject.Position (below the top bar)
	local dragGui = S.new("ScreenGui", { Name = "PVHudDrag", ResetOnSpawn = false, IgnoreGuiInset = false, DisplayOrder = S.Config.DisplayOrder + 1, Parent = pg })

	local ctx = { S = S, data = Data, stage = stage, dragGui = dragGui, playerGui = pg }
	function ctx.scale()
		return fit.Scale
	end
	local screens, stack, current = {}, {}, nil

	local function showScreen(name, push)
		local sc = screens[name]
		if not sc then
			return
		end
		if current == name then
			return
		end
		if current then
			local old = screens[current]
			if push then
				table.insert(stack, current)
			end
			S.tween(old.root, S.SNAP, { GroupTransparency = 1 })
			task.delay(0.15, function()
				if current ~= old.screenId then
					old.root.Visible = false
				end
			end)
		end
		current = name
		sc.screenId = name
		if sc.onShow then
			sc:onShow()
		end
		sc.root.Visible = true
		sc.root.GroupTransparency = 1
		sc.root.Position = UDim2.fromOffset(24, 0)
		S.tween(sc.root, S.EASE_OUT, { GroupTransparency = 0, Position = UDim2.fromOffset(0, 0) })
		ctx.phone.tab.Visible = false
	end
	local function closeAll()
		if current then
			local old = screens[current]
			S.tween(old.root, S.SNAP, { GroupTransparency = 1 })
			task.delay(0.15, function()
				old.root.Visible = false
			end)
		end
		current = nil
		table.clear(stack)
		ctx.phone.tab.Visible = true
	end
	function ctx.go(name)
		showScreen(name, true)
	end
	function ctx.back()
		local prev = table.remove(stack)
		if prev then
			showScreen(prev, false)
		else
			closeAll()
			ctx.phone:show()
		end
	end
	local APP_SCREEN = { ficha = "ficha", ecodex = "ecodex", perfil = "perfil", moves = "moves" }
	function ctx.openApp(id)
		if APP_SCREEN[id] then
			table.clear(stack)
			showScreen(APP_SCREEN[id], false)
		else
			Hud.AppOpened:Fire(id)
		end
	end

	ctx.phone = require(root.PVPhone).new(ctx)
	screens.moves = require(root.PVMoves).new(ctx)
	screens.ficha = require(root.PVFicha).new(ctx)
	screens.ecodex = require(root.PVEcodex).new(ctx)
	screens.perfil = require(root.PVPerfil).new(ctx)

	function Hud.open(name)
		table.clear(stack)
		ctx.phone:close(true)
		showScreen(name, false)
	end
	Hud.close = closeAll
	function Hud.learnMove(id)
		Hud.open("moves")
		screens.moves:learn(id)
	end
	function Hud.setMission(text)
		ctx.phone:setMission(text)
	end
	function Hud.isOpen()
		return current ~= nil or ctx.phone.open
	end
	Data.Changed.Event:Connect(function()
		if current and screens[current].refresh then
			screens[current]:refresh()
		end
	end)

	-- ------------------------------------------------------------------ input
	local KEYS = {
		[Enum.KeyCode.Up] = "up", [Enum.KeyCode.Down] = "down", [Enum.KeyCode.Left] = "left", [Enum.KeyCode.Right] = "right",
		[Enum.KeyCode.DPadUp] = "up", [Enum.KeyCode.DPadDown] = "down", [Enum.KeyCode.DPadLeft] = "left", [Enum.KeyCode.DPadRight] = "right",
		[Enum.KeyCode.Return] = "ok", [Enum.KeyCode.ButtonA] = "ok", [Enum.KeyCode.Backspace] = "back", [Enum.KeyCode.ButtonB] = "back",
		[Enum.KeyCode.Q] = "lb", [Enum.KeyCode.E] = "rb", [Enum.KeyCode.ButtonL1] = "lb", [Enum.KeyCode.ButtonR1] = "rb",
		[Enum.KeyCode.One] = "1", [Enum.KeyCode.Two] = "2", [Enum.KeyCode.Three] = "3", [Enum.KeyCode.Four] = "4",
		[Enum.KeyCode.Slash] = "search", [Enum.KeyCode.ButtonX] = "act",
	}
	UserInputService.InputBegan:Connect(function(input, processed)
		if UserInputService:GetFocusedTextBox() then
			return
		end
		if input.KeyCode == S.Config.PhoneKey or input.KeyCode == S.Config.PhoneGamepadKey then
			if current then
				closeAll()
			end
			ctx.phone:toggle()
			return
		end
		local k = KEYS[input.KeyCode]
		if not k then
			return
		end
		-- Esc is reserved by Roblox; Backspace / B do "Voltar"
		if current then
			local sc = screens[current]
			if (GuiService.SelectedObject == nil or k ~= "ok") and sc:key(k) then
				return
			end
			if k == "back" then
				S.sfx("close")
				ctx.back()
			end
		elseif ctx.phone.open then
			if not processed or k == "back" then
				ctx.phone:key(k)
			end
		end
	end)
	UserInputService.InputChanged:Connect(function(input)
		local t = input.UserInputType
		if (t == Enum.UserInputType.MouseMovement or t == Enum.UserInputType.Touch) and current == "moves" then
			screens.moves:inputChanged(input)
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		local t = input.UserInputType
		if (t == Enum.UserInputType.MouseButton1 or t == Enum.UserInputType.Touch) and current == "moves" then
			screens.moves:inputEnded(input)
		end
	end)
	Hud.ctx = ctx
	Hud.screens = screens
end

return Hud
