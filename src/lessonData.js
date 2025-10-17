export const tracks = [
  {
    id: 'music',
    title: 'Musikens byggstenar',
    emoji: '🎶',
    xp: 45,
    description:
      'Träna intervallkänsla, rytmer och tonarter med korta lyssningsövningar.',
    microLessons: [
      {
        type: 'multipleChoice',
        prompt: 'Vilket intervall hör du mellan tonerna C och G?',
        media: 'https://tonejs.github.io/audio/berklee/guitar/F3.mp3',
        options: [
          { label: 'Kvint', correct: true, explanation: 'C till G är en ren kvint.' },
          { label: 'Ters', correct: false },
          { label: 'Septima', correct: false },
          { label: 'Sekund', correct: false },
        ],
        success: 'Rätt! Din intervallkänsla blir starkare varje gång du tränar.',
      },
      {
        type: 'ordering',
        prompt: 'Ordna notvärdena från kortast till längst.',
        options: ['Åttondel', 'Fjärdedel', 'Halvnot', 'Helnot'],
        answer: ['Åttondel', 'Fjärdedel', 'Halvnot', 'Helnot'],
        success: 'Härligt! Rytmiken sitter.',
      },
      {
        type: 'multipleChoice',
        prompt: 'Vilken skala innehåller både F# och C#?',
        options: [
          { label: 'G-dur', correct: true, explanation: 'G-dur har ett korsförtecken för F och C.' },
          { label: 'F-dur', correct: false },
          { label: 'C-dur', correct: false },
        ],
        success: 'Du börjar bli vass på tonarter!',
      },
    ],
  },
  {
    id: 'math',
    title: 'Matematikmästaren',
    emoji: '🧠',
    xp: 60,
    description:
      'Utforska algebra, sannolikhet och logik genom spelifierade mikroproblem.',
    microLessons: [
      {
        type: 'multipleChoice',
        prompt: 'Förenkla uttrycket: 3(2x - 4) + 5x',
        options: [
          { label: '11x - 12', correct: true, explanation: '3(2x-4) = 6x - 12. +5x = 11x - 12.' },
          { label: '6x - 12', correct: false },
          { label: '11x - 4', correct: false },
        ],
        success: 'Du spikar algebra med precision! 👏',
      },
      {
        type: 'flashcard',
        prompt: 'Derivatan av sin(x)',
        answer: 'cos(x)',
        explanation: 'sin(x) blir cos(x) vid derivata. Testa att säga det högt för minnet!',
      },
      {
        type: 'multipleChoice',
        prompt: 'Sannolikheten att slå en sexa med en tärning är ...',
        options: [
          { label: '1/6', correct: true },
          { label: '1/5', correct: false },
          { label: '1/3', correct: false },
        ],
        success: 'Snyggt! Du tänker sannolikhet som ett proffs.',
      },
    ],
  },
  {
    id: 'language',
    title: 'Språkresan',
    emoji: '🗣️',
    xp: 55,
    description:
      'Lär dig nya språk med fraser, grammatik och uttal – ett steg i taget.',
    microLessons: [
      {
        type: 'translate',
        prompt: 'Översätt frasen "Jag vill ha kaffe" till spanska.',
        answer: 'Quiero café',
        explanation:
          'Du kan också säga "Quisiera un café" i artigare situationer.',
      },
      {
        type: 'multipleChoice',
        prompt: 'Vilket ord i meningen "Les filles sont intelligentes" är i plural?',
        options: [
          { label: 'Les', correct: false },
          { label: 'filles', correct: true, explanation: 'Filles betyder flickor och slutar på -es i plural.' },
          { label: 'intelligentes', correct: true, explanation: 'Adjektivet böjs med -es i plural feminin.' },
        ],
        multiAnswer: true,
        success: 'Oui! Du känner igen pluraländelser på franska.',
      },
      {
        type: 'flashcard',
        prompt: 'Vad betyder tyska ordet "Gemütlichkeit"?',
        answer: 'En känsla av mysig trivsel och samhörighet.',
      },
    ],
  },
];
