-- PVHudBoot: inicia a HUD (celular na borda esquerda + telas). Script com RunContext = Client dentro da
-- pasta ReplicatedStorage.PVHudKit — roda sozinho para cada jogador. Se preferir, apague este script e chame
-- require(ReplicatedStorage.PVHudKit.PVHud).start() no seu próprio LocalScript.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Hud = require(script.Parent:WaitForChild("PVHud"))

-- se a intro do Pocket Vanguards estiver no jogo, a HUD só aparece quando ela terminar
if ReplicatedStorage:FindFirstChild("PocketVanguardsIntro") then
	local pg = Players.LocalPlayer:WaitForChild("PlayerGui")
	local introGui = pg:WaitForChild("PocketVanguardsIntro", 8)
	while introGui and introGui.Parent do
		introGui.AncestryChanged:Wait()
	end
end
Hud.start()
