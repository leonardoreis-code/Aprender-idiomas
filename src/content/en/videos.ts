import type { VideoLesson } from '../../domain/curriculum/speaking';

/**
 * Vídeo-aulas — slides animados com narração do professor avatar (PT-BR, exemplos em inglês).
 * Cada aula termina com um quiz.
 */
export const videoLessons: VideoLesson[] = [
  /* ------------------------------------------------------------ *
   * ZERO
   * ------------------------------------------------------------ */
  {
    id: "video-zero-01",
    track: "zero",
    title: "Verbo to be: ser e estar",
    level: "A1",
    lessonId: "zero-01",
    slides: [
      {
        visual: { kind: "title", title: "Verbo to be", subtitle: "Ser e estar numa palavra só" },
        narration: "Oi! Hoje você vai aprender o verbo mais importante do inglês: o to be. Ele quer dizer ao mesmo tempo 'ser' e 'estar'.",
      },
      {
        visual: { kind: "bullets", title: "As três formas no presente", bullets: ["I → am", "He / She / It → is", "You / We / They → are"] },
        narration: "Repare que são só três formas: am, is e are. Cada pessoa tem a sua, e pronto, não tem mais nada para decorar.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "am", role: "verb" }, { text: "a teacher", role: "object" }], caption: "Sujeito + am/is/are + complemento" },
        narration: "A frase sempre começa com quem. Depois vem o verbo, e por último o resto. I am a teacher: eu sou professor.",
      },
      {
        visual: { kind: "example", en: "I'm tired.", pt: "Eu estou cansado.", highlight: "I'm" },
        narration: "No dia a dia, a gente junta as palavras: I am vira I'm. E repare que 'estar cansado' também usa o to be.",
      },
      {
        visual: { kind: "compare", pt: "É muito bom.", wrong: "Is very good.", en: "It's very good." },
        narration: "Esse é o erro clássico do brasileiro: esquecer o sujeito. Em inglês toda frase precisa de um sujeito; quando não tem ninguém, use it.",
      },
      {
        visual: { kind: "example", en: "She is from Brazil.", pt: "Ela é do Brasil.", highlight: "is" },
        narration: "Com she, he e it, a forma é is. She is from Brazil. Agora fale em voz alta comigo: She's from Brazil.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "She", role: "subject" }, { text: "is", role: "verb" }, { text: "not", role: "other" }, { text: "at home", role: "other" }], caption: "Negativa: not logo depois do verbo" },
        narration: "Para negar, é fácil: coloque not logo depois do verbo. She is not at home, ou, mais natural, She isn't at home.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "Are", role: "verb" }, { text: "you", role: "subject" }, { text: "ready", role: "other" }, { text: "?", role: "other" }], caption: "Pergunta: o verbo vai para a frente" },
        narration: "Para perguntar, o verbo pula para a frente do sujeito. You are ready vira Are you ready? Simples assim.",
      },
      {
        visual: { kind: "quiz", question: "Como se diz 'Nós estamos atrasados'?", options: ["We is late.", "We are late.", "Are late."], answer: 1 },
        narration: "Agora tente você: como se diz 'Nós estamos atrasados'? Pense no sujeito e na forma certa do verbo.",
      },
    ],
  },
  {
    id: "video-zero-02",
    track: "zero",
    title: "Presente simples: sua rotina",
    level: "A1",
    lessonId: "zero-04",
    slides: [
      {
        visual: { kind: "title", title: "Presente simples", subtitle: "Falando da sua rotina" },
        narration: "Bora falar da sua rotina em inglês? Hoje você aprende o presente simples, o tempo verbal do dia a dia.",
      },
      {
        visual: { kind: "bullets", title: "Quando usar", bullets: ["Rotina: I work every day.", "Gostos: I like coffee.", "Fatos: Water boils at 100 °C."] },
        narration: "Use o presente simples para coisas que se repetem, para gostos e para fatos. Repare que o verbo fica na forma básica.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "work", role: "verb" }, { text: "from home", role: "other" }, { text: "every day", role: "time" }], caption: "Quem + faz + onde + quando" },
        narration: "Olha a ordem: quem, faz, onde e, no fim, quando. Em inglês o tempo costuma ficar no final da frase.",
      },
      {
        visual: { kind: "example", en: "I drink coffee every morning.", pt: "Eu tomo café toda manhã.", highlight: "drink" },
        narration: "Repare: em inglês a gente 'bebe' café, drink. Repita comigo: I drink coffee every morning.",
      },
      {
        visual: { kind: "bullets", title: "A regra do -s", bullets: ["He works", "She likes", "It rains", "Atenção: he goes, she watches, it has"] },
        narration: "Agora o detalhe que todo mundo esquece: com he, she e it, o verbo ganha um -s. E alguns ganham -es, como goes e watches.",
      },
      {
        visual: { kind: "compare", pt: "Ela trabalha num banco.", wrong: "She work in a bank.", en: "She works in a bank." },
        narration: "Sem o -s a frase fica errada. She works, com s. Treine isso até sair no automático.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "She", role: "subject" }, { text: "works", role: "verb" }, { text: "in a bank", role: "other" }], caption: "he / she / it → verbo + s" },
        narration: "A estrutura é a mesma; só o verbo muda. Sujeito, verbo com s, e o resto.",
      },
      {
        visual: { kind: "example", en: "My brother lives in Lisbon.", pt: "Meu irmão mora em Lisboa.", highlight: "lives" },
        narration: "My brother é he, então: lives. Agora tente falar da sua família: My mother works..., My sister likes...",
      },
      {
        visual: { kind: "quiz", question: "Qual frase está correta?", options: ["He like pizza.", "He liking pizza.", "He likes pizza."], answer: 2 },
        narration: "Hora do quiz! Qual dessas frases está certa? Lembre da regra do -s.",
      },
    ],
  },

  /* ------------------------------------------------------------ *
   * FALA
   * ------------------------------------------------------------ */
  {
    id: "video-fala-01",
    track: "fala",
    title: "A ordem da frase e o sujeito obrigatório",
    level: "A2",
    lessonId: "fala-01",
    slides: [
      {
        visual: { kind: "title", title: "A ordem da frase em inglês", subtitle: "Sujeito + verbo + complemento, sempre" },
        narration: "Você entende inglês, mas trava na hora de falar? Muitas vezes o problema é a ordem da frase. Vamos resolver isso hoje.",
      },
      {
        visual: { kind: "bullets", title: "Por que o brasileiro trava", bullets: ["Em português, o sujeito pode sumir: 'Chegou.'", "Em inglês, o sujeito é obrigatório: 'He arrived.'", "A ordem é mais rígida: quem → faz → o quê → quando"] },
        narration: "Em português a gente omite o sujeito o tempo todo. Em inglês não dá: alguém sempre tem que fazer a ação.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "She", role: "subject" }, { text: "bought", role: "verb" }, { text: "a new laptop", role: "object" }, { text: "yesterday", role: "time" }], caption: "Quem + faz + o quê + quando" },
        narration: "Guarde esse trilho: quem, faz, o quê, quando. She bought a new laptop yesterday. O tempo vai para o final.",
      },
      {
        visual: { kind: "compare", pt: "Está chovendo.", wrong: "Is raining.", en: "It's raining." },
        narration: "Clima não tem sujeito em português, mas em inglês tem: it. It's raining, it's cold, it's late.",
      },
      {
        visual: { kind: "compare", pt: "Tem muita gente aqui.", wrong: "Have a lot of people here.", en: "There are a lot of people here." },
        narration: "Outro clássico: o nosso 'tem' de existir. Em inglês, isso é there is ou there are, nunca have.",
      },
      {
        visual: { kind: "example", en: "It's important to practice every day.", pt: "É importante praticar todo dia.", highlight: "It's" },
        narration: "Sempre que você for começar com 'é...', pense: It's. It's important, it's easy, it's possible.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "usually", role: "other" }, { text: "have", role: "verb" }, { text: "lunch", role: "object" }, { text: "at noon", role: "time" }], caption: "Advérbios de frequência vêm antes do verbo principal" },
        narration: "Palavras como usually, always e never entram entre o sujeito e o verbo. I usually have lunch at noon.",
      },
      {
        visual: { kind: "example", en: "We watched the game at home last night.", pt: "A gente viu o jogo em casa ontem à noite.", highlight: "last night" },
        narration: "Repare que 'a gente' vira we, e o lugar vem antes do tempo: at home, last night. Agora diga em voz alta.",
      },
      {
        visual: { kind: "quiz", question: "Como se diz 'Faz frio hoje'?", options: ["Makes cold today.", "Is cold today.", "It's cold today."], answer: 2 },
        narration: "Sua vez: como se diz 'Faz frio hoje'? Cuidado com a tradução palavra por palavra!",
      },
    ],
  },
  {
    id: "video-fala-02",
    track: "fala",
    title: "Do e does sem medo",
    level: "A2",
    lessonId: "fala-02",
    slides: [
      {
        visual: { kind: "title", title: "Do e does", subtitle: "O ajudante das perguntas e negativas" },
        narration: "Hoje você vai fazer as pazes com o do e o does. Eles parecem estranhos, mas são só ajudantes.",
      },
      {
        visual: { kind: "bullets", title: "O que é o do", bullets: ["Um verbo auxiliar: não tem tradução", "Aparece em perguntas e negativas do presente", "do → I, you, we, they | does → he, she, it"] },
        narration: "O do não significa 'fazer' aqui. Ele só avisa: lá vem uma pergunta ou uma negativa.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "Do", role: "aux" }, { text: "you", role: "subject" }, { text: "work", role: "verb" }, { text: "here", role: "other" }, { text: "?", role: "other" }], caption: "Pergunta: Do/Does + sujeito + verbo" },
        narration: "A pergunta começa com o ajudante, depois vem o sujeito e o verbo. Do you work here?",
      },
      {
        visual: { kind: "example", en: "Does she speak English?", pt: "Ela fala inglês?", highlight: "Does" },
        narration: "Com she, he e it, o ajudante vira does. Repita comigo: Does she speak English?",
      },
      {
        visual: { kind: "compare", pt: "Ela fala inglês?", wrong: "Does she speaks English?", en: "Does she speak English?" },
        narration: "Repare: o -s já está no does, então o verbo volta à forma básica. Nada de speaks aqui.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "don't", role: "aux" }, { text: "like", role: "verb" }, { text: "spicy food", role: "object" }], caption: "Negativa: sujeito + don't/doesn't + verbo" },
        narration: "Na negativa, o ajudante fica entre o sujeito e o verbo: I don't like spicy food.",
      },
      {
        visual: { kind: "compare", pt: "Você não entende.", wrong: "You no understand.", en: "You don't understand." },
        narration: "O 'não' do português não vira no. Para negar um verbo, use don't ou doesn't.",
      },
      {
        visual: { kind: "example", en: "He doesn't drink coffee.", pt: "Ele não toma café.", highlight: "doesn't" },
        narration: "He doesn't drink, sem s no drink. Agora tente falar três coisas que você não faz: I don't...",
      },
      {
        visual: { kind: "quiz", question: "Complete: '___ your brother live in São Paulo?'", options: ["Do", "Does", "Is"], answer: 1 },
        narration: "Quiz rápido: qual ajudante completa a frase? Pense em quem é o sujeito.",
      },
    ],
  },
  {
    id: "video-fala-03",
    track: "fala",
    title: "Passado com did",
    level: "A2",
    lessonId: "fala-03",
    slides: [
      {
        visual: { kind: "title", title: "O passado com did", subtitle: "Perguntas e negativas sem complicação" },
        narration: "Vamos falar do passado? A boa notícia: para perguntar e negar, você só precisa de uma palavra, did.",
      },
      {
        visual: { kind: "bullets", title: "Como funciona", bullets: ["Afirmativa: verbo no passado → I worked, I went", "Pergunta: Did + sujeito + verbo base", "Negativa: didn't + verbo base"] },
        narration: "Na afirmativa, o verbo vai para o passado. Na pergunta e na negativa, quem carrega o passado é o did.",
      },
      {
        visual: { kind: "example", en: "I went to the beach last weekend.", pt: "Eu fui à praia no fim de semana passado.", highlight: "went" },
        narration: "Go é irregular: no passado vira went. Repita: I went to the beach last weekend.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "Did", role: "aux" }, { text: "you", role: "subject" }, { text: "see", role: "verb" }, { text: "the email", role: "object" }, { text: "yesterday", role: "time" }, { text: "?", role: "other" }], caption: "Did + sujeito + verbo base" },
        narration: "Olha a pergunta: Did, sujeito, verbo na forma básica. Did you see the email yesterday?",
      },
      {
        visual: { kind: "compare", pt: "Você viu o e-mail?", wrong: "Did you saw the email?", en: "Did you see the email?" },
        narration: "Esse é o erro mais comum: colocar o passado duas vezes. O did já é passado, então o verbo fica see.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "She", role: "subject" }, { text: "didn't", role: "aux" }, { text: "come", role: "verb" }, { text: "to the meeting", role: "other" }], caption: "Negativa: didn't + verbo base" },
        narration: "Na negativa é igual: didn't e o verbo base. She didn't come to the meeting.",
      },
      {
        visual: { kind: "compare", pt: "Eu não fui.", wrong: "I didn't went.", en: "I didn't go." },
        narration: "Nada de didn't went. Agora diga em voz alta: I didn't go.",
      },
      {
        visual: { kind: "example", en: "What did you do on Saturday?", pt: "O que você fez no sábado?", highlight: "did" },
        narration: "Com palavras de pergunta, o did vem logo depois: What did you do? Where did you go? Treine com o seu fim de semana.",
      },
      {
        visual: { kind: "quiz", question: "Qual frase está correta?", options: ["Did he call you?", "Did he called you?", "He did called you?"], answer: 0 },
        narration: "Agora tente: qual dessas perguntas está certa? Lembre que o passado aparece uma vez só.",
      },
    ],
  },
  {
    id: "video-fala-05",
    track: "fala",
    title: "'Faz tempo que…' com present perfect",
    level: "B1",
    lessonId: "fala-05",
    slides: [
      {
        visual: { kind: "title", title: "'Faz tempo que…' em inglês", subtitle: "Present perfect com for e since" },
        narration: "Como se diz 'eu moro aqui faz cinco anos'? Se você pensou em I live here for five years, essa aula é para você.",
      },
      {
        visual: { kind: "compare", pt: "Eu moro aqui faz cinco anos.", wrong: "I live here for five years.", en: "I've lived here for five years." },
        narration: "Em português usamos o presente. Em inglês, para algo que começou no passado e continua, usamos o present perfect.",
      },
      {
        visual: { kind: "bullets", title: "Por que present perfect?", bullets: ["A ação começou no passado…", "…e continua até agora", "Português usa presente; inglês usa have + particípio"] },
        narration: "Pense numa linha que sai do passado e chega até hoje. É exatamente isso que o present perfect desenha.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "have", role: "aux" }, { text: "worked", role: "verb" }, { text: "here", role: "other" }, { text: "for three years", role: "time" }], caption: "Sujeito + have/has + particípio + for/since" },
        narration: "A fórmula: sujeito, have ou has, o particípio do verbo e, no final, o tempo. I have worked here for three years.",
      },
      {
        visual: { kind: "bullets", title: "For × since", bullets: ["for + duração: for two years, for a week", "since + ponto de início: since 2020, since Monday"] },
        narration: "For é para quanto tempo; since é para desde quando. Repare: for two years, mas since 2020.",
      },
      {
        visual: { kind: "example", en: "She's been here since 2019.", pt: "Ela está aqui desde 2019.", highlight: "since" },
        narration: "She's aqui é she has. She's been here since 2019. Fale em voz alta, bem ligadinho.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "'ve been", role: "aux" }, { text: "studying", role: "verb" }, { text: "English", role: "object" }, { text: "for six months", role: "time" }], caption: "Ação em andamento: have been + -ing" },
        narration: "Quando a ação está acontecendo agora, use have been com -ing. I've been studying English for six months.",
      },
      {
        visual: { kind: "example", en: "How long have you worked here?", pt: "Há quanto tempo você trabalha aqui?", highlight: "How long" },
        narration: "Para perguntar, comece com How long. How long have you worked here? Essa pergunta aparece muito em conversa de trabalho.",
      },
      {
        visual: { kind: "compare", pt: "Faz tempo que eu não te vejo!", wrong: "Makes time I don't see you!", en: "I haven't seen you in ages!" },
        narration: "E o nosso 'faz tempo que não te vejo'? Fica I haven't seen you in ages. Nada de makes time!",
      },
      {
        visual: { kind: "quiz", question: "Como se diz 'Eu conheço ela faz dez anos'?", options: ["I know her for ten years.", "I've known her for ten years.", "I know her since ten years."], answer: 1 },
        narration: "Agora tente: como fica 'Eu conheço ela faz dez anos'? Lembre da linha do passado até hoje.",
      },
    ],
  },

  /* ------------------------------------------------------------ *
   * TECH
   * ------------------------------------------------------------ */
  {
    id: "video-tech-01",
    track: "tech",
    title: "Daily standup em inglês",
    level: "B1",
    lessonId: "tech-01",
    slides: [
      {
        visual: { kind: "title", title: "Daily standup em inglês", subtitle: "Ontem, hoje e bloqueios" },
        narration: "A daily é o lugar perfeito para praticar inglês todo dia. Hoje você vai sair com um roteiro pronto.",
      },
      {
        visual: { kind: "bullets", title: "A estrutura", bullets: ["Yesterday I… (passado)", "Today I'm going to… / I'll… (futuro)", "Blockers: I'm blocked on… / No blockers"] },
        narration: "São três partes: o que você fez ontem, o que vai fazer hoje e se tem algum bloqueio. Repare que cada parte tem um tempo verbal.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "Yesterday", role: "time" }, { text: "I", role: "subject" }, { text: "finished", role: "verb" }, { text: "the API tests", role: "object" }], caption: "Na daily, o tempo pode abrir a frase" },
        narration: "Aqui o tempo vem na frente para organizar a fala: Yesterday, I finished the API tests. Verbo no passado.",
      },
      {
        visual: { kind: "example", en: "Today I'm going to work on the data migration.", pt: "Hoje eu vou trabalhar na migração de dados.", highlight: "I'm going to" },
        narration: "Para o plano do dia, use I'm going to. Repita comigo: Today I'm going to work on the data migration.",
      },
      {
        visual: { kind: "compare", pt: "Estou travado no deploy.", wrong: "I'm locked in the deploy.", en: "I'm blocked on the deploy." },
        narration: "Travado, no contexto de trabalho, é blocked, e a preposição é on. Locked é trancado, tipo uma porta.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I'm", role: "subject" }, { text: "blocked on", role: "verb" }, { text: "the release", role: "object" }, { text: "because", role: "other" }, { text: "I need access to staging", role: "other" }], caption: "Bloqueio + motivo, sempre" },
        narration: "Nunca diga só que está bloqueado: diga também o porquê. Assim alguém já pode te ajudar na hora.",
      },
      {
        visual: { kind: "bullets", title: "Frases úteis", bullets: ["I'm still working on…", "It's taking longer than expected.", "Can we take this offline?", "I need help from…"] },
        narration: "Guarde essas frases. Take this offline quer dizer conversar depois, fora da daily, para não travar a reunião.",
      },
      {
        visual: { kind: "example", en: "It's taking longer than expected, but I should finish today.", pt: "Está demorando mais do que o esperado, mas devo terminar hoje.", highlight: "longer than expected" },
        narration: "Essa frase salva quando uma tarefa atrasou. Agora tente montar a sua daily de hoje em voz alta.",
      },
      {
        visual: { kind: "quiz", question: "Qual é a melhor forma de dizer que você não tem bloqueios?", options: ["Nothing blocks me never.", "I don't have locks.", "No blockers on my side."], answer: 2 },
        narration: "Para fechar: qual é o jeito mais natural de dizer que está tudo livre?",
      },
    ],
  },
  {
    id: "video-tech-06",
    track: "tech",
    title: "Método STAR em entrevistas",
    level: "B1",
    lessonId: "tech-06",
    slides: [
      {
        visual: { kind: "title", title: "Método STAR", subtitle: "Respondendo perguntas comportamentais em entrevistas" },
        narration: "Em entrevista em inglês, vão pedir histórias sobre o seu trabalho. Hoje você aprende a contar essas histórias com o método STAR.",
      },
      {
        visual: { kind: "bullets", title: "O que é STAR", bullets: ["Situation: o contexto", "Task: sua responsabilidade", "Action: o que VOCÊ fez", "Result: o resultado, com números"] },
        narration: "São quatro passos: situação, tarefa, ação e resultado. Repare que a ação é a parte mais longa da resposta.",
      },
      {
        visual: { kind: "example", en: "Tell me about a time you solved a difficult problem.", pt: "Me conte sobre uma vez em que você resolveu um problema difícil.", highlight: "Tell me about a time" },
        narration: "Quando ouvir Tell me about a time, é sinal: hora de usar STAR. E a resposta vai toda no passado.",
      },
      {
        visual: { kind: "example", en: "Our nightly pipeline was failing twice a week.", pt: "Nosso pipeline noturno estava falhando duas vezes por semana.", highlight: "was failing" },
        narration: "Na situação, descreva o problema em uma ou duas frases. Was failing mostra algo que vinha acontecendo.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "was", role: "verb" }, { text: "responsible for", role: "other" }, { text: "the data pipeline", role: "object" }], caption: "Task: I was responsible for…" },
        narration: "Na tarefa, deixe claro qual era o seu papel. I was responsible for... é uma abertura perfeita.",
      },
      {
        visual: { kind: "compare", pt: "A gente fez um alerta novo.", wrong: "We did a new alert.", en: "I built a new alert." },
        narration: "Dois cuidados aqui: fale I, não só we, porque querem saber o que você fez. E para criar algo, use build ou create, não do.",
      },
      {
        visual: { kind: "formula", parts: [{ text: "I", role: "subject" }, { text: "added", role: "verb" }, { text: "data quality checks", role: "object" }, { text: "last quarter", role: "time" }], caption: "Action: verbos fortes no passado" },
        narration: "Na ação, use verbos fortes no passado: added, built, automated, reduced. Sujeito, verbo, o quê e quando.",
      },
      {
        visual: { kind: "example", en: "As a result, failures dropped by 80%.", pt: "Como resultado, as falhas caíram 80%.", highlight: "As a result" },
        narration: "E feche com o resultado, de preferência com um número. As a result é a ponte perfeita. Agora tente contar uma história sua.",
      },
      {
        visual: { kind: "quiz", question: "No método STAR, qual parte mostra o que VOCÊ fez?", options: ["Situation", "Task", "Action", "Result"], answer: 2 },
        narration: "Última pergunta: em qual parte do STAR você mostra as suas próprias atitudes?",
      },
    ],
  },
];
