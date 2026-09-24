-- Example: StarterPlayerScripts LocalScript. Shows the CAPTURAR button during a wild battle.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local CaptureUI = require(ReplicatedStorage:WaitForChild("CaptureUI"))

local ui = CaptureUI.new(Players.LocalPlayer:WaitForChild("PlayerGui"))
ui:SetCapsules({
	{ id = "eco", name = "Cápsula Eco", count = 12, rate = 1, desc = "Comum.", color = Color3.fromRGB(227, 24, 47) },
	{ id = "rubra", name = "Cápsula Rubra", count = 5, rate = 1.5, desc = "Mais firme.", color = Color3.fromRGB(122, 9, 23) },
	{ id = "aurea", name = "Cápsula Áurea", count = 2, rate = 2.2, desc = "Alta chance.", color = Color3.fromRGB(245, 197, 66) },
	{ id = "onirica", name = "Cápsula Onírica", count = 1, rate = 3, desc = "×3 se dormindo.", color = Color3.fromRGB(255, 122, 217) },
	{ id = "veloz", name = "Cápsula Veloz", count = 0, rate = 4, desc = "×4 no 1º turno.", color = Color3.fromRGB(45, 155, 240) },
})
ui:SetEnemyHp(0.34) -- call again whenever the wild monster's HP changes

-- send the choice to the server (the server decides if the catch works; never trust the client's chance)
local remote = ReplicatedStorage:FindFirstChild("ThrowCapsule") :: RemoteEvent?
ui.Chosen:Connect(function(capsuleId)
	if remote then
		remote:FireServer(capsuleId)
	end
	print("capsule chosen:", capsuleId)
end)

-- ui:SetEnabled(false) while it's not the player's turn; ui:Destroy() when the battle ends
