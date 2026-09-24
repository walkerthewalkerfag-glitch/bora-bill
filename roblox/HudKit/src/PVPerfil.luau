--!nonstrict
-- Tela PERFIL DO TREINADOR: cartão (avatar, nome, título, dinheiro, números), insígnias, equipe e opções.
local Players = game:GetService("Players")

local P = {}
P.__index = P

function P.new(hud)
	local self = setmetatable({ hud = hud, S = hud.S, D = hud.data }, P)
	self:build()
	return self
end

function P:build()
	local S = self.S
	local root = S.new("CanvasGroup", { Name = "Perfil", Size = UDim2.fromOffset(1280, 720), BackgroundTransparency = 1, Visible = false, Parent = self.hud.stage })
	self.root = root
	S.rect(root, 0, 0, 1280, 720, Color3.new(0, 0, 0), 0, 0.45)
	S.frame(root, 10, 88, 1262, 556, 1)
	S.slab(root, "Perfil", "Cartão de treinador")
	local _, card = S.panel(root, 30, 124, 612, 290, { kind = "right", slant = 26, z = 3 })
	self.card = S.box(card, 0, 0, 612, 290, 6)
	local _, badges = S.panel(root, 30, 424, 612, 196, { kind = "right", slant = 20, z = 3 })
	self.badges = S.box(badges, 0, 0, 612, 196, 6)
	local _, team = S.panel(root, 656, 132, 594, 282, { kind = "left", slant = 20, z = 3 })
	self.team = S.box(team, 0, 0, 594, 282, 6)
	local _, opt = S.panel(root, 656, 424, 594, 196, { kind = "left", slant = 20, z = 3 })
	S.title(opt, 36, 12, 200, 26, "OPÇÕES", 22, { ZIndex = 7 })
	for i, o in ipairs({ { "title", "i_profile", "Editar título" }, { "avatar", "i_fighters", "Trocar avatar" }, { "settings", "i_settings", "Configurações" }, { "account", "i_account", "Conta e dados" } }) do
		local c = S.catButton(opt, 34 + ((i - 1) % 2) * 270, 52 + math.floor((i - 1) / 2) * 70, 258, 62, o[2], o[3], nil, 7)
		c.button.Activated:Connect(function()
			S.sfx("select")
			if o[1] == "settings" then
				self.hud.openApp("settings")
			else
				self.D.profileOption(o[1])
			end
		end)
	end
	S.backButton(root, function()
		self.hud.back()
	end)
	self:refresh()
end

local function badgeShape(S, parent, x, y, color, earned)
	local g = S.box(parent, x, y, 58, 58, 8)
	S.shape(g, "para", 0, 4, 58, 50, 8, earned and S.C.gold or S.C.line, 8)
	S.shape(g, "para", 3, 7, 52, 44, 7, earned and color or Color3.fromRGB(20, 16, 18), 8)
	S.icon(g, earned and "star" or "lock", 17, 17, 24, earned and Color3.new(1, 1, 1) or Color3.fromRGB(90, 79, 83), 9)
	return g
end

function P:refresh()
	local S = self.S
	local p = self.D.getProfile()
	-- card
	self.card:ClearAllChildren()
	local av = S.box(self.card, 24, 18, 190, 250, 7)
	S.brush(av, "splash", -60, -20, 300, 290, 0, 7)
	local img = S.new("ImageLabel", { Position = UDim2.fromOffset(5, 20), Size = UDim2.fromOffset(180, 230), BackgroundTransparency = 1, ScaleType = Enum.ScaleType.Crop, ZIndex = 8, Parent = av })
	task.spawn(function()
		local ok, url = pcall(function()
			return Players:GetUserThumbnailAsync(p.userId, Enum.ThumbnailType.AvatarBust, Enum.ThumbnailSize.Size420x420)
		end)
		if ok then
			img.Image = url
		end
	end)
	local x = 236
	S.title(self.card, x, 20, 340, 46, S.upper(p.name), 42, { ZIndex = 8 })
	local tw = 24 + (utf8.len(p.title) or #p.title) * 8
	S.shape(self.card, "para", x, 70, tw, 24, 5, S.C.red, 8)
	S.title(self.card, x + 10, 70, tw, 24, S.upper(p.title), 14, { ZIndex = 9 })
	S.new("Frame", { Position = UDim2.fromOffset(x, 106), Size = UDim2.fromOffset(30, 30), BackgroundColor3 = S.C.gold2, ZIndex = 8, Parent = self.card }, { S.new("UICorner", { CornerRadius = UDim.new(1, 0) }), S.new("UIStroke", { Color = Color3.fromRGB(138, 100, 16), Thickness = 2 }) })
	local money = tostring(p.money):reverse():gsub("(%d%d%d)", "%1."):reverse():gsub("^%.", "")
	S.title(self.card, x + 40, 104, 250, 34, money, 32, { ZIndex = 8, TextColor3 = S.C.gold2 })
	local facts = { { "ID", p.id }, { "TEMPO", p.playtime }, { "VITÓRIAS", tostring(p.wins) }, { "CAPTURADOS", p.caught }, { "VISTOS", tostring(p.seen) }, { "DESDE", p.since } }
	for k, f in ipairs(facts) do
		local fx, fy = x + ((k - 1) % 3) * 114, 150 + math.floor((k - 1) / 3) * 56
		local g = S.shape(self.card, "para", fx, fy, 108, 48, 5, Color3.fromRGB(29, 22, 25), 8)
		S.text(g, 10, 6, 96, 12, f[1], S.BODYB, 10, S.C.mute, { ZIndex = 9 })
		S.text(g, 10, 22, 96, 20, f[2], S.BODYB, 15, S.C.bone, { ZIndex = 9 })
	end
	-- badges
	self.badges:ClearAllChildren()
	local earned = 0
	for _, b in ipairs(p.badges) do
		if b.earned then
			earned += 1
		end
	end
	S.title(self.badges, 20, 12, 200, 26, "INSÍGNIAS", 22, { ZIndex = 8 })
	S.text(self.badges, 450, 16, 120, 16, earned .. " / " .. #p.badges, S.BODYB, 12, S.C.dim, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
	for k, b in ipairs(p.badges) do
		local bx = 20 + (k - 1) * 70
		badgeShape(S, self.badges, bx, 56, b.color, b.earned)
		S.text(self.badges, bx - 6, 120, 70, 14, b.earned and S.upper(b.name) or "???", S.BODYB, 10, b.earned and S.C.dim or S.C.mute, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Center })
	end
	-- team
	self.team:ClearAllChildren()
	local n = 0
	for _, m in ipairs(p.team) do
		if m then
			n += 1
		end
	end
	S.title(self.team, 36, 12, 300, 26, "FIGHTERS NA EQUIPE", 22, { ZIndex = 8 })
	S.text(self.team, 440, 16, 120, 16, n .. " / 6", S.BODYB, 12, S.C.dim, { ZIndex = 8, TextXAlignment = Enum.TextXAlignment.Right })
	for k, m in ipairs(p.team) do
		local tx, ty = 36 + ((k - 1) % 3) * 180, 52 + math.floor((k - 1) / 3) * 110
		S.shape(self.team, "para", tx, ty, 172, 100, 8, m and Color3.fromRGB(36, 27, 31) or Color3.fromRGB(20, 16, 18), 8)
		if m then
			local tc = (S.TYPES[m.typeKey] or S.TYPES.normal)[2]
			local dot = S.new("Frame", { Position = UDim2.fromOffset(tx + 14, ty + 24), Size = UDim2.fromOffset(50, 50), BackgroundColor3 = tc, ZIndex = 9, Parent = self.team }, { S.new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
			if m.image then
				S.new("ImageLabel", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Image = m.image, ZIndex = 10, Parent = dot })
			end
			S.title(self.team, tx + 72, ty + 30, 96, 20, S.upper(m.name), 15, { ZIndex = 9 })
			S.text(self.team, tx + 72, ty + 52, 96, 14, "Lv " .. m.level .. " · " .. (S.TYPES[m.typeKey] or S.TYPES.normal)[1], S.BODYB, 11, S.C.dim, { ZIndex = 9 })
		else
			S.text(self.team, tx, ty, 172, 100, "VAGO", S.BODYB, 12, S.C.mute, { ZIndex = 9, TextXAlignment = Enum.TextXAlignment.Center })
		end
	end
end

function P:key()
	return false
end

function P:onShow()
	self:refresh()
end

return P
