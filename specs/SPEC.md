# SPEC — Fluente (app de idiomas, v0.1 — Inglês A1→A2)

Spec-Driven Development: este arquivo é a fonte da verdade. Toda funcionalidade
tem um ID (`F-xx`), critérios de aceite verificáveis e o princípio científico que
a justifica (ver `docs/PESQUISA.md`). Testes em `src/**/*.test.ts` referenciam os IDs.

## 1. Domínios (DDD)

| Bounded context | Responsabilidade | Módulo |
|---|---|---|
| **Curriculum** | Unidades, lições, itens (palavra/chunk/som), CEFR | `src/content`, `src/domain/curriculum` |
| **Practice** | Gerar a sequência de exercícios de uma lição; corrigir respostas | `src/domain/practice` |
| **Memory (SRS)** | Agendar revisões por item com FSRS | `src/domain/srs` |
| **Pronunciation** | Pontuar fala reconhecida; pares mínimos; dicas PT-BR | `src/domain/pronunciation` |
| **Motivation** | XP, combo, streak com proteção, meta diária, níveis, conquistas | `src/domain/motivation` |
| **Audio** (infra) | ElevenLabs pré-gerado → fallback Web Speech | `src/infra/audio.ts`, `scripts/generate-audio.mjs` |
| **Persistence** (infra) | Estado local versionado | `src/infra/storage.ts` |

Linguagem ubíqua: *Item* (unidade de memória), *Card* (estado FSRS de um item),
*Lesson* (sequência guiada), *Exercise* (uma tarefa), *Attempt* (uma resposta),
*Session* (lição ou revisão em andamento), *Streak*, *Freeze*.

## 2. Funcionalidades

### F-01 Trilha de aprendizado (mapa)
- Unidades exibidas como linhas de metrô; lições são estações (SVG).
- Lição N+1 só desbloqueia após concluir N (mastery gating), mas o usuário pode "pular com teste".
- Aceite: estado `locked | available | done` derivado apenas do progresso salvo.

### F-02 Lição gerada a partir de dados (Practice)
- Uma lição é declarada como dados (itens + frases + foco sonoro). O *LessonBuilder* gera ~12 exercícios
  na ordem: apresentação (dupla codificação) → reconhecimento → pares → montagem → ditado → fala → pares mínimos.
- Dificuldade cresce dentro da lição (reconhecer → produzir) — *desirable difficulties*.
- Itens errados reaparecem no fim da mesma lição (até 2x).
- Aceite: builder é determinístico dado uma seed; nunca gera exercício sem resposta válida.

### F-03 Tipos de exercício
`intro` · `listen-choose` · `pt-to-en-choose` · `match-pairs` · `word-bank` · `dictation` · `speak` · `minimal-pair` · `fill-gap`.
- Correção tolerante: caixa, pontuação, contrações (`I'm` = `I am`), espaços.
- Erro de digitação de 1 caractere em palavra ≥5 letras = "quase" (aceita com aviso).

### F-04 Revisão espaçada (FSRS)
- Cada item visto vira Card (`ts-fsrs`, retenção-alvo 0,90).
- Nota derivada do desempenho: errou → Again; acertou com dica/"quase" → Hard; acertou → Good; acertou rápido produção → Easy.
- Tela "Revisar" mostra quantos vencidos; sessão de revisão intercala tipos e itens (interleaving).

### F-05 Pronúncia
- `speak`: Web Speech API (`SpeechRecognition`, en-US) → pontuação por similaridade de palavras (0–100).
- Feedback: palavras acertadas em verde, faltantes destacadas, dica PT-BR específica do som (ex.: TH).
- `minimal-pair` (HVPT): ouvir uma de duas palavras com vozes variadas e escolher qual foi dita.
- Sem microfone/permissão: botão "Não posso falar agora" pula sem penalidade.

### F-06 Áudio
- Prioridade: `public/audio/manifest.json` (mp3 ElevenLabs, várias vozes) → `speechSynthesis` fallback.
- Velocidade normal e lenta (0.75x). Transcrição sempre visível após responder.

### F-07 Motivação (dopamina com responsabilidade)
- XP por acerto (10) + bônus de combo (+2 por acerto seguido, teto +10). Combo zera ao errar.
- Meta diária configurável (20/50/100 XP), anel de progresso.
- Streak: dias com meta cumprida. **Freeze** automático (1 a cada 7 dias de streak, máx. 2) — reduz ansiedade.
- Níveis: curva `xpParaNivel(n) = 50·n^1.5`.
- Conquistas: primeira lição, 7 dias, 100 itens, pronúncia perfeita, revisão zerada.
- Celebrações respeitam `prefers-reduced-motion` e o toggle de som.

### F-08 Acessibilidade (WCAG 2.2 AA)
- Navegação completa por teclado: `1–4` escolhem opção, `Enter` verifica/continua, `Espaço` toca áudio.
- `aria-live` anuncia resultado; foco gerenciado ao trocar de exercício.
- Contraste ≥ 4.5:1; alvos ≥ 44px; fonte Atkinson Hyperlegible; escala de fonte; modo alto contraste.
- Sem limite de tempo; nenhum exercício depende só de áudio (há transcrição) ou só de fala (pode pular).

### F-09 Persistência
- `localStorage` com chave versionada `fluente:v1` e migração; falha de storage não quebra o app.

## 3. Gauntlet (portões de qualidade)
1. `npm run typecheck` sem erros
2. `npm test` verde (domínio coberto: FSRS adapter, corretor, builder, motivação, pontuação de fala)
3. `npm run build` gera `dist/`
4. Smoke E2E Playwright: abrir app → iniciar lição 1 → responder → ver tela de conclusão

## 4. Fora do escopo v0.1
Contas/servidor, sincronização entre dispositivos, outros idiomas (estrutura já suporta), tutor conversacional por voz
(próximo passo: agente ElevenLabs Conversational AI — ver `docs/ROADMAP.md`).
