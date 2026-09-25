--!nonstrict
-- DomainClient: tecla / botão para lançar e recebe os eventos do servidor para desenhar o domínio.
-- Script com RunContext = Client dentro de ReplicatedStorage.PVDomain.
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local root = script.Parent
local Config = require(root:WaitForChild("DomainConfig"))
local VFX = require(root:WaitForChild("DomainVFX"))
local remote = root:WaitForChild("DomainRemote")
local player = Players.LocalPlayer

remote.OnClientEvent:Connect(function(action, a, b)
	if action == "start" then
		VFX.start(a)
	elseif action == "trap" then
		VFX.trap(a, b)
	elseif action == "stop" then
		VFX.stop(a)
	end
end)
remote:FireServer("sync") -- entrou no meio de um domínio? desenha também

if not Config.AllowPlayers then
	return
end

local function cast()
	if player.Character then
		remote:FireServer("cast")
	end
end

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then
		return
	end
	if input.KeyCode == Config.Key or input.KeyCode == Config.GamepadKey then
		cast()
	end
end)

-- botão redondo para celular
if Config.TouchButton and UserInputService.TouchEnabled then
	local gui = Instance.new("ScreenGui")
	gui.Name = "PVDomainButton"
	gui.ResetOnSpawn = false
	gui.Parent = player:WaitForChild("PlayerGui")
	local b = Instance.new("TextButton")
	b.AnchorPoint = Vector2.new(1, 1)
	b.Position = UDim2.new(1, -24, 1, -170)
	b.Size = UDim2.fromOffset(78, 78)
	b.BackgroundColor3 = Color3.fromRGB(14, 10, 26)
	b.Text = "領域"
	b.TextColor3 = Color3.fromRGB(235, 225, 255)
	b.TextSize = 26
	b.FontFace = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Heavy)
	b.AutoButtonColor = true
	b.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(1, 0)
	corner.Parent = b
	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(176, 120, 255)
	stroke.Thickness = 3
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = b
	b.Activated:Connect(cast)
end
