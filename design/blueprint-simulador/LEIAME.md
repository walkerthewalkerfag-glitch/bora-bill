# Blueprint do mapa: simulador de escavação

![Blueprint do mapa](blueprint-simulador.png)

Mapa visto de cima, com um desenho de referência para cada área. Cada jogador tem um lote encostado na montanha e cava o próprio túnel. Tudo gira em volta do Hub.

Na imagem, 1 px = 1 stud (na versão 2800 × 1800; o PNG está em 2x).

## Onde fica cada coisa

| # | Área | Onde | O que tem |
|---|---|---|---|
| 1 | Lobby · Chegada | Sul | Spawn, tutorial, prêmio diário, códigos e baú do grupo. Uma luz no chão leva cada jogador até o lote dele |
| 2 | Hub Central | Centro, raio 130 | Broca Gigante com o telão do próximo evento e 8 lojas: Picaretas, Mochilas, Vender, Ovos, Forja, Renascer, Placares e Missões |
| 3 | Lotes (8) | Anel em volta do Hub, raio 395 | 110 × 110 studs: placa com o nome, baú, vitrine, pets, bancada de upgrade e a boca do túnel no fundo |
| 4 | Túneis | Saem do fundo de cada lote, montanha adentro | Camadas Terra, Pedra, Cristal, Magma e Núcleo |
| 5 | Cavernas compartilhadas | Na camada Cristal, entre dois lotes vizinhos | Os túneis dos dois vizinhos se encontram |
| 6 | Zona de Eventos | Norte | Cratera do meteoro, palco, telão e arquibancada |
| 7 | Arena de Minigames | Leste | Corrida de Escavação (8 raias) e fila |
| 8 | Mina Pública | Oeste | Poço aberto com veios raros que reaparecem e o Poço dos Desejos |
| 9 | Trilho dos Vagonetes | Anel elevado, raio 205 | 4 estações (N, L, S, O) |
| 10 | Portais | Fundo do Lobby | Trocas, Eventos Globais, VIP e Torneio. Cada um leva a outro place |
| 11 | Mercador Viajante | Hub, a cada 1 h | Itens raros por 10 min |
| 12 | Verme Gigante | Anel Profundo, sai na Cratera | Chefe a cada 1 h, o servidor inteiro luta junto |

O Anel Profundo é um túnel em círculo, na camada Magma, que liga todos os túneis.

## Eventos ao vivo

| Quando | Onde | O quê |
|---|---|---|
| A cada 20 min (sorteia um) | Servidor | Chuva de meteoros, Corrida do Ouro (venda 2×), terremoto (salas secretas no túnel), chuva de baús na Mina Pública |
| A cada 1 h | Servidor | Verme Gigante e Mercador Viajante |
| Sábado, 18h | Todos os servidores | Show no palco com contagem no telão do Hub, sorte 3× e chuva de ovos |
| Todo mês | Temporada | Tema novo no mapa, camada nova no fim do túnel, placar da temporada zera |

## Editar a imagem

Os nomes, as posições e os textos estão em `gerar_blueprint.mjs`. Para gerar de novo:

```
npm install
npx playwright install chromium
npm run gerar
```
