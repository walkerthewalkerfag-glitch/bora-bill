# Botão CAPTURAR + escolha de cápsula (Roblox)

1. Coloque `CaptureUI.luau` como **ModuleScript** chamado `CaptureUI` no **ReplicatedStorage**.
2. Copie o exemplo `CaptureExample.client.luau` para um **LocalScript** e troque as cápsulas pelas da sua mochila.
3. Quando o jogador escolhe uma cápsula, `ui.Chosen` dispara com o `id` dela. Mande isso ao servidor e calcule a captura **lá**.

## Controles

- Abrir e fechar: clique ou toque no botão, **C** ou **X** do controle.
- Escolher: **1–5**, clique ou toque.
- Fechar: **Esc**, **Backspace** ou **B**.

## API

| Função | O que faz |
|---|---|
| `SetCapsules(lista)` | Define as cápsulas: `{id, name, count, rate, desc, color}` |
| `SetEnemyHp(0..1)` | Atualiza as barras de chance |
| `SetEnabled(bool)` | Trava o botão fora do seu turno |
| `Open` / `Close` / `Toggle` | Abre ou fecha a lista |
| `Destroy()` | Remove a interface no fim da batalha |

- A fórmula de chance é só visual. Troque passando `CaptureUI.new(gui, { chance = function(capsula, hp) return 0..100 end })`.
- O layout é o de 1280×720 e escala sozinho.
- Cápsula com 0 unidades treme e não é lançada.
