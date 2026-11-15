/**
 * Banco do Checkpoint de fala. Três formas paralelas (A, B, C): mesmas 12
 * categorias gramaticais na mesma ordem, tamanho parecido. NENHUMA frase
 * aparece no curso (garantido por teste) — mede transferência, não decoreba.
 */
export type CheckCategory =
  | 'sujeito-it' | 'terceira-pessoa' | 'pergunta-do' | 'negativa' | 'passado' | 'pergunta-did'
  | 'futuro' | 'perfect' | 'there-is' | 'modal' | 'preposicao-final' | 'conector';

export const CATEGORY_LABEL: Record<CheckCategory, string> = {
  'sujeito-it': 'Sujeito "it"', 'terceira-pessoa': '3ª pessoa (-s)', 'pergunta-do': 'Pergunta com do/does', negativa: 'Negativa',
  passado: 'Passado', 'pergunta-did': 'Pergunta com did', futuro: 'Futuro', perfect: 'Present perfect', 'there-is': '"Tem" = there is/are',
  modal: 'Modais', 'preposicao-final': 'Preposição no final', conector: 'Frase com conector',
};

export interface CheckItem {
  id: string;
  cat: CheckCategory;
  pt: string;
  /** en[0] é a forma canônica; as demais também são aceitas. */
  en: string[];
}

export interface CheckForm {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  items: CheckItem[];
  prompts: { en: string; pt: string }[];
}

const it = (id: string, cat: CheckCategory, pt: string, ...en: string[]): CheckItem => ({ id, cat, pt, en });

export const FORMS: CheckForm[] = [
  {
    id: 'A',
    items: [
      it('A01', 'sujeito-it', 'Está tarde e estou cansado.', "It's late and I'm tired."),
      it('A02', 'terceira-pessoa', 'Minha chefe mora em Londres.', 'My boss lives in London.'),
      it('A03', 'pergunta-do', 'Seu time usa Python?', 'Does your team use Python?'),
      it('A04', 'negativa', 'Eu não conheço esse cliente.', "I don't know this client.", "I don't know that client.", "I don't know this customer."),
      it('A05', 'passado', 'Semana passada eu comprei um carro novo.', 'Last week I bought a new car.', 'I bought a new car last week.'),
      it('A06', 'pergunta-did', 'Você viu meu e-mail ontem?', 'Did you see my email yesterday?'),
      it('A07', 'futuro', 'Amanhã eu vou apresentar os resultados.', "Tomorrow I'm going to present the results.", "I'm going to present the results tomorrow.", 'Tomorrow I will present the results.', 'I will present the results tomorrow.', "I'm presenting the results tomorrow.", "Tomorrow I'm presenting the results."),
      it('A08', 'perfect', 'Faz três anos que eu moro aqui.', "I've lived here for three years.", "I've been living here for three years."),
      it('A09', 'there-is', 'Tem dois erros no relatório.', 'There are two errors in the report.', 'There are two mistakes in the report.'),
      it('A10', 'modal', 'Você deveria falar com ela.', 'You should talk to her.', 'You should speak to her.', 'You should talk with her.', 'You should speak with her.'),
      it('A11', 'preposicao-final', 'Com quem você trabalha?', 'Who do you work with?', 'Whom do you work with?', 'With whom do you work?'),
      it('A12', 'conector', 'Eu me atrasei porque o trânsito estava horrível.', 'I was late because the traffic was terrible.', 'I was late because the traffic was awful.', 'I was late because the traffic was horrible.', 'I arrived late because the traffic was terrible.', 'I was late because traffic was terrible.'),
    ],
    prompts: [
      { en: 'Describe your current job and what you did at work yesterday.', pt: 'Descreva seu trabalho atual e o que você fez ontem no trabalho.' },
      { en: 'Talk about a problem you solved recently and how you solved it.', pt: 'Fale de um problema que você resolveu recentemente e como resolveu.' },
    ],
  },
  {
    id: 'B',
    items: [
      it('B01', 'sujeito-it', 'Está frio hoje e é cedo.', "It's cold today and it's early."),
      it('B02', 'terceira-pessoa', 'Meu irmão trabalha num hospital.', 'My brother works at a hospital.', 'My brother works in a hospital.'),
      it('B03', 'pergunta-do', 'Seu gerente fala espanhol?', 'Does your manager speak Spanish?'),
      it('B04', 'negativa', 'Ela não gosta de reuniões longas.', "She doesn't like long meetings."),
      it('B05', 'passado', 'Ontem eu perdi meu ônibus.', 'Yesterday I missed my bus.', 'I missed my bus yesterday.', 'Yesterday I missed the bus.', 'I missed the bus yesterday.'),
      it('B06', 'pergunta-did', 'Você terminou o relatório?', 'Did you finish the report?', 'Have you finished the report?'),
      it('B07', 'futuro', 'Semana que vem a gente vai contratar duas pessoas.', "Next week we're going to hire two people.", "We're going to hire two people next week.", 'Next week we will hire two people.', 'We will hire two people next week.', "We're hiring two people next week.", "Next week we're hiring two people."),
      it('B08', 'perfect', 'Faz seis meses que eu toco violão.', "I've been playing the guitar for six months.", "I've played the guitar for six months.", "I've been playing guitar for six months.", "I've played guitar for six months."),
      it('B09', 'there-is', 'Tem um problema com o servidor.', 'There is a problem with the server.', "There's a problem with the server.", 'There is an issue with the server.', "There's an issue with the server."),
      it('B10', 'modal', 'Eu tenho que sair mais cedo hoje.', 'I have to leave early today.', 'I need to leave early today.', 'I have to leave earlier today.', "I've got to leave early today.", 'I need to leave earlier today.'),
      it('B11', 'preposicao-final', 'Do que você está falando?', 'What are you talking about?'),
      it('B12', 'conector', 'Embora eu estivesse cansado, terminei a tarefa.', 'Although I was tired, I finished the task.', 'Even though I was tired, I finished the task.', 'I finished the task although I was tired.', 'I finished the task even though I was tired.', 'Though I was tired, I finished the task.'),
    ],
    prompts: [
      { en: 'Describe a typical day in your life, from morning to night.', pt: 'Descreva um dia típico da sua vida, da manhã à noite.' },
      { en: 'Talk about a project you are proud of and why.', pt: 'Fale de um projeto do qual você se orgulha e por quê.' },
    ],
  },
  {
    id: 'C',
    items: [
      it('C01', 'sujeito-it', 'É difícil encontrar bons engenheiros.', "It's hard to find good engineers.", "It's difficult to find good engineers."),
      it('C02', 'terceira-pessoa', 'Minha esposa dirige para o trabalho.', 'My wife drives to work.'),
      it('C03', 'pergunta-do', 'Sua empresa oferece trabalho remoto?', 'Does your company offer remote work?'),
      it('C04', 'negativa', 'A gente não tem tempo suficiente.', "We don't have enough time."),
      it('C05', 'passado', 'Mês passado eu conheci o novo diretor.', 'Last month I met the new director.', 'I met the new director last month.'),
      it('C06', 'pergunta-did', 'Onde você estudou?', 'Where did you study?'),
      it('C07', 'futuro', 'Hoje à noite eu vou assistir a um filme.', "Tonight I'm going to watch a movie.", "I'm going to watch a movie tonight.", 'Tonight I will watch a movie.', 'I will watch a movie tonight.', "I'm watching a movie tonight.", "Tonight I'm going to watch a film.", "I'm going to watch a film tonight."),
      it('C08', 'perfect', 'Eu conheço ela desde 2019.', "I've known her since 2019."),
      it('C09', 'there-is', 'Tem muitas pessoas na fila.', 'There are many people in line.', 'There are a lot of people in line.', 'There are lots of people in line.', 'There are many people in the line.', 'There are a lot of people in the line.', 'There are many people in the queue.', 'There are a lot of people in the queue.'),
      it('C10', 'modal', 'Você poderia repetir a pergunta?', 'Could you repeat the question?', 'Can you repeat the question?', 'Could you repeat the question, please?', 'Could you please repeat the question?'),
      it('C11', 'preposicao-final', 'Para qual empresa você trabalha?', 'Which company do you work for?', 'What company do you work for?'),
      it('C12', 'conector', 'Eu não fui à reunião porque estava doente.', "I didn't go to the meeting because I was sick.", "I didn't go to the meeting because I was ill.", "I didn't attend the meeting because I was sick."),
    ],
    prompts: [
      { en: 'Describe your team and how you work together.', pt: 'Descreva seu time e como vocês trabalham juntos.' },
      { en: 'Talk about your plans for the next six months.', pt: 'Fale dos seus planos para os próximos seis meses.' },
    ],
  },
];
