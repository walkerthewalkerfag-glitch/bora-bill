# Sons de gameplay (Pocket Vanguards)

| Arquivo | Uso | Duração |
|---|---|---|
| pv_encounter.wav | Monstro sai do mato | 2,4 s |
| pv_trainer.wav | Começo de batalha com treinador | 3 s |
| pv_starter.wav | Escolher o fighter inicial | 3 s |
| pv_dream.wav | Golpe onírico | 3,2 s |
| pv_dreamworld.wav | Trilha do mundo dos sonhos: `Looped = true`, o loop é perfeito (24 s) | 24 s |
| pv_voices.wav | Bips de fala (Mina, Jin-Woo, Nico, Eco): 6 sílabas por voz, os trechos estão em `pv_voices_map.json` | 4,8 s |

## Voz tipo indie no Roblox

1. Suba `pv_voices.wav` e crie um `Sound` com `PlaybackRegionsEnabled = true`.
2. Para cada 2 letras que aparecem na caixa de diálogo, clone o `Sound`.
3. Ponha `PlaybackRegion = NumberRange.new(a, b)` usando o trecho da voz do personagem, e toque.
4. Escolha a sílaba com `string.byte(letra) % 6 + 1`, assim a mesma palavra soa sempre igual.
5. Não toque som em espaço nem em pontuação. Faça uma pausa de 180 ms em ".", "!" e "?", e de 90 ms em vírgula.
