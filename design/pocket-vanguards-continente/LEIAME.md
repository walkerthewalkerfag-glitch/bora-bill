# Mapa do continente: Pocket Vanguards

![Mapa do continente](continente-pocket-vanguards.png)

Continente do Pocket Vanguards visto de cima, no mesmo enquadramento do blueprint do simulador: mapa à esquerda, um desenho de referência por região à direita e os quadros de apoio embaixo. Cada região é o mundo de uma série e guarda uma insígnia. A aventura começa na Ilha Verdejante e termina na Torre dos Vanguardas, no meio do continente.

## Qual é qual

| # | Região | Série | Tipo | Insígnia | Fighter de referência |
|---|---|---|---|---|---|
| 1 | Ilha Verdejante | início (sem série) | Normal | — | — |
| 2 | Capital Encruzilhada | hub · Liga dos Vanguardas | — | Liga final | — |
| 3 | Vulcão Adormecido | Demon Slayer | Fogo | Brasa | Tanjiro |
| 4 | Porto do Farol | One Piece | Água | Maré | Luffy |
| 5 | Cidade dos Heróis | My Hero Academia | Raio | Trovão | Deku |
| 6 | Portões da Penumbra | Solo Leveling ✓ | Sombra | Penumbra | Sung Jin-Woo ✓ |
| 7 | Muralhas do Norte | Attack on Titan | Terra | Rocha | Levi |
| 8 | Penhasco dos Cata-ventos | Naruto | Vento | Brisa | Naruto |
| 9 | Arena do Torneio | Dragon Ball | Martial | Arena | Goku |
| 10 | Templo do Domínio | Jujutsu Kaisen ✓ | Onírico | Sonho | Gojo Satoru ✓ |
| 11 | Mundo dos Sonhos | dimensão à parte | Onírico | — | — |
| 12 | Trem Vanguarda e balsa | transporte | — | — | — |

✓ = já existe no jogo (a Expansão de Domínio do Gojo e a ficha do Jin-Woo). As outras 6 séries são sugestão pelo tipo que combina com cada insígnia. Para trocar uma série, basta mudar o nome no `SERIES`, no `CARDS` e na tabela do `insetTable()` em `gerar_continente.mjs`; o desenho da região continua servindo.

## Lugares do jogo que já estavam na HUD e na Ecodex

Vila Verdejante, laboratório da Mina, Mato Alto, Lago Espelhado e Círculo de Pedra ficam na Ilha Verdejante. Floresta das Lanternas virou os Portões da Penumbra. Vulcão Adormecido, Penhasco dos Cata-ventos, Praia do Farol e Mundo dos Sonhos viraram regiões inteiras.

## Ordem da aventura

Ilha Verdejante (Lv 1–8) → Vulcão (Brasa) → Porto (Maré, de balsa) → Heróis (Trovão) → Portões (Penumbra) → Muralhas (Rocha) → Penhasco (Brisa) → Arena (Arena) → Templo (Sonho, Lv 50+, abre o Mundo dos Sonhos) → Capital (Liga). O Trem Vanguarda segue essa ordem no sentido horário, com 9 estações. As rotas R1 a R12 têm mato alto para encontros.

## Escala

1 quadrado da grade = 50 unidades = 500 studs (é referência, não tamanho final). O continente inteiro dá uns 10,7 × 7,2 km.

## Gerar de novo

```
npm install
npx playwright install chromium
npm run gerar
```
