/**
 * Formas extras do Checkpoint de fala (D, E, F). Paralelas às formas A, B e C
 * de forms.ts: mesmas 12 categorias na mesma ordem, tamanho parecido e
 * nenhuma frase repetida do curso (garantido em src/content/extra3.test.ts).
 */
import type { CheckCategory, CheckForm, CheckItem } from './forms';

const it = (id: string, cat: CheckCategory, pt: string, ...en: string[]): CheckItem => ({ id, cat, pt, en });

export const FORMS_EXTRA: CheckForm[] = [
  {
    id: 'D',
    items: [
      it('D01', 'sujeito-it', 'Está escuro lá fora e está ventando.', "It's dark outside and it's windy.", "It's dark out and it's windy.", "It's dark outside and windy.", "It's dark out there and it's windy."),
      it('D02', 'terceira-pessoa', 'Minha vizinha vende bolos pela internet.', 'My neighbor sells cakes online.', 'My neighbour sells cakes online.', 'My neighbor sells cakes on the internet.', 'My neighbour sells cakes on the internet.', 'My neighbor sells cakes over the internet.'),
      it('D03', 'pergunta-do', 'Seu prédio tem elevador?', 'Does your building have an elevator?', 'Does your building have a lift?', 'Does your building have elevators?'),
      it('D04', 'negativa', 'Eles não vendem ingressos online.', "They don't sell tickets online.", "They don't sell tickets on the internet."),
      it('D05', 'passado', 'Sábado passado eu pintei a cozinha.', 'Last Saturday I painted the kitchen.', 'I painted the kitchen last Saturday.'),
      it('D06', 'pergunta-did', 'Você trancou a porta hoje de manhã?', 'Did you lock the door this morning?', 'Did you lock the door in the morning?'),
      it('D07', 'futuro', 'No domingo a gente vai visitar meus avós.', "On Sunday we're going to visit my grandparents.", "We're going to visit my grandparents on Sunday.", 'On Sunday we will visit my grandparents.', 'We will visit my grandparents on Sunday.', "We're visiting my grandparents on Sunday.", "On Sunday we're visiting my grandparents."),
      it('D08', 'perfect', 'Faz dez anos que eu dirijo.', "I've been driving for ten years.", "I've driven for ten years."),
      it('D09', 'there-is', 'Tem uma farmácia perto da estação.', "There's a pharmacy near the station.", "There's a pharmacy close to the station.", "There's a drugstore near the station.", "There's a drugstore close to the station.", "There's a pharmacy by the station."),
      it('D10', 'modal', 'Você não deveria comer tão rápido.', "You shouldn't eat so fast.", "You shouldn't eat so quickly.", "You shouldn't eat that fast.", "You shouldn't eat that quickly."),
      it('D11', 'preposicao-final', 'Para quem você mandou a foto?', 'Who did you send the photo to?', 'Who did you send the picture to?', 'Whom did you send the photo to?', 'To whom did you send the photo?', 'Who did you send the photograph to?'),
      it('D12', 'conector', 'A gente cancelou o passeio porque estava chovendo.', 'We canceled the trip because it was raining.', 'We cancelled the trip because it was raining.', 'We canceled the tour because it was raining.', 'We cancelled the tour because it was raining.', 'We called off the trip because it was raining.', 'We canceled the outing because it was raining.', 'We cancelled the outing because it was raining.'),
    ],
    prompts: [
      { en: 'Describe the place where you live and what you like about it.', pt: 'Descreva o lugar onde você mora e o que você gosta nele.' },
      { en: 'Talk about a trip you took and something unexpected that happened.', pt: 'Fale de uma viagem que você fez e de algo inesperado que aconteceu.' },
    ],
  },
  {
    id: 'E',
    items: [
      it('E01', 'sujeito-it', 'É fácil se perder aqui.', "It's easy to get lost here.", "It's easy to get lost in here.", "It's easy to get lost around here."),
      it('E02', 'terceira-pessoa', 'Meu primo conserta computadores.', 'My cousin fixes computers.', 'My cousin repairs computers.'),
      it('E03', 'pergunta-do', 'Sua filha gosta de matemática?', 'Does your daughter like math?', 'Does your daughter like maths?', 'Does your daughter like mathematics?'),
      it('E04', 'negativa', 'Eu não como carne nos dias de semana.', "I don't eat meat on weekdays.", "I don't eat meat during the week.", "I don't eat meat on week days.", "I don't eat meat on the weekdays."),
      it('E05', 'passado', 'Ontem à noite eu dormi no sofá.', 'Last night I slept on the couch.', 'I slept on the couch last night.', 'Last night I slept on the sofa.', 'I slept on the sofa last night.'),
      it('E06', 'pergunta-did', 'Onde você estacionou o carro?', 'Where did you park the car?', 'Where did you park your car?'),
      it('E07', 'futuro', 'Depois do almoço eu vou ligar para o banco.', "After lunch I'm going to call the bank.", "I'm going to call the bank after lunch.", 'After lunch I will call the bank.', 'I will call the bank after lunch.', "I'm calling the bank after lunch.", "After lunch I'm calling the bank."),
      it('E08', 'perfect', 'Eu uso óculos desde os dez anos.', "I've worn glasses since I was ten.", "I've been wearing glasses since I was ten.", "I've worn glasses since I was ten years old.", "I've been wearing glasses since I was ten years old.", "I've worn glasses since the age of ten.", "I've been wearing glasses since the age of ten."),
      it('E09', 'there-is', 'Tem três padarias na minha rua.', 'There are three bakeries on my street.', 'There are three bakeries in my street.'),
      it('E10', 'modal', 'Posso abrir a janela?', 'Can I open the window?', 'May I open the window?', 'Could I open the window?'),
      it('E11', 'preposicao-final', 'Em que andar você mora?', 'Which floor do you live on?', 'What floor do you live on?', 'On which floor do you live?', 'On what floor do you live?'),
      it('E12', 'conector', 'Embora o hotel fosse caro, o quarto era pequeno.', 'Although the hotel was expensive, the room was small.', 'Even though the hotel was expensive, the room was small.', 'Though the hotel was expensive, the room was small.', 'The room was small although the hotel was expensive.', 'The room was small even though the hotel was expensive.'),
    ],
    prompts: [
      { en: 'Talk about something you learned recently and how you learned it.', pt: 'Fale de algo que você aprendeu recentemente e como aprendeu.' },
      { en: 'Describe your last weekend, from Saturday morning to Sunday night.', pt: 'Descreva seu último fim de semana, da manhã de sábado à noite de domingo.' },
    ],
  },
  {
    id: 'F',
    items: [
      it('F01', 'sujeito-it', 'Está nublado, mas não está frio.', "It's cloudy, but it's not cold.", "It's cloudy, but not cold.", "It's cloudy, but it's not cold out."),
      it('F02', 'terceira-pessoa', 'Minha sogra cozinha muito bem.', 'My mother-in-law cooks very well.', 'My mother-in-law cooks really well.', 'My mother in law cooks very well.', 'My mother in law cooks really well.'),
      it('F03', 'pergunta-do', 'Esse ônibus para no aeroporto?', 'Does this bus stop at the airport?', 'Does that bus stop at the airport?'),
      it('F04', 'negativa', 'Meu celular não funciona aqui.', "My phone doesn't work here.", "My cell phone doesn't work here.", "My cellphone doesn't work here.", "My mobile doesn't work here.", "My mobile phone doesn't work here."),
      it('F05', 'passado', 'Ano passado eu aprendi a nadar.', 'Last year I learned to swim.', 'I learned to swim last year.', 'Last year I learned how to swim.', 'I learned how to swim last year.', 'Last year I learnt to swim.', 'I learnt to swim last year.'),
      it('F06', 'pergunta-did', 'Por que você mudou de ideia?', 'Why did you change your mind?'),
      it('F07', 'futuro', 'Mais tarde eu vou regar as plantas.', "Later I'm going to water the plants.", "I'm going to water the plants later.", 'Later I will water the plants.', 'I will water the plants later.', "I'm watering the plants later."),
      it('F08', 'perfect', 'Eu tenho esse relógio desde o Natal.', "I've had this watch since Christmas.", "I've had that watch since Christmas."),
      it('F09', 'there-is', 'Tem um parque atrás da minha casa.', "There's a park behind my house.", "There's a park behind my home.", "There's a park at the back of my house."),
      it('F10', 'modal', 'Você precisa trazer seu passaporte.', 'You need to bring your passport.', 'You have to bring your passport.', 'You must bring your passport.', "You've got to bring your passport."),
      it('F11', 'preposicao-final', 'De onde vem esse barulho?', 'Where is that noise coming from?', 'Where is this noise coming from?', 'Where does that noise come from?', 'Where does this noise come from?', 'Where is the noise coming from?'),
      it('F12', 'conector', 'Eu estava com fome, então pedi uma pizza.', 'I was hungry, so I ordered a pizza.', 'I was hungry, so I ordered pizza.', 'I was hungry, so I asked for a pizza.', 'I was hungry, so I got a pizza.'),
    ],
    prompts: [
      { en: 'Talk about a person you admire, at work or in your family, and explain why.', pt: 'Fale de uma pessoa que você admira, no trabalho ou na família, e explique por quê.' },
      { en: 'Describe a decision you need to make soon and what your options are.', pt: 'Descreva uma decisão que você precisa tomar em breve e quais são as suas opções.' },
    ],
  },
];
