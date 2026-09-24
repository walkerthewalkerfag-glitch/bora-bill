--!nonstrict
-- PVData: the ONLY file you connect to your game. Every screen reads from these functions and calls the
-- setters when the player changes something. The versions below hold demo data in memory; replace
-- each function body with reads/writes to your own systems (profile, party, inventory, dex...).
-- After your data changes from outside the HUD, call PVData.Changed:Fire("moves" | "fighter" | "dex" | "profile").
local Players = game:GetService("Players")

local D = {}
D.Changed = Instance.new("BindableEvent")

-- ------------------------------------------------------------------ fighter currently opened in the sheet
local fighter = {
	name = "Nome do lutador",
	level = 12,
	typeKey = "martial", -- martial, sombra, fogo, raio, agua, vento, terra, onirico, normal
	species = "Espécie",
	hp = { 72, 104 }, en = { 100, 100 }, xp = { 40, 315 },
	portrait = nil, -- "rbxassetid://..." image, or leave nil and set portraitModel
	portraitModel = nil, -- a Model to show in a ViewportFrame (e.g. the fighter's rig)
	favorite = false,
	stats = { { "HP", 62, 8 }, { "Poder", 48, 0 }, { "Defesa", 35, 4 }, { "Velocidade", 71, 0 }, { "Foco", 40, 6 } }, -- {name, base (0-100), bonus}
	freePoints = 0,
	talent = { name = "Nome do talento", desc = "Descrição do talento em uma ou duas linhas, dizendo quando ativa.", rank = 2, maxRank = 5, effects = { "Efeito principal", "Efeito secundário" }, nextUnlock = "2º talento · Desbloqueia no nível 30" },
	passives = { { name = "Nome da passiva", desc = "O que ela faz, em uma linha.", unlocked = true }, { name = "Nome da passiva", desc = "Desbloqueia no nível 20.", unlocked = false } },
	item = nil, -- id of the held item
	ultimate = { name = "Nome da ultimate", note = "1× por batalha · 100 EN" }, -- nil for fighters without one
}
function D.getFighter()
	return fighter
end
function D.setFavorite(on)
	fighter.favorite = on
end
function D.setNickname()
	-- open your own text box here
end

-- ------------------------------------------------------------------ moves
local moves = {
	{ id = "rap", name = "Golpe Rápido", type = "normal", cat = "fisico", lv = 1, power = 40, acc = 100, pp = 30, effect = "Sempre ataca primeiro no turno." },
	{ id = "pun", name = "Punho Sombrio", type = "sombra", cat = "fisico", lv = 1, power = 55, acc = 95, pp = 20, effect = "20% de chance de reduzir a defesa do alvo." },
	{ id = "pas", name = "Passo Fantasma", type = "martial", cat = "status", lv = 4, pp = 15, effect = "Aumenta a esquiva por 3 turnos." },
	{ id = "dup", name = "Corte Duplo", type = "martial", cat = "fisico", lv = 7, power = 30, acc = 90, pp = 15, effect = "Acerta duas vezes seguidas.", hits = 2 },
	{ id = "cha", name = "Chama Negra", type = "fogo", cat = "especial", lv = 9, power = 70, acc = 90, pp = 10, effect = "10% de chance de queimar." },
	{ id = "rug", name = "Rugido da Arena", type = "martial", cat = "status", lv = 11, acc = 100, pp = 20, effect = "Reduz o ataque de todos os inimigos." },
	{ id = "ond", name = "Onda Sombria", type = "sombra", cat = "especial", lv = 12, power = 75, acc = 100, pp = 10, effect = "Atinge todos os inimigos ao mesmo tempo.", isNew = true },
	{ id = "oni", name = "Lâmina Onírica", type = "onirico", cat = "especial", lv = 15, power = 85, acc = 95, pp = 8, effect = "20% de chance de adormecer o alvo." },
	{ id = "ral", name = "Relâmpago Marcial", type = "raio", cat = "fisico", lv = 19, power = 90, acc = 85, pp = 8, effect = "Pode paralisar (15%)." },
	{ id = "mil", name = "Mil Cortes", type = "martial", cat = "fisico", lv = 30, power = 120, acc = 75, pp = 5, effect = "Acerta de 2 a 5 vezes." },
}
local equipped = { "pun", "dup", "cha", "pas" }
-- list = every move of the fighter (learned + future), equipped = 4 ids, level = current level
function D.getMoves()
	return { list = moves, equipped = equipped, level = fighter.level }
end
-- put moveId in slot (1-4). If it was already in another slot the two swap. Return true if saved.
function D.equipMove(slot, moveId)
	local other = table.find(equipped, moveId)
	if other then
		equipped[other] = equipped[slot]
	end
	equipped[slot] = moveId
	for _, m in ipairs(moves) do
		if m.id == moveId then
			m.isNew = nil
		end
	end
	return true
end
function D.swapSlots(a, b)
	equipped[a], equipped[b] = equipped[b], equipped[a]
	return true
end

-- ------------------------------------------------------------------ held items (from the bag)
local items = {
	{ id = "faixa", name = "Faixa Rubra", desc = "+10% de Poder.", count = 3, color = Color3.fromRGB(227, 24, 47) },
	{ id = "amuleto", name = "Amuleto Sereno", desc = "Recupera 5% de HP por turno.", count = 1, color = Color3.fromRGB(63, 207, 154) },
	{ id = "lente", name = "Lente Focal", desc = "+15 de Foco.", count = 2, color = Color3.fromRGB(45, 155, 240) },
	{ id = "pena", name = "Pena Veloz", desc = "Age primeiro no 1º turno.", count = 1, color = Color3.fromRGB(245, 197, 66) },
	{ id = "selo", name = "Selo Sombrio", desc = "Golpes Sombra +10%.", count = 1, color = Color3.fromRGB(122, 134, 201) },
	{ id = "pedra", name = "Pedra Onírica", desc = "Chance de sono +10%.", count = 0, color = Color3.fromRGB(255, 122, 217) },
}
function D.getHeldItems()
	return items
end
function D.equipItem(id)
	for _, it in ipairs(items) do
		if it.id == fighter.item then
			it.count += 1
		end
		if it.id == id then
			it.count -= 1
		end
	end
	fighter.item = id
	return true
end
function D.removeItem()
	for _, it in ipairs(items) do
		if it.id == fighter.item then
			it.count += 1
		end
	end
	fighter.item = nil
	return true
end

-- ------------------------------------------------------------------ Ecodex
local dex = {
	{ no = "001", name = "Brasalume", types = { "fogo" }, status = "caught", kind = "Eco Brasa", height = 0.6, weight = 8.5, habitat = "Vulcão Adormecido", desc = "Guarda uma brasa na cauda que nunca apaga.", stats = { 45, 60, 40, 65, 55 }, image = nil },
	{ no = "002", name = "Brasardente", types = { "fogo", "martial" }, status = "seen", kind = "Eco Brasa", habitat = "Vulcão Adormecido" },
	{ no = "003", name = "Gotaluz", types = { "agua" }, status = "caught", kind = "Eco Orvalho", height = 0.4, weight = 3.2, habitat = "Lago Espelhado", desc = "Nasce do orvalho da primeira manhã do ano.", stats = { 50, 40, 55, 65, 50 } },
	{ no = "004", name = "Voltisco", types = { "raio" }, status = "caught", kind = "Eco Faísca", height = 0.5, weight = 6.1, habitat = "Mato Alto", desc = "Esconde-se no mato alto e salta quando alguém passa.", stats = { 40, 55, 35, 60, 90 } },
	{ no = "005", name = "Sombrelo", types = { "sombra" }, status = "seen", kind = "Eco Penumbra", habitat = "Floresta das Lanternas" },
	{ no = "006", name = "???", types = { "normal" }, status = "unknown" },
}
function D.getDex()
	return { seen = 5, caught = 3, total = 120, entries = dex }
end

-- ------------------------------------------------------------------ trainer profile
function D.getProfile()
	local p = Players.LocalPlayer
	return {
		name = p and p.DisplayName or "Treinador",
		userId = p and p.UserId or 0,
		title = "Caçador de Ecos",
		money = 12450,
		id = "#" .. string.format("%05d", (p and p.UserId or 0) % 100000),
		playtime = "12h 40min", wins = 58, caught = "21 / 120", seen = 34, since = "24/09/2026",
		badges = {
			{ name = "Brasa", color = Color3.fromRGB(255, 106, 43), earned = true }, { name = "Maré", color = Color3.fromRGB(45, 155, 240), earned = true },
			{ name = "Trovão", color = Color3.fromRGB(242, 194, 48), earned = true }, { name = "Penumbra", color = Color3.fromRGB(122, 134, 201), earned = false },
			{ name = "Rocha", color = Color3.fromRGB(192, 138, 74), earned = false }, { name = "Brisa", color = Color3.fromRGB(63, 207, 154), earned = false },
			{ name = "Arena", color = Color3.fromRGB(160, 102, 255), earned = false }, { name = "Sonho", color = Color3.fromRGB(255, 122, 217), earned = false },
		},
		team = { { name = "Brasardente", level = 15, typeKey = "fogo" }, { name = "Voltisco", level = 11, typeKey = "raio" }, false, false, false, false },
	}
end
-- options on the profile screen: "title", "avatar", "settings", "account"
function D.profileOption(name)
	print("[PVHud] opção do perfil:", name)
end

return D
