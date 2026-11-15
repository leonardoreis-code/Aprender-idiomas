import type { Goal } from '../domain/sim/engine';
import type { Meeting } from '../domain/meeting/types';

/**
 * Reuniões ao vivo (ver specs/SPEC-meet.md). Conteúdo original. Cada objetivo
 * tem um exemplo que o próprio detector precisa reconhecer (validado em
 * meetings.test.ts). Os detectores aceitam formas comuns e erros típicos que
 * ainda comunicam a ideia (ex.: "finish" e "finished").
 */
const g = (id: string, label: string, pt: string, example: string, starter: string, detect: string[][]): Goal => ({ id, label, pt, example, starter, detect });

const PAST_OR_BASE = [
  'finished', 'finish', 'worked', 'work', 'fixed', 'fix', 'did', 'do', 'reviewed', 'review', 'deployed', 'deploy', 'tested', 'test',
  'wrote', 'write', 'created', 'create', 'completed', 'complete', 'started', 'start', 'built', 'build', 'implemented', 'implement',
  'updated', 'update', 'was', 'had', 'made', 'merged', 'migrated', 'investigated', 'spent', 'helped', 'paired', 'closed',
];

export const MEETINGS: Meeting[] = [
  {
    id: 'daily-access-blocked',
    kind: 'daily',
    title: 'Daily com acesso bloqueado',
    setting:
      'É a daily do time de dados e a gerente quer tudo rápido. Você avançou ontem, mas está sem acesso ao data warehouse de produção desde a migração de permissões. Conte o que fez, o plano de hoje, deixe claro o bloqueio, peça ajuda a alguém e dê uma previsão de entrega.',
    minutes: 5,
    participants: [
      { id: 'priya', name: 'Priya', role: 'Engineering Manager', voice: 0, look: { skin: 2, hair: 1, hairColor: 0, shirt: '#5b2c83', glasses: true } },
      { id: 'kwame', name: 'Kwame', role: 'Platform Engineer', voice: 1, look: { skin: 4, hair: 3, hairColor: 0, shirt: '#2f5d8a', beard: true } },
      { id: 'lena', name: 'Lena', role: 'Data Analyst', voice: 2, look: { skin: 0, hair: 5, hairColor: 3, shirt: '#2e6b4f' } },
    ],
    goals: [
      g('yesterday', 'Dizer o que você fez ontem', 'Ontem eu terminei o job de ingestão da tabela de pedidos.', 'Yesterday I finished the ingestion job for the orders table.', 'Yesterday I…', [
        ['yesterday', 'last night', 'on friday'],
        PAST_OR_BASE,
      ]),
      g('today', 'Dizer o plano de hoje', 'Hoje eu vou escrever as checagens de qualidade de dados.', "Today I'm going to write the data quality checks.", "Today I'm going to…", [
        ['today', 'this morning', 'this afternoon'],
        ['going to', 'will', "i'll", 'plan to', 'planning to', 'gonna', 'working on', 'work on', 'continue', 'want to', 'need to', 'start', 'finish', 'focus on'],
      ]),
      g('blocker', 'Deixar claro o bloqueio', 'Estou bloqueado porque não tenho acesso ao warehouse de produção.', "I'm blocked because I don't have access to the production warehouse.", "I'm blocked because…", [
        ['blocked', 'blocker', 'blocking', 'stuck', 'waiting for', 'waiting on', "can't", 'cannot', 'no access', "don't have access", "doesn't have access",
          'not have access', 'without access', 'need access', 'need permission', "don't have permission", 'access denied', 'permission denied', 'lost access'],
      ]),
      g('ask', 'Pedir que alguém resolva', 'Você pode me dar acesso ao warehouse hoje?', 'Could you give me access to the warehouse today?', 'Could you…', [
        ['could you', 'can you', 'would you', 'can someone', 'could someone', 'can anyone', 'could anyone', 'need help', 'need your help', 'help me', 'is it possible', 'please give', 'please grant'],
      ]),
      g('eta', 'Dar uma previsão de entrega', 'Se eu tiver acesso hoje, deve ficar pronto até quinta.', 'If I get access today, it should be done by Thursday.', 'It should be done by…', [
        ['done', 'ready', 'finish', 'finished', 'complete', 'completed', 'wrap up', 'deliver', 'merge', 'merged', 'live'],
        ['by', 'until', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'end of the day', 'eod', 'next week', 'this week', 'in two days', 'in a couple of days'],
      ]),
    ],
    agenda: [
      {
        before: [
          { by: 'priya', say: "Morning, everyone. Let's keep it quick, I've got a hard stop at ten." },
          { by: 'kwame', say: 'Quick one from me: the cluster upgrade went fine last night. No surprises.' },
          { by: 'priya', say: 'Love that. Okay, {you}, you\'re up.' },
        ],
        by: 'priya',
        say: 'So, {you}, what did you get done yesterday?',
        pt: 'Então, o que você conseguiu fazer ontem?',
        wants: ['yesterday'],
        nudge: 'Sorry, I missed that. What did you work on yesterday?',
      },
      {
        by: 'priya',
        say: "Cool. And what's on your plate today?",
        pt: 'Legal. E o que você tem para hoje?',
        wants: ['today'],
        nudge: "So what's the plan for today? Still on {project}?",
        nudgeBy: 'lena',
      },
      {
        before: [
          { by: 'kwame', say: 'By the way, I saw a ticket about warehouse permissions this morning.' },
          { by: 'lena', say: 'Yeah, a few people lost access after the role migration. Super annoying.' },
        ],
        by: 'priya',
        say: '{you}, is anything slowing you down? Anything you need from us?',
        pt: 'Tem alguma coisa te atrasando? Precisa de algo da gente?',
        wants: ['blocker', 'ask'],
        nudge: "Hold on. Is something blocking you? And who do you need help from?",
      },
      {
        before: [
          { by: 'lena', say: "Okay, that explains it. I'm kind of waiting on your table for my dashboard." },
          { by: 'priya', say: 'Good to know. Let\'s get a date, then.' },
        ],
        by: 'lena',
        say: 'Once you have access, when do you think it\'ll be ready?',
        pt: 'Quando você tiver acesso, quando acha que fica pronto?',
        wants: ['eta'],
        nudge: "Just a rough date is fine. Even a guess helps me plan.",
      },
    ],
    closing: { by: 'priya', say: "Great. Kwame, can you sort out that access right after the call? Thanks, everyone, see you tomorrow." },
  },
  {
    id: 'planning-churn-report',
    kind: 'planning',
    title: 'Planning: estimar e apontar riscos',
    setting:
      'Planejamento da sprint. O produto quer um relatório de churn de clientes antes da revisão trimestral e você vai cuidar do pipeline. Tire uma dúvida, dê uma estimativa, aponte o risco, proponha dividir a entrega e se comprometa com uma parte.',
    minutes: 7,
    participants: [
      { id: 'diego', name: 'Diego', role: 'Product Manager', voice: 1, look: { skin: 1, hair: 0, hairColor: 1, shirt: '#8a3b2f', beard: true } },
      { id: 'hannah', name: 'Hannah', role: 'Tech Lead', voice: 2, look: { skin: 0, hair: 2, hairColor: 2, shirt: '#2b4a6f', glasses: true } },
    ],
    goals: [
      g('clarify', 'Tirar uma dúvida sobre o pedido', 'Só para esclarecer, precisamos dos dados em tempo real ou diário basta?', 'Just to clarify, do we need the data in real time or is daily enough?', 'Just to clarify…', [
        ['just to clarify', 'to clarify', 'just to confirm', 'do you mean', 'what do you mean', 'does that mean', 'so you want', 'do we need', 'does it need', 'should it',
          'could you explain', 'can you explain', 'what about', 'which', 'who is', 'when do', 'how often', 'is it', 'are we talking about'],
      ]),
      g('estimate', 'Dar uma estimativa', 'Acho que leva uns cinco dias.', "I think it'll take about five days.", 'I think it will take…', [
        ['day', 'days', 'week', 'weeks', 'points', 'story points', 'hours', 'sprint', 'sprints'],
        ['think', 'probably', 'around', 'about', 'maybe', 'roughly', 'estimate', 'take', 'takes', 'need', "i'd say", 'i would say', 'guess', 'more or less'],
      ]),
      g('risk', 'Apontar um risco', 'O maior risco é a API de origem. Ela pode mudar sem aviso.', 'The biggest risk is the source API. It might change without notice.', 'The biggest risk is…', [
        ['risk', 'risks', 'risky', 'worried', 'worry', 'concern', 'concerned', 'might', 'may', 'could break', 'not sure', 'depends', 'dependency', 'unknown', 'afraid', 'problem'],
      ]),
      g('split', 'Propor dividir a entrega', 'E se a gente dividir e começar pelo lote diário?', 'What if we split it and start with the daily batch first?', 'What if we…', [
        ['split', 'break it', 'break this', 'first version', 'mvp', 'phase', 'phases', 'start with', 'first step', 'smaller', 'part', 'parts', 'scope', 'what if', 'how about', 'we could'],
      ]),
      g('commit', 'Se comprometer com algo', 'Eu consigo me comprometer com a primeira parte nesta sprint.', 'I can commit to the first part this sprint.', 'I can commit to…', [
        ['can commit', 'commit to', 'i can do', 'i can take', 'i can have', 'i can finish', 'i can deliver', 'we can deliver', "i'll take", "i'll do", "i'll own",
          'i will take', 'i will do', 'i will finish', 'i take', 'i do the', 'works for me'],
      ]),
    ],
    agenda: [
      {
        before: [
          { by: 'diego', say: 'So, the big item this sprint is the customer churn report. Sales wants it before the quarterly review.' },
          { by: 'hannah', say: "We touched that data last year. It wasn't pretty." },
          { by: 'diego', say: "Ha, yeah. {you}, you'd own the pipeline side." },
        ],
        by: 'diego',
        say: 'Any questions before we size it, {you}?',
        pt: 'Alguma dúvida antes de estimarmos?',
        wants: ['clarify'],
        nudge: "Anything unclear? Now's the time to ask.",
        nudgeBy: 'hannah',
      },
      {
        by: 'hannah',
        say: 'Okay. So, gut feeling, how long would the pipeline part take you?',
        pt: 'Certo. No feeling, quanto tempo a parte do pipeline levaria?',
        wants: ['estimate'],
        nudge: 'Ballpark is fine. A few days? A week?',
      },
      {
        before: [
          { by: 'diego', say: "Hmm, that's more than I was hoping for." },
          { by: 'hannah', say: "Honestly, it's realistic. The source system is a mess." },
        ],
        by: 'diego',
        say: 'What could go wrong here, {you}? What are the risks?',
        pt: 'O que pode dar errado aqui? Quais são os riscos?',
        wants: ['risk'],
        nudge: 'Like, is there anything that could blow up the estimate?',
        nudgeBy: 'hannah',
      },
      {
        before: [
          { by: 'diego', say: 'The thing is, Sales really wants something in two weeks.' },
          { by: 'hannah', say: "We can't do all of it in two weeks. Not safely." },
        ],
        by: 'hannah',
        say: "{you}, is there a way to make that work without cutting corners?",
        pt: 'Tem um jeito de fazer isso funcionar sem fazer gambiarra?',
        wants: ['split'],
        nudge: 'Could we deliver a smaller piece first?',
      },
      {
        by: 'diego',
        say: 'Okay, so what can you actually commit to this sprint?',
        pt: 'Certo, então com o que você consegue se comprometer nesta sprint?',
        wants: ['commit'],
        nudge: 'I need a clear yes on something. What can you take?',
      },
    ],
    closing: { by: 'diego', say: "Perfect. I'll update the board and let Sales know what to expect. Thanks, both." },
  },
  {
    id: 'incident-stale-dashboards',
    kind: 'incident',
    title: 'Incidente: dashboards desatualizados',
    setting:
      'Você está de plantão e os dashboards de vendas pararam de atualizar. Entrou numa chamada de incidente com a coordenadora, um SRE e o suporte. Explique o status, a causa provável, o que já fez, quando volta ao normal e como evitar que aconteça de novo.',
    minutes: 6,
    participants: [
      { id: 'mei', name: 'Mei', role: 'Incident Commander', voice: 2, look: { skin: 1, hair: 1, hairColor: 0, shirt: '#3d3d6b' } },
      { id: 'lukas', name: 'Lukas', role: 'Site Reliability Engineer', voice: 1, look: { skin: 0, hair: 0, hairColor: 3, shirt: '#355e3b', glasses: true, beard: true } },
      { id: 'fatima', name: 'Fatima', role: 'Support Lead', voice: 0, look: { skin: 3, hair: 4, hairColor: 0, shirt: '#7a2e4d' } },
    ],
    goals: [
      g('status', 'Explicar o que está quebrado', 'Os dashboards de vendas estão com dados desatualizados desde as seis da manhã.', 'The sales dashboards are showing stale data since six a.m.', 'The dashboards are…', [
        ['dashboard', 'dashboards', 'report', 'reports', 'data', 'numbers', 'pipeline', 'job', 'jobs', 'table', 'tables'],
        ['down', 'broken', 'failing', 'failed', 'fail', 'not loading', 'not working', "isn't working", "aren't working", 'stale', 'wrong', 'missing', 'delayed',
          'empty', 'outdated', 'stopped', 'stuck', 'not updating', "isn't updating", "aren't updating", 'old'],
      ]),
      g('cause', 'Dizer a causa provável', 'Parece que uma mudança de schema na tabela de origem quebrou o job.', 'It looks like a schema change in the source table broke the job.', 'It looks like…', [
        ['because', 'caused', 'cause', 'due to', 'root cause', 'the reason', 'looks like', 'it seems', 'seems like', 'seems that', 'turns out', 'i think', 'probably', 'after the'],
      ]),
      g('fix', 'Contar o que já foi feito', 'Nós revertemos a mudança e rodamos o job de novo.', 'We rolled back the change and reran the job.', 'We rolled back…', [
        ['rolled back', 'roll back', 'rollback', 'reverted', 'revert', 'restarted', 'restart', 'reran', 'rerun', 're ran', 're run', 'fixed', 'fix', 'patched', 'hotfix',
          'deployed', 'backfill', 'backfilled', 'paused', 'disabled', 'triggered'],
      ]),
      g('eta', 'Dar uma previsão de normalização', 'Os dados devem voltar ao normal em uns trinta minutos.', 'The data should be back to normal in about thirty minutes.', 'It should be back to normal in…', [
        ['should', 'will', "it'll", "we'll", 'expect', 'probably', 'hopefully', 'estimate', 'think', 'maybe', 'around', 'about'],
        ['minute', 'minutes', 'hour', 'hours', 'noon', 'by', 'soon', 'pm', 'am', "o'clock", 'back to normal', 'back up'],
      ]),
      g('prevent', 'Propor como evitar de novo', 'Daqui pra frente, vamos adicionar uma checagem de schema e um alerta antes do job rodar.', "Going forward, we'll add a schema check and an alert before the job runs.", 'Going forward, we…', [
        ['next time', 'prevent', 'avoid', 'make sure', 'going forward', 'from now on', 'in the future', 'alert', 'alerts', 'monitoring', 'monitor', 'test', 'tests',
          'check', 'checks', 'validation', 'contract', 'postmortem', 'post mortem', 'action item'],
      ]),
    ],
    agenda: [
      {
        before: [
          { by: 'mei', say: 'Okay, thanks for jumping on, everyone. Support is getting tickets about the sales dashboards.' },
          { by: 'fatima', say: "Three customers so far. They're saying the numbers haven't changed since this morning." },
          { by: 'mei', say: "Right. {you}, you're on call, so let's start with you." },
        ],
        by: 'mei',
        say: 'What are you seeing right now, {you}?',
        pt: 'O que você está vendo agora?',
        wants: ['status'],
        nudge: 'Sorry, can you give us the current status? What exactly is broken?',
      },
      {
        before: [
          { by: 'lukas', say: 'Infra looks fine on my side. CPU, memory, disk, all normal.' },
          { by: 'mei', say: "Good, so it's probably not the cluster." },
        ],
        by: 'lukas',
        say: 'Do you have any idea what caused it?',
        pt: 'Você tem ideia do que causou isso?',
        wants: ['cause'],
        nudge: 'Do we have a root cause yet, or at least a theory?',
        nudgeBy: 'mei',
      },
      {
        by: 'mei',
        say: 'Okay. What have you done so far to fix it?',
        pt: 'Certo. O que você já fez para corrigir?',
        wants: ['fix'],
        nudge: "What's the mitigation? Did you roll anything back?",
      },
      {
        before: [
          { by: 'fatima', say: 'I need to tell customers something in the next ten minutes.' },
          { by: 'mei', say: "Fair. {you}, can you help Fatima out here?" },
        ],
        by: 'fatima',
        say: 'When will the numbers be correct again?',
        pt: 'Quando os números vão estar certos de novo?',
        wants: ['eta'],
        nudge: 'I just need a rough time. Thirty minutes? Two hours?',
      },
      {
        by: 'mei',
        say: 'Last thing before we drop. How do we stop this from happening again?',
        pt: 'Última coisa antes de sair. Como a gente evita que isso aconteça de novo?',
        wants: ['prevent'],
        nudge: 'Any action items? An alert, a check, something like that?',
        nudgeBy: 'lukas',
      },
    ],
    closing: { by: 'mei', say: "Nice work, everyone. I'll write up the summary, and let's do a short postmortem tomorrow." },
  },
  {
    id: 'client-delay-call',
    kind: 'client',
    title: 'Call com cliente: explicar atraso',
    setting:
      'Call com uma cliente que esperava a integração de dados pronta esta semana. Ela está incomodada. Avise do atraso, explique o motivo, reconheça o incômodo dela, proponha uma nova data e ofereça algo enquanto isso.',
    minutes: 7,
    participants: [
      { id: 'charlotte', name: 'Charlotte', role: 'Head of Operations', voice: 0, look: { skin: 0, hair: 1, hairColor: 4, shirt: '#4a3b6b', glasses: true } },
      { id: 'kenji', name: 'Kenji', role: 'Account Manager', voice: 1, look: { skin: 1, hair: 0, hairColor: 0, shirt: '#1f4e5f' } },
    ],
    goals: [
      g('delay', 'Avisar que vai atrasar', 'Infelizmente a integração vai atrasar uma semana.', 'Unfortunately, the integration is going to be one week late.', 'Unfortunately, it is going to be…', [
        ['delay', 'delayed', 'late', 'more time', 'behind', 'not ready', "won't be ready", "isn't ready", 'not going to be ready', 'postpone', 'push', 'pushed',
          'move the date', 'new date', 'miss', 'extra week', 'another week', 'not on track', 'off track'],
      ]),
      g('reason', 'Explicar o motivo', 'É porque encontramos registros duplicados nos dados de clientes de vocês.', "That's because we found duplicate records in your customer data.", "That's because…", [
        ['because', 'due to', 'the reason', 'since', 'caused by', 'we found', 'we discovered', 'we find', 'turned out', 'turns out'],
      ]),
      g('apologize', 'Reconhecer o incômodo e se desculpar', 'Eu entendo e sinto muito pelo atraso.', "I understand, and I'm really sorry about the delay.", 'I understand, and I am sorry…', [
        ['sorry', 'apologize', 'apologise', 'apologies', 'i understand', 'i know', 'i get it', 'i hear you', 'frustrating', 'my fault', 'our fault'],
      ]),
      g('newdate', 'Propor uma nova data', 'Conseguimos deixar pronto até a próxima sexta.', 'We can have it ready by next Friday.', 'We can have it ready by…', [
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'next week', 'end of the month', 'end of next week', 'the 20th', '20th', '15th', 'in two weeks', 'in one week', 'in a week'],
        ['deliver', 'delivered', 'ready', 'done', 'finish', 'finished', 'live', 'go live', 'launch', 'send', 'ship', 'have it', 'complete', 'completed'],
      ]),
      g('offer', 'Oferecer algo enquanto isso', 'Enquanto isso, podemos compartilhar uma prévia com os dados limpos na quarta.', 'In the meantime, we can share a preview with the clean data on Wednesday.', 'In the meantime, we can…', [
        ['in the meantime', 'meanwhile', 'partial', 'first part', 'preview', 'sample', 'demo', 'we can send', 'we could send', 'we can share', 'we could share',
          'share', 'updates', 'every day', 'daily update', 'weekly update', 'until then'],
      ]),
    ],
    agenda: [
      {
        before: [
          { by: 'kenji', say: 'Hi Charlotte, thanks for making the time. I brought {you} from our data team.' },
          { by: 'charlotte', say: "Hi, both. I'll be honest, I was expecting to see the integration live by now." },
          { by: 'kenji', say: "Right, that's exactly why we wanted to talk." },
        ],
        by: 'kenji',
        say: '{you}, could you give Charlotte an update on where we are?',
        pt: 'Você pode atualizar a Charlotte sobre onde estamos?',
        wants: ['delay'],
        nudge: "Maybe start with the timeline. Are we on track or not?",
      },
      {
        by: 'charlotte',
        say: "Hmm. That's not great news. What happened?",
        pt: 'Hum. Não é uma boa notícia. O que aconteceu?',
        wants: ['reason'],
        nudge: 'I need to understand why. What went wrong?',
      },
      {
        before: [
          { by: 'charlotte', say: 'My team has been planning around this date for a month.' },
          { by: 'kenji', say: "We know. And we don't take that lightly." },
        ],
        by: 'charlotte',
        say: 'Honestly, this puts me in a tough spot with my boss. You see that, right?',
        pt: 'Sinceramente, isso me deixa numa situação difícil com meu chefe. Você entende, né?',
        wants: ['apologize'],
        nudge: "{you}, I think it's fair to acknowledge that. It's been a rough week for Charlotte.",
        nudgeBy: 'kenji',
      },
      {
        before: [
          { by: 'kenji', say: "Let's lock in a new date today." },
          { by: 'charlotte', say: 'Yes, please. A real one this time.' },
        ],
        by: 'charlotte',
        say: 'So when can I actually count on it?',
        pt: 'Então quando eu posso realmente contar com isso?',
        wants: ['newdate'],
        nudge: 'I need a specific date I can share with my team.',
      },
      {
        by: 'charlotte',
        say: "And until then? My team can't just sit and wait.",
        pt: 'E até lá? Meu time não pode ficar parado esperando.',
        wants: ['offer'],
        nudge: 'Is there anything we could deliver earlier, even partially?',
        nudgeBy: 'kenji',
      },
    ],
    closing: { by: 'charlotte', say: "Okay. Please send me that in writing, and let's check in again on Wednesday." },
  },
  {
    id: 'interview-data-platform',
    kind: 'interview',
    title: 'Entrevista técnica: projeto e comportamento',
    setting:
      'Entrevista para uma vaga num time de plataforma de dados, com a gerente e um engenheiro sênior. Apresente-se, conte um projeto do qual se orgulha com o resultado em números, fale de uma situação difícil com outro time e faça uma pergunta no final.',
    minutes: 8,
    participants: [
      { id: 'nadia', name: 'Nadia', role: 'Hiring Manager', voice: 2, look: { skin: 2, hair: 2, hairColor: 0, shirt: '#2d4d6e' } },
      { id: 'tomasz', name: 'Tomasz', role: 'Senior Data Engineer', voice: 1, look: { skin: 0, hair: 4, hairColor: 2, shirt: '#5a4632', glasses: true, beard: true } },
    ],
    goals: [
      g('intro', 'Apresentar-se com cargo e experiência', 'Sou engenheiro de dados e trabalho com pipelines há cinco anos.', "I'm a data engineer and I've been working with pipelines for five years.", "I'm a … and I've been…", [
        ["i'm a", "i'm an", 'i am a', 'i am an', 'i work as', "i've been", 'i have been', "i've worked", 'i have worked', 'i work', 'currently', 'my name is'],
        ['engineer', 'analyst', 'developer', 'scientist', 'data', 'years', 'year', 'role', 'team'],
      ]),
      g('project', 'Descrever um projeto seu', 'Eu construí um pipeline que processa dez milhões de eventos por dia.', 'I built a pipeline that processes ten million events a day.', 'I built…', [
        ['i built', 'i build', 'i created', 'i create', 'i designed', 'i design', 'i developed', 'i develop', 'i led', 'i implemented', 'i worked on', 'i work on',
          'we built', 'we build', 'we created', 'we developed', 'we migrated', 'i migrated', 'was responsible', 'my project', 'the project'],
      ]),
      g('result', 'Mostrar o resultado com números', 'Isso reduziu o tempo de processamento de quatro horas para vinte minutos.', 'It reduced the processing time from four hours to twenty minutes.', 'It reduced… from … to…', [
        ['reduced', 'reduce', 'improved', 'improve', 'increased', 'increase', 'saved', 'save', 'cut', 'faster', 'cheaper', 'percent', 'half', 'less time', 'hours', 'minutes'],
      ]),
      g('challenge', 'Contar uma situação difícil e o que você fez', 'Foi uma situação difícil com outro time, então marquei uma call e combinamos um contrato de dados.', 'It was a difficult situation with another team, so I set up a call and we agreed on a data contract.', 'It was a difficult situation, so I…', [
        ['difficult', 'hard', 'hardest', 'challenge', 'challenging', 'biggest challenge', 'problem', 'conflict', 'disagreed', 'disagree', 'mistake', 'failed', 'tough', 'pressure'],
        ['i talked', 'i spoke', 'i explained', 'i asked', 'i decided', 'i proposed', 'i suggested', 'i set up', 'i organized', 'i learned', 'i learnt', 'i realized',
          'we talked', 'we agreed', 'so i', 'then i', 'what i did'],
      ]),
      g('question', 'Fazer uma pergunta aos entrevistadores', 'Como é uma semana típica do time?', 'What does a typical week look like for the team?', 'What does…', [
        ['what does', 'what is', "what's", 'what are', 'how does', 'how do', 'how big', 'how many', 'could you tell', 'can you tell', "i'd like to know", 'i would like to know',
          'i was wondering', 'what kind', 'what would', 'who would', 'is there', 'are there', 'do you'],
      ]),
    ],
    agenda: [
      {
        before: [
          { by: 'nadia', say: "Thanks for joining us. I'm Nadia, I lead the data platform team." },
          { by: 'tomasz', say: "And I'm Tomasz, one of the engineers. I'll ask some technical stuff later, nothing scary." },
          { by: 'nadia', say: "Let's start easy." },
        ],
        by: 'nadia',
        say: 'So, {you}, tell us a bit about yourself and what you do today.',
        pt: 'Então, conte um pouco sobre você e o que você faz hoje.',
        wants: ['intro'],
        nudge: 'Maybe start with your current role. What do you do day to day?',
      },
      {
        by: 'tomasz',
        say: "Cool. Can you walk me through a project you're proud of?",
        pt: 'Legal. Você pode me contar sobre um projeto do qual se orgulha?',
        wants: ['project'],
        nudge: 'Just pick one. What did you build, and what was your part?',
      },
      {
        by: 'tomasz',
        say: 'Nice. And what was the impact? Did you measure anything?',
        pt: 'Bacana. E qual foi o impacto? Você mediu alguma coisa?',
        wants: ['result'],
        nudge: 'Any numbers? Time saved, costs, something like that?',
        nudgeBy: 'nadia',
      },
      {
        before: [
          { by: 'nadia', say: 'We work with a lot of teams here, and priorities clash all the time.' },
          { by: 'tomasz', say: "Yeah, that's half the job, honestly." },
        ],
        by: 'nadia',
        say: '{you}, tell me about a time things got difficult with another team. What did you do?',
        pt: 'Me conte sobre uma vez em que as coisas ficaram difíceis com outro time. O que você fez?',
        wants: ['challenge'],
        nudge: 'And what exactly did you do to sort it out?',
      },
      {
        before: [
          { by: 'tomasz', say: "That's all from my side. Thanks, that was helpful." },
          { by: 'nadia', say: "Same here. We've still got a few minutes." },
        ],
        by: 'nadia',
        say: 'Do you have any questions for us?',
        pt: 'Você tem alguma pergunta para nós?',
        wants: ['question'],
        nudge: 'Anything about the team, the stack, how we work?',
        nudgeBy: 'tomasz',
      },
    ],
    closing: { by: 'nadia', say: "Great question. We'll get back to you by the end of the week. Thanks a lot, {you}." },
  },
  {
    id: 'sprint-retro',
    kind: 'retro',
    title: 'Retrospectiva da sprint',
    setting:
      'Retro da sprint com o time. Houve mudanças de escopo de última hora que atrapalharam os testes. Diga o que foi bem, o que não foi, o impacto disso, proponha uma ação concreta e assuma a responsabilidade por ela.',
    minutes: 6,
    participants: [
      { id: 'sipho', name: 'Sipho', role: 'Scrum Master', voice: 1, look: { skin: 4, hair: 0, hairColor: 0, shirt: '#3b5b7a', glasses: true } },
      { id: 'elena', name: 'Elena', role: 'Analytics Engineer', voice: 0, look: { skin: 1, hair: 5, hairColor: 1, shirt: '#6b2f4a' } },
      { id: 'yusuf', name: 'Yusuf', role: 'Backend Engineer', voice: 2, look: { skin: 3, hair: 0, hairColor: 0, shirt: '#2f6b5e', beard: true } },
    ],
    goals: [
      g('well', 'Dizer o que foi bem', 'Acho que as sessões de pareamento foram bem.', 'I think the pairing sessions went well.', 'I think … went well.', [
        ['went well', 'went really well', 'worked well', 'worked really well', 'good', 'great', 'liked', 'helped', 'happy', 'nice', 'awesome', 'proud', 'smooth', 'better'],
      ]),
      g('wrong', 'Dizer o que não foi bem', 'O que não foi bem foram as mudanças de escopo de última hora.', "What didn't go well was the last minute changes in scope.", "What didn't go well was…", [
        ["didn't go well", 'did not go well', 'went wrong', "didn't work", 'bad', 'problem', 'problems', 'issue', 'issues', 'hard', 'difficult', 'too many', 'too much',
          'not enough', 'last minute', 'frustrating', 'slow', 'struggled', 'messy'],
      ]),
      g('impact', 'Explicar o impacto', 'Perdemos dois dias de testes, então o release atrasou.', 'We lost two days of testing, so the release was late.', 'Because of that…', [
        ['because', 'so we', 'so i', 'so the', 'which', 'that means', 'that meant', 'it meant', 'as a result', 'we lost', 'i lost', 'we had to', 'i had to', 'affected', 'delayed'],
      ]),
      g('action', 'Propor uma ação concreta', 'Na próxima sprint, deveríamos congelar o escopo depois do planning.', 'Next sprint, we should freeze the scope after planning.', 'Next sprint, we should…', [
        ['we should', 'we could', "let's", 'let us', 'i suggest', 'i propose', 'what if', 'how about', 'next sprint', 'from now on', 'going forward', 'we need to', 'maybe we', 'try to'],
      ]),
      g('own', 'Assumir a ação', 'Eu posso cuidar disso e criar um lembrete para o time.', 'I can own that and set up a reminder for the team.', 'I can…', [
        ['i can', "i'll", 'i will', 'i could', 'i volunteer', 'i take', 'leave it with me', 'i own', 'i do it', 'i can do it'],
      ]),
    ],
    agenda: [
      {
        before: [
          { by: 'sipho', say: 'Alright, welcome to the retro. Same format as always: good stuff, bad stuff, and actions.' },
          { by: 'elena', say: "I'll start. The new test setup saved me a ton of time." },
          { by: 'yusuf', say: 'Agreed. Deployments felt way less scary this sprint.' },
        ],
        by: 'sipho',
        say: 'Love it. {you}, what went well for you this sprint?',
        pt: 'Adorei. O que foi bem para você nesta sprint?',
        wants: ['well'],
        nudge: 'Anything at all. Even something small that helped you.',
      },
      {
        by: 'sipho',
        say: "And what didn't go so well?",
        pt: 'E o que não foi tão bem?',
        wants: ['wrong'],
        nudge: "Come on, there's always something. What bugged you?",
        nudgeBy: 'elena',
      },
      {
        before: [
          { by: 'yusuf', say: 'Yeah, I felt that too.' },
          { by: 'elena', say: 'Same. It kind of snowballed at the end.' },
        ],
        by: 'yusuf',
        say: 'How did that affect your work, {you}?',
        pt: 'Como isso afetou o seu trabalho?',
        wants: ['impact'],
        nudge: 'What happened as a result, though?',
      },
      {
        before: [
          { by: 'sipho', say: "That's the second sprint in a row with this, right?" },
          { by: 'elena', say: "Yep. We keep saying we'll fix it, and then we don't." },
        ],
        by: 'sipho',
        say: 'Okay, {you}. So what should we change next sprint?',
        pt: 'Certo. Então o que devemos mudar na próxima sprint?',
        wants: ['action'],
        nudge: 'Give us one concrete thing we can try.',
      },
      {
        by: 'sipho',
        say: 'I like that. Who wants to own it?',
        pt: 'Gostei. Quem quer cuidar disso?',
        wants: ['own'],
        nudge: '{you}, it was your idea. Want to take it?',
        nudgeBy: 'yusuf',
      },
    ],
    closing: { by: 'sipho', say: "Perfect. I'll add it to the board. Thanks, everyone, solid sprint." },
  },
];
