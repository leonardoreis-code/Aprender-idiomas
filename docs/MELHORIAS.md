# 66 melhorias — foco: provar aprendizado e falar em 6 meses

Status: ✅ implementado nesta rodada (com teste ou verificação no navegador) · 🗺️ planejado (P1 = próximo, P2 = depois).
Critério de corte: entra primeiro o que **mede** a fala ou **aumenta minutos falando com correção**.

## A. Prova de aprendizado (checkpoint de fala)
| # | Melhoria | Status |
|---|---|---|
| 1 | Checkpoint de fala: 12 frases PT→EN inéditas + 2 falas livres de 45 s | ✅ |
| 2 | Três formas paralelas (A/B/C) em rodízio, mesmas 12 estruturas na mesma ordem | ✅ |
| 3 | Teste automático que impede qualquer frase do checkpoint de existir no curso | ✅ |
| 4 | Índice de fala 0–100 com faixas fixas (45% precisão, 25% velocidade, 30% fluência) | ✅ |
| 5 | Tempo de formulação (até começar a falar) e segundos por palavra | ✅ |
| 6 | Palavras por minuto e variedade de vocabulário na fala livre | ✅ |
| 7 | Linha de base e diferença contra ela em todo resultado | ✅ |
| 8 | Acerto por estrutura gramatical, com "ganhou/perdeu" contra o checkpoint anterior | ✅ |
| 9 | Condições de prova: sem dica, sem áudio do alvo, gabarito só no fim | ✅ |
| 10 | Modalidade registrada (voz/digitado) e aviso quando a comparação é aproximada | ✅ |
| 11 | Avaliador (Claude) aceita paráfrases corretas e dá rubrica da fala livre — versão artefato | ✅ |
| 12 | Relatório de evolução copiável em texto | ✅ |
| 13 | Áudio da linha de base guardado para comparar com o mês 6 | 🗺️ P1 |
| 14 | Parte de escuta→fala: responder a perguntas faladas sob tempo | 🗺️ P1 |
| 15 | Formas D–F para não repetir forma em 12 semanas | 🗺️ P1 |
| 16 | Calibração estatística das formas com dados de vários alunos | 🗺️ P2 |
| 17 | Avaliador de paráfrases também no modo servidor | 🗺️ P1 |
| 18 | Avaliação fonema a fonema no checkpoint | 🗺️ P2 |
| 19 | Exportar relatório em PDF | 🗺️ P2 |
| 20 | Projeção do índice para a semana 26 no ritmo atual | 🗺️ P2 |

## B. Evidência contínua
| # | Melhoria | Status |
|---|---|---|
| 21 | Página Evolução com gráficos dos checkpoints (índice, precisão, s/palavra, palavras/min) | ✅ |
| 22 | Minutos falando por semana (frases + Maya) contra a meta da fase | ✅ |
| 23 | Retenção real: frases vencidas certas na primeira tentativa | ✅ |
| 24 | Segundos por palavra nas frases faladas, por semana | ✅ |
| 25 | Frases automáticas acumuladas | ✅ |
| 26 | Tabela equivalente a cada gráfico e tooltip no hover/foco | ✅ |
| 27 | Duração de fala medida sem contar o tempo de transcrição | ✅ |
| 28 | Detecção de pausas longas e muletas ("ãh", "tipo") com tempos por palavra | 🗺️ P1 |
| 29 | Taxa de autocorreção (quantas vezes você se corrige sozinho) | 🗺️ P2 |
| 30 | Proporção do seu tempo de fala nas conversas com a Maya | 🗺️ P1 |

## C. Plano de 6 meses
| # | Melhoria | Status |
|---|---|---|
| 31 | Plano de 26 semanas em 4 fases, com metas semanais de minutos falando | ✅ |
| 32 | Agenda de checkpoints (semanas 0, 4, …, 26) com aviso quando libera | ✅ |
| 33 | Linha do tempo do plano com posição atual | ✅ |
| 34 | Roteiro de hoje em 4 passos na tela inicial | ✅ |
| 35 | Medidor "falando hoje" contra a meta diária da fase | ✅ |
| 36 | Replanejamento automático quando você atrasa | 🗺️ P1 |
| 37 | Revisão de domingo: resumo da semana e ajuste da próxima | 🗺️ P1 |
| 38 | Lembrete diário em horário fixo (exige PWA) | 🗺️ P1 |
| 39 | Relatório semanal para um parceiro de responsabilidade | 🗺️ P2 |

## D. Mais fala com correção
| # | Melhoria | Status |
|---|---|---|
| 40 | Fala livre diária de 1 minuto, com palavras por minuto | ✅ |
| 41 | Correção da fala livre e versão melhorada para reler em voz alta — artefato | ✅ |
| 42 | Minhas frases: você escreve em português, vira treino na escada — artefato | ✅ |
| 43 | Treino dos meus erros: fila montada pelas estruturas em que você mais erra | ✅ |
| 44 | Aula só fecha com 70% de acerto na primeira tentativa | ✅ |
| 45 | Correções da Maya entram na escada automaticamente | 🗺️ P1 |
| 46 | Relatório pós-aula da Maya | 🗺️ P1 |
| 47 | Maya escolhe o tema pela fase do plano | 🗺️ P1 |
| 48 | Simulado de entrevista de 30 min com nota por resposta | 🗺️ P1 |
| 49 | Ensaio da daily real: cole o que você fez e treine a fala | 🗺️ P1 |
| 50 | Banco pessoal de 20 respostas STAR | 🗺️ P1 |
| 51 | Maya interrompe e pede esclarecimento, como numa reunião | 🗺️ P2 |
| 52 | Drill de substituição (troca sujeito e tempo, repete) | 🗺️ P2 |
| 53 | Shadowing guiado | 🗺️ P2 |
| 54 | Modo mãos-livres, só áudio | 🗺️ P2 |
| 55 | Minhas frases e correção de fala livre no modo servidor | 🗺️ P1 |

## E. Correção mais justa
| # | Melhoria | Status |
|---|---|---|
| 56 | "work" × "works" e "like" × "liked" nunca passam como erro de digitação | ✅ |
| 57 | "3 years" = "three years"; 20 contrações a mais (I've, didn't, there's…) | ✅ |
| 58 | Detector de 3ª pessoa também com sujeito substantivo ("my boss live") | ✅ |
| 59 | Aceitar paráfrases na prática diária, não só no checkpoint | 🗺️ P1 |
| 60 | Parâmetros da repetição espaçada ajustados ao seu histórico | 🗺️ P2 |

## F. Conteúdo e plataforma
| # | Melhoria | Status |
|---|---|---|
| 61 | Aba Evolução na navegação principal | ✅ |
| 62 | Trilhas B1→B2 (condicionais, voz passiva, discurso indireto, phrasal verbs) | 🗺️ P1 |
| 63 | Backup e restauração do progresso (exportar/importar) | 🗺️ P1 |
| 64 | Contas e sincronização entre aparelhos | 🗺️ P1 |
| 65 | App instalável e offline | 🗺️ P2 |
| 66 | Teste A/B de exercícios usando o índice de fala como desfecho | 🗺️ P2 |

**Totais:** 66 melhorias · ✅ 33 implementadas nesta rodada · 🗺️ 33 planejadas.
