# Pocket Vanguards: intro + tela de saves (Roblox)

Intro completa rodando no Roblox:

- Logo da Slimy Studios, com o slime pulando.
- Corte, revelação e logo do Pocket Vanguards.
- Menu de saves com 3 slots, com os botões Continuar/Novo jogo, Salvar, Excluir save, Modo Nuzlocke (em breve) e Configurações.
- Corte final e tela de carregamento, que depois some e mostra o jogo.

Toda a animação vem da mesma cena do protótipo web. O motor em Luau foi comparado com o da web quadro a quadro: 568 mil valores iguais, zero diferença.

## O que tem aqui

| Pasta ou arquivo | Para que serve |
|---|---|
| `PocketVanguardsIntro.rbxmx` | O pacote pronto para arrastar no Studio (scripts + módulos) |
| `images/` | As 20 imagens (PNG, até 1024 px) |
| `sounds/` | 4 sons (WAV): `pv_music` (trilha, faz loop sozinha), `pv_intro`, `pv_cut`, `pv_ui` (todos os sons do menu num arquivo só) |
| `src/` + `default.project.json` | O mesmo código, para quem usa Rojo |

## Instalar (5 minutos)

1. No Studio, arraste `PocketVanguardsIntro.rbxmx` para dentro de **ReplicatedStorage**.
   - Os scripts já vêm com `RunContext` (Client e Server), então rodam dali mesmo.
2. **Asset Manager → Bulk Import**:
   - Importe todos os PNG de `images/`.
   - Importe os 4 WAV de `sounds/`.
3. Abra `ReplicatedStorage.PocketVanguardsIntro.PVConfig` e cole os IDs no lugar de cada `rbxassetid://0`. Para pegar um ID, clique com o botão direito no asset e escolha **Copy Asset ID**. As chaves são os nomes dos arquivos.
4. Para os saves funcionarem no Studio: **Game Settings → Security → Enable Studio Access to API Services**. Sem isso eles ficam só na memória, e o output avisa.
5. Dê Play.

## Ligar no seu jogo

- **Cliente:** quando a tela de carregamento termina, `ReplicatedStorage.PocketVanguardsIntro.IntroFinished` (BindableEvent) dispara `(slot, save)`. Logo depois a intro some sozinha.
- **Servidor:**
  - `ReplicatedStorage.PocketVanguardsIntro.SlotChosen` (BindableEvent) dispara `(player, slot, saveData)`.
  - O player também ganha o atributo `PVSaveSlot`.
- **O que um save guarda:** está em `Config.MakeSave` (no PVConfig). Coloque os dados reais do jogo em `data`. O nome mostrado no card é o `DisplayName` do jogador.
- **Enquanto a intro roda:** chat, lista de jogadores, mochila e controles ficam desligados, e voltam no final.

## Controles e ajustes

- Funciona com mouse, toque (celular) e teclado/controle:
  - Enter ou botão A: começar.
  - Backspace ou botão B: fechar janela.
- A tela é 1280×720 e escala com faixas pretas em qualquer proporção.
- Configurações salvas por jogador: música, efeitos, tremor de câmera e pular intro ao abrir.
- Volume geral: `Config.MusicVolume`, `Config.SfxVolume` e `Config.UiVolume`.

## Sons

Clima calmo:
- Chuva suave, pad quente em Ré maior, caixinha de música e sinos de vidro.
- O slime tem voz própria: "blup" ao nascer da poça, "boing" borrachudo no pulo e "poyo" com duas tremidinhas ao cair.

É uma síntese original no estilo do slime de desenho (não é o áudio do anime, que tem direitos autorais).

## Observação honesta

Não consegui abrir o Roblox Studio daqui. O que foi testado:
- O motor e o menu, em Luau, contra a versão web.
- O renderizador, num emulador de Roblox (sem erros).

O visual final dentro do Studio precisa do seu Play. Se algo aparecer deslocado ou sem imagem, confira primeiro os IDs no PVConfig.
