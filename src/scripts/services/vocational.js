(() => {
  'use strict';

  const questions = window.ToDentroVocationalQuestions;
  // Na ordem dos eixos do radar.
  const dimensions = [
    { name: 'Pessoas', profile: 'Conexão humana', interest: 'Cuidado e colaboração', icon: 'favorite' },
    { name: 'Ciência', profile: 'Olhar investigativo', interest: 'Pesquisa e natureza', icon: 'science' },
    { name: 'Criação', profile: 'Mente criativa', interest: 'Design e inovação', icon: 'palette' },
    { name: 'Análise', profile: 'Pensamento lógico', interest: 'Lógica e resolução de problemas', icon: 'analytics' },
    { name: 'Organização', profile: 'Liderança estratégica', interest: 'Gestão e planejamento', icon: 'event_note' },
    { name: 'Comunicação', profile: 'Voz e expressão', interest: 'Expressão e informação', icon: 'campaign' }
  ];
  const scoring = [
    [5, 1, 0], [4, 2, 3], [0, 5, 2], [3, 4, 1], [2, 0, 1], [5, 3, 4]
  ];
  const combined = {
    '0,1': 'Cuidar e descobrir',
    '0,2': 'Criar para transformar',
    '0,3': 'Soluções humanas',
    '0,4': 'Liderança humana',
    '0,5': 'Conectar e comunicar',
    '1,2': 'Inovação científica',
    '1,3': 'Mente investigativa',
    '1,4': 'Gestão científica',
    '1,5': 'Conhecimento que conecta',
    '2,3': 'Projetar soluções',
    '2,4': 'Empreendedor criativo',
    '2,5': 'Expressão criativa',
    '3,4': 'Estrategista lógico',
    '3,5': 'Comunicação estratégica',
    '4,5': 'Liderar e comunicar'
  };
  // Cada curso lista os eixos, áreas e ambientes com que se relaciona.
  // As áreas e os ambientes seguem a ordem das perguntas 31 e 32.
  const catalog = [
    ['Psicologia', [0], [0, 1], [0, 5]],
    ['Pedagogia', [0], [1], [0]],
    ['Serviço Social', [0], [1, 7], [0]],
    ['Ciências Biológicas', [1], [3], [1]],
    ['Farmácia', [1], [0, 3], [1, 5]],
    ['Medicina', [1, 0], [0], [5]],
    ['Enfermagem', [0, 1], [0], [5]],
    ['Design', [2], [4, 5], [3]],
    ['Artes Visuais', [2], [4, 5], [3, 0]],
    ['Arquitetura e Urbanismo', [2], [4, 2], [3, 2]],
    ['Ciência da Computação', [3], [2], [4]],
    ['Engenharia', [3], [2], [4, 2]],
    ['Estatística', [3], [2, 3], [2, 4]],
    ['Administração', [4], [6], [2]],
    ['Logística', [4], [6], [2]],
    ['Gestão Pública', [4], [6, 7], [2, 0]],
    ['Letras', [5], [1, 5], [0, 3]],
    ['Jornalismo', [5], [5], [3, 2]],
    ['Relações Públicas', [5], [5, 6], [2, 3]]
  ];

  const courseAliases = {
    Psicologia: ['psicólogo', 'psicóloga'],
    Pedagogia: ['professor', 'professora', 'pedagogo', 'pedagoga'],
    'Serviço Social': ['assistente social'],
    'Ciências Biológicas': ['biologia', 'biólogo', 'bióloga', 'astronomia'],
    Farmácia: ['farmacêutico', 'farmacêutica'],
    Medicina: ['médico', 'médica', 'cirurgião', 'cirurgiã'],
    Enfermagem: ['enfermeiro', 'enfermeira'],
    Design: ['designer', 'design gráfico'],
    'Artes Visuais': ['artista', 'ilustração', 'pintura'],
    'Arquitetura e Urbanismo': ['arquitetura', 'arquiteto', 'arquiteta'],
    'Ciência da Computação': ['computação', 'programação', 'programador', 'programadora', 'desenvolvedor', 'desenvolvedora', 'tecnologia'],
    Engenharia: ['engenheiro', 'engenheira'],
    Estatística: ['estatístico', 'estatística', 'análise de dados'],
    Administração: ['administrador', 'administradora', 'gestão de empresas'],
    Logística: ['logístico', 'logística profissional'],
    'Gestão Pública': ['políticas públicas', 'servidor público', 'servidora pública', 'direito', 'advogado', 'advogada'],
    Letras: ['idiomas', 'tradução', 'tradutor', 'tradutora', 'literatura'],
    Jornalismo: ['jornalista', 'reportagem'],
    'Relações Públicas': ['comunicação', 'assessoria de imprensa']
  };

  const multiple = index => index >= 30 && index <= 32;
  const isComplete = (index, answer) => {
    if (index === 34) return typeof answer === 'string' && answer.length <= 200;
    const validChoice = value => Number.isInteger(value) && value >= 0 && value < questions[index].options.length;
    return multiple(index)
      ? Array.isArray(answer) && answer.length >= 1 && answer.length <= 3
        && new Set(answer).size === answer.length && answer.every(validChoice)
      : validChoice(answer);
  };
  const draftKey = () => window.ToDentroAuth.storageKey('to-dentro-vocational-answers-v1');

  function readAnswers() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey()));
      return Array.isArray(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function courseUrl(base, { name }) {
    const url = new URL('buscar-universidades.html', base);
    url.searchParams.set('city', '');
    url.searchParams.set('type', '');
    if (name === 'Engenharia') url.searchParams.set('busca', name);
    else url.searchParams.set('course', normalize(name));
    return url.href;
  }

  function prioritizeSuggestions(map) {
    const axesWithPoints = map.highlights.length
      ? map.highlights : map.points.flatMap((score, axis) => score > 0 ? [axis] : []);
    const priorities = new Map(catalog.map(([name, axes]) => {
      const matches = axes.filter(axis => axesWithPoints.includes(axis));
      return [name, {
        affinity: matches.reduce((sum, axis) => sum + map.points[axis], 0),
        matches: matches.length
      }];
    }));
    const rank = course => priorities.get(course.name);
    const suggestions = map.suggestions
      .filter(course => course.axis !== null && priorities.has(course.name))
      .sort((a, b) => {
        const first = rank(a), second = rank(b);
        return second.affinity - first.affinity || second.matches - first.matches;
      });
    return { ...map, suggestions };
  }

  function calculate(answers) {
    if (!answers || !questions.every((_, index) => isComplete(index, answers[index]))) return null;
    const points = dimensions.map(() => 0);
    let valid = 0;
    answers.slice(0, 30).forEach((answer, index) => {
      if (answer === 3) return;
      points[scoring[index % scoring.length][answer]]++;
      valid++;
    });
    const ranked = points.map((_, index) => index).sort((a, b) => points[b] - points[a]);
    const [first, second, third] = ranked;
    let profile = 'Interesses em descoberta';
    let highlights = [];

    if (valid >= 15) {
      if (points[first] - points[second] >= 4) {
        highlights = [first];
        profile = dimensions[first].profile;
      } else if (points[second] > points[third]) {
        highlights = [first, second];
        profile = combined[[first, second].sort().join(',')];
      } else {
        highlights = ranked.filter(index => points[index] >= points[second]);
        profile = 'Interesses diversificados';
      }
    }

    const [areas, environments, values, stage, text] = answers.slice(30, 35);
    const overlap = (left, right) => left.filter(value => right.includes(value)).length;
    const words = value => normalize(value).replace(/[^a-z0-9]+/g, ' ').trim();
    const interestText = ` ${words(text)} `;
    const matchesInterest = term => interestText.includes(` ${words(term)} `);
    const mentioned = catalog.filter(([name]) => matchesInterest(name)
      || courseAliases[name]?.some(matchesInterest));
    const mentionedNames = new Set(mentioned.map(([name]) => name));
    const relatedAreas = new Set(mentioned.flatMap(([, , topics]) => topics));
    const relatedAxes = new Set(mentioned.flatMap(([, axes]) => axes));
    const primary = highlights.length ? highlights : ranked.filter(index => points[index] > 0);
    const suggestions = catalog.map(([name, axes, topics, workplaces]) => ({
      name,
      axis: primary.find(index => axes.includes(index)) ?? axes[0],
      matches: overlap(axes, highlights),
      preference: overlap(topics, areas) + overlap(workplaces, environments),
      related: topics.filter(topic => relatedAreas.has(topic)).length
        + axes.filter(axis => relatedAxes.has(axis)).length,
      sharesArea: topics.some(topic => relatedAreas.has(topic))
    })).filter(course => !mentionedNames.has(course.name)
      && (course.sharesArea || (highlights.length ? course.matches > 0 : course.preference > 0)))
      .sort((a, b) => (b.preference + b.related) - (a.preference + a.related))
      .map(({ name, axis }) => ({ name, axis }));

    const messages = [
      'Comece por uma área que desperte sua curiosidade.',
      'Use suas ideias como ponto de partida para explorar os cursos.',
      'Compare as disciplinas e as rotinas dos cursos que chamaram sua atenção.',
      'Explore sua preferência e conheça também caminhos próximos.'
    ];
    return prioritizeSuggestions({
      version: 1, profile, points, highlights, valid, suggestions,
      message: messages[stage] || 'Explore os cursos no seu ritmo.',
      values: values.filter(index => index < 8).map(index => questions[32].options[index])
    });
  }

  window.ToDentroVocational = { questions, multiple, isComplete, draftKey, readAnswers, calculate, dimensions, courseUrl, prioritizeSuggestions };
})();
