--!nonstrict
-- DomainServer: valida o lançamento, trava os alvos e avisa todos os clientes (o visual roda nos clientes).
-- Script com RunContext = Server dentro de ReplicatedStorage.PVDomain.
--
-- Pelo servidor (boss/NPC):   ReplicatedStorage.PVDomain.CastDomain:Fire(modeloDoNPC)
-- Eventos para o seu jogo:    DomainStarted.Event (id, caster, targets)  ·  DomainEnded.Event (id, caster, targets)
local Players = game:GetService("Players")

local root = script.Parent
local Config = require(root:WaitForChild("DomainConfig"))

local function make(class, name)
	local o = root:FindFirstChild(name)
	if not o then
		o = Instance.new(class)
		o.Name = name
		o.Parent = root
	end
	return o
end
local remote = make("RemoteEvent", "DomainRemote")
local castDomain = make("BindableEvent", "CastDomain")
local started = make("BindableEvent", "DomainStarted")
local ended = make("BindableEvent", "DomainEnded")

local active = {} -- id -> domain
local trapped = {} -- model -> id
local cooldown = setmetatable({}, { __mode = "k" }) -- player (or NPC model) -> os.clock() when it can cast again
local saved = {}
local nextId = 0

local function rootPart(m)
	return m and (m:FindFirstChild("HumanoidRootPart") or m.PrimaryPart)
end
local function humanoid(m)
	return m and m:FindFirstChildOfClass("Humanoid")
end
local function alive(m)
	local h = humanoid(m)
	return m and m.Parent ~= nil and h ~= nil and h.Health > 0
end

local function findTargets(caster, center, radius)
	local params = OverlapParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { caster }
	local seen, list = {}, {}
	for _, part in ipairs(workspace:GetPartBoundsInRadius(center, radius, params)) do
		local m = part:FindFirstAncestorOfClass("Model")
		while m and not humanoid(m) do
			m = m:FindFirstAncestorOfClass("Model")
		end
		if m and not seen[m] and m ~= caster and alive(m) and not trapped[m] then
			seen[m] = true
			local r = rootPart(m)
			if r and (r.Position - center).Magnitude <= radius then
				table.insert(list, m)
			end
		end
	end
	return list
end

local function stun(m, id)
	local h, r = humanoid(m), rootPart(m)
	saved[m] = { ws = h.WalkSpeed, jp = h.JumpPower, jh = h.JumpHeight, ar = h.AutoRotate, anchored = r and r.Anchored }
	h.WalkSpeed = 0
	h.JumpPower = 0
	h.JumpHeight = 0
	h.AutoRotate = false
	if Config.AnchorTargets and r then
		r.Anchored = true
	end
	m:SetAttribute("PVDomainTrapped", true)
	trapped[m] = id
end

local function release(m)
	local s = saved[m]
	saved[m] = nil
	trapped[m] = nil
	if not s or not m.Parent then
		return
	end
	local h, r = humanoid(m), rootPart(m)
	if h then
		h.WalkSpeed, h.JumpPower, h.JumpHeight, h.AutoRotate = s.ws, s.jp, s.jh, s.ar
	end
	if r and Config.AnchorTargets then
		r.Anchored = s.anchored or false
	end
	m:SetAttribute("PVDomainTrapped", nil)
end

local function pack(d)
	return { id = d.id, caster = d.caster, center = d.center, forward = d.forward, radius = d.radius, startAt = d.startAt, openAt = d.openAt, endAt = d.endAt }
end

local function finish(id)
	local d = active[id]
	if not d then
		return
	end
	active[id] = nil
	for _, c in ipairs(d.conns) do
		c:Disconnect()
	end
	for _, m in ipairs(d.targets) do
		release(m)
	end
	remote:FireAllClients("stop", id)
	ended:Fire(id, d.caster, d.targets)
end

local function cast(caster)
	if not alive(caster) or trapped[caster] or not Config.profileFor(caster) then
		return false
	end
	local key = Players:GetPlayerFromCharacter(caster) or caster
	if cooldown[key] and os.clock() < cooldown[key] then
		return false
	end
	for _, d in pairs(active) do
		if d.caster == caster then
			return false
		end
	end
	local r = rootPart(caster)
	if not r then
		return false
	end
	cooldown[key] = os.clock() + Config.Cooldown
	nextId += 1
	local id = nextId
	local look = r.CFrame.LookVector
	local flat = Vector3.new(look.X, 0, look.Z)
	local now = workspace:GetServerTimeNow()
	local d = {
		id = id, caster = caster, center = r.Position, forward = flat.Magnitude > 0.01 and flat.Unit or Vector3.new(0, 0, -1), radius = Config.Radius,
		startAt = now, openAt = now + Config.OpenTime, endAt = now + Config.OpenTime + Config.Duration, targets = {}, conns = {},
	}
	active[id] = d
	if Config.AnchorCasterDuringCast and not r.Anchored then
		r.Anchored = true
		task.delay(Config.OpenTime + 0.7, function()
			if r.Parent then
				r.Anchored = false
			end
		end)
	end
	remote:FireAllClients("start", pack(d))
	table.insert(d.conns, humanoid(caster).Died:Connect(function()
		finish(id)
	end))
	table.insert(d.conns, caster.AncestryChanged:Connect(function()
		if not caster.Parent then
			finish(id)
		end
	end))
	task.delay(Config.OpenTime, function()
		if active[id] ~= d then
			return
		end
		d.targets = findTargets(caster, d.center, d.radius)
		for _, m in ipairs(d.targets) do
			stun(m, id)
		end
		remote:FireAllClients("trap", id, d.targets)
		started:Fire(id, caster, d.targets)
	end)
	task.delay(Config.OpenTime + Config.Duration, function()
		finish(id)
	end)
	return true
end

remote.OnServerEvent:Connect(function(player, action)
	if action == "cast" then
		if Config.AllowPlayers and player.Character then
			cast(player.Character)
		end
	elseif action == "sync" then
		for _, d in pairs(active) do
			remote:FireClient(player, "start", pack(d))
			if #d.targets > 0 then
				remote:FireClient(player, "trap", d.id, d.targets)
			end
		end
	end
end)
castDomain.Event:Connect(function(model)
	cast(model)
end)
Players.PlayerRemoving:Connect(function(p)
	cooldown[p] = nil
end)
