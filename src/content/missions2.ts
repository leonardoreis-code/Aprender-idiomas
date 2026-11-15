import type { Goal, Mission } from '../domain/sim/engine';

/**
 * Segundo lote de simulações (6 de trabalho, 4 do dia a dia). Conteúdo original.
 * Cada objetivo tem um exemplo que o próprio detector precisa reconhecer
 * (validado em missions2.test.ts).
 */
const g = (id: string, label: string, pt: string, example: string, starter: string, detect: string[][]): Goal => ({ id, label, pt, example, starter, detect });

export const MISSIONS_EXTRA: Mission[] = [
  {
    id: 'code-review', area: 'trabalho', tags: ['colegas'], title: 'Code review: responder a uma crítica',
    setting: 'A Nora revisou o seu pull request e não gostou de duas coisas: uma função longa demais e o jeito como você carrega os dados. Concorde com o que faz sentido, explique a sua decisão, diga o que vai mudar e agradeça a revisão.',
    character: { name: 'Nora', role: 'engenheira de software sênior', color: '#5b3aa8', voice: 0 },
    goals: [
      g('agree', 'Concordar com um ponto dela', 'Você tem razão, essa função está longa demais.', "You're right, that function is too long.", "You're right, that…", [["you're right", 'you are right', 'i agree', 'good point', 'fair point', 'good catch', "that's fair", 'that is fair', "that's true", 'that is true', 'makes sense', 'i see your point', 'i see what you mean', 'i can see that', 'it is too long', "it's too long", 'is too long', 'hard to read', 'hard to follow']]),
      g('explain', 'Explicar por que fez assim', 'Fiz assim porque o filtro depende de duas colunas.', 'I did it that way because the filter depends on two columns.', 'I did it that way because…', [['because', 'since', 'the reason', 'so that', 'in order to', 'the idea was', 'i wanted to', 'i was trying to', 'i needed to', 'i thought', 'my goal was']]),
      g('change', 'Dizer o que vai mudar', 'Vou dividir em duas funções menores.', "I'll split it into two smaller functions.", "I'll split it into…", [["i'll", 'i will', 'i can', 'i could', "i'm going to", 'i am going to', 'let me', 'what if i', 'how about', 'we could', 'i would', "i'd"], ['split', 'change', 'fix', 'refactor', 'rename', 'add', 'remove', 'move', 'update', 'rewrite', 'simplify', 'extract', 'break', 'clean', 'push', 'write', 'replace', 'filter', 'divide', 'separate', 'shorten', 'improve']]),
      g('thanks', 'Agradecer a revisão', 'Obrigado pela revisão, ajudou bastante.', 'Thanks for the review, it really helps.', 'Thanks for…', [['thanks', 'thank you', 'appreciate']]),
    ],
    beats: [
      { say: 'Hey, I went through your pull request for {project}. Honestly, the main function is really long and hard to follow.', pt: 'Oi, eu li o seu pull request. Sinceramente, a função principal está bem longa e difícil de acompanhar.', wants: ['agree'], nudge: 'Do you see what I mean about that function?' },
      { say: 'Also, why do you load the whole table into memory before you filter it?', pt: 'Além disso, por que você carrega a tabela inteira na memória antes de filtrar?', wants: ['explain'], nudge: 'What was the reason for that choice?' },
      { say: 'Okay, fair enough. So what do you want to do about the long function?', pt: 'Certo, é justo. Então o que você quer fazer com a função longa?', wants: ['change'], nudge: 'What are you going to change in the code?' },
      { say: "Sounds good. I'll approve it as soon as you push that.", pt: 'Parece bom. Eu aprovo assim que você subir isso.', wants: ['thanks'], nudge: 'Anything else before I go back to my own work?' },
    ],
    closing: "Any time. Ping me when it's ready and I'll take another look.",
  },
  {
    id: 'incident-call', area: 'trabalho', tags: ['reuniao'], title: 'Incidente: produção caiu',
    setting: 'Produção caiu e o diretor de operações entrou na chamada de emergência. Explique o que está acontecendo, quem foi afetado, o que você já fez e quando o sistema deve voltar.',
    character: { name: 'Victor', role: 'diretor de operações', color: '#b3261e', voice: 1 },
    goals: [
      g('what', 'Explicar o que está acontecendo', 'O serviço de pagamentos está fora do ar desde as nove.', 'The payment service has been down since nine.', 'The… has been down since…', [['down', 'failing', 'failed', 'not working', 'not responding', 'crashed', 'crashing', 'outage', 'broken', 'timing out', 'timeouts', 'errors', 'error', 'unavailable', 'offline', 'stopped', 'incident', "isn't working", "aren't working", 'not running', 'stuck', 'overloaded', 'full', 'slow']]),
      g('impact', 'Dizer quem foi afetado', 'Os clientes não conseguem finalizar os pedidos.', "Customers can't complete their orders.", "Customers can't…", [['customers', 'customer', 'users', 'user', 'clients', 'client', 'orders', 'payments', 'everyone', 'nobody', 'no one', 'all regions', 'the app', 'the website', 'the site', 'reports', 'dashboards', 'the data', 'sales', 'teams', 'team', 'people'], ["can't", 'cannot', 'unable', 'affected', 'affects', 'affecting', 'impact', 'impacted', 'impacting', 'failing', 'not able', 'losing', 'lost', 'delayed', 'late', 'missing', "aren't", 'are not', "isn't", 'is not', 'stuck', 'blocked', 'down', 'no access', 'not going through', 'not updating', 'outdated']]),
      g('done', 'Dizer o que você já fez', 'Já revertemos o último deploy.', 'We already rolled back the last deploy.', 'We already…', [['rolled back', 'restarted', 'reverted', 'already', 'tried', 'checked', 'disabled', 'paused', 'scaled', 'switched', 'found', 'identified', 'investigating', 'looking into', 'opened', 'called', 'escalated', 'turned off', 'fixed', 'applied', 'reran', 'rerun', 'redeployed', 'increased', 'cleared', 'notified']]),
      g('eta', 'Dizer quando deve voltar', 'Deve voltar em uns trinta minutos.', 'It should be back in about thirty minutes.', 'It should be back in…', [['back', 'fixed', 'resolved', 'restored', 'up', 'working', 'recover', 'recovered', 'update', 'normal', 'running', 'online', 'ready', 'stable', 'done', 'take', 'takes', 'need', 'needs'], ['minutes', 'minute', 'hour', 'hours', 'half an hour', 'by noon', 'end of the day', 'this afternoon', 'this morning', 'tonight', 'tomorrow', "o'clock", 'shortly']]),
    ],
    beats: [
      { say: "Thanks for jumping on. I'm seeing alerts all over {project}. What's going on?", pt: 'Obrigado por entrar. Estou vendo alertas por todo o projeto. O que está acontecendo?', wants: ['what'], nudge: 'Which system is down right now?' },
      { say: 'Okay. Who is affected by this?', pt: 'Certo. Quem foi afetado por isso?', wants: ['impact'], nudge: 'What does this mean for our customers?' },
      { say: 'Understood. What have you done so far?', pt: 'Entendido. O que você já fez até agora?', wants: ['done'], nudge: 'Did you already try anything to fix it?' },
      { say: 'Good. When do you expect it to be back?', pt: 'Bom. Quando você espera que volte?', wants: ['eta'], nudge: 'I need a rough time. How long will it take?' },
    ],
    closing: "All right. Keep me posted every fifteen minutes, and I'll let the support team know.",
  },
  {
    id: 'onboarding', area: 'trabalho', tags: ['colegas'], title: 'Receber uma colega nova',
    setting: 'A Maya entrou hoje no time e está meio perdida. Dê as boas-vindas, conte como é a rotina de reuniões, explique o caminho do código até produção e deixe claro que ela pode te procurar.',
    character: { name: 'Maya', role: 'colega recém-chegada', color: '#1b6e52', voice: 0 },
    goals: [
      g('welcome', 'Dar as boas-vindas', 'Bem-vinda ao time!', 'Welcome to the team!', 'Welcome to…', [['welcome', 'glad to have you', 'great to have you', 'happy to have you', 'good to have you', 'nice to have you', 'nice to meet you', 'glad you joined', "glad you're here"]]),
      g('routine', 'Contar a rotina de reuniões', 'Temos uma daily toda manhã, às dez.', 'We have a standup every morning at ten.', 'We have a… every…', [['every', 'usually', 'always', 'once a week', 'twice a week', 'daily', 'weekly', 'on mondays', 'on fridays', 'each', 'two weeks', 'a week', 'a month'], ['standup', 'stand up', 'meeting', 'meetings', 'sprint', 'sprints', 'planning', 'retro', 'retrospective', 'review', 'demo', 'sync', 'daily', 'call', 'calls', 'release', 'one on one']]),
      g('steps', 'Explicar o passo a passo', 'Primeiro você abre um pull request, depois alguém revisa.', 'First you open a pull request, then someone reviews it.', 'First you…, then…', [['first', 'then', 'after that', 'before', 'once', 'when you', 'next', 'finally', 'and wait', 'you need to', 'you have to', 'you should'], ['pull request', 'pr', 'review', 'reviews', 'reviewer', 'ticket', 'tickets', 'branch', 'merge', 'merged', 'deploy', 'deployed', 'test', 'tests', 'board', 'approve', 'approves', 'approval', 'approved', 'release', 'staging', 'production', 'pipeline', 'commit', 'push']]),
      g('offer', 'Dizer que ela pode te procurar', 'Se tiver qualquer dúvida, é só me chamar.', 'If you have any questions, just ask me.', 'If you have any questions, just…', [['ask me', 'ask us', 'let me know', 'feel free', 'reach out', 'ping me', 'message me', 'i can help', "i'll help", 'i will help', 'happy to help', 'glad to help', 'here to help', 'talk to', 'you can ask', 'call me', 'come to me', 'text me', 'can show you', "i'll show you", 'will show you']]),
    ],
    beats: [
      { say: "Hi! I'm Maya. It's my first day on the team and I'm still a bit lost, to be honest.", pt: 'Oi! Sou a Maya. É o meu primeiro dia no time e ainda estou meio perdida, para ser sincera.', wants: ['welcome'], nudge: 'Sorry to bother you. Are you on this team too?' },
      { say: 'Thanks! So how does a normal week work here? Do you have a lot of meetings?', pt: 'Obrigada! Então, como é uma semana normal aqui? Vocês têm muitas reuniões?', wants: ['routine'], nudge: 'Which meetings do you have, and how often?' },
      { say: 'Got it. And when I finish a task, what do I do with my code?', pt: 'Entendi. E quando eu termino uma tarefa, o que eu faço com o meu código?', wants: ['steps'], nudge: 'What are the steps before my code goes to production?' },
      { say: "That's clear. And if I get stuck with {tool}, who should I talk to?", pt: 'Ficou claro. E se eu travar com a ferramenta, com quem eu falo?', wants: ['offer'], nudge: 'Is it okay if I come to you when I have questions?' },
    ],
    closing: 'Thank you so much. That really helps on a first day!',
  },
  {
    id: 'deadline-negotiation', area: 'trabalho', tags: ['reuniao', 'gerente'], title: 'Negociar um prazo',
    setting: 'A gerente de produto prometeu ao cliente três funcionalidades para sexta. Não dá tempo. Diga que não é possível, explique o motivo, proponha entregar uma parte menor primeiro e confirme o que ficou combinado.',
    character: { name: 'Helen', role: 'gerente de produto', color: '#a8430d', voice: 0 },
    goals: [
      g('cant', 'Dizer que o prazo não dá', 'Infelizmente não conseguimos terminar tudo até sexta.', "I'm afraid we can't finish everything by Friday.", "I'm afraid we can't…", [["can't", 'cannot', "won't", 'will not', 'not possible', 'impossible', 'not realistic', 'unrealistic', 'not enough time', 'too tight', 'not feasible', "don't think", 'do not think', 'not going to', 'no way', 'unable', "isn't enough", 'too much', "isn't realistic", "isn't possible", 'not doable']]),
      g('explain', 'Explicar o motivo', 'Porque a integração ainda precisa de uma semana de testes.', 'Because the integration still needs a week of testing.', 'Because the… still needs…', [['because', 'since', 'the reason', 'due to', 'the problem is', 'the issue is', 'we still need', 'we still have', 'still needs', 'it takes', 'it would take', 'it will take', 'depends on', 'we only have', 'there are only']]),
      g('scope', 'Propor um escopo menor', 'E se a gente entregar só a exportação primeiro?', 'What if we deliver only the export first?', 'What if we deliver only…', [['what if', 'how about', 'we could', 'we can', 'i suggest', 'i propose', "why don't we", 'instead', 'i can', 'i could', 'my suggestion', "let's", 'would it work', 'could we', 'can we'], ['only', 'just', 'first', 'smaller', 'part', 'phase', 'phases', 'version', 'scope', 'without', 'later', 'the rest', 'main', 'core', 'basic', 'priority', 'reduce', 'cut', 'leave out', 'drop', 'simpler', 'mvp', 'one feature', 'half', 'most important']]),
      g('confirm', 'Confirmar o acordo', 'Então combinado: a exportação na sexta e o resto no fim do mês.', 'So we agree: the export on Friday and the rest at the end of the month.', 'So we agree: …', [['so we agree', 'we agree', 'agreed', 'deal', 'to confirm', 'to recap', 'to summarize', 'so the plan is', "so we'll", 'so we will', 'sounds good', 'that works', 'works for me', "let's do that", 'to be clear', "i'll confirm", 'in writing', 'so we deliver', "so we're delivering", 'so we are delivering', 'fine with me', 'okay with me', 'fine by me', "so it's", 'so it is']]),
    ],
    beats: [
      { say: 'I promised the client all three features of {project} by Friday. We can do that, right?', pt: 'Prometi ao cliente as três funcionalidades do projeto para sexta. A gente consegue, né?', wants: ['cant'], nudge: 'Be honest with me. Is Friday realistic?' },
      { say: 'Really? What makes it so hard?', pt: 'Sério? O que torna isso tão difícil?', wants: ['explain'], nudge: 'Why do you need more time?' },
      { say: "Hmm. I can't go back to the client with nothing. What can you give me by Friday?", pt: 'Hum. Não posso voltar ao cliente de mãos vazias. O que você consegue me dar até sexta?', wants: ['scope'], nudge: 'Is there a smaller version we could deliver first?' },
      { say: 'Okay, I can sell that. One feature on Friday, the other two at the end of the month.', pt: 'Certo, isso eu consigo vender. Uma funcionalidade na sexta, as outras duas no fim do mês.', wants: ['confirm'], nudge: 'So do we have a deal?' },
    ],
    closing: "Great. I'll update the client today. Thanks for being upfront with me.",
  },
  {
    id: 'demo', area: 'trabalho', tags: ['reuniao', 'cliente'], title: 'Demo para o cliente',
    setting: 'Você vai apresentar ao cliente o que o time construiu. Diga o que vai mostrar, apresente o resultado com um número, responda à pergunta da diretora e combine o próximo passo.',
    character: { name: 'Grace', role: 'diretora do cliente', color: '#155e8a', voice: 0 },
    goals: [
      g('intro', 'Dizer o que você vai mostrar', 'Hoje vou mostrar o novo painel de vendas.', "Today I'm going to show you the new sales dashboard.", "Today I'm going to show you…", [['show you', 'going to show', 'walk you through', 'present', 'presenting', 'demo', 'share my screen', 'take you through', "i'll show", 'i will show', 'want to show', 'like to show', 'let me show', 'showing you', 'you can see', 'this is the new', 'this is our new']]),
      g('result', 'Apresentar o resultado com um número', 'O relatório agora carrega em três segundos, em vez de dois minutos.', 'The report now loads in three seconds instead of two minutes.', 'The report now… instead of…', [['now', 'reduced', 'increased', 'improved', 'faster', 'saves', 'saved', 'save', 'went from', 'dropped', 'grew', 'cut', 'instead of', 'decreased', 'better', 'less', 'more', 'takes', 'used to'], ['seconds', 'second', 'minutes', 'minute', 'hours', 'hour', 'percent', 'per cent', 'times', 'half', 'twice', 'double', 'days', 'day', 'weeks', 'week']]),
      g('answer', 'Responder à pergunta dela', 'Os dados são atualizados a cada hora.', 'The data is updated every hour.', 'The data is updated every…', [['every', 'each', 'once', 'twice', 'real time', 'hourly', 'daily', 'weekly', 'automatically', 'overnight', 'live', 'per day', 'a day', 'an hour', 'minutes', 'hours', 'morning', 'night']]),
      g('next', 'Combinar o próximo passo', 'Eu envio o link depois da reunião para vocês testarem.', "I'll send you the link after the call so you can try it.", "I'll send you…", [["i'll send", 'i will send', "i'll share", 'i will share', 'send you', 'share the link', 'next step', 'next steps', "we'll", 'we will', 'you can try', 'you can start', 'give you access', 'follow up', 'can start using', 'will be available', 'let me know']]),
    ],
    beats: [
      { say: "Hello! We're all here and curious to see it. The floor is yours.", pt: 'Olá! Estamos todos aqui e curiosos para ver. A palavra é sua.', wants: ['intro'], nudge: 'What are you going to show us today?' },
      { say: 'It looks nice. But what actually changed for my team?', pt: 'Ficou bonito. Mas o que mudou de verdade para o meu time?', wants: ['result'], nudge: 'Do you have any numbers? How much faster is it?' },
      { say: 'Impressive. One question: how often is the data updated?', pt: 'Impressionante. Uma pergunta: com que frequência os dados são atualizados?', wants: ['answer'], nudge: 'Sorry, is it updated once a day, or more often?' },
      { say: 'Good to know. So what happens next?', pt: 'Bom saber. E o que acontece agora?', wants: ['next'], nudge: 'When can my team start using it?' },
    ],
    closing: 'Perfect. Great work, my team is going to love it. Talk soon!',
  },
  {
    id: 'recruiter-call', area: 'trabalho', tags: ['entrevista'], title: 'Ligação da recrutadora',
    setting: 'Uma recrutadora liga para falar de uma vaga na sua área. Diga quando poderia começar, informe a sua expectativa salarial, faça uma pergunta sobre a vaga e pergunte quais são os próximos passos.',
    character: { name: 'Olivia', role: 'recrutadora', color: '#8a2a6b', voice: 0 },
    goals: [
      g('availability', 'Dizer quando pode começar', 'Eu poderia começar em trinta dias.', 'I could start in thirty days.', 'I could start in…', [['start', 'available', 'availability', 'notice', 'join', 'begin'], ['days', 'weeks', 'week', 'month', 'months', 'immediately', 'right away', 'next', 'notice', 'as soon as', 'now', 'anytime', 'any time', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']]),
      g('salary', 'Dizer a sua expectativa salarial', 'Estou buscando algo em torno de oito mil por mês.', "I'm looking for something around eight thousand a month.", "I'm looking for something around…", [['looking for', 'expecting', 'expect', 'expectation', 'expectations', 'around', 'between', 'at least', 'range', 'currently make', 'currently earn', 'hoping for', 'open to', 'negotiable', 'depends on', 'i would like', "i'd like", 'i want'], ['thousand', 'k', 'salary', 'range', 'month', 'year', 'hour', 'dollars', 'reais', 'euros', 'pounds', 'package', 'offer', 'benefits', 'negotiable', 'compensation', 'market', 'hundred']]),
      g('ask', 'Fazer uma pergunta sobre a vaga', 'A vaga é remota ou híbrida?', 'Is the role remote or hybrid?', 'Is the role…', [['is the', 'is it', 'is this', 'what is', "what's", 'what does', 'what are', 'how big', 'how many', 'could you tell me', 'can you tell me', 'tell me more', 'do you', 'does the', 'does it', 'which', 'who would', 'would i', 'will i', 'like to know', 'what kind', 'what would', 'where is', 'are there', 'is there'], ['role', 'position', 'job', 'team', 'remote', 'remotely', 'hybrid', 'office', 'company', 'stack', 'project', 'projects', 'responsibilities', 'benefits', 'schedule', 'tools', 'technologies', 'work', 'working', 'manager', 'contract', 'day to day']]),
      g('next', 'Perguntar os próximos passos', 'Quais são os próximos passos?', 'What are the next steps?', 'What are the next…', [['next step', 'next steps', 'what happens next', 'what comes next', 'when will i hear', 'when can i expect', 'when should i expect', 'hear back', 'hear from you', 'interview process', 'hiring process', 'selection process', 'next stage', 'next round', 'the process', 'how many interviews', 'how many rounds']]),
    ],
    beats: [
      { say: "Hi, this is Olivia. I'm a recruiter, and I'm calling about a {role} position. If things go well, when could you start?", pt: 'Oi, aqui é a Olivia. Sou recrutadora e estou ligando sobre uma vaga na sua área. Se der tudo certo, quando você poderia começar?', wants: ['availability'], nudge: 'Do you have a notice period at your current job?' },
      { say: 'Good. And what are your salary expectations?', pt: 'Bom. E qual é a sua expectativa salarial?', wants: ['salary'], nudge: 'Do you have a number or a range in mind?' },
      { say: "That's within our range. Do you have any questions about the role?", pt: 'Está dentro da nossa faixa. Você tem alguma pergunta sobre a vaga?', wants: ['ask'], nudge: "Is there anything you'd like to know about the team or the work?" },
      { say: "Good question. It's hybrid, two office days a week, and you'd join a team of six working on data products. Anything else you'd like to ask?", pt: 'Boa pergunta. É híbrida, dois dias por semana no escritório, e você entraria num time de seis pessoas que trabalha com produtos de dados. Mais alguma coisa que queira perguntar?', wants: ['next'], nudge: 'Would you like to know how the process works from here?' },
    ],
    closing: "First a technical interview, then a chat with the hiring manager. I'll email you the details today. Thanks for your time!",
  },
  {
    id: 'airport', area: 'vida', tags: ['viagem'], title: 'Aeroporto: voo cancelado',
    setting: 'Seu voo para Chicago foi cancelado por causa do tempo e você está no balcão da companhia aérea. Peça para remarcar, pergunte quais são as opções, peça hotel ou voucher para passar a noite e confirme o novo voo.',
    character: { name: 'Ruth', role: 'atendente da companhia aérea', color: '#3d4a9e', voice: 0 },
    goals: [
      g('rebook', 'Pedir para remarcar', 'Meu voo foi cancelado. Preciso remarcar, por favor.', 'My flight was cancelled. I need to rebook, please.', 'I need to rebook…', [['rebook', 'rebooked', 'another flight', 'next flight', 'new flight', 'different flight', 'other flight', 'reschedule', 'rescheduled', 'change my flight', 'later flight', 'earlier flight', 'new ticket', 'put me on', 'book me', 'next available', 'another one', 'get to chicago', 'still need to get', 'still need to fly']]),
      g('options', 'Perguntar quais são as opções', 'Quais são as minhas opções para hoje?', 'What are my options for today?', 'What are my options…', [['options', 'option', 'what flights', 'which flights', 'is there', 'are there', 'do you have', 'what time', 'when is', 'what else', 'any flights', 'any seats', 'alternatives', 'alternative', 'what about', 'how about', 'direct flight', 'other airlines', 'another airline', 'what is available', "what's available", 'what do you have']]),
      g('hotel', 'Pedir hotel ou voucher', 'Vocês podem oferecer um hotel para esta noite?', 'Could you provide a hotel for tonight?', 'Could you provide…', [['hotel', 'voucher', 'vouchers', 'accommodation', 'place to stay', 'somewhere to stay', 'where to stay', 'meal', 'meals', 'food', 'compensation', 'a room', 'lounge', 'shuttle', 'taxi', 'refund', 'place to sleep', 'somewhere to sleep']]),
      g('confirm', 'Confirmar o novo voo', 'Então estou no voo das sete da manhã, certo?', "So I'm on the seven a.m. flight tomorrow, right?", "So I'm on the…", [['just to confirm', 'to confirm', 'confirm', 'confirmed', 'confirmation', 'to make sure', 'is that right', 'is that correct', 'correct', "so i'm on", 'so i am on', "so i'm booked", 'so i am booked', 'so my new flight', 'so the new flight', "so that's", 'so that is', 'so it leaves', 'so it departs', 'so i leave', 'so i fly', "so i'll", 'so i will', 'so i have', 'tomorrow right', 'flight right'], ['flight', 'gate', 'boarding pass', 'seat', 'tomorrow', 'morning', 'seven', '7', 'departure', 'departs', 'leaves', 'ticket', 'terminal', 'luggage', 'bags', 'baggage', 'booking']]),
    ],
    beats: [
      { say: "Next, please. I'm sorry, the flight to Chicago was cancelled because of the weather. How can I help?", pt: 'Próximo, por favor. Sinto muito, o voo para Chicago foi cancelado por causa do tempo. Como posso ajudar?', wants: ['rebook'], nudge: 'Would you like me to put you on another flight?' },
      { say: 'Sure, I can do that for you. Everything is very full today, though.', pt: 'Claro, posso fazer isso. Mas hoje está tudo muito cheio.', wants: ['options'], nudge: 'Do you want to know which flights are available?' },
      { say: 'Tonight is sold out. The next flight with a free seat leaves tomorrow at seven a.m.', pt: 'Hoje à noite está esgotado. O próximo voo com lugar sai amanhã às sete da manhã.', wants: ['hotel'], nudge: 'That means a night here. Do you need anything for tonight?' },
      { say: "Yes, we can give you a hotel voucher and a meal voucher. And I've put you on the seven a.m. flight.", pt: 'Sim, podemos dar um voucher de hotel e um de refeição. E coloquei você no voo das sete da manhã.', wants: ['confirm'], nudge: 'Would you like to check the details before you go?' },
    ],
    closing: "That's right: tomorrow, seven a.m., gate twelve. Here are your vouchers. Have a good night!",
  },
  {
    id: 'doctor', area: 'vida', tags: ['viagem'], title: 'Consulta médica em viagem',
    setting: 'Você ficou doente durante uma viagem e foi a uma clínica. Descreva o que está sentindo, diga há quanto tempo, faça uma pergunta sobre o remédio e agradeça ao médico.',
    character: { name: 'Dr. Reed', role: 'médico da clínica', color: '#0f6b75', voice: 1 },
    goals: [
      g('symptom', 'Descrever o que está sentindo', 'Estou com dor de garganta e febre.', 'I have a sore throat and a fever.', 'I have a…', [['sore throat', 'throat', 'fever', 'headache', 'cough', 'coughing', 'pain', 'hurts', 'hurt', 'hurting', 'stomach', 'stomachache', 'dizzy', 'nausea', 'nauseous', 'sick', 'ache', 'aches', 'a cold', 'flu', 'rash', 'allergy', 'swollen', 'backache', 'my back', 'my ear', 'my chest', 'my head', 'tired', 'weak', 'vomiting', 'threw up', 'diarrhea', 'runny nose', 'temperature', 'breathe', 'breathing', 'sneezing', 'itchy', 'toothache', 'migraine', "can't sleep", "can't swallow", 'feel bad', 'feel terrible', 'not feeling well', "don't feel well"]]),
      g('duration', 'Dizer há quanto tempo', 'Começou há dois dias.', 'It started two days ago.', 'It started…', [['ago', 'since', 'yesterday', 'last night', 'this morning', 'started', 'began', 'days', 'hours', 'weeks', 'a week', 'a day', 'one day', 'all day', 'all night', 'a few', 'a couple', 'the last', 'the past', 'today', 'tonight', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']]),
      g('medicine', 'Perguntar sobre o remédio', 'Com que frequência devo tomar este remédio?', 'How often should I take this medicine?', 'How often should I…', [['how often', 'how many', 'how long', 'should i', 'do i', 'can i', 'could i', 'is it', 'is there', 'are there', 'does it', 'do you', 'when should', 'when do', 'what about', 'will it', 'what is', "what's", 'where can', 'would it', 'may i'], ['medicine', 'medication', 'pill', 'pills', 'tablet', 'tablets', 'antibiotic', 'antibiotics', 'take it', 'take them', 'take this', 'take these', 'side effects', 'prescription', 'pharmacy', 'dose', 'drug', 'painkiller', 'painkillers', 'syrup', 'drops', 'with food', 'alcohol', 'drive', 'allergic', 'treatment', 'buy it']]),
      g('thanks', 'Agradecer ao médico', 'Muito obrigado, doutor.', 'Thank you so much, doctor.', 'Thank you…', [['thank', 'thanks', 'appreciate']]),
    ],
    beats: [
      { say: 'Good afternoon. Please, have a seat. What brings you in today?', pt: 'Boa tarde. Sente-se, por favor. O que traz você aqui hoje?', wants: ['symptom'], nudge: 'What are you feeling? Where does it hurt?' },
      { say: 'I see. How long have you had these symptoms?', pt: 'Entendo. Há quanto tempo você está com esses sintomas?', wants: ['duration'], nudge: 'When did it start?' },
      { say: "Let me take a look. Okay, it's a throat infection, nothing serious. I'm going to prescribe an antibiotic.", pt: 'Deixa eu dar uma olhada. Certo, é uma infecção de garganta, nada grave. Vou receitar um antibiótico.', wants: ['medicine'], nudge: 'Do you have any questions about the medicine?' },
      { say: 'Take one tablet every eight hours, with food, for seven days. And drink plenty of water.', pt: 'Tome um comprimido a cada oito horas, com comida, por sete dias. E beba bastante água.', wants: ['thanks'], nudge: "Is there anything else you'd like to ask?" },
    ],
    closing: "You're welcome. Get some rest, and I hope you feel better soon.",
  },
  {
    id: 'support-call', area: 'vida', tags: [], title: 'Ligar para o suporte da internet',
    setting: 'A internet da sua casa parou de funcionar e você liga para o suporte da operadora. Explique o problema, diga o que já tentou, pergunte quando o técnico pode vir e peça o número do protocolo.',
    character: { name: 'Kevin', role: 'atendente de suporte', color: '#7a5200', voice: 1 },
    goals: [
      g('problem', 'Explicar o problema', 'Minha internet não funciona desde ontem.', "My internet hasn't been working since yesterday.", "My internet hasn't been working since…", [['internet', 'wifi', 'wi fi', 'connection', 'router', 'modem', 'network', 'signal', 'service', 'account', 'card', 'app', 'line', 'speed'], ["isn't working", 'is not working', 'not working', "hasn't been working", "hasn't worked", "doesn't work", 'does not work', 'stopped working', 'down', 'slow', 'keeps dropping', 'drops', 'dropping', 'no connection', 'no signal', 'no internet', 'problem', 'problems', 'issue', 'issues', 'trouble', "can't", 'cannot', 'offline', 'disconnected', 'disconnects', 'disconnecting', 'unstable', 'blocked', 'broken', 'error', 'cuts out', 'keeps cutting', 'red light', 'blinking', "won't connect", "doesn't connect"]]),
      g('tried', 'Dizer o que já tentou', 'Já reiniciei o roteador duas vezes.', "I've already restarted the router twice.", "I've already…", [['restarted', 'rebooted', 'reset', 'unplugged', 'turned it off', 'turned off', 'switched off', 'switched it off', 'tried', 'already', 'checked', 'tested', 'changed', 'reinstalled', 'replaced', 'plugged', 'reconnected', 'updated']]),
      g('when', 'Perguntar quando resolvem', 'Quando o técnico pode vir?', 'When can the technician come?', 'When can the technician…', [['when', 'how long', 'how soon', 'what time', 'which day', 'what day', 'how many days', 'today', 'tomorrow', 'as soon as possible', 'earliest', 'sooner'], ['technician', 'fixed', 'fix', 'come', 'visit', 'back', 'working', 'resolved', 'solve', 'solved', 'take', 'appointment', 'someone', 'restored', 'repair', 'repaired', 'send', 'available', 'expect', 'ready', 'be here', 'arrive', 'happen', 'normal']]),
      g('ticket', 'Pedir o número do protocolo', 'Você pode me passar o número do protocolo, por favor?', 'Could you give me the ticket number, please?', 'Could you give me the…', [['ticket', 'reference', 'case number', 'protocol', 'confirmation', 'confirm', 'in writing', 'by email', 'an email', 'text message', 'tracking number', 'request number', 'service number', 'case id']]),
    ],
    beats: [
      { say: 'Thank you for calling customer support. My name is Kevin. How can I help you today?', pt: 'Obrigado por ligar para o suporte. Meu nome é Kevin. Como posso ajudar hoje?', wants: ['problem'], nudge: 'What seems to be the problem with your service?' },
      { say: "I'm sorry to hear that. Have you tried anything on your side?", pt: 'Sinto muito por isso. Você tentou alguma coisa por aí?', wants: ['tried'], nudge: 'Did you restart the router, for example?' },
      { say: "Okay. I ran a test and the problem is on our side. We'll need to send a technician to your home.", pt: 'Certo. Rodei um teste e o problema é do nosso lado. Vamos precisar mandar um técnico à sua casa.', wants: ['when'], nudge: 'Would you like to know when the technician can come?' },
      { say: "The earliest slot is tomorrow, between two and six in the afternoon. I've booked it for you.", pt: 'O primeiro horário é amanhã, entre duas e seis da tarde. Já agendei para você.', wants: ['ticket'], nudge: 'Do you need anything from me to follow up on this visit?' },
    ],
    closing: "Sure. Your ticket number is four eight two one, and you'll get it by text as well. Thanks for your patience!",
  },
  {
    id: 'neighbor', area: 'vida', tags: ['colegas'], title: 'Conversa de elevador com o vizinho',
    setting: 'Você acabou de se mudar e encontra um vizinho no elevador do prédio. Apresente-se, faça uma pergunta para ele, comente algo sobre o prédio ou o bairro e despeça-se quando ele chegar ao andar dele.',
    character: { name: 'Walter', role: 'vizinho do quinto andar', color: '#4a5d23', voice: 1 },
    goals: [
      g('intro', 'Apresentar-se', 'Meu nome é Rafa, acabei de me mudar para o 302.', 'My name is Rafa, and I just moved into apartment 302.', 'My name is…, and I just moved into…', [['my name is', "my name's", "i'm", 'i am', 'call me', 'i just', 'i live', 'i moved', "i've just"], ['moved', 'live', 'living', 'new', 'apartment', 'floor', 'neighbor', 'neighbour', 'nice to meet', 'pleased to meet', 'good to meet', 'great to meet', 'brazil', 'brazilian', 'name', 'building', 'next door', 'upstairs', 'downstairs']]),
      g('question', 'Fazer uma pergunta para ele', 'Você mora aqui há muito tempo?', 'Have you lived here long?', 'Have you…', [['have you', 'do you', 'did you', 'are you', 'how long', 'is there', 'are there', 'where is', "where's", 'where do', 'where can', 'what do', 'which floor', 'what floor', 'can you recommend', 'could you recommend', 'would you recommend', 'is it', 'what about you', 'how about you', 'what is', "what's", 'how is', "how's", 'does the', 'who should']]),
      g('comment', 'Comentar algo sobre o prédio ou o bairro', 'O bairro é bem tranquilo. Estou gostando muito.', 'The neighborhood is really quiet. I like it a lot.', 'The neighborhood is really…', [['i like', 'i love', 'i really like', 'i really love', 'i enjoy', "i'm enjoying", 'is really', 'is so', 'is very', 'is pretty', 'is quite', 'is great', 'is nice', 'is beautiful', 'is lovely', 'is quiet', 'looks', 'seems', 'sounds', "it's nice", "it's great", "it's a nice", "it's a great", "it's so", "it's really", "it's very", "it's pretty", "it's quite", "that's great", "that's nice", "that's good", "that's helpful", "that's awesome", "that's cool", 'what a', 'good to know', 'so far so good', 'i heard', 'i noticed', 'nice weather', 'lovely day', 'beautiful day']]),
      g('bye', 'Despedir-se', 'Foi um prazer. Até mais!', 'It was nice meeting you. See you around!', 'It was nice…', [['see you', 'nice meeting you', 'was nice to meet you', 'was a pleasure', 'it was nice', 'nice talking', 'good talking', 'take care', 'have a good', 'have a nice', 'have a great', 'bye', 'goodbye', 'good night', 'catch you later', 'talk to you later', 'see ya', 'pleasure meeting you', 'great meeting you', 'good meeting you', 'until next time', 'enjoy your']]),
    ],
    beats: [
      { say: "Morning! Going down? I don't think we've met. I'm Walter, from the fifth floor.", pt: 'Bom dia! Descendo? Acho que a gente não se conhece. Sou o Walter, do quinto andar.', wants: ['intro'], nudge: 'And you are? Did you just move in?' },
      { say: "Welcome to the building! It's a friendly place, you'll see.", pt: 'Bem-vindo ao prédio! É um lugar simpático, você vai ver.', wants: ['question'], nudge: "Is there anything you'd like to know about the building or the area?" },
      { say: "Well, I've been here twelve years. There's a great bakery on the corner, and a street market on Saturdays.", pt: 'Olha, eu moro aqui há doze anos. Tem uma padaria ótima na esquina e uma feira aos sábados.', wants: ['comment'], nudge: 'So, how do you like the neighborhood so far?' },
      { say: 'Ah, this is my stop. I have a bus to catch.', pt: 'Ah, é aqui que eu fico. Tenho um ônibus para pegar.', wants: ['bye'], nudge: 'It was nice meeting you!' },
    ],
    closing: 'See you around. And knock on my door if you ever need anything!',
  },
];

/** Complemento do "Como se diz?": termos que não estão no GLOSSARY de missions.ts. */
export const GLOSSARY_EXTRA: Record<string, string> = {
  // Tecnologia e dados
  codigo: 'code', 'revisao de codigo': 'code review', repositorio: 'repository', ramo: 'branch', mesclar: 'to merge', conflito: 'conflict',
  versao: 'version', lancamento: 'release / launch', lancar: 'to release / to launch', producao: 'production', ambiente: 'environment',
  homologacao: 'staging', servidor: 'server', nuvem: 'cloud', armazenamento: 'storage', 'copia de seguranca': 'backup', registro: 'log / record',
  alerta: 'alert', incidente: 'incident', indisponibilidade: 'outage / downtime', 'fora do ar': 'down / offline', lentidao: 'slowness',
  'tempo de resposta': 'response time', 'causa raiz': 'root cause', correcao: 'fix', 'solucao de contorno': 'workaround', monitoramento: 'monitoring',
  carga: 'load', esteira: 'pipeline', 'fonte de dados': 'data source', amostra: 'sample', linha: 'row / line', campo: 'field',
  duplicado: 'duplicate', filtro: 'filter', esquema: 'schema', metrica: 'metric', indicador: 'KPI / indicator', media: 'average', taxa: 'rate',
  crescimento: 'growth', queda: 'drop / decrease', tendencia: 'trend', previsao: 'forecast', modelo: 'model', validar: 'to validate',
  automatizar: 'to automate', integrar: 'to integrate', migrar: 'to migrate', refatorar: 'to refactor', depurar: 'to debug',
  documentacao: 'documentation', permissao: 'permission', usuario: 'user', funcionalidade: 'feature', melhoria: 'improvement',
  configuracao: 'settings / configuration', atualizar: 'to update', atualizacao: 'update', planilha: 'spreadsheet', grafico: 'chart',
  arquivo: 'file', pasta: 'folder', anexo: 'attachment',
  // Reuniões, carreira e negociação
  apresentacao: 'presentation', apresentar: 'to present / to introduce', demonstracao: 'demo', ata: 'meeting notes / minutes', resumo: 'summary',
  resumir: 'to summarize', 'proximos passos': 'next steps', pendencia: 'open item / pending issue', acompanhar: 'to follow up / to track',
  estimativa: 'estimate', cronograma: 'timeline / schedule', marco: 'milestone', planejamento: 'planning', priorizar: 'to prioritize',
  negociar: 'to negotiate', acordo: 'agreement / deal', concordar: 'to agree', discordar: 'to disagree', sugerir: 'to suggest', propor: 'to propose',
  proposta: 'proposal', explicar: 'to explain', esclarecer: 'to clarify', responder: 'to answer / to reply', interromper: 'to interrupt',
  decisao: 'decision', responsavel: 'owner / person in charge', 'parte interessada': 'stakeholder', fornecedor: 'vendor / supplier',
  contrato: 'contract', vaga: 'job opening / position', curriculo: 'resume / CV', salario: 'salary', 'pretensao salarial': 'salary expectations',
  beneficios: 'benefits', recrutador: 'recruiter', contratar: 'to hire', 'aviso previo': 'notice period', disponibilidade: 'availability',
  experiencia: 'experience', habilidade: 'skill', treinamento: 'training', desafio: 'challenge', conquista: 'achievement', carreira: 'career',
  remoto: 'remote', hibrido: 'hybrid', escritorio: 'office', 'fuso horario': 'time zone', 'compartilhar a tela': 'to share my screen',
  // Viagem e saúde
  aeroporto: 'airport', 'cartao de embarque': 'boarding pass', conexao: 'connection / connecting flight', escala: 'layover / stopover', assento: 'seat',
  corredor: 'aisle', 'bagagem de mao': 'carry-on bag', mala: 'suitcase', alfandega: 'customs', visto: 'visa', 'ida e volta': 'round trip',
  passagem: 'ticket', reembolso: 'refund', hospedagem: 'accommodation', 'cafe da manha': 'breakfast', elevador: 'elevator', andar: 'floor',
  estacao: 'station', metro: 'subway', onibus: 'bus', trem: 'train', endereco: 'address', esquina: 'corner', perto: 'near / close', longe: 'far',
  'cartao de credito': 'credit card', dinheiro: 'cash / money', farmacia: 'pharmacy', remedio: 'medicine', receita: 'prescription', dor: 'pain',
  'dor de cabeca': 'headache', 'dor de garganta': 'sore throat', febre: 'fever', tosse: 'cough', gripe: 'flu', alergia: 'allergy',
  comprimido: 'pill / tablet', 'pronto socorro': 'emergency room',
  // Dia a dia
  vizinho: 'neighbor', predio: 'building', bairro: 'neighborhood', aluguel: 'rent', barulho: 'noise', vazamento: 'leak', tecnico: 'technician',
  roteador: 'router', sinal: 'signal', protocolo: 'ticket number / reference number', atendente: 'agent / representative', suporte: 'support',
  fatura: 'invoice / bill', cobranca: 'charge', saldo: 'balance', agendar: 'to book / to schedule', mercado: 'grocery store / market',
  padaria: 'bakery', encomenda: 'package', 'fim de semana': 'weekend', chuva: 'rain', transito: 'traffic', 'que pena': "that's a shame",
  'sem problema': 'no problem', 'ate mais': 'see you later', parabens: 'congratulations', 'com certeza': 'definitely / for sure', talvez: 'maybe',
  infelizmente: 'unfortunately', 'ainda nao': 'not yet', 'por enquanto': 'for now', 'mais devagar': 'more slowly',
};
