# Backlog de features — Fluente

Status: ✅ implementado e testado · 🟡 parcial (funciona com limitação descrita) · 🗺️ planejado
Prioridade (planejados): **P1** próximo ciclo · **P2** depois · **P3** exploração

Princípio de priorização: tudo que aumenta **produção oral PT→EN com feedback** vem antes de tudo que só aumenta
consumo de conteúdo ou "engajamento". Feature que não leva o aluno a falar mais precisa justificar sua existência.

## 1. Pense em inglês — produção PT→EN (o núcleo)
| # | Feature | Status |
|---|---|---|
| 1 | Escada de produção em 5 degraus por frase (montar → blocos → escrever → falar → relâmpago) | ✅ |
| 2 | Blocos de sentido coloridos na ordem do inglês (ensina a reordenar o pensamento) | ✅ |
| 3 | Montar com blocos + distratores de outras frases | ✅ |
| 4 | Tradução bloco a bloco com feedback por bloco | ✅ |
| 5 | Escrita livre com dica progressiva (primeiras letras → palavra) | ✅ |
| 6 | Fala da frase inteira com gravação + reconhecimento | ✅ |
| 7 | Modo relâmpago com tempo-limite proporcional ao tamanho da frase (automaticidade) | ✅ |
| 8 | Sobe/desce de degrau pelo desempenho; resposta digitada no degrau de fala não promove | ✅ |
| 9 | Repetição espaçada FSRS por frase (quando volta) independente do degrau (como volta) | ✅ |
| 10 | Fila personalizada: vencidas → fraquezas → novas, intercalando aulas | ✅ |
| 11 | Frase errada volta no fim da sessão, um degrau abaixo | ✅ |
| 12 | Correção tolerante (contrações, caixa, pontuação, 1 typo/transposição) | ✅ |
| 13 | Múltiplas respostas aceitas por frase | ✅ |
| 14 | Detector de erros PT-BR (sujeito, do/does, -s, passado, perfect, ordem, artigo, preposição, "tem") | ✅ |
| 15 | Explicação em PT do erro no feedback | ✅ |
| 16 | Caderno pessoal de frases (salvar do feedback, ouvir, remover) | ✅ |
| 17 | Resumo da sessão com onde mais tropeçou | ✅ |
| 18 | Ouvir a forma nativa e a lenta no feedback | ✅ |
| 19 | Comparar minha voz × voz nativa | ✅ |
| 20 | Gerar novas frases com o vocabulário/contexto do aluno via LLM (infinitas, personalizadas) | 🗺️ P1 |
| 21 | Aceitar paráfrases corretas via LLM (hoje só lista fechada de alternativas) | 🗺️ P1 |
| 22 | "Diga de outro jeito": pedir 2 formas diferentes da mesma ideia | 🗺️ P2 |
| 23 | Tradução reversa: ouvir EN, dizer em PT e de volta em EN | 🗺️ P2 |
| 24 | Expansão de frase: começar curta e adicionar tempo/lugar/motivo | 🗺️ P2 |
| 25 | Treino de substituição estilo drill (troca o sujeito/tempo e repete) | 🗺️ P1 |
| 26 | Shadowing guiado com atraso configurável | 🗺️ P2 |
| 27 | Modo mãos-livres (só áudio, para dirigir/caminhar) | 🗺️ P2 |
| 28 | "Frase do dia" do seu trabalho: você digita em PT, recebe em EN e treina | 🗺️ P1 |

## 2. Professora IA em tempo real (Maya)
| # | Feature | Status |
|---|---|---|
| 29 | Agente de voz em tempo real (ElevenLabs Conversational AI), voz ↔ voz | ✅ |
| 30 | Avatar SVG com boca sincronizada ao volume da voz, piscadas e estados (ouvindo/falando/pensando) | ✅ |
| 31 | Correção por recast + pedir para repetir, máx. 2 correções por turno | ✅ (testado) |
| 32 | 4 modos: conversa, treino PT→EN, roleplay de daily, entrevista técnica | ✅ |
| 33 | Contexto personalizado enviado à Maya: nível, objetivos, erros recorrentes, sotaque | ✅ |
| 34 | Aula da trilha abre a Maya já com o padrão da aula e a pergunta-gatilho | ✅ |
| 35 | Transcrição ao vivo com correções destacadas | ✅ |
| 36 | Digitar mensagem durante a conversa; mutar microfone | ✅ |
| 37 | Medidor do seu volume ao vivo | ✅ |
| 38 | Tempo de conversa vira XP e missão | ✅ |
| 39 | URL assinada pelo backend quando há chave (agente privado) | ✅ |
| 40 | Lista de correções ao final da aula | 🟡 (heurística por palavras-chave na fala da Maya) |
| 41 | Correções da conversa entram automaticamente no FSRS / caderno | 🗺️ P1 |
| 42 | Relatório pós-aula (tempo de fala seu × dela, erros, palavras novas) via webhook do agente | 🗺️ P1 |
| 43 | Ferramentas do agente (client tools): marcar erro, abrir exercício no app durante a conversa | 🗺️ P1 |
| 44 | Memória entre aulas (o que conversaram na última vez) | 🗺️ P2 |
| 45 | Vários professores (sotaques americano, britânico, indiano) para variabilidade de escuta | 🗺️ P2 |
| 46 | Avatar em vídeo realista (ElevenLabs avatar / lipsync de vídeo) | 🗺️ P3 |
| 47 | Professora explica em PT sob demanda ("explica em português") | ✅ (no prompt) |
| 48 | Modo "chamada surpresa" agendada | 🗺️ P3 |

## 3. Pronúncia e sotaque
| # | Feature | Status |
|---|---|---|
| 49 | Laboratório de sotaque com 12 frases-desafio por padrão de interferência PT-BR | ✅ |
| 50 | Alinhamento palavra a palavra alvo × ouvido (DP) com nota de inteligibilidade | ✅ |
| 51 | Classificação de trocas: TH, "i" final, ɪ/iː, æ/ɛ, -ed, consoante final, H/R, V/W, tônica | ✅ |
| 52 | Transcrição por ElevenLabs Scribe (com chave) ou reconhecimento do navegador | ✅ / 🟡 sem chave |
| 53 | Mapa de sotaque pessoal (gráfico de padrões mais frequentes) | ✅ |
| 54 | Diagrama articulatório (boca em corte) por som | ✅ |
| 55 | Pares mínimos com várias vozes (HVPT) na trilha base | ✅ |
| 56 | Análise de pronúncia também dentro da escada (degraus 3 e 4) | ✅ |
| 57 | Avaliação fonema a fonema (Azure Pronunciation Assessment ou modelo próprio) | 🗺️ P1 |
| 58 | Detecção de sílaba tônica e entonação (pitch) | 🗺️ P2 |
| 59 | Visualização de forma de onda/pitch minha × nativa | 🗺️ P2 |
| 60 | Treino de ritmo (formas fracas: gonna, wanna, can /kən/) | 🗺️ P2 |
| 61 | Dicionário de armadilhas de tech (schema, cache, deploy…) com teste de microfone | 🟡 (no protótipo) |

## 4. Curso, aulas e conteúdo
| # | Feature | Status |
|---|---|---|
| 62 | Trilha "Do zero" (8 aulas A1) | ✅ |
| 63 | Trilha "Destravar a fala" (12 aulas A2→B1) focada em diferenças PT×EN | ✅ |
| 64 | Trilha "Inglês para tech" (6 aulas: daily, bloqueios, pipelines, métricas, pitch, STAR) | ✅ |
| 65 | Trilha base A1 com mapa de metrô (12 lições, 10 tipos de exercício) | ✅ |
| 66 | Aula em 4 passos: vídeo → material escrito → prática → conversa | ✅ |
| 67 | Material escrito com blocos "você pensa / sai assim / em inglês" | ✅ |
| 68 | Exemplos com áudio em todo o material | ✅ |
| 69 | Tabelas de referência nas aulas | ✅ |
| 70 | Padrão da aula em destaque (post-it) | ✅ |
| 71 | 312 frases PT→EN com blocos alinhados, validadas por teste automático | ✅ |
| 72 | Recomendação de trilha pelo perfil e objetivos | ✅ |
| 73 | Próxima aula sugerida no início | ✅ |
| 74 | Trilhas B1→B2 (condicionais, voz passiva, discurso indireto, phrasal verbs) | 🗺️ P1 |
| 75 | Trilha viagem e trilha entrevista completa (20 perguntas com histórias STAR do aluno) | 🗺️ P1 |
| 76 | Glossário pessoal por área (dados, produto, finanças) | 🗺️ P2 |
| 77 | Teste de fim de unidade com certificado de nível (CEFR can-do) | 🗺️ P2 |
| 78 | Editor de conteúdo (CMS) para criar aulas sem código | 🗺️ P3 |
| 79 | Espanhol reutilizando todo o domínio | 🗺️ P3 |

## 5. Vídeo-aulas
| # | Feature | Status |
|---|---|---|
| 80 | 8 vídeo-aulas: slides animados + professora-avatar narrando | ✅ |
| 81 | Narração ElevenLabs multilíngue (PT com exemplos EN) via backend, fallback voz do sistema | ✅ |
| 82 | Legenda sempre visível; pausar, voltar, avançar | ✅ |
| 83 | Slides de fórmula colorida (sujeito/verbo/complemento/tempo) | ✅ |
| 84 | Quiz interativo dentro do vídeo | ✅ |
| 85 | Vídeo leva direto para a prática da aula | ✅ |
| 86 | Exportar vídeo-aula como MP4 para assistir offline | 🗺️ P3 |
| 87 | Pergunta para a professora no meio do vídeo (pausa e conversa) | 🗺️ P2 |

## 6. Histórias interativas
| # | Feature | Status |
|---|---|---|
| 88 | 10 histórias (zero, fala, tech) em que o aluno é personagem | ✅ |
| 89 | Falas dos personagens com vozes diferentes | ✅ |
| 90 | Turnos de escolha, de fala (PT→EN) e de compreensão | ✅ |
| 91 | Erros nas falas entram no mapa de erros | ✅ |
| 92 | Histórias ramificadas (sua resposta muda o rumo) | 🗺️ P2 |
| 93 | Personagens da história respondendo com IA ao que você disser livremente | 🗺️ P1 |

## 7. Gamificação e motivação
| # | Feature | Status |
|---|---|---|
| 94 | XP, combo com som crescente, níveis | ✅ |
| 95 | Meta diária configurável com anel de progresso | ✅ |
| 96 | Sequência (streak) com proteção automática e comprável | ✅ |
| 97 | 3 missões diárias que mudam todo dia, focadas em falar/produzir | ✅ |
| 98 | Gemas com resgate automático ao completar missão | ✅ |
| 99 | Loja (proteção de sequência, visual da professora) | ✅ |
| 100 | Conquistas | ✅ |
| 101 | Notificações (toasts) de missão, meta e conquista | ✅ |
| 102 | Confete e celebração respeitando movimento reduzido | ✅ |
| 103 | Ligas semanais entre alunos | 🗺️ P2 (exige backend com contas) |
| 104 | Desafio com amigo (mesmas frases, quem fala melhor) | 🗺️ P2 |
| 105 | Baú surpresa (recompensa variável) após sessões de fala | 🗺️ P3 |
| 106 | "Minutos falando" como métrica principal da semana | 🗺️ P1 |

## 8. Personalização e inteligência
| # | Feature | Status |
|---|---|---|
| 107 | Onboarding com perfil (nível autodeclarado, objetivos, tempo diário) | ✅ |
| 108 | Nivelamento por PRODUÇÃO (5 frases PT→EN) | ✅ |
| 109 | Mapa de erros pessoal (gráfico + explicação) | ✅ |
| 110 | Mapa de erros alimenta a Maya | ✅ |
| 111 | Botão "treinar meus erros com a Maya" | ✅ |
| 112 | Sessões geradas a partir dos erros mais frequentes | 🗺️ P1 |
| 113 | Dificuldade adaptativa do relâmpago pelo histórico do aluno | 🗺️ P2 |
| 114 | Otimização dos parâmetros FSRS por usuário | 🗺️ P2 |
| 115 | Plano semanal automático com base no tempo disponível | 🗺️ P2 |

## 9. Acessibilidade e UX
| # | Feature | Status |
|---|---|---|
| 116 | Navegação por teclado completa e atalhos | ✅ |
| 117 | Leitor de tela: aria-live em feedback, foco gerenciado | ✅ |
| 118 | Fonte Atkinson Hyperlegible, escala de fonte, alto contraste, tema escuro | ✅ |
| 119 | Fala sempre opcional (digitar como alternativa, sem punição) | ✅ |
| 120 | Navegação inferior no celular, lateral no desktop | ✅ |
| 121 | Legendas/transcrição em todo áudio | ✅ |
| 122 | PWA instalável e offline | 🗺️ P1 |

## 10. Plataforma
| # | Feature | Status |
|---|---|---|
| 123 | Backend sem dependências: TTS com cache em disco, STT, token do agente, rate limit | ✅ |
| 124 | Chave da ElevenLabs só no servidor | ✅ |
| 125 | Script de pré-geração de áudio com estimativa de créditos | ✅ |
| 126 | Testes de domínio + validação automática de todo o conteúdo | ✅ (46 testes) |
| 127 | E2E no Chromium cobrindo o fluxo completo | ✅ |
| 128 | Contas, login e sincronização entre dispositivos | 🗺️ P1 |
| 129 | Painel de custos de IA por aluno | 🗺️ P2 |
| 130 | Telemetria de aprendizagem opt-in para A/B de exercícios | 🗺️ P3 |

**Totais:** 130 features · ✅ 85 · 🟡 3 · 🗺️ 42
