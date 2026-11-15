/**
 * Bancos dos treinos curtos de fala: Transforme, Faça a pergunta e Resposta rápida.
 * Conteúdo original, com vocabulário de trabalho em tecnologia/dados e do dia a dia.
 * Em `answers`, a primeira forma é a canônica (a que o app mostra e fala); as outras
 * são variações corretas aceitas (com e sem contração, sinônimos comuns).
 */
import type { AskItem, QuickItem, TransformItem } from '../domain/drills/types';

type Kind = TransformItem['kind'];
const t = (id: string, kind: Kind, base: string, pt: string, answers: string[]): TransformItem => ({ id, kind, base, pt, answers });
const a = (id: string, statement: string, focus: string, pt: string, answers: string[]): AskItem => ({ id, statement, focus, pt, answers });
const q = (id: string, en: string, pt: string, starter: string): QuickItem => ({ id, en, pt, starter });

/** Variações de "ele/ela" para o treino de terceira pessoa. */
const sheHe = (rest: string, alt: string[] = []): string[] => [`She ${rest}`, `He ${rest}`, ...alt];

export const TRANSFORMS: TransformItem[] = [
  /* ---------- negativa ---------- */
  t('t01', 'negative', 'I work on weekends.', 'Eu trabalho nos fins de semana.', ["I don't work on weekends.", 'I do not work on weekends.']),
  t('t02', 'negative', 'She likes long meetings.', 'Ela gosta de reuniões longas.', ["She doesn't like long meetings.", 'She does not like long meetings.']),
  t('t03', 'negative', 'We have a deadline this week.', 'Nós temos um prazo esta semana.', ["We don't have a deadline this week.", 'We do not have a deadline this week.']),
  t('t04', 'negative', 'The dashboard is ready.', 'O painel está pronto.', ["The dashboard isn't ready.", 'The dashboard is not ready.', "The dashboard's not ready."]),
  t('t05', 'negative', 'I am in a meeting.', 'Eu estou em uma reunião.', ["I'm not in a meeting.", 'I am not in a meeting.']),
  t('t06', 'negative', 'They use the old system.', 'Eles usam o sistema antigo.', ["They don't use the old system.", 'They do not use the old system.']),
  t('t07', 'negative', 'He can join the call.', 'Ele consegue entrar na chamada.', ["He can't join the call.", 'He cannot join the call.']),
  t('t08', 'negative', 'The data looks right.', 'Os dados parecem certos.', ["The data doesn't look right.", 'The data does not look right.']),

  /* ---------- pergunta ---------- */
  t('t09', 'question', 'You work with data.', 'Você trabalha com dados.', ['Do you work with data?']),
  t('t10', 'question', 'She works from home.', 'Ela trabalha de casa.', ['Does she work from home?']),
  t('t11', 'question', 'They are on the same team.', 'Eles estão no mesmo time.', ['Are they on the same team?', 'Are they in the same team?']),
  t('t12', 'question', 'The report is ready.', 'O relatório está pronto.', ['Is the report ready?']),
  t('t13', 'question', 'He can share his screen.', 'Ele consegue compartilhar a tela.', ['Can he share his screen?']),
  t('t14', 'question', 'You have a minute.', 'Você tem um minuto.', ['Do you have a minute?', 'Have you got a minute?']),
  t('t15', 'question', 'The client wants a new chart.', 'O cliente quer um gráfico novo.', ['Does the client want a new chart?']),
  t('t16', 'question', 'We need more time.', 'Nós precisamos de mais tempo.', ['Do we need more time?']),

  /* ---------- passado ---------- */
  t('t17', 'past', 'I send the report on Friday.', 'Eu envio o relatório na sexta.', ['I sent the report on Friday.']),
  t('t18', 'past', 'We have a problem with the server.', 'Nós temos um problema com o servidor.', ['We had a problem with the server.']),
  t('t19', 'past', 'She is late for the meeting.', 'Ela está atrasada para a reunião.', ['She was late for the meeting.']),
  t('t20', 'past', 'I go to the office by subway.', 'Eu vou para o escritório de metrô.', ['I went to the office by subway.']),
  t('t21', 'past', 'They fix the bug quickly.', 'Eles corrigem o erro rápido.', ['They fixed the bug quickly.']),
  t('t22', 'past', 'He takes a break at three.', 'Ele faz uma pausa às três.', ['He took a break at three.']),
  t('t23', 'past', 'The numbers are wrong.', 'Os números estão errados.', ['The numbers were wrong.']),
  t('t24', 'past', 'I write the queries myself.', 'Eu mesmo escrevo as consultas.', ['I wrote the queries myself.']),

  /* ---------- terceira pessoa ---------- */
  t('t25', 'third', 'I work with data.', 'Eu trabalho com dados.', sheHe('works with data.')),
  t('t26', 'third', 'I have two meetings today.', 'Eu tenho duas reuniões hoje.', sheHe('has two meetings today.')),
  t('t27', 'third', 'I study English every day.', 'Eu estudo inglês todos os dias.', sheHe('studies English every day.')),
  t('t28', 'third', 'I go to the gym after work.', 'Eu vou para a academia depois do trabalho.', sheHe('goes to the gym after work.')),
  t('t29', 'third', 'I am a data analyst.', 'Eu sou analista de dados.', sheHe('is a data analyst.', ["She's a data analyst.", "He's a data analyst."])),
  t('t30', 'third', 'I watch the numbers every morning.', 'Eu acompanho os números toda manhã.', sheHe('watches the numbers every morning.')),
  t('t31', 'third', 'I do the weekly report.', 'Eu faço o relatório semanal.', sheHe('does the weekly report.')),
  t('t32', 'third', 'I live near the office.', 'Eu moro perto do escritório.', sheHe('lives near the office.')),

  /* ---------- futuro (going to) ---------- */
  t('t33', 'future', 'I call the client.', 'Eu ligo para o cliente.', ["I'm going to call the client.", 'I am going to call the client.', "I'm gonna call the client.", "I'll call the client.", 'I will call the client.']),
  t('t34', 'future', 'We launch the new version.', 'Nós lançamos a versão nova.', ["We're going to launch the new version.", 'We are going to launch the new version.', "We're gonna launch the new version.", "We'll launch the new version.", 'We will launch the new version.']),
  t('t35', 'future', 'She presents the results.', 'Ela apresenta os resultados.', ["She's going to present the results.", 'She is going to present the results.', "She's gonna present the results.", "She'll present the results.", 'She will present the results.']),
  t('t36', 'future', 'They hire two analysts.', 'Eles contratam dois analistas.', ["They're going to hire two analysts.", 'They are going to hire two analysts.', "They're gonna hire two analysts.", "They'll hire two analysts.", 'They will hire two analysts.']),
  t('t37', 'future', 'I work from home.', 'Eu trabalho de casa.', ["I'm going to work from home.", 'I am going to work from home.', "I'm gonna work from home.", "I'll work from home.", 'I will work from home.']),
  t('t38', 'future', 'He updates the dashboard.', 'Ele atualiza o painel.', ["He's going to update the dashboard.", 'He is going to update the dashboard.', "He's gonna update the dashboard.", "He'll update the dashboard.", 'He will update the dashboard.']),
  t('t39', 'future', 'It takes a long time.', 'Isso leva muito tempo.', ["It's going to take a long time.", 'It is going to take a long time.', "It's gonna take a long time.", "It'll take a long time.", 'It will take a long time.']),
  t('t40', 'future', 'We have dinner with the team.', 'Nós jantamos com o time.', ["We're going to have dinner with the team.", 'We are going to have dinner with the team.', "We're gonna have dinner with the team.", "We'll have dinner with the team.", 'We will have dinner with the team.']),

  /* ---------- present perfect (há / desde) ---------- */
  t('t41', 'perfect', 'I work here.', 'Eu trabalho aqui. (há dois anos)', ['I have worked here for two years.', "I've worked here for two years.", 'I have been working here for two years.', "I've been working here for two years."]),
  t('t42', 'perfect', 'I live in this apartment.', 'Eu moro neste apartamento. (desde março)', ['I have lived in this apartment since March.', "I've lived in this apartment since March.", 'I have been living in this apartment since March.', "I've been living in this apartment since March."]),
  t('t43', 'perfect', 'She works with data.', 'Ela trabalha com dados. (há cinco anos)', ['She has worked with data for five years.', "She's worked with data for five years.", 'She has been working with data for five years.', "She's been working with data for five years."]),
  t('t44', 'perfect', 'We use this tool.', 'Nós usamos esta ferramenta. (desde janeiro)', ['We have used this tool since January.', "We've used this tool since January.", 'We have been using this tool since January.', "We've been using this tool since January."]),
  t('t45', 'perfect', 'I know him.', 'Eu conheço ele. (há dez anos)', ['I have known him for ten years.', "I've known him for ten years."]),
  t('t46', 'perfect', 'He is the team lead.', 'Ele é o líder do time. (desde o ano passado)', ['He has been the team lead since last year.', "He's been the team lead since last year."]),
  t('t47', 'perfect', 'I study English.', 'Eu estudo inglês. (há seis meses)', ['I have studied English for six months.', "I've studied English for six months.", 'I have been studying English for six months.', "I've been studying English for six months."]),
  t('t48', 'perfect', 'I have this laptop.', 'Eu tenho este notebook. (há três anos)', ['I have had this laptop for three years.', "I've had this laptop for three years."]),
];

export const ASKS: AskItem[] = [
  /* ---------- where ---------- */
  a('a01', 'I work in São Paulo.', 'in São Paulo', 'Pergunte ONDE', ['Where do you work?']),
  a('a02', 'She lives near the office.', 'near the office', 'Pergunte ONDE', ['Where does she live?']),
  a('a03', 'The meeting was in room four.', 'in room four', 'Pergunte ONDE', ['Where was the meeting?']),

  /* ---------- when ---------- */
  a('a04', 'I started this job in 2021.', 'in 2021', 'Pergunte QUANDO', ['When did you start this job?', 'When did you start?']),
  a('a05', 'The deadline is next Friday.', 'next Friday', 'Pergunte QUANDO', ['When is the deadline?', "When's the deadline?"]),

  /* ---------- what time ---------- */
  a('a06', 'The meeting starts at nine.', 'at nine', 'Pergunte A QUE HORAS', ['What time does the meeting start?', 'At what time does the meeting start?', 'When does the meeting start?']),
  a('a07', 'I usually wake up at six thirty.', 'at six thirty', 'Pergunte A QUE HORAS', ['What time do you usually wake up?', 'What time do you wake up?', 'When do you usually wake up?', 'When do you wake up?']),

  /* ---------- what ---------- */
  a('a08', "I'm working on the sales report.", 'the sales report', 'Pergunte O QUÊ', ['What are you working on?']),
  a('a09', 'She said the numbers were wrong.', 'the numbers were wrong', 'Pergunte O QUE ela disse', ['What did she say?']),
  a('a10', "I'm a data analyst.", 'a data analyst', 'Pergunte O QUE a pessoa faz (profissão)', ['What do you do?', 'What do you do for a living?', 'What do you do for work?', 'What is your job?', "What's your job?"]),

  /* ---------- who ---------- */
  a('a11', 'Ana leads the project.', 'Ana', 'Pergunte QUEM', ['Who leads the project?', 'Who is leading the project?', "Who's leading the project?"]),
  a('a12', 'I talked to the manager.', 'the manager', 'Pergunte COM QUEM', ['Who did you talk to?', 'Who did you talk with?', 'Who did you speak to?', 'Who did you speak with?', 'Whom did you talk to?']),

  /* ---------- why ---------- */
  a('a13', 'I was late because the train stopped.', 'because the train stopped', 'Pergunte POR QUÊ', ['Why were you late?']),
  a('a14', 'We changed the tool because it was slow.', 'because it was slow', 'Pergunte POR QUÊ', ['Why did you change the tool?', 'Why did you change tools?']),

  /* ---------- how ---------- */
  a('a15', 'I come to work by subway.', 'by subway', 'Pergunte COMO', ['How do you get to work?', 'How do you come to work?', 'How do you go to work?']),
  a('a16', 'The presentation went well.', 'well', 'Pergunte COMO FOI', ['How did the presentation go?', 'How was the presentation?']),

  /* ---------- how long ---------- */
  a('a17', 'I have worked here for three years.', 'for three years', 'Pergunte HÁ QUANTO TEMPO', ['How long have you worked here?', 'How long have you been working here?']),
  a('a18', 'The call takes thirty minutes.', 'thirty minutes', 'Pergunte QUANTO TEMPO', ['How long does the call take?', 'How long is the call?']),

  /* ---------- how many ---------- */
  a('a19', 'There are eight people on my team.', 'eight', 'Pergunte QUANTAS pessoas', ['How many people are on your team?', 'How many people are there on your team?', 'How many people are in your team?', 'How many people are there in your team?', 'How many people do you have on your team?']),
  a('a20', 'I have two meetings today.', 'two', 'Pergunte QUANTAS reuniões', ['How many meetings do you have today?']),

  /* ---------- how much ---------- */
  a('a21', 'The license costs fifty dollars a month.', 'fifty dollars', 'Pergunte QUANTO CUSTA', ['How much does the license cost?', 'How much is the license?', 'How much does the license cost a month?', 'How much does the license cost per month?']),
  a('a22', 'I drink a lot of coffee.', 'a lot of', 'Pergunte QUANTO café', ['How much coffee do you drink?']),

  /* ---------- how often ---------- */
  a('a23', 'We meet twice a week.', 'twice a week', 'Pergunte COM QUE FREQUÊNCIA', ['How often do you meet?']),
  a('a24', 'She travels once a month.', 'once a month', 'Pergunte COM QUE FREQUÊNCIA', ['How often does she travel?']),

  /* ---------- which ---------- */
  a('a25', 'I prefer the blue chart.', 'the blue', 'Pergunte QUAL gráfico', ['Which chart do you prefer?', 'Which one do you prefer?', 'What chart do you prefer?']),
  a('a26', 'We chose the second option.', 'the second', 'Pergunte QUAL opção', ['Which option did you choose?', 'Which one did you choose?', 'What option did you choose?']),

  /* ---------- sim ou não ---------- */
  a('a27', 'Yes, I work with data.', 'Yes', 'Faça a pergunta de sim ou não (do)', ['Do you work with data?']),
  a('a28', "No, I don't speak Spanish.", 'No', 'Faça a pergunta de sim ou não (do)', ['Do you speak Spanish?']),
  a('a29', 'Yes, she works on Fridays.', 'Yes', 'Faça a pergunta de sim ou não (does)', ['Does she work on Fridays?']),
  a('a30', "No, he doesn't have the password.", 'No', 'Faça a pergunta de sim ou não (does)', ['Does he have the password?']),
  a('a31', 'Yes, I sent the email.', 'Yes', 'Faça a pergunta de sim ou não (did)', ['Did you send the email?']),
  a('a32', "No, they didn't finish the test.", 'No', 'Faça a pergunta de sim ou não (did)', ['Did they finish the test?']),
  a('a33', "Yes, I'm ready.", 'Yes', 'Faça a pergunta de sim ou não (are)', ['Are you ready?']),
  a('a34', "No, the server isn't down.", 'No', 'Faça a pergunta de sim ou não (is)', ['Is the server down?']),
  a('a35', 'Yes, I have finished the report.', 'Yes', 'Faça a pergunta de sim ou não (have)', ['Have you finished the report?', 'Did you finish the report?']),
  a('a36', 'Yes, I can help you.', 'Yes', 'Faça a pergunta de sim ou não (can)', ['Can you help me?']),
];

export const QUICKS: QuickItem[] = [
  q('q01', 'What do you do?', 'O que você faz? (profissão)', "I'm a…"),
  q('q02', 'Where do you work?', 'Onde você trabalha?', 'I work at…'),
  q('q03', 'How long have you worked there?', 'Há quanto tempo você trabalha lá?', "I've worked there for…"),
  q('q04', 'What are you working on this week?', 'No que você está trabalhando esta semana?', "This week I'm working on…"),
  q('q05', 'How was your weekend?', 'Como foi o seu fim de semana?', 'It was good. I…'),
  q('q06', 'What did you do yesterday?', 'O que você fez ontem?', 'Yesterday I…'),
  q('q07', 'What time do you usually start work?', 'A que horas você costuma começar a trabalhar?', 'I usually start at…'),
  q('q08', 'Do you work from home?', 'Você trabalha de casa?', 'Yes, I work from home on…'),
  q('q09', 'What tools do you use every day?', 'Que ferramentas você usa todo dia?', 'Every day I use…'),
  q('q10', 'Who do you work with?', 'Com quem você trabalha?', 'I work with…'),
  q('q11', "What's the hardest part of your job?", 'Qual é a parte mais difícil do seu trabalho?', 'The hardest part is…'),
  q('q12', 'What do you like about your job?', 'Do que você gosta no seu trabalho?', 'I like it because…'),
  q('q13', 'How many meetings do you have today?', 'Quantas reuniões você tem hoje?', 'Today I have…'),
  q('q14', 'Can you explain what your team does?', 'Você pode explicar o que o seu time faz?', 'My team is responsible for…'),
  q('q15', 'What are you going to do after work?', 'O que você vai fazer depois do trabalho?', "After work I'm going to…"),
  q('q16', 'Where do you live?', 'Onde você mora?', 'I live in…'),
  q('q17', 'How do you get to work?', 'Como você vai para o trabalho?', 'I usually take…'),
  q('q18', 'What do you usually have for lunch?', 'O que você costuma almoçar?', 'I usually have…'),
  q('q19', 'Do you have any plans for the weekend?', 'Você tem planos para o fim de semana?', "Yes, I'm going to…"),
  q('q20', 'Why are you learning English?', 'Por que você está aprendendo inglês?', "I'm learning English because…"),
  q('q21', 'How often do you practice English?', 'Com que frequência você pratica inglês?', 'I practice…'),
  q('q22', 'What did you have for breakfast?', 'O que você comeu no café da manhã?', 'I had…'),
  q('q23', 'Did you finish the report?', 'Você terminou o relatório?', 'Not yet. I still need to…'),
  q('q24', 'When is the next release?', 'Quando é o próximo lançamento?', 'The next release is…'),
  q('q25', "What's the problem with the data?", 'Qual é o problema com os dados?', 'The problem is that…'),
  q('q26', 'Could you send me the file?', 'Você poderia me mandar o arquivo?', "Sure, I'll send it…"),
  q('q27', 'Have you ever worked abroad?', 'Você já trabalhou fora do país?', "No, I've never worked abroad, but…"),
  q('q28', 'What do you do in your free time?', 'O que você faz no seu tempo livre?', 'In my free time I…'),
  q('q29', 'How is the project going?', 'Como está indo o projeto?', "It's going well. We…"),
  q('q30', 'What do you think about the new tool?', 'O que você acha da ferramenta nova?', "I think it's…"),
  q('q31', 'Are you free tomorrow morning?', 'Você está livre amanhã de manhã?', "Yes, I'm free until…"),
  q('q32', 'What was your first job?', 'Qual foi o seu primeiro emprego?', 'My first job was…'),
  q('q33', 'What are your goals for this year?', 'Quais são as suas metas para este ano?', 'This year I want to…'),
  q('q34', 'How do you feel today?', 'Como você está se sentindo hoje?', 'I feel… because…'),
  q('q35', 'What kind of music do you like?', 'Que tipo de música você gosta?', 'I like…'),
  q('q36', 'Where did you go on your last vacation?', 'Aonde você foi nas últimas férias?', 'I went to…'),
  q('q37', 'What would you like to drink?', 'O que você gostaria de beber?', "I'd like…"),
  q('q38', 'Do you have any questions?', 'Você tem alguma pergunta?', 'Yes, I have a question about…'),
  q('q39', 'What did you learn this week?', 'O que você aprendeu esta semana?', 'This week I learned…'),
  q('q40', 'When can you finish this?', 'Quando você consegue terminar isso?', 'I can finish it by…'),
];
