# Fundamentação científica do app

> Escopo inicial: inglês para falantes de português brasileiro (PT-BR).
> Cada referência abaixo foi conferida (autores, ano, veículo, DOI/URL) via Crossref, PubMed, páginas de editoras ou repositórios institucionais em nov/2026. Itens não conferidos estão marcados **[não verificado]**.

**Legenda — força da evidência**
- **MA** = meta-análise / síntese quantitativa
- **RCT/EXP** = experimentos controlados (laboratório ou sala de aula)
- **CORR** = correlacional / observacional / relatório de empresa
- **TEORIA** = modelo teórico (quando contestado: **TEORIA contestada**)

---

## 1. Repetição espaçada

**Evidência.** Distribuir revisões no tempo produz retenção maior que concentrá-las ("massed practice"). O intervalo ótimo entre sessões cresce com o tempo pelo qual se quer reter: para lembrar por meses, os intervalos devem ser de dias a semanas (a "ridgeline" temporal). Algoritmos modernos modelam a memória de cada item (dificuldade, estabilidade, recuperabilidade — modelo DSR) e agendam a revisão para quando a probabilidade de lembrar cai até uma meta (ex.: 90%).

**Força.** MA (Cepeda 2006: 839 avaliações, 317 experimentos) + EXP de larga escala (Cepeda 2008, >1.350 participantes). FSRS: validação preditiva em ~727 milhões de revisões reais de Anki (benchmark aberto), não RCT de aprendizagem.

**Referências.**
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science, 19*(11), 1095–1102. https://doi.org/10.1111/j.1467-9280.2008.02209.x
- Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *Proc. 28th ACM SIGKDD*, 4381–4390. https://doi.org/10.1145/3534678.3539081 (trabalho que originou o FSRS)
- open-spaced-repetition. FSRS — "The Algorithm" (wiki): https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm ; benchmark: https://github.com/open-spaced-repetition/srs-benchmark (métricas: log loss, RMSE por bins, AUC)

**Como o app aplica.** Todo item aprendido (palavra, chunk, som) vira um cartão agendado por FSRS (biblioteca open source, ex. `ts-fsrs`/`py-fsrs`) com retenção-alvo configurável (padrão 0,90). A fila diária mistura revisões vencidas + poucos itens novos, com limite de carga.

---

## 2. Prática de recuperação (testing effect)

**Evidência.** Tentar lembrar (teste) fortalece a memória mais do que reler. No experimento clássico, reler vence no teste após 5 min, mas testar vence após 2 dias e 1 semana. A meta-análise de Adesope et al. confirma vantagem de testes práticos sobre reestudo em diferentes formatos, idades e materiais; feedback após o teste amplia o efeito.

**Força.** MA (Adesope 2017) + EXP (Roediger & Karpicke 2006).

**Referências.**
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. *Review of Educational Research, 87*(3), 659–701. https://doi.org/10.3102/0034654316689306

**Como o app aplica.** Não existe tela de "apenas ler a lista": todo contato após a 1ª exposição é recuperação ativa (produzir a palavra a partir do áudio/imagem/frase em PT, digitar, falar). Preferir recordação livre a múltipla escolha à medida que o item amadurece; feedback imediato após cada resposta.

---

## 3. Intercalação (interleaving) e dificuldades desejáveis

**Evidência.** Bjork chamou de "dificuldades desejáveis" condições que tornam a prática mais lenta/difícil mas melhoram retenção e transferência (espaçamento, intercalação, recuperação, variação de contexto). Aprendizes e professores tendem a preferir o bloco ("blocked"), pois *parece* mais eficaz (ilusão de fluência). A meta-análise de Brunmair & Richter encontrou efeito moderado global (g ≈ 0,42), mais forte quando categorias são **parecidas entre si** e difíceis de discriminar; alertam que para listas de **palavras** e textos expositivos o efeito pode ser nulo ou negativo.

**Força.** MA (Brunmair & Richter 2019) + TEORIA bem sustentada (Bjork 1994).

**Referências.**
- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), *Metacognition: Knowing about knowing* (pp. 185–205). MIT Press.
- Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029–1052. https://doi.org/10.1037/bul0000209
- Taylor, K., & Rohrer, D. (2010). The effects of interleaved practice. *Applied Cognitive Psychology, 24*(6), 837–848. https://doi.org/10.1002/acp.1598

**Como o app aplica.** Intercalar onde há **confusão a discriminar**: pares mínimos (/ɪ/–/iː/, /æ/–/ɛ/), tempos verbais (past simple × present perfect), preposições. Para vocabulário novo, apresentar em blocos temáticos e só intercalar nas revisões. Mostrar ao usuário que "errar mais na prática" é esperado.

---

## 4. Aquisição de segunda língua: input, output, interação, noticing

**Evidência.**
- **Input compreensível (Krashen, "i+1"):** adquire-se língua ao entender mensagens levemente acima do nível atual. **Críticas:** hipóteses pouco testáveis/falsificáveis, separação rígida "aquisição × aprendizagem" e papel do "monitor" contestados (Gregg 1984); evidência de imersão canadense mostra que só input não basta para precisão gramatical (Swain).
- **Hipótese do output (Swain):** produzir força o aprendiz a processar sintaxe, perceber lacunas ("noticing the gap") e testar hipóteses.
- **Hipótese da interação (Long):** negociação de significado (pedidos de esclarecimento, reformulações) torna o input compreensível e direciona a atenção à forma. Meta-análise de Mackey & Goo (2007) aponta efeitos grandes da interação para vocabulário e gramática.
- **Noticing (Schmidt):** só vira "intake" o que é notado conscientemente; base para destacar formas no input. (A versão forte — "sem noticing não há aprendizagem" — é debatida.)

**Força.** Krashen: **TEORIA contestada**. Swain/Long/Schmidt: TEORIA com apoio empírico; interação: MA (Mackey & Goo 2007).

**Referências.**
- Krashen, S. D. (1982). *Principles and practice in second language acquisition*. Pergamon. Ed. online gratuita do autor: https://www.sdkrashen.com/content/books/principles_and_practice.pdf
- Gregg, K. R. (1984). Krashen's monitor and Occam's razor. *Applied Linguistics, 5*(2), 79–100. https://doi.org/10.1093/applin/5.2.79
- Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output in its development. In S. Gass & C. Madden (Eds.), *Input in second language acquisition* (pp. 235–253). Newbury House.
- Long, M. H. (1996). The role of the linguistic environment in second language acquisition. In W. C. Ritchie & T. K. Bhatia (Eds.), *Handbook of second language acquisition* (pp. 413–468). Academic Press.
- Schmidt, R. W. (1990). The role of consciousness in second language learning. *Applied Linguistics, 11*(2), 129–158. https://doi.org/10.1093/applin/11.2.129
- Mackey, A., & Goo, J. (2007). Interaction research in SLA: A meta-analysis and research synthesis. In A. Mackey (Ed.), *Conversational interaction in second language acquisition* (pp. 407–451). Oxford University Press.

**Como o app aplica.** Histórias/diálogos graduados com ~95–98% de palavras conhecidas (input), seguidos de tarefas de produção (falar/escrever) e de um parceiro de conversa (IA) que negocia significado e reformula. Formas-alvo destacadas visualmente no texto (input enhancement) para induzir noticing.

---

## 5. Vocabulário por frequência, cobertura lexical e chunks

**Evidência.** Poucas famílias de palavras cobrem a maior parte dos textos; por isso ensinar por **frequência** maximiza retorno. Nation estima ~8–9 mil famílias para leitura e ~6–7 mil para fala com 98% de cobertura. Laufer & Ravenhorst-Kalovski propõem dois limiares: **95%** de cobertura (~4–5 mil famílias) para compreensão "mínima aceitável" e **98%** (~8 mil) para compreensão "ótima". Abordagem lexical: a língua é em grande parte feita de sequências pré-fabricadas (collocations, "chunks"); aprendê-las melhora fluência e naturalidade (Lewis); Boers & Lindstromberg reúnem técnicas com evidência experimental (ex.: chamar atenção para aliteração, motivação semântica).

**Força.** CORR/corpus + estudos empíricos (Nation 2006; Laufer 2010); abordagem lexical: TEORIA pedagógica com EXP de apoio (Boers & Lindstromberg).

**Referências.**
- Nation, I. S. P. (2006). How large a vocabulary is needed for reading and listening? *Canadian Modern Language Review, 63*(1), 59–82. https://doi.org/10.3138/cmlr.63.1.59
- Laufer, B., & Ravenhorst-Kalovski, G. C. (2010). Lexical threshold revisited: Lexical text coverage, learners' vocabulary size and reading comprehension. *Reading in a Foreign Language, 22*(1), 15–30. https://hdl.handle.net/10125/66648
- Lewis, M. (1993). *The lexical approach: The state of ELT and a way forward*. Language Teaching Publications. (confirmado via resenha em *TESOL Quarterly* 28, 1994, https://doi.org/10.2307/3587574)
- Boers, F., & Lindstromberg, S. (2009). *Optimizing a lexical approach to instructed second language acquisition*. Palgrave Macmillan.

**Como o app aplica.** Currículo lexical ordenado por listas de frequência (ex.: famílias BNC/COCA) e medido em "cobertura": o app só libera um texto quando o aluno conhece ≥95% das palavras dele. Cartões ensinam chunks em contexto ("make a decision", "I'm looking forward to"), não palavras isoladas.

---

## 6. Pronúncia

**Evidência.**
- **HVPT (High Variability Phonetic Training):** treinar a *percepção* de contrastes com muitas vozes e contextos fonéticos, com feedback de acerto/erro, melhora a discriminação e generaliza para palavras e vozes novas; ganhos duram meses. Origem: japoneses aprendendo /r/–/l/ (Logan et al. 1991). Revisão de 32 estudos (Thomson 2018) e meta-análise de 79 estudos (Uchihara, Karas & Thomson 2025: g = 0,92 pré-pós; g = 0,67 vs. controle). Transferência para a **produção** é menor (pequena a média; Uchihara et al. 2024).
- **Instrução explícita de pronúncia:** efeito médio em 86 estudos; maior com feedback e em medidas controladas (Lee, Jang & Plonsky 2015).
- **Shadowing** (repetir simultaneamente um áudio): 8 semanas com celular melhoraram compreensibilidade e fluência em tarefa treinada, com efeito limitado na fala espontânea (Foote & McDonough 2017) — evidência de estudos pequenos.
- **Inteligibilidade > sotaque nativo:** sotaque forte não implica fala ininteligível; as três dimensões (sotaque, compreensibilidade, inteligibilidade) são parcialmente independentes. A meta deve ser ser entendido, priorizando traços que afetam a compreensão (Munro & Derwing 1995; Derwing & Munro 2015).

**Força.** HVPT: MA. Instrução de pronúncia: MA. Shadowing: EXP pequeno. Inteligibilidade: EXP + síntese.

**Referências.**
- Logan, J. S., Lively, S. E., & Pisoni, D. B. (1991). Training Japanese listeners to identify English /r/ and /l/: A first report. *JASA, 89*(2), 874–886. https://doi.org/10.1121/1.1894649
- Thomson, R. I. (2018). High variability [pronunciation] training (HVPT): A proven technique about which every language teacher and learner ought to know. *Journal of Second Language Pronunciation, 4*(2), 208–231. https://doi.org/10.1075/jslp.17038.tho
- Uchihara, T., Karas, M., & Thomson, R. I. (2025). High variability phonetic training (HVPT): A meta-analysis of L2 perceptual training studies. *Studies in Second Language Acquisition, 47*, 794–827. https://doi.org/10.1017/S0272263125100879
- Uchihara, T., Karas, M., & Thomson, R. I. (2024). Does perceptual HVPT improve L2 speech production? A meta-analysis. *Applied Psycholinguistics, 45*, 591–623. https://doi.org/10.1017/S0142716424000195
- Lee, J., Jang, J., & Plonsky, L. (2015). The effectiveness of second language pronunciation instruction: A meta-analysis. *Applied Linguistics, 36*(3), 345–366. https://doi.org/10.1093/applin/amu040
- Foote, J. A., & McDonough, K. (2017). Using shadowing with mobile technology to improve L2 pronunciation. *Journal of Second Language Pronunciation, 3*(1), 34–56. https://doi.org/10.1075/jslp.3.1.02foo
- Munro, M. J., & Derwing, T. M. (1995). Foreign accent, comprehensibility, and intelligibility in the speech of second language learners. *Language Learning, 45*(1), 73–97. https://doi.org/10.1111/j.1467-1770.1995.tb00963.x
- Derwing, T. M., & Munro, M. J. (2015). *Pronunciation fundamentals: Evidence-based perspectives for L2 teaching and research*. John Benjamins. https://doi.org/10.1075/lllt.42

**Como o app aplica.** Módulo "Ouvido" com HVPT: identificação de pares mínimos gravados por 6+ vozes (sotaques variados), feedback imediato, agendado por FSRS. Módulo "Voz": shadowing com gravação e comparação, avaliação automática (ASR) focada em **inteligibilidade** e nos erros de alto impacto, nunca em "soar nativo".

---

## 7. Feedback corretivo

**Evidência.** Corrigir erros orais tem efeito significativo e **durável**. Em sala de aula, *prompts* (levar o aluno a se autocorrigir: "Como? Tente de novo com o passado") superam *recasts* (reformular corretamente), e o efeito aparece sobretudo em produção livre (Lyster & Saito 2010, 15 estudos, N = 827). Li (2010, 33 estudos) encontrou efeito médio, mantido no tempo; feedback implícito se manteve melhor que o explícito no longo prazo, e estudos de laboratório/curtos mostraram efeitos maiores.

**Força.** MA (duas).

**Referências.**
- Lyster, R., & Saito, K. (2010). Oral feedback in classroom SLA: A meta-analysis. *Studies in Second Language Acquisition, 32*(2), 265–302. https://doi.org/10.1017/S0272263109990520
- Li, S. (2010). The effectiveness of corrective feedback in SLA: A meta-analysis. *Language Learning, 60*(2), 309–365. https://doi.org/10.1111/j.1467-9922.2010.00561.x

**Como o app aplica.** Feedback em dois passos: 1º um *prompt* (dica/metalinguística, "repare no verbo"), deixando o aluno tentar de novo; 2º, se errar, a forma correta (recast/explícito) + áudio. O erro vira cartão de revisão.

---

## 8. Dupla codificação e aprendizagem multimídia

**Evidência.** Informação codificada verbal + imageticamente é mais bem lembrada (Paivio; Clark & Paivio). Mayer: aprende-se melhor com palavras + imagens do que só palavras, desde que se reduza carga cognitiva supérflua (coerência, sinalização, contiguidade, modalidade — narrar em vez de encher a tela de texto, evitar redundância).

**Força.** TEORIA com ampla base EXP (Mayer reúne dezenas de experimentos); princípios de Mayer têm efeitos que variam com o conhecimento prévio.

**Referências.**
- Paivio, A. (1986). *Mental representations: A dual coding approach*. Oxford University Press. https://doi.org/10.1093/acprof:oso/9780195066661.001.0001
- Clark, J. M., & Paivio, A. (1991). Dual coding theory and education. *Educational Psychology Review, 3*(3), 149–210. https://doi.org/10.1007/BF01320076
- Mayer, R. E., & Moreno, R. (2003). Nine ways to reduce cognitive load in multimedia learning. *Educational Psychologist, 38*(1), 43–52. https://doi.org/10.1207/S15326985EP3801_6
- Mayer, R. E. (2002). Multimedia learning. *Psychology of Learning and Motivation, 41*, 85–139. https://doi.org/10.1016/S0079-7421(02)80005-6

**Como o app aplica.** Cartões de palavras concretas = imagem + áudio + frase-exemplo (sem tradução quando a imagem basta). Telas enxutas: um conceito por tela, áudio narrado em vez de blocos de texto, destaque visual só no alvo.

---

## 9. Gamificação e motivação

**Evidência.**
- **Teoria da Autodeterminação (SDT):** motivação de qualidade depende de **autonomia, competência e pertencimento**. Recompensas tangíveis e esperadas, condicionadas à tarefa, tendem a **reduzir** a motivação intrínseca (meta-análise de 128 experimentos; Deci, Koestner & Ryan 1999 — tema debatido por Lepper et al. no mesmo número).
- **Gamificação em educação:** efeitos pequenos mas significativos em resultados cognitivos (g = 0,49), motivacionais (g = 0,36) e comportamentais (g = 0,25); só o cognitivo se manteve em estudos rigorosos; narrativa (game fiction) e interação social moderam efeitos (Sailer & Homner 2020). Em sala de aula, um estudo longitudinal encontrou **queda** de motivação intrínseca e notas piores com badges/leaderboards (Hanus & Fox 2015).
- **Duolingo:** aprendizes que concluíram cursos iniciais (espanhol/francês, n = 225) atingiram ACTFL Intermediate Low em leitura e Novice High em escuta, comparável ao 4º semestre universitário (Jiang et al. 2021 — **autores são da empresa**; só leitura/escuta). Vesselinov & Grego (2012): ~8,1 pontos de ganho por hora em espanhol, mas financiado pela empresa, só espanhol e amostra de voluntários. Loewen et al. (2019): estudo de caso independente (9 aprendizes de turco, 1 semestre) — melhora nas medidas, correlação moderada entre tempo de uso e ganho, mas motivação variável e frustração com o material.
- **Riscos — streaks:** sequências intactas aumentam o engajamento, mas **sequências quebradas reduzem** o engajamento posterior (Silverman & Barasch 2022, 7 estudos). Isso sustenta o risco de "ansiedade de streak" e abandono após a quebra; evidência específica sobre ansiedade em aprendizes de idiomas é **anedótica** (não encontrei estudo revisado por pares).

**Força.** SDT: TEORIA + MA. Gamificação: MA (efeito pequeno, heterogêneo). Duolingo: CORR / relatórios com conflito de interesse.

**Referências.**
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68–78. https://doi.org/10.1037/0003-066X.55.1.68
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin, 125*(6), 627–668. https://doi.org/10.1037/0033-2909.125.6.627
- Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77–112. https://doi.org/10.1007/s10648-019-09498-w
- Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom: A longitudinal study on intrinsic motivation, social comparison, satisfaction, effort, and academic performance. *Computers & Education, 80*, 152–161. https://doi.org/10.1016/j.compedu.2014.08.019
- Jiang, X., Rollinson, J., Plonsky, L., Gustafson, E., & Pajak, B. (2021). Evaluating the reading and listening outcomes of beginning-level Duolingo courses. *Foreign Language Annals, 54*(4), 974–1002. https://doi.org/10.1111/flan.12600
- Vesselinov, R., & Grego, J. (2012). *Duolingo effectiveness study: Final report*. Relatório não revisado por pares, financiado pela Duolingo (cópias em circulação; URL original não confirmada).
- Loewen, S., Crowther, D., Isbell, D. R., Kim, K. M., Maloney, J., Miller, Z. F., & Rawal, H. (2019). Mobile-assisted language learning: A Duolingo case study. *ReCALL, 31*(3), 293–311. https://doi.org/10.1017/S0958344019000065
- Silverman, J., & Barasch, A. (2022). On or off track: How (broken) streaks affect consumer decisions. *Journal of Consumer Research, 49*(6), 1095–1117. https://doi.org/10.1093/jcr/ucac029

**Como o app aplica.** Gamificação a serviço da SDT: progresso mostrado como **competência real** ("você entende 72% de um episódio de série"), metas escolhidas pelo usuário (autonomia), desafios cooperativos opcionais (pertencimento). Streak "gentil": meta semanal em vez de diária, dias de descanso automáticos, quebra sem punição visual; sem leaderboard por padrão; sem notificações culpabilizantes.

---

## 10. Erros frequentes de brasileiros em inglês

| Traço | O que acontece | Impacto na inteligibilidade | Fonte |
|---|---|---|---|
| **th /θ ð/** | Substituição por [t, d], [f], [s] (*think* → "tink"/"fink") | Médio (baixo rendimento funcional, mas saliente) | Zimmer, Silveira & Alves 2009; Swan & Smith 2001 |
| **/ɪ/ × /iː/** | Fusão numa só /i/ do PT (*ship/sheep, live/leave*) | Alto (muitos pares mínimos) | Rauber et al. 2005; Bion et al. 2006 |
| **/æ/ × /ɛ/** | Fusão em /ɛ/ (*bad/bed, man/men*) | Alto | Bion et al. 2006; Zimmer et al. 2009 |
| **Epêntese de "i"** | Vogal inserida após consoante final e em clusters: *big* → "bigui", *Facebook* → "Feicibuqui"; *school* → "iscool" (prótese) | Médio-alto (muda nº de sílabas) | Cardoso 2007; Zimmer et al. 2009 |
| **/h/ inicial × "r"** | O "r" inicial do PT soa [h]/[x]: *red* soa próximo de *head*; e, por hipercorreção, *h* lido como r | Alto em pares como *rat/hat* | Manfé et al. 2018; Zimmer et al. 2009 |
| **Terminação -ed** | Pronúncia de *-ed* como sílaba extra (/ɪd/) em todos os verbos: *walked* → "walk-ed" | Médio (pode mudar tempo verbal percebido) | Delatorre 2008; Zimmer et al. 2009 |

**Força.** CORR/descritivo (estudos de produção e percepção com amostras pequenas) + obras de referência.

**Referências.**
- Swan, M., & Smith, B. (Eds.). (2001). *Learner English: A teacher's guide to interference and other problems* (2nd ed.), cap. "Portuguese speakers", pp. 113–128. Cambridge University Press. https://doi.org/10.1017/CBO9780511667121
- Zimmer, M., Silveira, R., & Alves, U. K. (2009). *Pronunciation instruction for Brazilians: Bringing theory and practice together*. Cambridge Scholars Publishing. ISBN 978-1-4438-0346-5
- Rauber, A. S., Escudero, P., Bion, R. A. H., & Baptista, B. O. (2005). The interrelation between the perception and production of English vowels by native speakers of Brazilian Portuguese. *Interspeech 2005*, 2913–2916. https://doi.org/10.21437/Interspeech.2005-769
- Bion, R. A. H., Escudero, P., Rauber, A. S., & Baptista, B. O. (2006). Category formation and the role of spectral quality in the perception and production of English front vowels. *Interspeech 2006*. https://doi.org/10.21437/Interspeech.2006-411
- Cardoso, W. (2007). The variable development of English word-final stops by Brazilian Portuguese speakers: A stochastic optimality theoretic account. *Language Variation and Change, 19*(3), 219–248. https://doi.org/10.1017/S0954394507000142
- Manfé, K. P., Biehl, A. G., Woelfer, T., & Silveira, R. (2018). The perception of the glottal fricative /h/ in onset position by Brazilian learners of English as a foreign language. *Gradus, 3*(2), 48–71. https://doi.org/10.47627/gradus.v3i2.127
- Delatorre, F. (2008). The influence of sonority on the production of words ending in -ed by Brazilian EFL learners. *Ilha do Desterro, 55*. https://doi.org/10.5007/2175-8026.2008n55p83

**Como o app aplica.** Diagnóstico inicial de pronúncia cobrindo esses 6 traços; trilha HVPT priorizada pelos contrastes de maior impacto (/ɪ–iː/, /æ–ɛ/, /h–r/, epêntese) antes do th. Dicas em PT-BR comparando com sons do português.

---

## 11. CEFR como estrutura de níveis

**Evidência.** O Quadro Europeu Comum de Referência define níveis A1–C2 por descritores "can do" (o que o aprendiz consegue fazer). O *Companion Volume* (2020) atualiza a escala de 2001: acrescenta Pré-A1, níveis "plus", descritores de **mediação**, interação online, competência plurilíngue/pluricultural e substitui o ideal de "falante nativo" por controle fonológico centrado em inteligibilidade.

**Força.** Marco de referência institucional (consenso/validação de descritores), não teoria de aquisição.

**Referência.**
- Council of Europe. (2020). *Common European Framework of Reference for Languages: Learning, teaching, assessment — Companion volume*. Council of Europe Publishing. ISBN 978-92-871-8621-8. https://rm.coe.int/16809ea0d4

**Como o app aplica.** Trilhas e conteúdos etiquetados por nível CEFR e por descritor "can do"; o progresso é exibido como descritores conquistados ("consigo pedir comida num restaurante" = A2), e a escala fonológica do Companion orienta a avaliação de pronúncia.

---

## Sites e apps de referência

| Produto | O que faz bem | Princípio que o app adota (sem copiar marca/conteúdo) |
|---|---|---|
| **Duolingo** (duolingo.com) | Hábito diário, microlições, onboarding sem atrito | Sessões curtas e fricção mínima; mas streak "gentil" (ver §9) |
| **Anki** (apps.ankiweb.net) | SRS configurável, FSRS integrado, open source | Agendamento por FSRS e retenção-alvo transparente |
| **Babbel** (babbel.com) | Lições curtas com diálogos realistas e explicação gramatical explícita | Diálogos de situação real + notas explícitas curtas |
| **Busuu** (busuu.com) | Correção de produção escrita/oral por falantes nativos | Produção com feedback (aqui via IA + prompts, §7) |
| **Speechling** (speechling.com) | Gravar frase e receber feedback humano de pronúncia | Ciclo ouvir → gravar → comparar → feedback |
| **ELSA Speak** (elsaspeak.com) | Avaliação automática de pronúncia por fonema | Feedback por segmento, priorizado por inteligibilidade |
| **BBC Learning English** (bbc.co.uk/learningenglish) | Conteúdo gratuito graduado, vídeos curtos de pronúncia | Input autêntico graduado por nível |
| **Cambridge English** (cambridgeenglish.org) | Alinhamento rigoroso ao CEFR, testes de nivelamento | Nivelamento e descritores "can do" |
| **YouGlish** (youglish.com) | Mostra a palavra pronunciada em vídeos reais por muitos falantes | Variabilidade de vozes (base do HVPT) e contexto real |
| **Forvo** (forvo.com) | Banco de pronúncias por falantes de várias regiões | Múltiplas vozes/sotaques por item |
| **LingQ** (lingq.com) | Leitura/escuta extensiva com rastreio de palavras conhecidas | Medir cobertura lexical e liberar textos ≥95% |
| **Language Transfer** (languagetransfer.org) | Método de "pensar a língua", aproveita a L1 e faz o aluno construir frases | Explorar transferência PT→EN e recuperação ativa guiada |
| **Pimsleur** (pimsleur.com) | Áudio com recuperação espaçada graduada e produção oral desde o início | Recuperação oral espaçada sem tela (modo áudio) |

---

## Matriz princípio → funcionalidade

| # | Princípio | Funcionalidade no app | Força da evidência |
|---|---|---|---|
| 1 | Repetição espaçada | Agendador FSRS para todos os itens; retenção-alvo 0,90 | MA + benchmark |
| 2 | Recuperação ativa | Exercícios de produção (digitar/falar) em vez de releitura; feedback imediato | MA |
| 3 | Intercalação / dif. desejáveis | Sessões mistas de pares mínimos e estruturas confundíveis; blocos para itens novos | MA (moderada; cuidado com vocabulário) |
| 4a | Input compreensível | Biblioteca de histórias/áudios graduados com i+1 | TEORIA contestada |
| 4b | Output / interação | Tarefas de fala e escrita; parceiro de conversa IA que negocia significado | TEORIA + MA (interação) |
| 4c | Noticing | Destaque de formas-alvo no texto e no feedback | TEORIA |
| 5a | Frequência / cobertura | Currículo por frequência; "medidor de cobertura" por texto (95/98%) | CORR + EXP |
| 5b | Chunks | Cartões de collocations e frases prontas em contexto | TEORIA + EXP |
| 6a | HVPT | Treino de percepção com 6+ vozes e feedback | MA |
| 6b | Instrução explícita + shadowing | Dicas articulatórias em PT-BR; shadowing com gravação | MA / EXP pequeno |
| 6c | Inteligibilidade | Pontuação de pronúncia focada em inteligibilidade, não sotaque | EXP + síntese |
| 7 | Feedback corretivo | Prompt → nova tentativa → forma correta; erro vira cartão | MA |
| 8 | Dupla codificação / multimídia | Imagem + áudio + frase; telas com um foco; narração | TEORIA + EXP |
| 9 | SDT / gamificação | Metas escolhidas, progresso como competência, streak semanal com descanso, sem leaderboard padrão | TEORIA + MA (efeito pequeno) |
| 10 | Erros de brasileiros | Diagnóstico inicial + trilha priorizada por impacto (/ɪ–iː/, /æ–ɛ/, h–r, epêntese, -ed, th) | CORR |
| 11 | CEFR | Níveis A1–C2 e descritores "can do" como mapa de progresso | Marco institucional |
