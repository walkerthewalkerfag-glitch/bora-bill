--!nonstrict
-- PVSons: toca os sons de gameplay do Pocket Vanguards. ModuleScript em ReplicatedStorage, usado de LocalScripts.
--   local Sons = require(game.ReplicatedStorage.PVSons)
--   Sons.play("encounter")                 -- efeito: "encounter", "starter", "dream"
--   Sons.music("battle")                   -- música: "battle", "trainer", "dreamworld" (troca com fade)
--   Sons.stopMusic()
--   Sons.say("mina", "Oi! Tudo bem?")      -- bips de fala enquanto o texto aparece (use junto com o seu typewriter)
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")

local Sons = {}

-- cole os IDs (Asset Manager > botão direito > Copy Asset ID)
Sons.Ids = {
	encounter = "rbxassetid://0", -- pv_encounter.wav
	trainer = "rbxassetid://0", -- pv_trainer.wav
	starter = "rbxassetid://0", -- pv_starter.wav
	dream = "rbxassetid://0", -- pv_dream.wav
	battle = "rbxassetid://0", -- pv_battle.wav
	dreamworld = "rbxassetid://0", -- pv_dreamworld.wav
	voices = "rbxassetid://0", -- pv_voices.wav
}
Sons.MusicVolume = 0.6
Sons.SfxVolume = 0.8
Sons.VoiceVolume = 0.55

-- trilhas: a do treinador toca a abertura uma vez e depois repete só o groove
local LOOPS = { trainer = { 14.72, 27.52 } }
-- trechos de pv_voices.wav (6 sílabas por voz), igual ao pv_voices_map.json
local VOICES = {
	mina = { 0, 0.2, 0.4, 0.6, 0.8, 1.0 },
	jinwoo = { 1.2, 1.4, 1.6, 1.8, 2.0, 2.2 },
	nico = { 2.4, 2.6, 2.8, 3.0, 3.2, 3.4 },
	eco = { 3.6, 3.8, 4.0, 4.2, 4.4, 4.6 },
}
local SYL = 0.12

local folder
local function getFolder()
	if not folder or not folder.Parent then
		folder = Instance.new("Folder")
		folder.Name = "PVSons"
		folder.Parent = SoundService
	end
	return folder
end

local function ok(id)
	return id and id ~= "" and id ~= "rbxassetid://0"
end

function Sons.play(name, volume)
	local id = Sons.Ids[name]
	if not ok(id) then
		return
	end
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Volume = volume or Sons.SfxVolume
	s.Parent = getFolder()
	s.Ended:Once(function()
		s:Destroy()
	end)
	s:Play()
	return s
end

local current, currentName
function Sons.stopMusic(fade)
	local old = current
	current, currentName = nil, nil
	if old then
		local t = TweenService:Create(old, TweenInfo.new(fade or 0.8), { Volume = 0 })
		t.Completed:Once(function()
			old:Destroy()
		end)
		t:Play()
	end
end

function Sons.music(name, fade)
	if currentName == name then
		return current
	end
	Sons.stopMusic(fade)
	local id = Sons.Ids[name]
	if not ok(id) then
		return
	end
	local s = Instance.new("Sound")
	s.Name = "Music_" .. name
	s.SoundId = id
	s.Looped = true
	s.Volume = 0
	local loop = LOOPS[name]
	if loop then
		pcall(function()
			s.PlaybackRegionsEnabled = true
			s.LoopRegion = NumberRange.new(loop[1], loop[2])
		end)
	end
	s.Parent = getFolder()
	s:Play()
	TweenService:Create(s, TweenInfo.new(fade or 0.8), { Volume = Sons.MusicVolume }):Play()
	current, currentName = s, name
	return s
end

-- toca uma sílaba da voz. Chame a cada letra que aparece; ele pula espaços, pontuação e letras seguidas demais.
local lastBlip = 0
function Sons.blip(voice, char)
	local v = VOICES[voice]
	if not v or not ok(Sons.Ids.voices) or not char or not char:match("[%w\128-\255]") then
		return
	end
	local now = os.clock()
	if now - lastBlip < 0.06 then
		return
	end
	lastBlip = now
	local a = v[string.byte(string.lower(char)) % #v + 1]
	local s = Instance.new("Sound")
	s.SoundId = Sons.Ids.voices
	s.Volume = Sons.VoiceVolume
	s.PlaybackSpeed = 1 + (math.random() - 0.5) * 0.06
	pcall(function()
		s.PlaybackRegionsEnabled = true
		s.PlaybackRegion = NumberRange.new(a, a + SYL)
	end)
	s.TimePosition = a
	s.Parent = getFolder()
	s:Play()
	task.delay(SYL + 0.1, function()
		s:Destroy()
	end)
end

-- escreve o texto num TextLabel letra por letra com a voz. Retorna quando termina.
function Sons.say(voice, text, label, cps)
	local delayPer = 1 / (cps or 40)
	local shown = {}
	for _, code in utf8.codes(text) do
		local ch = utf8.char(code)
		table.insert(shown, ch)
		if label then
			label.Text = table.concat(shown)
		end
		Sons.blip(voice, ch)
		if ch == "." or ch == "!" or ch == "?" then
			task.wait(0.18)
		elseif ch == "," then
			task.wait(0.09)
		else
			task.wait(delayPer)
		end
	end
end

return Sons
