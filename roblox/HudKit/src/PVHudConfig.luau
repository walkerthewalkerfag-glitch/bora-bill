--!nonstrict
-- PVHudConfig: asset IDs and options for the HUD kit.
-- Importe as imagens da pasta images/ (Asset Manager > Bulk Import) e cole os IDs abaixo.
local Config = {}

Config.Images = {
	tris = "rbxassetid://0", -- tris.png (triângulos que formam os cantos inclinados)
	icons = "rbxassetid://0", -- icons.png (todos os ícones)
	tex_rain = "rbxassetid://0", -- tex_rain.png
	tex_halftone = "rbxassetid://0", -- tex_halftone.png
	brush_swipe = "rbxassetid://0", -- brush_swipe.png
	brush_streak = "rbxassetid://0", -- brush_streak.png
	brush_splash = "rbxassetid://0", -- brush_splash.png
	brush_slab = "rbxassetid://0", -- brush_slab.png
	brush_under = "rbxassetid://0", -- brush_under.png
	wallpaper = "rbxassetid://0", -- papel de parede do celular (a imagem do treinador, rival e doutor)
}

Config.Sounds = {
	ui = "rbxassetid://0", -- pv_ui.wav (o mesmo arquivo de sons de menu da intro)
}
-- trechos do pv_ui.wav (segundos)
Config.UiSprite = { tick = { 0, 0.35 }, select = { 2, 3.8 }, save = { 4, 5.8 }, deny = { 6, 7.8 }, open = { 8, 9.8 }, close = { 10, 11.8 }, toggle = { 12, 12.35 }, delete = { 14, 15.8 } }
Config.UiVolume = 1.6

-- fonte dos títulos (troque pela fonte do seu jogo se quiser)
Config.DisplayFont = Font.new("rbxasset://fonts/families/RobotoCondensed.json", Enum.FontWeight.Heavy, Enum.FontStyle.Italic)

Config.ReducedMotion = false -- true desliga as animações
Config.PhoneKey = Enum.KeyCode.M -- abre o celular
Config.PhoneGamepadKey = Enum.KeyCode.ButtonSelect
Config.DisplayOrder = 20

-- apps do celular: id da tela, nome, ícone. Telas que você já tem: coloque screen = nil e use HudApi.AppOpened
Config.PhoneApps = {
	{ id = "ficha", name = "Fighters", icon = "i_fighters" },
	{ id = "ecodex", name = "Ecodex", icon = "i_ecodex", badge = true },
	{ id = "bag", name = "Mochila", icon = "i_bag" },
	{ id = "perfil", name = "Perfil", icon = "i_profile" },
	{ id = "settings", name = "Config.", icon = "i_settings" },
	{ id = "map", name = "Mapa", icon = "i_map" },
}

return Config
