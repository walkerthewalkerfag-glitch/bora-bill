# Sons de gameplay (Pocket Vanguards)

| Arquivo | Uso | Duração |
|---|---|---|
| pv_encounter.wav | Monstro sai do mato | 2,4 s |
| pv_trainer.wav | Batalha com treinador: abertura + trilha em loop | 28 s |
| pv_starter.wav | Escolher o fighter inicial | 3 s |
| pv_dream.wav | Golpe onírico | 3,2 s |
| pv_battle.wav | Música dentro da luta: `Looped = true`, o loop é perfeito | 22,9 s |
| pv_dreamworld.wav | Trilha do mundo dos sonhos: `Looped = true`, o loop é perfeito (24 s) | 24 s |
| pv_voices.wav | Bips de fala (Mina, Jin-Woo, Nico, Eco): 6 sílabas por voz, os trechos estão em `pv_voices_map.json` | 4,8 s |

## Jeito rápido: `PVSons.luau`

1. Crie um ModuleScript `PVSons` em ReplicatedStorage e cole o arquivo.
2. Ponha os IDs em `Sons.Ids`.
3. Use:
   - `Sons.play("encounter")`
   - `Sons.music("battle")` / `Sons.music("trainer")` / `Sons.stopMusic()`
   - `Sons.say("mina", texto, label)`

Ele já configura os loops e as vozes descritos abaixo.

## Voz tipo indie no Roblox

1. Suba `pv_voices.wav` e crie um `Sound` com `PlaybackRegionsEnabled = true`.
2. Para cada 2 letras que aparecem na caixa de diálogo, clone o `Sound`.
3. Ponha `PlaybackRegion = NumberRange.new(a, b)` usando o trecho da voz do personagem, e toque.
4. Escolha a sílaba com `string.byte(letra) % 6 + 1`, assim a mesma palavra soa sempre igual.
5. Não toque som em espaço nem em pontuação. Faça uma pausa de 180 ms em ".", "!" e "?", e de 90 ms em vírgula.

## Batalha com treinador (pv_trainer.wav)

A abertura continua no ritmo da batalha. No Roblox:
- `Looped = true`
- `PlaybackRegionsEnabled = true`
- `LoopRegion = NumberRange.new(14.72, 27.52)`

Assim a abertura toca uma vez e o groove de 8 compassos fica em loop sem emenda.
