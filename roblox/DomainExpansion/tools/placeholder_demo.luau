-- PlaceholderDemo: modelo de teste do golpe. Chegue perto e segure E para lançar a Expansão de Domínio.
-- É só um placeholder: apague este modelo e use o Gojo do seu jogo com o mesmo nome ("Satoru")
-- ou com o perfil que você colocar em PVDomain.DomainConfig.Characters.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local model = script.Parent
local prompt = model:WaitForChild("HumanoidRootPart"):WaitForChild("DomainPrompt")
prompt.Triggered:Connect(function()
	local pv = ReplicatedStorage:FindFirstChild("PVDomain")
	local cast = pv and pv:WaitForChild("CastDomain", 5)
	if cast then
		cast:Fire(model)
	else
		warn("[PVDomain] coloque a pasta PVDomain em ReplicatedStorage")
	end
end)
