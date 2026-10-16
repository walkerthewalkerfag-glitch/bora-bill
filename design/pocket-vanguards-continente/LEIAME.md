# Mapa da região: Pocket Vanguards

![Mapa da região](continente-pocket-vanguards.png)

Região do Pocket Vanguards vista de cima, no estilo de mapa de jogo do Pokémon Brick Bronze (ilha de rocha com formato irregular: lobo de deserto a noroeste, faixa norte, braço oeste, península ao sul e uma baía grande a leste com ilhas dentro; cada lugar é um platô recortado com o próprio bioma): você sai da Vila Verdejante e segue R1, R2, R3… Cada cidade é o mundo de uma série e guarda um ginásio. Entre uma cidade e outra tem um sub-lugar com Ecos próprios (lago, floresta, círculo de pedra, deserto, penhasco, montanha de neve, costa de pedra, masmorra, caverna, ilha) e um bioma diferente. O enquadramento é o mesmo do blueprint do simulador: mapa à esquerda, um desenho por lugar à direita, tabela "qual é qual", linha da aventura e símbolos embaixo.

Todos os nomes de cidade são provisórios. JoJo, Star Rail, Dragon Ball (Capsule City = cidade 3) e Naruto foram citados por você; Jujutsu Kaisen e Solo Leveling já estão no jogo; Demon Slayer e One Piece são sugestão para fechar os 8 ginásios.

## Regiões

A ilha inteira é dividida em regiões, uma por lugar. O barro marrom só aparece nas bordas, como degrau de terreno entre uma região e outra.

| Região | Chão e clima | O que tem |
|---|---|---|
| Vila Verdejante | campo verde com flores | casinhas, laboratório, moinho, plantação, Lago Espelhado |
| Cidade Farol (One Piece) | praia tropical, água turquesa | coqueiros, cais, farol, navios piratas, barris; Ilha do Navio ao lado |
| Floresta das Lanternas | mata fechada e escura | lanternas penduradas entre as árvores |
| Capsule City (Dragon Ball) | grama verde viva | domos, Capsule Corp., carros flutuantes, ringue do torneio; Casa do Kame numa ilhota |
| Ermos Rochosos (Dragon Ball) | terra seca | pilares de pedra, crateras, esferas do dragão, Círculo de Pedra |
| Deserto de Vidro (Naruto) | areia com dunas | Vila da Areia murada, torre do Kazekage, oásis, rajadas de areia |
| Vale do Fim (Naruto) | mata verde | cânion com rio, cachoeira e as duas estátuas |
| Monte Kamado (Demon Slayer) | neve | pinheiros nevados, cabana de carvão, teia do Monte Natagumo |
| Vale das Glicínias (Demon Slayer) | campo verde claro | glicínias roxas, casas de madeira, torii, mansão das borboletas, arrozais |
| Serra do Meio (Liga) | rocha cinza | picos nevados, platô da Torre, Caminho da Vitória |
| Cidade Áurea (JoJo) | campo mediterrâneo | telhados de terracota, Coliseu, ciprestes, limoeiros, gôndolas, Costa de Pedra |
| Cidade dos Portões (Solo Leveling) | asfalto claro | arranha-céus, Associação dos Caçadores, Rio Han, portões azuis e um vermelho, Masmorra Dupla, Ilha de Jeju |
| Cidade Amaldiçoada (JJK) | cidade roxa com névoa | prédios escuros, cruzamento de Shibuya, maldições, Escola Jujutsu, cúpula do domínio |
| Estação Astral (Star Rail) | espaço, na baía | estação espacial, Expresso Astral |
| Mundo dos Sonhos | ilha crescente, na baía | ilhas flutuantes, Sonecão |

## Linha da aventura

| # | Lugar | Série | Bioma | Tipo · insígnia | Fighter de referência | Chegada |
|---|---|---|---|---|---|---|
| 1 | Vila Verdejante | início | campo | Normal | — | Lab da Mina, Mato Alto |
| — | Lago Espelhado | sub-lugar | lago | — | — | R1 → R2 |
| 2 | Cidade Farol (ginásio 1) | One Piece | porto, praia | Água · Maré | Luffy | balsa opcional para a Ilha do Navio |
| — | Floresta das Lanternas | sub-lugar | floresta escura | — | — | R3 → R4 |
| 3 | Capsule City (ginásio 2) | Dragon Ball | cidade tech, domos da Capsule Corp., ringue | Martial · Arena | Goku | R4 |
| — | Círculo de Pedra, Deserto de Vidro, Oásis | sub-lugares | deserto | — | — | R5 → R6 |
| 4 | Cidade das Dunas (ginásio 3) | Naruto | vila de areia | Vento · Brisa | Gaara | R6 |
| — | Vale do Fim, Monte Kamado, Monte Natagumo | sub-lugares | cânion, neve | — | — | R7 → R8 → R9 |
| 5 | Vila das Glicínias (ginásio 4) | Demon Slayer | vale de glicínias e arrozais | Fogo · Brasa | Tanjiro | R9 |
| — | Costa de Pedra | sub-lugar | penhascos no mar | — | — | R10 |
| 6 | Cidade Áurea (ginásio 5) | JoJo | cidade costeira colorida, praça da seta | Terra · Rocha | Giorno | R10 |
| 7 | Cidade dos Portões (ginásio 6) | Solo Leveling ✓ | metrópole com portões azuis, Masmorra Dupla | Sombra · Penumbra | Sung Jin-Woo ✓ | R11 |
| 8 | Estação Astral (ginásio 7) | Star Rail | ilha flutuante no mar | Raio · Trovão | Trailblazer | R12, Expresso Astral (trem sobre o mar, ida e volta) |
| 9 | Cidade Amaldiçoada (ginásio 8) | Jujutsu Kaisen ✓ | cidade noturna, escola, cúpula do domínio | Onírico · Sonho | Gojo Satoru ✓ | R13 |
| — | Mundo dos Sonhos | dimensão à parte | ilhas flutuantes | Onírico | — | dormindo na Cidade Amaldiçoada |
| — | Caminho da Vitória | sub-lugar | caverna na Serra do Meio | — | — | R14, só com 8 insígnias |
| 10 | Liga dos Vanguardas | final | Torre dos Vanguardas no centro | — | — | R14 |

Cada rota só abre depois do ginásio anterior. A Serra do Meio bloqueia o atalho até a Liga.

## Escala

1 quadrado da grade = 50 unidades = 500 studs (referência, não tamanho final). A região inteira dá uns 10,7 × 7,2 km.

## Trocar uma série ou um nome

Está tudo em `gerar_continente.mjs`: nomes e séries em `SERIES` (rótulos do mapa), `CARDS` (cards da direita) e nas tabelas de `insetTable()` e `insetLine()`. As posições das cidades ficam em `CITY`, os sub-lugares em `SUB` e as rotas em `ROUTES`.

## Gerar de novo

```
npm install
npx playwright install chromium
npm run gerar
```
