# Roadmap

## v0.2 — Conversação (maior lacuna atual)
O app treina reconhecimento, produção controlada e pronúncia, mas **não treina interação espontânea**, que é onde a
hipótese da interação (Long) diz que boa parte da aquisição acontece.
- Tutor por voz com **ElevenLabs Conversational AI**: um agente por unidade, com prompt restrito ao vocabulário já
  visto (input compreensível), recast de erros (feedback corretivo implícito) e roleplay do can-do da unidade
  (ex.: "peça um café"). Integração via `agents_get_signed_url` num backend mínimo (a chave não vai ao navegador).
- Itens que o aluno erra na conversa entram no FSRS.

## v0.3 — Rigor pedagógico
- Gating por domínio: lição só conta como concluída com ≥70% de acerto (hoje conclui sempre).
- Teste de nivelamento e "pular unidade com teste".
- Unidades 5–12 (ver PLANO-DE-AULAS.md) e gerar áudio de todas.
- Otimização dos parâmetros FSRS com o histórico do próprio usuário.

## v0.4 — Plataforma
- PWA offline (service worker com o áudio em cache).
- Conta + sincronização (o estado já é um JSON versionado: `fluente:v1`).
- Segundo idioma (espanhol) reutilizando o domínio sem mudanças.
- Telemetria de aprendizagem opt-in para A/B de exercícios.
