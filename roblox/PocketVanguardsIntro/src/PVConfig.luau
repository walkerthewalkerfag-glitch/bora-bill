--!nocheck
-- Pocket Vanguards intro: settings and asset IDs.
-- 1) Importe as imagens de /images e os sons de /sounds (Asset Manager > Bulk Import).
-- 2) Cole cada ID abaixo no lugar do 0 (botão direito no asset > Copy ID).
local Config = {}

Config.Images = {
	["atlas1.png"] = "rbxassetid://0",
	["atlas2.png"] = "rbxassetid://0",
	["atlas3.png"] = "rbxassetid://0",
	["atlas4.png"] = "rbxassetid://0",
	["atlas5.png"] = "rbxassetid://0",
	["atlas6.png"] = "rbxassetid://0",
	["atlas7.png"] = "rbxassetid://0",
	["atlas8.png"] = "rbxassetid://0",
	["bg_flash_blue.png"] = "rbxassetid://0",
	["bg_flash_red.png"] = "rbxassetid://0",
	["bg_sky.png"] = "rbxassetid://0",
	["bg_sky_rot.png"] = "rbxassetid://0",
	["bg_vig.png"] = "rbxassetid://0",
	["bg_void.png"] = "rbxassetid://0",
	["grain.png"] = "rbxassetid://0",
	["pv_letters.png"] = "rbxassetid://0",
	["pv_logo.png"] = "rbxassetid://0",
	["pv_white.png"] = "rbxassetid://0",
	["void_a.png"] = "rbxassetid://0",
	["void_b.png"] = "rbxassetid://0",
}

Config.Sounds = {
	music = "rbxassetid://0", -- pv_music.wav (loops 12 s -> 20 s by itself)
	intro = "rbxassetid://0", -- pv_intro.wav
	cut = "rbxassetid://0", -- pv_cut.wav
	ui = "rbxassetid://0", -- pv_ui.wav (all menu sounds in one file)
}

-- loudness (1 = as designed). The sliders in the settings dialog multiply these.
Config.MusicVolume = 1.6
Config.SfxVolume = 1.6
Config.UiVolume = 1.6
Config.MusicLoop = { 12, 20 } -- seconds: pv_music.wav loops inside this region

Config.DisplayOrder = 1000
Config.PreloadTimeout = 8 -- seconds to wait for images/sounds before showing the gate anyway
Config.FadeOut = 0.8 -- fade from the loading card into the game

Config.RemoteName = "PVIntroRemote"
Config.DataStoreName = "PocketVanguards_Intro_v1"
Config.NewSaveMeta = "Nv 1 · Início"

-- what a save slot holds when the player presses SALVAR (or starts a new game on an empty slot).
-- `old` is the previous save in that slot (or nil). Put your real game data in `data`.
function Config.MakeSave(player, slot, old)
	local now = os.time()
	return {
		name = player.DisplayName,
		meta = old and old.meta or Config.NewSaveMeta,
		created = old and old.created or now,
		updated = now,
		data = old and old.data or {},
	}
end

return Config
