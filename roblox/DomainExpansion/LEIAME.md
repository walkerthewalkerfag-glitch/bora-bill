# Expansão de Domínio: Vazio Infinito (Roblox)

É um golpe de **personagem**: só quem tem esse personagem consegue lançar. Pode ser um jogador ou um NPC/boss disparado pelo servidor.

![sequência](preview_domain.jpg)

O `preview_domain.gif` mostra a sequência animada.

## A cena (tempos em `Config.Timeline`)

| Tempo | O que acontece |
|---|---|
| 0.0 s | Close no rosto, de três quartos |
| 0.1–0.85 s | A mão esquerda vai até os olhos e puxa a venda pra cima |
| 0.8 s | Os olhos acendem (brilho, luz e faíscas) |
| 0.95–1.7 s | Close na mão direita subindo até o queixo, com os dedos cruzados |
| 1.35 s | "Tic" dos dedos: flash, túnel de linhas de velocidade e **領域展開 / EXPANSÃO DE DOMÍNIO** |
| 1.7–2.7 s | A cúpula preta explode a partir do personagem e a câmera recua na frente da parede |
| 2.7 s | O domínio fecha (flash branco). Os alvos travam e a câmera volta pro jogador |
| 2.7–3.4 s | Dentro: céu do vazio, névoa, chão espelhado e o **buraco negro** abrindo atrás de quem lançou. Aparece **無量空処 / VAZIO INFINITO** |
| até o fim | Quem foi pego tem a tela tomada por ruído de informação, flashes, blur e tremor, e perde o controle. Todos veem faíscas na cabeça dessa pessoa |
| fim | O vazio quebra, a cúpula encolhe, a venda volta pros olhos e a iluminação volta ao normal |

Quem está perto (até `Radius × CinematicRange`) vê a cena pela câmera. Quem está longe vê a cúpula preta de fora.

Detalhes técnicos da pose:
- A pose é gerada girando as juntas do R15 (`Motor6D.C0`) em todos os clientes com o mesmo relógio, então **não precisa subir animação**. Os ângulos foram calculados para a mão parar na frente do rosto, não dentro da cabeça.
- Os dedos cruzados são duas peças soldadas na mão.
- Se você tiver uma animação própria, coloque em `Config.CasterAnimationId`.

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `PocketVanguardsDomain.rbxmx` | Pasta `PVDomain`: `DomainServer` (Server), `DomainClient` (Client), `DomainConfig`, `DomainVFX`, `DomainCinematic` |
| `images/` | 14 imagens: 6 faces do céu, 4 camadas do buraco negro, linhas, brilho, partícula e ruído |
| `sounds/` | 5 sons (tudo síntese original) |
| `preview_domain.jpg` / `.gif` | Prévia 3D da sequência |
| `src/` + `default.project.json` | Para Rojo |
| `tools/` | Scripts que geraram as imagens e os sons (para refazer com outras cores) |

Os sons:
- `pv_domain_intro`: venda, olhos e estalo dos dedos
- `pv_domain_cast`: subida até o impacto quando o domínio fecha
- `pv_void_loop`: ambiente do vazio, em loop
- `pv_void_overload`: o que quem foi pego escuta, em loop
- `pv_domain_end`: o vazio quebrando

## Instalar

1. Arraste `PocketVanguardsDomain.rbxmx` para **ReplicatedStorage**. Os scripts já vêm com `RunContext`, então rodam dali.
2. **Asset Manager → Bulk Import:** as 14 imagens e os 5 sons.
3. Cole os IDs em `ReplicatedStorage.PVDomain.DomainConfig`, em `Images` e `Sounds`.

## Colocar o golpe num personagem

Escolha **um** jeito:

- **Pelo nome do modelo:** em `DomainConfig`, `Config.Characters` já tem um exemplo:
  ```lua
  Config.Characters = {
      Satoru = { mask = "Blindfold", eyeColor = Color3.fromRGB(110, 220, 255), fakeMask = true },
  }
  ```
  Troque `Satoru` pelo `Name` do modelo do personagem.
- **Pelo atributo `PVCharacter`:** se o personagem do jogador troca de modelo, ponha `PVCharacter = "Satoru"` no modelo e a chave da tabela passa a valer por ele.
- **Pelo atributo `PVDomainMove = true`:** o personagem usa o `Config.DefaultProfile`.

O que cada campo do perfil faz:
- `mask`: nome do Accessory (ou peça soldada na cabeça) que é a venda ou máscara. É ela que a mão puxa pra cima.
- `fakeMask = true`: se o personagem não tiver venda, cria uma preta só durante o golpe.
- `eyeColor`: cor do brilho dos olhos.

Personagem sem perfil não consegue lançar (`Config.RequireCharacter = true`).

## Lançar

- **Jogador:** tecla **G**, **Y** no controle ou o botão redondo 領域 no celular. Troque em `Config.Key`, `GamepadKey` e `TouchButton`.
- **Servidor (NPC, boss ou o seu sistema de batalha):**
  ```lua
  local PVDomain = game.ReplicatedStorage:WaitForChild("PVDomain")
  PVDomain.CastDomain:Fire(modeloDoPersonagem)

  PVDomain.DomainStarted.Event:Connect(function(id, caster, alvos)
      -- ex.: batalha por turnos: alvos perdem 2 turnos
  end)
  PVDomain.DomainEnded.Event:Connect(function(id, caster, alvos) end)
  ```
- **Só pelo seu sistema:** com `Config.AllowPlayers = false`, a tecla não faz nada e só o servidor lança. Use isso se o golpe tiver que vir pela tela de Golpes, como a ultimate do lutador.

## Regras (`DomainConfig`)

- `Radius = 60`: tamanho da cúpula.
- `Duration = 10`: segundos com o domínio fechado.
- `Cooldown = 30`: conta por jogador, não reseta ao renascer.
- `AnchorTargets = true`: quem é pego fica parado de verdade, igual NPCs. As velocidades voltam no fim.
- Se quem lançou morrer ou sair, o domínio acaba na hora e tudo volta ao normal.
- Quem entra no jogo no meio de um domínio também vê a cúpula (`sync`).

## Observações

- **Precisa de R15** para a pose. Em R6 a câmera e o domínio funcionam, mas os braços não se mexem.
- **Nomes:** "Vazio Infinito" e 無量空処 são de Jujutsu Kaisen. Se o jogo for público, dá para trocar os textos em `Config.Title` por um nome próprio do seu jogo. Visual, sons e código são originais.
- **O que foi testado:**
  - Num emulador de Roblox (lune), com servidor e cliente juntos: **47 checagens passaram**. Cobrem a cena, a câmera, pose, venda, olhos e dedos, a trava dos alvos, o céu e a névoa, quem fica fora e quem entra de novo, o fim, a morte no meio da cena e a limpeza de tudo.
  - A prévia 3D usa a mesma matemática da cena.
  - O Roblox Studio em si não roda aqui, então o ajuste fino do enquadramento é no seu Play: distâncias e ângulos das tomadas ficam em `Cine:update`, no `DomainCinematic`.
