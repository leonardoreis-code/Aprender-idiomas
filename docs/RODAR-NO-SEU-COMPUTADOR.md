# Rodar o Fluente no seu computador

Tudo roda na sua máquina: o app, o progresso (fica no navegador), as chaves (ficam num arquivo `.env` só seu).
O que continua sendo serviço de fora, por natureza: a **call por voz em tempo real** (ElevenLabs) e, se você
colocar as chaves, as **vozes** (ElevenLabs) e a **IA** (API da Anthropic).

## 1. Instale uma vez
- **Node.js 20 ou mais novo** (versão LTS): https://nodejs.org. Para conferir, abra o terminal e rode `node -v`.
- **Git** (só para o caminho A): https://git-scm.com.
- **Google Chrome** ou Edge: o reconhecimento de fala ao vivo funciona neles; no Firefox não.

Terminal no Windows: aperte a tecla Windows, digite **PowerShell** e abra. No Mac: **Terminal**.

## 2. Baixe o projeto

**Caminho A: com Git (recomendado, dá para atualizar depois)**
```bash
git clone -b claude/laughing-rubin-tyej6g https://github.com/leonardoreis-code/Aprender-idiomas.git fluente
cd fluente
```
O `-b claude/laughing-rubin-tyej6g` é importante: todo o trabalho está nesse branch, ainda não na `main`.
Se o repositório for privado, o Git vai pedir login do GitHub (use o navegador ou um token pessoal).

**Caminho B: com o arquivo .zip**
Descompacte o `fluente.zip` numa pasta e, no terminal, entre nela: `cd caminho/da/pasta/fluente`.

## 3. Instale as dependências e rode
```bash
npm install
npm run local
```
Abra **http://localhost:8787** no Chrome. Para parar: `Ctrl+C` no terminal.
Das próximas vezes basta `npm start` (o `npm run local` também recompila; use depois de atualizar o código).

## 4. (Opcional) Ligue a IA e as vozes
1. Copie o arquivo `.env.example` para `.env` na mesma pasta.
   - Windows: `copy .env.example .env`. Mac: `cp .env.example .env`.
2. Abra o `.env` num editor (Bloco de Notas serve) e cole as chaves:
   - `ANTHROPIC_API_KEY=` (crie em https://console.anthropic.com/settings/keys): liga a avaliação das suas frases, os colegas
     que improvisam na reunião, a correção além das regras e o "Como se diz?". Usa o Claude Opus 5.5; cobra por uso.
   - `ELEVENLABS_API_KEY=` (em https://elevenlabs.io/app/settings/api-keys): vozes naturais e transcrição. Gasta créditos.
3. Rode `npm start` de novo. O terminal mostra o que ficou ativo:
   ```
   Vozes ElevenLabs: ativas
   Claude (IA):      ativo (claude-opus-5-5)
   ```
Nunca cole essas chaves em chat, e-mail ou no código. O `.env` não vai para o Git, e o servidor só aceita pedidos deste
computador e da própria página. Há um limite diário de uso (`LLM_DAILY_CALLS`, `TTS_DAILY_CHARS`) para não gastar à toa.

## 5. A call por voz em tempo real
É só abrir o link no Chrome, com fone de ouvido: https://elevenlabs.io/app/talk-to?agent_id=agent_1301m7evr541fkatt83x0kzwn22y
(também está no app, em Falar → Reunião ao vivo). Ela não depende do app estar rodando.

## 6. Levar o seu progresso da nuvem para cá
O progresso fica no navegador, então o que você fez no artefato do claude.ai não aparece sozinho aqui.
1. No artefato: **Perfil → Ajustes → Backup do progresso → Baixar arquivo de backup** (ou **Copiar backup**, se o
   download não funcionar ali; aí cole o texto num arquivo ou e-mail para você mesmo).
2. No app local: **Perfil → Ajustes → Restaurar de um backup**, escolha o arquivo (ou cole o texto) e confirme.

## 7. Atualizar (caminho A)
```bash
git pull
npm install
npm run local
```

## Problemas comuns
| Sintoma | O que fazer |
|---|---|
| `node` não é reconhecido | Instale o Node.js e **feche e abra** o terminal. |
| `EADDRINUSE` / porta em uso | Já tem um Fluente rodando; feche o outro terminal, ou rode com outra porta: `PORT=8788 npm start` (Mac) ou `$env:PORT=8788; npm start` (PowerShell). |
| O microfone não abre | Use Chrome/Edge em `http://localhost:8787` (não pelo IP) e libere o microfone no cadeado da barra de endereço. |
| "Claude (IA): desligado" | Confira o nome `ANTHROPIC_API_KEY=` no `.env`, sem espaço antes, e rode `npm start` de novo. |
| "chave da Anthropic inválida" | A chave foi copiada pela metade ou foi revogada; gere outra no console. |

## Para quem desenvolve
```bash
npm run dev:api   # servidor na 8787
npm run dev       # app com recarregamento automático (proxy /api → 8787)
npm test          # 416 testes
npm run gauntlet  # tipos + testes + build
```
