--!nonstrict
-- DomainVFX: tudo o que se vê e ouve da Expansão de Domínio (roda em cada cliente).
-- Tempos em Config.Timeline (padrão):
--   0.00s  cena: close no rosto, tira a venda, olhos acendem, close nos dedos cruzados (DomainCinematic)
--   1.35s  estalo dos dedos: túnel de linhas de velocidade + "領域展開 / EXPANSÃO DE DOMÍNIO"
--   1.70s  a esfera preta cresce a partir de quem lançou (onda no chão + borda de campo de força)
--   2.70s  o domínio fecha: respingo branco na tela e quem estava dentro vai para a DIMENSÃO do vazio
--          (céu estrelado, névoa, chão espelhado como água, respingos brancos, correntes de luz)
--   2.70–3.40s  o buraco negro abre: disco, gás girando, anel dourado/azulado, fumaça com brilhos
--   2.85s  "無量空処 / VAZIO INFINITO"
--   alvos: tela com ruído de informação, flashes, blur, tremor e partículas na cabeça
--   fim:   o vazio quebra (flash), a esfera encolhe e a iluminação volta ao normal
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local SoundService = game:GetService("SoundService")

local Config = require(script.Parent:WaitForChild("DomainConfig"))
local Cinematic = require(script.Parent:WaitForChild("DomainCinematic"))
local IMG, SND = Config.Images, Config.Sounds
local TL = Config.Timeline
local player = Players.LocalPlayer

local VFX = {}
local domains = {}

-- ------------------------------------------------------------------ helpers
local function new(class, props)
	local o = Instance.new(class)
	local parent = props.Parent
	props.Parent = nil
	for k, v in pairs(props) do
		o[k] = v
	end
	if parent then
		o.Parent = parent
	end
	return o
end
local function clamp01(x)
	return math.clamp(x, 0, 1)
end
local function outQuad(x)
	return 1 - (1 - x) * (1 - x)
end
local function inOutSine(x)
	return -(math.cos(math.pi * x) - 1) / 2
end
local function outBack(x)
	local c1 = 1.70158
	return 1 + (c1 + 1) * (x - 1) ^ 3 + c1 * (x - 1) ^ 2
end
-- 0..1..0 envelope: fades in over fi after a, holds, fades out over fo ending at b
local function window(t, a, b, fi, fo)
	if t < a or t > b then
		return 0
	end
	return math.min(clamp01((t - a) / fi), clamp01((b - t) / fo))
end
local function serverNow()
	return workspace:GetServerTimeNow()
end
local function hasId(id)
	return id and id ~= "" and id ~= "rbxassetid://0"
end
local function rootOf(m)
	return m and (m:FindFirstChild("HumanoidRootPart") or m.PrimaryPart)
end

local gui
local function getGui()
	if gui and gui.Parent then
		return gui
	end
	gui = new("ScreenGui", { Name = "PVDomainFX", IgnoreGuiInset = true, ResetOnSpawn = false, DisplayOrder = 40, Parent = player:WaitForChild("PlayerGui") })
	pcall(function()
		gui.ScreenInsets = Enum.ScreenInsets.None
	end)
	return gui
end

local function part(props)
	local p = new("Part", { Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false, TopSurface = Enum.SurfaceType.Smooth, BottomSurface = Enum.SurfaceType.Smooth })
	for k, v in pairs(props) do
		if k ~= "Parent" then
			p[k] = v
		end
	end
	p.Parent = props.Parent
	return p
end

local function sound(id, parent, volume, looped, is3D, radius)
	if not hasId(id) then
		return nil
	end
	local s = new("Sound", { SoundId = id, Volume = volume * Config.Volume, Looped = looped or false, Parent = parent })
	if is3D then
		s.RollOffMode = Enum.RollOffMode.InverseTapered
		s.RollOffMinDistance = radius * 0.6
		s.RollOffMaxDistance = radius * 5
	end
	return s
end

local TITLE_FONT = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Heavy)
local SUB_FONT = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Bold)
local function label(parent, text, y, size, font)
	local l = new("TextLabel", {
		AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, y), Size = UDim2.new(1, 0, 0, size * 1.3), BackgroundTransparency = 1,
		Text = text, TextSize = size, FontFace = font, TextColor3 = Color3.new(1, 1, 1), TextTransparency = 1, Parent = parent,
	})
	new("UIStroke", { Color = Color3.new(0, 0, 0), Thickness = math.max(2, size / 14), Transparency = 1, Parent = l })
	return l
end
local function setLabelAlpha(l, a)
	l.TextTransparency = 1 - a
	l.UIStroke.Transparency = 1 - a
end

-- ------------------------------------------------------------------ lighting of the void (only while the camera is inside a domain)
local lit = nil
local LIGHT_PROPS = { "Ambient", "OutdoorAmbient", "Brightness", "FogColor", "FogStart", "FogEnd", "GlobalShadows", "EnvironmentDiffuseScale", "EnvironmentSpecularScale", "ExposureCompensation" }
local function applyVoid(radius)
	if lit then
		return
	end
	lit = { props = {}, moved = {}, made = {} }
	for _, k in ipairs(LIGHT_PROPS) do
		local ok, v = pcall(function()
			return Lighting[k]
		end)
		if ok then
			lit.props[k] = v
		end
	end
	for _, c in ipairs(Lighting:GetChildren()) do
		if c:IsA("Sky") or c:IsA("Atmosphere") then
			table.insert(lit.moved, c)
			c.Parent = nil
		end
	end
	local clouds = workspace.Terrain:FindFirstChildOfClass("Clouds")
	if clouds and clouds.Enabled then
		lit.clouds = clouds
		clouds.Enabled = false
	end
	local set = {
		Ambient = Config.VoidAmbient, OutdoorAmbient = Config.VoidAmbient, Brightness = 0.4, FogColor = Config.FogColor, FogStart = radius * 0.85, FogEnd = radius * 1.2,
		GlobalShadows = false, EnvironmentDiffuseScale = 0, EnvironmentSpecularScale = 0.4, ExposureCompensation = 0,
	}
	for k, v in pairs(set) do
		pcall(function()
			Lighting[k] = v
		end)
	end
	table.insert(lit.made, new("Sky", {
		Name = "PVVoidSky", SkyboxFt = IMG.sky_ft, SkyboxBk = IMG.sky_bk, SkyboxLf = IMG.sky_lf, SkyboxRt = IMG.sky_rt, SkyboxUp = IMG.sky_up, SkyboxDn = IMG.sky_dn,
		CelestialBodiesShown = false, StarCount = 0, Parent = Lighting,
	}))
	table.insert(lit.made, new("ColorCorrectionEffect", { Name = "PVVoidCC", TintColor = Color3.fromRGB(236, 226, 255), Contrast = 0.12, Saturation = -0.12, Parent = Lighting }))
	table.insert(lit.made, new("BloomEffect", { Name = "PVVoidBloom", Intensity = 0.9, Size = 36, Threshold = 0.85, Parent = Lighting }))
end
local function revertVoid()
	if not lit then
		return
	end
	for _, o in ipairs(lit.made) do
		o:Destroy()
	end
	for k, v in pairs(lit.props) do
		pcall(function()
			Lighting[k] = v
		end)
	end
	for _, c in ipairs(lit.moved) do
		c.Parent = Lighting
	end
	if lit.clouds then
		lit.clouds.Enabled = true
	end
	lit = nil
end

-- ------------------------------------------------------------------ one domain
local Dom = {}
Dom.__index = Dom

function Dom.new(d)
	local self = setmetatable({ d = d, R = d.radius, open = d.openAt - d.startAt, targets = {}, specks = {}, victim = false, gasRot = 0, lastFlicker = 0, nextFlash = 0 }, Dom)
	local R, c = self.R, d.center
	local folder = new("Folder", { Name = "PVDomain_" .. d.id, Parent = workspace })
	self.folder = folder
	-- the barrier: flat black ball (Neon black = no shading) + shimmering force-field edge
	self.shell = part({ Name = "Shell", Shape = Enum.PartType.Ball, Material = Enum.Material.Neon, Color = Color3.new(0, 0, 0), Size = Vector3.one * 0.2, Position = c, Parent = folder })
	self.edge = part({ Name = "Edge", Shape = Enum.PartType.Ball, Material = Enum.Material.ForceField, Color = Color3.fromRGB(176, 120, 255), Size = Vector3.one * 0.2, Position = c, Parent = folder })
	-- ground: shockwave ring + mirror floor
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local ignore = { folder }
	for _, p in ipairs(Players:GetPlayers()) do
		if p.Character then
			table.insert(ignore, p.Character)
		end
	end
	if d.caster then
		table.insert(ignore, d.caster)
	end
	params.FilterDescendantsInstances = ignore
	local y = d.floorY
	if not y then
		local hit = workspace:Raycast(c + Vector3.new(0, 2, 0), Vector3.new(0, -80, 0), params)
		y = hit and hit.Position.Y or (c.Y - 3)
	end
	self.floorY = y
	local flat = CFrame.new(c.X, y, c.Z) * CFrame.Angles(0, 0, math.pi / 2)
	self.flat = flat
	self.wave = part({ Name = "Wave", Shape = Enum.PartType.Cylinder, Material = Enum.Material.Neon, Color = Color3.fromRGB(226, 206, 255), Size = Vector3.new(0.4, 1, 1), CFrame = flat * CFrame.new(0.25, 0, 0), Transparency = 1, Parent = folder })
	-- the void is built in the pocket dimension (or inside the dome when Config.UseDimension = false)
	local vc = d.dimOrigin or c
	local vy = d.dimFloorY or y
	self.vc, self.vy = vc, vy
	local vflat = CFrame.new(vc.X, vy, vc.Z) * CFrame.Angles(0, 0, math.pi / 2)
	local floorR = d.dimOrigin and R * 2.4 or R * 2
	self.floor = part({ Name = "VoidFloor", Shape = Enum.PartType.Cylinder, Material = Enum.Material.Glass, Color = Color3.fromRGB(10, 8, 24), Reflectance = 0.35, Size = Vector3.new(0.3, floorR, floorR), CFrame = vflat * CFrame.new(0.12, 0, 0), Transparency = 1, Parent = folder })
	-- drifting star dust inside the void
	local dust = part({ Name = "Dust", Size = Vector3.new(R * 1.8, R * 0.7, R * 1.8), Position = Vector3.new(vc.X, vy + R * 0.35, vc.Z), Transparency = 1, Parent = folder })
	self.dust = new("ParticleEmitter", {
		Texture = IMG.speck, Shape = Enum.ParticleEmitterShape.Box, Rate = 45, Lifetime = NumberRange.new(4, 7), Speed = NumberRange.new(0.3, 1.5), SpreadAngle = Vector2.new(180, 180),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(0.5, 0.35), NumberSequenceKeypoint.new(1, 0.1) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.3, 0.1), NumberSequenceKeypoint.new(1, 1) }),
		Color = ColorSequence.new(Color3.fromRGB(235, 230, 255), Color3.fromRGB(170, 220, 255)), LightEmission = 1, LightInfluence = 0, Enabled = false, Parent = dust,
	})
	-- streams of white light flowing through the void
	local streams = part({ Name = "Streams", Size = Vector3.new(R * 1.6, R * 0.5, 4), CFrame = CFrame.lookAt(Vector3.new(vc.X, vy + R * 0.3, vc.Z) + (d.forward or Vector3.new(0, 0, -1)) * R * 0.9, Vector3.new(vc.X, vy + R * 0.3, vc.Z)), Transparency = 1, Parent = folder })
	self.streams = new("ParticleEmitter", {
		Texture = IMG.streak, Shape = Enum.ParticleEmitterShape.Box, EmissionDirection = Enum.NormalId.Front, Rate = 55, Lifetime = NumberRange.new(0.8, 1.6), Speed = NumberRange.new(70, 140),
		SpreadAngle = Vector2.new(12, 6), Orientation = Enum.ParticleOrientation.VelocityParallel,
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 2.5), NumberSequenceKeypoint.new(1, 4) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.2, 0.15), NumberSequenceKeypoint.new(1, 1) }),
		Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromRGB(220, 210, 255)), LightEmission = 1, LightInfluence = 0, Enabled = false, Parent = streams,
	})
	-- white splashes (ink splatters) popping all over the void
	self.splats = {}
	local srng = Random.new(d.id * 7 + 3)
	for i = 1, Config.SplashCount do
		local a = srng:NextNumber(0, math.pi * 2)
		local dist = R * srng:NextNumber(0.45, 1.0)
		local pos = Vector3.new(vc.X + math.cos(a) * dist, vy + srng:NextNumber(3, R * 0.65), vc.Z + math.sin(a) * dist)
		local sp = part({ Name = "Splash", Size = Vector3.one, Position = pos, Transparency = 1, Parent = folder })
		local size = srng:NextNumber(8, 26)
		local sbb = new("BillboardGui", { Size = UDim2.fromScale(size, size), LightInfluence = 0, Brightness = 2, MaxDistance = 1e5, Enabled = false, Parent = sp })
		local img = new("ImageLabel", {
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1,
			Image = IMG["splash_" .. ((i - 1) % 4 + 1)], Rotation = srng:NextNumber(0, 360), Parent = sbb,
		})
		local sc = new("UIScale", { Scale = 0, Parent = img })
		self.splats[i] = { bb = sbb, img = img, sc = sc, at = self.open + srng:NextNumber(0, 1.4), spin = srng:NextNumber(-4, 4), again = self.open + srng:NextNumber(3, 7) }
	end
	-- the black hole: behind the caster, above the horizon — whoever faces the caster sees them in front of it
	local fwd = d.forward or Vector3.new(0, 0, -1)
	local anchor = part({ Name = "BlackHole", Size = Vector3.one, Position = vc - fwd * R * 0.8 + Vector3.new(0, R * 0.32, 0), Transparency = 1, Parent = folder })
	local bb = new("BillboardGui", { Size = UDim2.fromScale(R * 1.3, R * 1.3), LightInfluence = 0, Brightness = 1.25, AlwaysOnTop = false, MaxDistance = 1e5, Enabled = false, Parent = anchor })
	self.bb = bb
	local holder = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = bb })
	self.bhScale = new("UIScale", { Scale = 0, Parent = holder })
	local function layer(img, z)
		return new("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Image = img, ZIndex = z, Parent = holder })
	end
	self.smoke = layer(IMG.bh_smoke, 1)
	self.gas = layer(IMG.bh_gas, 2)
	self.ring = layer(IMG.bh_ring, 3)
	self.core = layer(IMG.bh_core, 4)
	self.glints = {}
	local rng = Random.new(d.id)
	for i = 1, 12 do
		local a = rng:NextNumber(0, math.pi * 2)
		local rr = 0.367 + rng:NextNumber(-0.02, 0.03)
		local g = new("ImageLabel", {
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + math.cos(a) * rr, 0.5 - math.sin(a) * rr), Size = UDim2.fromScale(0.035, 0.035),
			BackgroundTransparency = 1, Image = IMG.glitter, ImageColor3 = Color3.fromRGB(210, 240, 255), ZIndex = 5, Parent = holder,
		})
		self.glints[i] = { g = g, ph = rng:NextNumber(0, 6.28), sp = rng:NextNumber(2, 5) }
	end
	self.bhFlash = new("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.9, 0.9), BackgroundTransparency = 1, Image = IMG.glitter, ImageTransparency = 1, ZIndex = 6, Parent = holder })
	-- caster aura during the hand sign
	local cr = rootOf(d.caster)
	if cr then
		local att = new("Attachment", { Name = "PVDomainAura", Parent = cr })
		self.aura = att
		self.auraFx = new("ParticleEmitter", {
			Texture = IMG.speck, Rate = 70, Lifetime = NumberRange.new(0.5, 1), Speed = NumberRange.new(2, 6), SpreadAngle = Vector2.new(180, 180),
			Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0) }), Color = ColorSequence.new(Color3.fromRGB(190, 225, 255)),
			LightEmission = 1, LightInfluence = 0, Parent = att,
		})
	end
	-- screen overlay: speed lines, titles, flash, victim noise
	local ov = new("Frame", { Name = "Domain" .. d.id, Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = getGui() })
	self.ov = ov
	self.dim = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(22, 6, 26), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 1, Parent = ov })
	self.streakHost = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 2, Parent = ov })
	self.streaks = {}
	for i = 1, Config.StreakCount do
		local s = new("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, Image = IMG.streak, ImageColor3 = Config.StreakColor, ImageTransparency = 1, ZIndex = 2, Parent = self.streakHost })
		self.streaks[i] = { s = s }
	end
	self.sparks = {}
	for i = 1, 16 do
		self.sparks[i] = { s = new("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1, Image = IMG.glitter, ImageColor3 = Color3.fromRGB(255, 200, 250), ImageTransparency = 1, ZIndex = 3, Parent = self.streakHost }) }
	end
	local titles = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 4, Parent = ov })
	self.titleScale = new("UIScale", { Parent = titles })
	-- low on the screen so the face / the black hole stay visible
	self.t1 = label(titles, Config.Title.top, 0.78, 54, TITLE_FONT)
	self.t1s = label(titles, Config.Title.topSub, 0.86, 22, SUB_FONT)
	self.t2 = label(titles, Config.Title.name, 0.76, 96, TITLE_FONT)
	self.t2s = label(titles, Config.Title.nameSub, 0.88, 30, SUB_FONT)
	self.noise = new("ImageLabel", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Image = IMG.overload, ImageRectSize = Vector2.new(512, 288), ImageTransparency = 1, ZIndex = 5, Parent = ov })
	self.flash = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 6, Parent = ov })
	-- white splash wipe that covers the cut into the dimension
	self.wipe = {}
	for i = 1, 3 do
		local w = new("ImageLabel", {
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5 + (i - 2) * 0.12, 0.5 + (i % 2) * 0.06 - 0.03), Size = UDim2.fromScale(1, 1), SizeConstraint = Enum.SizeConstraint.RelativeXX,
			BackgroundTransparency = 1, Image = IMG["splash_" .. i], ImageTransparency = 1, Rotation = i * 97, ZIndex = 7, Parent = ov,
		})
		self.wipe[i] = { img = w, sc = new("UIScale", { Scale = 0, Parent = w }), delay = (i - 1) * 0.05 }
	end
	-- splashes that flash on the screen of whoever is trapped
	self.vsplash = new("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromScale(0.45, 0.45), SizeConstraint = Enum.SizeConstraint.RelativeYY, BackgroundTransparency = 1, Image = IMG.splash_1, ImageTransparency = 1, ZIndex = 6, Parent = ov })
	-- sound: the intro (mask, eyes, finger snap) now; the cast swell is started so its impact lands on "open"
	self.castSnd = sound(SND.cast, self.shell, 1.2, false, true, R)
	local introSnd = sound(SND.intro, self.shell, 1.1, false, true, R)
	if introSnd then
		introSnd.TimePosition = math.max(0, serverNow() - d.startAt)
		introSnd:Play()
	end
	-- the scene on the caster (pose, blindfold, eyes, fingers) + camera shots for players close by
	local camDist = (workspace.CurrentCamera.CFrame.Position - c).Magnitude
	local profile = Config.profileFor(d.caster) or Config.DefaultProfile
	local okC, cine = pcall(Cinematic.new, d, profile, Config.Cinematic and camDist < R * Config.CinematicRange and (serverNow() - d.startAt) < TL.expand, TL, IMG)
	if okC then
		self.cine = cine
	else
		warn("[PVDomain] cena: " .. tostring(cine))
	end
	-- hand-sign animation on the caster (only the caster's own client plays it; it replicates)
	if Config.CasterAnimationId and d.caster == player.Character then
		pcall(function()
			local anim = new("Animation", { AnimationId = Config.CasterAnimationId })
			local animator = d.caster:FindFirstChildOfClass("Humanoid"):FindFirstChildOfClass("Animator")
			animator:LoadAnimation(anim):Play()
		end)
	end
	self.baseFov = workspace.CurrentCamera.FieldOfView
	return self
end

function Dom:setTargets(list)
	self.targets = list or {}
	for _, m in ipairs(self.targets) do
		local head = m:FindFirstChild("Head") or rootOf(m)
		if head then
			local att = new("Attachment", { Name = "PVDomainOverload", Position = Vector3.new(0, 0.6, 0), Parent = head })
			new("ParticleEmitter", {
				Texture = IMG.speck, Rate = 30, Lifetime = NumberRange.new(0.3, 0.8), Speed = NumberRange.new(2, 5), SpreadAngle = Vector2.new(180, 180),
				Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.35), NumberSequenceKeypoint.new(1, 0) }), Color = ColorSequence.new(Color3.fromRGB(200, 255, 255), Color3.new(1, 1, 1)),
				LightEmission = 1, LightInfluence = 0, Parent = att,
			})
			table.insert(self.specks, att)
		end
		if m == player.Character then
			self:becomeVictim()
		end
	end
end

function Dom:becomeVictim()
	if self.victim then
		return
	end
	self.victim = true
	self.blur = new("BlurEffect", { Name = "PVDomainBlur", Size = 0, Parent = workspace.CurrentCamera })
	self.overSnd = sound(SND.overload, SoundService, 0.9, true)
	if self.overSnd then
		self.overSnd:Play()
	end
	task.spawn(function()
		local ok, controls = pcall(function()
			return require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule", 3)):GetControls()
		end)
		if ok and controls and self.victim then
			self.controls = controls
			controls:Disable()
		end
	end)
end

function Dom:setInside(on)
	if self.inside == on then
		return
	end
	self.inside = on
	self.bb.Enabled = on
	self.dust.Enabled = on
	self.streams.Enabled = on
	for _, sp in ipairs(self.splats) do
		sp.bb.Enabled = on
	end
	if on then
		if not self.loopSnd then
			self.loopSnd = sound(SND.loop, SoundService, 0.8, true)
			if self.loopSnd then
				self.loopSnd:Play()
			end
		end
	elseif self.loopSnd then
		self.loopSnd:Destroy()
		self.loopSnd = nil
	end
end

function Dom:collapse()
	if self.collapseAt then
		return
	end
	self.collapseAt = serverNow()
	local s = sound(SND.ending, self.shell, 1.1, false, true, self.R)
	if s then
		s:Play()
	end
	self:endVictim()
end

function Dom:endVictim()
	if not self.victim then
		return
	end
	self.victim = false
	if self.controls then
		pcall(function()
			self.controls:Enable()
		end)
		self.controls = nil
	end
	if self.blur then
		self.blur:Destroy()
		self.blur = nil
	end
	if self.overSnd then
		self.overSnd:Destroy()
		self.overSnd = nil
	end
	local h = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if h then
		h.CameraOffset = Vector3.zero
	end
	self.noise.ImageTransparency = 1
end

function Dom:destroy()
	if self.cine then
		pcall(self.cine.destroy, self.cine)
	end
	self:endVictim()
	self:setInside(false)
	if self.fovTouched then
		workspace.CurrentCamera.FieldOfView = self.baseFov
	end
	for _, a in ipairs(self.specks) do
		a:Destroy()
	end
	if self.aura then
		self.aura:Destroy()
	end
	self.folder:Destroy()
	self.ov:Destroy()
end

-- per frame. t = seconds since the cast; returns false when finished
function Dom:update(dt)
	local d, R = self.d, self.R
	local now = serverNow()
	local t = now - d.startAt
	local open = self.open
	local cam = workspace.CurrentCamera
	local dist = (cam.CFrame.Position - d.center).Magnitude
	local near = dist < R * 2.5 or (d.dimOrigin ~= nil and (cam.CFrame.Position - d.dimOrigin).Magnitude < R * 1.4)
	local col = self.collapseAt and clamp01((now - self.collapseAt) / 0.6) or 0
	local ex = TL.expand
	if self.cine and not self.collapseAt then
		self.cine:update(t)
	end
	local castStart = open - 1.35 -- the cast sound's impact is 1.35 s into the file
	if self.castSnd and not self.castStarted and t >= castStart then
		self.castStarted = true
		self.castSnd.TimePosition = t - castStart
		self.castSnd:Play()
	end
	-- barrier growth / collapse
	local g = outQuad(clamp01((t - ex) / (open - ex))) * (1 - outQuad(col))
	local size = math.max(0.2, R * 2 * g)
	self.shell.Size = Vector3.one * size
	self.edge.Size = Vector3.one * (size * 1.015 + 0.3)
	self.edge.Transparency = (g <= 0.001) and 1 or 0
	local wv = clamp01((t - ex) / (open - ex + 0.4))
	self.wave.Size = Vector3.new(0.4, R * 2.3 * outQuad(wv) + 1, R * 2.3 * outQuad(wv) + 1)
	self.wave.Transparency = (t < ex or wv >= 1) and 1 or (0.1 + 0.9 * wv)
	self.floor.Transparency = t >= open - 0.1 and col < 1 and 0 or 1
	-- inside the void? (in the pocket dimension, or inside the dome without it)
	local distVoid = d.dimOrigin and (cam.CFrame.Position - d.dimOrigin).Magnitude or dist
	local inside = distVoid < R * (d.dimOrigin and 1.4 or 0.97) and t >= open - 0.05 and col < 0.5
	local witness = dist < R or inside -- saw the domain close from inside
	self:setInside(inside)
	-- camera push (x1.25) while the domain is being cast, back over 1 s (players not in the cinematic)
	local cineCam = self.cine and self.cine.isViewer
	if not cineCam and dist < R * 1.5 and t < open + 1 then
		local k
		if t < open then
			k = 1 + (Config.CameraPush - 1) * inOutSine(clamp01((t - TL.sign) / (open - TL.sign)))
		else
			k = Config.CameraPush - (Config.CameraPush - 1) * inOutSine(clamp01(t - open))
		end
		cam.FieldOfView = self.baseFov / k
		self.fovTouched = true
	elseif self.fovTouched then
		cam.FieldOfView = self.baseFov
		self.fovTouched = false
	end
	-- speed-line tunnel: starts on the finger snap, 1.6 s, 0.45 s fade
	local sa = near and window(t, TL.sign, TL.sign + 1.6, 0.12, 0.45) or 0
	self.dim.BackgroundTransparency = 1 - sa * 0.55
	local vp = cam.ViewportSize
	local cx, cy = vp.X / 2, vp.Y / 2
	local half = math.sqrt(cx * cx + cy * cy)
	local flick = (now - self.lastFlicker) > 1 / 12
	if flick then
		self.lastFlicker = now
	end
	for _, st in ipairs(self.streaks) do
		if sa <= 0 then
			st.s.ImageTransparency = 1
		else
			if not st.ang or (flick and math.random() < 0.45) then
				st.ang = math.random() * math.pi * 2
				st.dd = 0.1 + math.random() ^ 0.7 * 1.0
				st.th = 3 + math.random() * 10
				st.al = 0.35 + math.random() * 0.65
			end
			local len = st.dd * half * 0.75
			local hx, hy = cx + math.cos(st.ang) * st.dd * half, cy + math.sin(st.ang) * st.dd * half
			st.s.Position = UDim2.fromOffset(hx - math.cos(st.ang) * len / 2, hy - math.sin(st.ang) * len / 2)
			st.s.Size = UDim2.fromOffset(len, st.th * (0.6 + st.dd))
			st.s.Rotation = math.deg(st.ang)
			st.s.ImageTransparency = 1 - sa * st.al
		end
	end
	for i, sp in ipairs(self.sparks) do
		if sa <= 0 then
			sp.s.ImageTransparency = 1
		else
			if not sp.ang or sp.dd > 1.1 then
				sp.ang, sp.dd = math.random() * math.pi * 2, 0.05 + math.random() * 0.2
			end
			sp.dd += dt * (0.6 + (i % 5) * 0.25)
			sp.s.Position = UDim2.fromOffset(cx + math.cos(sp.ang) * sp.dd * half, cy + math.sin(sp.ang) * sp.dd * half)
			local s = 10 + sp.dd * 40
			sp.s.Size = UDim2.fromOffset(s, s)
			sp.s.ImageTransparency = 1 - sa * 0.9
		end
	end
	-- titles
	local a1 = near and window(t, TL.sign - 0.05, ex + 0.75, 0.12, 0.25) or 0
	local a2 = near and window(t, open + 0.15, open + 2.25, 0.12, 0.5) or 0
	setLabelAlpha(self.t1, a1)
	setLabelAlpha(self.t1s, a1 * 0.9)
	setLabelAlpha(self.t2, a2)
	setLabelAlpha(self.t2s, a2 * 0.9)
	self.titleScale.Scale = 1 + 0.08 * (1 - clamp01((t - open - 0.15) / 0.4)) * (a2 > 0 and 1 or 0)
	-- black hole
	if inside or col > 0 then
		local p = clamp01((t - open) / 0.7)
		self.bhScale.Scale = math.max(0, outBack(p)) * (1 - outQuad(col))
		self.gasRot += dt * 3
		self.gas.Rotation = self.gasRot
		self.smoke.Rotation = self.gasRot * 0.25
		for _, gl in ipairs(self.glints) do
			gl.g.ImageTransparency = 0.25 + 0.75 * (0.5 + 0.5 * math.sin(now * gl.sp + gl.ph))
		end
		self.bhFlash.ImageTransparency = 1 - 0.9 * window(t, open, open + 0.9, 0.05, 0.8)
	end
	-- white flashes + splash wipe: when the void opens and when it shatters
	local fl = 0
	if witness then
		fl = math.max(window(t, open - 0.05, open + 0.4, 0.05, 0.35) * 0.6, col > 0 and (1 - col) * 0.9 or 0)
	end
	for _, w in ipairs(self.wipe) do
		local k = witness and (t - (open - 0.12) - w.delay) or -1
		if k >= 0 and k < 1.0 then
			w.sc.Scale = 0.2 + 2.6 * outQuad(clamp01(k / 0.28))
			w.img.ImageTransparency = clamp01((k - 0.3) / 0.55)
		else
			w.img.ImageTransparency = 1
		end
	end
	-- 3D splashes: pop in after the void opens, slowly turn, and splash again now and then
	if inside then
		for _, sp in ipairs(self.splats) do
			if now - d.startAt >= sp.again then
				sp.again = t + 3 + math.random() * 4
				sp.at = t
			end
			local k = t - sp.at
			local pop = k < 0 and 0 or outBack(clamp01(k / 0.3))
			sp.sc.Scale = math.max(0, pop) * (1 + 0.04 * math.sin(now * 2 + sp.spin))
			sp.img.Rotation += sp.spin * dt
			sp.img.ImageTransparency = k < 0 and 1 or 0.05 + 0.25 * clamp01((k - 1.5) / 2)
		end
	end
	-- victim: infinite information
	if self.victim and t >= open then
		if flick then
			self.noise.ImageRectOffset = Vector2.new(math.random(0, 512), math.random(0, 736))
			self.noise.ImageTransparency = 0.5 + math.random() * 0.35
			self.noise.Rotation = (math.random() - 0.5) * 4
		end
		if now > self.nextFlash then
			self.nextFlash = now + 0.25 + math.random() * 0.6
			self.flashUntil = now + 0.06
		end
		if self.flashUntil and now < self.flashUntil then
			fl = math.max(fl, 0.35)
			if not self.vsplashOn then
				self.vsplashOn = true
				self.vsplash.Image = IMG["splash_" .. math.random(1, 4)]
				self.vsplash.Position = UDim2.fromScale(0.2 + math.random() * 0.6, 0.2 + math.random() * 0.6)
				self.vsplash.Rotation = math.random(0, 360)
			end
			self.vsplash.ImageTransparency = 0.15
		else
			self.vsplashOn = false
			self.vsplash.ImageTransparency = math.min(1, self.vsplash.ImageTransparency + dt * 4)
		end
		if self.blur then
			self.blur.Size = 5 + 4 * math.sin(now * 7)
		end
		local h = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if h then
			h.CameraOffset = Vector3.new((math.random() - 0.5) * 0.25, (math.random() - 0.5) * 0.25, 0)
		end
	end
	self.flash.BackgroundTransparency = 1 - fl
	-- caster aura only during the cast
	if self.auraFx then
		self.auraFx.Enabled = t >= TL.sign and t < open + 0.7
	end
	return col < 1
end

-- ------------------------------------------------------------------ public
function VFX.start(d)
	if domains[d.id] then
		return
	end
	domains[d.id] = Dom.new(d)
end

function VFX.trap(id, targets)
	local dom = domains[id]
	if dom then
		dom:setTargets(targets)
	end
end

function VFX.stop(id)
	local dom = domains[id]
	if dom then
		dom:collapse()
	end
end

function VFX.count()
	local n = 0
	for _ in pairs(domains) do
		n += 1
	end
	return n
end

VFX.domains = domains

RunService.RenderStepped:Connect(function(dt)
	local insideR
	for id, dom in pairs(domains) do
		local ok, alive = pcall(dom.update, dom, dt)
		if not ok then
			warn("[PVDomain] " .. tostring(alive))
			alive = false
			dom.collapseAt = dom.collapseAt or serverNow()
		end
		if dom.inside then
			insideR = dom.R
		end
		-- safety: server "stop" lost -> collapse on our own shortly after the scheduled end
		if not dom.collapseAt and serverNow() > dom.d.endAt + 1 then
			dom:collapse()
		end
		if not alive then
			local okD, err = pcall(dom.destroy, dom)
			if not okD then
				warn("[PVDomain] " .. tostring(err))
			end
			domains[id] = nil
		end
	end
	if insideR then
		applyVoid(insideR)
	else
		revertVoid()
	end
end)

return VFX
