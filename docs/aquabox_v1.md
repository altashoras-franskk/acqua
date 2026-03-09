# Aqua Box 10x — V1 (CAS + geração procedural)

## Objetivo do V1
Criar uma base jogável em pixel art para um **Aqua Box aprimorado**, com foco em:
- ciclo completo de planta: **gerar → plantar → nutrir → crescer → podar → reproduzir → vender/replantar**;
- ecossistema vivo com simulação em grade (cellular field) + agentes;
- variedade procedural de espécies com DNA de parâmetros.

## Loop principal de gameplay (V1)
1. Comprar sementes/mudas na loja.
2. Plantar no substrato (com física leve de enraizamento).
3. Ajustar luz/CO2/nutrientes/fluxo de água.
4. Observar crescimento e resposta visual (cor, densidade, bolhas, saúde).
5. Podar e replantar estacas para multiplicar.
6. Vender excedente e desbloquear genética/espécies raras.

## Arquitetura proposta (CAS)
Usaremos o fluxo sugerido:

**[Campo] → [Agentes] ↔ [Interações] → [Reconfiguração estrutural] ↺**

### 1) Campo (Field)
Uma grade 2D (`tile` de pixels lógicos) com camadas:
- `substrato`: fertilidade, compactação, matéria orgânica;
- `água`: nutrientes dissolvidos (N, P, K, Fe), CO2, O2, temperatura;
- `luz`: intensidade por coluna + sombra por biomassa;
- `fluxo`: vetor simples para corrente.

Atualização por tick:
- difusão de nutrientes/CO2 na água;
- atenuação de luz pela coluna e por folhas;
- recuperação/degradação local por ação das plantas.

### 2) Agentes
Entidades com estado local:
- plantas (cada indivíduo com DNA + malha de nós/segmentos),
- peixes/invertebrados (V1 opcional simples),
- “micro-agentes” implícitos (consumo/decomposição simplificada).

Cada planta contém:
- `genótipo` (parâmetros base);
- `fenótipo` (cor atual, velocidade de crescimento, arquitetura);
- `estrutura` (grafo de nós: raiz, caule, folhas);
- `energia` (reserva para crescimento/reprodução).

### 3) Interações
Regras locais por tick:
- planta absorve recursos do campo conforme alcance de raiz/folha;
- competição por luz entre vizinhos;
- poda altera topologia e força brotação lateral;
- estacas cortadas podem enraizar se caírem em zona válida;
- estresse ambiental gera mudança de cor/taxa de crescimento.

### 4) Reconfiguração estrutural
Sistema de crescimento morfológico procedural:
- adição de nós com probabilidade dependente de energia + DNA;
- ramificação por “bud rules” (gemas ativas/dormentes);
- morte/regressão de segmentos sem energia;
- reprodução vegetativa por fragmento.

A recursividade emerge porque a nova estrutura altera sombra, fluxo e consumo, mudando o próprio campo no tick seguinte.

## DNA procedural de plantas (V1)
Cada espécie/variação nasce de um vetor de genes:

- `internode_len`: comprimento médio entre nós
- `branch_prob`: chance de ramificação
- `leaf_size`: tamanho de folha
- `root_spread`: espalhamento de raiz
- `growth_rate_base`: taxa base
- `light_pref`: preferência de luz
- `co2_efficiency`: eficiência de CO2
- `nutrient_affinity_[N,P,K,Fe]`
- `trim_response`: vigor pós-poda
- `color_hue_base` + `stress_palette_shift`

Geração:
- Loja oferece “linhagens” (seeded RNG).
- Cruzamento simples (opcional V1.1): média + mutação limitada.
- Raridade controlada por distribuição (comum, incomum, rara, mutante).

## Modelo de simulação (simples e escalável)
Tick discreto (ex.: 10 Hz sim; render 60 FPS):

1. Atualiza campo (difusão/luz/fluxo).
2. Atualiza plantas:
   - captação de recurso;
   - balanço de energia;
   - crescimento/retração;
   - eventos (broto, folha nova, enraizamento).
3. Resolve interações (colisão leve, sombra, competição).
4. Emite eventos de feedback visual e economia.

## Mecânicas de cuidado (V1)
- **Luz**: slider de potência e fotoperíodo.
- **CO2**: injeção com custo recorrente.
- **Fertilizante**: NPK + micro (efeito gradual).
- **TPA (troca de água)**: reduz excesso, corrige desequilíbrios.
- **Poda inteligente**:
  - corte em nó = promove brotação;
  - corte em massa (line/pull) = risco de estresse.

## Economia (V1)
- Moeda por venda de mudas/estacas saudáveis.
- Preço depende de:
  - raridade genética,
  - saúde (0–100),
  - estética (densidade + cor + simetria aproximada).
- Loja com rotação diária (seed do dia).

## Pixel art e feedback visual
Diretrizes para aparência “viva”:
- paleta dinâmica por saúde/estresse (verde vibrante → amarelado/avermelhado);
- animação leve de sway por fluxo de água;
- partículas: microbolhas em fotossíntese alta;
- espessura de touceira aumenta visualmente com biomassa.

## Escopo técnico de entrega — V1
### Entregáveis
1. Simulação de campo 2D com luz + nutrientes + CO2.
2. 8–12 tipos de planta procedurais (baseados em DNA).
3. Ferramentas: plantar, podar (nó/linha), replantar, vender.
4. Loja com catálogo procedural por seed.
5. HUD com métricas: saúde, crescimento, recursos da água.

### Fora do V1 (backlog)
- reprodução sexual completa com herança avançada,
- fauna complexa com IA rica,
- doenças/pragas sofisticadas,
- multiplayer e mercado online.

## Estrutura de dados (sugestão)
```txt
World
 ├─ GridCell[x,y]
 │   ├─ substrate
 │   ├─ waterChemistry
 │   ├─ light
 │   └─ flow
 ├─ PlantEntity[]
 │   ├─ genotype
 │   ├─ phenotype
 │   ├─ structureGraph(Node, Edge)
 │   └─ energy
 └─ EconomyState
```

## KPI de sucesso do V1
- Jogador consegue montar layout funcional em < 10 min.
- Diferença visual clara entre planta saudável vs estressada.
- Poda e replantio alteram crescimento de forma perceptível.
- Pelo menos 3 estratégias viáveis de cultivo (low-tech, high-light, densidade).

## Próximo passo recomendado
Quando você enviar “como funciona o Aqua Box hoje”, montamos o **V1.1 técnico** com:
- mapeamento de sistemas atuais → novos módulos;
- plano de migração incremental;
- backlog priorizado por impacto/complexidade;
- especificação de balanceamento inicial (valores padrão por espécie).
