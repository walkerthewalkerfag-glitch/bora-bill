--!nonstrict
-- DomainCinematic: a "cena" antes do domínio, no personagem que lança (R15). Referência: JJK ep. 7 (Gojo × Jogo).
--   0.00  close no rosto (três quartos)
--   0.10  a mão esquerda engancha a venda nos olhos e puxa pra BAIXO (0.50–0.80): ela fica pendurada no pescoço
--   0.72  close extremo nos olhos: acendem azuis (brilho + faíscas)
--   1.05  de frente: a mão direita sobe na frente do rosto com os dedos cruzados
--   1.35  "tic" dos dedos (flash) — começa o túnel e o "領域展開"
--   1.70  câmera abre e recua enquanto a esfera explode
--   2.70  o domínio fecha; a câmera volta para o jogador (o flash branco esconde o corte)
-- A pose é feita girando as juntas (Motor6D.C0) localmente em todos os clientes com o mesmo relógio,
-- então funciona sem subir animação. Os dedos cruzados são duas peças soldadas na mão.
local Cine = {}
Cine.__index = Cine

local function clamp01(x)
	return math.clamp(x, 0, 1)
end
local function smooth(x)
	x = clamp01(x)
	return x * x * (3 - 2 * x)
end
local function outQuad(x)
	x = clamp01(x)
	return 1 - (1 - x) * (1 - x)
end
local function lerp(a, b, t)
	return a + (b - a) * t
end
-- keyed pose track: { {time, {x,y,z}}, ... } -> angles at t (smoothstep between keys)
local function track(keys, t)
	if t <= keys[1][1] then
		return keys[1][2]
	end
	for i = 1, #keys - 1 do
		local a, b = keys[i], keys[i + 1]
		if t <= b[1] then
			local k = smooth((t - a[1]) / (b[1] - a[1]))
			return { lerp(a[2][1], b[2][1], k), lerp(a[2][2], b[2][2], k), lerp(a[2][3], b[2][3], k) }
		end
	end
	return keys[#keys][2]
end

local REST = { 0, 0, 0 }
-- angles in degrees applied as C0 * CFrame.Angles(x, y, z); solved with forward kinematics on a standard R15 rig
local function poses(TL)
	local expand, open = TL.expand, TL.open
	return {
		-- hook the blindfold at the eyes (hand at eye level), pull it down to the chin, hand drops away
		LeftShoulder = { { 0.1, REST }, { 0.4, { 110, -10, 60 } }, { 0.5, { 110, -10, 60 } }, { 0.8, { 90, -50, 60 } }, { 0.92, { 90, -50, 60 } }, { 1.25, REST } },
		LeftElbow = { { 0.1, REST }, { 0.4, { 60, 0, 0 } }, { 0.5, { 60, 0, 0 } }, { 0.8, { 90, 0, 0 } }, { 0.92, { 90, 0, 0 } }, { 1.25, REST } },
		-- hand sign beside the right cheek, fingers up next to the eyes (face stays visible)
		RightShoulder = { { 1.0, REST }, { 1.25, { 80, 0, -80 } }, { expand + 0.6, { 80, 0, -80 } }, { open, REST } },
		RightElbow = { { 1.0, REST }, { 1.25, { 110, 0, 0 } }, { expand + 0.6, { 110, 0, 0 } }, { open, REST } },
		Neck = { { 0, REST }, { 0.45, { -6, 0, 0 } }, { 0.85, { 4, 0, 0 } }, { 1.3, REST }, { expand, { 6, 0, 0 } }, { open, REST } },
		Waist = { { 0, REST }, { 1.0, REST }, { 1.25, { 0, -8, 0 } }, { expand + 0.6, { 0, -8, 0 } }, { open, REST } },
	}
end

function Cine.new(d, profile, isViewer, TL, IMG)
	local caster = d.caster
	local self = setmetatable({ d = d, TL = TL, profile = profile or {}, isViewer = isViewer, joints = {}, made = {}, done = false }, Cine)
	self.head = caster and caster:FindFirstChild("Head")
	self.root = caster and (caster:FindFirstChild("HumanoidRootPart") or caster.PrimaryPart)
	self.rhand = caster and caster:FindFirstChild("RightHand")
	if not (self.head and self.root) then
		return self
	end
	self.rootCF = self.root.CFrame
	-- joints (R15). R6 characters skip the pose but keep the camera shots.
	self.tracks = poses(TL)
	for _, m in ipairs(caster:GetDescendants()) do
		if m:IsA("Motor6D") and self.tracks[m.Name] then
			self.joints[m.Name] = { motor = m, c0 = m.C0 }
		end
	end
	-- crossed fingers on the right hand (index over middle)
	if self.rhand then
		local h = self.rhand
		local color = h.Color
		local fy = -h.Size.Y / 2 - 0.24
		self.fingers = {}
		for i, spec in ipairs({ { -0.07, -0.05, 0.22 }, { 0.07, 0.03, -0.22 } }) do
			local f = Instance.new("Part")
			f.Name = "PVDomainFinger" .. i
			f.Size = Vector3.new(0.17, 0.5, 0.17)
			f.Color = color
			f.Material = Enum.Material.SmoothPlastic
			f.CanCollide, f.CanQuery, f.CanTouch, f.CastShadow, f.Massless = false, false, false, false, true
			f.Transparency = 1
			local w = Instance.new("Weld")
			w.Part0, w.Part1 = h, f
			w.C0 = CFrame.new(spec[1], fy, spec[2]) * CFrame.Angles(0, 0, spec[3])
			w.Parent = f
			f.Parent = caster
			table.insert(self.fingers, f)
			table.insert(self.made, f)
		end
	end
	-- mask / blindfold: Accessory, welded part, or a temporary one
	self:findMask()
	-- glowing eyes, shown when the mask comes off
	local hs = self.head.Size
	self.eyes = {}
	local ep = self.profile.eyes or Vector2.new(0.16, 0.1)
	for _, sx in ipairs({ -1, 1 }) do
		local e = Instance.new("Part")
		e.Name = "PVDomainEye"
		e.Size = Vector3.new(hs.X * 0.17, hs.Y * 0.07, 0.05)
		e.Material = Enum.Material.Neon
		e.Color = self.profile.eyeColor or Color3.fromRGB(110, 220, 255)
		e.CanCollide, e.CanQuery, e.CanTouch, e.CastShadow, e.Massless = false, false, false, false, true
		e.Transparency = 1
		local w = Instance.new("Weld")
		w.Part0, w.Part1 = self.head, e
		w.C0 = CFrame.new(sx * ep.X * hs.X, ep.Y * hs.Y, -hs.Z / 2 - 0.01)
		w.Parent = e
		e.Parent = caster
		table.insert(self.eyes, e)
		table.insert(self.made, e)
	end
	local att = Instance.new("Attachment")
	att.Name = "PVDomainEyes"
	att.Position = Vector3.new(0, ep.Y * hs.Y, -hs.Z / 2 - 0.1)
	att.Parent = self.head
	table.insert(self.made, att)
	self.eyeLight = Instance.new("PointLight")
	self.eyeLight.Color = self.profile.eyeColor or Color3.fromRGB(110, 220, 255)
	self.eyeLight.Range = 5
	self.eyeLight.Brightness = 0
	self.eyeLight.Parent = att
	self.eyeBurst = Instance.new("ParticleEmitter")
	self.eyeBurst.Texture = IMG.glitter
	self.eyeBurst.Rate = 0
	self.eyeBurst.Lifetime = NumberRange.new(0.25, 0.6)
	self.eyeBurst.Speed = NumberRange.new(1, 4)
	self.eyeBurst.SpreadAngle = Vector2.new(180, 180)
	self.eyeBurst.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0) })
	self.eyeBurst.Color = ColorSequence.new(self.eyeLight.Color, Color3.new(1, 1, 1))
	self.eyeBurst.LightEmission = 1
	self.eyeBurst.LightInfluence = 0
	self.eyeBurst.Parent = att
	-- camera (only for players close to the caster)
	if isViewer then
		local cam = workspace.CurrentCamera
		self.cam = { type = cam.CameraType, subject = cam.CameraSubject, fov = cam.FieldOfView }
		cam.CameraType = Enum.CameraType.Scriptable
		self.camOn = true
	end
	return self
end

function Cine:findMask()
	local caster, head = self.d.caster, self.head
	local name = self.profile.mask
	local obj = name and caster:FindFirstChild(name, true)
	if obj and obj:IsA("Accessory") then
		local handle = obj:FindFirstChild("Handle")
		local w = handle and handle:FindFirstChildWhichIsA("Weld")
		if w then
			-- Handle = Head * C1 * C0^-1 (Part1 = head)  -> move in head space by pre-multiplying C1
			self.mask = { weld = w, prop = w.Part1 == head and "C1" or "C0", base = w.Part1 == head and w.C1 or w.C0, part = handle, headSide = w.Part1 == head }
		elseif handle then
			self.mask = { part = handle, fadeOnly = true, tr = handle.Transparency }
		end
	elseif obj and obj:IsA("BasePart") then
		local w = obj:FindFirstChildWhichIsA("Weld") or obj:FindFirstChildWhichIsA("Motor6D")
		if w and (w.Part0 == head or w.Part1 == head) then
			self.mask = { weld = w, prop = w.Part0 == head and "C0" or "C1", base = w.Part0 == head and w.C0 or w.C1, part = obj, headSide = w.Part1 == head }
		else
			self.mask = { part = obj, fadeOnly = true, tr = obj.Transparency }
		end
	elseif self.profile.fakeMask ~= false then
		local band = Instance.new("Part")
		band.Name = "PVDomainBlindfold"
		local hs = head.Size
		band.Size = Vector3.new(hs.X * 1.04, hs.Y * 0.22, hs.Z * 1.04)
		band.Color = Color3.fromRGB(14, 12, 16)
		band.Material = Enum.Material.Fabric
		band.CanCollide, band.CanQuery, band.CanTouch, band.Massless = false, false, false, true
		local w = Instance.new("Weld")
		w.Part0, w.Part1 = head, band
		w.C0 = CFrame.new(0, hs.Y * 0.1, 0)
		w.Parent = band
		band.Parent = self.d.caster
		table.insert(self.made, band)
		self.mask = { weld = w, prop = "C0", base = w.C0, part = band, headSide = false, fake = true }
	end
end

-- head-space offset of the blindfold while it is pulled down (0 = on the eyes, 1 = hanging on the neck)
function Cine:setMask(k)
	local m = self.mask
	if not m then
		return
	end
	if m.fadeOnly then
		m.part.LocalTransparencyModifier = k
		return
	end
	local drop = self.profile.maskDrop or 0.62
	local off = CFrame.new(0, -self.head.Size.Y * drop * k, -self.head.Size.Z * 0.04 * k) * CFrame.Angles(math.rad(12 * k), 0, 0)
	-- m.prop is the head-side frame of the weld (C1 when Part1 is the head, C0 when Part0 is), so
	-- pre-multiplying it moves the blindfold in head space
	m.weld[m.prop] = off * m.base
end

local function lookAt(from, to)
	return CFrame.lookAt(from, to)
end

-- t = seconds since the cast started
function Cine:update(t)
	if self.done or not (self.head and self.root) then
		return
	end
	local TL = self.TL
	-- pose
	for name, j in pairs(self.joints) do
		local a = track(self.tracks[name], t)
		j.motor.C0 = j.c0 * CFrame.Angles(math.rad(a[1]), math.rad(a[2]), math.rad(a[3]))
	end
	-- blindfold: pulled down between 0.50 and 0.80, stays on the neck during the domain
	self:setMask(smooth((t - 0.5) / 0.3))
	-- eyes
	local eyeOn = clamp01((t - 0.66) / 0.1)
	for _, e in ipairs(self.eyes) do
		e.Transparency = 1 - eyeOn
	end
	self.eyeLight.Brightness = eyeOn * (0.8 + 1.6 * math.max(0, 1 - (t - 0.72) / 0.5))
	if not self.burst and t >= 0.74 then
		self.burst = true
		self.eyeBurst:Emit(24)
	end
	-- fingers
	if self.fingers then
		local on = t >= 1.1 and t <= TL.expand + 0.75
		for _, f in ipairs(self.fingers) do
			f.Transparency = on and 0 or 1
		end
	end
	-- camera shots
	if self.camOn then
		local cam = workspace.CurrentCamera
		local R = self.rootCF
		local look, right, up = R.LookVector, R.RightVector, Vector3.new(0, 1, 0)
		if t < 0.72 then
			-- face close-up, three-quarter from the character's right so the hand hooking the blindfold reads
			local p = t / 0.72
			local f = self.head.CFrame
			local dist = lerp(3.4, 2.8, outQuad(p))
			local from = f.Position + (f.LookVector * 0.82 + f.RightVector * 0.8).Unit * dist + Vector3.new(0, 0.12, 0)
			cam.CFrame = lookAt(from, f.Position + Vector3.new(0, 0.05 - 0.12 * smooth((t - 0.5) / 0.3), 0))
			cam.FieldOfView = 40
		elseif t < 1.05 then
			-- extreme close-up on the eyes as they light up
			local p = (t - 0.72) / 0.33
			local f = self.head.CFrame
			local eyeH = (self.profile.eyes and self.profile.eyes.Y or 0.1) * self.head.Size.Y
			local eyeP = f.Position + f.UpVector * eyeH
			cam.CFrame = lookAt(eyeP + f.LookVector * lerp(2.3, 2.0, outQuad(p)) + f.RightVector * 0.05, eyeP)
			cam.FieldOfView = lerp(32, 28, p)
		elseif t < TL.expand then
			-- from the front: the hand rises in front of the face, crossed fingers beside the glowing eyes
			local p = (t - 1.05) / (TL.expand - 1.05)
			local f = self.head.CFrame
			local hand = self.rhand and self.rhand.Position or (f.Position + look * 0.8)
			local focus = f.Position:Lerp(hand, 0.3 * smooth((t - 1.05) / 0.25))
			local from = f.Position + look * lerp(3.0, 2.6, outQuad(p)) - right * 0.3 + up * 0.05
			cam.CFrame = lookAt(from, focus)
			local punch = math.max(0, 1 - math.abs(t - TL.sign - 0.06) / 0.14)
			cam.FieldOfView = 44 - 8 * punch
		elseif t < TL.open + 0.1 then
			-- pull back ahead of the black wall: the dome swallows the caster and keeps coming at the camera
			local p = outQuad((t - TL.expand) / (TL.open - TL.expand))
			local Rr = self.d.radius
			local center = self.d.center
			local wall = Rr * outQuad((t - TL.expand) / (TL.open - TL.expand))
			local dir = (look + up * 0.35 + right * 0.3).Unit
			local dist = math.max(lerp(5, Rr * 0.5, p), wall * 1.35 + 8)
			cam.CFrame = lookAt(center + dir * dist, center + up * (1.2 + Rr * 0.2 * p))
			cam.FieldOfView = lerp(50, 72, p)
		else
			self:releaseCamera()
		end
	end
	-- arms back to normal once the domain is closed
	if t > TL.open + 0.2 and not self.poseDone then
		self.poseDone = true
		for _, j in pairs(self.joints) do
			j.motor.C0 = j.c0
		end
		if self.fingers then
			for _, f in ipairs(self.fingers) do
				f.Transparency = 1
			end
		end
	end
end

function Cine:releaseCamera()
	if not self.camOn then
		return
	end
	self.camOn = false
	local cam = workspace.CurrentCamera
	cam.FieldOfView = self.cam.fov
	local subject = self.cam.subject
	if not subject or not subject.Parent then
		local ch = game:GetService("Players").LocalPlayer.Character
		subject = ch and ch:FindFirstChildOfClass("Humanoid")
	end
	if subject then
		cam.CameraSubject = subject
	end
	cam.CameraType = self.cam.type
end

-- domain over: mask back on the eyes, eyes off, everything removed
function Cine:destroy()
	if self.done then
		return
	end
	self.done = true
	self:releaseCamera()
	for _, j in pairs(self.joints) do
		if j.motor.Parent then
			j.motor.C0 = j.c0
		end
	end
	if self.mask then
		if self.mask.fadeOnly then
			self.mask.part.LocalTransparencyModifier = 0
		elseif self.mask.weld.Parent then
			self.mask.weld[self.mask.prop] = self.mask.base
		end
	end
	for _, o in ipairs(self.made) do
		o:Destroy()
	end
end

return Cine
