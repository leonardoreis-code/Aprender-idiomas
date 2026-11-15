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

## 3. Reunião por voz em tempo real (ElevenLabs Conversational AI)
Agente `agent_1301m7evr541fkatt83x0kzwn22y` ("Fluente — Reunião ao vivo"), link público:
https://elevenlabs.io/app/talk-to?agent_id=agent_1301m7evr541fkatt83x0kzwn22y
- Conversa full-duplex (fala e escuta ao mesmo tempo, dá para interromper), resposta em ~0,3–1,2 s.
- 4 vozes na mesma call: Maya (coach, voz padrão), Priya, Tom e Josh (tags de voz múltipla).
- Setup: a Maya pergunta cargo, no que o aluno está trabalhando nesta semana e qual reunião; a reunião
  inteira é montada sobre esse contexto real.
- Correção: reformulação pelo colega na fala seguinte (regra checada a cada turno), nunca aula no meio da reunião.
- "coach" / "como se diz": a Maya dá a frase, pede para repetir e devolve para a reunião.
- Debrief: 3 erros reais da call, o aluno repete certo em voz alta, 1 frase para levar.
- Análise pós-call (claude-sonnet-5-5, em português): erros, travadas, contexto real, nº de falas, nota 0–10,
  frase para levar; critérios: recast natural, contexto usado, debrief feito.
- Verificação: teste de simulação "Daily real com erros típicos de brasileiro" (aluno simulado que erra
  passado, -s e sujeito). v1 falhou (nenhuma reformulação); v2, com a regra no topo do prompt e checagem
  por turno, passou nos 5 critérios. O teste é por texto: a troca de vozes só se confirma numa call real.
