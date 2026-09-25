--!nonstrict
-- DomainConfig: IDs e ajustes da Expansão de Domínio (Vazio Infinito).
-- Importe images/ e sounds/ (Asset Manager > Bulk Import) e cole os IDs abaixo.
local Config = {}

Config.Images = {
	sky_ft = "rbxassetid://0", -- céu do vazio: 6 faces
	sky_bk = "rbxassetid://0",
	sky_lf = "rbxassetid://0",
	sky_rt = "rbxassetid://0",
	sky_up = "rbxassetid://0",
	sky_dn = "rbxassetid://0",
	bh_core = "rbxassetid://0", -- buraco negro: disco + anel de fótons
	bh_gas = "rbxassetid://0", -- gás cinza-azulado que gira
	bh_ring = "rbxassetid://0", -- anel externo (dourado em cima, azulado à esquerda)
	bh_smoke = "rbxassetid://0", -- fumaça com brilhos ciano
	streak = "rbxassetid://0", -- linhas de velocidade
	glitter = "rbxassetid://0",
	speck = "rbxassetid://0",
	overload = "rbxassetid://0", -- ruído de "informação infinita" na tela de quem foi pego
	splash_1 = "rbxassetid://0", -- respingos brancos (4 formatos)
	splash_2 = "rbxassetid://0",
	splash_3 = "rbxassetid://0",
	splash_4 = "rbxassetid://0",
}

Config.Sounds = {
	cast = "rbxassetid://0", -- pv_domain_cast.wav
	loop = "rbxassetid://0", -- pv_void_loop.wav
	overload = "rbxassetid://0", -- pv_void_overload.wav
	ending = "rbxassetid://0", -- pv_domain_end.wav
	intro = "rbxassetid://0", -- pv_domain_intro.wav (máscara, olhos, estalo dos dedos)
}
Config.Volume = 1

-- QUEM TEM O GOLPE: o domínio é um golpe de personagem. Só lança quem estiver nesta lista (pelo Name do modelo
-- ou pelo atributo "PVCharacter" do modelo), ou quem tiver o atributo PVDomainMove = true.
--   mask     = nome do Accessory/peça da venda no personagem (ela é puxada pra cima na cena)
--   fakeMask = true cria uma venda preta temporária se o personagem não tiver uma
--   eyeColor = cor do brilho dos olhos quando a venda sai
--   eyes     = posição dos olhos na cabeça (fração do tamanho da Head): x = afastamento do centro, y = altura
--   maskDrop = quanto a venda desce (fração da altura da cabeça) — ela fica pendurada no pescoço
-- O modelo "Satoru" que vem no pacote é só um placeholder: apague e use o modelo do Gojo do seu jogo com o mesmo nome.
Config.Characters = {
	Satoru = { mask = "Blindfold", eyeColor = Color3.fromRGB(110, 220, 255), fakeMask = true, eyes = Vector2.new(0.16, 0.1), maskDrop = 0.62 },
}
Config.DefaultProfile = { mask = "Blindfold", eyeColor = Color3.fromRGB(110, 220, 255), fakeMask = true, eyes = Vector2.new(0.16, 0.1), maskDrop = 0.62 } -- para PVDomainMove = true
Config.RequireCharacter = true -- false = qualquer personagem pode lançar

-- tempos da cena (segundos desde o lançamento)
Config.Timeline = {
	sign = 1.35, -- estalo dos dedos cruzados: começa o túnel de linhas
	expand = 1.7, -- a esfera começa a crescer, câmera recua
	open = 2.7, -- o domínio fecha: alvos travam, abre o buraco negro
}
Config.Cinematic = true -- cena de câmera (close no rosto, máscara, dedos)
Config.CinematicRange = 1.5 -- quem está a até Radius × isso vê a cena pela câmera

-- DIMENSÃO: quando o domínio fecha, quem lançou e os alvos são levados para uma dimensão separada (o vazio),
-- mantendo a distância que tinham de quem lançou. No mapa fica só a cúpula preta. No fim, todos voltam pro lugar.
Config.UseDimension = true
Config.DimensionOrigin = Vector3.new(0, 4000, 0) -- longe do mapa (troque se o seu mapa usar essa área)
Config.DimensionSpacing = 1500 -- vários domínios ao mesmo tempo ficam lado a lado

-- regras
Config.Radius = 60 -- tamanho do domínio (studs)
Config.OpenTime = Config.Timeline.open
Config.Duration = 10 -- quanto tempo o domínio fica aberto depois de fechar
Config.Cooldown = 30
Config.AllowPlayers = true -- false = só o servidor lança (bosses/NPCs via CastDomain)
Config.AnchorTargets = true -- alvos ficam parados de verdade (ancorados)
Config.AnchorCasterDuringCast = true -- quem lança fica parado durante a cena
Config.CasterAnimationId = nil -- opcional: se quiser uma animação sua por cima da pose automática

-- controles
Config.Key = Enum.KeyCode.G
Config.GamepadKey = Enum.KeyCode.ButtonY
Config.TouchButton = true -- botão na tela para celular

-- textos da abertura
Config.Title = {
	top = "領域展開",
	topSub = "EXPANSÃO DE DOMÍNIO",
	name = "無量空処",
	nameSub = "VAZIO INFINITO",
}

-- visual
Config.StreakCount = 110
Config.SplashCount = 26 -- respingos brancos espalhados no vazio
Config.StreakColor = Color3.fromRGB(255, 255, 255) -- multiplica a cor da textura (rosa/magenta)
Config.VoidAmbient = Color3.fromRGB(78, 68, 120)
Config.FogColor = Color3.fromRGB(4, 3, 10)
Config.CameraPush = 1.25 -- zoom da câmera na abertura

-- perfil do personagem (nil = não tem o golpe)
function Config.profileFor(model)
	if not model then
		return nil
	end
	local p = Config.Characters[model.Name] or Config.Characters[model:GetAttribute("PVCharacter") or ""]
	if p then
		return p
	end
	if model:GetAttribute("PVDomainMove") == true or not Config.RequireCharacter then
		return Config.DefaultProfile
	end
	return nil
end

return Config
