import type { Course } from '../../domain/curriculum/types';

/**
 * Inglês para falantes de PT-BR — A1 → A2.
 * Seleção de vocabulário: alta frequência + chunks úteis (Nation; Lewis).
 * Cada lição tem um objetivo "can-do" no estilo CEFR.
 * Unidades 5–12 estão planejadas em docs/PLANO-DE-AULAS.md.
 */
export const englishCourse: Course = {
  id: 'en',
  language: 'Inglês',
  speechLang: 'en-US',
  units: [
    {
      id: 'u1',
      title: 'Primeiros passos',
      cefr: 'A1',
      color: '#E8553D',
      lessons: [
        {
          id: 'u1-l1',
          title: 'Olá! Quem é você?',
          canDo: 'Consigo cumprimentar e dizer meu nome.',
          introAudio: 'audio/lessons/u1-l1-intro.mp3',
          introScript:
            'Oi! Bem-vindo à sua primeira aula de inglês. Hoje você vai aprender a se apresentar. Escute: "Hi! I\'m Ana. Nice to meet you." Repita comigo: "Hi! Nice to meet you." Dica: em "nice", o som é "náis", e não "níci".',
          items: [
            { id: 'hi', en: 'hi', pt: 'oi', ipa: '/haɪ/', icon: 'wave', kind: 'word', tip: 'Soa como "rái", com o H aspirado leve.' },
            { id: 'hello', en: 'hello', pt: 'olá', ipa: '/həˈloʊ/', icon: 'wave', kind: 'word' },
            { id: 'im', en: "I'm", pt: 'eu sou / eu estou', ipa: '/aɪm/', icon: 'person', kind: 'chunk' },
            { id: 'my-name-is', en: 'my name is', pt: 'meu nome é', ipa: '/maɪ neɪm ɪz/', icon: 'person', kind: 'chunk' },
            { id: 'nice-to-meet-you', en: 'nice to meet you', pt: 'prazer em conhecer você', ipa: '/naɪs tə miːt juː/', icon: 'handshake', kind: 'chunk', tip: '"Nice" termina em S — não diga "náici".' },
            { id: 'goodbye', en: 'goodbye', pt: 'tchau', ipa: '/ɡʊdˈbaɪ/', icon: 'wave', kind: 'word' },
          ],
          sentences: [
            { id: 's1', en: "Hi, I'm Ana.", pt: 'Oi, eu sou a Ana.', alt: ['Hi, I am Ana.'], gap: "I'm" },
            { id: 's2', en: 'My name is Leo.', pt: 'Meu nome é Leo.', gap: 'name' },
            { id: 's3', en: 'Nice to meet you.', pt: 'Prazer em conhecer você.', gap: 'meet' },
            { id: 's4', en: 'Hello, goodbye!', pt: 'Olá, tchau!' },
          ],
        },
        {
          id: 'u1-l2',
          title: 'De onde você é?',
          canDo: 'Consigo dizer de onde sou e perguntar a origem de alguém.',
          introScript:
            'Nesta aula você vai perguntar e responder de onde as pessoas são. "Where are you from?" "I\'m from Brazil." Repare: em inglês, países começam com letra maiúscula.',
          items: [
            { id: 'where', en: 'where', pt: 'onde', ipa: '/wɛr/', icon: 'question', kind: 'word', tip: 'O W soa como "u" rápido: "uér".' },
            { id: 'from', en: 'from', pt: 'de (origem)', ipa: '/frʌm/', icon: 'globe', kind: 'word' },
            { id: 'brazil', en: 'Brazil', pt: 'Brasil', ipa: '/brəˈzɪl/', icon: 'globe', kind: 'word', tip: 'A sílaba forte é a segunda: bra-ZIL.' },
            { id: 'where-are-you-from', en: 'where are you from', pt: 'de onde você é', ipa: '/wɛr ɑr juː frʌm/', icon: 'question', kind: 'chunk' },
            { id: 'and-you', en: 'and you', pt: 'e você', ipa: '/ænd juː/', icon: 'person', kind: 'chunk' },
            { id: 'country', en: 'country', pt: 'país', ipa: '/ˈkʌntri/', icon: 'globe', kind: 'word' },
          ],
          sentences: [
            { id: 's1', en: 'Where are you from?', pt: 'De onde você é?', gap: 'from' },
            { id: 's2', en: "I'm from Brazil.", pt: 'Eu sou do Brasil.', alt: ['I am from Brazil.'], gap: 'from' },
            { id: 's3', en: "I'm from Brazil, and you?", pt: 'Eu sou do Brasil, e você?', alt: ['I am from Brazil, and you?'] },
            { id: 's4', en: 'Brazil is a big country.', pt: 'O Brasil é um país grande.', gap: 'country' },
          ],
        },
        {
          id: 'u1-l3',
          title: 'O som do TH',
          canDo: 'Consigo pronunciar "thanks", "three" e "think" de forma inteligível.',
          introScript:
            'O som do T H não existe em português. Coloque a ponta da língua entre os dentes e sopre o ar. Não é "t", nem "f", nem "s". Escute: "think", "three", "thanks".',
          items: [
            { id: 'thanks', en: 'thanks', pt: 'obrigado(a)', ipa: '/θæŋks/', icon: 'heart', kind: 'word', tip: 'Língua entre os dentes e sopre: θ. Não é "tenks".' },
            { id: 'thank-you', en: 'thank you', pt: 'obrigado(a)', ipa: '/θæŋk juː/', icon: 'heart', kind: 'chunk' },
            { id: 'three', en: 'three', pt: 'três', ipa: '/θriː/', icon: 'three', kind: 'word', tip: 'Não confunda com "tree" (árvore).' },
            { id: 'think', en: 'think', pt: 'pensar', ipa: '/θɪŋk/', icon: 'think', kind: 'word', tip: 'Não confunda com "sink" (pia).' },
            { id: 'i-think-so', en: 'I think so', pt: 'acho que sim', ipa: '/aɪ θɪŋk soʊ/', icon: 'think', kind: 'chunk' },
          ],
          sentences: [
            { id: 's1', en: 'Thank you very much.', pt: 'Muito obrigado.', gap: 'Thank' },
            { id: 's2', en: 'I think so.', pt: 'Acho que sim.', gap: 'think' },
            { id: 's3', en: 'I have three books.', pt: 'Eu tenho três livros.', gap: 'three' },
          ],
          sound: {
            title: 'TH /θ/ — língua entre os dentes',
            howTo:
              'Ponha a ponta da língua levemente entre os dentes da frente e sopre o ar sem vibrar a garganta. Brasileiros costumam trocar por T ("tenks"), F ("fink") ou S ("sink").',
            mouth: 'th',
            pairs: [
              { a: 'three', b: 'tree', ipaA: '/θriː/', ipaB: '/triː/', contrast: '/θ/ vs /t/' },
              { a: 'think', b: 'sink', ipaA: '/θɪŋk/', ipaB: '/sɪŋk/', contrast: '/θ/ vs /s/' },
              { a: 'thank', b: 'tank', ipaA: '/θæŋk/', ipaB: '/tæŋk/', contrast: '/θ/ vs /t/' },
              { a: 'thin', b: 'fin', ipaA: '/θɪn/', ipaB: '/fɪn/', contrast: '/θ/ vs /f/' },
            ],
          },
        },
      ],
    },
    {
      id: 'u2',
      title: 'No café',
      cefr: 'A1',
      color: '#2F8F83',
      lessons: [
        {
          id: 'u2-l1',
          title: 'Comida e bebida',
          canDo: 'Consigo nomear comidas e bebidas básicas.',
          introScript: 'Vamos aprender palavras de comida e bebida que você usa todo dia: coffee, water, bread, apple.',
          items: [
            { id: 'coffee', en: 'coffee', pt: 'café', ipa: '/ˈkɔːfi/', icon: 'coffee', kind: 'word', tip: 'A sílaba forte é a primeira: CO-ffee.' },
            { id: 'water', en: 'water', pt: 'água', ipa: '/ˈwɔːtər/', icon: 'water', kind: 'word', tip: 'No inglês americano o T vira um "r" rápido: "uó-rer".' },
            { id: 'bread', en: 'bread', pt: 'pão', ipa: '/brɛd/', icon: 'bread', kind: 'word', tip: 'Termine no D sem acrescentar "i": não é "bredi".' },
            { id: 'apple', en: 'apple', pt: 'maçã', ipa: '/ˈæpəl/', icon: 'apple', kind: 'word' },
            { id: 'a-cup-of', en: 'a cup of', pt: 'uma xícara de', ipa: '/ə kʌp əv/', icon: 'coffee', kind: 'chunk' },
            { id: 'a-glass-of', en: 'a glass of', pt: 'um copo de', ipa: '/ə ɡlæs əv/', icon: 'water', kind: 'chunk' },
          ],
          sentences: [
            { id: 's1', en: 'A cup of coffee.', pt: 'Uma xícara de café.', gap: 'cup' },
            { id: 's2', en: 'A glass of water.', pt: 'Um copo de água.', gap: 'glass' },
            { id: 's3', en: 'I like bread.', pt: 'Eu gosto de pão.', gap: 'like' },
            { id: 's4', en: 'The apple is red.', pt: 'A maçã é vermelha.', gap: 'apple' },
          ],
        },
        {
          id: 'u2-l2',
          title: 'Fazendo o pedido',
          canDo: 'Consigo pedir algo educadamente e perguntar o preço.',
          introScript: 'Hoje você vai fazer um pedido num café. Use "Can I have...?" ou "I\'d like...". E para perguntar o preço: "How much is it?"',
          items: [
            { id: 'can-i-have', en: 'can I have', pt: 'posso pegar / me vê', ipa: '/kən aɪ hæv/', icon: 'coffee', kind: 'chunk' },
            { id: 'id-like', en: "I'd like", pt: 'eu gostaria', ipa: '/aɪd laɪk/', icon: 'heart', kind: 'chunk' },
            { id: 'please', en: 'please', pt: 'por favor', ipa: '/pliːz/', icon: 'heart', kind: 'word', tip: 'O final soa como Z: "plíz".' },
            { id: 'how-much', en: 'how much is it', pt: 'quanto custa', ipa: '/haʊ mʌtʃ ɪz ɪt/', icon: 'money', kind: 'chunk' },
            { id: 'here-you-are', en: 'here you are', pt: 'aqui está', ipa: '/hɪr juː ɑr/', icon: 'check', kind: 'chunk' },
          ],
          sentences: [
            { id: 's1', en: 'Can I have a coffee, please?', pt: 'Me vê um café, por favor?', gap: 'have' },
            { id: 's2', en: "I'd like a glass of water.", pt: 'Eu gostaria de um copo de água.', alt: ['I would like a glass of water.'], gap: 'like' },
            { id: 's3', en: 'How much is it?', pt: 'Quanto custa?', gap: 'much' },
            { id: 's4', en: 'Here you are.', pt: 'Aqui está.', gap: 'Here' },
          ],
        },
        {
          id: 'u2-l3',
          title: 'Ship ou sheep?',
          canDo: 'Consigo distinguir e produzir /ɪ/ curto e /iː/ longo.',
          introScript: 'Em português não diferenciamos "i" curto e "i" longo. Em inglês isso muda o sentido: ship é navio, sheep é ovelha. Escute a diferença.',
          items: [
            { id: 'ship', en: 'ship', pt: 'navio', ipa: '/ʃɪp/', icon: 'ship', kind: 'word', tip: 'I curto e relaxado, quase um "ê" fechado.' },
            { id: 'sheep', en: 'sheep', pt: 'ovelha', ipa: '/ʃiːp/', icon: 'sheep', kind: 'word', tip: 'I longo e sorrindo: "xiiip".' },
            { id: 'it', en: 'it', pt: 'isso / ele (coisa)', ipa: '/ɪt/', icon: 'it', kind: 'word' },
            { id: 'eat', en: 'eat', pt: 'comer', ipa: '/iːt/', icon: 'eat', kind: 'word' },
            { id: 'live', en: 'live', pt: 'morar / viver', ipa: '/lɪv/', icon: 'house', kind: 'word' },
          ],
          sentences: [
            { id: 's1', en: 'I eat bread.', pt: 'Eu como pão.', gap: 'eat' },
            { id: 's2', en: 'I live in Brazil.', pt: 'Eu moro no Brasil.', gap: 'live' },
            { id: 's3', en: 'The sheep is on the ship.', pt: 'A ovelha está no navio.', gap: 'ship' },
          ],
          sound: {
            title: '/ɪ/ curto vs /iː/ longo',
            howTo:
              '/iː/ é longo e com os lábios esticados, como um sorriso. /ɪ/ é curto, relaxado, com a boca um pouco mais aberta — fica entre o "i" e o "ê" do português.',
            mouth: 'short-i',
            pairs: [
              { a: 'ship', b: 'sheep', ipaA: '/ʃɪp/', ipaB: '/ʃiːp/', contrast: '/ɪ/ vs /iː/' },
              { a: 'it', b: 'eat', ipaA: '/ɪt/', ipaB: '/iːt/', contrast: '/ɪ/ vs /iː/' },
              { a: 'live', b: 'leave', ipaA: '/lɪv/', ipaB: '/liːv/', contrast: '/ɪ/ vs /iː/' },
              { a: 'sit', b: 'seat', ipaA: '/sɪt/', ipaB: '/siːt/', contrast: '/ɪ/ vs /iː/' },
            ],
          },
        },
      ],
    },
    {
      id: 'u3',
      title: 'Meu dia',
      cefr: 'A1',
      color: '#3D5A99',
      lessons: [
        {
          id: 'u3-l1',
          title: 'Rotina',
          canDo: 'Consigo descrever minha rotina com o presente simples.',
          introScript: 'Vamos falar da sua rotina. Em inglês, usamos o presente simples: "I wake up at seven. I go to work."',
          items: [
            { id: 'wake-up', en: 'wake up', pt: 'acordar', ipa: '/weɪk ʌp/', icon: 'sun', kind: 'chunk' },
            { id: 'have-breakfast', en: 'have breakfast', pt: 'tomar café da manhã', ipa: '/hæv ˈbrɛkfəst/', icon: 'coffee', kind: 'chunk' },
            { id: 'go-to-work', en: 'go to work', pt: 'ir trabalhar', ipa: '/ɡoʊ tə wɜrk/', icon: 'work', kind: 'chunk' },
            { id: 'go-to-bed', en: 'go to bed', pt: 'ir dormir', ipa: '/ɡoʊ tə bɛd/', icon: 'moon', kind: 'chunk' },
            { id: 'every-day', en: 'every day', pt: 'todo dia', ipa: '/ˈɛvri deɪ/', icon: 'sun', kind: 'chunk' },
          ],
          sentences: [
            { id: 's1', en: 'I wake up at seven.', pt: 'Eu acordo às sete.', gap: 'wake' },
            { id: 's2', en: 'I have breakfast every day.', pt: 'Eu tomo café da manhã todo dia.', gap: 'breakfast' },
            { id: 's3', en: 'I go to work by bus.', pt: 'Eu vou trabalhar de ônibus.', gap: 'work' },
            { id: 's4', en: 'I go to bed at eleven.', pt: 'Eu vou dormir às onze.', gap: 'bed' },
          ],
        },
        {
          id: 'u3-l2',
          title: 'Que horas são?',
          canDo: 'Consigo perguntar e dizer as horas.',
          introScript: 'Para perguntar as horas: "What time is it?" Para responder: "It\'s seven o\'clock" ou "It\'s half past seven".',
          items: [
            { id: 'what-time', en: 'what time is it', pt: 'que horas são', ipa: '/wʌt taɪm ɪz ɪt/', icon: 'clock', kind: 'chunk' },
            { id: 'oclock', en: "o'clock", pt: 'em ponto', ipa: '/əˈklɑk/', icon: 'clock', kind: 'word' },
            { id: 'half-past', en: 'half past', pt: 'e meia', ipa: '/hæf pæst/', icon: 'clock', kind: 'chunk' },
            { id: 'morning', en: 'morning', pt: 'manhã', ipa: '/ˈmɔrnɪŋ/', icon: 'sun', kind: 'word' },
            { id: 'night', en: 'night', pt: 'noite', ipa: '/naɪt/', icon: 'moon', kind: 'word', tip: 'Termine no T sem "i": não é "náiti".' },
          ],
          sentences: [
            { id: 's1', en: 'What time is it?', pt: 'Que horas são?', gap: 'time' },
            { id: 's2', en: "It's seven o'clock.", pt: 'São sete em ponto.', alt: ["It is seven o'clock."], gap: "o'clock" },
            { id: 's3', en: "It's half past eight.", pt: 'São oito e meia.', alt: ['It is half past eight.'], gap: 'half' },
            { id: 's4', en: 'Good morning!', pt: 'Bom dia!', gap: 'morning' },
          ],
        },
        {
          id: 'u3-l3',
          title: 'Bad ou bed?',
          canDo: 'Consigo distinguir /æ/ de /ɛ/.',
          introScript: 'O som /æ/ de "bad" é mais aberto que o "é" do português. Abra bem a boca, como se fosse dizer "a" e "é" ao mesmo tempo.',
          items: [
            { id: 'bad', en: 'bad', pt: 'ruim', ipa: '/bæd/', icon: 'bad', kind: 'word', tip: 'Boca bem aberta, entre "a" e "é".' },
            { id: 'bed', en: 'bed', pt: 'cama', ipa: '/bɛd/', icon: 'bed', kind: 'word' },
            { id: 'hat', en: 'hat', pt: 'chapéu', ipa: '/hæt/', icon: 'hat', kind: 'word' },
            { id: 'cat', en: 'cat', pt: 'gato', ipa: '/kæt/', icon: 'cat', kind: 'word' },
          ],
          sentences: [
            { id: 's1', en: 'The cat is on the bed.', pt: 'O gato está na cama.', gap: 'bed' },
            { id: 's2', en: 'It is a bad day.', pt: 'É um dia ruim.', gap: 'bad' },
            { id: 's3', en: 'I like your hat.', pt: 'Eu gosto do seu chapéu.', gap: 'hat' },
          ],
          sound: {
            title: '/æ/ aberto vs /ɛ/',
            howTo: '/æ/ (bad, cat) exige a mandíbula bem aberta e a língua baixa. /ɛ/ (bed) é como o "é" do português. Exagere no começo!',
            mouth: 'ae',
            pairs: [
              { a: 'bad', b: 'bed', ipaA: '/bæd/', ipaB: '/bɛd/', contrast: '/æ/ vs /ɛ/' },
              { a: 'man', b: 'men', ipaA: '/mæn/', ipaB: '/mɛn/', contrast: '/æ/ vs /ɛ/' },
              { a: 'sad', b: 'said', ipaA: '/sæd/', ipaB: '/sɛd/', contrast: '/æ/ vs /ɛ/' },
              { a: 'pan', b: 'pen', ipaA: '/pæn/', ipaB: '/pɛn/', contrast: '/æ/ vs /ɛ/' },
            ],
          },
        },
      ],
    },
    {
      id: 'u4',
      title: 'Família e pessoas',
      cefr: 'A1',
      color: '#B7791F',
      lessons: [
        {
          id: 'u4-l1',
          title: 'Minha família',
          canDo: 'Consigo apresentar membros da minha família.',
          introScript: 'Vamos apresentar a família: mother, father, brother, sister. "This is my mother."',
          items: [
            { id: 'mother', en: 'mother', pt: 'mãe', ipa: '/ˈmʌðər/', icon: 'family', kind: 'word', tip: 'TH sonoro /ð/: língua entre os dentes vibrando.' },
            { id: 'father', en: 'father', pt: 'pai', ipa: '/ˈfɑðər/', icon: 'family', kind: 'word' },
            { id: 'brother', en: 'brother', pt: 'irmão', ipa: '/ˈbrʌðər/', icon: 'family', kind: 'word' },
            { id: 'sister', en: 'sister', pt: 'irmã', ipa: '/ˈsɪstər/', icon: 'family', kind: 'word' },
            { id: 'this-is-my', en: 'this is my', pt: 'este(a) é meu/minha', ipa: '/ðɪs ɪz maɪ/', icon: 'person', kind: 'chunk' },
          ],
          sentences: [
            { id: 's1', en: 'This is my mother.', pt: 'Esta é minha mãe.', gap: 'mother' },
            { id: 's2', en: 'I have one brother.', pt: 'Eu tenho um irmão.', gap: 'brother' },
            { id: 's3', en: 'My sister lives in Brazil.', pt: 'Minha irmã mora no Brasil.', gap: 'lives' },
            { id: 's4', en: 'My father works every day.', pt: 'Meu pai trabalha todo dia.', gap: 'works' },
          ],
        },
        {
          id: 'u4-l2',
          title: 'Ele, ela e o -S',
          canDo: 'Consigo falar de outra pessoa no presente (he/she + -s).',
          introScript: 'Atenção: no presente, com he, she e it, o verbo ganha S. "I work" vira "she works". É o erro mais comum de brasileiros!',
          items: [
            { id: 'he', en: 'he', pt: 'ele', ipa: '/hiː/', icon: 'person', kind: 'word' },
            { id: 'she', en: 'she', pt: 'ela', ipa: '/ʃiː/', icon: 'person', kind: 'word' },
            { id: 'works', en: 'works', pt: 'trabalha', ipa: '/wɜrks/', icon: 'work', kind: 'word' },
            { id: 'has', en: 'has', pt: 'tem', ipa: '/hæz/', icon: 'check', kind: 'word' },
            { id: 'likes', en: 'likes', pt: 'gosta', ipa: '/laɪks/', icon: 'heart', kind: 'word' },
          ],
          sentences: [
            { id: 's1', en: 'She works in a hospital.', pt: 'Ela trabalha num hospital.', gap: 'works' },
            { id: 's2', en: 'He has a dog.', pt: 'Ele tem um cachorro.', gap: 'has' },
            { id: 's3', en: 'She likes coffee.', pt: 'Ela gosta de café.', gap: 'likes' },
            { id: 's4', en: 'He lives in London.', pt: 'Ele mora em Londres.', gap: 'lives' },
          ],
        },
        {
          id: 'u4-l3',
          title: 'Sem "i" no final',
          canDo: 'Consigo terminar palavras em consoante sem acrescentar "i".',
          introScript: 'Brasileiros costumam colocar um "i" no final das palavras: "Facebooki", "bigui". Em inglês, a palavra termina seca na consoante. Escute: book, big, dog.',
          items: [
            { id: 'book', en: 'book', pt: 'livro', ipa: '/bʊk/', icon: 'book', kind: 'word', tip: 'Termine no K, seco. Não é "búqui".' },
            { id: 'big', en: 'big', pt: 'grande', ipa: '/bɪɡ/', icon: 'house', kind: 'word', tip: 'Não é "bigui".' },
            { id: 'dog', en: 'dog', pt: 'cachorro', ipa: '/dɔɡ/', icon: 'dog', kind: 'word' },
            { id: 'phone', en: 'phone', pt: 'telefone', ipa: '/foʊn/', icon: 'phone', kind: 'word', tip: 'Uma sílaba só: "fôun".' },
            { id: 'bus', en: 'bus', pt: 'ônibus', ipa: '/bʌs/', icon: 'bus', kind: 'word' },
          ],
          sentences: [
            { id: 's1', en: 'I have a big dog.', pt: 'Eu tenho um cachorro grande.', gap: 'dog' },
            { id: 's2', en: 'This is a good book.', pt: 'Este é um bom livro.', gap: 'book' },
            { id: 's3', en: 'Where is my phone?', pt: 'Cadê meu telefone?', gap: 'phone' },
          ],
          sound: {
            title: 'Consoante final sem "i"',
            howTo: 'Feche a palavra na consoante e pare. Imagine que a palavra acaba ali — sem soltar um "i" de apoio. Treine devagar: "big… dog… book".',
            mouth: 'ed',
            pairs: [
              { a: 'big', b: 'bigger', ipaA: '/bɪɡ/', ipaB: '/ˈbɪɡər/', contrast: 'final seco vs sílaba extra' },
              { a: 'work', b: 'worked', ipaA: '/wɜrk/', ipaB: '/wɜrkt/', contrast: '-ed = /t/, sem "i"' },
              { a: 'play', b: 'played', ipaA: '/pleɪ/', ipaB: '/pleɪd/', contrast: '-ed = /d/' },
              { a: 'want', b: 'wanted', ipaA: '/wɑnt/', ipaB: '/ˈwɑntɪd/', contrast: '-ed = /ɪd/ só após t/d' },
            ],
          },
        },
      ],
    },
  ],
};

export const allLessons = englishCourse.units.flatMap((u) => u.lessons);
export const allItems = allLessons.flatMap((l) => l.items);
export const findItem = (id: string) => allItems.find((i) => i.id === id);
export const findLesson = (id: string) => allLessons.find((l) => l.id === id);
