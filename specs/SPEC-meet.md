# SPEC — Reunião ao vivo e Copiloto de reunião

## Problema
O aluno trava em reunião real: várias pessoas, perguntas diretas, pouco tempo para montar a frase,
e ninguém corrige (ou corrige na frente de todos). A simulação 1-a-1 não treina isso.

## Decisão: o que NÃO fazemos
- **Não entramos numa sala real do Google Meet.** O Meet não tem API aberta para um bot entrar com áudio
  (a Meet Media API é prévia restrita e não envia áudio), exigiria servidor permanente com navegador,
  uma conta Google e gravaria colegas sem consentimento (LGPD). E corrigir alguém em voz alta numa reunião
  de verdade expõe a pessoa: o efeito é o contrário do que queremos.

## O que fazemos
1. **Reunião ao vivo (`#reuniao`)**: sala no formato de videochamada, com 2–3 colegas (vozes diferentes)
   que conversam entre si, fazem perguntas diretas ao aluno, reagem ao que ele disse, interrompem quando
   fica vago e cobram quando ele "esquece o microfone fechado". Correção como uma pessoa faz:
   - **Reformulação (recast)**: o colega repete a ideia já corrigida ("So you *went* to the client yesterday?").
   - **Coach no chat privado**: o erro aparece no painel "só você vê", sem parar a reunião.
   - **Legenda ao vivo** com o erro sublinhado enquanto fala.
   - Depois da reunião: resumo, objetivos, erros para o banco pessoal (repetição espaçada).
2. **Copiloto de reunião real (`#copiloto`)**: aberto ao lado da chamada real, com fone de ouvido. Ouve só a
   fala do aluno, NUNCA fala, mostra a correção em silêncio e manda os erros para o banco. Nada é gravado.

## Critérios de aceite
- A1 Em toda reunião há ≥ 2 colegas, cada um com voz e avatar distintos, e conversa entre eles antes de perguntar.
- A2 Erro de alto impacto (passado, -s, do/does, sujeito, there is, perfect, ordem, be/have) gera no máximo
  uma reformulação a cada 2 falas do aluno, dita pelo colega que perguntou, na 2ª pessoa ("you went").
- A3 Todo erro detectado aparece no chat privado com a correção e entra no banco de erros.
- A4 Pedir para repetir ("sorry, could you repeat?") faz o colega repetir, sem contar turno.
- A5 10 s sem abrir o microfone depois de uma pergunta → um colega cobra ("I think you're on mute").
- A6 Sem IA, o roteiro funciona sozinho; com IA (artefato), os colegas improvisam dentro do roteiro.
- A7 Funciona digitando (sem microfone), mas digitado não conta como minutos falando.
- A8 Interromper (abrir o microfone enquanto alguém fala) para a voz do colega na hora.
- A9 Copiloto: nunca toca som; ouve continuamente; reinicia sozinho quando o reconhecedor para; se não puder, mostra o botão.
