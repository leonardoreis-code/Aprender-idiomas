/** Roteiros do treinador ao vivo e textos do "Reconto". Conteúdo original. */

export interface Scenario {
  id: string;
  title: string;
  desc: string;
  /** Descrição em inglês passada ao Claude quando disponível. */
  brief: string;
  questions: { en: string; pt: string }[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'daily', title: 'Daily standup', desc: 'Ontem, hoje e bloqueios, como na sua reunião.',
    brief: 'a daily standup of a data/tech team; you are the engineering manager asking about yesterday, today and blockers',
    questions: [
      { en: 'What did you work on yesterday?', pt: 'No que você trabalhou ontem?' },
      { en: 'What are you going to do today?', pt: 'O que você vai fazer hoje?' },
      { en: 'Is anything blocking you?', pt: 'Tem algo te bloqueando?' },
      { en: 'Who do you need help from?', pt: 'De quem você precisa de ajuda?' },
      { en: 'When do you think it will be done?', pt: 'Quando você acha que fica pronto?' },
      { en: 'Is there anything else the team should know?', pt: 'Mais alguma coisa que o time precise saber?' },
    ],
  },
  {
    id: 'interview', title: 'Entrevista de emprego', desc: 'Perguntas clássicas de vaga em tecnologia e dados.',
    brief: 'a job interview for a data/tech role; you are a friendly but realistic interviewer',
    questions: [
      { en: 'Tell me about yourself.', pt: 'Fale sobre você.' },
      { en: 'What does your current team do?', pt: 'O que seu time atual faz?' },
      { en: 'Tell me about a project you are proud of.', pt: 'Fale de um projeto do qual você se orgulha.' },
      { en: 'What was the hardest problem you solved?', pt: 'Qual foi o problema mais difícil que você resolveu?' },
      { en: 'How do you handle tight deadlines?', pt: 'Como você lida com prazos apertados?' },
      { en: 'Why do you want this job?', pt: 'Por que você quer esta vaga?' },
      { en: 'Do you have any questions for me?', pt: 'Você tem alguma pergunta para mim?' },
    ],
  },
  {
    id: 'project', title: 'Explique um projeto', desc: 'Do problema ao resultado, passo a passo.',
    brief: 'the learner explains a work project to a curious colleague from another team',
    questions: [
      { en: 'What is the project about?', pt: 'Sobre o que é o projeto?' },
      { en: 'Who uses it, and what for?', pt: 'Quem usa, e para quê?' },
      { en: 'How does it work, step by step?', pt: 'Como funciona, passo a passo?' },
      { en: 'What was your part in it?', pt: 'Qual foi a sua parte?' },
      { en: 'What went wrong, and how did you fix it?', pt: 'O que deu errado e como você consertou?' },
      { en: 'What would you do differently next time?', pt: 'O que você faria diferente da próxima vez?' },
    ],
  },
  {
    id: 'smalltalk', title: 'Conversa do dia a dia', desc: 'Fim de semana, rotina, planos.',
    brief: 'casual small talk between colleagues before a meeting starts',
    questions: [
      { en: 'How was your weekend?', pt: 'Como foi seu fim de semana?' },
      { en: 'What do you do in your free time?', pt: 'O que você faz no tempo livre?' },
      { en: 'How long have you lived in your city?', pt: 'Há quanto tempo você mora na sua cidade?' },
      { en: 'What are your plans for your next vacation?', pt: 'Quais seus planos para as próximas férias?' },
      { en: 'What series or book do you recommend, and why?', pt: 'Que série ou livro você recomenda, e por quê?' },
      { en: 'What did you have for lunch today?', pt: 'O que você almoçou hoje?' },
    ],
  },
];

/** Perguntas de transformação usadas quando o treinador vem de uma aula (prática do padrão). */
export const PATTERN_FOLLOWUPS: { en: string; pt: string }[] = [
  { en: 'Can you give me another example from your own life?', pt: 'Dê outro exemplo da sua vida.' },
  { en: 'Now say the same idea about a colleague: he or she.', pt: 'Agora diga a mesma ideia sobre um colega: ele ou ela.' },
  { en: 'Now say it in the negative.', pt: 'Agora diga na negativa.' },
  { en: 'Now turn it into a question for me.', pt: 'Agora transforme numa pergunta para mim.' },
  { en: 'Last one: say it about something that happened last week.', pt: 'Última: diga sobre algo que aconteceu semana passada.' },
];

export interface RetellStory {
  id: string;
  title: string;
  level: 'A2' | 'B1' | 'B2';
  text: string;
  /** Ideias que o reconto precisa conter; cada grupo aceita qualquer uma das palavras. */
  ideas: { label: string; keys: string[][] }[];
}

export const STORIES: RetellStory[] = [
  {
    id: 'r1', title: 'O ônibus perdido', level: 'A2',
    text: 'Yesterday morning, Ana woke up late because her phone was dead. She ran to the bus stop, but she missed the bus by one minute. She called her manager and explained the problem. He told her not to worry. She took a taxi and arrived twenty minutes late, just before the meeting started.',
    ideas: [
      { label: 'Ela acordou tarde', keys: [['woke', 'wake', 'got up'], ['late']] },
      { label: 'O celular estava sem bateria', keys: [['phone', 'cellphone', 'alarm'], ['dead', 'battery', 'off', "didn't", 'not']] },
      { label: 'Perdeu o ônibus', keys: [['missed', 'miss', 'lost'], ['bus']] },
      { label: 'Ligou para o gerente', keys: [['called', 'call', 'phoned', 'talked'], ['manager', 'boss']] },
      { label: 'Pegou um táxi', keys: [['took', 'take', 'got', 'taxi'], ['taxi', 'cab']] },
      { label: 'Chegou atrasada, antes da reunião', keys: [['arrived', 'arrive', 'got'], ['late', 'meeting', 'minutes']] },
    ],
  },
  {
    id: 'r2', title: 'O bug de sexta-feira', level: 'B1',
    text: 'Last Friday, Marcos deployed a small change to the orders pipeline. Ten minutes later, the dashboard showed zero sales. He checked the logs and found that a column name had changed in the source table. He rolled back the deploy, fixed the query, and added a test so it would not happen again. On Monday, he explained the incident to the team.',
    ideas: [
      { label: 'Fez um deploy na sexta', keys: [['deployed', 'deploy', 'released', 'changed', 'change'], ['friday', 'pipeline', 'change']] },
      { label: 'O dashboard mostrou zero vendas', keys: [['dashboard', 'report'], ['zero', 'no', 'nothing', 'sales']] },
      { label: 'Olhou os logs', keys: [['checked', 'check', 'looked', 'saw', 'read'], ['logs', 'log']] },
      { label: 'Um nome de coluna tinha mudado', keys: [['column', 'name', 'field'], ['changed', 'change', 'different', 'new']] },
      { label: 'Reverteu e corrigiu a query', keys: [['rolled', 'rollback', 'reverted', 'revert', 'undid', 'fixed', 'fix', 'corrected']] },
      { label: 'Adicionou um teste', keys: [['added', 'add', 'created', 'wrote'], ['test', 'tests']] },
      { label: 'Explicou ao time na segunda', keys: [['explained', 'explain', 'told', 'presented'], ['team', 'monday']] },
    ],
  },
  {
    id: 'r3', title: 'A entrevista por vídeo', level: 'B1',
    text: 'Julia had a video interview for a job in Canada. She was nervous, so she practiced her answers the night before. During the call, the interviewer asked about a difficult project. Julia described the situation, what she did, and the result. At the end, she asked two questions about the team. A week later, she received an offer.',
    ideas: [
      { label: 'Entrevista por vídeo para vaga no Canadá', keys: [['interview'], ['canada', 'video', 'job', 'call']] },
      { label: 'Estava nervosa e treinou antes', keys: [['nervous', 'anxious', 'worried'], ['practiced', 'practice', 'prepared', 'trained', 'rehearsed']] },
      { label: 'Perguntaram sobre um projeto difícil', keys: [['asked', 'ask', 'question'], ['project', 'difficult', 'hard']] },
      { label: 'Ela descreveu situação, ação e resultado', keys: [['described', 'describe', 'explained', 'told', 'talked'], ['situation', 'result', 'did']] },
      { label: 'Fez duas perguntas sobre o time', keys: [['asked', 'questions', 'question'], ['two', 'team']] },
      { label: 'Recebeu uma oferta', keys: [['received', 'got', 'receive', 'offered'], ['offer', 'job']] },
    ],
  },
  {
    id: 'r4', title: 'O café da reunião', level: 'A2',
    text: 'Every Monday, Pedro has a meeting with his American clients at nine. Last Monday, he made coffee and sat down in front of his laptop. When the meeting started, he tried to say hello, but nobody could hear him. He was on mute. Everyone laughed, and after that he felt more relaxed.',
    ideas: [
      { label: 'Reunião toda segunda com clientes americanos', keys: [['meeting'], ['monday', 'clients', 'american', 'customers']] },
      { label: 'Fez café e sentou no computador', keys: [['coffee'], ['made', 'make', 'laptop', 'computer', 'sat']] },
      { label: 'Ninguém conseguia ouvir', keys: [['nobody', 'no one', 'anyone', "couldn't", 'could not', "didn't"], ['hear', 'listen', 'heard']] },
      { label: 'Estava no mudo', keys: [['mute', 'muted', 'microphone', 'mic']] },
      { label: 'Todos riram e ele relaxou', keys: [['laughed', 'laugh', 'relaxed', 'better', 'calm']] },
    ],
  },
  {
    id: 'r5', title: 'A mudança de time', level: 'B1',
    text: 'Carla has worked as a data analyst for four years. Last month, her manager asked her to join the data engineering team. At first she was not sure, because she had never built a pipeline. She decided to accept, and now she is learning Airflow with a senior engineer. She says the first weeks were hard, but she is enjoying the challenge.',
    ideas: [
      { label: 'Analista de dados há quatro anos', keys: [['analyst', 'data'], ['four', 'years']] },
      { label: 'Convidada para o time de engenharia', keys: [['manager', 'boss', 'asked', 'invited'], ['engineering', 'team', 'join']] },
      { label: 'Tinha dúvida: nunca tinha feito pipeline', keys: [['sure', 'doubt', 'afraid', 'never'], ['pipeline', 'built', 'build', 'never']] },
      { label: 'Aceitou', keys: [['accepted', 'accept', 'decided', 'said yes']] },
      { label: 'Está aprendendo Airflow com um sênior', keys: [['learning', 'learn', 'studying'], ['airflow', 'senior', 'engineer']] },
      { label: 'Difícil no começo, mas está gostando', keys: [['hard', 'difficult'], ['enjoying', 'enjoy', 'likes', 'like', 'happy', 'challenge']] },
    ],
  },
  {
    id: 'r6', title: 'O voo atrasado', level: 'A2',
    text: 'Tom was at the airport, waiting for his flight to London. The screen said the flight was delayed by three hours because of bad weather. He bought a sandwich, found a quiet place, and worked on his presentation. When the plane finally left, he had finished all his slides.',
    ideas: [
      { label: 'No aeroporto, voo para Londres', keys: [['airport'], ['flight', 'london', 'plane']] },
      { label: 'Atraso de três horas pelo mau tempo', keys: [['delayed', 'delay', 'late'], ['three', 'hours', 'weather', 'rain']] },
      { label: 'Comprou um sanduíche', keys: [['bought', 'buy', 'got', 'ate'], ['sandwich', 'food']] },
      { label: 'Trabalhou na apresentação', keys: [['worked', 'work', 'prepared'], ['presentation', 'slides']] },
      { label: 'Terminou os slides antes de decolar', keys: [['finished', 'finish', 'done', 'completed'], ['slides', 'presentation', 'all']] },
    ],
  },
];

/** Cobertura das ideias no reconto (palavra inteira, sem diferenciar maiúsculas). */
export function retellCoverage(story: RetellStory, said: string): { label: string; ok: boolean }[] {
  const low = ` ${said.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ')} `;
  return story.ideas.map((idea) => ({ label: idea.label, ok: idea.keys.every((group) => group.some((k) => low.includes(` ${k} `))) }));
}
