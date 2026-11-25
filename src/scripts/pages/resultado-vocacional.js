(async () => {
  'use strict';
  await window.ToDentroAuth.ready;
  if (window.ToDentroAuth.isRestrictedPage()) return;

  const { dimensions, readAnswers, calculate, courseUrl, prioritizeSuggestions } = window.ToDentroVocational;
  const select = selector => document.querySelector(selector);
  const status = select('#result-status');
  const button = select('#save-interest-map');
  const accountData = () => import('../../../services/user-saved-data.js');
  const draft = calculate(readAnswers());
  const savedResult = accountData()
    .then(service => service.getVocationalMap())
    .then(saved => ({ map: saved ? prioritizeSuggestions(saved) : null, failed: false }))
    .catch(() => ({ map: null, failed: true }));
  const map = draft || (await savedResult).map;
  if (!map) {
    if (!(await savedResult).failed) location.replace('./quiz-vocacional.html');
    else {
      select('.result-intro').textContent = 'Não foi possível carregar seu mapa. Recarregue a página para tentar novamente.';
      document.querySelectorAll('.result-profile, .interest-map, .result-strengths, .result-courses, .result-explore, .result-note, .result-save').forEach(element => { element.hidden = true; });
    }
    return;
  }

  select('#profile-title').textContent = map.profile;
  select('.result-profile .profile-description').textContent = map.highlights.length
    ? map.highlights.map(index => dimensions[index].name).join(' + ')
    : 'Continue explorando. Seus interesses podem ficar mais claros com o tempo.';
  select('.result-intro').textContent = map.message;

  const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
  const maxScore = Math.max(8, ...map.points);
  const points = map.points.map((score, index) => {
    const angle = index * Math.PI / 3;
    const radius = 95 * score / maxScore;
    return [175 + radius * Math.sin(angle), 160 - radius * Math.cos(angle)];
  });
  select('.radar-area').setAttribute('points', points.map(point => point.join(',')).join(' '));
  document.querySelectorAll('.radar-dots circle').forEach((dot, index) => {
    dot.setAttribute('cx', points[index][0]);
    dot.setAttribute('cy', points[index][1]);
    dot.classList.toggle('radar-highlight', map.highlights.includes(index));
    dot.setAttribute('r', map.highlights.includes(index) ? '5' : '4');
  });
  const scores = map.points.map(score => percent.format(score / 15));
  document.querySelectorAll('.radar-labels text').forEach((label, index) => {
    const value = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    value.setAttribute('x', label.getAttribute('x'));
    value.setAttribute('dy', '1.2em');
    value.textContent = scores[index];
    label.append(value);
  });
  select('#radar-description').textContent = `Escala de 0 a ${percent.format(maxScore / 15)}. ` +
    dimensions.map(({ name }, index) => `${name}: ${scores[index]}`).join('. ');
  select('.radar-card figcaption').textContent = `Anel externo: ${percent.format(maxScore / 15)}. ${map.valid} de 30 respostas pontuaram no mapa.`;

  const strengths = select('.result-strengths');
  const strength = select('#strength-template').content.firstElementChild;
  map.highlights.forEach((index, position) => {
    const card = strength.cloneNode(true);
    const dimension = dimensions[index];
    card.className = position % 2 ? 'strength-blue' : 'strength-green';
    card.querySelector('span').textContent = dimension.icon;
    card.querySelector('h3').textContent = dimension.profile;
    card.querySelector('p').textContent = dimension.interest;
    strengths.append(card);
  });
  strengths.hidden = !map.highlights.length;

  const grid = select('.result-course-grid');
  const courseCard = select('#course-template').content.firstElementChild;
  map.suggestions.forEach(({ name, axis }, position) => {
    const card = courseCard.cloneNode(true);
    const dimension = dimensions[axis];
    const icon = card.querySelector('.course-symbol');
    icon.textContent = dimension.icon;
    icon.classList.add(['symbol-blue', 'symbol-green', 'symbol-yellow'][position % 3]);
    card.querySelector('h3').textContent = name;
    card.querySelector('p').textContent = dimension.interest;
    const link = card.querySelector('a');
    link.href = courseUrl(location.href, { name });
    link.setAttribute('aria-label', `Conhecer curso de ${name}`);
    grid.append(card);
  });
  const courseIntro = select('.result-courses > p');
  const courseMessage = map.suggestions.length
    ? 'Possibilidades para conhecer, sem limitar sua escolha.'
    : 'Comece pela lista de todos os cursos para descobrir o que chama sua atenção.';
  courseIntro.textContent = map.values.length
    ? `${courseMessage} Ao pesquisar, descubra como a profissão se relaciona com o que você valoriza: ${map.values.join(', ')}.`
    : courseMessage;

  function showSaved() {
    button.textContent = 'Mapa de interesses salvo';
    status.textContent = 'Seu mapa de interesses está salvo na sua conta.';
    status.hidden = false;
  }
  function comparable(result) {
    const { profile, points, highlights, valid, suggestions, message, values } = result;
    return JSON.stringify([profile, points, highlights, valid, suggestions.map(({name, axis}) => [name, axis]), message, values]);
  }
  savedResult.then(({ map: saved }) => {
    if (saved && comparable(saved) === comparable(map)) showSaved();
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await (await accountData()).saveVocationalMap(map);
      showSaved();
    } catch {
      status.textContent = 'Não foi possível salvar o mapa na sua conta. Tente novamente.';
      status.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
})();
