# Fluente — destravar a fala em inglês

Plataforma para quem **entende inglês mas trava para falar** (e também para quem começa do zero).
O centro de tudo é transformar português em inglês na hora, em voz alta, com uma professora de IA que corrige em tempo real.

```bash
npm install
npm run build
ELEVENLABS_API_KEY=sk_... npm start      # http://localhost:8787  (sem a chave também funciona, com voz do sistema)

# desenvolvimento
npm run dev:api   # backend na 8787
npm run dev       # front com hot reload (proxy /api → 8787)
npm test          # 179 testes (domínio + validação de todo o conteúdo)
```

## Como o aprendizado é comprovado
- **Checkpoint de fala** (8 min, a cada 4 semanas): 12 frases PT→EN que não existem no curso + 2 falas livres.
  Gera o **Índice de fala** (precisão, segundos por palavra, palavras por minuto) e compara com a linha de base.
- **Evolução**: gráficos dos checkpoints e evidência semanal automática (minutos falando, retenção real, velocidade).
- **Plano de 6 meses**: 26 semanas em 4 fases, com metas semanais de minutos falando. Ver [`docs/PLANO-6-MESES.md`](docs/PLANO-6-MESES.md)
  e as 66 melhorias em [`docs/MELHORIAS.md`](docs/MELHORIAS.md).

## Simulações do dia a dia
Dez conversas completas (daily com bloqueio, avisar atraso, discordar em reunião, call com cliente, entrevista, restaurante,
hotel…). O personagem reage ao que você diz, os objetivos acendem enquanto você fala e a correção aparece embaixo da sua
fala sem interromper. Dá para colocar seu cargo, projeto e colegas reais nas falas.

## Treinador ao vivo e novas metodologias
- **Treinador ao vivo**: o texto aparece enquanto você fala e o erro é sublinhado na hora por 55 regras que rodam no
  navegador (sem servidor, sem ElevenLabs). Você conserta a própria frase com ajuda em 4 degraus.
- **Fluência 60·45·30**, **Reconto** e **Eco com atraso**. Base científica e limites em [`docs/METODOLOGIAS.md`](docs/METODOLOGIAS.md).

## O que tem
- **Pense em inglês**: cada frase sobe uma escada de 5 degraus (montar com blocos → bloco a bloco → escrever →
  falar → relâmpago). Os blocos coloridos mostram a frase na ordem do inglês, para parar de traduzir palavra por palavra.
  Repetição espaçada (FSRS) decide quando cada frase volta.
- **Maya, professora ao vivo**: agente de voz da ElevenLabs com avatar animado. Corrige sua gramática na hora, pede
  para repetir, faz roleplay de daily e entrevista técnica. Recebe do app seus erros recorrentes e seu nível.
- **Laboratório de sotaque**: grava sua voz, compara com o que a máquina entendeu e aponta padrões do português
  (TH, "i" no final, ship/sheep, -ed…). Com a chave, usa ElevenLabs Scribe.
- **Curso**: 3 trilhas (Do zero · Destravar a fala · Inglês para tech) com 26 aulas, 312 frases, material escrito,
  8 vídeo-aulas narradas pela professora e 10 histórias interativas, mais a trilha base A1 com mapa de metrô.
- **Gamificação**: XP, combo, meta diária, sequência com proteção, missões diárias, gemas, loja e conquistas.
- **Personalização**: nivelamento por produção, mapa de erros e mapa de sotaque que alimentam a professora.
- **Acessível**: teclado, leitor de tela, alto contraste, tema escuro, fala sempre opcional.

Lista completa com status: [`docs/BACKLOG.md`](docs/BACKLOG.md) (130 features, 85 implementadas).

## Chave da ElevenLabs
Nunca cole a chave no código nem no chat. Defina `ELEVENLABS_API_KEY` no ambiente do servidor.
O professor usa o agente `agent_2001m7cr5kzdf2srmtvn4p87nxzr` (troque com `ELEVENLABS_AGENT_ID`).

## Documentação
| Arquivo | Conteúdo |
|---|---|
| [`specs/SPEC-v2.md`](specs/SPEC-v2.md) | Spec da plataforma: loop central, contextos DDD, critérios de aceite, decisões |
| [`specs/SPEC.md`](specs/SPEC.md) | Spec da trilha base A1 (v1) |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | 130 features por área com status e prioridade |
| [`docs/PESQUISA.md`](docs/PESQUISA.md) | Fundamentação científica com referências verificadas |
| [`docs/PLANO-DE-AULAS.md`](docs/PLANO-DE-AULAS.md) | Plano da trilha base A1→A2 |
| [`prototipos/tech-english.html`](prototipos/tech-english.html) | Protótipo da trilha de daily e entrevista |
