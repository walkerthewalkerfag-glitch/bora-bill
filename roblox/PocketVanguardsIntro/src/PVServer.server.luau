--!nocheck
-- Pocket Vanguards intro (server): 3 save slots + intro settings per player, in a DataStore.
-- Works in Studio without API access too (falls back to memory and says so once).
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(script.Parent:WaitForChild("PVConfig"))

local remote = ReplicatedStorage:FindFirstChild(Config.RemoteName)
if not remote then
	remote = Instance.new("RemoteFunction")
	remote.Name = Config.RemoteName
	remote.Parent = ReplicatedStorage
end

-- server-side signal for your game code: SlotChosen:Fire(player, slot, saveData)
local chosen = script.Parent:FindFirstChild("SlotChosen")
if not chosen then
	chosen = Instance.new("BindableEvent")
	chosen.Name = "SlotChosen"
	chosen.Parent = script.Parent
end

local store
local memoryOnly = false
local ok = pcall(function()
	store = DataStoreService:GetDataStore(Config.DataStoreName)
end)
if not ok or not store then
	memoryOnly = true
	warn("[PocketVanguardsIntro] DataStore indisponível: saves só na memória (ative 'Enable Studio Access to API Services').")
end

local sessions = {} -- [player] = {data = {...}, dirty = bool, loaded = bool}

local function defaultData()
	return {
		v = 1,
		saves = { false, false, false },
		settings = { music = 70, sfx = 85, shake = true, skipIntro = false, muted = false, sel = 1 },
	}
end

local function key(player)
	return "u_" .. player.UserId
end

local function withRetry(fn)
	local delay = 1
	for attempt = 1, 4 do
		local good, res = pcall(fn)
		if good then
			return true, res
		end
		if attempt == 4 then
			return false, res
		end
		task.wait(delay)
		delay *= 2
	end
	return false, nil
end

local function sanitize(d)
	local out = defaultData()
	if type(d) ~= "table" then
		return out
	end
	if type(d.saves) == "table" then
		for i = 1, 3 do
			local v = d.saves[i]
			if type(v) == "table" and type(v.name) == "string" then
				out.saves[i] = { name = v.name, meta = tostring(v.meta or ""), created = v.created, updated = v.updated, data = type(v.data) == "table" and v.data or {} }
			end
		end
	end
	if type(d.settings) == "table" then
		local s, o = d.settings, out.settings
		if type(s.music) == "number" then
			o.music = math.clamp(math.floor(s.music + 0.5), 0, 100)
		end
		if type(s.sfx) == "number" then
			o.sfx = math.clamp(math.floor(s.sfx + 0.5), 0, 100)
		end
		for _, k in ipairs({ "shake", "skipIntro", "muted" }) do
			if type(s[k]) == "boolean" then
				o[k] = s[k]
			end
		end
		if type(s.sel) == "number" and s.sel >= 1 and s.sel <= 3 then
			o.sel = math.floor(s.sel)
		end
	end
	return out
end

local function session(player)
	local s = sessions[player]
	if s then
		while not s.loaded do
			task.wait()
		end
		return s
	end
	s = { data = defaultData(), dirty = false, loaded = false }
	sessions[player] = s
	if not memoryOnly then
		local good, res = withRetry(function()
			return store:GetAsync(key(player))
		end)
		if good then
			s.data = sanitize(res)
		else
			warn("[PocketVanguardsIntro] falha ao carregar saves de", player.Name, res)
			s.readFailed = true -- never overwrite data we could not read
		end
	end
	s.loaded = true
	return s
end

local function flush(player)
	local s = sessions[player]
	if not s or not s.dirty or memoryOnly or s.readFailed then
		return
	end
	s.dirty = false
	local data = s.data
	local good, err = withRetry(function()
		store:UpdateAsync(key(player), function()
			return data
		end)
	end)
	if not good then
		s.dirty = true
		warn("[PocketVanguardsIntro] falha ao gravar saves de", player.Name, err)
	end
end

local lastWrite = {}
local function markDirty(player)
	local s = sessions[player]
	s.dirty = true
	local t = os.clock()
	if lastWrite[player] and t - lastWrite[player] < 6 then
		return -- a pending flush will pick it up
	end
	lastWrite[player] = t
	task.delay(6, function()
		if sessions[player] then
			lastWrite[player] = nil
			flush(player)
		end
	end)
end

local function publicSave(v)
	if type(v) ~= "table" then
		return false
	end
	return { name = v.name, meta = v.meta }
end

local rate = {}
remote.OnServerInvoke = function(player, action, arg)
	local t = os.clock()
	local r = rate[player] or { t = t, n = 0 }
	if t - r.t > 1 then
		r.t, r.n = t, 0
	end
	r.n += 1
	rate[player] = r
	if r.n > 12 then
		return nil
	end
	local s = session(player)
	local d = s.data
	if action == "load" then
		return { saves = { publicSave(d.saves[1]), publicSave(d.saves[2]), publicSave(d.saves[3]) }, settings = d.settings }
	elseif action == "save" then
		local i = tonumber(arg)
		if not i or i < 1 or i > 3 or i ~= math.floor(i) then
			return nil
		end
		d.saves[i] = Config.MakeSave(player, i, d.saves[i] or nil)
		markDirty(player)
		return publicSave(d.saves[i])
	elseif action == "delete" then
		local i = tonumber(arg)
		if not i or i < 1 or i > 3 or i ~= math.floor(i) then
			return nil
		end
		d.saves[i] = false
		markDirty(player)
		return true
	elseif action == "settings" then
		if type(arg) == "table" then
			d.settings = sanitize({ settings = arg }).settings
			markDirty(player)
		end
		return true
	elseif action == "play" then
		local i = tonumber(arg)
		if not i or i < 1 or i > 3 then
			return nil
		end
		i = math.floor(i)
		d.settings.sel = i
		if not d.saves[i] then
			d.saves[i] = Config.MakeSave(player, i, nil)
		end
		markDirty(player)
		player:SetAttribute("PVSaveSlot", i)
		chosen:Fire(player, i, d.saves[i])
		return true
	end
	return nil
end

Players.PlayerRemoving:Connect(function(player)
	flush(player)
	sessions[player] = nil
	lastWrite[player] = nil
	rate[player] = nil
end)

game:BindToClose(function()
	local list = {}
	for p in pairs(sessions) do
		table.insert(list, p)
	end
	for _, p in ipairs(list) do
		task.spawn(flush, p)
	end
	task.wait(3)
end)
