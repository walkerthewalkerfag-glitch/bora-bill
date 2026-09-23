# 📜 Grimório de Skills: 11 Elementos × 10 Skills

**110 skills**: Inferno, Frost, Storm, Nature, Martial, Blood, Beast, Arcane, Spirit, Divine e Shadow.
Cada elemento tem estilo e mecânica próprios. Todos têm skills de dano, cura, buff, debuff, controle, skills fortes que cobram um preço de quem usa, e uma **★ Ultimate**.

> Os números são um ponto de partida. Ajuste tudo no playtest.

---

## Como ler

| Campo | Significado |
|---|---|
| **Tipo** | **Físico** (golpes de contato, escala com FOR/AGI) · **Mágico** (escala com MAG/FÉ) · **Suporte** (buff, debuff ou utilidade, sem dano direto) · **Cura** |
| **Alvo** | Inimigo · Todos os inimigos · Você · Aliado (pode ser você) · Equipe (você + aliados) · Campo. Em 1v1, "Todos os inimigos" = o oponente |
| **Poder** | Dano base. `—` = não causa dano direto · `×N` = número de golpes · faixa ou `+` = poder variável (explicado no efeito) |
| **Prec.** | Chance de acertar. `—` = nunca erra (ou é usada em você / no campo) |
| **PP** | Quantas vezes pode ser usada por batalha |
| **Scaling** | Atributo que aumenta o dano (ou a cura/escudo) e a nota do scaling |
| **★** | Ultimate, a skill mais forte do elemento (PP 1–2) |
| **3t** | Dura 3 turnos |

### Atributos

| Sigla | Atributo | Serve para |
|---|---|---|
| **FOR** | Força | Dano Físico |
| **MAG** | Magia | Dano Mágico |
| **AGI** | Agilidade | Ordem dos turnos, crítico e esquiva |
| **VIT** | Vitalidade | HP máximo e DEF |
| **FÉ** | Fé | Curas, escudos e poder de Spirit/Divine |

### Notas de scaling

| Nota | S | A | B | C | D |
|---|---|---|---|---|---|
| **Coeficiente** | 1.5 | 1.2 | 0.9 | 0.6 | 0.3 |

```
Dano = Poder × (1 + Atributo × Coeficiente ÷ 100)
```

- **Exemplo:** Poder 80, MAG 50, scaling A → 80 × (1 + 50 × 1.2 ÷ 100) = 80 × 1.6 = **128** (antes de DEF, crítico etc.).
- **Dois atributos** (ex.: `FOR B · AGI C`): some as duas partes → `Poder × (1 + (FOR × 0.9 + AGI × 0.6) ÷ 100)`.
- **Curas e escudos** usam a mesma conta sobre o valor base. Sugestão: use metade do coeficiente para a cura não ficar forte demais.

### Regras gerais

- **Prioridade +N**: age antes de quem tem prioridade menor, independente da AGI. Prioridade negativa age depois.
- **Crítico**: ×1.5 de dano.
- **Recuo**: você perde parte do dano que causou.
- **Recarga**: você perde o próximo turno.
- **Custo de HP**: nunca te derrota. Se não tiver HP suficiente, a skill não pode ser usada.
- Reaplicar um status renova a duração. Só acumula quando o status diz "cargas".

---

## Efeitos de status

A duração da tabela é o padrão. Se a skill diz outra, vale a da skill.

### Negativos (debuffs)

| Efeito | O que faz | Duração |
|---|---|---|
| **Queimadura** | Perde 6% do HP máx por turno e causa -20% de dano Físico | 3t |
| **Sangramento** | Acumula até 5 cargas; cada carga tira 2% do HP máx por turno | 3t (renova a cada nova carga) |
| **Veneno** | Dano crescente: 4% → 6% → 8% → 10% do HP máx | 4t |
| **Calafrio** | -10% AGI por carga (máx. 3). Na 3ª carga o alvo fica **Congelado** e as cargas somem | 4t |
| **Congelado** | Perde o próximo turno. Dano de Inferno descongela na hora. Depois fica imune a Congelado por 2t | 1t |
| **Paralisia** | -30% AGI e 25% de chance de perder o turno | 3t |
| **Atordoado** | Perde o próximo turno. Depois fica imune a Atordoado por 2t | 1t |
| **Sono** | Não age. Acorda ao receber dano direto (dano por turno não acorda) | 1–3t |
| **Confusão** | 33% de chance de se atacar (Poder 40) em vez de agir | 2–4t |
| **Medo** | -25% de dano causado e 20% de chance de hesitar (perder o turno) | 2t |
| **Cegueira** | -30% de Precisão | 3t |
| **Silêncio** | Só pode usar skills Físicas | 2t |
| **Provocado** | Só pode usar skills que causam dano | 3t |
| **Enraizado** | Não pode fugir/trocar nem usar skills com Prioridade; -20% AGI | 3t |
| **Maldição** | Cura recebida -50%; buffs recebidos duram 1 turno a menos | 4t |
| **Quebra de Armadura** | -30% DEF | 3t |
| **Enfraquecido** | -25% de dano causado | 3t |
| **Vulnerável** | Recebe +25% de dano | 2t |
| **Exausto** | -25% em FOR, MAG, AGI e FÉ | 2t |

### Positivos (buffs)

| Efeito | O que faz | Duração |
|---|---|---|
| **Regeneração** | Cura 8% do HP máx por turno | 3t |
| **Escudo** | Absorve dano até o valor indicado na skill | Até quebrar ou 3t |
| **Pressa** | +40% AGI | 4t |
| **Fúria** | +30% de dano causado, mas -20% DEF | 3t |
| **Furtivo** | Inimigos têm -50% de Precisão contra você. Seu 1º ataque encerra a Furtividade e causa +50% de dano | 2t |
| **Bênção** | +15% em todos os atributos | 4t |

---

## Visão geral

| Elemento | Estilo | Mecânica própria |
|---|---|---|
| 🔥 **Inferno** | Dano explosivo e Queimadura; se machuca para bater mais forte | **Calor** |
| ❄️ **Frost** | Controle e defesa; congela e estilhaça | **Calafrio → Congelado → Estilhaçar** |
| ⚡ **Storm** | Velocidade, prioridade, multi-hit e caos | **Carga** |
| 🌿 **Nature** | Sustento, veneno, drenagem e raízes | **Sementes** |
| 🥋 **Martial** | Técnica pura: combos, contra-ataques e precisão | **Combo** |
| 🩸 **Blood** | Troca vida por poder; roubo de vida e Sangramento | **Custo de HP** |
| 🐺 **Beast** | Ferocidade, caça e instinto | **Presa** |
| 🔮 **Arcane** | Manipula PP, buffs, feitiços e o tempo | **Anti-magia** |
| 👻 **Spirit** | Almas, medo e o plano etéreo | **Etéreo** |
| ✨ **Divine** | Cura, proteção, purificação e punição | **Luz** |
| 🌑 **Shadow** | Furtividade, críticos, enganação e maldições | **Furtivo + Oportunismo** |

---

## 🔥 Inferno

*Dano explosivo, Queimadura e poder em troca de se machucar.*

> **Calor** (máx. 5): cada Calor dá +5% de dano às suas skills Inferno. Algumas skills geram Calor e **Pyroclasm** consome tudo. Ficar **Congelado** apaga todo o seu Calor.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Ember Bolt** | Mágico | Inimigo | 40 | 100% | 35 | MAG C | 20% de chance de **Queimadura**. Gera 1 Calor. |
| 2 | **Flame Lash** | Físico | Inimigo | 65 | 95% | 20 | FOR B · MAG D | +50% de dano se o alvo já estiver com **Queimadura**. Gera 1 Calor. |
| 3 | **Molten Slag** | Mágico | Inimigo | 55 | 90% | 15 | MAG C | Cobre o alvo de metal derretido: **Quebra de Armadura** e -20% AGI (3t). |
| 4 | **Flame Wave** | Mágico | Todos os inimigos | 70 | 90% | 12 | MAG B | Onda de fogo. 20% de chance de **Queimadura** em cada alvo. |
| 5 | **Blazing Charge** | Físico | Inimigo | 110 | 95% | 10 | FOR A | Investida em chamas. **Recuo:** você perde 25% do dano causado. 10% de chance de **Queimadura**. |
| 6 | **Kindle** | Suporte | Você | — | — | 15 | — | Aviva a chama interna: gera 3 Calor e +25% MAG (3t). |
| 7 | **Cinder Veil** | Suporte | Você | — | — | 12 | — | Véu de cinzas (3t): você recebe -15% de dano e quem te atacar com skill Física fica com **Queimadura**. |
| 8 | **Cauterize** | Cura | Você | — | — | 10 | MAG C | Cura 40% do HP máx e remove **Sangramento** e **Veneno**, mas você fica com **Queimadura** (2t). |
| 9 | **Pyroclasm** | Mágico | Inimigo | 140 | 85% | 5 | MAG S | Consome todo o Calor: +12% de dano por Calor consumido. Depois você superaquece: -40% MAG (3t). |
| 10 | ★ **Phoenix Rite** | Suporte | Você | — | — | 1 | MAG A | Por 5t, se você for derrotado: renasce com 40% do HP máx, sem debuffs e com 5 Calor, e explode causando Poder 100 + **Queimadura** em todos os inimigos. |

---

## ❄️ Frost

*Controle e defesa: desacelera, congela e estilhaça.*

> **Calafrio → Congelado → Estilhaçar**: acumule Calafrio (3 cargas congelam o alvo) e finalize com **Shatter** para dano massivo.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Frost Shard** | Mágico | Inimigo | 40 | 100% | 35 | MAG C | 50% de chance de aplicar 1 **Calafrio**. |
| 2 | **Blizzard** | Mágico | Todos os inimigos | 75 | 80% | 10 | MAG B | Nevasca: aplica 1 **Calafrio** em cada alvo atingido. |
| 3 | **Shatter** | Físico | Inimigo | 55 | 100% | 15 | FOR B · MAG C | +20% de dano por carga de **Calafrio** no alvo. Contra alvo **Congelado**: dano ×2,5 e o gelo se parte (remove o Congelado). |
| 4 | **Avalanche** | Físico | Inimigo | 60 | 100% | 15 | FOR B | **Prioridade -3.** Se você recebeu dano neste turno, causa dano ×2. |
| 5 | **Flash Freeze** | Mágico | Inimigo | — | 60% | 5 | — | Congela o alvo na hora (**Congelado**). |
| 6 | **Ice Armor** | Suporte | Você | — | — | 12 | VIT A | **Escudo** de 25% do HP máx. Enquanto durar, quem te atacar com skill Física recebe 1 **Calafrio**. |
| 7 | **Crystal Mirror** | Suporte | Você | — | — | 8 | — | **Prioridade +3.** O próximo ataque que você receber neste turno causa 50% menos dano; o valor bloqueado volta para o atacante + 1 **Calafrio**. Falha se usada em turnos seguidos. |
| 8 | **Frozen Heart** | Suporte | Você | — | — | 8 | — | +40% MAG, +40% DEF e imunidade a Calafrio/Congelado (4t), mas -50% AGI no mesmo período. |
| 9 | **Hibernation** | Cura | Você | — | — | 5 | VIT A | Cura 75% do HP máx e remove todos os debuffs, mas você entra em **Sono** profundo por 2t (dano não te acorda). |
| 10 | ★ **Absolute Zero** | Mágico | Inimigo | 150 | 75% | 2 | MAG S | Nunca erra se o alvo tiver **Calafrio** ou estiver **Congelado**. Congela o alvo (ignora imunidade). **Recarga:** você perde o próximo turno. |

---

## ⚡ Storm

*Velocidade, prioridade, vários golpes e um pouco de caos.*

> **Carga** (máx. 5): cada Carga dá +5% AGI. Algumas skills geram Carga e **Overload** consome tudo.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Spark** | Mágico | Inimigo | 35 | 100% | 30 | AGI C · MAG D | **Prioridade +1.** Gera 1 Carga. |
| 2 | **Lightning Bolt** | Mágico | Inimigo | 80 | 95% | 15 | MAG B | 25% de chance de **Paralisia**. |
| 3 | **Gale Blades** | Físico | Inimigo | 20 ×2–5 | 90% | 20 | AGI B | Lâminas de vento: acerta de 2 a 5 vezes. Com 3+ Cargas, sempre acerta 5 vezes. |
| 4 | **Chain Lightning** | Mágico | Até 3 inimigos | 65 | 95% | 12 | MAG B | O raio salta entre alvos: 100% → 70% → 50% do dano. Em 1v1, acerta o mesmo alvo 2 vezes (100% + 50%). |
| 5 | **Fickle Thunder** | Mágico | Inimigo | 10–150 | 100% | 15 | MAG B | Poder aleatório: 10, 40, 70, 100 ou 150. Se sair 150, também aplica **Paralisia**. |
| 6 | **Static Brand** | Suporte | Inimigo | — | 100% | 15 | — | Aplica **Condutor** (4t): skills Storm contra o alvo nunca erram e causam +25% de dano. |
| 7 | **Tailwind** | Suporte | Equipe | — | — | 10 | — | **Pressa** para você e seus aliados (4t). Gera 2 Cargas. |
| 8 | **Cleansing Rain** | Cura | Equipe | — | — | 8 | MAG C | Cura 20% do HP máx e remove **Queimadura** de toda a equipe. Chuva no campo (4t): skills Storm +20% de dano e skills Inferno -30% de dano. |
| 9 | **Overload** | Mágico | Inimigo | 120 | 85% | 5 | MAG S | Consome todas as Cargas: +12% de dano por Carga. A descarga te atinge: você fica com **Paralisia** (2t). |
| 10 | ★ **Stormcaller** | Mágico | Campo | 70/raio | — | 2 | MAG A | Invoca uma tempestade (4t): no fim de cada turno, um raio atinge um inimigo aleatório (Poder 70, 30% de **Paralisia**). Você ganha 1 Carga por turno enquanto ela durar. |

---

## 🌿 Nature

*Vence pelo desgaste: veneno, drenagem, raízes e muita cura.*

> **Sementes**: efeitos plantados que agem sozinhos no fim de cada turno. Quanto mais longa a luta, melhor para Nature.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Vine Lash** | Físico | Inimigo | 45 | 100% | 30 | FOR C · MAG C | +50% de dano se o alvo estiver **Enraizado**. |
| 2 | **Entangling Roots** | Mágico | Inimigo | 40 | 95% | 15 | MAG C | Raízes prendem o alvo: **Enraizado** (3t). |
| 3 | **Toxic Spores** | Mágico | Todos os inimigos | 20 | 85% | 15 | MAG C | Aplica **Veneno** em cada alvo atingido. |
| 4 | **Slumber Pollen** | Suporte | Inimigo | — | 75% | 10 | — | Pólen sonífero: **Sono** (1–3t). |
| 5 | **Parasitic Seed** | Suporte | Inimigo | — | 90% | 10 | MAG C | Planta uma semente (5t): no fim de cada turno, drena 8% do HP máx do alvo e cura você no mesmo valor. |
| 6 | **Bursting Seed** | Mágico | Inimigo | 120 | 100% | 8 | MAG A | Planta uma semente que explode no fim do 2º turno e causa o dano. A explosão cura você em 30% do dano causado. |
| 7 | **Sunbloom** | Cura | Aliado | — | — | 10 | FÉ B | Cura 30% do HP máx e aplica **Regeneração** (3t). |
| 8 | **Barkskin** | Suporte | Você | — | — | 15 | VIT A | Pele de casca: +40% DEF e imunidade a **Sangramento** (4t), mas -20% AGI. |
| 9 | **Bramble Burst** | Físico | Todos os inimigos | 100 | 90% | 8 | FOR A · VIT C | Espinhos rasgam para fora do seu corpo. **Custo:** 15% do HP máx. Depois você ganha Espinhos (3t): quem te atacar com skill Física recebe 20% do dano de volta. |
| 10 | ★ **Worldroot** | Suporte | Campo | — | — | 1 | FÉ A | Uma árvore ancestral brota no campo (5t). No fim de cada turno, sua equipe cura 10% do HP máx e os inimigos perdem 6% do HP máx e ficam **Enraizados**. |

---

## 🥋 Martial

*Técnica pura: combos, contra-ataques e golpes precisos.*

> **Combo** (máx. 5): cada skill Martial de dano que acerta gera 1 Combo, e cada Combo dá +8% de dano Martial. Zera se você errar, for **Atordoado** ou passar um turno sem usar skill Martial. Skills de Suporte/Cura Martial não geram Combo, mas mantêm o que você tem.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Jab** | Físico | Inimigo | 40 | 100% | 35 | FOR C · AGI C | **Prioridade +1.** Golpe rápido para abrir combos. |
| 2 | **Flurry of Blows** | Físico | Inimigo | 18 ×5 | 90% | 15 | AGI B | 5 golpes; cada um rola a precisão separado. Se todos acertarem, gera +1 Combo extra. |
| 3 | **Sundering Palm** | Físico | Inimigo | 70 | 95% | 15 | FOR B | Ignora 50% da DEF e aplica **Quebra de Armadura** (3t). |
| 4 | **Pressure Point** | Físico | Inimigo | 30 | — | 10 | AGI B | Nunca erra. 40% de chance de **Atordoar**. Com 3+ Combo, consome 3 e o Atordoamento é garantido. |
| 5 | **Rising Dragon** | Físico | Inimigo | 60 +20/Combo | 90% | 10 | FOR A | Finalizador: consome todo o Combo e ganha +20 de Poder por Combo (máx. 160). Com 5 Combo, crítico garantido. |
| 6 | **Full Force** | Físico | Inimigo | 120 | 100% | 5 | FOR S | Tudo em um golpe só. Você fica aberto: -30% DEF (3t). |
| 7 | **Counter Stance** | Suporte | Você | — | — | 10 | FOR A | **Prioridade +4.** Se receber um ataque Físico neste turno, reduz o dano em 50% e revida com Poder 90 (crítico garantido). Falha se usada em turnos seguidos. |
| 8 | **Meditate** | Suporte | Você | — | — | 15 | — | +30% FOR e +20% de chance de crítico (4t). Remove **Medo** e **Confusão**. |
| 9 | **Second Wind** | Cura | Você | — | — | 5 | VIT B | Só pode ser usada abaixo de 50% do HP. Cura 50% do HP perdido e dá +20% DEF (2t). |
| 10 | ★ **Transcendence** | Suporte | Você | — | — | 1 | — | Por 3t, todas as suas skills Martial acertam duas vezes (o 2º golpe causa 50%) e você fica imune a **Atordoado** e **Medo**. Quando acaba, você fica **Exausto** (2t). |

---

## 🩸 Blood

*Troca vida por poder. Rouba HP e empilha Sangramento.*

> **Custo de HP**: várias skills cobram HP além do PP. O custo nunca te derrota: sem HP suficiente, a skill não pode ser usada.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Blood Needle** | Mágico | Inimigo | 45 | 100% | 30 | MAG C | Agulha de sangue cristalizado: aplica 1 **Sangramento**. |
| 2 | **Vampiric Strike** | Físico | Inimigo | 70 | 100% | 15 | FOR B | Você cura 50% do dano causado. |
| 3 | **Bloodlust** | Físico | Inimigo | 40–140 | 100% | 10 | FOR A | Poder = 40 + 1 para cada 1% de HP que você perdeu (máx. 140). Quanto mais ferido, mais forte. |
| 4 | **Hemorrhage** | Mágico | Inimigo | 30 | 100% | 10 | MAG B | Detona todos os **Sangramentos** do alvo: causa de uma vez todo o dano que eles ainda causariam, +25%. Remove as cargas. |
| 5 | **Crimson Rain** | Mágico | Todos os inimigos | 65 | 90% | 12 | MAG B | **Custo:** 10% do HP máx. Aplica 2 **Sangramentos** em cada alvo atingido. |
| 6 | **Blood Puppetry** | Suporte | Inimigo | — | 80% | 5 | — | **Custo:** 10% do HP máx. Controla o sangue do alvo: **Confusão** (3t). Se o alvo tiver 3+ Sangramentos, fica **Atordoado** em vez disso. |
| 7 | **Anemia** | Suporte | Inimigo | — | 90% | 15 | — | Enfraquece o sangue do alvo: **Enfraquecido** e **Maldição** (3t). |
| 8 | **Blood Pact** | Suporte | Você | — | — | 5 | — | **Custo:** 30% do HP atual. +50% FOR e +50% MAG (5t). |
| 9 | **Coagulate** | Cura | Você | — | — | 10 | VIT B | Cura 15% do HP máx, remove seus **Sangramentos** e ganha **Escudo** de 10% do HP máx +10% por carga removida. |
| 10 | ★ **Blood Moon** | Suporte | Campo | — | — | 1 | — | **Custo:** 20% do HP máx. Lua de sangue (5t): todo dano de **Sangramento** é dobrado e você cura 100% do dano de Sangramento que os inimigos sofrerem. |

---

## 🐺 Beast

*Ferocidade, caça e instinto. Fica mais perigoso quanto mais selvagem estiver.*

> **Presa**: marque um alvo e cace-o. Beast também pune alvos feridos.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Savage Bite** | Físico | Inimigo | 50 | 100% | 30 | FOR B | 30% de chance de aplicar 1 **Sangramento**. |
| 2 | **Pounce** | Físico | Inimigo | 70 | 95% | 15 | AGI A | Bote de emboscada: +50% de dano se você agir antes do alvo neste turno. |
| 3 | **Rending Claws** | Físico | Inimigo | 22 ×3 | 95% | 20 | FOR B · AGI C | 3 garradas; cada uma tem 30% de chance de aplicar 1 **Sangramento**. |
| 4 | **Terrifying Roar** | Suporte | Todos os inimigos | — | 100% | 12 | — | Rugido aterrorizante: **Medo** (2t) em todos os inimigos. |
| 5 | **Mark the Prey** | Suporte | Inimigo | — | 100% | 15 | — | Marca o alvo como **Presa** (5t): suas skills Beast contra ele nunca erram e causam +25% de dano. |
| 6 | **Go for the Throat** | Físico | Inimigo | 60 | 90% | 10 | FOR A | Dano ×2,5 se o alvo tiver menos de 35% do HP. Se derrotar o alvo, você devora a presa e cura 25% do HP máx. |
| 7 | **Feral Rage** | Suporte | Você | — | — | 10 | — | Entra em **Fúria** e ganha +20% AGI (3t), mas fica **Provocado** (3t): o instinto só deixa você atacar. |
| 8 | **Lick Wounds** | Cura | Você | — | — | 10 | VIT B | Cura 30% do HP máx. Abaixo de 30% do HP, cura 60% em vez disso. |
| 9 | **Stampede** | Físico | Todos os inimigos | 100 | 90% | 8 | FOR A | Investida descontrolada: você fica preso usando Stampede por 2–3 turnos seguidos. Quando acaba, fica com **Confusão** (2t). |
| 10 | ★ **Primal Form** | Suporte | Você | — | — | 1 | — | Vira uma fera primordial (5t): +40% FOR, +40% AGI e +20% DEF; seus ataques Físicos aplicam 1 **Sangramento** e curam 10% do dano causado. Não pode usar skills de Suporte nem de Cura enquanto transformado. |

---

## 🔮 Arcane

*Manipula as regras da batalha: PP, buffs, feitiços e até o tempo.*

> **Anti-magia**: Arcane não acumula cargas. Ele queima PP, desfaz buffs, cancela feitiços e distorce o tempo.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Arcane Missiles** | Mágico | Inimigo | 18 ×3 | — | 25 | MAG B | 3 mísseis teleguiados. Nunca erra. |
| 2 | **Mana Burn** | Mágico | Inimigo | 50 | 95% | 15 | MAG B | Queima 4 PP da última skill que o alvo usou. |
| 3 | **Unravel** | Mágico | Inimigo | 40 | 100% | 15 | MAG C | Desfaz todos os buffs do alvo; +25 de Poder por buff removido. |
| 4 | **Null Seal** | Suporte | Inimigo | — | 85% | 10 | — | Sela a magia do alvo: **Silêncio** (3t). |
| 5 | **Counterspell** | Suporte | Inimigo | — | — | 8 | — | **Prioridade +4.** Se o alvo usar skill Mágica, de Suporte ou de Cura neste turno, ela é anulada e ele fica com **Silêncio** (2t). Se ele usar skill Física, nada acontece. |
| 6 | **Chaos Bolt** | Mágico | Inimigo | 80 | 90% | 10 | MAG A | Efeito extra aleatório (1 em 6): **Queimadura** · 2 **Calafrio** · **Paralisia** · **Confusão** · você cura 20% do HP máx · sai pela culatra e você sofre 25% do dano causado. |
| 7 | **Mana Shield** | Suporte | Você | — | — | 10 | MAG A | **Escudo** de 25% do HP máx. Quando o Escudo quebrar, todas as suas skills recuperam 2 PP. |
| 8 | **Rewind** | Cura | Você | — | — | 3 | — | Volta seu HP, buffs e debuffs para exatamente como estavam 2 turnos atrás. |
| 9 | **Mana Detonation** | Mágico | Inimigo | 140 | 90% | 5 | MAG S | Detona sua própria reserva de mana: todas as suas **outras** skills perdem 2 PP. |
| 10 | ★ **Time Stop** | Suporte | Todos os inimigos | — | — | 1 | — | **Prioridade +5.** O tempo para: os inimigos não agem neste turno nem no próximo (ignora imunidades). O dano que eles sofrerem nesse período fica acumulado e cai de uma vez, +20%, quando o tempo volta. Depois, você fica **Exausto** (3t). |

---

## 👻 Spirit

*Almas, medo e o plano etéreo. Ignora defesas e brinca com a vida.*

> **Etéreo**: ataques etéreos ignoram a DEF e os Escudos do alvo. Spirit também fica mais forte contra alvos com **Medo**.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Soul Bolt** | Mágico | Inimigo | 40 | 100% | 30 | FÉ C | Disparo de energia espiritual. +50% de dano se o alvo estiver com **Medo**. |
| 2 | **Soul Rend** | Mágico | Inimigo | 75 | 90% | 15 | FÉ B · MAG C | **Etéreo:** rasga a alma do alvo, ignorando DEF e Escudos. |
| 3 | **Haunt** | Suporte | Inimigo | — | 90% | 15 | FÉ C | Assombra o alvo (4t): no fim de cada turno, 30% de chance de **Medo**; se ele já estiver com Medo, perde 6% do HP máx. |
| 4 | **Banshee Wail** | Mágico | Todos os inimigos | 90 | 85% | 8 | FÉ A | Grito do além: 30% de chance de **Medo** em cada alvo. O grito rasga sua própria alma: você perde 15% do HP máx. |
| 5 | **Possession** | Suporte | Inimigo | — | 70% | 5 | — | Você possui o alvo: a próxima ação dele vira uma skill de ataque aleatória usada contra ele mesmo. Seu corpo fica vazio: você fica **Vulnerável** (2t). |
| 6 | **Soul Link** | Suporte | Inimigo | — | 100% | 10 | — | Liga sua alma à do alvo (4t): 40% de todo dano que você sofrer também é causado a ele. |
| 7 | **Phase Shift** | Suporte | Você | — | — | 10 | — | **Prioridade +3.** Fica intangível (2t): imune a dano Físico, mas recebe +30% de dano Mágico. |
| 8 | **Ancestral Guardian** | Suporte | Você | 35/turno | — | 5 | FÉ B | Invoca um espírito ancestral (4t): no fim de cada turno ele ataca o inimigo (Poder 35, **Etéreo**), e você recebe -15% de dano enquanto ele estiver em campo. |
| 9 | **Communion** | Cura | Aliado | — | — | 10 | FÉ A | Cura 35% do HP máx e remove **Medo**, **Confusão**, **Sono** e **Maldição**. |
| 10 | ★ **Soul Swap** | Mágico | Inimigo | Var. | 80% | 1 | — | Troca a sua % de HP com a do alvo (ex.: você 15% e ele 90% → você 90% e ele 15%). Depois, você fica com **Maldição** (4t). *Sugestão: não funciona em chefes.* |

---

## ✨ Divine

*Luz sagrada: o melhor elemento de cura e proteção, e pune quem causa dano.*

> **Luz**: Divine revela o que está escondido (Furtividade), protege contra controle e devolve o dano que a equipe sofre.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Smite** | Mágico | Inimigo | 50 | 100% | 30 | FÉ B | Revela alvos **Furtivos** (remove a Furtividade). +50% de dano contra alvos com **Maldição**. |
| 2 | **Radiance** | Mágico | Todos os inimigos | 70 | 95% | 12 | FÉ B | Explosão de luz: 30% de chance de **Cegueira** em cada alvo. |
| 3 | **Divine Retribution** | Mágico | Inimigo | 40+ | — | 10 | FÉ A | Nunca erra. Causa dano extra igual a 50% de todo o dano que você sofreu nos últimos 2 turnos (o extra ignora DEF). |
| 4 | **Penance** | Suporte | Inimigo | — | 90% | 10 | — | Por 3t, sempre que o alvo causar dano, ele sofre 30% desse dano de volta. |
| 5 | **Divine Grace** | Cura | Aliado | — | — | 15 | FÉ A | Cura 35% do HP máx e remove o debuff mais recente. |
| 6 | **Sacred Aegis** | Suporte | Aliado | — | — | 12 | FÉ A | **Escudo** de 30% do HP máx. Enquanto durar, o alvo não pode ficar **Atordoado**, **Congelado** nem com **Sono**. |
| 7 | **Bless** | Suporte | Aliado | — | — | 10 | — | Aplica **Bênção** (4t). |
| 8 | **Consecrated Ground** | Suporte | Campo | — | — | 5 | FÉ B | Consagra o campo (5t): sua equipe cura 6% do HP máx por turno e fica imune a **Medo** e **Maldição**. |
| 9 | **Wrath of Heaven** | Mágico | Todos os inimigos | 140 | 90% | 5 | FÉ S | Canaliza por 1 turno (nesse turno você fica **Vulnerável**) e, no turno seguinte, a luz desce sobre todos os inimigos. Se você ficar Atordoado ou com Silêncio enquanto canaliza, a skill é cancelada. |
| 10 | ★ **Miracle** | Cura | Equipe | — | — | 1 | FÉ S | Revive aliados derrotados com 50% do HP, cura 60% do HP máx de toda a equipe e remove todos os debuffs. Depois, você fica **Exausto** (3t). |

---

## 🌑 Shadow

*Furtividade, críticos, enganação e maldições.*

> **Furtivo + Oportunismo**: Shadow some nas trevas e ataca quem já está enfraquecido. Várias skills ficam mais fortes contra alvos com debuffs ou quando você está Furtivo.

| # | Skill | Tipo | Alvo | Poder | Prec. | PP | Scaling | Efeito |
|---|---|---|---|---|---|---|---|---|
| 1 | **Shadow Bolt** | Mágico | Inimigo | 45 | 100% | 30 | MAG C · AGI D | +10% de dano por debuff no alvo (máx. +50%). |
| 2 | **Backstab** | Físico | Inimigo | 60 | 100% | 15 | AGI A | Se você estiver **Furtivo**: crítico garantido e ignora 50% da DEF. |
| 3 | **Vanish** | Suporte | Você | — | — | 10 | — | **Prioridade +2.** Some nas sombras: fica **Furtivo** (2t) e remove as marcas **Presa** e **Condutor** de você. |
| 4 | **Engulfing Darkness** | Mágico | Todos os inimigos | 40 | 95% | 12 | MAG C | A escuridão engole o campo: **Cegueira** (3t) em cada alvo atingido. |
| 5 | **Shadow Clone** | Suporte | Você | — | — | 8 | — | Cria um clone: o próximo ataque contra você acerta o clone e é anulado. Quem acertar o clone fica com **Cegueira** (2t). |
| 6 | **Umbral Theft** | Mágico | Inimigo | 40 | 100% | 12 | AGI B | Rouba 1 buff aleatório do alvo e aplica em você, com a duração restante. |
| 7 | **Dark Hex** | Suporte | Inimigo | — | 90% | 10 | — | **Maldição** e -15% em todos os atributos do alvo (4t). |
| 8 | **Umbral Pact** | Suporte | Você | — | — | 8 | — | +30% de dano e +30% de chance de crítico (4t), mas você perde 8% do HP máx por turno e recebe -50% de cura no mesmo período. |
| 9 | **Night's Embrace** | Cura | Você | — | — | 10 | MAG B | Cura 30% do HP máx. Se você estiver **Furtivo**, cura 60% em vez disso. |
| 10 | ★ **Death Mark** | Mágico | Inimigo | 60+ | 90% | 1 | MAG A · AGI A | **Custo:** 20% do seu HP atual. Marca o alvo (3t). Quando a marca expira, ele sofre Poder 60 + 50% de todo o dano que recebeu enquanto estava marcado (ignora DEF). |

---

## Interações entre elementos

- **Frost × Inferno:** dano de Inferno descongela o alvo (e desperdiça o Congelado do aliado); ficar Congelado apaga o Calor do Inferno.
- **Storm × Inferno:** Cleansing Rain remove Queimadura e enfraquece Inferno em 30% enquanto chove.
- **Beast × Blood:** Beast empilha Sangramento com as garras; Blood detona (Hemorrhage) e dobra (Blood Moon).
- **Shadow × Divine:** Smite revela Furtivos e bate mais em alvos com Maldição; Consecrated Ground bloqueia a Maldição do Dark Hex.
- **Beast × Spirit:** Terrifying Roar aplica Medo em todos, e Soul Bolt ganha +50% contra quem está com Medo.
- **Arcane/Shadow × buffers:** Unravel e Umbral Theft punem quem depende de buffs (Blood Pact, Feral Rage, Meditate, Frozen Heart).
- **Shadow × Storm/Beast:** Vanish remove Condutor (Static Brand) e Presa (Mark the Prey).
- **Shadow × qualquer controle:** Shadow Bolt fica mais forte a cada debuff no alvo; combina com Nature, Frost e Spirit.

## Notas de balanceamento

- **Estrutura de cada elemento:** 1 skill básica (PP alto) · 3–5 skills de dano com efeitos diferentes · 1+ cura · 1–2 buffs · 1–2 debuffs ou controle · 1 skill forte com contrapartida · 1 ★ Ultimate.
- **Controle forte** (Flash Freeze, Slumber Pollen, Possession, Blood Puppetry, Time Stop, Soul Swap) tem PP baixo e/ou precisão menor. Se precisar, dê imunidade a chefes.
- **Contrapartidas** existem em todos os elementos: recuo, recarga, custo de HP, custo de PP, perda de atributos, Paralisia/Confusão/Sono em você e Vulnerável.
