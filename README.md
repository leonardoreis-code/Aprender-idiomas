# Fluente — aprender inglês (e depois outros idiomas)

App web para aprender idiomas em sessões curtas, fundamentado em evidência científica: repetição espaçada (FSRS),
prática de recuperação, treino fonético de alta variabilidade, feedback corretivo imediato e gamificação gentil.
Começa com **inglês A1 para falantes de português**.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes de domínio (Vitest)
npm run build      # gera dist/ (site estático, deploy em qualquer CDN)
```

## O que tem
- **Trilha em mapa de metrô** — 4 unidades / 12 lições implementadas, 12 unidades planejadas.
- **10 tipos de exercício**: apresentação com ilustração, escuta, tradução, pares, montar frase, lacuna, ditado,
  fala com reconhecimento de voz, pares mínimos com vozes variadas, laboratório de pronúncia com diagrama da boca.
- **Revisão espaçada FSRS** (`ts-fsrs`) com nota inferida do desempenho — você não precisa se autoavaliar.
- **Pronúncia**: pontuação de inteligibilidade (0–100) palavra a palavra e dicas específicas para brasileiros.
- **Motivação**: XP, combo com som que sobe de tom, meta diária, sequência com proteção automática, níveis, conquistas.
- **Acessibilidade**: teclado completo (`1–4`, `Enter`, `Espaço`, `Esc`), leitores de tela, fonte Atkinson
  Hyperlegible, escala de fonte, alto contraste, tema escuro, `prefers-reduced-motion`, fala sempre opcional.

## Áudio com ElevenLabs
O navegador **nunca** recebe a chave da API. O áudio é pré-gerado em build:

```bash
npm run audio -- --dry-run --lessons                    # estimativa de créditos
ELEVENLABS_API_KEY=sk_... npm run audio -- --lessons    # gera public/audio/** + manifest.json
```

Sem os mp3, o app usa a voz do sistema (Web Speech API) como fallback. A áudio-aula da Lição 1 já está gerada
(`public/audio/lessons/u1-l1-intro.mp3`).

## Documentação
| Arquivo | Conteúdo |
|---|---|
| [`specs/SPEC.md`](specs/SPEC.md) | Spec (SDD): funcionalidades F-01…F-09, critérios de aceite, bounded contexts (DDD), gauntlet |
| [`docs/PESQUISA.md`](docs/PESQUISA.md) | Fundamentação científica com referências verificadas e matriz princípio → funcionalidade |
| [`docs/PLANO-DE-AULAS.md`](docs/PLANO-DE-AULAS.md) | Currículo A1→A2, anatomia da lição, rotina diária |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Próximos passos (tutor de conversação por voz, sync, novos idiomas) |

## Arquitetura
```
src/
  domain/            # puro, testado — sem React
    curriculum/      # tipos do curso
    practice/        # builder de lições/revisões + correção tolerante
    srs/             # adaptador FSRS
    pronunciation/   # pontuação de fala + dicas PT-BR
    motivation/      # XP, streak/freeze, níveis, conquistas
  application/       # casos de uso (completeSession)
  content/en/        # curso de inglês (dados)
  infra/             # áudio, reconhecimento de voz, sfx, storage
  ui/                # telas, exercícios, SVGs
scripts/
  generate-audio.mjs # ElevenLabs → public/audio
  e2e/smoke.mjs      # gauntlet: fluxo completo no Chromium
```

Adicionar um idioma = criar `src/content/<lang>/course.ts` com a mesma estrutura.
