import type { Goal, Mission } from '../domain/sim/engine';

/**
 * Simulações do dia a dia. Conteúdo original. Cada objetivo tem um exemplo que
 * o próprio detector precisa reconhecer (validado em sim.test.ts).
 */
const g = (id: string, label: string, pt: string, example: string, starter: string, detect: string[][]): Goal => ({ id, label, pt, example, starter, detect });

export const DAY_TAGS: { id: string; label: string }[] = [
  { id: 'daily', label: 'Daily / standup' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'gerente', label: 'Conversa com gerente' },
  { id: 'cliente', label: 'Call com cliente' },
  { id: 'entrevista', label: 'Entrevista' },
  { id: 'colegas', label: 'Bate-papo com colegas' },
  { id: 'restaurante', label: 'Restaurante' },
  { id: 'viagem', label: 'Viagem' },
];

export const MISSIONS: Mission[] = [
  {
    id: 'daily-blocker', area: 'trabalho', tags: ['daily'], title: 'Daily com um bloqueio',
    setting: 'É a daily do time. Ontem você avançou numa tarefa, hoje vai continuar, mas está sem acesso ao banco de dados e precisa que alguém libere.',
    character: { name: 'Priya', role: 'gerente de engenharia', color: '#7b3fb0', voice: 0 },
    goals: [
      g('yesterday', 'Dizer o que você fez ontem', 'Ontem eu terminei a migração.', 'Yesterday I finished the migration.', 'Yesterday I…', [['yesterday'], ['finished', 'worked', 'fixed', 'did', 'reviewed', 'deployed', 'tested', 'wrote', 'created', 'completed', 'started', 'had', 'made', 'built', 'implemented', 'was', 'updated']]),
      g('today', 'Dizer o plano de hoje', 'Hoje eu vou escrever os testes.', "Today I'm going to write the tests.", "Today I'm going to…", [['today'], ['going to', 'will', "i'll", 'plan to', 'gonna', 'working on', 'continue', 'want to', 'need to']]),
      g('blocker', 'Avisar do bloqueio', 'Estou bloqueado esperando o acesso ao banco.', "I'm blocked waiting for database access.", "I'm blocked on…", [['blocked', 'blocker', 'blocking', 'stuck', 'waiting for', 'waiting on', "can't", 'cannot', "don't have access", 'no access', 'need access']]),
      g('ask', 'Pedir ajuda a alguém', 'Você pode me ajudar com isso depois da reunião?', 'Could you help me with that after the call?', 'Could you help me with…', [['could you', 'can you', 'would you', 'can someone', 'could someone', 'need help', 'need your help', 'help me']]),
    ],
    beats: [
      { say: "Good morning! Let's start with you. What did you do yesterday?", pt: 'Bom dia! Vamos começar por você. O que você fez ontem?', wants: ['yesterday'], nudge: 'Sorry, what did you work on yesterday?' },
      { say: "Great. And what's the plan for today?", pt: 'Ótimo. E qual o plano para hoje?', wants: ['today'], nudge: 'And today? What are you going to work on?' },
      { say: 'Is anything blocking you on {project}?', pt: 'Tem algo te bloqueando no projeto?', wants: ['blocker'], nudge: 'So nothing is blocking you? Is there anything you are waiting for?' },
      { say: 'What do you need from the team?', pt: 'Do que você precisa do time?', wants: ['ask'], nudge: 'Who can help you, and what should they do?' },
    ],
    closing: "Perfect. I'll ask {teammate} to help you right after this call. Thanks!",
  },
  {
    id: 'ask-help', area: 'trabalho', tags: ['colegas', 'reuniao'], title: 'Pedir ajuda a um colega',
    setting: 'Você está há uma hora preso num erro. O Tom conhece essa parte do sistema. Chame ele, explique o problema e combine um horário.',
    character: { name: 'Tom', role: 'engenheiro sênior', color: '#1d7a6b', voice: 1 },
    goals: [
      g('time', 'Perguntar se ele tem um tempo', 'Você tem alguns minutos?', 'Do you have a few minutes?', 'Do you have…', [['do you have', 'have a minute', 'a few minutes', 'are you free', 'got a minute', 'are you available', 'can i ask', 'quick question', 'do you have time']]),
      g('problem', 'Explicar o problema', 'Estou recebendo um erro quando rodo o job.', "I'm getting an error when I run the job.", "I'm getting an error when…", [['error', 'problem', 'issue', 'bug', 'failing', 'fails', "doesn't work", 'not working', 'broken', 'crashes']]),
      g('tried', 'Dizer o que você já tentou', 'Eu já tentei reiniciar o serviço.', 'I already tried restarting the service.', 'I already tried…', [['tried', 'already', 'checked', 'looked at', 'restarted', 'tested']]),
      g('thanks', 'Agradecer e confirmar o horário', 'Às três está ótimo. Muito obrigado!', 'Three works for me. Thanks a lot!', 'That works for me…', [['thanks', 'thank you', 'appreciate']]),
    ],
    beats: [
      { say: "Hey! What's up?", pt: 'E aí! Tudo bem?', wants: ['time'], nudge: 'Sure. Do you need something from me?' },
      { say: "Yeah, I have a few minutes. What's the problem?", pt: 'Tenho uns minutos. Qual o problema?', wants: ['problem'], nudge: 'What exactly is going wrong?' },
      { say: 'Hmm. What have you tried so far?', pt: 'O que você já tentou?', wants: ['tried'], nudge: 'Did you already try anything to fix it?' },
      { say: "Okay, I think I know what it is. Let's look at it together at three. Does that work?", pt: 'Acho que sei o que é. Vamos olhar juntos às três. Pode ser?', wants: ['thanks'], nudge: "Is three o'clock okay for you?" },
    ],
    closing: 'No problem. See you at three!',
  },
  {
    id: 'disagree', area: 'trabalho', tags: ['reuniao'], title: 'Discordar com educação',
    setting: 'Na reunião, a gerente de produto quer lançar na sexta sem rodar os testes. Você acha arriscado. Mostre que entende o lado dela, discorde, explique o motivo e proponha outra data.',
    character: { name: 'Sara', role: 'gerente de produto', color: '#c2410c', voice: 0 },
    goals: [
      g('ack', 'Mostrar que entende o ponto dela', 'Eu entendo o seu ponto.', 'I see your point.', 'I see your point, but…', [['i see your point', 'i understand', 'i get it', 'that makes sense', 'good point', 'i hear you', 'i know']]),
      g('concern', 'Dizer que está preocupado', 'Mas estou preocupado com o risco.', "But I'm worried about the risk.", "But I'm worried about…", [['worried', 'concern', 'concerned', 'risk', 'risky', "don't think", 'not sure', 'afraid', 'dangerous', 'disagree']]),
      g('reason', 'Explicar o motivo', 'Porque um bug em produção custaria mais tempo.', 'Because a bug in production would cost us more time.', 'Because…', [['because', 'since', 'the reason', 'otherwise', 'if we']]),
      g('propose', 'Propor uma alternativa', 'E se a gente lançar na segunda?', 'What if we release on Monday?', 'What if we…', [['what if', 'how about', 'i suggest', 'i propose', 'we could', "why don't we", 'my suggestion', 'instead', 'i would']]),
    ],
    beats: [
      { say: 'So, I want to release the new feature on Friday. We can skip the tests this time. What do you think?', pt: 'Quero lançar a funcionalidade na sexta. Dá para pular os testes desta vez. O que você acha?', wants: ['ack', 'concern'], nudge: 'Do you agree, or do you see any risk?' },
      { say: 'Why is that a problem? The change is small.', pt: 'Por que isso é um problema? A mudança é pequena.', wants: ['reason'], nudge: 'Can you explain why?' },
      { say: 'Hmm, okay. So what do you suggest?', pt: 'Certo. Então o que você sugere?', wants: ['propose'], nudge: 'Do you have another plan?' },
    ],
    closing: "All right, that sounds reasonable. Let's do that.",
  },
  {
    id: 'bad-news', area: 'trabalho', tags: ['gerente'], title: 'Avisar de um atraso',
    setting: 'A entrega de sexta vai atrasar três dias porque o time de origem mudou o formato dos dados. Avise a gerente, explique a causa, dê uma nova data e diga como evitar isso.',
    character: { name: 'Priya', role: 'gerente de engenharia', color: '#7b3fb0', voice: 0 },
    goals: [
      g('delay', 'Avisar que vai atrasar', 'Infelizmente não vai ficar pronto na sexta.', "Unfortunately, it won't be ready on Friday.", "Unfortunately, it won't…", [['delay', 'delayed', 'late', 'more time', 'not going to finish', "won't finish", "won't be ready", 'not be ready', 'behind', 'postpone', 'miss the deadline']]),
      g('cause', 'Explicar a causa', 'Porque o formato dos dados mudou.', 'Because the data format changed.', 'Because…', [['because', 'due to', 'the reason', 'since', 'caused']]),
      g('date', 'Dar uma nova data', 'Consigo entregar na quarta.', 'I can deliver it by Wednesday.', 'I can deliver it by…', [['monday', 'tuesday', 'wednesday', 'thursday', 'next week', 'more days', 'tomorrow', 'three days', 'two days']]),
      g('prevent', 'Dizer como evitar da próxima vez', 'Vou adicionar um teste para detectar isso.', "I'll add a test to catch this.", "To avoid this, I'll…", [["i'll", 'i will', 'going to', 'to avoid', 'to prevent', 'next time', 'from now on', 'we can', 'we should']]),
    ],
    beats: [
      { say: 'Hi! How is {project} going? Are we on track for Friday?', pt: 'Oi! Como vai o projeto? Estamos no prazo para sexta?', wants: ['delay'], nudge: 'So will it be ready on Friday or not?' },
      { say: 'Oh. What happened?', pt: 'Ah. O que aconteceu?', wants: ['cause'], nudge: 'What caused the delay?' },
      { say: 'I see. When can you deliver it?', pt: 'Entendi. Quando você consegue entregar?', wants: ['date'], nudge: 'I need a date. When will it be ready?' },
      { say: 'Okay. How can we avoid this next time?', pt: 'Certo. Como evitamos isso da próxima vez?', wants: ['prevent'], nudge: 'What are you going to do differently?' },
    ],
    closing: "Thanks for telling me early. I'll update the client.",
  },
  {
    id: 'interview-intro', area: 'trabalho', tags: ['entrevista'], title: 'Entrevista: apresentação',
    setting: 'Primeira etapa de uma entrevista para uma vaga na sua área. Apresente-se, conte um resultado concreto e diga por que quer a vaga.',
    character: { name: 'Daniel', role: 'gestor da vaga', color: '#1f4fbf', voice: 1 },
    goals: [
      g('role', 'Dizer o que você faz', 'Sou engenheiro de dados.', "I'm a data engineer.", "I'm a…", [["i'm a", 'i am a', 'i work as', "i'm an", 'i am an', 'my role', 'i work in', 'i work with']]),
      g('experience', 'Dizer há quanto tempo', 'Trabalho com dados há cinco anos.', "I've been working with data for five years.", "I've been working with… for…", [['years', 'since'], ['experience', "i've", 'i have', 'working', 'worked']]),
      g('result', 'Contar um resultado concreto', 'Reduzi o tempo do pipeline de duas horas para quinze minutos.', 'I reduced the pipeline runtime from two hours to fifteen minutes.', 'I reduced… from… to…', [['reduced', 'increased', 'improved', 'saved', 'built', 'led', 'delivered', 'migrated', 'created', 'automated', 'launched', 'developed']]),
      g('why', 'Dizer por que quer a vaga', 'Tenho interesse na vaga porque quero trabalhar com dados em tempo real.', "I'm interested in this role because I want to work with real-time data.", "I'm interested in this role because…", [['interested', 'excited', 'i want', "i'd like", 'i would like', 'looking for', 'because i']]),
    ],
    beats: [
      { say: 'Thanks for joining. To start, tell me about yourself.', pt: 'Obrigado por vir. Para começar, fale sobre você.', wants: ['role', 'experience'], nudge: 'What do you do now, and for how long have you done it?' },
      { say: 'Interesting. Tell me about something you built that you are proud of.', pt: 'Interessante. Conte algo que você construiu e de que se orgulha.', wants: ['result'], nudge: 'What was the result of that project?' },
      { say: 'Nice. And why are you interested in this position?', pt: 'Legal. E por que você tem interesse nesta vaga?', wants: ['why'], nudge: 'What attracts you to this role?' },
    ],
    closing: "Great, thank you. We'll get back to you by the end of the week.",
  },
  {
    id: 'client-call', area: 'trabalho', tags: ['cliente', 'reuniao'], title: 'Call com cliente: confirmar o pedido',
    setting: 'O cliente pede um relatório novo, de forma vaga. Faça uma pergunta para entender, confirme o que entendeu, combine o que vai enviar e quando, e encerre.',
    character: { name: 'Mark', role: 'cliente', color: '#0e7490', voice: 1 },
    goals: [
      g('clarify', 'Fazer uma pergunta para entender', 'O que você quer dizer com rápido?', 'What do you mean by fast?', 'What do you mean by…', [['what do you mean', 'could you explain', 'can you explain', 'could you clarify', 'can you clarify', 'do you mean', 'what exactly', 'how often', 'how many', 'which']]),
      g('confirm', 'Confirmar o que entendeu', 'Só para confirmar: vocês precisam das vendas diárias por região.', 'Just to confirm: you need daily sales by region.', 'Just to confirm, you need…', [['just to confirm', 'to confirm', 'let me make sure', 'so you need', 'so you want', 'if i understood', 'if i understand', 'to make sure', "you're saying", 'you are saying']]),
      g('commit', 'Combinar o que vai enviar e quando', 'Eu envio uma primeira versão até sexta.', "I'll send you a first version by Friday.", "I'll send you… by…", [["i'll send", 'i will send', "i'll share", 'i will share', "i'll get back", "we'll deliver", "i'll prepare", 'i will prepare', 'send you', 'we can deliver', 'i can send']]),
      g('close', 'Encerrar com educação', 'Obrigado pelo seu tempo. Até breve!', 'Thanks for your time. Talk soon!', 'Thanks for…', [['thank', 'thanks', 'talk soon', 'have a good', 'have a nice', 'see you', 'bye']]),
    ],
    beats: [
      { say: 'Hi! So, we need a new report for the sales team. Something fast.', pt: 'Oi! Precisamos de um relatório novo para o time de vendas. Algo rápido.', wants: ['clarify'], nudge: 'Do you have any questions about what we need?' },
      { say: 'We need daily sales by region, updated every morning before eight.', pt: 'Precisamos das vendas diárias por região, atualizadas toda manhã antes das oito.', wants: ['confirm'], nudge: 'Is that clear? Can you tell me what you understood?' },
      { say: 'Exactly. When can we see a first version?', pt: 'Exato. Quando podemos ver uma primeira versão?', wants: ['commit'], nudge: 'What will you send us, and when?' },
      { say: 'Perfect. Anything else?', pt: 'Perfeito. Mais alguma coisa?', wants: ['close'], nudge: "Okay, I think we're done. Anything to add?" },
    ],
    closing: 'Thanks. Talk soon!',
  },
  {
    id: 'one-on-one', area: 'trabalho', tags: ['gerente'], title: '1:1: pedir feedback e falar de carreira',
    setting: 'É a sua conversa mensal com a gerente. Peça feedback, reaja bem a uma crítica, diga onde quer chegar e pergunte como ela pode te apoiar.',
    character: { name: 'Priya', role: 'gerente de engenharia', color: '#7b3fb0', voice: 0 },
    goals: [
      g('feedback', 'Pedir feedback', 'Eu queria o seu feedback sobre o meu trabalho.', "I'd like your feedback on my work.", "I'd like your feedback on…", [['feedback', 'how am i doing', 'what do you think', 'your opinion', "how i'm doing"]]),
      g('accept', 'Reagir bem à crítica', 'É justo. Vou trabalhar nisso.', "That's fair. I'll work on that.", "That's fair. I'll…", [["that's fair", 'fair point', "you're right", 'you are right', 'i agree', 'i understand', 'makes sense', 'work on', 'improve', 'thanks for']]),
      g('goal', 'Dizer onde quer chegar', 'Quero liderar um projeto no próximo ano.', "I'd like to lead a project next year.", "I'd like to…", [["i'd like to", 'i would like to', 'i want to', 'my goal', 'i plan to', 'i hope to', 'interested in']]),
      g('support', 'Perguntar como ela pode apoiar', 'No que você acha que eu devo focar?', 'What do you think I should focus on?', 'What do you think I should…', [['could i', 'can i', 'would it be possible', 'what should i', 'i should', 'what do you recommend', 'what do you suggest', 'how can i', 'could you help', 'any advice']]),
    ],
    beats: [
      { say: 'Thanks for making time. What would you like to talk about today?', pt: 'Obrigada pelo tempo. Sobre o que você quer falar hoje?', wants: ['feedback'], nudge: 'Do you want to know how you are doing?' },
      { say: "Overall you're doing well. But in meetings you are very quiet, and people don't hear your ideas.", pt: 'No geral você vai bem. Mas nas reuniões fica muito quieto, e as pessoas não ouvem suas ideias.', wants: ['accept'], nudge: 'How do you feel about that?' },
      { say: 'Good. And where do you want to be a year from now?', pt: 'Bom. E onde você quer estar daqui a um ano?', wants: ['goal'], nudge: 'What is your next career goal?' },
      { say: "That's a good goal. How can I help you get there?", pt: 'É uma boa meta. Como posso te ajudar a chegar lá?', wants: ['support'], nudge: 'Is there anything you need from me?' },
    ],
    closing: "Great. Let's check on this again next month.",
  },
  {
    id: 'small-talk', area: 'vida', tags: ['colegas'], title: 'Bate-papo antes da reunião',
    setting: 'Faltam dois minutos para a reunião e só entrou a Emma, de Londres. Responda, devolva a pergunta, conte do seu fim de semana e reaja ao que ela disser.',
    character: { name: 'Emma', role: 'colega de Londres', color: '#b4236b', voice: 0 },
    goals: [
      g('return', 'Responder e devolver a pergunta', 'Estou bem, e você?', "I'm good, and you?", "I'm good, and…", [['and you', 'how about you', 'what about you', 'how are you', 'yourself']]),
      g('weekend', 'Contar algo do fim de semana', 'No sábado eu fui à praia.', 'On Saturday I went to the beach.', 'On Saturday I…', [['weekend', 'saturday', 'sunday'], ['went', 'stayed', 'watched', 'visited', 'had', 'was', 'played', 'cooked', 'traveled', 'travelled', 'met', 'rested', 'relaxed', 'did', 'saw', 'worked']]),
      g('react', 'Reagir ao que ela contou', 'Nossa, que pena!', "Oh no, that's a shame!", "Oh, that's…", [['sounds', 'nice', 'great', 'really', 'wow', 'cool', 'awesome', 'lovely', 'interesting', 'shame', 'pity', 'sorry to hear', 'too bad', 'oh no']]),
      g('question', 'Fazer uma pergunta para ela', 'Você costuma fazer trilha?', 'Do you often go hiking?', 'Do you…', [['did you', 'do you', 'have you', 'are you', 'how was', 'where did', 'what did', 'how is', 'is it', 'was it']]),
    ],
    beats: [
      { say: 'Hi! We have a few minutes before the others join. How are you doing?', pt: 'Oi! Temos uns minutos antes dos outros. Como você está?', wants: ['return'], nudge: "I'm fine, thanks. And how are you?" },
      { say: "I'm good, thanks! How was your weekend?", pt: 'Estou bem! Como foi seu fim de semana?', wants: ['weekend'], nudge: 'Did you do anything fun on Saturday or Sunday?' },
      { say: 'Nice! I went hiking, but it rained all day.', pt: 'Legal! Eu fui fazer trilha, mas choveu o dia todo.', wants: ['react', 'question'], nudge: 'What about you, do you like hiking?' },
    ],
    closing: "Oh, the others are joining. Let's start!",
  },
  {
    id: 'restaurant', area: 'vida', tags: ['restaurante', 'viagem'], title: 'Restaurante: o pedido veio errado',
    setting: 'Você está num restaurante em viagem. Peça uma massa, pergunte algo sobre o prato. O garçom vai trazer o prato errado: avise com educação e, no fim, peça a conta.',
    character: { name: 'Jake', role: 'garçom', color: '#9a6700', voice: 1 },
    goals: [
      g('order', 'Fazer o pedido com educação', 'Eu queria a massa, por favor.', "I'd like the pasta, please.", "I'd like the…", [["i'd like", 'i would like', 'can i have', 'could i have', "i'll have", 'i will have', 'can i get', 'could i get']]),
      g('question', 'Perguntar algo sobre o prato', 'Vem com salada?', 'Does it come with a salad?', 'Does it come with…', [['does it', 'is it', 'what is in', "what's in", 'do you have', 'is there', 'are there', 'come with', 'comes with']]),
      g('problem', 'Avisar que veio errado', 'Com licença, eu pedi a massa, não a salada.', 'Excuse me, I ordered the pasta, not the salad.', 'Excuse me, I ordered…', [['i ordered', 'not what i', 'wrong', 'mistake', 'i asked for', "this isn't", 'this is not', "didn't order", 'did not order']]),
      g('check', 'Pedir a conta', 'Pode trazer a conta, por favor?', 'Could we have the check, please?', 'Could we have…', [['check', 'bill', 'pay']]),
    ],
    beats: [
      { say: 'Hi, welcome! Are you ready to order?', pt: 'Oi, bem-vindo! Já quer pedir?', wants: ['order'], nudge: 'What would you like to eat?' },
      { say: "Good choice. Is there anything you'd like to know about the dish?", pt: 'Boa escolha. Quer saber algo sobre o prato?', wants: ['question'], nudge: 'Any questions about the menu?' },
      { say: 'Here you go: one chicken salad.', pt: 'Aqui está: uma salada de frango.', wants: ['problem'], nudge: 'Is everything okay with your food?' },
      { say: "Oh, I'm so sorry! I'll bring the pasta right away. Anything else?", pt: 'Desculpe! Já trago a massa. Mais alguma coisa?', wants: ['check'], nudge: 'Would you like dessert, or the check?' },
    ],
    closing: 'Of course. Here it is. Have a great evening!',
  },
  {
    id: 'hotel', area: 'vida', tags: ['viagem'], title: 'Hotel: a reserva não aparece',
    setting: 'Você chega ao hotel depois de um voo longo. A recepcionista não acha sua reserva. Diga que tem reserva, peça para ela procurar de novo, pergunte sobre o hotel e agradeça.',
    character: { name: 'Lena', role: 'recepcionista', color: '#4d7c0f', voice: 0 },
    goals: [
      g('reservation', 'Dizer que tem uma reserva', 'Tenho uma reserva no nome de Silva.', 'I have a reservation under the name Silva.', 'I have a reservation under…', [['reservation', 'booking', 'booked', 'reserved']]),
      g('check', 'Pedir para procurar de novo', 'Você pode verificar de novo, por favor?', 'Could you check again, please?', 'Could you check…', [['could you check', 'can you check', 'check again', 'another room', 'available', 'what can you do', 'look again', 'try again', 'confirmation']]),
      g('info', 'Perguntar sobre café, wi-fi ou checkout', 'A que horas é o café da manhã?', 'What time is breakfast?', 'What time is…', [['breakfast', 'wifi', 'wi-fi', 'check out', 'checkout', 'parking', 'gym']]),
      g('thanks', 'Agradecer', 'Muito obrigado pela ajuda.', 'Thank you very much for your help.', 'Thank you for…', [['thank', 'thanks', 'appreciate']]),
    ],
    beats: [
      { say: 'Good evening! How can I help you?', pt: 'Boa noite! Como posso ajudar?', wants: ['reservation'], nudge: 'Do you have a reservation with us?' },
      { say: "Let me see. I'm sorry, I can't find your name in the system.", pt: 'Deixa eu ver. Desculpe, não encontro seu nome no sistema.', wants: ['check'], nudge: 'What would you like me to do?' },
      { say: 'Ah, found it! It was under a different spelling. Room 304, three nights. Would you like to know anything about the hotel?', pt: 'Achei! Estava com outra grafia. Quarto 304, três noites. Quer saber algo sobre o hotel?', wants: ['info'], nudge: 'Any questions about breakfast or checkout?' },
      { say: 'Breakfast is from seven to ten, and checkout is at noon. Here is your key.', pt: 'O café é das sete às dez, e o checkout é ao meio-dia. Aqui está a chave.', wants: ['thanks'], nudge: 'Is there anything else I can do for you?' },
    ],
    closing: 'Enjoy your stay!',
  },
];

export const findMission = (id: string) => MISSIONS.find((m) => m.id === id);

/** "Como se diz?": socorro rápido de vocabulário quando a palavra não vem. */
export const GLOSSARY: Record<string, string> = {
  prazo: 'deadline', atraso: 'delay', atrasado: 'late / delayed', entrega: 'delivery', entregar: 'to deliver', reuniao: 'meeting', pauta: 'agenda',
  bloqueio: 'blocker', bloqueado: 'blocked', acesso: 'access', senha: 'password', erro: 'error', falha: 'failure', bug: 'bug', teste: 'test',
  implantar: 'to deploy', implantacao: 'deployment', reverter: 'to roll back', banco: 'database', tabela: 'table', coluna: 'column', consulta: 'query',
  relatorio: 'report', painel: 'dashboard', cliente: 'client / customer', requisito: 'requirement', prioridade: 'priority', tarefa: 'task',
  demanda: 'request', chamado: 'ticket', equipe: 'team', gerente: 'manager', chefe: 'boss', colega: 'colleague / coworker', estagiario: 'intern',
  aumento: 'raise', promocao: 'promotion', ferias: 'vacation', feriado: 'holiday', folga: 'day off', hora: 'hour / time', 'hora extra': 'overtime',
  resolver: 'to solve / to fix', consertar: 'to fix', melhorar: 'to improve', reduzir: 'to reduce', aumentar: 'to increase', economizar: 'to save',
  alinhar: 'to align / to sync', combinar: 'to agree on / to arrange', marcar: 'to schedule', remarcar: 'to reschedule', adiar: 'to postpone',
  cancelar: 'to cancel', confirmar: 'to confirm', enviar: 'to send', compartilhar: 'to share', revisar: 'to review', aprovar: 'to approve',
  duvida: 'question / doubt', sugestao: 'suggestion', opiniao: 'opinion', risco: 'risk', custo: 'cost', orcamento: 'budget', resultado: 'result',
  meta: 'goal / target', desempenho: 'performance', gargalo: 'bottleneck', dependencia: 'dependency', escopo: 'scope', andamento: 'progress',
  conta: 'check / bill', garcom: 'waiter', cardapio: 'menu', gorjeta: 'tip', reserva: 'reservation', quarto: 'room', chave: 'key', bagagem: 'luggage',
  voo: 'flight', embarque: 'boarding', portao: 'gate', passaporte: 'passport', troco: 'change', recibo: 'receipt', fila: 'line / queue',
  desculpa: 'sorry / excuse me', 'com licenca': 'excuse me', 'por favor': 'please', obrigado: 'thank you', 'de nada': "you're welcome",
  'na verdade': 'actually', 'ou seja': 'I mean / in other words', entao: 'so', enfim: 'anyway', alias: 'by the way', aindaassim: 'still',
  'eu acho': 'I think', 'depende': 'it depends', 'tanto faz': "it doesn't matter", 'faz sentido': 'that makes sense', 'pode ser': 'that works / maybe',
};

const strip = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
export function lookup(pt: string): string | null {
  const k = strip(pt);
  if (!k) return null;
  if (GLOSSARY[k]) return GLOSSARY[k];
  const hit = Object.keys(GLOSSARY).find((key) => k.startsWith(key) || key.startsWith(k));
  return hit && Math.abs(hit.length - k.length) <= 3 ? GLOSSARY[hit] : null;
}
