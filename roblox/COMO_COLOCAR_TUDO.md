# Pocket Vanguards: como colocar tudo no Roblox

São 4 pacotes. Instale nesta ordem (cada um funciona sozinho, então pode parar em qualquer passo e testar):

| # | Pasta | O que é |
|---|---|---|
| 1 | `PocketVanguardsIntro/` | Intro (Slimy Studios → logo) + tela de saves |
| 2 | `HudKit/` | Celular e telas: Golpes, Ficha do lutador, Ecodex, Perfil |
| 3 | `CaptureButton/` | Botão CAPTURAR da batalha com escolha de cápsula |
| 4 | `sons-gameplay/` | Mato, treinador, inicial, golpe onírico, músicas e vozes |

## Antes de começar

- Abra o jogo no **Roblox Studio** e deixe o **Explorer** e o **Asset Manager** abertos (menu **View**).
- **Subir imagens e sons:** Asset Manager → **Bulk Import** → escolha os arquivos.
- **Pegar um ID:** botão direito no asset → **Copy Asset ID** → cole no lugar do `rbxassetid://0`.
- Sons novos passam pela moderação do Roblox e podem levar alguns minutos para tocar.

## 1. Intro e tela de saves

1. Arraste `PocketVanguardsIntro/PocketVanguardsIntro.rbxmx` para **ReplicatedStorage**.
2. Bulk Import das 20 imagens de `images/` e dos 4 sons de `sounds/`.
3. Cole os IDs em `ReplicatedStorage.PocketVanguardsIntro.PVConfig`.
4. **Game Settings → Security → Enable Studio Access to API Services** (para os saves).
5. Play. Detalhes em `PocketVanguardsIntro/LEIAME.md`.

## 2. HUD (celular + telas)

1. Arraste `HudKit/PocketVanguardsHudKit.rbxmx` para **ReplicatedStorage**.
2. Bulk Import das 10 imagens de `HudKit/images/`. O `pv_ui.wav` é o mesmo da intro: reaproveite o ID.
3. Cole os IDs em `ReplicatedStorage.PVHudKit.PVHudConfig`.
4. Play → quando a intro acabar, aperte **M** ou clique na aba **CELULAR**.
5. Ligue nos seus dados pelo `PVData` (é o único arquivo que você precisa editar). Veja `HudKit/LEIAME.md`.

## 3. Botão Capturar

1. Crie um **ModuleScript** chamado `CaptureUI` em **ReplicatedStorage** e cole `CaptureButton/CaptureUI.luau`.
2. Crie um **LocalScript** em **StarterPlayerScripts** e cole `CaptureButton/CaptureExample.client.luau`.
3. Troque as cápsulas do exemplo pelas da sua mochila.
4. Quando o jogador escolhe, `ui.Chosen` dispara. Mande para o servidor e calcule a captura **lá**.

Detalhes em `CaptureButton/LEIAME.md`.

## 4. Sons de gameplay

1. Bulk Import dos 7 WAV de `sons-gameplay/`.
2. Crie um **ModuleScript** chamado `PVSons` em **ReplicatedStorage**, cole `sons-gameplay/PVSons.luau` e ponha os IDs em `Sons.Ids`.
3. Use nos seus LocalScripts:

```lua
local Sons = require(game.ReplicatedStorage.PVSons)

-- monstro saiu do mato
Sons.play("encounter")
Sons.music("battle")        -- música da luta (loop perfeito)

-- batalha com treinador: abertura uma vez, depois o groove em loop
Sons.music("trainer")

-- fim da luta
Sons.stopMusic()

-- escolheu o inicial / usou golpe onírico
Sons.play("starter")
Sons.play("dream")

-- entrou no mundo dos sonhos
Sons.music("dreamworld")

-- diálogo com voz (vozes: "mina", "jinwoo", "nico", "eco")
Sons.say("mina", "Oi! Vamos pro Círculo de Pedra?", caixaDeTexto)
```

## Como fica no Explorer

```
ReplicatedStorage
├── PocketVanguardsIntro   (pasta da intro: PVClient, PVServer e módulos)
├── PVHudKit               (PVHudBoot + 9 módulos)
├── CaptureUI              (ModuleScript)
└── PVSons                 (ModuleScript)
StarterPlayer
└── StarterPlayerScripts
    └── CaptureExample     (LocalScript: o seu código de batalha)
```

## Se algo der errado

| Sintoma | Causa provável |
|---|---|
| Quadrados brancos ou sem imagem | ID faltando ou errado no `PVConfig` / `PVHudConfig` |
| Nada acontece ao apertar M | A intro ainda está na tela, ou o `PVHudBoot` foi desativado |
| Sem som | ID do som ainda em `rbxassetid://0`, ou o áudio ainda está em moderação |
| Saves não salvam no Studio | Falta ligar **Enable Studio Access to API Services** |
| Erro "Requested module experienced an error" | Veja a primeira linha vermelha no Output. Normalmente é um ID colado sem aspas |

Tudo foi testado num emulador de Roblox (lune), que monta cada tela com as classes e propriedades reais. O Studio em si não roda aqui, então o teste final é o seu Play.
