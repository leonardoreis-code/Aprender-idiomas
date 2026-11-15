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
npm test          # 416 testes (domínio + validação de todo o conteúdo)
```

## Como o aprendizado é comprovado
- **Checkpoint de fala** (8 min, a cada 4 semanas): 12 frases PT→EN que não existem no curso + 2 falas livres.
  Gera o **Índice de fala** (precisão, segundos por palavra, palavras por minuto) e compara com a linha de base.
- **Evolução**: gráficos dos checkpoints e evidência semanal automática (minutos falando, retenção real, velocidade).
- **Plano de 6 meses**: 26 semanas em 4 fases, com metas semanais de minutos falando. Ver [`docs/PLANO-6-MESES.md`](docs/PLANO-6-MESES.md)
  e [`docs/MELHORIAS.md`](docs/MELHORIAS.md).
- **O índice não premia chute rápido**: velocidade só conta nas frases certas e a fala livre vale pela janela inteira de 45 s.

## O que faz o aluno aprender de fato
- **Seus erros voltam.** Todo erro marcado na sua fala entra num banco pessoal e reaparece com repetição espaçada.
- **Tente antes.** Três frases antes da explicação de cada aula, com o antes e depois medido.
- **O detector aprende com você.** "Não era erro" duas vezes silencia a regra.
- **Conteúdo para 6 meses.** 38 aulas, 456 frases, 20 simulações, 14 histórias de reconto e 8 treinos curtos.

## Simulações do dia a dia
Vinte conversas completas (daily com bloqueio, avisar atraso, discordar em reunião, call com cliente, entrevista, restaurante,
hotel…). O personagem reage ao que você diz, os objetivos acendem enquanto você fala e a correção aparece embaixo da sua
fala sem interromper. Dá para colocar seu cargo, projeto e colegas reais nas falas.

## Reunião por voz em tempo real (o principal)
**https://elevenlabs.io/app/talk-to?agent_id=agent_1301m7evr541fkatt83x0kzwn22y**. Call por voz de verdade, sem apertar
botão: você diz no que está trabalhando nesta semana e a Priya, o Tom e o Josh (vozes diferentes) fazem a daily, a
planning, a call com cliente ou a entrevista sobre o seu trabalho real. Quando você erra, o colega repete a sua ideia do
jeito certo e segue; "coach" pede ajuda; no fim a Maya cobra seus 3 erros em voz alta. Detalhes em
[`specs/SPEC-meet.md`](specs/SPEC-meet.md).

## Reunião ao vivo e copiloto de reunião real
- **Reunião ao vivo** (`#reunioes`): call com 2 ou 3 colegas (vozes e avatares diferentes) que conversam entre si,
  te chamam pelo nome, perguntam, cobram quando você fica no mudo e reagem ao que você disse. Quando você erra,
  o colega devolve a ideia já certa ("So you went to the client?"), no máximo 1 vez a cada 2 falas; o detalhe vai
  para um chat que só você vê. 6 reuniões: daily, planning, incidente, cliente, entrevista, retro.
- **Copiloto** (`#copiloto`): para a reunião de verdade. Aberto ao lado da call, com fone, ouve só você, nunca
  fala e mostra a correção em silêncio. Os erros vão para o banco pessoal.
- O app **não entra** no Google Meet: não há API aberta para um bot falar na sala, e corrigir em voz alta na frente
  do time expõe a pessoa. Ver [`specs/SPEC-meet.md`](specs/SPEC-meet.md).

## Treinador ao vivo e novas metodologias
- **Treinador ao vivo**: o texto aparece enquanto você fala e o erro é sublinhado na hora por 78 regras que rodam no
  navegador (sem servidor, sem ElevenLabs). Você conserta a própria frase com ajuda em 4 degraus.
- **Fluência 60·45·30**, **Reconto** e **Eco com atraso**. Base científica e limites em [`docs/METODOLOGIAS.md`](docs/METODOLOGIAS.md).

## O que tem
- **Pense em inglês**: cada frase sobe uma escada de 5 degraus (montar com blocos → bloco a bloco → escrever →
  falar → relâmpago). Quem já entende começa no degrau Escrever (ou Falar, no avançado), e todo acerto escrito
  termina com a frase dita em voz alta. Os blocos coloridos mostram a frase na ordem do inglês, para parar de traduzir palavra por palavra.
  Repetição espaçada (FSRS) decide quando cada frase volta.
- **Maya, professora ao vivo**: agente de voz da ElevenLabs com avatar animado (só na versão com servidor e `ELEVENLABS_API_KEY`; ainda não testada com voz real). Corrige sua gramática na hora, pede
  para repetir, faz roleplay de daily e entrevista técnica. Recebe do app seus erros recorrentes e seu nível.
- **Laboratório de sotaque**: grava sua voz, compara com o que a máquina entendeu e aponta padrões do português
  (TH, "i" no final, ship/sheep, -ed…). Com a chave, usa ElevenLabs Scribe.
- **Curso**: 4 trilhas (Do zero · Destravar a fala · Inglês para tech · Rumo ao B2) com 38 aulas, 456 frases, material escrito,
  8 vídeo-aulas narradas pela professora e 10 histórias interativas, mais a trilha base A1 com mapa de metrô.
- **Gamificação**: XP, combo, meta diária, sequência com proteção, missões diárias, gemas, loja e conquistas.
- **Personalização**: nivelamento por produção, mapa de erros e mapa de sotaque que alimentam a professora.
- **Acessível**: teclado, leitor de tela, alto contraste, tema escuro, fala sempre opcional.

Lista completa com status: [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Chave da ElevenLabs
Nunca cole a chave no código nem no chat. Defina `ELEVENLABS_API_KEY` no ambiente do servidor.
O professor usa o agente `agent_2001m7cr5kzdf2srmtvn4p87nxzr` (troque com `ELEVENLABS_AGENT_ID`).

## Documentação
| Arquivo | Conteúdo |
|---|---|
| [`specs/SPEC-v2.md`](specs/SPEC-v2.md) | Spec da plataforma: loop central, contextos DDD, critérios de aceite, decisões |
| [`specs/SPEC.md`](specs/SPEC.md) | Spec da trilha base A1 (v1) |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Features por área com status e prioridade |
| [`docs/PESQUISA.md`](docs/PESQUISA.md) | Fundamentação científica com referências verificadas |
| [`docs/PLANO-DE-AULAS.md`](docs/PLANO-DE-AULAS.md) | Plano da trilha base A1→A2 |
| [`prototipos/tech-english.html`](prototipos/tech-english.html) | Protótipo da trilha de daily e entrevista |
