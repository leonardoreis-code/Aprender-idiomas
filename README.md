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
npm test          # 46 testes (domínio + validação de todo o conteúdo)
```

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
