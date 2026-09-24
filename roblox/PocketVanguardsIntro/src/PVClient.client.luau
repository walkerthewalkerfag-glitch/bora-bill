--!nocheck
-- Pocket Vanguards intro (client). Builds the GUI, runs the timeline, plays the sounds and talks to the
-- save service. Everything visual comes from SceneData (the same scene the web prototype plays).
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ContentProvider = game:GetService("ContentProvider")
local SoundService = game:GetService("SoundService")
local StarterGui = game:GetService("StarterGui")
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")
local GuiService = game:GetService("GuiService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local root = script.Parent
local PVCore = require(root:WaitForChild("PVCore"))
local PVController = require(root:WaitForChild("PVController"))
local PVRender = require(root:WaitForChild("PVRender"))
local Config = require(root:WaitForChild("PVConfig"))
local SceneData = require(root:WaitForChild("SceneData"))

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local scene = HttpService:JSONDecode(SceneData.scene)
local assets = HttpService:JSONDecode(SceneData.assets)

-- ---------------------------------------------------------------- GUI
local gui = Instance.new("ScreenGui")
gui.Name = "PocketVanguardsIntro"
gui.IgnoreGuiInset = true
pcall(function()
	gui.ScreenInsets = Enum.ScreenInsets.None
end)
gui.ResetOnSpawn = false
gui.DisplayOrder = Config.DisplayOrder or 1000
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local backdrop = Instance.new("Frame")
backdrop.Name = "Backdrop"
backdrop.BackgroundColor3 = Color3.new(0, 0, 0)
backdrop.BorderSizePixel = 0
backdrop.Size = UDim2.fromScale(1, 1)
backdrop.ZIndex = 1
backdrop.Parent = gui

local stage = Instance.new("Frame")
stage.Name = "Stage"
stage.AnchorPoint = Vector2.new(0.5, 0.5)
stage.Position = UDim2.fromScale(0.5, 0.5)
stage.Size = UDim2.fromOffset(1280, 720)
stage.BackgroundColor3 = Color3.fromRGB(5, 4, 9)
stage.BorderSizePixel = 0
stage.ClipsDescendants = true
stage.ZIndex = 2
stage.Visible = false
stage.Parent = gui
local fit = Instance.new("UIScale")
fit.Parent = stage

local function refit()
	local a = gui.AbsoluteSize
	if a.X > 0 and a.Y > 0 then
		fit.Scale = math.min(a.X / 1280, a.Y / 720)
	end
end
gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(refit)
gui.Parent = playerGui
refit()

local core = PVCore.new(scene, assets)
local render = PVRender.new(core, stage, Config.Images)

-- ---------------------------------------------------------------- audio
local audio = Instance.new("Folder")
audio.Name = "PVIntroAudio"
audio.Parent = SoundService
local gMusic = Instance.new("SoundGroup")
gMusic.Name = "PVMusic"
gMusic.Parent = audio
local gSfx = Instance.new("SoundGroup")
gSfx.Name = "PVSfx"
gSfx.Parent = audio

local function mkSound(name, id, group, vol)
	local s = Instance.new("Sound")
	s.Name = name
	s.SoundId = id or ""
	s.SoundGroup = group
	s.Volume = vol or 1
	s.Parent = audio
	return s
end
local S = Config.Sounds
local music = mkSound("Music", S.music, gMusic, Config.MusicVolume)
music.Looped = true
local loopOk = pcall(function()
	music.PlaybackRegionsEnabled = true
	music.LoopRegion = NumberRange.new(Config.MusicLoop[1], Config.MusicLoop[2])
end)
local introSfx = mkSound("IntroSfx", S.intro, gSfx, Config.SfxVolume)
local cutSfx = mkSound("CutSfx", S.cut, gSfx, Config.SfxVolume)
local uiSprite = mkSound("UiSprite", S.ui, gSfx, Config.UiVolume)
local spriteOk = pcall(function()
	uiSprite.PlaybackRegionsEnabled = true
end)
local musicTween
local introStartedAt

-- ---------------------------------------------------------------- save service
local remote = ReplicatedStorage:WaitForChild(Config.RemoteName, 8)

local function call(action, a)
	if not remote then
		return nil
	end
	local ok, res = pcall(function()
		return remote:InvokeServer(action, a)
	end)
	if ok then
		return res
	end
	warn("[PocketVanguardsIntro] save service:", res)
	return nil
end

local finishedEvent = root:FindFirstChild("IntroFinished")
if not finishedEvent then
	finishedEvent = Instance.new("BindableEvent")
	finishedEvent.Name = "IntroFinished"
	finishedEvent.Parent = root
end

-- ---------------------------------------------------------------- host (what PVController calls)
local host = {}
local ctl
local storeQueued = false

function host:unlock() end

function host:volumes(s)
	local m = s.muted and 0 or 1
	gMusic.Volume = s.music / 100 * m
	gSfx.Volume = s.sfx / 100 * m
end

function host:playIntro(off)
	if musicTween then
		musicTween:Cancel()
		musicTween = nil
	end
	music:Stop()
	introSfx:Stop()
	cutSfx:Stop()
	music.Volume = Config.MusicVolume
	music.TimePosition = math.min(off, Config.MusicLoop[2] - 0.05)
	music:Play()
	if off < 12.3 then
		introSfx.TimePosition = off
		introSfx:Play()
	end
	introStartedAt = os.clock() - off
end

function host:playCut()
	cutSfx.TimePosition = 0
	cutSfx:Play()
	musicTween = TweenService:Create(music, TweenInfo.new(0.7, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out, 0, false, 0.2), { Volume = 0 })
	musicTween:Play()
end

function host:sfx(name)
	local r = SceneData.uiSprite[name]
	if not r or uiSprite.SoundId == "" or not spriteOk then
		return
	end
	local c = uiSprite:Clone()
	c.PlaybackRegion = NumberRange.new(r[1], r[2])
	c.Parent = audio
	c.TimePosition = r[1]
	c:Play()
	task.delay(r[2] - r[1] + 0.2, function()
		c:Destroy()
	end)
end

function host:store(s)
	if storeQueued then
		return
	end
	storeQueued = true
	task.delay(1, function()
		storeQueued = false
		call("settings", { music = s.music, sfx = s.sfx, shake = s.shake, skipIntro = s.skipIntro, muted = s.muted, sel = s.sel })
	end)
end

function host:newSave(i)
	-- optimistic: show it now, the server answers with the stored copy
	local draft = { name = player.DisplayName, meta = Config.NewSaveMeta }
	task.spawn(function()
		local res = call("save", i)
		if type(res) == "table" and type(res.name) == "string" and ctl.s.saves[i] then
			ctl.s.saves[i] = { name = res.name, meta = tostring(res.meta or "") }
		end
	end)
	return draft
end

function host:remove(i)
	task.spawn(call, "delete", i)
end

local cleanup
function host:finished(sel, save)
	task.spawn(call, "play", sel)
	finishedEvent:Fire(sel, save or nil)
	-- fade the whole intro out, revealing the game underneath
	local now = ctl.now
	for _, id in ipairs({ "intro", "vig", "grain" }) do
		core:tween(core:id(id), PVController.K.op, 0, { Config.FadeOut, { 0.4, 0, 0.2, 1 } }, now)
	end
	local ti = TweenInfo.new(Config.FadeOut, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(stage, ti, { BackgroundTransparency = 1 }):Play()
	TweenService:Create(backdrop, ti, { BackgroundTransparency = 1 }):Play()
	task.delay(Config.FadeOut + 0.1, cleanup)
end

ctl = PVController.new(core, host)

-- ---------------------------------------------------------------- saved state
task.spawn(function()
	local data = call("load")
	if type(data) ~= "table" then
		return
	end
	local s = ctl.s
	if type(data.saves) == "table" then
		for i = 1, 3 do
			local v = data.saves[i] or data.saves[tostring(i)]
			if type(v) == "table" and type(v.name) == "string" then
				s.saves[i] = { name = v.name, meta = tostring(v.meta or "") }
			else
				s.saves[i] = false
			end
		end
	end
	local st = data.settings
	if type(st) == "table" then
		if type(st.music) == "number" then
			s.music = math.clamp(math.floor(st.music + 0.5), 0, 100)
		end
		if type(st.sfx) == "number" then
			s.sfx = math.clamp(math.floor(st.sfx + 0.5), 0, 100)
		end
		for _, k in ipairs({ "shake", "skipIntro", "muted" }) do
			if type(st[k]) == "boolean" then
				s[k] = st[k]
			end
		end
		if type(st.sel) == "number" and st.sel >= 1 and st.sel <= 3 then
			s.sel = math.floor(st.sel)
		end
	end
	host:volumes(s)
end)
host:volumes(ctl.s)

-- ---------------------------------------------------------------- hide the default HUD while the intro runs
local coreGuiWas = {}
for _, t in ipairs({ Enum.CoreGuiType.PlayerList, Enum.CoreGuiType.Health, Enum.CoreGuiType.Backpack, Enum.CoreGuiType.Chat, Enum.CoreGuiType.EmotesMenu }) do
	local ok, on = pcall(function()
		return StarterGui:GetCoreGuiEnabled(t)
	end)
	coreGuiWas[t] = ok and on
	pcall(function()
		StarterGui:SetCoreGuiEnabled(t, false)
	end)
end
local controls
pcall(function()
	controls = require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule", 5)):GetControls()
	controls:Disable()
end)

-- ---------------------------------------------------------------- input
-- InputObject.Position is measured below the top bar; this ScreenGui covers the whole screen,
-- so add the inset and place the letterboxed stage ourselves (independent of AbsolutePosition quirks)
local function toStage(pos)
	local inset = GuiService:GetGuiInset()
	local V = gui.AbsoluteSize
	local k = fit.Scale
	local x = pos.X + inset.X - (V.X - 1280 * k) / 2
	local y = pos.Y + inset.Y - (V.Y - 720 * k) / 2
	return x / k, y / k
end
local conns = {}
table.insert(conns, UserInputService.InputBegan:Connect(function(input, processed)
	local t = input.UserInputType
	if t == Enum.UserInputType.MouseButton1 or t == Enum.UserInputType.Touch then
		if processed then
			return
		end
		local x, y = toStage(input.Position)
		ctl:pointerDown(x, y)
	elseif input.KeyCode == Enum.KeyCode.Return or input.KeyCode == Enum.KeyCode.Space or input.KeyCode == Enum.KeyCode.ButtonA then
		if ctl.s.phase == "gate" then
			ctl:click("start")
		end
	elseif input.KeyCode == Enum.KeyCode.Backspace or input.KeyCode == Enum.KeyCode.ButtonB then
		if ctl.s.modal ~= "" then
			ctl:closeDlg()
		end
	end
end))
table.insert(conns, UserInputService.InputChanged:Connect(function(input)
	local t = input.UserInputType
	if t == Enum.UserInputType.MouseMovement then
		local x, y = toStage(input.Position)
		ctl:pointerMove(x, y)
	elseif t == Enum.UserInputType.Touch and ctl.drag ~= "" then
		local x, y = toStage(input.Position)
		ctl:pointerMove(x, y)
	end
end))
table.insert(conns, UserInputService.InputEnded:Connect(function(input)
	local t = input.UserInputType
	if t == Enum.UserInputType.MouseButton1 or t == Enum.UserInputType.Touch then
		local x, y = toStage(input.Position)
		ctl:pointerUp(x, y, t == Enum.UserInputType.Touch)
	end
end))

-- ---------------------------------------------------------------- frame loop
local pointing = false
local function frame()
	local now = os.clock()
	ctl:update(now)
	core:evaluate(now)
	render:update(ctl.binds)
	local want = ctl:cursor()
	if want ~= pointing then
		pointing = want
		UserInputService.MouseIcon = want and "rbxasset://SystemCursors/PointingHand" or ""
	end
	-- safety net for clients without playback regions: keep the music inside its loop
	if not loopOk and music.IsPlaying and introStartedAt and now - introStartedAt > Config.MusicLoop[2] + 0.5 then
		if music.TimePosition < Config.MusicLoop[1] - 0.5 then
			music.TimePosition = Config.MusicLoop[1] + (music.TimePosition % 1)
		end
	end
end

cleanup = function()
	RunService:UnbindFromRenderStep("PocketVanguardsIntro")
	for _, c in ipairs(conns) do
		c:Disconnect()
	end
	if pointing then
		UserInputService.MouseIcon = ""
	end
	for t, on in pairs(coreGuiWas) do
		if on then
			pcall(function()
				StarterGui:SetCoreGuiEnabled(t, true)
			end)
		end
	end
	if controls then
		pcall(function()
			controls:Enable()
		end)
	end
	task.delay(2, function()
		audio:Destroy()
	end)
	gui:Destroy()
end

-- preload images, fonts and sounds before the gate appears (never wait forever)
local preload = render:instances()
for _, s in ipairs(audio:GetChildren()) do
	if s:IsA("Sound") then
		table.insert(preload, s)
	end
end
local done = false
task.spawn(function()
	pcall(function()
		ContentProvider:PreloadAsync(preload)
	end)
	done = true
end)
local t0 = os.clock()
while not done and os.clock() - t0 < Config.PreloadTimeout do
	task.wait()
end
stage.Visible = true
RunService:BindToRenderStep("PocketVanguardsIntro", Enum.RenderPriority.Last.Value, frame)
