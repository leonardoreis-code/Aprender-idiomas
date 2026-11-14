# SPEC v2 — Fluente: plataforma para destravar a fala

Fonte da verdade da v2 (a v1 continua em `SPEC.md` para a trilha base A1).
Backlog completo com status em `docs/BACKLOG.md`.

## 1. Problema
O aluno-alvo **entende** inglês (lê, ouve, traduz EN→PT) mas **trava ao produzir** PT→EN e falar.
Causa provável: o caminho de recuperação PT→EN nunca foi treinado. Ler e ouvir treinam reconhecimento;
falar exige produção, um processo de memória diferente. Por isso a v2 é organizada em torno de **produção
com feedback**, não de consumo de conteúdo.

## 2. Loop central (harness)
```
 Perfil + nivelamento por produção
            │
            ▼
   Aula (vídeo → material escrito) ──► Pense em inglês (escada 0→4, FSRS) ──► Maya (conversa com o padrão)
            ▲                                   │  erros classificados               │ contexto: nível, erros, sotaque
            │                                   ▼                                    │
            └──────────── Mapa de erros + mapa de sotaque ◄───────────────────────────┘
```
Cada volta do loop gera dados (erros, degraus, sotaque) que personalizam a próxima volta.

## 3. Bounded contexts (DDD)
| Contexto | Responsabilidade | Módulo |
|---|---|---|
| Curriculum v2 | Aulas, drills com blocos alinhados, histórias, vídeo-aulas | `domain/curriculum/speaking.ts`, `content/en/*` |
| Production | Escada de produção, fila personalizada, detector de erros PT-BR | `domain/production/*` |
| Pronunciation | Alinhamento alvo × ouvido, regras de interferência PT-BR | `domain/pronunciation/accent.ts` |
| Memory | FSRS (itens e frases) | `domain/srs/*` |
| Motivation | XP, streak, missões, gemas, loja, conquistas | `domain/motivation/*` |
| Teacher (infra) | Agente de voz ElevenLabs + contexto do aluno | `infra/teacher.ts`, `ui/store.tsx#teacherContext` |
| Speech (infra) | Gravação, Web Speech, ElevenLabs Scribe | `infra/recorder.ts`, `infra/api.ts` |
| Backend | Segredos, TTS com cache, STT, token do agente | `server/index.mjs` |

## 4. Requisitos-chave e critérios de aceite
- **P-01 Escada.** Acerto sem ajuda sobe 1 degrau; com ajuda/hesitação mantém; erro desce 1. Teste: `production.test.ts`.
- **P-02 Blocos.** `chunks.map(c => c.en).join(' ') == en` para 100% dos drills. Teste: `content.test.ts`.
- **P-03 Erros.** Detecta sujeito faltando, do/does, -s, passado, perfect, ordem, "tem". Teste por categoria.
- **P-04 Sotaque.** Classifica TH, vogal epentética, ɪ/iː, æ/ɛ, -ed. Teste com alinhamentos reais.
- **P-05 Professora.** Conecta, fala a abertura, transcreve e corrige com recast. Verificado em E2E manual
  (frase "Yesterday I go… is raining… since two years" → corrigida para went / it was raining / have been working for).
- **P-06 Segredos.** A chave da ElevenLabs nunca chega ao navegador; sem chave, tudo funciona com voz do sistema.
- **P-07 Acessibilidade.** Falar é sempre opcional; teclado completo; WCAG 2.2 AA.

## 5. Gauntlet
`npm run typecheck` → `npm test` (46) → `npm run build` → `scripts/e2e/smoke.mjs` (onboarding → aula → prática →
vídeo → história → sotaque → perfil, sem erros de console).

## 6. Decisões e trade-offs
- **Avatar SVG em vez de vídeo realista**: latência zero e custo zero; vídeo realista fica como P3.
- **Detector de erros heurístico em vez de LLM**: instantâneo, offline e testável; LLM entra para paráfrases (P1).
- **Sotaque por inteligibilidade** (o que a máquina entendeu), não por fonema: honesto com o que Scribe/Web Speech
  oferecem. Avaliação fonema a fonema exige outro serviço (P1).
- **Estado local** (localStorage) até existir conta/sincronização (P1).
