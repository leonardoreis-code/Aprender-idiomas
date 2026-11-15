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

## G. Metodologias novas e correção em tempo real (rodada seguinte)
| # | Melhoria | Status |
|---|---|---|
| 67 | Treinador ao vivo: transcrição palavra a palavra enquanto você fala | ✅ |
| 68 | Detector de erros em fala livre com 55 regras de interferência do português, no próprio navegador | ✅ |
| 69 | Erro sublinhado em tempo real, durante a fala (pode ser desligado) | ✅ |
| 70 | Feedback graduado em 4 degraus: aviso → onde → pista → modelo | ✅ |
| 71 | Ajuda inicial que diminui quando você já consertou aquele erro com menos ajuda | ✅ |
| 72 | Métrica de autocorreção (% de erros consertados sem ver a resposta) no gráfico semanal | ✅ |
| 73 | Conversa livre conduzida pelo Claude, com erros além das regras e "jeito mais natural" — artefato | ✅ |
| 74 | Fluência 60·45·30 (técnica 4/3/2 em versão curta) | ✅ |
| 75 | Reconto: ouvir uma história e recontar, com ideias cobertas e erros marcados | ✅ |
| 76 | Eco com atraso: repetir a frase 3 s depois de ouvir, com tamanho adaptativo | ✅ |
| 77 | Tela "Falar" reunindo os 7 treinos de fala | ✅ |
| 78 | Treinador a partir da aula, com perguntas de transformação (negativa, pergunta, 3ª pessoa, passado) | ✅ |
| 79 | Frases corrigidas com modelo vão para o caderno | ✅ |
| 80 | "Tente antes": 3 frases antes da explicação da aula (efeito do pré-teste) | 🗺️ P1 |
| 81 | Conversa livre com IA também no modo servidor (API do Claude no backend) | 🗺️ P1 |
| 82 | Treinador sem tocar no microfone (escuta contínua com detecção de turno) | 🗺️ P1 |
| 83 | Regras do detector calibradas com as suas transcrições reais (taxa de falso positivo) | 🗺️ P1 |
| 84 | Descrever uma palavra sem dizê-la (circunlóquio), para quando o vocabulário faltar | 🗺️ P2 |

## H. Simulações do dia a dia (interação e vida real)
| # | Melhoria | Status |
|---|---|---|
| 85 | 10 simulações completas: daily com bloqueio, pedir ajuda, discordar, avisar atraso, entrevista, cliente, 1:1, bate-papo, restaurante, hotel | ✅ |
| 86 | Objetivos comunicativos que acendem enquanto você fala (não só gramática) | ✅ |
| 87 | Personagem que reage: insiste quando o ponto não veio, pede mais quando a resposta é curta | ✅ |
| 88 | Pedir para repetir em inglês funciona e não pune (estratégia real de conversa) | ✅ |
| 89 | "Travei": começo de frase após 3,5 s de silêncio ou no toque | ✅ |
| 90 | "Como se diz…?": socorro de vocabulário no meio da conversa (glossário local + Claude no artefato) | ✅ |
| 91 | Correção sem parar a conversa: pista embaixo da sua fala, com "ver correção" e "dizer de novo" | ✅ |
| 92 | Ritmo ao vivo (palavras por minuto) enquanto fala | ✅ |
| 93 | Seu contexto real (cargo, projeto, colega, ferramenta) dentro das falas do personagem | ✅ |
| 94 | "O que tem no seu dia hoje?" prioriza as simulações do dia | ✅ |
| 95 | Conversa contínua: o microfone abre sozinho depois do personagem (fora do artefato) | ✅ (não testado com voz) |
| 96 | Estrelas por simulação e "modo real" com objetivos escondidos na repetição | ✅ |
| 97 | Frases que resolvem a situação viram treino na escada com um toque | ✅ |
| 98 | Personagem interpretado pelo Claude, reagindo livremente — artefato | ✅ (não testado ao vivo) |
| 99 | Simulação gerada a partir da sua agenda real do dia | 🗺️ P1 |
| 100 | Personagens com sotaques e velocidades diferentes | 🗺️ P1 |
| 101 | Interrupções e ruído de chamada (áudio ruim, duas pessoas falando) | 🗺️ P2 |
| 102 | Simulações em grupo (reunião com 3 personagens) | 🗺️ P2 |

## I. Rodada "aprender de verdade" (63 itens)
Contagem honesta: 34 são **conteúdo novo** (o curso acabava em 10 a 12 semanas) e 29 são **mecanismos de aprendizado**.
Esta rodada também fecha 13 itens que estavam planejados acima (nº 15, 37, 45, 50, 52, 53, 59, 62, 63, 80, 83, 99 e parte do 28).

### Conteúdo (34)
| # | Item | Status |
|---|---|---|
| 103–112 | Trilha **Rumo ao B2**: 10 aulas, 120 frases (condicionais, passiva, discurso indireto, orações relativas, phrasal verbs 1 e 2, used to, linguagem diplomática, comparações) | ✅ |
| 113–114 | Kit de sobrevivência em reunião: 2 aulas, 24 frases (ganhar tempo, pedir para repetir, interromper, discordar, encerrar) | ✅ |
| 115–124 | 10 simulações novas: code review, incidente em produção, onboarding, negociar prazo, demo, recrutador, aeroporto, médico, suporte, vizinho | ✅ |
| 125–127 | Formas D, E e F do checkpoint (6 no total: nenhuma se repete em 24 semanas) | ✅ |
| 128–135 | 8 histórias novas de reconto (níveis A2 a B2) | ✅ |
| 136 | Glossário do "Como se diz?" com mais 185 termos | ✅ |

### Mecanismos de aprendizado (29)
| # | Item | Status |
|---|---|---|
| 137 | Banco de erros pessoais: todo erro marcado no treinador, nas simulações e no reconto é guardado | ✅ |
| 138 | "Conserte seus erros": seus trechos errados voltam com repetição espaçada para você dizer certo | ✅ |
| 139 | "Não era erro": com 2 avisos, a regra para de marcar para você | ✅ |
| 140 | Lista de regras silenciadas, com reativar | ✅ |
| 141 | 21 regras novas no detector (76 no total), com testes de falso positivo | ✅ |
| 142 | "Tente antes": 3 frases antes da explicação da aula | ✅ |
| 143 | Antes e depois por aula (as mesmas 3 frases, antes e depois da prática) | ✅ |
| 144 | Backup do progresso (copiar) | ✅ |
| 145 | Restaurar progresso de um backup | ✅ |
| 146 | Avaliador de paráfrases na prática diária — artefato | ✅ (não testado ao vivo) |
| 147 | Simulação criada a partir da sua situação real — artefato | ✅ (não testado ao vivo) |
| 148 | Medição de pausas longas na fala ao vivo | ✅ (aproximada) |
| 149 | Gráfico semanal de pausas por minuto | ✅ |
| 150 | Gráfico semanal de tempo para começar a responder | ✅ |
| 151 | Dia corrido: 5 frases para não quebrar o ritmo | ✅ |
| 152 | Atalho "seus erros reais" na tela inicial | ✅ |
| 153 | Da revisão de erros direto para a aula que explica aquela regra | ✅ |
| 154 | Transforme: negativa, pergunta, passado, ele/ela, futuro, present perfect (48 itens) | ✅ |
| 155 | Faça a pergunta: da resposta para a pergunta (36 itens) | ✅ |
| 156 | Resposta rápida: tempo até começar a falar (40 perguntas) | ✅ |
| 157 | Números em voz alta: preços, porcentagens, anos, horas, datas | ✅ |
| 158 | Shadowing frase a frase | ✅ |
| 159 | Vocabulário de trabalho PT→EN com caixas espaçadas | ✅ |
| 160 | Histórias STAR com correção ao digitar e ensaio de 90 segundos | ✅ |
| 161 | Revisão da semana: veredito, erros mais frequentes e o que fazer agora | ✅ |
| 162 | Corretor: "studied" no lugar de "studies" não passa mais como quase certo | ✅ |
| 163 | Trilha B2 entra na recomendação conforme o perfil | ✅ |
| 164 | Tela Falar reorganizada: conversas, fluência e treinos curtos | ✅ |
| 165 | Rodízio do checkpoint com 6 formas | ✅ |

**Totais:** ✅ 123 implementadas (60 anteriores + 63 desta rodada) · 🗺️ 29 planejadas restantes (42 − 13 fechadas).
